# I-Store - Backend API & Paystack Gateway

A localized Node.js & Express service handling Apple hardware inventory, Mobile Money (MTN MoMo, Telecel Cash, AT Money) and card processing via Paystack for I-Store.

## Features
- **Paystack Checkout Integration**: Initializes transactions in GHS pesewas (`POST /api/paystack/initialize`) and verifies payment references (`GET /api/paystack/verify/:reference`).
- **Webhook Processing**: Validates `charge.success` from Paystack servers.
- **Product & Category Catalog**: Localized apps, developer tools, education assets, and music packs tailored for Ghanaian creators.
- **Seller Management & Analytics**: Tracks real-time revenue in GHS, total downloads, and new app submissions.
- **Simulated Development Mode**: When run with test credentials, includes fully functional mock checkout verification so mobile and web clients can test end-to-end checkout without a live API key.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```

3. Start server:
   ```bash
   npm run dev
   # or
   npm start
   ```

The server runs on `http://localhost:5001`.

## Key Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/apps/featured` | Top 5 hero banner apps |
| `GET` | `/api/apps` | All products (supports `?category=`, `?q=`, `?type=free\|paid`) |
| `GET` | `/api/apps/:id` | Detailed metadata for a specific app |
| `GET` | `/api/categories` | Categories list |
| `POST` | `/api/paystack/initialize` | Initialize Paystack transaction with MoMo & card support |
| `GET` | `/api/paystack/verify/:ref` | Verify transaction and issue digital license |
| `POST` | `/api/paystack/webhook` | Paystack server webhook listener |
| `GET` | `/api/orders` | Current user order library |
| `GET` | `/api/seller/analytics` | Seller dashboard revenue and stats |
| `POST` | `/api/seller/apps` | Seller onboarding new app submission |
