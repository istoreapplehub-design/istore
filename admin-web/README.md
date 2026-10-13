# iStore Hub & GhanaApps Admin

Desktop operations web application for managing Apple hardware inventory, processing Ghanaian customer orders, and monitoring revenue analytics.

## Local Development

```bash
cd admin-web
npm install
npm run dev
```

The web dashboard will be available at `http://localhost:5173`.

## Environment Variables

Ensure `admin-web/.env` contains:
```env
VITE_SUPABASE_URL=https://nxycejiuwpbocaiqwsdt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5001
```

## Production Build

```bash
npm run build
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Configure **Root Directory** as `admin-web`.
4. Add the environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (production backend endpoint)
5. Deploy to receive your production admin domain (e.g. `https://admin.istore.com.gh` or `https://admin.ghanaapps.shop`).
6. Register the Vercel production URL in **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**.
