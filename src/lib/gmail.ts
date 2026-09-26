import type { EmailMessage } from "../types";

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

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
export function requestToken(interactive: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) return reject(new Error("VITE_GOOGLE_CLIENT_ID belum di-set. Lihat README."));
    if (!window.google) return reject(new Error("Google Identity Services belum ter-load. Coba refresh."));
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error ?? "Login dibatalkan"));
        token = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve();
      },
      error_callback: (e) => reject(new Error(e.type)),
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
