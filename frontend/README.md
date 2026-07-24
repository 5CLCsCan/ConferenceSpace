# ConferenceSpace Frontend

Next.js 15 (App Router) frontend for ConferenceSpace, an AI-powered academic conference management platform.

## Tech Stack

- Next.js 15 (App Router), TypeScript, React 18
- Tailwind CSS v4, shadcn/ui
- Vitest + Testing Library for tests

## Prerequisites

- Node.js 18+
- pnpm (this project pins `packageManager: pnpm@9.15.0` in `package.json`)
- A running backend (see `/backend`) and, for AI features, the AI service (see `/ai-service`)

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Available Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server (after build)
pnpm lint             # Run ESLint
pnpm test             # Run tests with Vitest (watch mode)
pnpm test:run         # Run tests once
pnpm test:coverage    # Run tests with coverage report
pnpm pretty           # Format with Prettier
pnpm pretty:check     # Check formatting without writing
pnpm i18n:audit       # Audit translation keys/locales
```

## Environment Variables

Copy `.env.example` to `.env.local` and adjust as needed:

- `NEXT_PUBLIC_API_BASE_URL` — client-side backend API URL
- `BACKEND_API_BASE_URL` — server-side backend API URL (used by Next.js API routes)
- `AI_SERVICE_BASE_URL` — AI service base URL
- `JWT_EXPIRY_SECONDS` — JWT expiry used by auth flows
- `NODE_ENV` — environment (development/production)

## Project Structure

```
frontend/
├── app/           # Next.js App Router pages
│   ├── api/       # API routes (proxy to backend)
│   ├── dashboard/ # Main dashboard
│   └── (auth)/    # Login/register pages
├── components/    # React components by domain
│   ├── author/    # Author-specific UI
│   ├── chair/     # Chair/PC member UI
│   ├── reviewer/  # Reviewer UI
│   ├── coi/       # Conflict of interest
│   └── ui/        # shadcn/ui base components
├── lib/           # Utilities, API clients, contexts
├── hooks/         # Custom React hooks
├── locales/       # i18n translation files
└── public/        # Static assets, onboarding images, templates
```

## Styling Conventions

When creating or modifying UI components, reference the styling convention docs in `.steerings/`:

- `.steerings/insights.md` — design insights and patterns
- `.steerings/sizings.md` — sizing conventions (font sizes, spacing, etc.)
- `.steerings/component_styling.md` — component-level styling guidance

## Testing

Tests run with Vitest and Testing Library:

```bash
pnpm test:run
```
