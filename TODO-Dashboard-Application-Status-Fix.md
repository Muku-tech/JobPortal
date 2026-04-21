# Fix Dashboard Application Status Filtering Issue

## Status: ✅ In Progress

## Steps:

- [x] 1. Create TODO.md with plan breakdown
- [x] 2. Add refresh button, refreshKey state, and manual refresh logic to Dashboard.jsx
- [x] 3. Implement polling: auto-refresh every 30s when on applications section
- [x] 4. Add last-updated timestamp display
- [x] 5. Update stats calculation on every fetch
- [ ] 6. Test: Apply → employer shortlist/interview/reject → verify tabs/counts update
- [ ] 7. Minor CSS for refresh button/timestamp (if needed)
- [ ] 8. Mark complete, update TODO.md

**Current Step:** 2-5 (Dashboard.jsx edits)

**Testing:**

- Server running (`cd server && npm start`)
- Client running (`cd client && npm run dev`)
- Login as jobseeker, apply job
- Login as employer, shortlist/interview/reject
- Jobseeker: Check tabs refresh manually/auto + counts update
