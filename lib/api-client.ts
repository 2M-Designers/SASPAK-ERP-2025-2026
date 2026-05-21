export function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function apiFetch<T = unknown>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  body?: unknown,
): Promise<T> {
  const endpoint = `${getBaseUrl()}${path}`;
  const response = await fetch(endpoint, {
    method,
    headers: getAuthHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 401) {
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    const errorText = await response.text();
    let userMessage = `Request failed (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      if (Array.isArray(parsed)) {
        userMessage = parsed.join("\n");
      } else if (parsed.errors) {
        userMessage = Object.values(parsed.errors).flat().join(", ");
      } else if (parsed.title) {
        userMessage = parsed.title;
      } else if (parsed.message) {
        userMessage = parsed.message;
      } else if (parsed.detail) {
        userMessage = parsed.detail;
      } else if (typeof parsed === "string") {
        userMessage = parsed;
      }
    } catch {
      userMessage = errorText || userMessage;
    }
    throw new Error(userMessage);
  }

  return response.json() as Promise<T>;
}
