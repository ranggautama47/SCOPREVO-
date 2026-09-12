import { Request, Response, NextFunction } from "express";
import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { getRedisClient } from "../config/redis";
import {
  TooManyRequestsError,
  ServiceUnavailableError,
} from "./error.middleware";
import { logStructured } from "../utils/logger";

export interface RateLimitOptions {
  points: number;
  duration: number; // in seconds
  keyPrefix: string;
  type: "ip" | "account";
  failurePolicy: "fail-closed" | "fail-open";
  customKeyExtractor?: (req: Request) => string | undefined;
}

export function createRateLimiter(options: RateLimitOptions) {
  let redisLimiter: RateLimiterRedis | null = null;
  let fallbackMemoryLimiter: RateLimiterMemory | null = null;
  let hasLoggedFallbackWarning = false;

  function getLimiter(): RateLimiterRedis | RateLimiterMemory {
    const client = getRedisClient();
    // Check if client is a mock or ready redis
    if (client && (client.status === "ready" || client.status === "connect")) {
      if (!redisLimiter) {
        redisLimiter = new RateLimiterRedis({
          storeClient: client,
          points: options.points,
          duration: options.duration,
          keyPrefix: `scoprevo:rl:${options.keyPrefix}`,
        });
      }
      return redisLimiter;
    }

    if (!hasLoggedFallbackWarning) {
      logStructured("warn", {
        event: "RATE_LIMIT_FALLBACK_TO_MEMORY",
        details: {
          keyPrefix: options.keyPrefix,
          reason: client ? `Redis status is ${client.status}` : "Redis client not available",
        },
      });
      hasLoggedFallbackWarning = true;
    }

    if (!fallbackMemoryLimiter) {
      fallbackMemoryLimiter = new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
        keyPrefix: `scoprevo:rl:${options.keyPrefix}`,
      });
    }
    return fallbackMemoryLimiter;
  }

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    let key: string | undefined;

    if (options.customKeyExtractor) {
      key = options.customKeyExtractor(req);
    } else if (options.type === "account") {
      key = req.accountId;
    } else {
      // IP extraction (handles proxy headers safely)
      const ipHeader = req.headers["x-forwarded-for"];
      if (typeof ipHeader === "string") {
        key = ipHeader.split(",")[0].trim();
      } else {
        key = req.ip || req.socket.remoteAddress || "unknown-ip";
      }
    }

    if (!key) {
      if (options.type === "account") {
        // Not authenticated yet
        return next();
      }
      key = "anonymous";
    }

    const limiter = getLimiter();

    try {
      const rateLimiterRes = await limiter.consume(key);
      const msBeforeNext =
        typeof rateLimiterRes.msBeforeNext === "number" &&
        !isNaN(rateLimiterRes.msBeforeNext)
          ? rateLimiterRes.msBeforeNext
          : options.duration * 1000;
      const retryAfterSec = Math.max(1, Math.ceil(msBeforeNext / 1000));

      res.setHeader("Retry-After", retryAfterSec);
      res.setHeader("X-RateLimit-Limit", options.points);
      res.setHeader("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + msBeforeNext).toISOString(),
      );
      next();
    } catch (err) {
      if (
        err instanceof RateLimiterRes ||
        (typeof err === "object" && err !== null && "msBeforeNext" in err)
      ) {
        const rateLimiterRes = err as RateLimiterRes;
        const msBeforeNext =
          typeof rateLimiterRes.msBeforeNext === "number" &&
          !isNaN(rateLimiterRes.msBeforeNext)
            ? rateLimiterRes.msBeforeNext
            : options.duration * 1000;
        const retryAfterSec = Math.max(1, Math.ceil(msBeforeNext / 1000));

        res.setHeader("Retry-After", retryAfterSec);
        res.setHeader("X-RateLimit-Limit", options.points);
        res.setHeader(
          "X-RateLimit-Remaining",
          rateLimiterRes.remainingPoints ?? 0,
        );
        res.setHeader(
          "X-RateLimit-Reset",
          new Date(Date.now() + msBeforeNext).toISOString(),
        );

        logStructured("warn", {
          event: "RATE_LIMIT_BLOCKED",
          route: req.originalUrl,
          accountId: req.accountId,
          details: { keyPrefix: options.keyPrefix },
        });

        return next(
          new TooManyRequestsError(
            "TOO_MANY_REQUESTS",
            "Rate limit exceeded. Please retry later.",
            { retryAfterSeconds: retryAfterSec },
          ),
        );
      }

      // Unexpected Redis error during consume
      if (options.failurePolicy === "fail-closed") {
        logStructured("error", {
          event: "RATE_LIMIT_REDIS_ERROR",
          route: req.originalUrl,
          accountId: req.accountId,
          error: (err as Error).message,
        });
        return next(
          new ServiceUnavailableError(
            "Service temporarily unavailable.",
            "SERVICE_UNAVAILABLE",
          ),
        );
      }

      logStructured("warn", {
        event: "RATE_LIMIT_REDIS_ERROR",
        route: req.originalUrl,
        accountId: req.accountId,
        error: (err as Error).message,
      });
      return next();
    }
  };
}

/**
 * Pre-configured standard rate limiters
 */

// 1. Auth Login: 10 req/min/IP (Fail-closed)
export const authLoginLimiter = createRateLimiter({
  points: 10,
  duration: 60,
  keyPrefix: "auth:login",
  type: "ip",
  failurePolicy: "fail-closed",
});

// 2. Auth Register: 5 req/hour/IP (Fail-closed)
export const authRegisterLimiter = createRateLimiter({
  points: 5,
  duration: 3600,
  keyPrefix: "auth:register",
  type: "ip",
  failurePolicy: "fail-closed",
});

// 3. Auth Verification Email: 5 req/hour/account (Fail-closed)
export const authVerificationEmailLimiter = createRateLimiter({
  points: 5,
  duration: 3600,
  keyPrefix: "auth:verification_email",
  type: "account",
  failurePolicy: "fail-closed",
});

export const authEmailChangeLimiter = createRateLimiter({
  points: 1,
  duration: 60,
  keyPrefix: "auth:email_change",
  type: "account",
  failurePolicy: "fail-closed",
});

export const authForgotPasswordLimiter = createRateLimiter({
  points: 3,
  duration: 60,
  keyPrefix: "auth:forgot_password",
  type: "ip",
  failurePolicy: "fail-closed",
});

export const authResetPasswordLimiter = createRateLimiter({
  points: 5,
  duration: 60,
  keyPrefix: "auth:reset_password",
  type: "ip",
  failurePolicy: "fail-closed",
});

// 4. Standard Authenticated API: 120 req/min/account (Fail-open)
export const standardApiLimiter = createRateLimiter({
  points: 120,
  duration: 60,
  keyPrefix: "api:standard",
  type: "account",
  failurePolicy: "fail-open",
});

// 5. Heavy AI dual limiter: 5 req/10min AND 20 req/hour/account (Fail-closed)
const aiLimiter10m = createRateLimiter({
  points: 5,
  duration: 600,
  keyPrefix: "ai:revisions:10m",
  type: "account",
  failurePolicy: "fail-closed",
});

const aiLimiter1h = createRateLimiter({
  points: 20,
  duration: 3600,
  keyPrefix: "ai:revisions:1h",
  type: "account",
  failurePolicy: "fail-closed",
});

export const aiRevisionsLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  aiLimiter10m(req, res, (err?: any) => {
    if (err) return next(err);
    aiLimiter1h(req, res, next);
  });
};
