import { useEffect, useReducer } from "react";
import type { AppState, Bank, Category, Settings, Transaction } from "./types";
import { mergeParsed } from "./lib/ledger";
import type { ParsedTx } from "./lib/parsers";

const KEY = "cashtracker:v1";

export const initialState: AppState = {
  onboarded: false,
  userName: "",
  banks: [],
  transactions: [],
  seenMessageIds: [],
  lastSyncAt: null,
  settings: { hiburanBudget: 500_000, sourceBank: {}, merchantCategory: {}, pollSeconds: 60 },
};

export type Action =
  | { type: "finishOnboarding"; userName: string; banks: Bank[]; hiburanBudget: number }
  | { type: "addBank"; bank: Bank }
  | { type: "updateBank"; bank: Bank }
  | { type: "removeBank"; id: string }
  | { type: "ingest"; parsed: ParsedTx[]; at: string }
  | { type: "addTx"; tx: Transaction }
  | { type: "updateTx"; tx: Transaction; rememberCategory?: boolean }
  | { type: "removeTx"; id: string }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "tour"; done: boolean }
  | { type: "purgeEmailData" }
  | { type: "reset" };

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "finishOnboarding":
      return { ...state, onboarded: true, userName: a.userName, banks: a.banks, settings: { ...state.settings, hiburanBudget: a.hiburanBudget } };
    case "addBank":
      return { ...state, banks: [...state.banks, a.bank] };
    case "updateBank":
      return { ...state, banks: state.banks.map((b) => (b.id === a.bank.id ? a.bank : b)) };
    case "removeBank":
      return {
        ...state,
        banks: state.banks.filter((b) => b.id !== a.id),
        transactions: state.transactions.map((t) => (t.bankId === a.id ? { ...t, bankId: null } : t)),
      };
    case "ingest":
      return { ...mergeParsed(state, a.parsed).state, lastSyncAt: a.at };
    case "addTx":
      return { ...state, transactions: [a.tx, ...state.transactions].sort((x, y) => y.date.localeCompare(x.date)) };
    case "updateTx": {
      const merchantCategory: Record<string, Category> = a.rememberCategory
        ? { ...state.settings.merchantCategory, [a.tx.merchant.trim().toLowerCase()]: a.tx.category }
        : state.settings.merchantCategory;
      const key = a.tx.merchant.trim().toLowerCase();
      return {
        ...state,
        settings: { ...state.settings, merchantCategory },
        transactions: state.transactions.map((t) => {
          if (t.id === a.tx.id) return a.tx;
          // Remembering a category also re-labels earlier auto-categorized rows.
          if (a.rememberCategory && !t.manualCategory && t.merchant.trim().toLowerCase() === key) return { ...t, category: a.tx.category };
          return t;
        }),
      };
    }
    case "removeTx": {
      const gone = state.transactions.find((t) => t.id === a.id);
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== a.id),
        ignoredMessageIds: gone?.messageId ? [...(state.ignoredMessageIds ?? []), gone.messageId] : state.ignoredMessageIds,
      };
    }
    case "purgeEmailData":
      // Email-derived data only exists while Gmail is connected. Accounts, their
      // starting balances, manual transactions and category rules stay.
      return {
        ...state,
        transactions: state.transactions.filter((t) => !t.messageId),
        seenMessageIds: [],
        lastSyncAt: null,
      };
    case "settings":
      return { ...state, settings: { ...state.settings, ...a.patch } };
    case "tour":
      return { ...state, tourDone: a.done };
    case "reset":
      return initialState;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const s = JSON.parse(raw) as AppState;
    // Drop sample data left over from the old demo mode.
    const isDemo = (id?: string) => !!id && /^(demo|live)-/.test(id);
    return {
      ...initialState,
      ...s,
      // Also drop auto-detected entries an older parser misread from promo emails
      // ("Rp10 rb" read as Rp10). Their message IDs stay in seenMessageIds, so they don't return.
      transactions: (s.transactions ?? []).filter(
        (t) => !isDemo(t.messageId) && !(t.messageId && !t.manualCategory && t.amount < 500),
      ),
      seenMessageIds: (s.seenMessageIds ?? []).filter((id) => !isDemo(id)),
      settings: { ...initialState.settings, ...s.settings },
    };
  } catch {
    return initialState;
  }
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — app still works for this session */
    }
  }, [state]);
  return [state, dispatch] as const;
}
