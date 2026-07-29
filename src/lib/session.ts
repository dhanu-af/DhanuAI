export const SESSION_COOKIE = "dhanu_ai_session";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");

  const exp = Date.now() + THIRTY_DAYS_MS;
  const payload = encoder.encode(String(exp));
  const key = await getKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, payload as BufferSource));
  return `${base64url(payload)}.${base64url(signature)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return false;

  try {
    const payload = base64urlDecode(payloadPart);
    const signature = base64urlDecode(signaturePart);
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, signature as BufferSource, payload as BufferSource);
    if (!valid) return false;

    const exp = Number(decoder.decode(payload));
    return Number.isFinite(exp) && Date.now() < exp;
  } catch {
    return false;
  }
}
