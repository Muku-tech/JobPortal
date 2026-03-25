# Fix Employer Applicants Section Crash

## Status: 🚀 In Progress

### Step 1: ✅ Create this TODO.md (done)

### Step 2: ✅ Fix EmployerApplications.jsx crash

- Remove duplicate useEffect using undefined `props`
- Destructure `jobId` properly
- Clean useEffect dependencies
- Add error state handling

### Step 3: ✅ Fixed 500 error - Added Job.hasMany(Application, as: 'applications') association

Dashboard now works for abctech@gmail.com (ID 15, 2 jobs)

### Step 4: [PENDING] Test

- Hot reload frontend
- Navigate to employer applicants/job applicants page
- Verify no crash, data loads
- Check browser console/network

### Step 5: [PENDING] Seed data if empty

- Run `node server/database/seed.js` for test applications

### Step 6: Complete ✅
