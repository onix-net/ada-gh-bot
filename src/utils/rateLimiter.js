// src/utils/rateLimiter.js
import { AppError } from './errors.js';

class RateLimiter {
  constructor(maxRequests, perSeconds) {
    this.maxRequests = maxRequests;
    this.perSeconds = perSeconds;
    this.requests = new Map();
  }

  canMakeRequest(key) {
    const now = Date.now();
    const windowStart = now - this.perSeconds * 1000;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);
    const recentRequests = requests.filter((time) => time > windowStart);

    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      return true;
    }

    return false;
  }
}

const globalRateLimiter = new RateLimiter(100, 60); // 100 requests per 60 seconds

export function rateLimiter(keyFunc = (context) => context.payload.sender.id) {
  return function (originalMethod) {
    return function (...args) {
      const key = keyFunc(args[0]); // Assuming the first argument is the context object
      if (!globalRateLimiter.canMakeRequest(key)) {
        throw new AppError('Rate limit exceeded', 429);
      }
      return originalMethod.apply(this, args);
    };
  };
}
