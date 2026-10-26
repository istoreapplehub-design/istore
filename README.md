# LesTrades (Ghana)

An Apple Store-inspired physical e-commerce mobile application and backend tailored for Ghana, featuring localized Ghanaian Cedi (`₵X,XXX`) pricing and Paystack payment processing (Mobile Money: MTN MoMo, Telecel Cash, AT Money, and cards).

## 🚀 Features

- **Apple App Store & Shop Design System**: Custom Vanilla CSS and React Native Reanimated components styled with authentic Apple typography, colors, and shadows.
- **Hero Carousel**: Ken Burns continuous zoom effect with active animated dot indicators.
- **Dynamic Catalog**: Full product details for 26 Apple hardware models across 7 categories (iPhone, iPad, Mac, Apple Watch, AirPods, TV & Home, Accessories).
- **Interactive Variant Pickers**: Real-time color swatches and storage pills with spring animations and haptic feedback.
- **Region-based Delivery Calculation**: Live delivery fee updates for all 16 Ghanaian administrative regions (Greater Accra, Ashanti, Western, Eastern, Central, Volta, etc.).
- **Paystack Integration**: Full checkout supporting Mobile Money and card payments with verification callbacks.
- **Tracking & History**: 4-step vertical tracking timeline (*Order Placed* → *Payment Confirmed* → *Shipped* → *Delivered*), order history badges, and persistent wishlist.
- **Supabase PostgreSQL Database**: Cloud-hosted relational database seeded with 26 authentic Apple devices, 105 high-res image sets, and 78 Ghanaian verified customer reviews.

## 📁 Project Structure

```
├── backend/            # Express.js REST API with Prisma ORM & Paystack handlers
│   ├── prisma/         # PostgreSQL schema & seed scripts
│   ├── src/
│   │   ├── controllers/# Product, Category, Review, Order, Paystack controllers
│   │   ├── middleware/ # Auth, validation, and error handlers
│   │   ├── routes/     # Express route definitions
│   │   └── utils/      # Delivery fee tables, JSON helpers, Prisma client
├── mobile/             # React Native (Expo Router) mobile application
│   ├── app/            # File-based routing (Tabs, Product detail, Checkout, Orders, Wishlist)
│   ├── components/     # Reusable Apple design components (PriceTag, ProductCard, etc.)
│   ├── constants/      # Apple theme tokens, typography, and API configuration
│   ├── store/          # Persistent Zustand stores (Cart, Wishlist, User)
│   └── types/          # Strict TypeScript interfaces
```

## 🛠️ Getting Started

### 1. Backend

```bash
cd backend
npm install
npx prisma db push
npm start
```

### 2. Mobile App

```bash
cd mobile
npm install
npx expo start
```
