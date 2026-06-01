# Veridian Markets — iOS kit

The native **iOS app** workspace. Sibling to [`../web/`](../web/) (the React web
app), which is the **visual + UX reference** for everything built here. You're
writing this **natively in Xcode (Swift / SwiftUI)** — the web code does **not**
port; treat the web app as the design spec, not source.

See the repo-root [`MOBILE.md`](../../MOBILE.md) for the wider mobile plan.

## Getting started in Xcode

1. In Xcode: **File ▸ New ▸ Project… ▸ iOS ▸ App**, interface **SwiftUI**,
   language **Swift**. Save it **into this folder** (`ui_kits/iOS/`).
2. Add the brand fonts to the project (so `.custom(...)` in `VeridianTheme.swift`
   resolves): download **Spectral** and **JetBrains Mono** from Google Fonts, drag
   the `.ttf`s into the project ("Copy items if needed", add to target), and list
   them under **Fonts provided by application** (`UIAppFonts`) in Info.
3. Drop in [`VeridianTheme.swift`](VeridianTheme.swift) — the VM colours + font
   helpers, ready to use (`VM.forest`, `VM.serif(28, .bold)`, …).

## Navigation (mobile shape)

Phones use a **bottom tab bar** (not the web's left rail). Suggested tabs, mapped
from the web nav:

- **Home** · **Companies/Search** · **Supply chain** · **Learn** · **Portfolio**
- Profile / Settings / Admin live behind the profile area, not the tab bar.

## Conventions

- Keep the editorial look: serif (Spectral) for headlines/prose, mono (JetBrains
  Mono) for tickers/labels/numbers; warm paper + ink + one green. Match the web
  app screen-for-screen where it makes sense.
- **Git:** commit the Xcode project, but add a Swift/Xcode `.gitignore`
  (`DerivedData/`, `*.xcuserstate`, build output, `Pods/` if you use CocoaPods).
  Don't commit build artefacts.
- This is `ui_kits/iOS/` — the web app stays the source of truth for product
  decisions until the apps reach parity.
