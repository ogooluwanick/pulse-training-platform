import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb'; // Added ObjectId
import crypto from 'crypto'; // For token generation
import { sendVerificationEmail } from '@/lib/email'; // For resending verification

// clientPromise is now a function that returns Promise<MongoClient>
// We need to call it to get the promise for the adapter.
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

        // Call clientPromise() to get the Promise<MongoClient>, then await it.
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
          ); // 24 hours

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
              newVerificationToken
            );
            throw new Error(
              "Your email is not verified. We've sent a new verification link to your email address. Please check your inbox."
            );
          } catch (emailError: any) {
            console.error('Error resending verification email:', emailError);
            // If resending fails, throw a more generic error or the original "please verify"
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

        // Update lastOnline on successful login (background operation to not block login)
        usersCollection
          .updateOne(
            { _id: new ObjectId(dbUser._id) },
            { $set: { lastOnline: new Date() } }
          )
          .catch((err) =>
            console.error('Failed to update lastOnline during login:', err)
          );

        // Use session timeout from new settings structure
        const sessionTimeoutInHours =
          dbUser.settings &&
          dbUser.settings.session &&
          dbUser.settings.session.sessionTimeout
            ? dbUser.settings.session.sessionTimeout
            : 4;

        let companyName = dbUser.companyName;
        if (!companyName && dbUser.companyId) {
          const company = await companiesCollection.findOne({
            _id: new ObjectId(dbUser.companyId),
          });
          if (company) {
            companyName = company.name;
            // Optionally, update the user document to include the company name for future logins
            await usersCollection.updateOne(
              { _id: new ObjectId(dbUser._id) },
              { $set: { companyName: company.name } }
            );
          }
        }
        // Return user object without password
        return {
          id: dbUser._id.toString(),
          name: dbUser.name,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout', // Optional: Custom signout page
    // error: '/auth/error', // Optional: Custom error page
    // verifyRequest: '/auth/verify-request', // Optional: Custom verify request page (for email provider)
    // newUser: '/auth/new-user' // Optional: Redirect new users to a specific page
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Only update lastOnline on initial login or token refresh (not on every request)
      // This prevents database writes on every JWT verification which slows down session loading
      if (token.id && user) {
        // Only update lastOnline when user object is present (initial login)
        try {
          const client: MongoClient = await clientPromise();
          const usersCollection = client.db().collection('users');
          // Use background update to not block JWT processing
          usersCollection
            .updateOne(
              { _id: new ObjectId(token.id as string) },
              { $set: { lastOnline: new Date() } }
            )
            .catch((err) => console.error('Failed to update lastOnline:', err));
        } catch (error) {
          console.error(
            'Database connection error during lastOnline update:',
            error
          );
        }
      }

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.profileImageUrl = user.profileImageUrl;
        token.companyName = user.companyName;
        token.companyId = user.companyId;

        // Set JWT expiration based on user's sessionTimeout setting
        const sessionTimeoutInSeconds =
          (user as any).settings?.session?.sessionTimeout * 3600 || 4 * 3600;
        token.exp = Math.floor(Date.now() / 1000) + sessionTimeoutInSeconds;
      }

      if (trigger === 'update' && session) {
        if (session.user) {
          token.firstName = session.user.firstName;
          token.lastName = session.user.lastName;
          token.profileImageUrl = session.user.profileImageUrl;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
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
  // debug: process.env.NODE_ENV === 'development', // Optional: Enable debug messages
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
