# Fix Sequelize Error in Guest Recommendations

## Plan Steps:

- [x] 1. Edit server/controllers/recommendationController.js: Add `sequelize` to models destructuring import.
- [ ] 2. Restart server and test /api/recommendations/guest endpoint.
- [ ] 3. Verify no more ReferenceError in logs.

**Status: Step 1 ✅ Complete. Restart server (`cd server && npm start`) and test http://localhost:5001/api/recommendations/guest**
