import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAuthUser,
  resolveAdminProfileAfterAuth,
  type AdminProfile,
} from "./supabase";

const COOKIE_NAME = "koach_admin_access_token";

export async function createAdminSession(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminProfile | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const authUser = await getAuthUser(accessToken);
    return await resolveAdminProfileAfterAuth(authUser.id, authUser.email);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const profile = await getAdminSession();

  if (!profile?.is_admin) {
    redirect("/login");
  }

  return profile;
}
