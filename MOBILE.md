# Mobile plan — taking Veridian Markets to iOS & Android

> Planning notes for the native apps. Built **after** Phase 2 (page polish), and
> intended to run on the existing web app's design language. The web app is the
> visual spec; this is how we turn it into apps.

## Where this sits in the roadmap

1. **Phase 2 — refine every page** (consistency across the site + user
   functionality). Do this on the current repo, unchanged.
2. **Build the native apps** (this doc).
3. **Then** wire real data: external APIs (market data, e.g. Finnhub) + AWS
   (Cognito auth, Aurora-Postgres-or-DynamoDB, S3, via Amplify Gen 2) + **Stripe**
   for the Free / Plus / Pro / Business tier subscriptions.

Machine: day-to-day work is on Windows, but a **MacBook is available**, so native
iOS / Xcode is on the table.

## Build path — recommended: Expo / React Native

The app is already React, which decides the smart path.

| Path | What it means | Effort | Native feel | Mac needed? |
|---|---|---|---|---|
| **Capacitor** (wrap web app) | Existing web UI runs in a native shell; gains push/biometrics/etc. | Low | Good (WebView) | iOS build only |
| **React Native + Expo** ⭐ | One React codebase → real native iOS + Android. Rewrite the **view layer** (`<div>`→`<View>`, CSS→`StyleSheet`, Tabler icons→RN icons, SVG→`react-native-svg`) but **reuse logic, state, data shapes, and design tokens**. | Medium | Excellent | No — EAS builds iOS in the cloud (or use the Mac) |
| **Native Swift + Kotlin** | Rebuild the UI twice, two languages. Web app is only a reference. | High | Best | Yes |

**Reuse reality:** ~40–60% *conceptually* transfers to React Native (logic, data,
design tokens, navigation ideas, taste) but ~0% copy-paste of JSX/CSS. Capacitor
reuses ~90% of the web app as-is. Native = start the UI from scratch.

**Recommendation: Expo / React Native** — keeps you in React, drops in the VM
design system (colours/type/spacing), gives one codebase for both stores, and
builds iOS without fighting Xcode. Capacitor is the fastest "ship the web app as
an app" fallback.

## Design / Figma

You already have a full design system and finished screens, and you iterate best
by **seeing things run**. So:

- **Do** sketch (Figma *or* paper) the **mobile navigation** — phones use a bottom
  **tab bar**, not the web's left rail. Likely tabs: **Home · Companies/Search ·
  Supply chain · Learn · Portfolio** (profile/admin tucked away). Also sketch any
  screen that must re-flow for a narrow touch screen.
- **Don't** re-draw in Figma the screens you've already designed on the web —
  build those directly and refine on the simulator.
- **Figma → Claude handoff:** there is no live Figma↔Claude link and Claude can't
  read a `.fig`. Share **screenshots/exports** or **describe** a screen; Claude
  builds it in Expo; you review on the simulator; iterate.

## Repo strategy — one repo, evolve to a monorepo (do NOT duplicate)

- **Don't duplicate the repo.** Two copies of the same product diverge and force
  manual sync forever.
- **When mobile starts, restructure this repo into a monorepo:**
  `apps/web`, `apps/mobile`, `packages/shared` (design tokens + business logic
  shared by both). Keeps history + `CLAUDEMemory.md`, and keeps web/mobile
  consistent automatically.
- With **Capacitor** instead, mobile lives *inside* the existing repo (adds
  `ios/` + `android/`), no new structure needed.
- A fresh `veridian-app` repo (migrate history with `git filter-repo`, archive the
  old one) is an acceptable alternative — a deliberate migration, not a copy.

### Deploy wrinkle
The web currently deploys via **GitHub Pages from main/root**. Adding a Vite build
+ monorepo changes *what* deploys (`apps/web/dist`, not root) — the Pages/Amplify
config updates at that step. Routine, just bundled with the restructure.

## How the GitHub workflow changes

- **"Merge = live" stops applying to the apps.** A release is build → TestFlight
  (iOS) / Play internal track → **store review (hours–days)** → release. The web
  side can keep merge-to-publish.
- **Stop committing build output;** `.gitignore` grows (`node_modules/`,
  `ios/Pods/`, `android/.gradle/`, build folders).
- **Releases become tag-driven** — git tags + GitHub Releases with real version +
  build numbers, per-platform notes.
- **CI/CD gets real** — GitHub Actions or **Expo EAS** build the `.ipa`/`.aab`,
  sign them, and submit to the stores.
- **Secrets** — signing certs, provisioning profiles, store + Stripe + AWS keys
  live as encrypted CI/EAS secrets, never in the repo.
- Branching itself barely changes; the existing feature-branch + iteration scheme
  still works (plus release tags).

## Mac setup checklist

1. **Xcode** (Mac App Store) + Command Line Tools (`xcode-select --install`).
2. **Node** (then Expo handles the RN toolchain).
3. **Claude Code** (CLI or VS Code extension), signed in.
4. **GitHub:** `gh auth login` (or SSH key), then `git clone` the repo.
5. Tell the new Claude session: *read `CLAUDEMemory.md` and `MOBILE.md` first.*

## Claude's role & limits on the Mac

- ✅ Build via terminal + files: scaffold the Expo app, port the VM theme, write
  screens/navigation/logic, run the iOS Simulator (`xcrun simctl`), drive
  `xcodebuild`/`eas`, and use GitHub via `git`/`gh` (once you've authenticated).
- ❌ No GUI clicks: Apple Developer signing, App Store Connect, Xcode dialogs, and
  Figma are yours to handle. Claude can't read `.fig` or sync Figma live.

## First running milestone

Mac setup → lock the tab navigation → port the VM design tokens → build the app
**skeleton with bottom-tab navigation** (empty screens) running on the simulator →
then fill screens one at a time, mock data first, real data later.

---
_See also: `README.md` (changelog), `CLAUDEMemory.md` (conventions), and the
AWS + payments service breakdown discussed for Phase 3._
