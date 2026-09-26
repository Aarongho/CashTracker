import { useCallback, useEffect, useState } from "react";
import type { Transaction } from "./types";
import { useAppState } from "./store";
import { useSync } from "./useSync";
import { Onboarding } from "./components/Onboarding";
import { Home } from "./components/Home";
import { Transactions } from "./components/Transactions";
import { Insights } from "./components/Insights";
import { Settings } from "./components/Settings";
import { TxEditor } from "./components/TxEditor";
import { Mascot } from "./components/Mascot";
import { GmailSetup } from "./components/GmailSetup";
import { Tour } from "./components/Tour";
import { EmailViewer } from "./components/EmailViewer";
import { ColorIcon, type ColorIconName } from "./components/icons";
import { LogoMark } from "./components/Logo";
import { preloadGis } from "./lib/gmail";
import { formatIDR, formatShort } from "./lib/money";
import { bankBalance, hematStreak } from "./lib/ledger";

type Tab = "home" | "tx" | "insight" | "settings";
const TABS: { id: Tab; label: string; icon: ColorIconName }[] = [
  { id: "home", label: "Beranda", icon: "home" },
  { id: "tx", label: "Riwayat", icon: "history" },
  { id: "insight", label: "Insight", icon: "insight" },
  { id: "settings", label: "Atur", icon: "settings" },
];

interface Toast {
  id: number;
  angry: boolean;
  text: string;
}

export default function App() {
  const [state, dispatch] = useAppState();
  const [tab, setTabRaw] = useState<Tab>("home");
  const [dir, setDir] = useState<"left" | "right">("right");
  const [gmailOpen, setGmailOpen] = useState(false);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const setTab = (t: Tab) => {
    const to = TABS.findIndex((x) => x.id === t);
    if (to === tabIndex) return;
    setDir(to > tabIndex ? "right" : "left");
    setTabRaw(t);
    window.scrollTo({ top: 0 });
  };
  const [editing, setEditing] = useState<Transaction | null | "new">(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => preloadGis(), []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const pushToasts = useCallback((items: Omit<Toast, "id">[]) => {
    const fresh = items.map((t, i) => ({ ...t, id: Date.now() + Math.random() + i }));
    // Keep at most 3 on screen; each one leaves on its own timer.
    setToasts((cur) => [...cur, ...fresh].slice(-3));
    for (const t of fresh) setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 4500);
  }, []);

  const onNew = useCallback(
    (txs: Transaction[]) => {
      // A big first import would spam; summarize it instead.
      if (txs.length > 3) return pushToasts([{ angry: false, text: `Kobi baca ${txs.length} transaksi dari email ✨` }]);
      pushToasts(
        txs.map((tx) => ({
          angry: tx.category === "Hiburan" && tx.direction === "out",
          text:
            tx.direction === "in"
              ? `Yay! ${formatIDR(tx.amount)} masuk dari ${tx.merchant} 💰`
              : tx.category === "Hiburan"
                ? `HEH! ${formatIDR(tx.amount)} buat ${tx.merchant}?! 😤`
                : `Kobi catat: ${formatIDR(tx.amount)} di ${tx.merchant}`,
        })),
      );
    },
    [pushToasts],
  );

  const sync = useSync(state, dispatch, onNew);

  if (!state.onboarded) {
    return (
      <Onboarding
        onDone={(userName, banks, hiburanBudget, connect) => {
          dispatch({ type: "finishOnboarding", userName, banks, hiburanBudget });
          // Called inside the tap so the Google popup isn't blocked.
          if (connect) void sync.connectGmail().then((ok) => !ok && setGmailOpen(true));
        }}
      />
    );
  }

  const openTx = (t: Transaction) => setEditing(t);

  return (
    <div className="app">
      <TopBar
        streak={hematStreak(state.transactions, state.banks.map((b) => b.setAt).sort()[0])}
        total={state.banks.reduce((sum, b) => sum + bankBalance(b, state.transactions), 0)}
        sync={sync}
        onSetupGmail={() => setGmailOpen(true)}
      />

      <main key={tab} className={`view enter-${dir}`}>
        {tab === "home" && <Home state={state} sync={sync} onOpenTx={openTx} onSeeAll={() => setTab("tx")} onSetupGmail={() => setGmailOpen(true)} now={now} />}
        {tab === "tx" && <Transactions state={state} onOpenTx={openTx} onAdd={() => setEditing("new")} />}
        {tab === "insight" && <Insights state={state} onOpenTx={openTx} />}
        {tab === "settings" && <Settings state={state} dispatch={dispatch} sync={sync} onSetupGmail={() => setGmailOpen(true)} onTutorial={() => { setTab("home"); dispatch({ type: "tour", done: false }); }} />}
      </main>

      <nav className="tabbar" data-tour="nav" style={{ "--i": tabIndex } as React.CSSProperties}>
        <span className="tab-pill" aria-hidden="true" />
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}>
            <span className="tab-icon"><ColorIcon name={t.icon} size={30} /></span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {state.onboarded && !state.tourDone && tab === "home" && !gmailOpen && (
        <Tour banks={state.banks} connected={sync.mode === "gmail"} onDone={() => dispatch({ type: "tour", done: true })} />
      )}

      {gmailOpen && <GmailSetup sync={sync} banks={state.banks} onClose={() => setGmailOpen(false)} />}

      {editing && (
        <TxEditor
          tx={editing === "new" ? null : editing}
          banks={state.banks}
          onClose={() => setEditing(null)}
          onViewEmail={(t) => setViewing(t)}
          onDelete={(id) => {
            dispatch({ type: "removeTx", id });
            setEditing(null);
          }}
          onSave={(tx, remember) => {
            dispatch(editing === "new" ? { type: "addTx", tx } : { type: "updateTx", tx, rememberCategory: remember });
            if (editing === "new" && remember) dispatch({ type: "updateTx", tx, rememberCategory: true });
            setEditing(null);
          }}
        />
      )}

      {/* After the editor so it stacks on top of it. */}
      {viewing && <EmailViewer tx={viewing} account={sync.account} onClose={() => setViewing(null)} />}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.angry ? "angry" : ""}`}>
            <Mascot mood={t.angry ? "angry" : "happy"} size={44} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopBar({ streak, total, sync, onSetupGmail }: { streak: number; total: number; sync: ReturnType<typeof useSync>; onSetupGmail: () => void }) {
  const status = sync.mode !== "gmail" || sync.needsReconnect ? "off" : sync.status;
  const label = sync.mode !== "gmail" ? "Sambungkan Gmail" : sync.account && !sync.needsReconnect ? `Live: ${sync.account}` : sync.needsReconnect ? "Gmail terputus, tap untuk sambungkan" : sync.status === "syncing" ? "Membaca Gmail" : "Gmail live, tap untuk sync";
  return (
    <header className="topbar" data-tour="topbar">
      <LogoMark size={34} />
      <div className="topbar-stats">
        <span className="tstat orange" title="Hari tanpa jajan Hiburan"><ColorIcon name="flame" size={26} />{streak}</span>
        <span className="tstat yellow" title="Total saldo"><ColorIcon name="coin" size={26} />{formatShort(total).replace("Rp", "")}</span>
        <button
          className={`tstat mail ${status}`}
          aria-label={label}
          title={label}
          onClick={sync.mode === "gmail" && !sync.needsReconnect ? sync.syncGmail : onSetupGmail}
        >
          <ColorIcon name="mail" size={26} />
          <span className="dot" />
        </button>
      </div>
    </header>
  );
}
