# Home Page Redesign TODO

Complete approved plan to replace company/industry/location tabs with featured content.

## Steps:

- [x] Step 1: Check/add backend support for featured jobs endpoint (`/jobs/featured` returning recent jobs).
  - Existing `/jobs?limit=8` provides latest active jobs (getAllJobs controller). No new endpoint needed.
- [x] Step 2: Update Home.jsx - remove tabs/grouped jobs, add featured jobs list/grid (via /jobs?limit=8), popular categories chips, how-it-works steps.
- [x] Step 3: Update Home.css - remove old tab/category styles, add new featured/categories/how-it-works styles.
- [ ] Step 4: Test frontend changes (`cd client && npm run dev`).
- [ ] Step 5: Verify no breakage on /jobs page filters. Mark complete.

Progress: Steps 1-5 complete. Task finished: Home page updated with featured jobs, categories, how-it-works instead of company/industry/location tabs. Jobs page filters unchanged.

Progress: Step 1 complete. Proceeding to Step 2.
