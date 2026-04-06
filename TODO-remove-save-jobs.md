# Remove Save Jobs Feature Completely

## Steps:

- [ ] 1. Delete `server/models/UserSavedJob.js`, `TODO_saved_jobs.md`, `TODO-save-jobs.md`
- [ ] 2. Edit `server/controllers/jobController.js` - remove saveJob/getSavedJobs
- [ ] 3. Edit `server/routes/jobs.js` - remove /save, /saved routes
- [ ] 4. Edit `server/models/index.js` - remove UserSavedJob
- [ ] 5. Edit frontend: `Jobs.jsx`, `JobDetails.jsx`, `Dashboard.jsx`, `Home.jsx` - remove save UI/logic
- [ ] 6. Delete `client/src/styles/save-btn.css` if exists
- [ ] 7. Restart server, test clean Jobs page

**Current: Backend complete (Steps 1-4 ✓). Frontend next (Step 5).**
