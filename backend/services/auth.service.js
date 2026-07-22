import crypto from 'crypto';
import securityConfig from '../config/security.js';

export const {
  SIGNUP_RATE_LIMIT,
  SIGNUP_WINDOW_MS,
  LOGIN_RATE_LIMIT,
  LOGIN_WINDOW_MS,
  AUTH_DELAY_MS,
  MIN_PASSWORD_LENGTH,
  PASSWORD_REGEX,
  PBKDF2_ITERATIONS,
  PASSWORD_KEY_LENGTH,
  HASHING_ALGORITHM,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} = securityConfig;

import { redisAvailable, redisClient } from '../jobs/queue.js';

export const activeRefreshFamilies = new Map();
const signupAttempts = new Map();
const loginAttempts = new Map();

export const _signupSweeper = setInterval(() => {
  const now = Date.now();
  for (const [identifier, timestamps] of signupAttempts) {
    const fresh = timestamps.filter((t) => now - t < SIGNUP_WINDOW_MS);
    if (fresh.length === 0) {
      signupAttempts.delete(identifier);
    } else {
      signupAttempts.set(identifier, fresh);
    }
  }
}, SIGNUP_WINDOW_MS);

if (_signupSweeper.unref) _signupSweeper.unref();

// Mirrors the signup-rate-limit sweeper above. #2535: isLoginRateLimited /
// LOGIN_WINDOW_MS were previously imported by authHandlers.js without ever
// being defined/exported here.
export const _loginSweeper = setInterval(() => {
  const now = Date.now();
  for (const [identifier, timestamps] of loginAttempts) {
    const fresh = timestamps.filter((t) => now - t < LOGIN_WINDOW_MS);
    if (fresh.length === 0) {
      loginAttempts.delete(identifier);
    } else {
      loginAttempts.set(identifier, fresh);
    }
  }
}, LOGIN_WINDOW_MS);

if (_loginSweeper.unref) _loginSweeper.unref();

const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV === 'production' && TRUSTED_PROXIES.size === 0) {
  console.warn(
    '[SECURITY WARNING] TRUSTED_PROXIES is not configured in production. ' +
      'If this server sits behind a reverse proxy or CDN, every request will ' +
      "resolve to the proxy's IP for rate-limiting purposes, collapsing all " +
      "clients into a single shared bucket (e.g. one user's failed logins can " +
      "lock out the entire site). Set TRUSTED_PROXIES to the proxy's IP(s) so " +
      'X-Forwarded-For is honoured, or ignore this warning if the server is ' +
      'reachable directly with no proxy in front of it.'
  );
}

export function getClientIdentifier(req) {
  const remoteAddress = req.socket?.remoteAddress || 'unknown';

  if (
    remoteAddress !== 'unknown' &&
    TRUSTED_PROXIES.has(remoteAddress) &&
    req.headers['x-forwarded-for']
  ) {
    const leftmost = req.headers['x-forwarded-for'].split(',')[0].trim();
    if (leftmost) return leftmost;
  }

  return remoteAddress;
}

export function isSignupRateLimited(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  signupAttempts.set(identifier, recentAttempts);
  return recentAttempts.length >= SIGNUP_RATE_LIMIT;
}

export function isLoginRateLimited(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  loginAttempts.set(identifier, recentAttempts);
  return recentAttempts.length >= LOGIN_RATE_LIMIT;
}

export function recordLoginAttempt(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);
}

export function recordSignupAttempt(identifier) {
  const now = Date.now();
  const attempts = signupAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((t) => now - t < SIGNUP_WINDOW_MS);
  recentAttempts.push(now);
  signupAttempts.set(identifier, recentAttempts);
}

export async function normalizeAuthDelay() {
  return new Promise((resolve) => setTimeout(resolve, AUTH_DELAY_MS));
}

// ── Authentication & Tokens ──────────────────────────────────────────────────

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is required. Set it in the environment before starting the server.'
    );
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

/**
 * Validates the user object before it is encoded into an access or refresh
 * token (see issue #2412). Returns `null` if valid, otherwise a string
 * describing the first detected problem so callers can surface a consistent
 * error message.
 *
 * Contract:
 *   - `user` must be a non-null object
 *   - `id`, `name`, `email` must each be present and a non-empty string
 *
 * We deliberately only stringify-check the three required claims; extra
 * fields (rating, role, avatarUrl, ...) are passed through untouched. The
 * function never mutates `user` or any of its properties.
 */
