# Email Functionality - Application Status Updates

Status: Planning

## Steps:

- [x] 1. Install nodemailer (`cd server && npm i nodemailer`) ✅

- [x] 2. Create server/utils/emailService.js (Ethereal transporter + templates) ✅
- [x] 3. Update server/controllers/applicationController.js - sendEmail after save() for trigger statuses ✅

- [ ] 4. Add .env EMAIL vars (Ethereal for test)
- [ ] 5. Test: Create application, update to Shortlisted → check ethereal.email
- [ ] 6. Frontend toast confirmation for employer (optional)
