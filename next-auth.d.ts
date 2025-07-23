import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

export type UserRole = 'admin' | 'company' | 'employee';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      profileImageUrl: string;
      companyName?: string;
      companyId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    companyName?: string;
    companyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    companyName?: string;
  }
}
