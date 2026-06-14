# AI Usage Disclosure

## 1. Overview
This project was developed utilizing an AI-assisted engineering methodology. The purpose of integrating AI was to accelerate boilerplate generation, assist with complex algorithmic logic (like debt simplification), and brainstorm database schema constraints. 

While AI significantly boosted development velocity, all core engineering responsibilities remained strictly with me. As the lead engineer, I was responsible for:
- Defining the software architecture and technical constraints.
- Reviewing, testing, and rejecting flawed AI-generated code.
- Ensuring strict adherence to assignment requirements.
- Making final decisions regarding security, data integrity, and deployment strategies.

All AI suggestions were manually validated against documentation (Next.js 14, Prisma) and rigorously tested via local execution before being merged into the codebase.

---

## 2. AI Tools Used

### Antigravity (Google DeepMind Agent)
* **Purpose:** Acted as the primary pair-programming agent within the IDE for scaffolding, refactoring, and debugging.
* **Strengths:** Excellent contextual awareness of the entire codebase; highly proficient at writing Prisma schemas and React/Framer Motion components.
* **Limitations:** Occasionally struggled with the nuances of Next.js 14 App Router static vs. dynamic rendering, requiring manual overrides.

### ChatGPT (GPT-4)
* **Purpose:** High-level architectural planning, brainstorming anomaly detection strategies, and reviewing algorithmic logic.
* **Strengths:** Exceptional at explaining complex computer science concepts (like Graph Reduction for the debt simplification engine).
* **Limitations:** Lacks direct access to the live codebase, leading to generalized suggestions that required significant manual adaptation to fit my specific API routes.

---

## 3. Key Prompts Used

Throughout the development lifecycle, I used targeted prompts to guide the AI rather than asking it to build features blindly:

* **Requirements Analysis:** *"I need to build a Splitwise clone. What are the major relational edge cases I need to worry about when a user belongs to multiple groups but settles debts globally vs locally?"*
* **CSV Anomaly Detection:** *"Write a TypeScript function that parses an array of expense records and detects anomalies such as missing 'PaidBy' names, negative monetary amounts, and invalid date formats. Suggest fallback actions for each."*
* **Database Design:** *"Generate a Prisma schema for a shared expenses app. Include Users, Groups, GroupMembers, Expenses, ExpenseSplits, and Settlements. Ensure strict foreign-key constraints."*
* **API Design:** *"Design a RESTful Next.js API route to handle complex expense splitting. It must support Equal, Exact, Percentage, and Share-based splits."*
* **Balance Engine Design:** *"I need a debt simplification algorithm. Given an array of net balances (positive for creditors, negative for debtors), write a function that reduces these to the absolute minimum number of transactions required to settle up."*
* **Testing / Debugging:** *"Vercel is throwing a PrismaClientInitializationError during the `next build` phase for my dynamic `[id]` API routes. Why is Next.js trying to statically evaluate Prisma, and how do I bypass this?"*

---

## 4. AI Collaboration Workflow

My workflow treated the AI strictly as an interactive collaborator:
1. **Design & Prompt:** I defined the strict requirements for a single feature (e.g., the Add Expense modal) and prompted the AI for an initial draft.
2. **Review & Critique:** I manually reviewed the generated code. If the AI hallucinated an API or used deprecated Next.js 13 patterns, I rejected it and provided corrective feedback.
3. **Execution & Verification:** I ran the code locally (`npm run dev`), tested edge cases (e.g., trying to split a $10 bill among 3 people), and verified the database state via Prisma Studio.
4. **Documentation:** As features solidified, I directed the AI to update the `README.md` and `SCOPE.md` to ensure the documentation evolved alongside the codebase.

---

## 5. Cases Where AI Was Wrong

The AI was not infallible and required constant oversight. Here are 5 concrete examples where the AI generated incorrect logic that I had to manually detect and fix:

### 1. Floating-Point Mathematical Corruption
* **Problem:** The AI suggested storing expense amounts as standard `Float` types in the Prisma schema and dividing them directly (e.g., `$100 / 3 = 33.3333...`).
* **Why It Was Wrong:** Floating-point arithmetic in JavaScript introduces severe rounding errors. Over time, dividing and summing these floats would result in permanent 1-cent deficits in the database, corrupting user balances.
* **How It Was Detected:** Manual testing revealed lingering $0.01 debts after users attempted to fully "Settle Up."
* **Correction Made:** I completely rewrote the financial engine to multiply all inputs by 100, store them strictly as Integers (cents), and wrote a custom script to assign any 1-cent mathematical remainders to the first payee in the split array.

