import crypto from "crypto";
import fs from "fs/promises";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { initializeFirebase, getDb, COLLECTIONS } from "./firebase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSION_COOKIE = "aiv_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 210000;
const PASSWORD_KEY_LENGTH = 32;

const protectedPaths = new Set([
  "/community",
  "/community.html",
  "/support-page",
  "/support-page/",
  "/support-page/index.html",
]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
   throw new Error("SESSION_SECRET is required in production.");
  }
  return "dev-only-change-me-with-SESSION_SECRET-before-deploying";
 }

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function createSessionToken(user) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    }),
  );
  const body = `${header}.${payload}`;
  return `${body}.${sign(body)}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
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
    return session;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function sessionCookie(token, req) {
  const secure = req.headers["x-forwarded-proto"] === "https";
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

let db = null;
let useFirestore = false;

async function getUserByEmail(email) {
  if (!useFirestore) {
    const users = await readUsers();
    return users.find((u) => u.email === email) || null;
  }
  const snapshot = await db.collection(COLLECTIONS.USERS).where("email", "==", email).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

async function createUser(userData) {
  if (!useFirestore) {
    const users = await readUsers();
    users.push(userData);
    await writeUsers(users);
    return userData;
  }
  const docRef = await db.collection(COLLECTIONS.USERS).add(userData);
  return { id: docRef.id, ...userData };
}

async function ensureUserStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]\n");
  }
}

async function readUsers() {
  await ensureUserStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeUsers(users) {
  await ensureUserStore();
  await fs.writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PASSWORD_KEY_LENGTH, "sha256")
    .toString("hex");
  return { salt, hash, iterations: PBKDF2_ITERATIONS, digest: "sha256" };
}

function passwordMatches(password, stored) {
  const calculated = crypto.pbkdf2Sync(
    password,
    stored.salt,
    stored.iterations || PBKDF2_ITERATIONS,
    PASSWORD_KEY_LENGTH,
    stored.digest || "sha256",
  );
  const saved = Buffer.from(stored.hash, "hex");
  return saved.length === calculated.length && crypto.timingSafeEqual(saved, calculated);
}

function validateSignup({ name, email, password, confirmPassword }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");
  const rawConfirm = String(confirmPassword || "");

  if (cleanName.length < 2) return "Name must be at least 2 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return "Enter a valid email address.";
  }
  if (rawPassword.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(rawPassword) || !/[A-Z]/.test(rawPassword) || !/\d/.test(rawPassword)) {
    return "Password must include uppercase, lowercase, and a number.";
  }
  if (rawPassword !== rawConfirm) return "Passwords do not match.";
  return null;
}

async function readJsonBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error("Request body is too large.");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}
function normalizePathname(pathname) {
  if (!pathname) return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isProtectedRoute(pathname) {
  return protectedPaths.has(pathname);
}

function authorizeRequest(req, pathname) {
  if (!isProtectedRoute(pathname)) {
    return { authorized: true };
  }

  const session = getSession(req);

  if (!session) {
    return {
      authorized: false,
      redirectTo: `/login?next=${encodeURIComponent(pathname)}`,
    };
  }

  return {
    authorized: true,
    session,
  };
}

function validateRequest(req) {
  const allowedMethods = ["GET", "POST"];

  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      status: 405,
      message: "Method not allowed.",
    };
  }

  return { valid: true };
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/session" && req.method === "GET") {
    const session = getSession(req);
    return sendJson(res, 200, { authenticated: Boolean(session), user: session });
  }

  if (pathname === "/api/signup" && req.method === "POST") {
    const payload = await readJsonBody(req);
    const validationError = validateSignup(payload);
    if (validationError) return sendJson(res, 400, { error: validationError });

    const email = String(payload.email).trim().toLowerCase();
   const existing = useFirestore
      ? await getUserByEmail(email)
      : (await readUsers()).find((user) => user.email === email);
    if (existing) {
      return sendJson(res, 409, { error: "An account with this email already exists." });
    }

    const user = {
      id: crypto.randomUUID(),
      name: String(payload.name).trim(),
      email,
      password: hashPassword(String(payload.password)),
      createdAt: new Date().toISOString(),
    };
    await createUser(user);

    const token = createSessionToken(user);
    return sendJson(
      res,
      201,
      { user: { id: user.id, name: user.name, email: user.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  }

  if (pathname === "/api/login" && req.method === "POST") {
    const payload = await readJsonBody(req);
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
   const user = useFirestore
     ? await getUserByEmail(email)
      : (await readUsers()).find((candidate) => candidate.email === email);
    if (!user || !passwordMatches(password, user.password)) {
      return sendJson(res, 401, { error: "Invalid email or password." });
    }

    const token = createSessionToken(user);
    return sendJson(
      res,
      200,
      { user: { id: user.id, name: user.name, email: user.email } },
      { "Set-Cookie": sessionCookie(token, req) },
    );
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    return sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
  }

  if (pathname === "/api/feedback" && req.method === "POST") {
    const session = getSession(req);
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: "Invalid JSON body." });
    }

    const { feedbackType, subject, message } = payload;
    if (!feedbackType || !subject || !message) {
      return sendJson(res, 400, { error: "Feedback type, subject, and message are required." });
    }

    const allowedTypes = ["Suggestion", "Bug Report", "Feature Request", "General Feedback"];
    if (!allowedTypes.includes(feedbackType)) {
      return sendJson(res, 400, { error: "Invalid feedback type." });
    }

    if (subject.trim().length < 3) {
      return sendJson(res, 400, { error: "Subject must be at least 3 characters long." });
    }

    if (message.trim().length < 10) {
      return sendJson(res, 400, { error: "Message must be at least 10 characters long." });
    }

    const feedbackData = {
      userId: session ? session.sub : null,
      userName: session ? session.name : null,
      userEmail: session ? session.email : null,
      feedbackType,
      subject: subject.trim(),
      message: message.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    try {
      if (useFirestore) {
        const docRef = await db.collection("feedback").add(feedbackData);
        feedbackData.id = docRef.id;
      } else {
        const feedbackFile = path.join(DATA_DIR, "feedback.json");
        await fs.mkdir(DATA_DIR, { recursive: true });
        let feedbackList = [];
        try {
          const raw = await fs.readFile(feedbackFile, "utf8");
          feedbackList = JSON.parse(raw || "[]");
        } catch (err) {
          if (err.code !== "ENOENT") throw err;
        }
        feedbackData.id = crypto.randomUUID();
        feedbackList.push(feedbackData);
        await fs.writeFile(feedbackFile, JSON.stringify(feedbackList, null, 2) + "\n");
      }

      return sendJson(res, 201, { success: true, feedback: feedbackData });
    } catch (err) {
      console.error("Error saving feedback:", err);
      return sendJson(res, 500, { error: "Failed to save feedback." });
    }
  }

  return sendJson(res, 404, { error: "Not found." });
}

function resolveStaticPath(pathname) {
  const routes = {
    "/": "index.html",
    "/login": "login.html",
    "/signup": "signup.html",
    "/community": "community.html",
    "/python-learning": "python-learning.html",
    "/javascript-learning": "javascript-learning.html",
    "/dbms-learning": "dbms-learning.html",
    "/powerbi-learning": "powerbi-learning.html",
    "/cplusplus-learning": "cplusplus-learning.html",
    "/feedback": "feedback.html",
    "/feedback.html": "feedback.html",
    "/support-page": "support-page/index.html",
    "/support-page/": "support-page/index.html",
  };
  let mapped = routes[pathname];
  if (!mapped) {
    const basePath = pathname.slice(1);
    mapped = path.extname(basePath) ? basePath : basePath + ".html";
  }
  const filePath = path.resolve(ROOT, mapped);
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return filePath;
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const stat = await fs.stat(filePath);
    const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(target);
    const content = await fs.readFile(target);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = normalizePathname(
      decodeURIComponent(url.pathname)
    );

    const requestValidation = validateRequest(req);

    if (!requestValidation.valid) {
      return sendJson(res, requestValidation.status, {
        error: requestValidation.message,
      });
    }

    if (pathname.startsWith("/api/")) {
      return await handleApi(req, res, pathname);
    }

    if (pathname === "/logout") {
      return redirect(res, "/login", { "Set-Cookie": clearSessionCookie() });
    }

    const authorization = authorizeRequest(req, pathname);

    if (!authorization.authorized) {
      return redirect(res, authorization.redirectTo);
    }

    return await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Something went wrong." });
  }
});

export { server };
if (process.env.VERCEL === "1") {
  db = initializeFirebase();
  useFirestore = !!db;
}

if (process.env.VERCEL !== "1") {
  loadEnvFile()
    .then(() => {
      db = initializeFirebase();
      useFirestore = !!db;
      const port = Number(process.env.PORT || 3000);
      const host = process.env.HOST || "127.0.0.1";

      server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        console.log(`Server running at ${url}`);
        if (!process.env.SESSION_SECRET) {
          console.warn("Using a development SESSION_SECRET. Set SESSION_SECRET before deploying.");
        }
      });
    })
    .catch((error) => {
      console.error("Failed to load environment configuration:", error);
      process.exit(1);
    });
}
