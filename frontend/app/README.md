# Job Match — app folder

This is the complete `app/` folder for the frontend. It contains every page:

  app/
  ├── layout.tsx            root layout + Google fonts
  ├── globals.css           shared design system (light theme)
  ├── page.tsx              landing page (6-panel horizontal slide deck)
  ├── login/page.tsx        log in  → POST /api/auth/login
  ├── register/page.tsx     sign up → POST /api/auth/register
  ├── jobs/page.tsx         job listings → GET /api/jobs   (search + filter)
  ├── match/page.tsx        upload CV → POST /api/match     (score, skills, insights, best-fit)
  ├── history/page.tsx      past matches → GET /api/match/history
  └── _components/
      └── AppHeader.tsx     shared top bar for logged-in pages


## How to install

1. In your project, replace the existing `frontend/app` folder with this one.
2. Make sure `frontend/lib/api.ts` still exists (the pages import it as `@/lib/api`).
3. Run the dev server:

       cd frontend
       npm run dev

4. Open http://localhost:3000


## Works without the backend

Every page that calls the API (jobs, match, history) falls back to mock data
if the request fails — so the whole app is clickable before Tommy's backend is
live. When the backend comes up at http://localhost:8000, the real data takes
over automatically. No code changes needed.


## Routes

  /            landing
  /login       log in
  /register    sign up
  /jobs        browse jobs
  /match       score a resume
  /history     past matches
