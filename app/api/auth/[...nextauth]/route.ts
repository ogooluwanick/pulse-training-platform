import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise()),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'jsmith@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        const client: MongoClient = await clientPromise();
        const db = client.db();
        const usersCollection = db.collection('users');
        const companiesCollection = db.collection('companies');
        const dbUser = await usersCollection.findOne({
          email: credentials.email,
        });

        if (!dbUser) {
          throw new Error('No user found with this email');
        }

        // Check if email is verified
        if (!dbUser.emailVerified) {
          // Email is not verified, resend verification email
          const newVerificationToken = crypto.randomBytes(32).toString('hex');
          const newVerificationTokenExpires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
          );

          await usersCollection.updateOne(
            { _id: new ObjectId(dbUser._id) },
            {
              $set: {
                verificationToken: newVerificationToken,
                verificationTokenExpires: newVerificationTokenExpires,
              },
            }
          );

          try {
            await sendVerificationEmail(
              dbUser.email,
              `${dbUser.firstName} ${dbUser.lastName}`,
              newVerificationToken,
              false // Use regular email verification flow
            );
            throw new Error(
              "Your email is not verified. We've sent a new verification link to your email address. Please check your inbox."
            );
          } catch (emailError: any) {
            console.error('Error resending verification email:', emailError);
            throw new Error(
              'Your email is not verified. Please check your inbox or try registering again if issues persist.'
            );
          }
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          dbUser.password as string
        );

        if (!isValidPassword) {
          throw new Error('Incorrect password');
        }

        // Update lastOnline on successful login
        await usersCollection.updateOne(
          { _id: new ObjectId(dbUser._id) },
          { $set: { lastOnline: new Date() } }
        );

        // Get session timeout from user settings
        const sessionTimeoutInHours =
          dbUser.settings?.session?.sessionTimeout || 4;

        let companyName = dbUser.companyName;
        if (!companyName && dbUser.companyId) {
          const company = await companiesCollection.findOne({
            _id: new ObjectId(dbUser.companyId),
          });
          if (company) {
            companyName = company.name;
            // Update user document with company name
            await usersCollection.updateOne(
              { _id: new ObjectId(dbUser._id) },
              { $set: { companyName: company.name } }
            );
          }
        }

        // Return user object without password
        return {
          id: dbUser._id.toString(),
          name:
            `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() ||
            'User',
          email: dbUser.email,
          role: dbUser.role,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
          companyName: companyName,
          companyId: dbUser.companyId ? dbUser.companyId.toString() : null,
          sessionTimeoutInHours: sessionTimeoutInHours,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // Update lastOnline on every JWT refresh (user activity)
      if (token.id) {
        try {
          const client: MongoClient = await clientPromise();
          const usersCollection = client.db().collection('users');
          await usersCollection.updateOne(
            { _id: new ObjectId(token.id as string) },
            { $set: { lastOnline: new Date() } }
          );
        } catch (error) {
          console.error('Failed to update lastOnline:', error);
        }
      }

      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.profileImageUrl = user.profileImageUrl;
        token.companyName = user.companyName;
        token.companyId = user.companyId;

        // Set JWT expiration based on user's sessionTimeout setting
        const sessionTimeoutInSeconds =
          (user as any).sessionTimeoutInHours * 3600 || 4 * 3600;
        token.exp = Math.floor(Date.now() / 1000) + sessionTimeoutInSeconds;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as 'ADMIN' | 'COMPANY' | 'EMPLOYEE';
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.profileImageUrl = token.profileImageUrl as string;
        session.user.companyName = token.companyName as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
