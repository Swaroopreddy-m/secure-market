import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import crypto from "crypto";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      customerId?: string | null;
      organizationId?: string | null;
    };
    sessionId?: string | null;
  }

  interface User {
    role: string;
    customerId?: string | null;
    organizationId?: string | null;
    sessionId?: string | null;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as import("next-auth/adapters").Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Enterprise Account",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Fallback for demo login if credentials are empty
        if (!credentials?.username || !credentials?.password) {
          const devUser = await prisma.user.findFirst({
            where: { role: "DEVELOPER" }
          });
          if (devUser) {
            const newSessionId = crypto.randomBytes(16).toString("hex");
            // Clean active sessions for developer
            await prisma.activeSession.deleteMany({ where: { userId: devUser.id } });
            await prisma.activeSession.create({ data: { userId: devUser.id, sessionId: newSessionId } });
            return {
              id: devUser.id,
              name: devUser.name,
              email: devUser.email,
              image: devUser.image,
              role: devUser.role,
              customerId: devUser.customerId,
              organizationId: devUser.organizationId,
              sessionId: newSessionId
            };
          }
          return null;
        }

        // 2. Fetch user from DB
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { email: credentials.username }
            ]
          }
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid username or password");
        }

        // 3. Verify Account Status
        if (user.status === "LOCKED") {
          throw new Error("ACCOUNT_LOCKED");
        }

        // 4. Verify password
        const hashedInput = hashPassword(credentials.password);
        if (user.passwordHash !== hashedInput) {
          // Increment login attempts
          const attempts = user.loginAttempts + 1;
          const status = attempts >= 5 ? "LOCKED" : "ACTIVE";
          await prisma.user.update({
            where: { id: user.id },
            data: { loginAttempts: attempts, status }
          });

          // Log failed login event
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              module: "AUTH",
              status: "FAILED",
              details: `Incorrect password. Attempt ${attempts} of 5.`
            }
          });

          if (status === "LOCKED") {
            throw new Error("ACCOUNT_LOCKED_LIMIT");
          }
          throw new Error("Invalid username or password");
        }

        // Reset login attempts on success
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0 }
        });

        // 5. Evaluate Concurrent Login Policy (Step 11)
        const policyConfig = await prisma.configuration.findUnique({
          where: { key: "CONCURRENT_LOGIN_POLICY" }
        });
        const policy = policyConfig?.value || "FORCE_LOGOUT";

        const existingSession = await prisma.activeSession.findFirst({
          where: { userId: user.id }
        });

        if (existingSession && policy === "REJECT_LOGIN") {
          throw new Error("CONCURRENT_SESSION_ACTIVE");
        }

        const newSessionId = crypto.randomBytes(16).toString("hex");

        if (policy === "FORCE_LOGOUT") {
          await prisma.activeSession.deleteMany({
            where: { userId: user.id }
          });
        }

        await prisma.activeSession.create({
          data: {
            userId: user.id,
            sessionId: newSessionId
          }
        });

        // Log successful login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_SUCCESS",
            module: "AUTH",
            status: "SUCCESS",
            details: `Logged in using credentials provider. Session: ${newSessionId.slice(-6)}`
          }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          customerId: user.customerId,
          organizationId: user.organizationId,
          sessionId: newSessionId
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.customerId = user.customerId;
        token.organizationId = user.organizationId;
        token.sessionId = user.sessionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.customerId = token.customerId as string | null;
        session.user.organizationId = token.organizationId as string | null;

        // Verify that this session's token matches active session in DB (FORCE_LOGOUT check)
        const active = await prisma.activeSession.findUnique({
          where: { sessionId: token.sessionId as string }
        });
        
        if (!active) {
          // If active session has been overwritten or deleted, return empty session (forces logout)
          return null as any;
        }

        session.sessionId = token.sessionId as string;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        try {
          await prisma.activeSession.deleteMany({
            where: { sessionId: token.sessionId as string }
          });
        } catch (e) {
          console.error("Failed to delete active session on sign out:", e);
        }
      }
    }
  },
  pages: {
    signIn: "/",
  },
};