### 2. Next.js Static Pre-Rendering Crashes
* **Problem:** The AI generated dynamic API routes (`/api/groups/[id]/route.ts`) without explicitly defining the render strategy.
* **Why It Was Wrong:** Vercel aggressively attempts to pre-build Next.js pages statically. Without an explicit dynamic flag, the build process attempted to execute Prisma queries without a database connection, causing fatal deployment crashes.
* **How It Was Detected:** Vercel deployment logs showed `PrismaClientInitializationError` during the `npm run build` phase.
* **Correction Made:** I manually audited all API routes and injected `export const dynamic = "force-dynamic";` to bypass static generation for backend services.

### 3. Infinite Loops in Debt Simplification
* **Problem:** The AI's initial draft of the `simplifyDebts` algorithm used a recursive approach to match debtors and creditors.
* **Why It Was Wrong:** The recursive logic failed to properly decrement the remaining balances when an exact match wasn't found, leading to an infinite call stack loop and memory leaks when processing circular group debts (A owes B, B owes C, C owes A).
* **How It Was Detected:** Local server crashed with a `RangeError: Maximum call stack size exceeded` when loading the dashboard for heavily nested groups.
* **Correction Made:** I scrapped the recursive approach and implemented a linear `while` loop with a two-pointer system (one for sorted debtors, one for sorted creditors) that cleanly increments index pointers only when a balance hits zero.

### 4. "Ghost User" Context Loss
* **Problem:** When adding an expense, if the logged-in user left their name as the default string "Me", the AI's backend logic attempted to query the database for a user named "Me". 
* **Why It Was Wrong:** Because "Me" didn't exist in the database, the AI's auto-registration logic generated a duplicate "ghost" account for the active user, resulting in bizarre UX where "Akshit" owed money to "Me" (the same person).
* **How It Was Detected:** Visual inspection of the dashboard UI showed duplicate profiles for the session user.
* **Correction Made:** I restructured the API payload to explicitly transmit the authenticated session's `userId`, entirely bypassing the flawed string-matching logic for the active user.

### 5. Insecure Data Fetching (IDOR Vulnerability)
* **Problem:** The AI generated a `GET /api/groups/[id]` route that fetched the group details directly based on the URL parameter without validating the user's membership.
* **Why It Was Wrong:** This introduced an Insecure Direct Object Reference (IDOR) vulnerability. Any authenticated user could simply guess a group's UUID in the URL and view private financial data for a group they did not belong to.
* **How It Was Detected:** Security audit and manual testing via Postman by substituting random group IDs.
* **Correction Made:** I modified the Prisma query to explicitly require that the `session.user.id` exists within the `GroupMember` relational table for that specific `groupId` before returning the payload.

---

## 6. Engineering Decisions Made Independently

While the AI provided boilerplate, several critical architectural decisions were made entirely independently by me:
1. **Adopting Integers for Currency:** The AI pushed heavily for Prisma's `Decimal` type. I independently chose to use pure integers (cents) to drastically simplify frontend serialization and eliminate external math library dependencies.
2. **Theme Architecture:** The AI suggested using standard Tailwind `class="dark"` toggles. I independently architected the CSS Variable system (`--bg-app`) to allow for 4 seamless themes without bloating the React components with ternary operators.
3. **Choosing NextAuth Credentials:** The AI repeatedly suggested third-party OAuth (Google/GitHub). I chose to implement a custom Credentials provider with bcrypt to ensure the app remained fully self-contained for easy evaluation.

---

## 7. Lessons Learned

* **The Benefit of AI:** AI is an incredible accelerator. It reduced the time spent writing boilerplate HTML/Tailwind classes by 80% and provided an excellent sounding board for database relational mapping.
* **The Risk of Blind Trust:** AI hallucinates confidently. Trusting its Next.js rendering strategies or floating-point mathematical logic would have resulted in a fundamentally broken, undeployable application.
* **The Importance of Validation:** AI output is a *draft*, not a finished product. Every line of code must be treated with skepticism. Rigorous testing, logging, and architectural understanding are absolutely mandatory to successfully engineer a reliable product using AI tools.
