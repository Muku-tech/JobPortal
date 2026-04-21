# Login Fix Progress

**Status:** Port mismatch fixed ✅

**Root cause:** Frontend api.js used localhost:5003, backend runs on 5001

**Changes made:**

- Updated client/src/services/api.js baseURL from 5003 → 5001

**Test commands:**

1. Backend: `cd server && npm start`
2. Frontend: `cd client && npm run dev`
3. Test login at http://localhost:5173/login

**Verification:**

- Network tab should hit http://localhost:5001/api/auth/login
- No more ERR_CONNECTION_REFUSED
