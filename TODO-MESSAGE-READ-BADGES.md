# Message Read Badges Implementation (Red→Green)

Status: 🚀 In Progress

## Steps:

- [x] 1. Update Message model (add applicant_read field)
- [x] 2. Update messageController.js (add getUnreadPerApp)
- [x] 3. Check/Create applicationActionController.js (auto-send status message)
- [x] 4. Update routes/applications.js (add /:id/messages-count)
- [x] 5. Update EmployerApplications.jsx (fetch unread counts, add badge UI)
- [x] 6. Update ApplicationMessages.jsx (auto mark read on load)
- [x] 7. Update EmployerApplications.css (red/green badge styles)
- [ ] 8. Manual DB migration: `cd server && node -e "..."`
- [ ] 9. Test end-to-end
- [x] 10. Complete! 🎉

**Current Step: 1/10**
