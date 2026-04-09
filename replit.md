# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a full-featured Arabic mobile ticket booking app "تذكرتك بتجيك ذحين - المطيري للحجز" with a shared PostgreSQL backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Mobile app**: Expo SDK 54 + Expo Router 4 (React Native)
- **Build**: esbuild (CJS bundle)

## Artifacts

### 1. `artifacts/mutairi-tickets` — Expo Mobile App
- Arabic RTL ticket booking app
- 5-tab navigation: Home, Book, Wallet, Transfers, Account
- Admin panel: email `888888000888`, password `888888000888`
- Allowed email domains: gmail.com, hotmail.com, live.com, yahoo.com
- Features: iOS-styled spinners/alerts, dark/light mode, multi-step booking, wallet top-up, card payment with admin review, STC Pay with admin review flow, FakePay subscription (50 SAR/week)
- **Push Notifications**: Expo Push Notifications (real out-of-app notifications) on transfer received, top-up approved, card/STC approved/rejected/code-requested, ticket received
- **Ticket Transfer**: Transfer tickets to any user by email, auto-fill name lookup, push notification sent to recipient
- **API calls go through Expo Router API route proxy** at `app/api/[...path]+api.ts` which forwards to localhost:8080
- AppContext (`context/AppContext.tsx`) uses `lib/apiClient.ts` — all data from shared PostgreSQL DB
- Polls API every 8 seconds for real-time updates across devices

### 2. `artifacts/api-server` — Express REST API
- Runs on port 8080 (assigned by Replit)
- Routes: `/api/auth/login`, `/api/auth/register`, `/api/users`, `/api/packages`, `/api/tickets`, `/api/transfers`, `/api/topup-requests`, `/api/card-payments`, `/api/stc-payments`
- CORS enabled for all origins
- Admin user auto-created on startup

### 3. `lib/db` — Database Package
- Drizzle ORM schema for PostgreSQL
- Tables: users, packages, tickets, transfers, top_up_requests, card_payment_requests, stc_payment_requests
- paymentMethod enum: link | card | both | stc | stc_link | stc_card | stc_both
- Push schema: `pnpm --filter @workspace/db run push`

## Key Commands

- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture: Data Sharing Across Devices

The Expo mobile app uses Expo Router API routes as a transparent proxy:
1. App calls `https://$REPLIT_DEV_DOMAIN/api/[endpoint]`
2. Expo web server handles via `app/api/[...path]+api.ts`
3. Proxy forwards to `http://localhost:8080/api/[endpoint]`
4. Express API server queries PostgreSQL
5. Returns shared data to all clients

This means ALL users (any device) see the same data in real-time.
