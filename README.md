# Job Market Radar 📡

> Personal Job Market Radar application for discovering current active vacancies in the market matching a **12+ years Senior Technical Lead / Associate Technical Architect** profile with a strong focus on **React, Next.js, Headless CMS / Digital Experience platforms, and international customer travel**.

---

## 🎯 Profile & Search Target

- **Seniority & Experience**: 12+ years (Senior Technical Lead, Associate Technical Architect, Solutions Architect)
- **Core Technologies**: React, Next.js, TypeScript, Angular, Contentful, Headless CMS, Frontend Architecture, Commerce integrations
- **Target Compensation**: Preferred ₹35 LPA+ (Undisclosed salary roles are always surfaced; never rejected solely because compensation is unlisted)
- **Locations**: Hyderabad, India, Remote from India, International Remote
- **Travel Requirement**: High-value interest in roles where an India-based architect travels internationally for client/customer work (e.g. 10–20%, 20–30% travel to USA, Europe, Middle East, Singapore).

---

## 🏗️ Architecture

The application is built on **Next.js 16 (App Router)** and **TypeScript** with a clean layered architecture:

```
├── app/
│   ├── page.tsx                 # Current Market Opportunities & Radar Dashboard
│   ├── jobs/page.tsx            # Primary Market Radar (Search, Filters, Sort, Live Sync)
│   ├── applications/page.tsx    # 9-stage Kanban Application Tracker
│   ├── companies/page.tsx       # Target Companies Management
│   ├── settings/page.tsx        # Search Profile & Matching Configuration
│   └── api/
│       ├── jobs/route.ts        # GET / POST jobs
│       ├── jobs/sync/route.ts   # Live provider ingestion trigger
│       ├── companies/route.ts   # Target companies registry
│       └── settings/route.ts    # Search profile settings
├── components/
│   ├── layout/Navigation.tsx    # Responsive header & radar navigation
│   ├── jobs/                    # JobCard, JobFilters, SyncButton
│   └── applications/            # Kanban board & pipeline components
├── services/
│   ├── job-providers/           # Provider abstraction & implementations
│   │   ├── types.ts             # JobProvider & SearchCriteria interfaces
│   │   ├── RemotiveJobProvider.ts
│   │   ├── ArbeitnowJobProvider.ts
│   │   ├── GreenhouseCareerProvider.ts
│   │   └── AdzunaJobProvider.ts
│   └── JobIngestionService.ts   # Orchestration, parsing, deduplication & scoring
├── lib/
│   ├── matchingEngine.ts        # Transparent rule-based profile matcher
│   ├── deduplication.ts         # Multi-field duplicate detector & merger
│   ├── travelExtractor.ts       # Regex travel & international destination parser
│   ├── salaryParser.ts          # LPA / multi-currency normalizer
│   ├── storage.ts               # Storage adapter & dynamic metrics calculator
│   └── demoData.ts              # Explicitly labeled DEMO DATA seed
├── prisma/
│   └── schema.prisma            # PostgreSQL relational schema
└── types/
    └── index.ts                 # Strongly-typed domain interfaces
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js 18+ (Node 22 recommended)
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/viswanathtelgamsetty/job-search-dashboard.git
cd job-search-dashboard
npm install
```

### 2. Configure Environment
Copy the `.env.example` template:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

See [`.env.example`](./.env.example) for all configurable keys:

| Variable | Description | Required? |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Prisma | Optional (in-memory/local storage used by default) |
| `ENABLE_REMOTIVE_PROVIDER` | Enable Remotive Remote API (`true`/`false`) | Optional (defaults to `true`) |
| `ENABLE_ARBEITNOW_PROVIDER` | Enable Arbeitnow Open API (`true`/`false`) | Optional (defaults to `true`) |
| `ENABLE_GREENHOUSE_BOARDS` | Enable Greenhouse public career boards | Optional (defaults to `true`) |
| `GREENHOUSE_BOARD_TOKENS` | Comma-separated Greenhouse boards (`contentful,thoughtworks,slalom`) | Optional |
| `ADZUNA_APP_ID` | Adzuna API App ID | Optional |
| `ADZUNA_APP_KEY` | Adzuna API App Key | Optional |
| `ADZUNA_COUNTRY` | Adzuna target country (`in` for India) | Optional (defaults to `in`) |

