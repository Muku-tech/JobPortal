# TODO - Job Recommendations in Messages

## Plan (approved)

1. Add backend endpoint to convert smart recommendations into a `messages` row for the logged-in user.
   - Create controller method in `server/controllers/messageController.js` (or new controller) that:
     - calls `/recommendations/smart` logic (or imports `recommendationController.getSmartRecommendations` internals) to get top jobs
     - creates a `Message` row with `type: 'system'` and `message` text like: “Here are your recommended jobs: A, B, C”
     - sets `sender_id` to a safe value (system/admin) or reuse recipient as sender.
     - sets `application_id: null`.
   - Add route in `server/routes/messages.js` e.g. `POST /recommendations/to-messages`.

2. Update frontend Dashboard (and optionally Home) to call the new endpoint after recommendations are fetched.
   - On mount, Dashboard already calls `api.get('/recommendations/smart')` and stores top 3.
   - Add `useEffect` to post them into messages once (use a ref/flag to avoid duplicates).

3. Update `/messages` UI if needed.
   - Ensure `client/src/pages/Messages.jsx` displays system messages (it already uses `notif.message`).
   - If backend includes `sender.name` as null for system, ensure `getTopic` shows “System”.

4. Test
   - Run backend + frontend.
   - Login as jobseeker, open Dashboard/Home, verify messages appear under `/messages` and unread count increments.
