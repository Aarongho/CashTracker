import { useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./icons";
import { looksLikeClientId, usingBuiltInClientId } from "../lib/gmail";
import type { useSync } from "../useSync";

const PAGES_URL = "https://aarongho.github.io/cashtracker/";

/** Guided setup: create a Google OAuth client, paste its ID, connect. */
export function GmailSetup({ sync, onClose }: { sync: ReturnType<typeof useSync>; onClose: () => void }) {
  const builtIn = usingBuiltInClientId();
  const [custom, setCustom] = useState(!builtIn);
  const [id, setId] = useState(builtIn ? "" : sync.clientId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const origin = window.location.origin;
  // Sandboxed previews (e.g. a claude.ai artifact) can't run Google sign-in.
  const sandboxed = origin === "null" || /claude|anthropic|usercontent/.test(window.location.hostname);
  const valid = looksLikeClientId(id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard refused; the text is selectable */
    }
  };

  const connect = async () => {
    // Empty custom field = go back to the built-in client ID.
    if (custom) sync.saveClientId(id);
    setBusy(true);
    const ok = await sync.connectGmail();
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Sheet title="Sambungkan Gmail" onClose={onClose}>
      {sandboxed ? (
        <div className="notice warn">
          <b>Preview ini tidak bisa login Google.</b>
          <span>Buka CashTracker dari websitenya untuk pakai Gmail asli:</span>
          <a href={PAGES_URL} target="_blank" rel="noreferrer">{PAGES_URL}</a>
        </div>
      ) : (
        <p className="muted">Login pakai akun Google kamu. Kobi cuma bisa <b>membaca</b> email transaksi, dan semuanya diproses di browser kamu.</p>
      )}

      {builtIn && !custom && (
        <button className="link" onClick={() => setCustom(true)}>Pakai Google Client ID sendiri</button>
      )}

      {custom && (
        <ol className="steps">
          <li>
            <b>Buat project & aktifkan Gmail API</b>
            <span>Di <a href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" target="_blank" rel="noreferrer">Google Cloud Console</a>, buat project baru lalu klik <i>Enable</i>.</span>
          </li>
          <li>
            <b>OAuth consent screen</b>
            <span>Pilih <i>External</i>, isi nama app, lalu tambahkan email Gmail kamu di <i>Test users</i>.</span>
          </li>
          <li>
            <b>Buat OAuth Client ID</b>
            <span>Credentials → Create credentials → OAuth client ID → <i>Web application</i>. Di <i>Authorized JavaScript origins</i> isi:</span>
            <div className="copy-row">
              <code>{origin}</code>
              <button className="chip" onClick={copy}><Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Tersalin" : "Salin"}</button>
            </div>
          </li>
          <li>
            <b>Tempel Client ID di sini</b>
            <input
              id="client-id"
              className="text-input"
              placeholder="1234-abcd.apps.googleusercontent.com"
              value={id}
              onChange={(e) => setId(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            {id && !valid && <small className="neg">Formatnya harus berakhiran .apps.googleusercontent.com</small>}
          </li>
        </ol>
      )}

      {sync.error && <div className="notice bad">{sync.error}</div>}

      <button className="btn wide" disabled={busy || sandboxed || (custom && !valid && !(builtIn && !id))} onClick={connect}>
        <Icon name="mail" size={18} /> {busy ? "Menghubungkan…" : "Login dengan Google"}
      </button>
      <p className="fine"><Icon name="lock" size={14} /> Akses read-only. Token cuma disimpan di memori, hilang saat tab ditutup.</p>
    </Sheet>
  );
}
