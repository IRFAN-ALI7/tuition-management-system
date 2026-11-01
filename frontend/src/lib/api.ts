const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Object.assign(
      new Error(data.error ?? "Request failed. Please try again."),
      { details: data },
    );
  }

  return data;
}

export { API };