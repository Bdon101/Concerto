import { Auth } from "@unbndl/auth";

const LOGIN_URL = "/login.html";

// Upload a single image file and return its served URL.
//
// This is the lecture's large-file path: POST the raw bytes, the server
// writes them to disk and returns { url }. We fetch directly (rather than
// going through the store) because the framework's dispatch reactions are
// fixed to `() => void` and can't carry the URL back to the caller.
export async function uploadImage(file: File): Promise<string> {
  const token = window.localStorage.getItem(Auth.User.TOKEN_KEY);

  const res = await fetch("/api/images", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: file
  });

  // Expired/invalid token — mirror update.ts: clear it and bounce to login.
  if (res.status === 401) {
    try {
      window.localStorage.removeItem(Auth.User.TOKEN_KEY);
    } catch {
      // localStorage may be unavailable (private mode); redirect regardless.
    }
    window.location.assign(LOGIN_URL);
    throw new Error("Session expired — please sign in again.");
  }

  if (res.status !== 201) {
    throw new Error(`Upload failed (HTTP ${res.status})`);
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}
