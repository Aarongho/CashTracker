import type { EmailMessage } from "../types";

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

const CLIENT_KEY = "cashtracker:clientId";
/**
 * OAuth client for the hosted site (https://aarongho.github.io). A client ID is public by
 * design: every browser that signs in sees it. It only works on the origins authorized for
 * it in Google Cloud, so forks should set VITE_GOOGLE_CLIENT_ID or paste their own.
 */
const DEFAULT_CLIENT_ID = "464707396243-j0tcnb0uo8mh78vssn1gop7npdqql29b.apps.googleusercontent.com";
const BUILT_IN_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || DEFAULT_CLIENT_ID;

function storedClientId(): string {
  try {
    return localStorage.getItem(CLIENT_KEY) ?? "";
  } catch {
    return "";
  }
}

/** A client ID the user pasted in the app wins; otherwise the built-in one. */
export function getClientId(): string {
  return storedClientId() || BUILT_IN_CLIENT_ID;
}

export function setClientId(id: string): void {
  try {
    if (id.trim()) localStorage.setItem(CLIENT_KEY, id.trim());
    else localStorage.removeItem(CLIENT_KEY);
  } catch {
    /* storage blocked */
  }
}

/** True when the user hasn't pasted their own client ID. */
export const usingBuiltInClientId = () => !storedClientId() && !!BUILT_IN_CLIENT_ID;

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

/** Start loading Google sign-in early so the login popup can open straight from a tap. */
export function preloadGis(): void {
  void loadGis().catch(() => {});
}

const AUTH_ERRORS: Record<string, string> = {
  access_denied: "Akses ditolak. Kalau app masih mode Testing, email kamu harus ada di daftar Test users di Google Cloud (atau app di-Publish).",
  popup_closed: "Login Google ditutup sebelum selesai.",
  popup_failed_to_open: "Popup diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.",
  invalid_client: "Client ID tidak dikenali Google. Cek lagi Client ID-nya.",
  origin_mismatch: "Alamat situs ini belum didaftarkan di Authorized JavaScript origins pada Google Cloud.",
};
const authError = (code: string) => new Error(AUTH_ERRORS[code] ?? `Login Google gagal (${code}).`);

function tokenFlow(clientId: string, interactive: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(authError(r.error ?? "cancelled"));
        token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve();
      },
      error_callback: (e) => reject(authError(e.type)),
    });
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

/**
 * Ask Google for a short-lived read-only Gmail token. When Google sign-in is already
 * loaded this opens the popup synchronously, inside the user's tap, so Safari allows it.
 */
export function requestToken(interactive: boolean): Promise<void> {
  const clientId = getClientId();
  if (!clientId) return Promise.reject(new Error("Masukkan Google Client ID dulu."));
  if (window.google?.accounts?.oauth2) return tokenFlow(clientId, interactive);
  return loadGis().then(() => tokenFlow(clientId, interactive));
}

/** The Gmail address this token belongs to. */
export async function fetchProfileEmail(): Promise<string> {
  const r = await api<{ emailAddress: string }>("/profile");
  return r.emailAddress;
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
    out.push(...(await Promise.all(ids.slice(i, i + 10).map(fetchMessage))));
  }
  return out;
}

interface RawMessage {
  id: string;
  internalDate: string;
  payload: Part;
}

/** One full message, e.g. to show the original email behind a transaction. */
export async function fetchMessage(id: string): Promise<EmailMessage> {
  const m = await api<RawMessage>(`/messages/${id}?format=full`);
  const h = (n: string) => m.payload.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
  return {
    id: m.id,
    from: h("from"),
    subject: h("subject"),
    date: new Date(Number(m.internalDate)).toISOString(),
    body: bodyText(m.payload),
  };
}

/** Link that opens the message in Gmail on the web. */
export function gmailWebLink(id: string, account?: string | null): string {
  return `https://mail.google.com/mail/${account ? `?authuser=${encodeURIComponent(account)}` : "u/0/"}#all/${id}`;
}
