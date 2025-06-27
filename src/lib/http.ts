import { ApiError } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:3000";

/**
 * Custom fetch wrapper with error handling
 */
export async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  // Handle non-success responses
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
}

/**
 * GET request
 */
export async function get<T>(url: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(url, { method: "GET", ...options });
}

/**
 * POST request
 */
export async function post<T, D = unknown>(
  url: string,
  data: D,
  options?: RequestInit
): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUT request
 */
export async function put<T, D = unknown>(
  url: string,
  data: D,
  options?: RequestInit
): Promise<T> {
  return fetcher<T>(url, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETE request
 */
export async function del<T>(url: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(url, { method: "DELETE", ...options });
}
