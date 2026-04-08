const { User, Job, Application, JobView } = require("../models");
const bcrypt = require("bcryptjs");

// Nepal-specific data
const nepalCities = [
  "Kathmandu", "Pokhara", "Birgunj", "Biratnagar", "Lalitpur", 
  "Bhaktapur", "Butwal", "Dharan", "Janakpur", "Narayangadh"
];

const categories = [
  "Information Technology", "Banking & Finance", "Teaching & Education",
  "Tourism & Hospitality", "Healthcare & Medical", "Engineering",
  "Marketing & Sales", "Administration & HR", "Construction", "Agriculture & Forestry"
];

const skills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "PHP", "SQL",
  "MongoDB", "Excel", "PowerPoint", "Word", "Communication", "Leadership",
  "Project Management", "Data Analysis", "Marketing", "Sales", "Accounting",
  "Teaching", "Nursing", "Engineering", "Graphic Design", "UI/UX"
];

const companies = [
  { name: "Nabil Bank", logo: "🏦" },
  { name: "Nepal Telecom", logo: "📱" },
  { name: "NIC Asia", logo: "🏛️" },
  { name: "Himalayan Bank", logo: "🏦" },
  { name: "CG Corp Global", logo: "🏢" },
  { name: "Yeti Airlines", logo: "✈️" },
  { name: "Saurya Airlines", logo: "🛫" },
  { name: "BPC Limited", logo: "⚡" },
  { name: "NMB Bank", logo: "💳" },
  { name: "Prime Bank", logo: "🏦" },
  { name: "Sanima Bank", logo: "🏛️" },
  { name: "Mega Bank", logo: "💰" },
  { name: "Buddha Air", logo: "🎈" },
  { name: "Nepal Investment Bank", logo: "📈" },
  { name: "Standard Chartered Bank", logo: "🌐" }
];

