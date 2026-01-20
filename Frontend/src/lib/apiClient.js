const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function emitLoading(delta) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("api-loading", { detail: { delta } }));
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  emitLoading(1);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } finally {
    emitLoading(-1);
  }

  if (!response.ok) {
    let detail = null;
    try {
      detail = await response.json();
    } catch (error) {
      detail = null;
    }
    const err = new Error(detail?.detail || `Request failed: ${response.status}`);
    err.status = response.status;
    err.detail = detail;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
