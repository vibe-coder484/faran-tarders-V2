# 🌾 Faran Traders - Enterprise Business & ERP Management System
A high-performance, modern ERP and Business Management System tailored for commodities, wholesale, and retail trading businesses. It provides end-to-end automation from real-time stock and unified party ledgers to POS sales, purchase logistics, automated Profit & Loss reporting, and physical print suites.

---

## 📑 Table of Contents

- [Key Highlights & New Features](#-key-highlights--new-features)
- [System Architecture & Modules](#-system-architecture--modules)
  - [1. Executive Dashboard](#1--executive-dashboard)
  - [2. Sales & Point of Sale (POS)](#2--sales--point-of-sale-pos)
  - [3. Purchase Logistics & Inbound Stock](#3--purchase-logistics--inbound-stock)
  - [4. Inventory & Stock Movement Analytics](#4--inventory--stock-movement-analytics)
  - [5. Unified Party Ledgers (CRM)](#5--unified-party-ledgers-crm)
  - [6. Expense Tracking](#6--expense-tracking)
  - [7. Financial Profit & Loss Statements](#7--financial-profit--loss-statements)
  - [8. Professional A4 Print Suite](#8--professional-a4-print-suite)
  - [9. Advance Floating Trading Calculator](#9--advance-floating-trading-calculator)
  - [10. Database Backup & System Preferences](#10--database-backup--system-preferences)
- [Technology Stack](#-technology-stack)
- [Database Schema & Architecture](#-database-schema--architecture)
- [Getting Started & Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Environment Configuration](#environment-configuration)
  - [Supabase Database Setup](#supabase-database-setup)
- [Default Admin Credentials](#-default-admin-credentials)
- [Production Deployment](#-production-deployment)
- [Folder Structure](#-folder-structure)
- [License](#-license)

---

## ⚡ Key Highlights & New Features

- **🚀 Instant-Load Dashboard (SWR Caching)**: Consolidated parallel query pipeline combined with local memory caching for 0ms initial load times.
- **🧮 Advance Floating Trading Calculator**: Global draggable widget with `00`, `000`, `00k` rupee multipliers, calculation history tape, keyboard shortcuts (`Alt + C`), and agricultural unit converter (Maund/من ⇄ Kg, Bags ⇄ Kg).
- **💾 Complete Database Snapshot Export**: One-click JSON backup exporter across all 11 relational tables directly from Settings.
- **🛡️ Row-Level Security (RLS) Ready**: Complete PostgreSQL policies securing data while providing seamless access for authenticated operators.
- **🖨️ Zero-Clutter Physical Printing**: Instant A4-optimized sales receipts, vouchers, and statements with business header and zero browser UI artifacts.

---

## 📦 System Architecture & Modules

### 1. 📊 Executive Dashboard
- **Real-Time Financial Metrics**: Total Receivables, Total Payables, Net Business Balance, and Stock Assets.
- **Visual Trends**: Interactive Chart.js revenue, profit, and expense analytics over rolling time periods.
- **Automated Stock Alerts**: Instant notifications for items hitting or falling below threshold margins.
- **Top Party Summaries**: Instant visibility into top debit customers and top payable suppliers.

### 2. 🛒 Sales & Point of Sale (POS)
- **Multi-Item Billing**: Dynamic invoice generator with live quantity, unit rate, and row-total calculations.
- **Cash vs. Credit Support**: Toggle between immediate cash settlements and credit-based ledger debits.
- **Stock Synchronization**: Real-time stock deduction with out-of-stock guardrails.
- **Invoice Archive**: Filter, search, reprint, or reverse invoices with automated ledger rollback.

### 3. 📦 Purchase Logistics & Inbound Stock
- **Shipment Inward**: Record supplier consignments, purchase prices, carriage/freight costs, and miscellaneous expenses.
- **Auto-Restock**: Automated increment of warehouse stock counts.
- **Supplier Credit Automation**: Unpaid purchase balances automatically reflected in supplier accounts.

### 4. 🗄️ Inventory & Stock Movement Analytics
- **Product Catalog Master**: Manage items by categories, custom units (`Bags`, `Kg`, `Pcs`, `Liters`), and custom safety alerts.
- **Manual Stock Adjustments**: Log damage, shrinkage, or audit discrepancies with recorded reason codes in `stock_logs`.
- **Movement Reports**: Track Opening Stock, Inward, Outward, and Closing Balances over custom date filters.

### 5. 👥 Unified Party Ledgers (CRM)
- **Customer & Supplier Profiles**: Contact numbers, cities, party categorization (Regular / One-time), and opening balances.
- **Unified Transaction Ledger**: Comprehensive journal of Sales, Purchases, Receipts, and Payments with running net balance.
- **Customer Ledger Summaries**: Instantly view statement history for debt recovery or reconciliation.

### 6. 💸 Expense Tracking
- **Categorized Outflow**: Log daily business overheads (Utilities, Wages, Freight, Rent, Maintenance).
- **Date Filtering & Reports**: Filter operational expenditures by day, week, month, or custom date spans.

### 7. 📈 Financial Profit & Loss Statements
- **Automated Income Statement**: Real-time revenue minus Cost of Goods Sold (COGS) and operational expenses.
- **Net Margin Insights**: Immediate profit or loss calculation for any selectable fiscal period.
- **Executive PDF / Print Output**: Clean, numbers-focused presentation for stakeholder reviews.

### 8. 🖨️ Professional A4 Print Suite
- **Print Optimization**: Automatically formats all bills, invoices, and ledger statements for standard A4 paper.
- **Clean Output**: Navigation bars, action buttons, and sidebars are excluded during physical printing.
- **Branded Invoicing**: Includes localized business branding (Faran Traders, Sohdra Wazirabad).

### 9. 🧮 Advance Floating Trading Calculator
- **Global Availability**: Accessible across all dashboard pages (`Alt + C` shortcut).
- **Trading Buttons**: Rapid multi-zero entry (`00`, `000`, `00k`) tailored for large currency operations.
- **Agricultural Mandi Converter**:
  - Maund (من - 40 kg) ➔ Kilograms
  - Kilograms ➔ Maund (من)
  - Standard Bags (50 kg) ➔ Kilograms
  - Rate per Kg ➔ Rate per Maund (من)
- **History Tape**: Keeps track of recent calculations with single-click reload.
- **Direct Clipboard Integration**: One-click copy to paste straight into rate/amount inputs.

### 10. ⚙️ Database Backup & System Preferences
- **JSON Snapshot Backup**: Download all 11 database tables in a single structured JSON file.
- **Localization Settings**: Configurable default currency, language, and system timezones.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 |
| **Styling & Design** | Tailwind CSS v4, Vanilla CSS Design System |
| **Typography & Icons** | Plus Jakarta Sans, Outfit, FontAwesome Icons |
| **Routing** | React Router DOM v7 |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth |
| **Animations & UI** | Framer Motion, React Toastify |
| **Data Visualization** | Chart.js, React-Chartjs-2 |

---

## 🗄️ Database Schema & Architecture

The system runs on **Supabase PostgreSQL**. The complete, production-ready schema is preserved in [`Schema.sql`](./Schema.sql).

### Relational Schema Summary:

1. `customers`: Customer profiles, contact details, opening and current debit balances.
2. `suppliers`: Supplier profiles, contact details, opening and current payable balances.
3. `items`: Inventory master with stock levels, units, and minimum stock threshold.
4. `sales`: Header table for invoices, date, totals, payments, and balances.
5. `sale_items`: Line-item breakdown linking sales to products with quantity and rate.
6. `purchases`: Supplier purchase bills including freight and other expenses.
7. `purchase_items`: Line-item breakdown linking purchases to inventory.
8. `transactions`: Unified double-entry financial ledger records.
9. `expenses`: Operational business expenses categorized by type.
10. `notifications`: Stock warnings, payment reminders, and system alerts.
11. `stock_logs`: History of manual inventory adjustments with audit reasons.

---

## 🚀 Getting Started & Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0 or later)
- [npm](https://www.npmjs.com/) (v9.0 or later)
- A free [Supabase](https://supabase.com/) account and project

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/faran-traders.git
   cd faran-traders
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   ```

4. **Initialize Database Schema in Supabase**:
   - Go to your [Supabase Project Dashboard](https://supabase.com/dashboard).
   - Navigate to the **SQL Editor** tab.
   - Open [`Schema.sql`](./Schema.sql) from this repository, copy its entire content, paste it into the SQL Editor, and click **Run**.
   - Create your administrator user in Supabase under **Authentication > Users** (or use the default credentials).

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

6. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔑 Default Admin Credentials

Because this is a private business management system, public registrations are disabled. Use the administrator credentials configured in Supabase Auth:

- **Email**: `admin@gmail.com`
- **Password**: `admin123`

*(You can update password or add operators directly from the Supabase Authentication dashboard).*

---

## 🌐 Production Deployment

### Deploying to Vercel

1. Push your repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Production release"
   git remote add origin https://github.com/vibe-coder484/faran-tarders-V2.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**. Vercel will automatically build and publish the application.

---

## 📁 Folder Structure

```text
faran-traders/
├── public/                 # Static assets and icons
├── src/
│   ├── assets/             # Branding and image assets
│   ├── components/         # Reusable UI components
│   │   ├── Dashboard/      # TopNav, Sidebar, FloatingCalculator, DeleteModal
│   │   └── ...
│   ├── context/            # Global context (AuthContext, etc.)
│   ├── lib/                # Supabase client setup (supabase.js)
│   ├── pages/              # Primary route pages
│   │   ├── Dashboard/      # Sales, Purchases, Inventory, Customers, Suppliers,
│   │   │                   # Ledgers, Expenses, ProfitLoss, StockReport, Settings
│   │   │   └── Print/      # A4-optimized Printable Sale & Purchase Invoices
│   │   ├── Login.jsx       # Single-tenant authenticated login portal
│   │   └── Features.jsx    # Overview of ERP capabilities
│   ├── App.jsx             # Main application router
│   ├── main.jsx            # Entry point
│   └── index.css           # Global Tailwind CSS and design tokens
├── Schema.sql              # Complete PostgreSQL database schema & seed
├── package.json            # Node dependencies and build scripts
├── vite.config.js          # Vite build configuration
└── .env                    # Local environment variables (git-ignored)
```

---

## 📄 License

This software is developed exclusively for **Faran Traders**. All rights reserved.
Unauthorized copying, modification, distribution, or commercial use is strictly prohibited.
