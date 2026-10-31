import { Role, UserStatus } from "@/generated/prisma/enums";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "buddyup_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_SESSION_SECRET = "buddyup-development-session-secret";

export type SessionUser = {
  userId: string;
  role: (typeof Role)[keyof typeof Role];
  status: (typeof UserStatus)[keyof typeof UserStatus];
  email?: string;
};

function getSessionSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET,
  );
}

export async function createSessionToken(session: SessionUser) {
  return new SignJWT({
    role: session.role,
    status: session.status,
    email: session.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (typeof payload.sub !== "string") {
      return null;
    }

    if (payload.role !== Role.USER && payload.role !== Role.ADMIN) {
      return null;
    }

    if (
      payload.status !== UserStatus.ACTIVE &&
      payload.status !== UserStatus.SUSPENDED
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      status: payload.status,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

function readSessionCookie(request: NextRequest | Request) {
  if ("cookies" in request && typeof request.cookies?.get === "function") {
    return request.cookies.get(SESSION_COOKIE_NAME)?.value;
  }

  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);
}

export async function getSessionUserFromRequest(request: NextRequest | Request) {
  const token = readSessionCookie(request);

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
