const INTERNAL_ORIGIN = "https://pado.invalid";

function isInternalPath(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  let candidate = value;
  // Inspect encoded layers without changing the path returned to the caller.
  // Fail closed on excessive nesting and malformed percent escapes.
  for (let depth = 0; depth < 5; depth++) {
    if (!candidate.startsWith("/") || candidate.startsWith("//")
      || /[\\\u0000-\u001f\u007f]/.test(candidate)) return false;
    try {
      if (new URL(candidate, INTERNAL_ORIGIN).origin !== INTERNAL_ORIGIN) return false;
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return true;
      candidate = decoded;
    } catch {
      return false;
    }
  }
  return false;
}

export function sanitizeNextPath(value: unknown, fallback = "/mypage"): string {
  return isInternalPath(value) ? value : isInternalPath(fallback) ? fallback : "/";
}
