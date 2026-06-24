<div align="center">

# 📚 Virtual Library

**A personal book library manager built for readers who mean business.**

Track your reading, manage collections, upload PDFs, and visualize your reading habits — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E699?logo=postgresql)](https://neon.tech/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-v5-purple)](https://authjs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

![Virtual Library Dashboard](https://placehold.co/1200x600/0f172a/e2e8f0?text=Virtual+Library+Dashboard)

</div>

---

## ✨ Features

- 📖 **Book Management** — Add, edit, and delete books with cover images, metadata, and reading status
- 📄 **PDF Upload** — Attach PDFs to any book, stored securely in the cloud via UploadThing
- 📊 **Analytics** — Reading progress charts, genre distribution, monthly stats, and reading goals
- 📁 **Collections** — Organize books into custom themed collections
- 🔍 **Search** — Search across your library by title, author, or genre
- 🔒 **Authentication** — Sign in with Google or email/password
- 🌙 **Dark Mode** — System-aware theme toggle
- 📱 **Responsive** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | [Next.js 15](https://nextjs.org) (App Router) | Full-stack React with SSR |
| Database | [Neon](https://neon.tech) (Serverless PostgreSQL) | **Always-on, never pauses on free tier** |
| ORM | [Prisma](https://www.prisma.io) | Type-safe DB access, easy migrations |
| Auth | [NextAuth.js v5](https://authjs.dev) | Google OAuth + email/password, self-hosted |
| File Storage | [UploadThing](https://uploadthing.com) | **Free PDF cloud storage, no credit card** |
| UI | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) | Beautiful, accessible components |
| Charts | [Recharts](https://recharts.org) | Reading analytics visualizations |

> **Why this stack?** The previous version used Supabase (pauses after 1 week of inactivity) and Clerk (paid). This stack is 100% free, stays online indefinitely, and is fully self-hosted.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free, sign up with GitHub/Google — no card)
- A [Google Cloud](https://console.cloud.google.com) project for OAuth
- An [UploadThing](https://uploadthing.com) account (free, sign up with GitHub — no card)

### 1. Clone and install

```bash
git clone https://github.com/moduluz/virtual_library.git
cd virtual_library
npm install
```

### 2. Set up environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:pass@host.neon.tech/neondb?sslmode=require"

# NextAuth — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
AUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (console.cloud.google.com → Credentials → OAuth 2.0 Client)
# Redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# UploadThing (uploadthing.com → Dashboard → Create App → Token)
UPLOADTHING_TOKEN="your-uploadthing-token"
```

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/        # Home with reading stats
│   │   ├── books/            # Book list, detail, and edit
│   │   ├── add-book/         # Add new book form
│   │   ├── collections/      # Collections management
│   │   ├── analytics/        # Reading charts & analytics
│   │   ├── search/           # Full library search
│   │   └── profile/          # User profile
│   ├── api/
│   │   ├── auth/             # NextAuth.js + registration
│   │   ├── books/            # Books CRUD + PDF upload
│   │   ├── collections/      # Collections CRUD
│   │   ├── stats/            # Reading statistics
│   │   ├── log-daily-reading/# Daily reading log
│   │   └── uploadthing/      # UploadThing file handler
│   └── auth/
│       ├── signin/           # Custom sign-in page
│       └── signup/           # Custom sign-up page
├── components/               # Reusable UI components
├── hooks/                    # Custom React hooks
├── lib/
│   ├── auth.ts               # NextAuth.js configuration
│   ├── prisma.ts             # Prisma client singleton
│   ├── uploadthing.ts        # UploadThing file router
│   ├── book-service.ts       # Book data access layer
│   └── collection-service.ts # Collection data access layer
└── prisma/
    └── schema.prisma         # Database schema
```

---

## 🗄️ Database Schema

```prisma
User       — Auth users (linked to NextAuth accounts)
Book       — Books with metadata, reading status, PDF URL
Collection — Named groups of books
BookCollection — Many-to-many join table
DailyReadingLog — Pages read per day for analytics
Account/Session — NextAuth.js tables
```

---

## 📜 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Deploy migrations (production)
npm run db:studio    # Open Prisma Studio GUI
npm run db:generate  # Regenerate Prisma client
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
