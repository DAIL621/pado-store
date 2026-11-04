/**
 * Normalize Korean delivery phone numbers to digits for orders and address book.
 * Accept "010-1234-5678", "01012345678", and "+82 10-1234-5678".
 */
export function normalizeDeliveryPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || !/^\+?[0-9() .-]+$/.test(raw)) return null;

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("82") && /^\+?82/.test(raw)) {
    digits = `0${digits.slice(2).replace(/^0/, "")}`;
  }

  if (digits.startsWith("010")) {
    return /^010\d{8}$/.test(digits) ? digits : null;
  }
  return /^0\d{9,10}$/.test(digits) ? digits : null;
}
