# SURAAKSHA — Social Media Threat Alert Dashboard

A professional Next.js cybersecurity platform for officers to review, assess, and escalate suspected threat accounts on social media.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Frontend**: React 18 with CSS Modules
- **API**: Next.js API Routes (ready for DB integration)
- **Styling**: CSS Variables + CSS Modules (dark security theme)
- **Language**: JavaScript (JSX)

## Project Structure

```
suraaksha/
├── components/
│   ├── AlertDetail.jsx         # Full alert evidence & officer review panel
│   ├── AlertDetail.module.css
│   ├── AlertsList.jsx          # Scrollable alert list sidebar
│   ├── AlertsList.module.css
│   ├── Dashboard.jsx           # Root layout + state management
│   ├── Dashboard.module.css
│   ├── SeverityBadge.jsx       # Critical / High / Medium / Low badge
│   ├── SeverityBadge.module.css
│   ├── Sidebar.jsx             # Navigation + filters + critical count
│   ├── Sidebar.module.css
│   ├── StatusBadge.jsx         # Open / Reviewed / Escalated badge
│   └── StatusBadge.module.css
├── lib/
│   ├── mockData.js             # Fictional demo alerts dataset
│   └── utils.js                # Time formatting + severity helpers
├── pages/
│   ├── api/
│   │   └── alerts/
│   │       ├── index.js        # GET /api/alerts
│   │       ├── [id].js         # GET / PATCH /api/alerts/:id
│   │       └── [id]/
│   │           └── report.js   # POST /api/alerts/:id/report
│   ├── _app.jsx                # Global CSS + app wrapper
│   ├── _document.jsx           # Custom HTML document
│   └── index.jsx               # Dashboard home page
├── styles/
│   └── globals.css             # CSS variables + base reset
├── .env.local                  # Environment variables (not committed)
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Supabase Auth

Create a Supabase project, then add its project URL and publishable key (or legacy anon key) to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Restart the Next.js server after changing environment variables. New accounts are created by Supabase Auth and appear under **Authentication → Users** in the Supabase dashboard. Enable the Email provider and configure the project's email confirmation and allowed redirect URLs as needed. Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm run start
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List all alerts (optional `?status=open`) |
| GET | `/api/alerts/:id` | Get single alert |
| PATCH | `/api/alerts/:id` | Update decision / notes / status |
| POST | `/api/alerts/:id/report` | Submit officer report |

Alert cases, officer notes, and report decisions are also saved in the current browser's local storage, so they remain after sign-out, refreshes, and closing the tab. They are not shared with other browsers or devices and will be removed if this browser's site data is cleared.

## Sign-in and account creation

Create an account with your own email and password, then sign in with those credentials. Demo access is also available:

| Role | Email | Password |
|------|-------|----------|
| SOC Officer | `officer@suraaksha.gov` | `SOC@2024` |
| Admin | `admin@suraaksha.gov` | `Admin@2024` |

New accounts are registered with Supabase Auth; registration errors are shown instead of silently creating a browser-only account. If email confirmation is enabled, confirm the message from Supabase before signing in. The built-in demo credentials are for demonstration only.

### Example: Submit a report

```bash
curl -X POST http://localhost:3000/api/alerts/1/report \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "escalate",
    "notes": "Confirmed C2 infrastructure. Escalating to law enforcement.",
    "officerId": "officer-007"
  }'
```

## Deploying to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

Or connect your GitHub repository to [Vercel](https://vercel.com) for automatic deployments on every push.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: SURAAKSHA Next.js dashboard"
git remote add origin https://github.com/YOUR_USERNAME/suraaksha.git
git branch -M main
git push -u origin main
```

## Next Steps for Production

1. **Database** — Replace in-memory store with PostgreSQL/MongoDB (via Prisma or Mongoose)
2. **Auth** — Add NextAuth.js with role-based access control for officers
3. **Real APIs** — Connect Twitter/X, Instagram APIs (read-only) for live alert feeds
4. **Audit Log** — Persist every officer decision with timestamps
5. **Notifications** — Email/Slack alerts for new Critical cases
6. **Search** — Wire up the search box to filter by account name or type
7. **Pagination** — Handle large alert volumes with cursor-based pagination

## License

MIT
