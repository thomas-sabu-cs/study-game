import { auth } from "@clerk/nextjs/server";

/**
 * Returns the current app user id.
 * If no Clerk user is signed in, falls back to a shared 'guest' id
 * so people can try the app without logging in.
 */
export async function getAppUserId(): Promise<string> {
  const { userId } = await auth();
  return userId ?? "guest";
}

