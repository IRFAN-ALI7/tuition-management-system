const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const REQUEST_TIMEOUT_MS = 20_000;

const ERROR_MESSAGES = {
  timeout:
    "The server is taking too long to respond. Please check your internet connection and try again.",
  network:
    "Unable to connect to the server. Please check your internet connection and try again.",
  unauthorized: "Your session has expired. Please log in again.",
  forbidden: "You don't have permission to do this.",
  tooManyRequests: "Too many attempts. Please wait a few minutes and try again.",
  server: "Something went wrong on our side. Please try again in a moment.",
  generic: "Request failed. Please try again.",
};

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const studentGetCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

const STUDENT_CACHE_DURATION = 60 * 1000;

function isCacheableStudentRequest(path: string, method: string) {
  return (
    method === "GET" &&
    path.startsWith("/student/") &&
    !path.includes("/export") &&
    !path.includes("/download")
  );
}

export function clearStudentApiCache() {
  studentGetCache.clear();
  pendingRequests.clear();
}

export function invalidateStudentApiCache(pathPrefix?: string) {
  if (!pathPrefix) {
    clearStudentApiCache();
    return;
  }

  for (const key of studentGetCache.keys()) {
    if (key.includes(pathPrefix)) {
      studentGetCache.delete(key);
    }
  }

  for (const key of pendingRequests.keys()) {
    if (key.includes(pathPrefix)) {
      pendingRequests.delete(key);
    }
  }
}

function fallbackMessage(status: number) {
  if (status === 401) return ERROR_MESSAGES.unauthorized;
  if (status === 403) return ERROR_MESSAGES.forbidden;
  if (status === 429) return ERROR_MESSAGES.tooManyRequests;
  if (status >= 500) return ERROR_MESSAGES.server;
  return ERROR_MESSAGES.generic;
}

export async function api(path: string, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const shouldCache = isCacheableStudentRequest(path, method);
  const cacheKey = `${method}:${path}`;

  if (shouldCache) {
    const cached = studentGetCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const pending = pendingRequests.get(cacheKey);

    if (pending) {
      return pending;
    }
  }

  const request = (async () => {
    let response: Response;

    try {
      response = await fetch(`${API}${path}`, {
        ...init,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
        signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const isTimeout =
        error instanceof DOMException &&
        (error.name === "TimeoutError" || error.name === "AbortError");

      throw Object.assign(
        new Error(isTimeout ? ERROR_MESSAGES.timeout : ERROR_MESSAGES.network),
        { details: {}, status: 0 },
      );
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      clearStudentApiCache();
    }

    if (!response.ok) {
      throw Object.assign(
        new Error(data.error ?? fallbackMessage(response.status)),
        { details: data, status: response.status },
      );
    }

    if (shouldCache) {
      studentGetCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + STUDENT_CACHE_DURATION,
      });
    }

    return data;
  })();

  if (shouldCache) {
    pendingRequests.set(cacheKey, request);
  }

  try {
    return await request;
  } finally {
    if (shouldCache && pendingRequests.get(cacheKey) === request) {
      pendingRequests.delete(cacheKey);
    }
  }
}

export { API };