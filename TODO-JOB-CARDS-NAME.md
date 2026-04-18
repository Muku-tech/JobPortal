# Job Cards Company Name Fix - Progress Tracker

## [✅ COMPLETE] Diagnosis

- Job cards show \"Hiring Company\" fallback
- Caused by null `job.company_name` in DB/API response
- Model has `company_name` (nullable) + `employer_id` → User relation

## [✅ COMPLETE] Step 1: Update Frontend UI

- Edit `client/src/pages/Jobs.jsx`
- Change banner-company to: `{job.employer?.name || job.company_name || job.employer_id || \"Hiring Company\"}`

## [PENDING] Step 2: Backend Enhancement (Optional)

- Update jobController.getJobs to include `include: [{model: User, as: 'employer'}]`
- Restart server

## [PENDING] Step 3: Test

- Check Jobs page cards show company/employer names
- Verify JobDetails page consistency

## Quick Test

```
# Check job data structure in browser console
# Navigate to /jobs, inspect network /jobs API response
```
