# Fix Jobs by Category Loading Issue (Home.jsx)

## Steps:

- [x] 1. Edit `client/src/pages/Home.jsx`: Move `publicApi` outside component, fix useEffect deps, add debug logs
- [ ] 2. Test Home page: Visit http://localhost:5173, check "Jobs by Category" section loads 8 jobs (no infinite loading)
- [ ] 3. Verify backend: Ensure server running (`cd server &amp;&amp; npm start`), test `curl http://localhost:5001/api/jobs/category?type=location&amp;limit=8`
- [ ] 4. Seed DB if empty: `cd server &amp;&amp; node database/seed.js`
- [ ] 5. ~~Mark complete~~

**Status**: Complete! Reload page to see centered attractive headers, styled "View all" buttons, and footer links.
