# Decision Log (Architecture Decision Record)

This document records all significant architectural, technical, and design decisions made during the development of this application, the alternative options considered, and the rationale behind the final choices.

---

## 1. Framework Architecture
**Decision:** Use **Next.js 14 (App Router)**.

- **Options Considered:** 
  1. Traditional MERN Stack (React frontend + Node.js/Express backend).
  2. React (Vite) + Firebase.
  3. Next.js 14.
- **Why we chose it:** Next.js provides a unified full-stack environment. By utilizing Next.js API routes, we eliminated the need to host and manage a separate backend server. The App Router offers superior performance optimizations, simplified routing, and seamless deployment integration with Vercel.

## 2. Database Paradigm & ORM
**Decision:** Use **PostgreSQL (Supabase)** with **Prisma ORM**.

- **Options Considered:** 
  1. NoSQL database (MongoDB with Mongoose).
  2. SQL database with a lightweight query builder (Knex.js or Drizzle).
  3. PostgreSQL with Prisma.
- **Why we chose it:** Financial applications (tracking debts, splits, and settlements) require strict relational integrity, foreign key constraints, and ACID compliance to ensure money is never mathematically lost. PostgreSQL provides this robust foundation, and Prisma offers unmatched TypeScript type-safety to prevent runtime errors when querying complex nested relationships (e.g., Groups -> Expenses -> Splits -> Users).

## 3. Handling Currency & Mathematical Precision
**Decision:** Store all monetary values as **Integers (Cents/Paise)** rather than Decimals.

- **Options Considered:** 
  1. Floating-point numbers (e.g., `100.50`).
  2. Prisma Decimal types.
  3. Integers (e.g., `10050` cents).
- **Why we chose it:** A fundamental computer science issue is that floating-point arithmetic introduces severe rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). By multiplying all incoming API requests by 100 and storing them as absolute integers, we completely eradicated floating-point drift. When splitting an expense equally (e.g., $100 / 3), we calculate the exact cents and programmatically assign the 1-cent remainder to the first payee to guarantee perfect balance parity.

## 4. Debt Simplification Algorithm
**Decision:** Compute simplified debts **On-The-Fly** using a mathematical Graph Reduction Algorithm.

- **Options Considered:** 
  1. Maintain a `net_balance` column in the database that updates every time an expense is created.
  2. Compute net balances dynamically from raw transactions on every request.
- **Why we chose it:** Storing rolling balances is highly prone to database desynchronization if historical expenses are edited, deleted, or fail mid-transaction. By calculating the balances on-the-fly (`src/lib/balances.ts`), we ensure the UI is always a 100% accurate reflection of the raw transaction logs. The Graph Reduction algorithm automatically detects circular debts (A owes B, B owes C) and collapses them into the mathematical minimum number of required transactions.

## 5. UI Theming Engine
**Decision:** Use raw **CSS Variables** managed by `next-themes`.

- **Options Considered:** 
  1. Standard Tailwind CSS Dark Mode (toggling a `dark` class).
  2. CSS-in-JS libraries (Styled Components, Emotion).
  3. CSS Variables mapped to Tailwind configuration.
- **Why we chose it:** The project required a premium, highly fluid interface with multiple visual identities. Standard Tailwind dark mode is strictly binary (Light vs Dark). By mapping Tailwind utility classes (like `bg-bg-app`) to raw CSS variables (`--bg-app`), we successfully implemented a robust, multi-theme engine supporting 4 distinct aesthetics (Light, Dark, Sunset, Oceanic) that users can switch between instantly with zero page reloads.

## 6. Unregistered User Handling ("Ghost Accounts")
**Decision:** Dynamically generate **"Ghost" User records** seamlessly during expense creation.

- **Options Considered:** 
  1. Force users to send an email invite and block expense creation until the friend registers.
  2. Allow text-only names in the `ExpenseSplit` table without linking to a User ID.
  3. Generate a dummy/ghost user record automatically.
- **Why we chose it:** Frictionless UX is paramount for a shared expenses app. If a user wants to quickly record a dinner bill, forcing them to wait for a friend to create an account is unacceptable. Generating a hidden "Ghost" profile maintains our strict database relational integrity (every split maps to a valid `userId`) while allowing the user to immediately track the debt.
