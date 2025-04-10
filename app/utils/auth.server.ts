import bcrypt from "bcryptjs";
    import { createCookieSessionStorage, redirect } from "@remix-run/node";

    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
      throw new Error("SESSION_SECRET must be set");
    }

    const storage = createCookieSessionStorage({
      cookie: {
        name: "fahr-zua_session",
        secure: process.env.NODE_ENV === "production",
        secrets: [sessionSecret],
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
      },
    });

    async function createUserSession(userId: string, redirectTo: string) {
      const session = await storage.getSession();
      session.set("userId", userId);
      return redirect(redirectTo, {
        headers: {
          "Set-Cookie": await storage.commitSession(session),
        },
      });
    }

    async function logout(request: Request) {
      const session = await storage.getSession(request.headers.get("Cookie"));
      return redirect("/", {
        headers: {
          "Set-Cookie": await storage.destroySession(session),
        },
      });
    }

    type User = {
      id: string;
      email: string;
      passwordHash: string;
    };

    async function register({ email, password }: Record<string, string>) {
      const isEmpty = !email || !password;

      if (isEmpty) {
        return {
          errors: {
            email: email ? null : "Email is required",
            password: password ? null : "Password is required",
          },
        };
      }

      if (!email.includes("@")) {
        return {
          errors: {
            email: "Invalid email address",
            password: null,
          },
        };
      }

      if (password.length < 6) {
        return {
          errors: {
            email: null,
            password: "Password must be at least 6 characters long",
          },
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          errors: {
            email: "A user already exists with this email address",
            password: null,
          },
        };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      return createUserSession(user.id, "/");
    }

    async function login({ email, password }: Record<string, string>) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          errors: {
            email: "Incorrect email or password",
            password: null,
          },
        };
      }

      const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isCorrectPassword) {
        return {
          errors: {
            email: "Incorrect email or password",
            password: null,
          },
        };
      }

      return createUserSession(user.id, "/");
    }

    async function requireUserId(
      request: Request,
      redirectTo: string = "/"
    ): Promise<string> {
      const session = await getUserSession(request);
      const userId = session.get("userId");
      if (!userId || typeof userId !== "string") {
        throw redirect(redirectTo);
      }
      return userId;
    }

    async function getUserSession(request: Request) {
      return storage.getSession(request.headers.get("Cookie"));
    }

    async function getUserId(request: Request): Promise<string | undefined> {
      const session = await getUserSession(request);
      const userId = session.get("userId");
      if (!userId || typeof userId !== "string") {
        return undefined;
      }
      return userId;
    }

    async function getUser(request: Request) {
      const userId = await getUserId(request);
      if (typeof userId !== "string") {
        return null;
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });
        return user;
      } catch {
        return logout(request);
      }
    }

    export {
      createUserSession,
      getUser,
      getUserId,
      login,
      logout,
      register,
      requireUserId,
    };

    import { PrismaClient } from "@prisma/client";

    let prisma: PrismaClient;

    declare global {
      var __db: PrismaClient | undefined;
    }

    // this is needed because in development we don't want to restart
    // the server with every change, but we want to make sure to re-use
    // the same connection pool.
    if (process.env.NODE_ENV === "production") {
      prisma = new PrismaClient();
    } else {
      if (!global.__db) {
        global.__db = new PrismaClient();
      }
      prisma = global.__db;
    }

    export { prisma };