---

## 📡 Supported Job Providers

The application strictly integrates with **permitted, legitimate sources** without violating terms of service or using unauthorized scraping:

1. **Remotive Remote API**: Free open developer API querying verified remote frontend, lead, and architect positions with disclosed compensation.
2. **Arbeitnow Public API**: Free open European and global tech jobs API with remote flags and tag classification.
3. **Greenhouse Public Career Boards**: Official public board endpoints (`boards-api.greenhouse.io`) for premier consulting and headless CMS firms (e.g., Contentful, Slalom Build, Automattic).
4. **Adzuna Job Search API**: Authorized API search querying Indian and international tech vacancies when credentials are provided in `.env.local`.

---

## 🗄️ Database Setup (PostgreSQL + Prisma)

The repository includes a production-grade relational Prisma schema in [`prisma/schema.prisma`](./prisma/schema.prisma) with full relationships:
- `Job`: Full lifecycle, salary, travel requirements, skills, and source references.
- `Company`: Target consulting firms, careers portals, travel profile, notes.
- `Application`: 9-stage tracking state, interview notes, next steps.
- `ApplicationEvent`: Audit timeline of status changes, interviews, and offers.
- `SearchProfile`: User's search criteria and match weights.
- `JobSource` & `JobSourceReference`: Source deduplication and multi-source tracking.

To push schema to a PostgreSQL instance:
```bash
# 1. Update DATABASE_URL in .env.local
# 2. Push schema
npx prisma db push

# 3. Open Prisma Studio (optional)
npx prisma studio
```

---

## 🔄 How Job Ingestion Works

1. **Provider Querying**: `JobIngestionService` invokes all enabled providers in parallel using `Promise.allSettled`.
2. **Field Normalization**:
   - **Salary**: Normalized to INR Lakhs Per Annum (LPA) or USD equivalent.
   - **Travel**: `travelExtractor.ts` scans titles and descriptions to detect international travel, client-site travel, percentages (10–20%, 20–30%), and target destinations (USA, Europe, Singapore, Middle East).
3. **Deduplication**: `deduplicateJobs` generates a fingerprint based on `normalizeCompany(company)` + `normalizeTitle(title)` + `location`. When a duplicate is discovered from multiple providers, it is merged into one canonical card retaining all source links.
4. **Profile Matching**: Evaluated via the rule-based matching engine.

---

## 🎯 How Matching Works (Transparent Rule-Based)

**No fake AI scores.** Every match score is 100% deterministic and transparent:

1. **Role Family Match (25 pts)**: Verifies whether the title contains target keywords (e.g., "Senior Technical Lead", "Frontend Architect", "Solutions Architect", "Digital Experience Consultant").
2. **Tech Stack Match (25 pts)**: Checks presence of core skills (React, Next.js, TypeScript, Angular, Contentful, Headless CMS, Commerce).
3. **Seniority & Experience Match**: Evaluates 12+ years alignment.
4. **Location Match (20 pts)**: Matches Hyderabad, India Remote, or International Remote.
5. **Compensation Match (15 pts)**: Checks if salary is ≥ ₹35 LPA. Undisclosed salaries match by policy.
6. **Travel Match (15 pts)**: High bonus for international customer travel and client-site travel.

Every card displays the exact matched criteria:
```
MATCH:
✓ Role: Senior Technical Lead
✓ React
✓ Next.js
✓ 12+ years experience
✓ Hyderabad / Remote
✓ ₹38L+ PA
✓ International Travel (USA, Europe) [20%]
```

---

## 🔌 How to Add Another Job Provider

1. Create a new provider file in `services/job-providers/`:
   ```ts
   import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";

   export class CustomJobProvider implements JobProvider {
     readonly id = "custom-feed";
     readonly name = "Custom Job Feed";
     readonly isConfigured = true;

     async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
       // Query permitted API / RSS / JSON feed
       return [...];
     }
   }
   ```
2. Register the provider in `services/job-providers/index.ts`.
3. Add it to `this.providers` array in `services/JobIngestionService.ts`.

---

## 🧪 Testing & Validation

```bash
# Run lint check
npm run lint

# Run production build
npm run build
```
