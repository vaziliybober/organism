import { User } from "@prisma/client";
import nodemailer from "nodemailer";
import { createCookieSessionStorage, redirect } from "remix";
import invariant from "tiny-invariant";
import { prisma } from "./db.server";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
const USER_SESSION_KEY = "userId";
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export const emailTransporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true,
  auth: {
    user: "organism-0555@mail.ru",
    pass: "1DDkSgsJb6GnECVTd1hC",
  },
});

function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserIdFromSession(
  request: Request
): Promise<string | undefined> {
  const session = await getSession(request);
  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function login(
  request: Request,
  userId: string,
  redirectTo: string = "/",
  remember: boolean = false
) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7 // 7 days
          : undefined,
      }),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function getCurrentUser(
  request: Request,
  query: (id: string) => Promise<User | null> = (id: string) =>
    prisma.user.findUnique({ where: { id } })
) {
  const userId = await getUserIdFromSession(request);
  if (!userId) {
    return null;
  }
  const user = await query(userId);
  if (!user || !user.verified) {
    return null;
  }
  return user;
}

export async function requireCurrentUser(
  request: Request,
  query: (id: string) => Promise<User | null>
) {
  const user = await getCurrentUser(request, query);
  if (!user) {
    throw await logout(request);
  }
  return user;
}

export async function queryVerifiedUser(query: () => Promise<User | null>) {
  const user = await query();
  if (!user || !user.verified) {
    return null;
  }
  return user;
}
