import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import { getUserMemberships } from '@/lib/user-utils';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          const client: MongoClient = await clientPromise();
          const usersCollection = client.db().collection('users');
          const companiesCollection = client.db().collection('companies');

          const dbUser = await usersCollection.findOne({
            email: credentials.email,
          });

          if (!dbUser) {
            throw new Error('User not found');
          }

          if (dbUser.status !== 'active') {
            throw new Error('Account is not active');
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            dbUser.password
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

          // Get user memberships
          const memberships = await getUserMemberships(dbUser._id.toString());
          const companyIds: string[] = memberships.map((m) =>
            m.companyId.toString()
          );

          // Ensure company context for COMPANY role or legacy fields
          // 1) Include legacy user.companyId if present
          const legacyCompanyId = (dbUser as any).companyId
            ? (dbUser as any).companyId.toString()
            : undefined;
          if (legacyCompanyId && !companyIds.includes(legacyCompanyId)) {
            companyIds.push(legacyCompanyId);
          }

          // 2) Include owned company (Company.companyAccount === user._id)
          if (dbUser.role === 'COMPANY') {
            const ownedCompany = await companiesCollection.findOne({
              companyAccount: new ObjectId(dbUser._id),
            });
            if (ownedCompany) {
              const ownedId = ownedCompany._id.toString();
              if (!companyIds.includes(ownedId)) {
                companyIds.push(ownedId);
              }
            }
          }

          // 3) Ensure activeCompanyId is part of the list if already set on user
          let activeCompanyId = dbUser.activeCompanyId?.toString();
          if (activeCompanyId && !companyIds.includes(activeCompanyId)) {
            companyIds.push(activeCompanyId);
          }

          // Get company names for all collected companyIds
          const companyNames = await Promise.all(
            companyIds.map(async (companyId) => {
              const company = await companiesCollection.findOne({
                _id: new ObjectId(companyId),
              });
              return company?.name || 'Unknown Company';
            })
          );

          // Determine activeCompanyId/name
          let activeCompanyName = '';
          if (!activeCompanyId && companyIds.length > 0) {
            activeCompanyId = companyIds[0];
            activeCompanyName = companyNames[0];
          } else if (activeCompanyId) {
            const activeCompanyIndex = companyIds.indexOf(activeCompanyId);
            activeCompanyName =
              activeCompanyIndex >= 0
                ? companyNames[activeCompanyIndex]
                : companyNames[0] || '';
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
            companyName: activeCompanyName,
            companyId: activeCompanyId,
            companyIds: companyIds,
            companyNames: companyNames,
            activeCompanyId: activeCompanyId,
            sessionTimeoutInHours: sessionTimeoutInHours,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
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
        token.companyIds = user.companyIds;
        token.companyNames = user.companyNames;
        token.activeCompanyId = user.activeCompanyId;

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
        session.user.companyIds = token.companyIds as string[];
        session.user.companyNames = token.companyNames as string[];
        session.user.activeCompanyId = token.activeCompanyId as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
