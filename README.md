# Vorynx - Zero-Barrier Crowdfunding Platform

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
- **Keyboard Shortcuts & Power UX**: Press `/` anywhere to instantly focus discovery search, press `Escape` to close active modals, and use the floating smooth scroll-to-top button.
- **Quick Pledge Boost Presets**: Instant +$5, +$10, +$25, +$50, and +$100 one-click pledge increments in checkout with real-time currency calculation.
- **Creator Dashboard**: Monitor campaign metrics, track gross/net proceeds, platform fee breakdown, and transaction status.
- **Admin Approval Console**: Review campaign proposals, verify funder UTR transaction IDs, and approve live campaigns.
- **Multi-Auth Support**: Email/password, passwordless email links, Google, and GitHub OAuth powered by Firebase Auth.
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
   git clone https://github.com/your-username/Vorynx.git
   cd Vorynx
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