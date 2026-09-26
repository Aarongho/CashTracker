import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, EmailMessage, Transaction } from "./types";
import type { Action } from "./store";
import { gmailQuery, parseEmail } from "./lib/parsers";
import { mergeParsed } from "./lib/ledger";
import { CLIENT_ID, disconnect, fetchNewMessages, hasValidToken, requestToken } from "./lib/gmail";
import { demoInbox, randomLiveEmail } from "./lib/demo";

export type SyncMode = "gmail" | "demo" | null;
export type SyncStatus = "idle" | "syncing" | "error";

const MODE_KEY = "cashtracker:mode";
const HISTORY_DAYS = 30;
const DAY = 86_400_000;

function readMode(): SyncMode {
  try {
    return (localStorage.getItem(MODE_KEY) as SyncMode) ?? null;
  } catch {
    return null;
  }
}

export function useSync(state: AppState, dispatch: React.Dispatch<Action>, onNew: (txs: Transaction[]) => void) {
  const [mode, setModeRaw] = useState<SyncMode>(readMode);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const busy = useRef(false);

  const setMode = (m: SyncMode) => {
    setModeRaw(m);
    try {
      if (m) localStorage.setItem(MODE_KEY, m);
      else localStorage.removeItem(MODE_KEY);
    } catch {
      /* ignore */
    }
  };

  const ingest = useCallback(
    (emails: EmailMessage[]) => {
      const parsed = emails.map(parseEmail).filter((p) => p !== null);
      const { added } = mergeParsed(stateRef.current, parsed);
      dispatch({ type: "ingest", parsed, at: new Date().toISOString() });
      if (added.length) onNew(added);
    },
    [dispatch, onNew],
  );

  const syncGmail = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setStatus("syncing");
    try {
      const s = stateRef.current;
      const earliestBank = Math.min(...s.banks.map((b) => Date.parse(b.setAt)), Date.now());
      const after = s.lastSyncAt ? Date.parse(s.lastSyncAt) - 2 * DAY : earliestBank - HISTORY_DAYS * DAY;
      const emails = await fetchNewMessages(gmailQuery(Math.floor(after / 1000)), new Set(s.seenMessageIds));
      ingest(emails);
      setError(null);
      setNeedsReconnect(false);
      setStatus("idle");
    } catch (e) {
      setError((e as Error).message);
      setNeedsReconnect(true);
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }, [ingest]);

  const connectGmail = useCallback(async () => {
    try {
      await requestToken(true);
      setMode("gmail");
      setNeedsReconnect(false);
      await syncGmail();
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, [syncGmail]);

  const startDemo = useCallback(() => {
    setMode("demo");
    ingest(demoInbox());
  }, [ingest]);

  const simulateEmail = useCallback(() => ingest([randomLiveEmail()]), [ingest]);

  const stop = useCallback(() => {
    if (mode === "gmail") disconnect();
    setMode(null);
    setStatus("idle");
    setError(null);
  }, [mode]);

  // Live polling while Gmail is connected. The token lives in memory only, so after a
  // reload we need one click to reconnect (browsers block silent popups).
  useEffect(() => {
    if (mode !== "gmail") return;
    const tick = () => {
      if (!hasValidToken()) return setNeedsReconnect(true);
      if (document.visibilityState === "visible") void syncGmail();
    };
    tick();
    const id = window.setInterval(tick, state.settings.pollSeconds * 1000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [mode, state.settings.pollSeconds, syncGmail]);

  return {
    mode,
    status,
    error,
    needsReconnect: mode === "gmail" && needsReconnect,
    hasClientId: !!CLIENT_ID,
    connectGmail,
    syncGmail,
    startDemo,
    simulateEmail,
    stop,
  };
}
