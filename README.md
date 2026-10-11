# Review Club

A progressive web app for tracking product-review orders end to end: what you ordered, where each review stands, what you paid, and what has been refunded. Data is stored per user in Firebase.

## Features

- **Product tracking**: add, edit and void products; each one moves through a review workflow with a clear next action.
- **Transactions**: record or import refund transactions (PayPal CSV or manual entry) and link them to products, with duplicate detection.
- **Needs attention**: quick filters for products waiting on a review, a screenshot or a refund, and for unlinked transactions.
- **Imports**: CSV import for products, a browser bookmarklet that pre-fills a product from a retailer order page, and optional Gmail scanning for order and payment emails.
- **AI review drafts**: generate a draft review for a product (Gemini, via a serverless function).
- **Reminders**: push notifications when a product sits in one status too long or a return window is about to close.
- **Vendors and payment methods**: manage the lists used in the product and transaction forms.
- **Installable**: works as a PWA with a phone-friendly layout, light and dark themes.
- **Authentication**: email/password and Google sign-in; every user's data is isolated.

### Status workflow

Products move through these statuses based on their dates and amounts:

1. **Order Placed**: ordered, not yet delivered
2. **Add Review**: delivered, review not written
3. **Review Pending**: review submitted, not yet live
4. **Send Screenshot**: review live, screenshot not sent
5. **Refund Pending**: screenshot sent, waiting for the refund
6. **Complete**: refund received
7. **Void**: written off and excluded from the active workflow

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Styling**: Tailwind CSS with design tokens as CSS variables (`src/index.css`), light and dark themes
- **UI components**: shadcn/ui (Radix primitives) in `src/components/ui`, plus sonner (toasts), vaul (mobile sheets), Motion (animation) and Recharts (charts)
- **Backend**: Firebase Authentication and Firestore; Firebase Cloud Functions for Gmail and push notifications
- **Serverless API**: a Vercel function in `api/` for AI review generation
- **PWA**: `vite-plugin-pwa` with a custom service worker (`src/sw.ts`)
- **Tests**: Vitest

## Getting started

Requires Node.js 22 (the version the Cloud Functions target) and npm.

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000.

### Configuration

- **Firebase web config** lives in `src/firebase/config.ts`. To point the app at your own project, replace the values with the ones from Firebase Console > Project Settings > General > Web apps.
- **Frontend environment variables** (optional, in `.env.local`):

  | Variable | Purpose |
  |---|---|
  | `VITE_VAPID_PUBLIC_KEY` | Public key for web push subscriptions |
  | `VITE_APP_ORIGIN` | Build-time fallback for the app URL the bookmarklet sends imports to; in the browser the current origin is always used |

- **Vercel function environment variables**:

  | Variable | Purpose |
  |---|---|
  | `GEMINI_API_KEY` | API key for AI review generation |
  | `GEMINI_MODEL` | Optional model override |

- **Cloud Functions secrets** (set with `firebase functions:secrets:set`): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REDIRECT_URI`, `APP_BASE_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |

Cloud Functions have their own scripts in `functions/package.json` (`build`, `serve`, `deploy`, `logs`).

## Project structure

```
api/                 Vercel serverless function (AI review generation)
functions/           Firebase Cloud Functions (Gmail scanning, push reminders)
public/              Icons and the product CSV import template
scripts/             Version bump script run by the pre-push hook
src/
├── components/      Feature components, grouped by area
│   ├── ui/          shadcn/ui primitives
│   └── common/      Shared building blocks (Modal, TableView, Toolbar, ...)
├── contexts/        React context providers (auth, vendors, transactions, ...)
├── firebase/        Firebase config and services
├── hooks/           Data and UI hooks
├── lib/             Small shared helpers (class merging, motion presets)
├── pages/           Route-level pages
├── router/          Route definitions and guards
├── types/           TypeScript types
├── utils/           Pure logic, parsers and style helpers (with tests)
└── sw.ts            Service worker
firestore.rules      Firestore security rules
```

## Deployment

- **Web app and `api/`**: deployed on Vercel (`vercel.json`).
- **Firestore rules, indexes and Cloud Functions**: deployed with the Firebase CLI (`firebase deploy`).
- **Versioning**: a pre-push hook bumps `src/utils/version.ts` on every push to `main`, aborts that push, and asks you to push again so the bump commit is included.

## Data model

Firestore data is scoped per user under `users/{userId}`, with subcollections including `products`, `paypal_transactions`, `vendors`, `paymentMethods`, `notifications`, `pushSubscriptions`, `gmailAccounts`, `settings` and the pending Gmail import queues. Access is restricted to the signed-in owner by `firestore.rules`.

## Security

- Service account credentials (`firebase-service-account.json`) and `.env*` files are git-ignored; never commit them.
- Firestore rules allow each user to read and write only their own data.
