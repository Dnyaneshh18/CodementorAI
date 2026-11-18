<div align="center">

# ⚡ CodeMentorAI
### *Full-Stack AI-Powered Coding Platform & Real-Time Multiplayer Battle Arena*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.39-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Groq API](https://img.shields.io/badge/Groq_API-Qwen_LLM-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <b>A comprehensive browser-based development environment featuring multi-language code execution, interactive streaming terminals, ultra-fast AI debugging powered by Qwen on Groq, and competitive real-time coding battles.</b>
</p>

[Key Features](#-key-features) • [Resume Highlights](#-resume-highlights--technical-competencies) • [Architecture](#-system-architecture) • [Tech Stack](#-tech-stack) • [API Documentation](#-api-endpoints) • [Database Schema](#-database-schema) • [Getting Started](#-getting-started) • [License](#-license)

---

</div>

## 📌 Overview

**CodeMentorAI** is an advanced, production-grade cloud coding workspace designed to bridge the gap between learning, writing, and competing in algorithmic challenges. It unites the versatility of the **Monaco Editor** and **xterm.js** with a sandboxed backend execution engine, real-time multiplayer coding competitions over **WebSockets**, and cutting-edge generative AI inference via **Groq's LPU** and **Qwen (qwen3.8-27b)**.

Whether practicing data structures, running interactive command-line programs with dynamic stdin input, receiving immediate AI diagnostic feedback on logic errors, or battling peers on custom AI-generated algorithmic challenges, CodeMentorAI delivers a lightning-fast, gamified coding experience.

---

## 🎯 Resume Highlights & Technical Competencies

This project embodies the following core competencies and full-stack software engineering accomplishments:

- **Browser-Based Multi-Language Code Execution Engine**:
  - Architected and deployed an in-browser code editor powered by **Monaco Editor** and an interactive terminal using **@xterm/xterm**.
  - Engineered support for **six programming languages**: **JavaScript, TypeScript, Python, Java, C++, and C**.
  - Implemented full bidirectional terminal streaming using **WebSockets (`ws`)**, enabling interactive `stdin` input/output prompts in real time.

- **AI Code Diagnostics & Assistant with Qwen & Groq API**:
  - Integrated **Qwen (`qwen/qwen3.8-27b`)** via high-throughput **Groq LPU API** for sub-second code reasoning.
  - Built comprehensive automated analysis pipelines: code debugging (root cause + patch generation), Big-O asymptotic time/space complexity evaluation, and programming concept extraction with curated practice recommendations.
  - Engineered prompt-engineered JSON schema generators for dynamic LeetCode-style algorithmic battle problem creation and automated submission scoring.

- **Resilient Backend APIs & Sandboxed Execution Workflows**:
  - Designed modular **Express.js** and **TypeScript** REST API endpoints with robust error handling, session authentication (Passport.js + scrypt hashing), and rate-limiting safeguards.
  - Implemented backend compilation pipelines (`javac` -> `java`, `g++`/`gcc` with `-O2` optimizations, `esbuild` TypeScript transpilation -> `node`).
  - Implemented strict safety mechanisms: **30-second timeout controls**, child-process isolation, memory usage metrics, and automated temporary disk cleanup.

- **Real-Time Multiplayer Coding Battles, History & Leaderboards**:
  - Engineered a real-time multiplayer competition lobby and battle arena using **WebSockets** and **PostgreSQL**.
  - Built dynamic matchmaking, live countdown timers, simultaneous code submission evaluation, algorithmic leaderboard ranking, and optimal solution generation.
  - Designed persistent tracking with **Drizzle ORM**: complete execution history, user XP, levels, daily streaks, language distribution charts (Recharts), and success-rate analytics.

---

## 🚀 Key Features

### 1. 🖥️ Interactive Code Editor & Terminal
- **Monaco Editor Integration**: Full syntax highlighting, line numbering, auto-closing brackets, code folding, and configurable indentations for 6 languages.
- **Pre-loaded Language Starter Templates**: Instant boilerplate code loaded with a single click for fast experimentation.
- **Interactive Terminal with xterm.js**: Real terminal emulator inside the browser supporting interactive stdin/stdout loops (e.g., Python `input()`, Java `Scanner`, C/C++ `scanf`/`cin`).
- **Standard Execution Mode**: Run code with static stdin buffers, receiving structured stdout, stderr, execution duration, and exit codes.

### 2. 🤖 AI-Powered Mentorship & Debugger (Groq + Qwen)
- **Deep Code Debugging**: Identifies logical flaws, syntax errors, edge cases, and runtime exceptions, returning corrected code blocks and step-by-step explanations.
- **Complexity Analysis**: Computes exact Time Complexity (e.g., $\mathcal{O}(n \log n)$) and Space Complexity ($\mathcal{O}(n)$) with asymptotic analysis breakdown.
- **Concept Detection & Recommendations**: Detects algorithms and data structures (Dynamic Programming, Binary Search, Sliding Window, Graphs) and suggests targeted exercises to strengthen weak areas.

### 3. ⚔️ Real-Time Multiplayer Coding Battles
- **Dynamic Problem Synthesis**: Enter any topic (e.g., *"LRU Cache"*, *"Longest Substring Without Repeating Characters"*), and Qwen synthesizes a formatted challenge with input constraints, sample test cases, and starter function templates across languages.
- **Live Matchmaking & Lobby**: Create custom battle rooms, invite peers via unique Room IDs, configure battle duration, and sync status over WebSockets.
- **Automated AI Judge**: Benchmarks each participant's code, calculates performance scores (0–100), gives qualitative feedback, assigns ranks (1st, 2nd, etc.), and reveals the optimal canonical solution upon match completion.

### 4. 📊 Gamification, Progress Tracking & Execution History
- **Personalized Analytics Dashboard**: Visualizes execution trends, language mastery breakdown (pie/bar charts), success-to-failure ratios, and average latency.
- **Leveling & Streak System**: Earn XP and level up with every successful execution and resolved bug; keep daily streak counters active.
- **Full Execution Log**: Browse and inspect past code runs, input payloads, terminal outputs, runtime metrics, and error stack traces.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React 18 + TypeScript + Vite)"]
        UI["shadcn/ui & Radix UI (Tailwind CSS)"]
        Monaco["Monaco Code Editor"]
        Terminal["Interactive Terminal (@xterm/xterm)"]
        State["TanStack React Query & Context API"]
    end

    subgraph Server ["Backend Server (Node.js + Express.js + TypeScript)"]
        Routes["Express REST API (/api/*)"]
        Auth["Passport.js Authentication (Scrypt Sessions)"]
        WSServer["WebSocket Server (/api/execute-ws & Battles)"]
        ExecEngine["Code Execution Engine (Child Process Spawner)"]
        Drizzle["Drizzle ORM (Schema & Queries)"]
    end

    subgraph AI ["AI Inference Layer"]
        Groq["Groq Cloud LPU"]
        Qwen["Qwen 2.5 / 3.8-27B LLM"]
    end

    subgraph Storage ["Database Layer"]
        Postgres[("PostgreSQL Database (Supabase / Neon)")]
    end

    %% Connections
    Monaco --> State
    Terminal <-->|Bi-directional WS Stream| WSServer
    State <-->|HTTP REST Requests| Routes
    Routes --> Auth
    Routes --> ExecEngine
    WSServer --> ExecEngine
    Routes -->|SDK Prompts| Groq
    Groq --> Qwen
    Routes --> Drizzle
    Drizzle <--> Postgres
    ExecEngine -.->|Local Compilers: gcc/g++/javac/node/python| ExecEngine
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `@tailwindcss/typography` & `tailwindcss-animate`
- **UI Primitives**: [shadcn/ui](https://ui.shadcn.com/) based on [Radix UI](https://www.radix-ui.com/)
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Terminal Emulator**: [@xterm/xterm](https://xtermjs.org/) with `@xterm/addon-fit`
- **Client Routing**: [Wouter](https://github.com/molefrog/wouter)
- **Server State & Caching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Motion & Icons**: [Framer Motion](https://www.framer.com/motion/) & [Lucide React](https://lucide.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/) with TypeScript
- **Real-Time Communication**: [ws](https://github.com/websockets/ws) (WebSocket server)
- **Authentication**: [Passport.js](http://www.passportjs.org/) (Local strategy with salted `scrypt` password hashing)
- **Session Store**: `express-session` with `connect-pg-simple` and `memorystore` fallback
- **Compilation & Transpilation**: [esbuild](https://esbuild.github.io/) for fast TS transforms; OS-level `gcc`, `g++`, `javac`, `java`, `python` bindings
- **Validation**: [Zod](https://zod.dev/) and `drizzle-zod`

### Database & AI
- **Database**: [PostgreSQL](https://www.postgresql.org/) (compatible with Supabase, Neon, or local PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) with [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) for migrations
- **AI Inference Engine**: [Groq Cloud SDK](https://console.groq.com/)
- **Large Language Model**: `qwen/qwen3.8-27b`

---

## 🗄️ Database Schema

The database is defined using **Drizzle ORM** in `@shared/schema.ts`:

| Table | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | User credentials and progression stats | `id`, `username`, `email`, `password`, `level`, `xp`, `streak`, `createdAt` |
| `code_submissions` | Saved code submissions and historical AI analyses | `id`, `userId`, `code`, `language`, `timeComplexity`, `spaceComplexity`, `concepts`, `debuggingResults` |
| `execution_history` | Granular log of every code execution | `id`, `userId`, `code`, `language`, `stdin`, `output`, `error`, `exitCode`, `executionTime`, `success` |
| `user_progress` | Aggregated user coding stats & achievements | `id`, `userId`, `problemsSolved`, `bugsFixed`, `languagesUsed`, `totalExecutions`, `averageExecutionTime` |
| `learning_analytics`| Per-language daily performance metrics | `id`, `userId`, `date`, `language`, `executionsCount`, `successRate`, `averageTime`, `conceptsLearned` |
| `battles` | Multiplayer battle room records | `id`, `creatorId`, `problemPrompt`, `generatedProblem`, `startingCode`, `durationMinutes`, `status`, `optimalSolution` |
| `battle_participants`| Room participants mapping | `id`, `battleId`, `userId`, `joinedAt` |
| `battle_submissions` | Submissions, AI scores, and rankings for battles | `id`, `battleId`, `userId`, `code`, `language`, `aiScore`, `aiFeedback`, `rank` |

---

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /api/register` – Register a new account (validates email & uniqueness, hashes password).
- `POST /api/login` – Authenticate session credentials.
- `POST /api/logout` – Destroy session and clear authentication cookies.
- `GET /api/user` – Get currently authenticated user profile.

### ⚙️ Code Execution & Terminal
- `POST /api/execute` – Execute code in sandboxed process (supports `stdin`, enforces 30s timeout, logs metrics).
- `GET /api/template/:language` – Fetch official starter boilerplate for a chosen language.
- `WS /api/execute-ws` – Full-duplex WebSocket connection for interactive xterm streaming.

### 🧠 AI Intelligence (Groq / Qwen)
- `POST /api/debug` – Identify bugs, generate corrected code patches, and provide diagnostic explanations.
- `POST /api/complexity` – Calculate algorithmic time & space Big-O complexities.
- `POST /api/recommendations` – Extract core computer science concepts and suggest practice problems.
- `POST /api/analyze` – Multi-dimensional analysis executing debug, complexity, and concepts in a single unified prompt.

### 📈 History, Progress & Analytics
- `GET /api/execution-history` – Fetch paginated code execution history logs.
- `GET /api/execution-history/:id` – Fetch detailed record for an individual execution.
- `DELETE /api/execution-history/:id` – Remove execution log entry.
- `GET /api/progress` – Retrieve user level, XP, achievements, and recent submissions.
- `GET /api/analytics` – Retrieve historical success rates and language mastery metrics.
- `GET /api/dashboard` – Consolidated dashboard payload (metrics, history, analytics).

### ⚔️ Multiplayer Coding Battles
- `POST /api/battles/create` – Synthesize a new battle problem via Qwen and create a waiting room.
- `POST /api/battles/:id/join` – Join an open battle lobby as a participant.
- `POST /api/battles/:id/start` – Lock lobby and trigger match countdown (creator only).
- `GET /api/battles/:id` – Get live battle state, participants, and submissions.
- `POST /api/battles/:id/submit` – Submit solution; automatically triggers AI ranking when all players submit.
- `GET /api/battles/history` – Retrieve completed battle history with leaderboards and optimal solutions.

---

## 🛠️ Supported Languages & Runtimes

| Language | File Extension | Compiler / Interpreter | Execution Method |
| :--- | :--- | :--- | :--- |
| **JavaScript** | `.js` | Node.js v20+ | `node <file>` |
| **TypeScript** | `.ts` | esbuild + Node.js | JIT transpilation via `esbuild.transform()` -> `node <file>` |
| **Python** | `.py` | Python 3.x | `python / python3 <file>` |
| **Java** | `.java` | OpenJDK 17+ | `javac <file>` -> `java -cp <dir> <Class>` (auto-wraps main method if omitted) |
| **C++** | `.cpp` | GCC / G++ (v11+) | `g++ -O2 -static <file> -o <binary>` -> `./binary` |
| **C** | `.c` | GCC / Clang | `gcc -O2 -static <file> -o <binary>` -> `./binary` |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher) or `pnpm`
- [PostgreSQL](https://www.postgresql.org/) database (or a cloud provider like [Supabase](https://supabase.com/) or [Neon](https://neon.tech/))
- **(Optional for local compiled languages)**: `python`, `javac`/`java`, `g++`, `gcc` in your system `PATH`.
- **Groq API Key**: Obtain a free API key at [console.groq.com/keys](https://console.groq.com/keys).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dnyaneshh18/CodementorAI.git
   cd CodementorAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your credentials:
   ```env
   # Database Configuration (PostgreSQL / Supabase / Neon)
   DATABASE_URL=postgresql://username:password@aws-0-region.pooler.supabase.com:6543/postgres

   # Groq API Configuration (Qwen LLM)
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=qwen/qwen3.8-27b

   # Session Security
   SESSION_SECRET=your_random_secure_session_secret_key_here

   PORT=5000
   NODE_ENV=development
   ```

4. **Initialize Database Schema**:
   Push the Drizzle ORM schema to your PostgreSQL database:
   ```bash
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:5000`.

---

## 📦 Production Build & Deployment

To generate an optimized production bundle:

```bash
# Type check and build frontend and backend bundles
npm run build

# Start the production server
npm start
```

- **Frontend Assets**: Bundled with Vite and stored into `dist/public`.
- **Backend Server**: Bundled using `esbuild` into `dist/index.js` for standalone Node.js execution.

---

## 🔒 Security & Sandboxing Considerations

- **Process Isolation**: All code execution calls run in isolated temporary workspaces managed through system temporary directories (`os.tmpdir()/codementor`).
- **Timeout Controls**: All child process execution tasks enforce strict 30,000ms timeouts to mitigate denial of service from non-terminating loops.
- **Resource Cleanup**: Intermediate compiled objects (`.class`, `.exe`, `_a.out`, `.js`) and temporary source files are securely unlinked upon process exit or error.
- **Authentication**: Passwords are encrypted with Node.js `scrypt` using cryptographically secure random salts.
- **Credential Hygiene**: API tokens and database connection strings are isolated to server-side environment variables and excluded from version control.

---

## 👥 Authors & Acknowledgments

- **Developer**: [Dnyaneshwar Vasant Patil](https://github.com/Dnyaneshh18)
- **AI Inference**: Powered by [Groq](https://groq.com/) & [Qwen](https://github.com/QwenLM/Qwen)
- **Editor & UI**: Monaco Editor by Microsoft & shadcn/ui

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
