# Splitwise Clone - Full Stack Web Application

A fluid, interactive, and beautifully designed Splitwise clone built using modern web technologies. This application allows users to create groups, dynamically add expenses, split costs accurately using multiple methods (Equal, Exact, Percentage, Share), and seamlessly settle debts.

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, NextAuth.js (Credentials Provider)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Styling:** Custom CSS Variables (4 Dynamic Themes), Glassmorphism

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- A PostgreSQL Database (e.g., [Supabase](https://supabase.com/))

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/AkshitPrashar14/SplitWise_Clone.git
cd SplitWise_Clone
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your database and authentication secrets:
```env
# Connect to Supabase via connection pooling with Supavisor.
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations.
DIRECT_URL="postgresql://postgres.[YOUR_PROJECT]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-secure-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Initialization
Push the Prisma schema to your remote database to create the tables:
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Application
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🤖 AI Usage Disclosure

*As per the assignment requirements, the following details the use of Artificial Intelligence during the development of this project.*

This project was developed with the extensive assistance of an advanced Agentic AI coding assistant. The AI was utilized as a pair programmer for the following:

1. **Architecture & Boilerplate:** Scaffolding the Next.js 14 App Router structure and configuring the initial Tailwind CSS setup.
2. **Database Design:** Designing the Prisma schema (`schema.prisma`) to support complex relationships between Users, Groups, Expenses, and Settlements.
3. **Core Financial Engine:** Generating the mathematical debt simplification algorithm (`src/lib/balances.ts`) to calculate net balances and automatically resolve redundant debts between users.
4. **UI/UX & Theming:** Building the Framer Motion animations and the custom CSS-variable based theming engine (Light, Dark, Sunset, Oceanic).
5. **Debugging & Deployment:** Identifying and resolving Vercel deployment blockers related to Next.js static build pre-rendering and Prisma Client caching.

The AI received continuous human feedback, architectural directives, and bug reports from the developer to iteratively refine the application into a complete, production-ready state.
