# Project Scope, Database Schema, and Anomaly Log

## 1. Database Schema
The database is built using PostgreSQL (Supabase) and managed via Prisma ORM. The schema is designed to robustly handle complex, multi-user shared expenses.

### Core Entities:
- **User:** Stores authentication details and profile information (`id`, `name`, `email`, `passwordHash`).
- **Group:** Represents a collection of users sharing expenses (`id`, `name`, `currency`).
- **GroupMember:** A many-to-many join table tracking which Users belong to which Groups (`id`, `groupId`, `userId`).
- **Expense:** Represents a single transaction paid by a user (`id`, `groupId`, `paidById`, `amount`, `currency`, `splitType`). Note: `amount` is stored as an integer (cents/paise) to prevent floating-point errors.
- **ExpenseSplit:** Represents how much of the total expense is owed by individual users (`id`, `expenseId`, `userId`, `amount`).
- **Settlement:** Records real-world payments made between users to clear debts (`id`, `groupId`, `paidById`, `paidToId`, `amount`).

---

## 2. Anomaly Log (Data Problems & Resolutions)
*Note: Because this application dynamically generates and processes its own real-time data instead of relying on a static CSV file import, this anomaly log details the severe data integrity problems, edge cases, and algorithmic anomalies encountered and resolved during the system's development.*

### Anomaly 1: Unregistered User Data (The "Ghost User" Problem)
- **Problem:** When adding an expense, users frequently need to split costs with people who do not yet have an account in the system (e.g., typing a friend's name manually). A standard foreign-key database schema would throw a severe relational constraint error because the `userId` in the `ExpenseSplit` table would not map to an existing `User`.
- **Handling Strategy:** Implemented a dynamic "Ghost Account" generation system. When the API detects an unregistered name in an expense payload, it intercepts the request, seamlessly generates a hidden User account using a dummy email (`[name]_[timestamp]@splitwise.local`), binds them to the Group, and links their newly generated `userId` to the expense split. This prevents relational data anomalies while allowing a frictionless user experience.

### Anomaly 2: Floating-Point Division Inaccuracies (The 1-Cent Deficit)
- **Problem:** A fundamental computer science data anomaly occurs when splitting currencies. For example, splitting a ₹100.00 expense equally among 3 users results in ₹33.3333... per person. If truncated to ₹33.33, the sum of the splits (33.33 + 33.33 + 33.33 = ₹99.99) creates a permanent 1-cent deficit in the system, mathematically corrupting the database over time.
- **Handling Strategy:** 
  1. Converted the entire database schema to store all financial data as exact integers (cents/paise) rather than floats.
  2. Implemented an algorithmic check during the `POST /api/groups/[id]/expenses` route. It calculates the sum of all individual splits and compares it to the absolute total expense. If there is a remainder (e.g., 1 cent), the system programmatically assigns the deficit to the first user in the array, ensuring the database equation perfectly balances to 0.

### Anomaly 3: Graph Circularity (Redundant Debt Loops)
- **Problem:** In active groups, debt graphs quickly become circularly anomalous (e.g., User A owes User B ₹50, User B owes User C ₹50, and User C owes User A ₹50). Tracking these raw transactions directly in the UI creates an unreadable web of infinite micro-debts.
- **Handling Strategy:** Built a complex Graph Reduction Algorithm (`simplifyDebts` in `src/lib/balances.ts`). Instead of processing raw debts line-by-line, the system extracts the absolute net balance (total paid minus total owed) for every user, discards the raw relationship graph, and calculates the mathematical minimum number of transactions required to bring every net balance back to zero.

### Anomaly 4: "Me" Duplication Error (Session Context Loss)
- **Problem:** When the session user submitted an expense without explicitly defining their underlying `userId` in the payload (defaulting only to the string name "Me" or their first name), the backend `findFirst` lookup would occasionally fail to map them to their authenticated session ID. This generated a duplicate user data entry in the database where a user appeared to owe money to a separate ghost instance of themselves.
- **Handling Strategy:** Explicitly bound the NextAuth session `user.id` to the frontend state initialization, overriding the name-based lookup for the active user. This strictly enforces data parity between the frontend session cookie and the backend relational lookup.
