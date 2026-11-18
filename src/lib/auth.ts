import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Convert the string secret into a Uint8Array required by 'jose'
const encodedKey = new TextEncoder().encode(secretKey);

export const AUTH_COOKIE_NAME = "clientflow_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Signs a new JWT token valid for 7 days
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

/**
 * Verifies a JWT token and returns the decoded user payload (or null if invalid/expired)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads the HttpOnly cookie on the server and returns the currently logged-in user
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyToken(token);
}
