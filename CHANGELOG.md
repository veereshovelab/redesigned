# Changelog

All notable changes to the **Vorynx** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0] - 2026-09-24

### 🚀 Added
- **Backer Hall of Fame & Supporter Leaderboard (`BackerHallOfFameModal`)**:
  - Interactive community supporter wall modal displaying top contributor rankings with custom badges (Gold Crown #1, Silver Shield #2, Bronze Star #3).
  - Real-time backer activity stream feed showing verified pledges and timestamps.
  - Community Achievement Trophy milestones (e.g. *First 100 Backers*, *50% Funding Threshold*, *100% Core Funded*, *Super Backer Club*).
  - 1-click **Copy Leaderboard Roster** for campaign creator updates and social announcements.
  - Integrated "Hall of Fame" button on campaign detail views and spotlight command item in Global Command Palette (`Ctrl+K`).

---

## [0.5.0] - 2026-09-24

### 🚀 Added
- **Campaign Velocity & Goal Forecast Simulator (`CampaignAnalyticsModal`)**:
  - Interactive funding velocity analytics & trajectory projection modal for all campaigns.
  - Interactive sliders for **Daily New Backers Rate** (1 - 50 backers/day) and **Projected Average Pledge Amount** ($5 - $500).
  - Real-time funding outcomes forecasting: Projected Total Raised, Goal Surplus/Deficit, Final Backer Count, and Stretch Goal Unlocks (100%, 125%, 150%, 200%).
  - Multi-currency support across USD ($), INR (₹), EUR (€), and GBP (£).
  - 1-click **Copy Forecast Report** action for pitch sharing.
  - Integrated "Analytics" action button on campaign detail views and spotlight command item in Global Command Palette (`Ctrl+K`).

---

## [0.4.0] - 2026-09-21

### 🚀 Added
- **Executive Pitch & Summary Report Generator**:
  - Interactive printable PDF pitch deck & summary report modal (`ExecutiveSummaryModal`) for all campaigns.
  - Performance & velocity metrics breakdown (Pledged, Goal, % Funded, Backers, Daily Velocity).
  - Dynamic NPCI QR Code rendering for direct UPI donation support.
  - 1-click **Print / Save PDF** export action formatted with clean `@media print` CSS rules.
  - 1-click **Export JSON Summary** downloading full structured campaign pitch payload (`.json`).
  - 1-click **Copy Pitch Summary Text** for instant email and update sharing.
  - Integrated "Pitch Report" button in campaign detail view and spotlight action in Global Command Palette (`Ctrl+K`).

### 🎨 Visual Aesthetics & UX Upgrade
- **Glassmorphism & Neon Glow Styling**:
  - Implemented translucent backdrop glassmorphism on campaign cards, hero spotlight, and overlay modals.
  - Added multi-color neon glow border hover physics and subtle animated aura lighting on curated spotlight cards.
  - Enhanced category tag chip active glow states and button hover reflections.

---

## [0.3.0] - 2026-09-16

### 🚀 Added
- **Global Command Palette (`Ctrl+K` / `Cmd+K`)**:
  - Spotlight-style glassmorphic command search modal with instant fuzzy search across platform actions and live campaigns.
  - Keyboard navigation controls (Arrow Up / Arrow Down, Enter to execute, Escape to dismiss).
  - Quick action commands: Navigation (Home, Start Campaign, Creator Dashboard, Admin Console, UPI QR), Security (2FA, Portfolio, Shortcuts), and Preferences (Theme toggle, USD/INR currency switches).
  - Dynamic campaign discovery: search and jump straight to any approved campaign detail view.
  - Added dedicated `Cmd+K` trigger button in the main navigation header.

---

## [0.2.0] - 2026-09-16

### 🚀 Added
- **Two-Factor Authentication (2FA) & TOTP Integration**:
  - Full RFC 6238 Time-Based One-Time Password (TOTP) standard implementation compatible with Google Authenticator, Authy, 1Password, and Microsoft Authenticator.
  - Interactive multi-step setup wizard featuring live QR Code rendering, manual secret key display with 1-click clipboard copy, and code verification.
  - Clock skew window tolerance (±30s) verification for reliable authentication.
  - Single-use 8-character backup recovery codes with 1-click clipboard copy and downloadable `.txt` backup file export.
  - Reactive 2FA activation status banner and security revocation controls in user account settings.

### 🎨 Security & UX Improvements
- Integrated context-aware toast notifications for 2FA activation, disabling, and code verification steps.
- Security badge indicator and responsive modal dialogs.

---

## [0.1.0] - 2026-09-09

### 🚀 Added
- **Community Q&A Filtering & Toast Notifications**:
  - Community question and answer section with reactive category filters and search.
  - Instant upvote micro-interactions with context-aware toast alerts.
- **UI Smoothness & Micro-Interactions Upgrade**:
  - Smooth page view transition animations and dynamic hover effects.
- **Navbar Styling**:
  - Gradient logo icon, background shine animations, and BETA status badge.
- **Documentation**:
  - Standardized badges, contributing guidelines, and setup documentation in `README.md`.
