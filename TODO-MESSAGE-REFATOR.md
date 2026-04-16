# Message System Refactor (Replace Notification with Message)

**Status:** 🔄 In Progress

1. ✅ User approved plan
2. [ ] Create server/models/Message.js
3. [ ] Create server/controllers/messageController.js
4. [ ] Create server/routes/messages.js
5. [ ] Update server/index.js (add /api/messages)
6. [ ] Create migration: create_messages_table + copy data from notifications (exclude saved jobs/system)
7. [ ] Update client/src/pages/Messages.jsx (use /messages)
8. [ ] Update Navbar.jsx badge to /messages/count
9. [ ] Update EmployerApplications.jsx sendMessage to /messages
10. [ ] Drop notifications table/model/controller/route
11. [ ] Test bidirectional messaging
12. ✅ Complete