export function validateUserForToken(user) {
  if (user === null || typeof user !== 'object' || Array.isArray(user)) {
    return 'A valid user object is required to generate a token.';
  }
  const required = ['id', 'name', 'email'];
  for (const field of required) {
    const value = user[field];
    if (value === undefined || value === null) {
      return `Missing required field "${field}" on user object.`;
    }
    if (typeof value !== 'string' || value.trim() === '') {
      return `Field "${field}" on the user object must be a non-empty string.`;
    }
  }
  return null;
}

export function createAccessToken(user) {
  const validationError = validateUserForToken(user);
  if (validationError) {
    throw new Error(validationError);
  }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE_SECONDS,
      type: 'access',
    })
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

export async function createRefreshToken(
  user,
  familyId = crypto.randomUUID(),
  nonce = crypto.randomUUID()
) {
  const validationError = validateUserForToken(user);
  if (validationError) {
    throw new Error(validationError);
  }
  if (redisAvailable && redisClient) {
    await redisClient.set(`refresh:${familyId}`, nonce, 'EX', REFRESH_TOKEN_MAX_AGE_SECONDS);
  } else {
    activeRefreshFamilies.set(familyId, { currentNonce: nonce });
  }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_MAX_AGE_SECONDS,
      type: 'refresh',
      familyId,
      nonce,
    })
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

export async function revokeTokenFamily(familyId) {
  if (redisAvailable && redisClient) {
    await redisClient.del(`refresh:${familyId}`);
  } else {
    activeRefreshFamilies.delete(familyId);
  }
}

export function verifyToken(token, expectedType) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  // Validate JWT header before proceeding to signature verification.
  // This ensures only tokens with the expected algorithm (HS256) and
  // type (JWT) are processed, rejecting malformed or unsupported headers
  // early and avoiding unnecessary cryptographic operations.
  try {
    const decodedHeader = JSON.parse(fromBase64Url(header));
    if (decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') {
      return null;
    }
  } catch {
    return null;
  }

  const body = `${header}.${payload}`;
  const expected = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload));
    if (!session.exp || session.exp < Math.floor(Date.now() / 1000)) return null;
    if (session.type !== expectedType) return null;
    return session;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token) {
  return verifyToken(token, 'access');
}

export async function verifyRefreshToken(token) {
  const session = verifyToken(token, 'refresh');
  if (!session) return null;

  if (redisAvailable && redisClient) {
    const currentNonce = await redisClient.get(`refresh:${session.familyId}`);
    if (!currentNonce) return null;
    if (currentNonce !== session.nonce) {
      await revokeTokenFamily(session.familyId);
      return null;
    }
  } else {
    const family = activeRefreshFamilies.get(session.familyId);
    if (!family) return null;

    if (family.currentNonce !== session.nonce) {
      activeRefreshFamilies.delete(session.familyId);
      return null;
    }
  }
  return session;
}

const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';

// ── Password hashing parameter validation ────────────────────────────────────

/** Minimum iterations OWASP recommends (as of 2023) */
const MIN_PBKDF2_ITERATIONS = 100000;
/** Hard upper-bound to prevent DoS via absurdly large iteration counts */
const MAX_PBKDF2_ITERATIONS = 10000000;
/** Maximum reasonable derived-key length in bytes */
const MAX_KEY_LENGTH = 64;
/** Set of digest names that Node's crypto module actually supports */
const SUPPORTED_HASHING_ALGORITHMS = new Set(crypto.getHashes());

/**
 * Validates password-hashing configuration parameters before they are
 * consumed by {@link hashPassword} or {@link passwordMatches}.
 *
 * @returns {string|null} A human-readable error message if a parameter is
 *   invalid, or `null` when every parameter is acceptable.
 */
