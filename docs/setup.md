# Development environment setup

How to get BuddyUp running on your own computer (Windows or macOS). Both partners develop
locally, push feature branches to GitHub, and merge through pull requests.

## 1. Install the tools

| Tool | Why | Windows | macOS |
|---|---|---|---|
| Git | Version control | `winget install Git.Git` (includes Git Bash, which Claude Code uses) | `xcode-select --install` or `brew install git` |
| fnm + Node.js 24 | Runtime (version pinned in `.nvmrc`) | `winget install Schniz.fnm` | `brew install fnm` |
| VS Code | Editor | `winget install Microsoft.VisualStudioCode` | `brew install --cask visual-studio-code` |
| Claude Code | AI coding (P3 graded) | PowerShell: `irm https://claude.ai/install.ps1 \| iex` | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Expo Go (phone, only for the stretch-goal app) | Run the mobile app on a real phone | App Store / Google Play | App Store / Google Play |
| Simulator (optional) | Run the mobile app without a phone | Android Studio emulator | Xcode iOS Simulator (Mac only) and/or Android Studio |

After installing fnm, set up your shell once (see `fnm --help` → `env`), then in the repo run:

```bash
fnm install
fnm use
node -v   # should print v24.x
```

Recommended VS Code extensions: ESLint, Tailwind CSS IntelliSense, Prisma, Playwright Test.

## 2. Get the code

```bash
git clone https://github.com/CharlieRK/buddyup.git
cd buddyup
npm install
npx playwright install   # browsers for E2E tests, once per machine
```

`.gitattributes` keeps line endings as LF on every OS, so Windows and macOS diffs match.

## 3. Environment variables

```bash
cp .env.example .env
```

Fill in `.env` with values shared privately by your partner (never through GitHub or a public
channel). `DATABASE_URL` exists once issue #1 (Neon) is done; `AUTH_SECRET` once #4/#5 start.
Don't paste `.env` contents into Claude Code.

## 4. Check that everything works

```bash
npm run dev          # http://localhost:3000
npm test && npx tsc --noEmit && npm run lint
npm run test:e2e     # desktop and mobile web (Pixel 7 viewport)
```

To try **mobile web** on a real phone: run `npm run dev -- -H 0.0.0.0`, then open
`http://<your computer's LAN IP>:3000` on a phone on the same Wi-Fi.

## 5. Mobile app (stretch goal; after the Expo scaffold issue lands)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. Campus Wi-Fi often blocks phone-to-laptop connections; if the app
can't connect, use `npx expo start --tunnel`. Point the app at your local API with
`EXPO_PUBLIC_API_URL` in `mobile/.env` (use your LAN IP, not `localhost`, on a real phone).

## 6. Claude Code

```bash
claude   # run inside the repo folder
```

Sign in once. Claude Code reads `CLAUDE.md` / `AGENTS.md` from the repo. Hooks, skills, and MCP
servers are added by issues #21–#24; after pulling them, restart Claude Code.

## 7. Daily workflow

```bash
git checkout main && git pull
git checkout -b feature/<issue>-<short-desc>
# ... red tests → commit → implement → commit ...
git push -u origin feature/<issue>-<short-desc>
```

Then open a PR (`Closes #<issue>`) and ask your partner to review. See AGENTS.md section 6.
