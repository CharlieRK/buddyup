export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@northeastern.edu",
  name: "Demo Student",
  role: "USER",
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  // TODO(#5): replace this stub with the JWT-backed session lookup.
  return DEMO_USER;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}
