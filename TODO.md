# Skills Sync Fix - Implementation Plan

## Root Cause

When users update skills (or other data) in the "My Profile" section, changes are saved to the User model but not always synced to the Resume model, causing the resume to show outdated data.

## Implementation Steps

### Step 1: Server-side fix - `server/routes/users.js`

- [x] Improve bi-directional sync: If no resume exists for the user, CREATE a new default resume with the updated profile data
- [x] Properly merge skills from user profile into resume's structured format `[{title: "skillName"}]`

### Step 2: Client-side fix - `client/src/pages/ResumeBuilder.jsx`

- [x] Pre-fill skills, experience, education from user profile data when loading a new/empty resume form

### Step 3: Client-side fix - `client/src/pages/JobSeekerProfile.jsx`

- [x] Add a "Sync to Resume" button that after saving profile, also updates/creates a resume record with the same data
