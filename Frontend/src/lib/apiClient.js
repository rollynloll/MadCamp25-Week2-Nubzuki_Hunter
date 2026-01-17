const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("nh_access_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

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
