# 🐷 CashTracker

Track your spending **live from Gmail**: bank notifications (BCA, Mandiri, BNI, BRI, Jago…), receipts (Apple, Netflix, Spotify, Steam, Gojek, Grab, Tokopedia, Shopee, PLN…), auto-categorized. You get per-bank balances, monthly insights, and **Kobi**, a piggy bank (celengan) mascot who gets angrier the more you spend on **Hiburan**.

<p>
  <img src="docs/onboarding.png" width="260" alt="Onboarding with Kobi">
  <img src="docs/home.png" width="260" alt="Home screen: Kobi is furious">
</p>

## How it works

1. **Onboarding**: enter your name, add each bank/e-wallet, and type its **current balance**. Then set a monthly Hiburan budget.
2. **Connect Gmail** (read-only). The app searches only for mail from known banks/merchants or receipt-like subjects, parses the amount/merchant, and **checks every 60 seconds** (configurable) while the tab is open.
3. **Balance per bank** = the balance you typed in − spending + income *after* that moment. Older emails still show up in insights but don't change the balance. You can reset a bank's balance any time in **Atur**.
4. **No double-counting**: an Apple/Netflix receipt and the matching BCA notification (same amount, within 3 days) are merged into one transaction. It keeps the bank from the notification and the name/category from the receipt.
5. **Categories**: Makanan, Transportasi, Belanja, Hiburan, Tagihan, Kesehatan, Transfer, Pemasukan, Lainnya. Categories are keyword-based. If you fix one by hand, you can tell it to "always categorize this merchant as X".
6. **Kobi's moods**, based on Hiburan vs. budget this month:

   | Hiburan / budget | Kobi |
   |---|---|
   | < 50% | 😊 happy (sparkles, bouncing) |
   | 50–80% | 😌 chill |
   | 80–100% (or Hiburan ≥ 50% of all spending) | 😰 worried (sweating) |
   | 100–150% | 😠 angry (steam, shaking) |
   | ≥ 150% | 🔥 furious (red, teeth, shaking hard) |

   Kobi also pops up a toast for every new transaction, and yells at you for Hiburan ones.

**Privacy:** there's no backend. Email is fetched and parsed in your browser, and data is stored in `localStorage` on that device. The Gmail token lives only in memory.

## Run it

```bash
npm install
cp .env.example .env   # add your Google OAuth client ID (see below)
npm run dev            # http://localhost:5173
```

Don't want to set up Google yet? Tap **Coba demo** on the home screen. It loads a sample inbox, and **✉️ Simulasi email masuk** fakes new emails arriving live.

```bash
npm test          # parser / ledger / mood unit tests
npm run build     # typecheck + production build in dist/
```

## Google setup (for real Gmail)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Gmail API**.
2. **OAuth consent screen**: set it to External, add the scope `.../auth/gmail.readonly`, and add your own Gmail address under **Test users**.
3. **Credentials → Create OAuth client ID → Web application**. Add `http://localhost:5173` (and your deployed URL, if any) to **Authorized JavaScript origins**.
4. Put the client ID in `.env` as `VITE_GOOGLE_CLIENT_ID=...` and restart `npm run dev`.

> `gmail.readonly` is a *restricted* scope. In "Testing" mode it works for up to 100 test users you list. Publishing publicly requires Google's verification and security assessment.

The access token expires after about 1 hour, and browsers block silent re-login popups. When that happens the status bar shows **Sambungkan lagi**, and one tap reconnects.

## Project layout

```
src/
  lib/parsers.ts     sender detection, amount/merchant extraction, Gmail query
  lib/categorize.ts  keyword → category rules
  lib/ledger.ts      merge/dedupe, per-bank balances, monthly stats
  lib/mood.ts        Kobi's mood + lines
  lib/gmail.ts       Google Identity Services token + Gmail REST calls
  lib/demo.ts        sample inbox for demo mode
  components/        Mascot (SVG Kobi), Onboarding, Home, Transactions, Insights, Settings
  useSync.ts         live polling / demo mode
  store.ts           reducer + localStorage persistence
```

## Adding a bank or merchant

Add an entry to `SOURCES` in `src/lib/parsers.ts` (sender regex, `bank` or `merchant`, optional default category), and add its domain to `gmailQuery`. Email formats change often, so if an email isn't picked up, paste its text into a test in `src/lib/parsers.test.ts` and adjust the patterns.
