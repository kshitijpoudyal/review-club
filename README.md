# Review Club

A modern React.js dashboard application built with TypeScript, Vite, Tailwind CSS, and Firebase to track Amazon product orders, reviews, and financial performance with cloud storage.

> **Disclaimer**: This website was fully created with the help of GitHub Copilot AI assistant.

## Features

- 🔐 **User Authentication**: Secure login with email/password and Google authentication
- ✅ **Cloud Storage**: All data stored in Firebase Firestore with user-specific collections
- ✅ **Real-time Sync**: Changes synchronized across all devices
- ✅ **Automatic Backups**: Every save creates a backup in Firestore
- ✅ **Product Management**: Add, edit, void products with status tracking
- ✅ **Advanced Filtering**: Filter by status, search, and financial deltas
- ✅ **Financial Tracking**: Track paid amounts, received amounts, and profit/loss
- � **PayPal Integration**: Import and manage PayPal transactions with CSV upload
- 📊 **Transaction Analytics**: Track PayPal income, fees, and transaction history
- 🔄 **Duplicate Prevention**: Automatic detection and prevention of duplicate transactions
- �📱 **Responsive Design**: Mobile-first design that works on all devices
- ⚡ **Fast Performance**: Built with Vite for lightning-fast development and builds
- 🎨 **Modern UI**: Beautiful gradient design with glass-morphism effects

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **State Management**: React Hooks (useState, useEffect, useMemo)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration
Update `src/firebase/config.ts` with your Firebase project credentials:
- Get your web app config from Firebase Console > Project Settings > General > Web apps
- Replace the placeholder values with your actual Firebase config

### 3. Start the Application
```bash
npm run dev
```

Access the dashboard at: **http://localhost:3000** (or the next available port)

## Firebase Project Details
- **Project ID**: `productreview-52e51`
- **Database**: Firestore
- **Authentication**: Email/Password and Google Sign-In
- **Collections**: 
  - `users/{userId}/products` - User-specific product records
  - `users/{userId}/dashboard` - User-specific summary statistics
  - `users/{userId}` - User profile information

## Authentication

### First Time Setup
1. **Create Account**: Choose "Create Account" and enter your email and password, or use Google Sign-In
2. **User Data**: Your profile and product data are automatically created and stored securely
3. **Data Isolation**: Each user has their own separate data collection - no data is shared between users

### Sign In Methods
- **Email/Password**: Standard authentication with secure password requirements
- **Google Sign-In**: Quick access using your Google account

## Usage

### Product Management
1. **Add Products**: Click "Add Product" to create new entries
2. **Edit Products**: Click "Edit" on any product row to modify details
3. **Void Products**: Use the void checkbox in edit mode to mark items as void
4. **Save Changes**: Click "Save to Firebase" to persist changes to the cloud

### PayPal Transaction Management
1. **Access Dashboard**: Navigate to the PayPal tab in the main navigation
2. **Import Transactions**: Upload PayPal CSV files using drag & drop
3. **View Analytics**: Monitor income, fees, and net earnings in real-time
4. **Filter & Search**: Find specific transactions using advanced filters
5. **Duplicate Prevention**: System automatically prevents duplicate imports

### Data Operations
- **Export**: Download current data as JSON
- **Refresh**: Pull latest data from Firebase
- **Reset**: Discard local changes and reload from Firebase

### Status Workflow
Products automatically move through statuses based on their properties:
1. **New** - Order placed but not delivered
2. **Review Not Added** - Delivered but review not added
3. **Review Pending** - Review added but not live
4. **Pending Refund** - Review screenshot sent, awaiting payment
5. **Complete** - All steps finished
6. **Void** - Marked as void (excluded from active workflow)

## Project Structure

```
src/
├── components/          # React components
│   ├── StatCard.tsx     # Statistics display cards
│   ├── ProductTable.tsx # Product data table
│   ├── FilterControls.tsx # Search and filter controls
│   ├── ProductToolbar.tsx # Action buttons and tools
│   ├── AddProductForm.tsx # New product form
│   └── EditableProductRow.tsx # Inline editing
├── hooks/              # Custom hooks for Firebase operations
│   ├── useFirebaseData.ts # Firebase data operations
│   └── useProductCrudFirebase.ts # CRUD operations
├── firebase/           # Firebase configuration
│   └── config.ts       # Firebase app configuration
└── types/              # TypeScript definitions
    └── Product.ts      # Product-related types
    └── PayPalTransaction.ts # PayPal transaction types
```

## Documentation

- **PayPal Dashboard**: See [README-PAYPAL-DASHBOARD.md](README-PAYPAL-DASHBOARD.md) for detailed PayPal transaction management documentation
- **Firebase Setup**: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase configuration
- **Product URL Feature**: See [PRODUCT-URL-FEATURE.md](PRODUCT-URL-FEATURE.md) for product URL functionality

## Firebase Console Access
- **Main Console**: https://console.firebase.google.com/project/productreview-52e51
- **Firestore Database**: https://console.firebase.google.com/project/productreview-52e51/firestore

## Build for Production

1. Create a production build:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory, ready for deployment.

## Security
- Service account credentials are in `.gitignore`
- Only authenticated requests can access the database
- Automatic backups provide data recovery options
