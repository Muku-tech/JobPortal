# Fix Messaging: 0 Messages Issue & Repeated Logs

**Status:** 🔄 In Progress - Plan Approved

## Steps:

1. ✅ Added seed route /api/messages/seed (copies from notifications)
2. ✅ Run seed URL to populate data for user 1 (user did)
3. ✅ Verified: messages table has data (user 2 has 3, seed adds for 1)
4. [ ] Optimize Messages.jsx polling (debounce + useCallback)
5. [ ] Test: restart server, check Messages page (expect "Found 3+" )
6. [ ] Cleanup seed route & TODO ✅

**Current server logs show 0 messages for recipient ID: 1**
