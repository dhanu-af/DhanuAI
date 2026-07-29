import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/** Single-user app — a valid session cookie is the only thing that matters. */
export async function getSession(): Promise<{ loggedIn: true } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);
  return valid ? { loggedIn: true } : null;
}
