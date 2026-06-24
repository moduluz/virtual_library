# Personal Library Manager 


A modern web application for managing your personal book collection, built with Next.js, TypeScript, and Supabase.

## Features

- 📚 Book Management: Add, edit, and organize your books
- 📊 Analytics: Track your reading progress and habits
- 🔍 Search: Find books in your collection
- 📑 Collections: Create custom collections to organize books
- 👤 User Profiles: Manage your reading preferences
- 🌓 Dark/Light Mode: Choose your preferred theme
- 🔐 Secure Authentication: Powered by Clerk

## Tech Stack

- **Framework:** Next.js 15.2.4
- **Language:** TypeScript
- **Authentication:** Clerk
- **Database:** Supabase
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Form Handling:** React Hook Form + Zod
- **Charts:** Recharts
- **Notifications:** Sonner

## Project Structure

```
library-app/
├── app/                      # Next.js app directory
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── add-book/       # Add new books
│   │   ├── analytics/      # Reading statistics
│   │   ├── books/         # Book management
│   │   ├── collections/   # Book collections
│   │   ├── dashboard/     # Main dashboard
│   │   ├── profile/       # User profile
│   │   └── search/        # Book search
│   ├── api/               # API routes
│   ├── sign-in/          # Authentication
│   ├── sign-up/          # Registration
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/              # UI components
│   ├── book-display.tsx # Book display component
│   ├── main-nav.tsx     # Navigation component
│   └── theme-provider.tsx # Theme management
├── hooks/               # Custom React hooks
├── lib/                # Utility functions
├── public/             # Static assets
├── styles/             # Additional styles
└── types/              # TypeScript types
```

## Key Files

- `app/layout.tsx`: Root layout with theme and auth providers
- `app/page.tsx`: Landing page
- `components/book-display.tsx`: Book display component
- `components/main-nav.tsx`: Navigation component
- `components/reading-charts.tsx`: Analytics charts
- `middleware.ts`: Authentication middleware
- `tailwind.config.ts`: Tailwind CSS configuration
- `next.config.mjs`: Next.js configuration

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
