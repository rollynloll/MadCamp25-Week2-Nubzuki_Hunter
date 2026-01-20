const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
console.info("API_BASE_URL:", API_BASE_URL);

function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function emitLoading(delta) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("api-loading", { detail: { delta } }));
}

async function request(path, options = {}) {
  emitLoading(1);
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      // ❌ credentials: "include" ← 이 줄 삭제
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
        ...(options.headers || {}),
      },
      ...options,
    });
  } finally {
    emitLoading(-1);
  }

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
