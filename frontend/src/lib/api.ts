
const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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

export async function api(
  path: string,
  init: RequestInit = {},
) {
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
    const response = await fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      clearStudentApiCache();
    }

    if (!response.ok) {
      throw Object.assign(
        new Error(data.error ?? "Request failed. Please try again."),
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
