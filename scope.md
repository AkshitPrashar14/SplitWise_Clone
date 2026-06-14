# Project Scope: Splitwise Clone

## 1. Objective
To build a fully functional, production-ready full-stack web application that allows users to seamlessly track shared expenses, manage groups, and calculate simplified debts among friends, flatmates, or travel companions.

## 2. Core Features (In-Scope)

### User Authentication & Management
- Secure user registration and login using NextAuth.js (Credentials Provider).
- Password hashing using bcrypt for security.
- **"Ghost User" capability**: Users can dynamically type the names of friends who do not yet have accounts while creating an expense. The system will automatically generate tracking profiles for them and calculate their debts seamlessly.

### Group Management
- Creation of dynamic groups (e.g., "Goa Trip", "Apartment 4B").
- Ability to invite or add multiple participants to a group.
- Centralized group dashboard to view total group spending and individual net balances.

### Expense Tracking & Splitting Engine
- Ability to add detailed expenses with descriptions and currency selection (e.g., INR, USD).
- Support for complex, real-world splitting logic:
  - **Equal Split:** Divide the total bill evenly among selected participants.
  - **Exact Split:** Specify the exact monetary amount each participant owes.
  - **Percentage Split:** Split the bill by specific percentage allocations.
  - **Share/Ratio Split:** Divide by unit shares (e.g., Person A pays 2 shares, Person B pays 1 share).
- Precision math handling to ensure no floating-point rounding errors (1-cent remainders are dynamically distributed).

### Advanced Debt Simplification
- An underlying algorithmic engine (`src/lib/balances.ts`) that automatically analyzes complex, overlapping group debts and condenses them into the minimum possible number of transactions (e.g., if A owes B $10, and B owes C $10, it simplifies to A owes C $10).

### Settlement System
- Users can record payments ("Settle Up") to clear outstanding balances with specific group members.
- Instant reflection of settled debts on the group dashboard.

### User Interface & Experience
- Responsive, modern "Glassmorphism" inspired design.
- Fluid, app-like modal interactions and transitions powered by Framer Motion.
- Robust, zero-reload theming engine with four switchable aesthetic themes (Light, Dark, Sunset, Oceanic) driven by CSS variables.

## 3. Out of Scope (Future Enhancements)
- Third-party OAuth integration (Google/GitHub login).
- Real-time websocket push notifications for new expenses.
- Native mobile applications (iOS/Android) via React Native.
- Direct integration with banking APIs for actual fund transfers (e.g., Stripe, Plaid).
