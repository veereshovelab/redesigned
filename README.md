# Vorynx - Zero-Barrier Crowdfunding Platform

Vorynx is a modern crowdfunding and payment gateway platform built for creators, startups, and innovators. It seamlessly integrates direct UPI QR payment collection, transaction verification, and creator dashboards with Supabase and Firebase authentication.

## 🚀 Features

- **Direct UPI Backing**: Generate NPCI-compliant dynamic UPI QR codes and accept zero-fee payments directly.
- **Creator Dashboard**: Monitor campaign metrics, track gross/net proceeds, platform fee breakdown, and transaction status.
- **Admin Approval Console**: Review campaign proposals, verify funder UTR transaction IDs, and approve live campaigns.
- **Multi-Auth Support**: Email/password, passwordless email links, Google, and GitHub OAuth powered by Firebase Auth.
- **Real-time Database**: Powered by Supabase for real-time campaign status and donation tracking.
- **Responsive Modern UI**: Sleek dark/light theme, micro-animations, and mobile-responsive layouts.

## 🛠️ Tech Stack

- **Frontend**: React, Vite
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