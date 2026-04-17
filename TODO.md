# Fix JobSeekerProfile PUT /users/profile 500 Error

Status: In progress

## Approved Plan Breakdown:

**1. Update backend route handling (server/routes/users.js)**

- Normalize skills/languages to arrays regardless of input type
- Filter employer-specific fields based on user.role (jobseeker skips company\_\*)
- Improve error handling with detailed Sequelize error logging
- Add validation

**2. Verify model/database compatibility**

- Check if all fields exist and match types
- Run sequelize.sync() if needed

**3. Testing**

- Manual API test
- Frontend test
- Server restart & verification

## Progress:

- [x] Create TODO.md
- [x] Edit server/routes/users.js (added array normalization, role-based filtering, detailed Sequelize errors)
- [x] Verified model schema compatibility
- [ ] User to test: cd server && npm start, then update profile in frontend
- [x] Core fix complete