export function validatePasswordHashingParams() {
  // ── PBKDF2_ITERATIONS ──────────────────────────────────────────────────
  if (
    PBKDF2_ITERATIONS === undefined ||
    PBKDF2_ITERATIONS === null ||
    typeof PBKDF2_ITERATIONS !== 'number' ||
    !Number.isFinite(PBKDF2_ITERATIONS) ||
    !Number.isInteger(PBKDF2_ITERATIONS)
  ) {
    return (
      'PBKDF2_ITERATIONS must be a positive integer. ' +
      `Received: ${PBKDF2_ITERATIONS} (type: ${typeof PBKDF2_ITERATIONS}).`
    );
  }
  if (PBKDF2_ITERATIONS < MIN_PBKDF2_ITERATIONS) {
    return (
      `PBKDF2_ITERATIONS (${PBKDF2_ITERATIONS}) is below the minimum ` +
      `security threshold of ${MIN_PBKDF2_ITERATIONS}.`
    );
  }
  if (PBKDF2_ITERATIONS > MAX_PBKDF2_ITERATIONS) {
    return (
      `PBKDF2_ITERATIONS (${PBKDF2_ITERATIONS}) exceeds the maximum ` +
      `allowed value of ${MAX_PBKDF2_ITERATIONS} to prevent denial of service.`
    );
  }

  // ── PASSWORD_KEY_LENGTH ─────────────────────────────────────────────────
  if (
    PASSWORD_KEY_LENGTH === undefined ||
    PASSWORD_KEY_LENGTH === null ||
    typeof PASSWORD_KEY_LENGTH !== 'number' ||
    !Number.isFinite(PASSWORD_KEY_LENGTH) ||
    !Number.isInteger(PASSWORD_KEY_LENGTH)
  ) {
    return (
      'PASSWORD_KEY_LENGTH must be a positive integer. ' +
      `Received: ${PASSWORD_KEY_LENGTH} (type: ${typeof PASSWORD_KEY_LENGTH}).`
    );
  }
  if (PASSWORD_KEY_LENGTH < 1) {
    return `PASSWORD_KEY_LENGTH (${PASSWORD_KEY_LENGTH}) must be at least 1.`;
  }
  if (PASSWORD_KEY_LENGTH > MAX_KEY_LENGTH) {
    return (
      `PASSWORD_KEY_LENGTH (${PASSWORD_KEY_LENGTH}) exceeds the maximum ` +
      `allowed value of ${MAX_KEY_LENGTH}.`
    );
  }

  // ── HASHING_ALGORITHM ───────────────────────────────────────────────────
  if (
    HASHING_ALGORITHM === undefined ||
    HASHING_ALGORITHM === null ||
    typeof HASHING_ALGORITHM !== 'string'
  ) {
    return (
      'HASHING_ALGORITHM must be a non-empty string. ' +
      `Received: ${HASHING_ALGORITHM} (type: ${typeof HASHING_ALGORITHM}).`
    );
  }
  if (HASHING_ALGORITHM.trim() === '') {
    return 'HASHING_ALGORITHM must be a non-empty string.';
  }
  if (!SUPPORTED_HASHING_ALGORITHMS.has(HASHING_ALGORITHM)) {
    return (
      `HASHING_ALGORITHM "${HASHING_ALGORITHM}" is not supported. ` +
      `Supported algorithms: ${Array.from(SUPPORTED_HASHING_ALGORITHMS).join(', ')}.`
    );
  }

  return null;
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const validationError = validatePasswordHashingParams();
  if (validationError) {
    throw new Error(validationError);
  }
  const hash = crypto
    .pbkdf2Sync(
      password + PASSWORD_PEPPER,
      salt,
      PBKDF2_ITERATIONS,
      PASSWORD_KEY_LENGTH,
      HASHING_ALGORITHM
    )
    .toString('hex');
  return { salt, hash, iterations: PBKDF2_ITERATIONS, digest: HASHING_ALGORITHM };
}

export function passwordMatches(password, stored) {
  const validationError = validatePasswordHashingParams();
  if (validationError) {
    throw new Error(validationError);
  }
  const calculated = crypto.pbkdf2Sync(
    password + PASSWORD_PEPPER,
    stored.salt,
    stored.iterations || PBKDF2_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    stored.digest || HASHING_ALGORITHM
  );
  const saved = Buffer.from(stored.hash, 'hex');
  return saved.length === calculated.length && crypto.timingSafeEqual(saved, calculated);
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase();
  const rawPassword = String(password || '');
  const rawConfirm = String(confirmPassword || '');

  if (cleanName.length < 2) return 'Name must be at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return 'Enter a valid email address.';
  }
  if (rawPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (
    !PASSWORD_REGEX.lowercase.test(rawPassword) ||
    !PASSWORD_REGEX.uppercase.test(rawPassword) ||
    !PASSWORD_REGEX.digit.test(rawPassword)
  ) {
    return 'Password must include uppercase, lowercase, and a number.';
  }
  if (rawPassword !== rawConfirm) return 'Passwords do not match.';
  return null;
}
