import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string;
      companyName?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    companyName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    companyName?: string;
  }
}
