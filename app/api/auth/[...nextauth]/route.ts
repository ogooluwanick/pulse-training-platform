// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../../lib/mongodb"
import bcrypt from "bcryptjs"
import { MongoClient, ObjectId } from "mongodb"
import crypto from "crypto"
import { sendVerificationEmail } from "../../../../lib/email"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise()), 
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const client: MongoClient = await clientPromise(); 
        const usersCollection = client.db().collection("users");
        const dbUser = await usersCollection.findOne({ email: credentials.email });

        if (!dbUser) {
          throw new Error("No user found with this email");
        }
        
        if (!dbUser.emailVerified) {
          // Resend verification email logic...
          throw new Error("Your email is not verified. We've sent a new verification link.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, dbUser.password as string);

        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }

        // ... update lastOnline and get session timeout settings ...

        return {
          id: dbUser._id.toString(),
          name: dbUser.name, 
          email: dbUser.email,
          role: dbUser.role,
          // ... other user properties
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        // Set JWT expiration based on user's sessionTimeout setting
        const sessionTimeoutInHours = (user as any).sessionTimeoutInHours || 4;
        const sessionTimeoutInSeconds = sessionTimeoutInHours * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + sessionTimeoutInSeconds;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
