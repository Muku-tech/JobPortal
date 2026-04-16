# Application Status → Message Notification

**Status:** Plan ready

**Problem:** Status update "interview" saves but no message sent to jobseeker (Notification table gone)

**Information Gathered:**

- applicationController.js: updateApplicationStatus tries Notification.create (fails)
- Frontend EmployerApplications.jsx: Calls PUT /applications/:id/status
- Message model ready (recipient_id, sender_id)

**Plan:**

1. Edit server/controllers/applicationController.js: Replace Notification.create with Message.create
2. Template messages for shortlisted/interview/hired/rejected
3. Test: Employer set "interview_scheduled" → jobseeker Messages shows notification

**Dependent Files:** None

**Followup:**

- Restart server
- Test employer dashboard → status change → check jobseeker messages

Approve to proceed?
