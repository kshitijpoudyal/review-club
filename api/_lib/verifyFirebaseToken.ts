import { createPublicKey, createVerify } from 'crypto';

// Verifies a Firebase Auth ID token with Node's crypto only. firebase-admin's verifier pulls
// in an ESM-only dependency that Vercel's Node runtime can't require(), so this follows
// Google's documented checks directly:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CLOCK_SKEW_S = 60;

export type CertSource = () => Promise<Record<string, string>>;

let cache: { certs: Record<string, string>; expires: number } | null = null;

const googleCerts: CertSource = async () => {
  if (cache && cache.expires > Date.now()) return cache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Couldn't fetch Firebase certs (${res.status})`);
  const maxAge = Number(res.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  const certs = (await res.json()) as Record<string, string>;
  cache = { certs, expires: Date.now() + maxAge * 1000 };
  return certs;
};

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

/** Returns the uid if `token` is a valid ID token for `projectId`, else null. Never throws. */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  certSource: CertSource = googleCerts,
  now: number = Date.now(),
): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const header = decodePart(h);
    const payload = decodePart(p);

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;
    const cert = (await certSource())[header.kid];
    if (!cert) return null;

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${h}.${p}`);
    if (!verifier.verify(createPublicKey(cert), Buffer.from(s, 'base64url'))) return null;

    const nowS = Math.floor(now / 1000);
    const { aud, iss, sub, exp, iat, auth_time: authTime } = payload as Record<string, unknown>;
    if (aud !== projectId) return null;
    if (iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof sub !== 'string' || !sub || sub.length > 128) return null;
    if (typeof exp !== 'number' || exp + CLOCK_SKEW_S < nowS) return null;
    if (typeof iat !== 'number' || iat - CLOCK_SKEW_S > nowS) return null;
    if (typeof authTime !== 'number' || authTime - CLOCK_SKEW_S > nowS) return null;
    return sub;
  } catch {
    return null;
  }
}
