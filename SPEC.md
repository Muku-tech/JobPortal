# JobSathi - Nepal Job Portal Project Specification

## Project Overview

- **Project Name**: JobSathi (Job Friend in Nepali)
- **Type**: Full-stack Web Application (Job Portal)
- **Core Functionality**: A job portal specifically designed for Nepal with intelligent job recommendations using three ML algorithms: Content-Based Filtering, Collaborative Filtering, and K-Means Clustering
- **Target Users**: Job seekers and employers in Nepal

## Technology Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Algorithms**:
  - Content-Based Filtering
  - Collaborative Filtering
  - K-Means Clustering

## Nepal-Specific Data

### Cities (Locations)

- Kathmandu
- Pokhara
- Biratnagar
- Lalitpur
- Bhaktapur
- Butwal
- Narayangadh
- Birgunj
- Janakpur
- Dharan
- Itahari
- Hetauda

### Job Categories

- Information Technology
- Banking & Finance
- Teaching & Education
- Tourism & Hospitality
- Healthcare & Medical
- Engineering
- Marketing & Sales
- Administration & HR
- Construction & Real Estate
- Agriculture & Forestry
- Media & Communication
- Retail & Customer Service

### Sample Companies

- Nabil Bank
- Nepal Telecom
- NIC Asia
- Himalayan Bank
- CG Corp Global
- Yeti Airlines
- Saurya Airlines
- BPC Limited
- NMB Bank
- Prime Bank
- Sanima Bank
- Laxmi Bank

## API Endpoints

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Jobs

- GET /api/jobs (with filters)
- GET /api/jobs/:id
- POST /api/jobs (employer only)
- PUT /api/jobs/:id (employer only)
- DELETE /api/jobs/:id (employer only)

### Applications

- POST /api/applications
- GET /api/applications/user/:userId
- GET /api/applications/job/:jobId
- PUT /api/applications/:id/status

### Recommendations

- GET /api/recommendations/content-based
- GET /api/recommendations/collaborative
- GET /api/recommendations/kmeans

### Profile

- GET /api/users/profile
- PUT /api/users/profile

## Algorithms Implementation

### 1. Content-Based Filtering

- Match user skills with job required skills
- Match user preferred job types with job types
- Match user preferred locations with job locations
- Calculate similarity scores using cosine similarity

### 2. Collaborative Filtering

- Track user job views and applications
- Find similar users based on their job interaction patterns
- Use user-item interaction matrix
- Recommend jobs that similar users have viewed/applied to

### 3. K-Means Clustering

- Cluster jobs based on features (salary, category, location, experience)
- Cluster users based on their profile and behavior
- Recommend jobs from clusters that match user cluster

## Acceptance Criteria

1. User can register as job seeker or employer
2. User can login and logout
3. Employer can post jobs with all Nepal-specific fields
4. Job seeker can search and filter jobs
5. Job seeker can apply to jobs
6. Content-Based Filtering recommends jobs based on skills
7. Collaborative Filtering recommends jobs based on similar users
8. K-Means Clustering groups jobs and users for recommendations
9. Responsive design for all devices
10. Nepal-specific locations and companies in dropdowns
