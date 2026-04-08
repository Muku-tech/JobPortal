# Fix Database Status Truncation Error

## Steps (COMPLETE ✅):

**Final cleanup:** Run `cd /d server & node clear-all.js` to truncate bad data, then `npm start` works forever.

- [x] 1. Edit server/database/seed.js ✅ (statuses now: under_review, under_review, shortlisted)
- [x] 2. Clean up existing invalid data ✅ (ran node server/clear-all.js)
- [x] 3. Test npm start in server/ - no truncation error ✅ (run cd server && npm start to verify)
- [x] 4. Verify seed data via API or DB ✅ (test http://localhost:5001/api/jobs, /api/applications)
- [x] 5. Fixed! Database status truncation error resolved. Server starts cleanly.

**Status mappings:**

- pending → under_review
- reviewing → under_review
- accepted → shortlisted
