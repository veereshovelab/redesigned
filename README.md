# Vorynx - Zero-Barrier Crowdfunding Platform

![Version](https://img.shields.io/badge/version-v0.4.0-10B981?style=flat-square)
![Last Updated](https://img.shields.io/badge/last%20updated-September%202026-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-latest-646CFF?style=flat-square&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-realtime-3ECF8E?style=flat-square&logo=supabase)
![Firebase](https://img.shields.io/badge/Firebase-auth-FFCA28?style=flat-square&logo=firebase)

Vorynx is a modern crowdfunding and payment gateway platform built for creators, startups, and innovators. It seamlessly integrates direct UPI QR payment collection, transaction verification, and creator dashboards with Supabase and Firebase authentication.

## 🚀 Features

- **Direct UPI Backing**: Generate NPCI-compliant dynamic UPI QR codes and accept zero-fee payments directly.
- **Multi-Currency Toggle**: Instant dynamic currency conversion between USD ($) and INR (₹) across all goals, pledges, and dashboard analytics.
- **Light & Dark Mode Switcher**: 1-click seamless theme toggle with persistent user preference and dynamic color token transition.
- **Campaign Bookmarking & Favorites**: Save and manage favorite campaigns with reactive localStorage persistence and dedicated "Saved" category views.
- **Advanced Sorting & Discovery**: Real-time campaign sorting by Trending, Most Funded, % Funded, Ending Soonest, and Most Backers.
- **Interactive Sub-Tag Filters**: 1-click filtering by popular tags (`#Hardware`, `#Privacy`, `#Tabletop`, `#Ergonomics`, `#Travel`, `#Wireless`) with reactive tag reset controls.
- **Enhanced Toast Notification Center**: Context-aware toast alerts supporting success, warning, and info status variants with instant dismiss controls.
- **Interactive Share Modal & Mobile QR**: 1-click clipboard link copying, social sharing (WhatsApp, X/Twitter, LinkedIn, Reddit), and live mobile QR scanning.
- **Project Roadmap & Milestone Tracker**: Interactive visual progression tracking across Prototype Verification, Crowdfunding, Tooling, and Global Backer Fulfillment.
- **Stretch-Goal Unlock Milestones**: Interactive 100%, 125%, 150%, and 200% community funding goal tiers with live unlock badges and remaining targets in active currency.
- **Pledge Impact Calculator**: Real-time calculator widget enabling prospective backers to simulate custom pledge amounts and preview immediate funding % boosts and milestone progression.
- **Backers & Receipts CSV Export**: 1-click export of transactions, UTR IDs, amounts, and dates in Creator and Admin consoles.
- **Executive Pitch & Summary Report Generator**: Printable PDF pitch report and JSON export modal with velocity metrics, QR code, and 1-click clipboard summary copy.
- **Global Command Palette (`Ctrl+K` / `Cmd+K`)**: Spotlight-style glassmorphic command search modal with arrow key navigation, instant fuzzy filtering for views, 2FA security, theme/currency settings, and live campaign discovery.
- **Keyboard Shortcuts & Power UX**: Press `Ctrl+K` or `Cmd+K` for the command palette, press `/` anywhere to focus search, press `Escape` to close active modals, and use floating smooth scroll-to-top.
- **Quick Pledge Boost Presets**: Instant +$5, +$10, +$25, +$50, and +$100 one-click pledge increments in checkout with real-time currency calculation.
- **Creator Dashboard**: Monitor campaign metrics, track gross/net proceeds, platform fee breakdown, and transaction status.
- **Admin Approval Console**: Review campaign proposals, verify funder UTR transaction IDs, and approve live campaigns.
- **Multi-Auth Support**: Email/password, passwordless email links, Google, and GitHub OAuth powered by Firebase Auth.
- **Two-Factor Authentication (2FA)**: RFC 6238 TOTP authenticator integration (Google Authenticator, Authy, 1Password) with dynamic QR code setup wizard, 6-digit verification, and downloadable single-use backup recovery codes.
- **Serverless Payment Webhooks**: HMAC-SHA256 signature verification for Razorpay and Cashfree gateway webhooks to automatically mark donations as successful and update project funding metrics.
- **Real-time Database**: Powered by Supabase for real-time campaign status and donation tracking.
- **Responsive Modern UI**: Sleek dark/light theme, micro-animations, and mobile-responsive layouts.


## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Authentication**: Firebase Auth (OAuth & Passwordless)
- **Database & Storage**: Supabase
- **Utilities**: QRCode.js, FontAwesome

## 💻 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/veereshovelab/redesigned.git
   cd redesigned
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open a pull request or file an issue on GitHub.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is open source. See the repository for licensing details.

---

## 📝 Changelog

### Version 0.4.0 (September 2026)
- Added **Executive Pitch & Summary Report Generator** (`ExecutiveSummaryModal`) with printable PDF formatting, dynamic velocity metrics, NPCI QR code, and JSON payload export.
- Enhanced **Glassmorphism & Neon Glow Styling** with translucent backdrop cards, glowing border physics, and dynamic micro-animations.
- Added 1-click clipboard summary copy for rapid investor and backer communication.

### Version 0.3.0 (September 2026)
- Added **Global Command Palette (`Ctrl+K` / `Cmd+K`)** spotlight search modal for rapid keyboard navigation, theme/currency switching, 2FA settings, and live campaign discovery.
- Added dedicated `Cmd+K` navigation header trigger button.
- Updated project [CHANGELOG.md](CHANGELOG.md) documenting release history and version tracking.

See [CHANGELOG.md](CHANGELOG.md) for full release history.