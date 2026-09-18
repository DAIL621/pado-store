export const TOSS_API_TIMEOUT_MS = 8_000;

export class TossApiTimeoutError extends Error {
  constructor() {
    super(`Toss API request timed out after ${TOSS_API_TIMEOUT_MS}ms.`);
    this.name = "TossApiTimeoutError";
  }
}

export async function tossFetch(
  input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(TOSS_API_TIMEOUT_MS)
    });
  } catch (error) {
    if (
      (error instanceof DOMException && error.name === "TimeoutError")
      || (error instanceof Error && error.name === "TimeoutError")
    ) {
      throw new TossApiTimeoutError();
    }
    throw error;
  }
}
