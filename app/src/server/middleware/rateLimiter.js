const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map();

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now - entry.firstAttemptAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

setInterval(cleanupExpired, WINDOW_MS).unref?.();

function keyFor(req) {
  const email = (req.body?.email || "").toLowerCase().trim();
  return `${email}:${req.ip}`;
}

exports.loginRateLimiter = (req, res, next) => {
  const key = keyFor(req);
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && now - entry.firstAttemptAt < WINDOW_MS) {
    if (entry.count >= MAX_ATTEMPTS) {
      const retryAfterMs = WINDOW_MS - (now - entry.firstAttemptAt);
      const retryAfterMin = Math.ceil(retryAfterMs / 60000);
      return res.status(429).json({
        message: `Too many attempts. Please try again in ${retryAfterMin} minute(s).`,
      });
    }
    entry.count += 1;
  } else {
    attempts.set(key, { count: 1, firstAttemptAt: now });
  }

  next();
};

exports.clearRateLimit = (req) => {
  attempts.delete(keyFor(req));
};
