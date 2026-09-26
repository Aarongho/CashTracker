import type { EmailMessage } from "../types";

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

const CLIENT_KEY = "cashtracker:clientId";
const ENV_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || "";

/** Build-time client ID wins; otherwise the one the user pasted in the app. */
export function getClientId(): string {
  if (ENV_CLIENT_ID) return ENV_CLIENT_ID;
  try {
    return localStorage.getItem(CLIENT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setClientId(id: string): void {
  try {
    if (id.trim()) localStorage.setItem(CLIENT_KEY, id.trim());
    else localStorage.removeItem(CLIENT_KEY);
  } catch {
    /* storage blocked */
  }
}

export const clientIdFromEnv = () => !!ENV_CLIENT_ID;

export function looksLikeClientId(id: string): boolean {
  return /^[\w-]+\.apps\.googleusercontent\.com$/.test(id.trim());
}

let gisPromise: Promise<void> | null = null;

/** Load Google Identity Services on demand (only when the user connects). */
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisPromise = null;
      reject(new Error("Gagal memuat Google Sign-In. Cek koneksi, atau buka app dari website-nya (bukan preview)."));
    };
    document.head.appendChild(s);
  });
  return gisPromise;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(cfg: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (r: TokenResponse) => void;
            error_callback?: (e: { type: string }) => void;
          }): { requestAccessToken(o?: { prompt?: string }): void };
          revoke(token: string, done: () => void): void;
        };
      };
    };
  }
}

let token: { value: string; expiresAt: number } | null = null;

export function hasValidToken(): boolean {
  return !!token && Date.now() < token.expiresAt - 60_000;
}

/** Ask Google for a short-lived read-only Gmail token (popup the first time). */
export async function requestToken(interactive: boolean): Promise<void> {
  const clientId = getClientId();
  if (!clientId) throw new Error("Masukkan Google Client ID dulu.");
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error ?? "Login dibatalkan"));
        token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve();
      },
      error_callback: (e) =>
        reject(new Error(e.type === "popup_closed" ? "Login Google ditutup." : e.type === "popup_failed_to_open" ? "Popup diblokir browser. Izinkan popup lalu coba lagi." : e.type)),
    });
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

export function disconnect(): void {
  if (token && window.google) window.google.accounts.oauth2.revoke(token.value, () => {});
  token = null;
}

async function api<T>(path: string): Promise<T> {
  if (!hasValidToken()) await requestToken(false);
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token!.value}` } });
  if (res.status === 401) {
    token = null;
    throw new Error("Sesi Gmail habis, sambungkan lagi.");
  }
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json() as Promise<T>;
}

interface Part {
  mimeType?: string;
  body?: { data?: string };
  parts?: Part[];
  headers?: { name: string; value: string }[];
}

function decode(data: string): string {
  const bin = atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function findPart(p: Part, mime: string): string | null {
  if (p.mimeType === mime && p.body?.data) return decode(p.body.data);
  for (const c of p.parts ?? []) {
    const hit = findPart(c, mime);
    if (hit) return hit;
  }
  return null;
}

function bodyText(payload: Part): string {
  const html = findPart(payload, "text/html");
  if (html) {
    const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, "\n"), "text/html");
    doc.querySelectorAll("style,script").forEach((n) => n.remove());
    doc.querySelectorAll("p,div,tr,li,h1,h2,h3,table").forEach((n) => n.append("\n"));
    doc.querySelectorAll("td,th").forEach((n) => n.append(" "));
    return (doc.body.textContent ?? "").replace(/[ \t ]+/g, " ").replace(/\n\s*\n+/g, "\n");
  }
  const plain = findPart(payload, "text/plain");
  return plain ?? "";
}

/** Fetch messages matching `q` that we haven't seen yet. */
export async function fetchNewMessages(q: string, seen: Set<string>, max = 100): Promise<EmailMessage[]> {
  const ids: string[] = [];
  let pageToken = "";
  do {
    const r = await api<{ messages?: { id: string }[]; nextPageToken?: string }>(
      `/messages?maxResults=50&q=${encodeURIComponent(q)}${pageToken ? `&pageToken=${pageToken}` : ""}`,
    );
    for (const m of r.messages ?? []) if (!seen.has(m.id)) ids.push(m.id);
    pageToken = r.nextPageToken ?? "";
  } while (pageToken && ids.length < max);

  const out: EmailMessage[] = [];
  // Small batches keep us well under Gmail's per-user rate limit.
  for (let i = 0; i < ids.length && i < max; i += 10) {
    const batch = await Promise.all(
      ids.slice(i, i + 10).map((id) => api<{ id: string; internalDate: string; payload: Part }>(`/messages/${id}?format=full`)),
    );
    for (const m of batch) {
      const h = (n: string) => m.payload.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
      out.push({
        id: m.id,
        from: h("from"),
        subject: h("subject"),
        date: new Date(Number(m.internalDate)).toISOString(),
        body: bodyText(m.payload),
      });
    }
  }
  return out;
}
