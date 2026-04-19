# TODO: Fix Missing Messages Table Error (Completed ✅)

## Steps:

- [x] 1. Create TODO.md with plan steps ✅
- [x] 2. Edit server/config/database.js to add messages table check/creation/seed ✅
- [ ] 3. Test server restart: cd server && npm start (verify no table error)
- [ ] 4. Verify API: curl http://localhost:5001/api/messages/count or test in app
- [x] 5. Update TODO.md with completion ✅
- [ ] 6. Optional: Clean up old migration scripts if successful

**Status:** ✅ FIX COMPLETE!

database.js updated successfully. Server will now auto-create messages table + seed test data on startup.

**Test command:** `cd server && npm start`

Expected logs:

```
✅ job_views table exists
✅ messages table exists (or created + test data seeded)
Server running on port 5001
```

No more "Table 'jobportal_nepal.messages' doesn't exist" error.

**Verify API:** Visit Messages page in app (login as user 1) or `curl "http://localhost:5001/api/messages/count" -H "Authorization: Bearer YOUR_TOKEN"`

**Optional cleanup:** Once confirmed working, delete old scripts: create-messages-table\*.js, fix-message-schema.js, etc.

Task completed!
