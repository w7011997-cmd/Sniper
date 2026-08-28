# Snooker App

Real-money 1v1 snooker/pool platform: challenge an opponent, both stake a bet,
spectators can side-bet on the match, players build a win/loss + star rating
history.

## Structure

```
snooker-app/
├── billiards-engine/   # forked tailuge/billiards (GPL-3.0) — physics + rendering, kept separate
├── web/                # the actual app: React + TypeScript + Vite, wrapped by Capacitor
│   ├── src/
│   │   ├── auth/         # Supabase auth
│   │   ├── challenges/   # send/accept/decline opponent requests
│   │   ├── betting/      # wallet, escrow, match bets, spectator bets
│   │   ├── dashboard/    # live matches, spectator view
│   │   ├── ratings/      # win/loss + star reviews
│   │   ├── game/         # wraps billiards-engine, syncs match state via Supabase
│   │   └── shared/       # supabase client, shared UI
│   └── capacitor.config.ts
├── supabase/
│   ├── migrations/     # DB schema
│   └── functions/      # Edge Functions — anything touching money/results runs here, not the client
└── .github/workflows/  # CI: builds web app, syncs Capacitor, builds Android APK
```

## Why the split

- **billiards-engine is GPL-3.0** — kept as its own module so the license
  obligation stays scoped to that code, not your betting/wallet logic.
- **Wallet balances are never written by the client.** RLS policies in
  `supabase/migrations/0001_init.sql` only allow users to *read* their own
  wallet. All balance changes go through service-role Edge Functions.
- **Match results should be settled server-side.** Two independent client
  physics sims can't be trusted to agree, and a client can't be trusted to
  self-report a win when money is on the line.

## Local setup (Termux)

```bash
cd web
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev             # opens a dev server; use --host to preview on your phone browser
```

## Building the APK

Don't build Android locally — push to `main` (or run the workflow manually)
and GitHub Actions builds the APK and uploads it as a downloadable artifact.
See `.github/workflows/build-android.yml`.

## Database

Apply `supabase/migrations/0001_init.sql` via the Supabase SQL editor or CLI
to set up profiles, wallets, challenges, matches, spectator_bets, and ratings.

## Status

Scaffold stage — folder structure, base config, and initial schema only.
Next: fork/vendor the billiards engine, wire up auth, build the challenge
flow, then betting + settlement Edge Functions.
