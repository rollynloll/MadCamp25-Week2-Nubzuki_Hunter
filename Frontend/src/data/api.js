const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    // ❌ credentials: "include" ← 이 줄 삭제
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error ${res.status}`);
  }

  return res.json();
}

export function apiGet(path, options = {}) {
  return request(path, { method: "GET", ...options });
}

export function apiPost(path, body, options = {}) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}
