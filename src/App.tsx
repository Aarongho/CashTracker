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
import { formatIDR } from "./lib/money";

type Tab = "home" | "tx" | "insight" | "settings";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Beranda", icon: "🏠" },
  { id: "tx", label: "Transaksi", icon: "🧾" },
  { id: "insight", label: "Insight", icon: "📊" },
  { id: "settings", label: "Atur", icon: "⚙️" },
];

interface Toast {
  id: number;
  angry: boolean;
  text: string;
}

export default function App() {
  const [state, dispatch] = useAppState();
  const [tab, setTab] = useState<Tab>("home");
  const [editing, setEditing] = useState<Transaction | null | "new">(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [now, setNow] = useState(Date.now());

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
        onDone={(userName, banks, hiburanBudget) => dispatch({ type: "finishOnboarding", userName, banks, hiburanBudget })}
      />
    );
  }

  const openTx = (t: Transaction) => setEditing(t);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Cash<span>Tracker</span></span>
        <span className="muted">Hai, {state.userName}!</span>
      </header>

      <main>
        {tab === "home" && <Home state={state} sync={sync} onOpenTx={openTx} onSeeAll={() => setTab("tx")} now={now} />}
        {tab === "tx" && <Transactions state={state} onOpenTx={openTx} onAdd={() => setEditing("new")} />}
        {tab === "insight" && <Insights state={state} />}
        {tab === "settings" && <Settings state={state} dispatch={dispatch} sync={sync} />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {editing && (
        <TxEditor
          tx={editing === "new" ? null : editing}
          banks={state.banks}
          onClose={() => setEditing(null)}
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
