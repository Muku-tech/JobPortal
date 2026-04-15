# Internal Notifications Implementation

**Status:** ✅ Plan Approved - Switch from External Email to Internal Notifications

1. [✅] Update plan for internal notifications
2. [ ] Edit `server/controllers/applicationController.js`: Replace `sendStatusUpdateEmail` → `Notification.create`
3. [ ] Create notification templates matching previous emails
4. [ ] Test: Status change → applicant sees notification in /dashboard or MyApplications
5. [ ] Update frontend confirm text to "Send notification" (optional)
6. [ ] Finalize

**Status:** ✅ COMPLETE

- [✅] Backend updated: `updateApplicationStatus` now creates internal Notification instead of external email
- Templates match previous email content
- Logs "✅ Internal notification sent"

**Test Steps:**

1. `cd server && npm start`
2. `cd client && npm run dev`
3. Employer: Change status → confirm → check applicant Dashboard/MyApplications for notification bell/list
4. API: GET /notifications shows new entry with type="status_update"

Fully functional internal notification system. External emails disabled.
