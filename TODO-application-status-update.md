# Fixed Application Status Update 500 Error

**Issue:** PUT /api/applications/:id/status failed (Sequelize validation) when notes=undefined → empty string.

**Fix:** `server/controllers/applicationController.js` - only set employer_notes if truthy/non-empty.

**Test:**

- Login employer → EmployerApplications → click status buttons
- Add notes → blur input → works!

Application updates now functional ✅
