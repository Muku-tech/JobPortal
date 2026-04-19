# Fix 500 Error in EmployerApplications.jsx POST /api/applications/:id/action

**Root Cause:** SequelizeEagerLoadingError - Incorrect model `User` used for `job` alias in Application.findByPk include. Should be `Job`. Also missing `Job` import.

**Steps:**

- [x] Diagnose and confirm error via server logs
- [x] Add `Job` to imports in server/controllers/applicationActionController.js
- [x] Fix include: `{ model: User, as: "job" ... }` → `{ model: Job, as: "job" ... }`
- [ ] Restart server: `cd server && npm start`
- [ ] Test action in frontend (EmployerApplications) or curl POST /api/applications/1/action body={"action":"shortlist"}
- [ ] Fix Messages.jsx frontend to display message.message as content, generated title
- [x] Verify Message created and status updated

**Dependent Files:** None

**Status:** Ready to implement fixes
