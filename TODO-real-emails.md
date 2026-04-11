# TODO: Enable Real Emails for JobPortal

Status: ✅ Plan approved - Implementing real Gmail emails

## Steps (from approved plan):

- [✅] 1. Update `server/utils/emailService.js`: Fixed Ethereal typo + prod Gmail support
- [ ] 2. User manually adds SMTP vars to `server/.env`:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=yourgmail@gmail.com
  SMTP_PASS=your_app_password
  NODE_ENV=production
  ```
  _Get Gmail app password: Google Account > Security > App passwords_
- [✅] 3. Minor error handling in `server/controllers/applicationController.js`
- [ ] 4. `cd server && npm start` (restart server)
- [ ] 5. Test: Login as employer, update application status to 'shortlisted' → check real inbox
- [ ] 6. Verify console logs confirm real send (no Ethereal URL)

## Notes:

- Fallback: Defaults to Ethereal if no SMTP vars
- Security: Never commit .env; use app password (not regular password)
- Progress: Mark as you complete