const sampleJobs = [
  {
    title: "Senior Software Engineer",
    description: "We are looking for an experienced Senior Software Engineer to join our tech team. You will be responsible for designing and developing web applications, mentoring junior developers, and collaborating with cross-functional teams.",
    category: "Information Technology",
    jobType: "full-time",
    experienceLevel: "senior",
    salaryMin: 80000,
    salaryMax: 150000,
    requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"]
  },
  {
    title: "Business Analyst",
    description: "Join our banking division as a Business Analyst. You will analyze business processes, identify improvement opportunities, and work with stakeholders to implement solutions.",
    category: "Banking & Finance",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 50000,
    salaryMax: 90000,
    requiredSkills: ["Excel", "Data Analysis", "Communication", "Project Management"]
  },
  {
    title: "Marketing Manager",
    description: "We are seeking a creative Marketing Manager to develop and execute marketing strategies, manage campaigns, and analyze market trends to drive business growth.",
    category: "Marketing & Sales",
    jobType: "full-time",
    experienceLevel: "senior",
    salaryMin: 60000,
    salaryMax: 100000,
    requiredSkills: ["Marketing", "Leadership", "Communication", "Sales"]
  },
  {
    title: "Primary Teacher",
    description: "Looking for enthusiastic Primary Teachers to join our growing educational institution. Responsibilities include lesson planning, teaching, and student assessment.",
    category: "Teaching & Education",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 25000,
    salaryMax: 40000,
    requiredSkills: ["Teaching", "Communication", "Leadership"]
  },
  {
    title: "Frontend Developer",
    description: "Join our web development team as a Frontend Developer. You will create responsive, user-friendly interfaces using React and modern CSS frameworks.",
    category: "Information Technology",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 50000,
    salaryMax: 80000,
    requiredSkills: ["JavaScript", "React", "HTML", "CSS"]
  },
  {
    title: "Accountant",
    description: "We need an experienced Accountant to handle financial records, prepare reports, and ensure compliance with accounting standards.",
    category: "Banking & Finance",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 35000,
    salaryMax: 60000,
    requiredSkills: ["Excel", "Accounting", "Data Analysis"]
  },
  {
    title: "Customer Service Representative",
    description: "Join our hospitality team as a Customer Service Representative. You will handle customer inquiries, process reservations, and ensure guest satisfaction.",
    category: "Tourism & Hospitality",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 20000,
    salaryMax: 30000,
    requiredSkills: ["Communication", "Sales"]
  },
  {
    title: "Civil Engineer",
    description: "We are looking for a Civil Engineer to oversee construction projects, prepare structural designs, and ensure compliance with building codes.",
    category: "Engineering",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 55000,
    salaryMax: 85000,
    requiredSkills: ["Engineering", "Project Management", "Leadership"]
  },
  {
    title: "Staff Nurse",
    description: "Join our healthcare team as a Staff Nurse. You will provide patient care, administer medications, and coordinate with medical staff.",
    category: "Healthcare & Medical",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 30000,
    salaryMax: 50000,
    requiredSkills: ["Nursing", "Communication"]
  },
  {
    title: "HR Officer",
    description: "Looking for an HR Officer to manage recruitment, employee relations, and HR administrative tasks.",
    category: "Administration & HR",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 40000,
    salaryMax: 65000,
    requiredSkills: ["Communication", "Leadership", "Excel"]
  },
  {
    title: "Graphic Designer",
    description: "Join our creative team as a Graphic Designer. You will create visual content, logos, and marketing materials.",
    category: "Marketing & Sales",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 25000,
    salaryMax: 45000,
    requiredSkills: ["Graphic Design", "Communication"]
  },
  {
    title: "Data Analyst",
    description: "We need a Data Analyst to collect, process, and analyze data to support business decision-making.",
    category: "Information Technology",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 45000,
    salaryMax: 75000,
    requiredSkills: ["Python", "Data Analysis", "SQL", "Excel"]
  },
  {
    title: "Sales Executive",
    description: "Join our sales team as a Sales Executive. You will identify leads, close deals, and maintain customer relationships.",
    category: "Marketing & Sales",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 25000,
    salaryMax: 50000,
    requiredSkills: ["Sales", "Communication", "Marketing"]
  },
  {
    title: "Backend Developer",
    description: "We are seeking a Backend Developer to build and maintain server-side applications using Node.js and MongoDB.",
    category: "Information Technology",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 55000,
    salaryMax: 90000,
    requiredSkills: ["Node.js", "MongoDB", "JavaScript", "SQL"]
  },
  {
    title: "Airport Operations Manager",
    description: "Join Yeti Airlines as Airport Operations Manager. You will oversee airport operations, ensure safety compliance, and manage staff.",
    category: "Tourism & Hospitality",
    jobType: "full-time",
    experienceLevel: "senior",
    salaryMin: 70000,
    salaryMax: 120000,
    requiredSkills: ["Leadership", "Project Management", "Communication"]
  },
  {
    title: "Mechanical Engineer",
    description: "Looking for a Mechanical Engineer to design mechanical systems, conduct tests, and provide technical support.",
    category: "Engineering",
    jobType: "full-time",
    experienceLevel: "mid",
    salaryMin: 50000,
    salaryMax: 80000,
    requiredSkills: ["Engineering", "Project Management"]
  },
  {
    title: "Content Writer",
    description: "Join our marketing team as a Content Writer. You will create engaging content for websites, social media, and marketing materials.",
    category: "Marketing & Sales",
    jobType: "part-time",
    experienceLevel: "entry",
    salaryMin: 15000,
    salaryMax: 30000,
    requiredSkills: ["Communication", "Marketing"]
  },
  {
    title: "IT Support Specialist",
    description: "We need an IT Support Specialist to provide technical support, troubleshoot issues, and maintain IT infrastructure.",
    category: "Information Technology",
    jobType: "full-time",
    experienceLevel: "entry",
    salaryMin: 30000,
    salaryMax: 50000,
    requiredSkills: ["JavaScript", "Node.js", "Communication"]
  },
  {
    title: "Lecturer - Computer Science",
    description: "Join our university as a Computer Science Lecturer. You will teach courses, conduct research, and mentor students.",
    category: "Teaching & Education",
    jobType: "full-time",
    experienceLevel: "senior",
    salaryMin: 55000,
    salaryMax: 95000,
    requiredSkills: ["Teaching", "Java", "Python", "Leadership"]
  },
  {
    title: "Intern - Web Development",
    description: "Start your career with us as a Web Development Intern. Learn modern web technologies and gain hands-on experience.",
    category: "Information Technology",
    jobType: "internship",
    experienceLevel: "entry",
    salaryMin: 10000,
    salaryMax: 15000,
    requiredSkills: ["JavaScript", "React", "HTML", "CSS"]
  }
];

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Clear all existing data
    await Application.destroy({ where: {} });
    await JobView.destroy({ where: {} });
    await Job.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create sample employer
    const hashedPassword = await bcrypt.hash("employer123", 10);
    const employer = await User.create({
      name: "Ram Sharma",
      email: "employer@example.com",
      password: hashedPassword,
      role: "employer",
      phone: "9841000001",
      address: "Kathmandu, Nepal"
    });

    // Create sample job seekers
    const jobSeekers = [];
    const seekerData = [
      { name: "John Doe", email: "john@example.com", skills: ["JavaScript", "React", "Node.js"], preferredLocation: "Kathmandu", preferredJobType: "full-time" },
      { name: "Jane Smith", email: "jane@example.com", skills: ["Python", "Data Analysis", "SQL"], preferredLocation: "Pokhara", preferredJobType: "full-time" },
      { name: "Alice Johnson", email: "alice@example.com", skills: ["Teaching", "Communication", "Leadership"], preferredLocation: "Kathmandu", preferredJobType: "full-time" },
      { name: "Bob Williams", email: "bob@example.com", skills: ["Marketing", "Sales", "Communication"], preferredLocation: "Birgunj", preferredJobType: "full-time" },
      { name: "Charlie Brown", email: "charlie@example.com", skills: ["Java", "Spring", "MongoDB"], preferredLocation: "Kathmandu", preferredJobType: "contract" }
    ];

    for (const seeker of seekerData) {
      const hashedPwd = await bcrypt.hash("seeker123", 10);
      const user = await User.create({
        name: seeker.name,
        email: seeker.email,
        password: hashedPwd,
        role: "jobseeker",
        skills: seeker.skills,
        preferredLocation: seeker.preferredLocation,
        preferredJobType: seeker.preferredJobType
      });
      jobSeekers.push(user);
    }

    // Create sample jobs
    const createdJobs = [];
    for (let i = 0; i < sampleJobs.length; i++) {
      const jobData = sampleJobs[i];
      const company = companies[i % companies.length];
      const location = nepalCities[i % nepalCities.length];
      
      const job = await Job.create({
        employer_id: employer.id,
        title: jobData.title,
        description: jobData.description,
        company_name: company.name,
        company_logo: company.logo,
        location: location,
        job_type: jobData.jobType,
        category: jobData.category,
        salary_min: jobData.salaryMin,
        salary_max: jobData.salaryMax,
        salary_currency: "NPR",
        required_skills: jobData.requiredSkills,
        experience_level: jobData.experienceLevel,
        status: "active",
        vacancy: Math.floor(Math.random() * 5) + 1
      });
      createdJobs.push(job);
    }

    // Create some sample applications
    await Application.create({
      job_id: createdJobs[0].id,
      user_id: jobSeekers[0].id,
      status: "under_review"\n    });

    await Application.create({
      job_id: createdJobs[1].id,
      user_id: jobSeekers[1].id,
      status: "under_review"\n    });

    await Application.create({
      job_id: createdJobs[4].id,
      user_id: jobSeekers[0].id,
      status: "shortlisted"\n    });

    // Create some job views for collaborative filtering
    await JobView.create({
      user_id: jobSeekers[0].id,
      job_id: createdJobs[0].id,
      view_duration: 120,
      action_type: "view"
    });

    await JobView.create({
      user_id: jobSeekers[0].id,
      job_id: createdJobs[1].id,
      view_duration: 60,
      action_type: "view"
    });

    await JobView.create({
      user_id: jobSeekers[1].id,
      job_id: createdJobs[1].id,
      view_duration: 180,
      action_type: "view"
    });

    await JobView.create({
      user_id: jobSeekers[1].id,
      job_id: createdJobs[11].id,
      view_duration: 90,
      action_type: "apply"
    });

    console.log("✅ Database seeded successfully!");
    console.log("");
    console.log("📋 Sample Data Created:");
    console.log(`   - ${1} Employer account`);
    console.log(`   - ${jobSeekers.length} Job Seeker accounts`);
    console.log(`   - ${createdJobs.length} Sample Jobs`);
    console.log(`   - ${3} Sample Applications`);
console.log(`   - 4 Sample Job Views`);
    console.log("");
    console.log("🔐 Test Accounts:");
    console.log("   Employer: employer@example.com / employer123");
    console.log("   Job Seeker: john@example.com / seeker123");
    console.log("");
    console.log("🎯 Recommendation Algorithms Ready:");
    console.log("   - Content-Based Filtering: Based on job seeker skills");
    console.log("   - Collaborative Filtering: Based on user job views");

seedDatabase().catch(console.error);

