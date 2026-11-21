import { createHash, timingSafeEqual } from 'node:crypto';

/** Single-operator pilot gate; not a substitute for user accounts or RBAC. */
export function isAccessRequired(secret: string | undefined, environment: string | undefined): boolean {
  return environment === 'production' || Boolean(secret?.trim());
}

export function verifyApiAccess(supplied: unknown, configuredSecret: string | undefined, environment: string | undefined): boolean {
  const expected = configuredSecret?.trim() ?? '';
  if (!expected) return environment !== 'production';
  // A weak configuration fails closed, including during development.
  if (expected.length < 24 || typeof supplied !== 'string' || !supplied || supplied.length > 512) return false;
  const actualHash = createHash('sha256').update(supplied).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function createFixedWindowLimiter(limit: number, windowMs: number, clock: () => number = Date.now) {
  const attempts = new Map<string, { count: number; startsAt: number }>();
  return {
    allow(key: string): boolean {
      const now = clock();
      if (attempts.size > 5000) for (const [name, entry] of attempts) {
        if (now - entry.startsAt >= windowMs) attempts.delete(name);
      }
      const previous = attempts.get(key);
      if (!previous || now - previous.startsAt >= windowMs) {
        attempts.set(key, { count: 1, startsAt: now });
        return true;
      }
      if (previous.count >= limit) return false;
      previous.count += 1;
      return true;
    },
  };
}

export function validDrugNames(value: unknown, minimum = 0): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= 40 &&
    value.every((name) => typeof name === 'string' && name.trim().length > 0 &&
      name.length <= 140 && !/[\r\n]/.test(name));
}
