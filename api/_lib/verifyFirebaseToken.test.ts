import { createSign, generateKeyPairSync } from 'crypto';
import { describe, expect, it } from 'vitest';

import { verifyFirebaseIdToken } from './verifyFirebaseToken';

const PROJECT = 'demo-project';
const NOW = Date.UTC(2026, 10, 1, 12);
const nowS = NOW / 1000;

const signing = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
// createPublicKey accepts an SPKI PEM as well as Google's X.509 certs.
const certs = async () => ({ k1: signing.publicKey.export({ type: 'spki', format: 'pem' }).toString() });

const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function token(
  claims: Record<string, unknown> = {},
  header: Record<string, unknown> = {},
  key = signing.privateKey,
) {
  const h = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT', ...header });
  const p = b64({
    aud: PROJECT,
    iss: `https://securetoken.google.com/${PROJECT}`,
    sub: 'user-123',
    iat: nowS - 60,
    auth_time: nowS - 60,
    exp: nowS + 3600,
    ...claims,
  });
  const s = createSign('RSA-SHA256').update(`${h}.${p}`).sign(key).toString('base64url');
  return `${h}.${p}.${s}`;
}

const verify = (t: string) => verifyFirebaseIdToken(t, PROJECT, certs, NOW);

describe('verifyFirebaseIdToken', () => {
  it('accepts a valid token and returns the uid', async () => {
    expect(await verify(token())).toBe('user-123');
  });
  it('rejects a token signed with another key', async () => {
    expect(await verify(token({}, {}, other.privateKey))).toBeNull();
  });
  it('rejects a tampered payload', async () => {
    const [h, , s] = token().split('.');
    expect(await verify(`${h}.${b64({ sub: 'attacker' })}.${s}`)).toBeNull();
  });
  it('rejects another project, issuer or an empty subject', async () => {
    expect(await verify(token({ aud: 'other-project' }))).toBeNull();
    expect(await verify(token({ iss: 'https://securetoken.google.com/other-project' }))).toBeNull();
    expect(await verify(token({ sub: '' }))).toBeNull();
  });
  it('rejects expired or future-dated tokens', async () => {
    expect(await verify(token({ exp: nowS - 3600 }))).toBeNull();
    expect(await verify(token({ iat: nowS + 3600 }))).toBeNull();
    expect(await verify(token({ auth_time: nowS + 3600 }))).toBeNull();
  });
  it('rejects unsigned tokens, unknown keys and garbage', async () => {
    const [, p] = token().split('.');
    expect(await verify(`${b64({ alg: 'none', kid: 'k1' })}.${p}.`)).toBeNull();
    expect(await verify(token({}, { kid: 'unknown' }))).toBeNull();
    expect(await verify(token({}, { alg: 'HS256' }))).toBeNull();
    expect(await verify('not-a-token')).toBeNull();
    expect(await verify('a.b.c')).toBeNull();
  });
});
