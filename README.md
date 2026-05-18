<div align="center">

<img src="public/logo-mark.svg" alt="Spendly" width="80" height="80" />

# Spendly

**Track your expenses. Stay in control.**

A personal expense tracker that runs entirely in the browser.
No accounts, no servers — your data stays on your device.

[![Built with Vite](https://img.shields.io/badge/Built_with-Vite_5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-0E5E4A?logo=googlechrome&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Storage](https://img.shields.io/badge/Storage-localStorage-36443F)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

</div>

---

## Preview

```
 ┌─────────────────────────────────────────┐
 │  [logo] Spendly       ◂ May 2026 ▸     │
 ├─────────────────────────────────────────┤
 │                                         │
 │  MONTHLY BUDGET                  Edit   │
 │  50,000                                 │
 │  ████████████░░░░░░░░░░░░  62%          │
 │  Spent: 31,200             Left: 18,800 │
 │                                         │
 │  Breakdown              ┌──────────┐    │
 │    ● Food      12,400   │  ╭────╮  │    │
 │    ● Transit    6,800   │  │ 31k│  │    │
 │    ● Shopping   5,200   │  ╰────╯  │    │
 │    ● Bills      4,100   └──────────┘    │
 │                                         │
 │  Recent Expenses                        │
 │  🍔 Food    Lunch · May 14     1,200    │
 │  🚗 Transit Uber  · May 13       800    │
 │  🛍️ Shopping · May 12    3,500    │
 │                                         │
 ├──────┬──────────┬───────────────────────┤
 │ Home │   [ + ]  │  Settings             │
 └──────┴──────────┴───────────────────────┘
```

---

## Features

| | Feature | Description |
|---|---|---|
| **Budget** | Monthly tracking | Set a budget, see spent vs remaining with a progress bar |
| **Breakdown** | Donut chart | Visual category breakdown with color-coded legend |
| **Expenses** | Full CRUD | Add, view, and delete expenses with category, note, and date |
| **Categories** | Customizable | 7 built-in categories + add your own |
| **Navigation** | Month by month | Browse any month's data with arrow controls |
| **Offline** | PWA support | Installable on mobile/desktop, works without internet |
| **Privacy** | 100% local | All data in localStorage — nothing leaves your device |

---

## Tech Stack

```
Frontend        Vanilla JavaScript (ES Modules)
Styling         CSS Custom Properties (Spendly Design System)
Typography      Geist + Geist Mono (Google Fonts)
Build           Vite 5
PWA             vite-plugin-pwa (Workbox)
Storage         localStorage
```

---

## Project Structure

```
spendly/
│
├── index.html              App shell and markup
│
├── src/
│   ├── main.js             App init and event wiring
│   ├── ui.js               DOM rendering (donut, lists, forms)
│   ├── store.js            localStorage data layer
│   └── style.css           Design system tokens and component styles
│
├── public/
│   ├── logo-mark.svg       Brand logo (emerald)
│   ├── logo-mark-light.svg Brand logo (light variant)
│   └── icon-*.png          PWA icons (192, 512)
│
├── design/                 Design system reference files
├── vite.config.js          Vite + PWA configuration
└── package.json
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

## Production Build

```bash
# Build for production
npm run build

# Preview the build locally
npm run preview
```

---

## Design System

The app follows the **Spendly Design System** — a warm, calm aesthetic for financial interfaces.

<table>
<tr>
<td width="50%">

**Colors**

| Role | Swatch | Value |
|---|---|---|
| Primary | ![#0E5E4A](https://img.shields.io/badge/-%20%20-0E5E4A) | `#0E5E4A` Emerald |
| Background | ![#F7F3EC](https://img.shields.io/badge/-%20%20-F7F3EC) | `#F7F3EC` Cream |
| Cards | ![#FFFFFF](https://img.shields.io/badge/-%20%20-FFFFFF) | `#FFFFFF` Paper |
| Text | ![#14201C](https://img.shields.io/badge/-%20%20-14201C) | `#14201C` Ink |
| Warning | ![#C18121](https://img.shields.io/badge/-%20%20-C18121) | `#C18121` Amber |
| Danger | ![#C9442E](https://img.shields.io/badge/-%20%20-C9442E) | `#C9442E` Clay |

</td>
<td width="50%">

**Category Palette**

| Category | Swatch | Color |
|---|---|---|
| Food | ![#D77B4D](https://img.shields.io/badge/-%20%20-D77B4D) | Terracotta |
| Transit | ![#2D5DA1](https://img.shields.io/badge/-%20%20-2D5DA1) | Deep Sky |
| Bills | ![#5C6A45](https://img.shields.io/badge/-%20%20-5C6A45) | Olive |
| Shopping | ![#C9442E](https://img.shields.io/badge/-%20%20-C9442E) | Clay |
| Health | ![#1FA38A](https://img.shields.io/badge/-%20%20-1FA38A) | Mint |
| Fun | ![#C18121](https://img.shields.io/badge/-%20%20-C18121) | Amber |
| Other | ![#6E7B75](https://img.shields.io/badge/-%20%20-6E7B75) | Slate |

</td>
</tr>
</table>

**Typography** — Geist (UI text) and Geist Mono (amounts, tabular numbers)
**Spacing** — 4px base grid
**Radii** — 6px inputs, 10px buttons, 20px cards, pill-shaped chips
**Shadows** — Soft and warm, never harsh

---

## Upcoming features
- [ ] Income tracking alongside expenses
- [ ] Daily 10pm reminder notification to log expenses
- [ ] Spending insights and rule-based tips
- [ ] Multi-currency support with conversion
- [ ] Receipt photo attachment
---

<div align="center">

Built with care

</div>
