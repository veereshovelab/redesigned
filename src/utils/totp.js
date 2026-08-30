/**
 * RFC 6238 Time-Based One-Time Password (TOTP) Utility
 * Standard implementation compatible with Google Authenticator, Authy, 1Password, etc.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random Base32 TOTP secret key (16 characters / 80 bits)
 */
export function generateTotpSecret(length = 16) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[array[i] % BASE32_CHARS.length];
  }
  return secret;
}

/**
 * Decode Base32 string to Uint8Array
 */
function base32Decode(base32) {
  const cleanBase32 = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  const bits = [];
  for (let i = 0; i < cleanBase32.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanBase32.charAt(i));
    if (val === -1) continue;
    for (let b = 4; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    bytes[i] = byte;
  }
  return bytes;
}

/**
 * Generate HMAC-SHA1 signature using Web Crypto API
 */
async function hmacSha1(keyBytes, messageBytes) {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  return new Uint8Array(signature);
}

/**
 * Compute 6-digit TOTP token for a secret key at a specific counter time step
 */
export async function generateTotpToken(secret, timeStepIndex = Math.floor(Date.now() / 1000 / 30)) {
  const secretBytes = base32Decode(secret);

  // Counter to 8-byte big-endian Uint8Array
  const msg = new Uint8Array(8);
  let time = timeStepIndex;
  for (let i = 7; i >= 0; i--) {
    msg[i] = time & 0xff;
    time = Math.floor(time / 256);
  }

  const hmac = await hmacSha1(secretBytes, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return String(otp).padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP passcode provided by user against secret key
 * Includes tolerance window for slight clock skew (±1 time step = ±30 seconds)
 */
export async function verifyTotpToken(passcode, secret, windowTolerance = 1) {
  if (!passcode || typeof passcode !== 'string') return false;
  const cleanedCode = passcode.trim();
  if (cleanedCode.length !== 6 || !/^\d{6}$/.test(cleanedCode)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let i = -windowTolerance; i <= windowTolerance; i++) {
    const expectedToken = await generateTotpToken(secret, currentStep + i);
    if (expectedToken === cleanedCode) {
      return true;
    }
  }
  return false;
}

/**
 * Generate Google Authenticator compatible otpauth:// URI
 */
export function getTotpUri(secret, accountName = 'user@vorynx.com', issuer = 'Vorynx') {
  const cleanAccount = encodeURIComponent(accountName);
  const cleanIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${cleanIssuer}:${cleanAccount}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate 8 random single-use backup recovery codes
 */
export function generateBackupCodes(count = 8) {
  const codes = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Readable uppercase alphanumeric without confusing chars (0, O, 1, I)
  for (let c = 0; c < count; c++) {
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[array[i] % chars.length];
    }
    // Format as 4-4 (e.g. A9B2-X8K1)
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}
