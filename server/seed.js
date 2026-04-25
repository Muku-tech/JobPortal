require("dotenv").config();
const { User, Job, Application, JobView } = require("./models");
const kMeansClustering = require("./services/algorithms/kMeansClustering");

const PWD = "123456";
const N_EMP = 24;
const N_JOB = 150;

const FN = [
  "Ram",
  "Sita",
  "Hari",
  "Gita",
  "Krishna",
  "Radha",
  "Shyam",
  "Maya",
  "Bikash",
  "Anjali",
  "Prakash",
  "Sunita",
  "Ramesh",
  "Nisha",
  "Dinesh",
  "Pooja",
  "Santosh",
  "Kamala",
  "Rajesh",
  "Saraswati",
  "Binod",
  "Laxmi",
  "Govinda",
  "Parbati",
  "Manoj",
  "Rekha",
  "Deepak",
  "Sabina",
  "Arjun",
  "Ritu",
  "Nabin",
  "Sushma",
  "Bijay",
  "Anita",
  "Suresh",
  "Kalpana",
  "Pradeep",
  "Menuka",
  "Sagar",
  "Priya",
  "Amit",
  "Srijana",
  "Rabin",
  "Bandana",
  "Umesh",
  "Mina",
  "Kiran",
  "Goma",
  "Sanjay",
  "Kabita",
  "Nirajan",
  "Yamuna",
  "Pramod",
  "Chanda",
  "Raju",
  "Devi",
  "Suman",
  "Jyoti",
  "Mahesh",
  "Sangita",
  "Dipesh",
  "Nirmala",
  "Bishal",
  "Rashmi",
];
const LN = [
  "Sharma",
  "Poudel",
  "Gurung",
  "Tamang",
  "Thapa",
  "K.C.",
  "Adhikari",
  "Bhattarai",
  "Rai",
  "Limbu",
  "Magar",
  "Shrestha",
  "Bhandari",
  "Karki",
  "Basnet",
  "Pokharel",
  "Aryal",
  "Ghimire",
  "Subedi",
  "Khadka",
  "Dahal",
  "Bista",
  "Pariyar",
  "Sunuwar",
  "BK",
  "Chaudhary",
  "Mahato",
  "Yadav",
  "Mandal",
  "Jha",
  "Singh",
  "Gupta",
  "Mishra",
  "Lama",
  "Sherpa",
  "Newar",
  "Pradhan",
  "Rana",
  "Shah",
  "Malla",
  "Joshi",
  "Regmi",
  "Pandey",
  "Upreti",
  "Neupane",
  "Sapkota",
  "Gautam",
  "Acharya",
  "Koirala",
  "Pathak",
  "Dhakal",
  "Niroula",
  "Tiwari",
];
const CT = [
  "Kathmandu",
  "Pokhara",
  "Birgunj",
  "Biratnagar",
  "Lalitpur",
  "Bhaktapur",
  "Butwal",
  "Dharan",
  "Janakpur",
  "Narayangadh",
  "Hetauda",
  "Itahari",
  "Dhangadhi",
  "Bhairahawa",
  "Nepalgunj",
  "Mahendranagar",
  "Ilam",
  "Palpa",
  "Gorkha",
  "Kavrepalanchok",
];

const EMP = [
  { n: "Nabil Bank Ltd.", s: "Banking & Finance", i: "Commercial Banking" },
  { n: "NIC Asia Bank", s: "Banking & Finance", i: "Commercial Banking" },
  { n: "Himalayan Bank", s: "Banking & Finance", i: "Commercial Banking" },
  { n: "NMB Bank", s: "Banking & Finance", i: "Development Banking" },
  { n: "Global IME Bank", s: "Banking & Finance", i: "Commercial Banking" },
  { n: "Laxmi Bank", s: "Banking & Finance", i: "Commercial Banking" },
  { n: "Nepal Telecom", s: "Information Technology", i: "Telecom" },
  { n: "Ncell Axiata", s: "Information Technology", i: "Telecom" },
  { n: "F1Soft International", s: "Information Technology", i: "Fintech" },
  {
    n: "Deerwalk Inc.",
    s: "Information Technology",
    i: "Software Development",
  },
  {
    n: "Leapfrog Technology",
    s: "Information Technology",
    i: "Software Development",
  },
  { n: "WorldLink Communications", s: "Information Technology", i: "ISP" },
  { n: "Yeti Airlines", s: "Tourism & Hospitality", i: "Aviation" },
  { n: "Buddha Air", s: "Tourism & Hospitality", i: "Aviation" },
  { n: "Dwarika's Hotel", s: "Tourism & Hospitality", i: "Luxury Hospitality" },
  {
    n: "Hyatt Regency Kathmandu",
    s: "Tourism & Hospitality",
    i: "Luxury Hospitality",
  },
  {
    n: "Chaudhary Group (CG)",
    s: "Retail & Customer Service",
    i: "Conglomerate",
  },
  { n: "Surya Nepal Pvt. Ltd.", s: "Retail & Customer Service", i: "FMCG" },
  { n: "Unilever Nepal", s: "Retail & Customer Service", i: "FMCG" },
  { n: "Daraz Nepal", s: "Retail & Customer Service", i: "E-commerce" },
  { n: "Butwal Power Company", s: "Energy & Infrastructure", i: "Hydro Power" },
  {
    n: "Nepal Electricity Authority",
    s: "Energy & Infrastructure",
    i: "Electricity",
  },
  {
    n: "Kathmandu University",
    s: "Teaching & Education",
    i: "Higher Education",
  },
  {
    n: "Tribhuvan University",
    s: "Teaching & Education",
    i: "Higher Education",
  },
  { n: "Patan Hospital", s: "Healthcare & Medical", i: "Hospital" },
  { n: "Teaching Hospital (IOM)", s: "Healthcare & Medical", i: "Hospital" },
  {
    n: "Grande International Hospital",
    s: "Healthcare & Medical",
    i: "Hospital",
  },
  {
    n: "Norvic International Hospital",
    s: "Healthcare & Medical",
    i: "Hospital",
  },
  { n: "Mercy Corps Nepal", s: "Legal & Compliance", i: "International NGO" },
  {
    n: "Save the Children Nepal",
    s: "Legal & Compliance",
    i: "International NGO",
  },
  { n: "Kantipur Media Group", s: "Media & Communication", i: "Media" },
  { n: "Annapurna Media Network", s: "Media & Communication", i: "Media" },
  {
    n: "Sagarmatha Cement",
    s: "Construction & Real Estate",
    i: "Cement Manufacturing",
  },
  {
    n: "Jagdamba Cement",
    s: "Construction & Real Estate",
    i: "Cement Manufacturing",
  },
  { n: "Nepal Seeds Company", s: "Agriculture & Forestry", i: "Agriculture" },
  {
    n: "Nepal Agricultural Research Council",
    s: "Agriculture & Forestry",
    i: "Research",
  },
  {
    n: "Creative Solutions Nepal",
    s: "Design & Creative",
    i: "Creative Agency",
  },
  {
    n: "Incessant Rain Studios",
    s: "Design & Creative",
    i: "Animation Studio",
  },
];

const GRP = [
  {
    n: "Frontend",
    c: 10,
    core: ["React", "HTML", "CSS"],
    x: ["JavaScript", "TypeScript", "Next.js", "Tailwind", "Git"],
  },
  {
    n: "Backend",
    c: 10,
    core: ["Node.js", "MongoDB", "SQL"],
    x: ["Python", "Java", "AWS", "Django", "Express.js", "PostgreSQL"],
  },
  {
    n: "Fullstack",
    c: 8,
    core: ["React", "Node.js", "HTML", "CSS"],
    x: ["MongoDB", "SQL", "AWS", "TypeScript", "Git"],
  },
  {
    n: "Data",
    c: 6,
    core: ["Python", "Data Analysis", "SQL"],
    x: ["Power BI", "Tableau", "Machine Learning", "Excel", "Pandas"],
  },
  {
    n: "DevOps",
    c: 5,
    core: ["AWS", "Docker", "Kubernetes", "Linux"],
    x: ["CI/CD", "Terraform", "Jenkins", "Git", "Bash"],
  },
  {
    n: "Mobile",
    c: 5,
    core: ["Flutter", "Firebase", "Git"],
    x: ["Kotlin", "Swift", "React Native", "Dart", "Android"],
  },
  {
    n: "Finance",
    c: 8,
    core: ["Accounting", "Excel", "Financial Analysis"],
    x: [
      "Tally",
      "Taxation",
      "Risk Management",
      "Banking Operations",
      "Auditing",
    ],
  },
  {
    n: "Healthcare",
    c: 8,
    core: ["Nursing", "Patient Care", "Medical Coding"],
    x: [
      "Pharmacy",
      "Laboratory Techniques",
      "Healthcare IT",
      "Clinical Research",
      "Dental Care",
    ],
  },
  {
    n: "Education",
    c: 7,
    core: ["Teaching", "Curriculum Design", "Classroom Management"],
    x: [
      "Educational Psychology",
      "Student Counseling",
      "E-Learning",
      "Child Development",
      "Training & Development",
    ],
  },
  {
    n: "CivilEng",
    c: 6,
    core: ["Civil Engineering", "AutoCAD", "Structural Analysis"],
    x: [
      "Project Management",
      "Site Management",
      "Surveying",
      "Building Codes",
      "Quantity Surveying",
    ],
  },
  {
    n: "ElecEng",
    c: 5,
    core: ["Electrical Engineering", "AutoCAD", "Power Systems"],
    x: [
      "Hydro Power Engineering",
      "Safety Management",
      "PLC",
      "Renewable Energy",
    ],
  },
  {
    n: "Tourism",
    c: 6,
    core: ["Hospitality Management", "Customer Service", "Communication"],
    x: [
      "Tour Guiding",
      "Event Planning",
      "Reservation Systems",
      "Food Safety",
      "Culinary Arts",
    ],
  },
  {
    n: "Marketing",
    c: 7,
    core: ["Digital Marketing", "SEO", "Social Media"],
    x: [
      "Content Writing",
      "Google Ads",
      "Analytics",
      "Brand Management",
      "Public Relations",
    ],
  },
  {
    n: "Agriculture",
    c: 5,
    core: ["Agronomy", "Soil Science", "Crop Management"],
    x: [
      "Irrigation Systems",
      "Food Processing",
      "Livestock Management",
      "Sustainable Farming",
    ],
  },
  {
    n: "Construction",
    c: 5,
    core: ["Site Management", "Construction Planning", "Quality Control"],
    x: [
      "Safety Management",
      "AutoCAD",
      "Blueprint Reading",
      "Material Management",
      "Supervision",
    ],
  },
  {
    n: "Media",
    c: 5,
    core: ["Journalism", "Content Writing", "Photography"],
    x: [
      "Video Editing",
      "Adobe Premiere",
      "Adobe Photoshop",
      "Social Media",
      "Broadcasting",
    ],
  },
  {
    n: "NGO",
    c: 5,
    core: ["Project Management", "Grant Writing", "Monitoring & Evaluation"],
    x: [
      "Community Development",
      "Report Writing",
      "Baseline Survey",
      "Capacity Building",
      "WASH Programs",
    ],
  },
  {
    n: "HR/Admin",
    c: 5,
    core: ["HR Management", "Recruitment", "Office Administration"],
    x: [
      "Payroll",
      "Labor Law Compliance",
      "Training & Development",
      "MS Office",
      "Communication",
    ],
  },
];

const JT = [
  {
    t: "React Developer",
    sk: ["React", "HTML", "CSS", "JavaScript"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "Node.js Backend Developer",
    sk: ["Node.js", "MongoDB", "SQL", "Git"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "Python Django Developer",
    sk: ["Python", "Django", "SQL", "AWS"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "DevOps Engineer",
    sk: ["AWS", "Docker", "Kubernetes", "Linux"],
    c: "Information Technology",
    l: "senior",
  },
  {
    t: "QA Engineer",
    sk: ["Java", "Python", "SQL", "Automation Testing"],
    c: "Information Technology",
    l: "entry",
  },
  {
    t: "Mobile App Developer",
    sk: ["Flutter", "Kotlin", "Firebase", "Git"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "IT Support Officer",
    sk: [
      "Network Administration",
      "Windows Server",
      "Communication",
      "Problem Solving",
    ],
    c: "Information Technology",
    l: "entry",
  },
  {
    t: "Cybersecurity Analyst",
    sk: ["Cybersecurity", "Network Administration", "Linux", "Risk Assessment"],
    c: "Information Technology",
    l: "senior",
  },
  {
    t: "Full Stack Developer",
    sk: ["React", "Node.js", "MongoDB", "TypeScript"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "Cloud Solutions Architect",
    sk: ["AWS", "Docker", "Kubernetes", "DevOps"],
    c: "Information Technology",
    l: "senior",
  },
  {
    t: "Database Administrator",
    sk: ["SQL", "MongoDB", "PostgreSQL", "Linux"],
    c: "Information Technology",
    l: "senior",
  },
  {
    t: "Software Engineer (Java)",
    sk: ["Java", "Spring Boot", "SQL", "Git"],
    c: "Information Technology",
    l: "mid",
  },
  {
    t: "UI/UX Designer",
    sk: ["UI/UX Design", "Figma", "Adobe Photoshop", "HTML"],
    c: "Design & Creative",
    l: "mid",
  },
  {
    t: "Motion Graphics Designer",
    sk: ["Adobe Premiere", "Video Editing", "Adobe Photoshop", "Creativity"],
    c: "Design & Creative",
    l: "mid",
  },
  {
    t: "Bank Teller",
    sk: ["Banking Operations", "Customer Service", "Excel", "Communication"],
    c: "Banking & Finance",
    l: "entry",
  },
  {
    t: "Financial Analyst",
    sk: ["Financial Analysis", "Excel", "Accounting", "Tally"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Loan Officer",
    sk: ["Banking Operations", "Sales", "Communication", "Risk Assessment"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Branch Manager",
    sk: ["Leadership", "Banking Operations", "Teamwork", "Sales"],
    c: "Banking & Finance",
    l: "senior",
  },
  {
    t: "Internal Auditor",
    sk: ["Auditing", "Accounting", "Excel", "Compliance"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Investment Analyst",
    sk: ["Investment Analysis", "Financial Analysis", "Excel", "Tally"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Credit Analyst",
    sk: ["Risk Management", "Financial Analysis", "Excel", "Accounting"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Relationship Manager",
    sk: ["Sales", "Customer Service", "Financial Analysis", "Leadership"],
    c: "Banking & Finance",
    l: "senior",
  },
  {
    t: "Compliance Officer",
    sk: [
      "Compliance Auditing",
      "Risk Management",
      "Legal Research",
      "Attention to Detail",
    ],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Accountant",
    sk: ["Accounting", "Tally", "Excel", "Taxation"],
    c: "Banking & Finance",
    l: "mid",
  },
  {
    t: "Mathematics Teacher",
    sk: [
      "Teaching",
      "Curriculum Design",
      "Communication",
      "Classroom Management",
    ],
    c: "Teaching & Education",
    l: "mid",
  },
  {
    t: "Science Teacher",
    sk: [
      "Teaching",
      "Classroom Management",
      "Subject Matter Expertise",
      "Communication",
    ],
    c: "Teaching & Education",
    l: "mid",
  },
  {
    t: "School Principal",
    sk: [
      "Leadership",
      "HR Management",
      "Curriculum Design",
      "Strategic Planning",
    ],
    c: "Teaching & Education",
    l: "senior",
  },
  {
    t: "Lecturer - Computer Science",
    sk: ["Teaching", "Java", "Python", "Data Structures"],
    c: "Teaching & Education",
    l: "senior",
  },
  {
    t: "Early Childhood Educator",
    sk: ["Teaching", "Child Development", "Communication", "Creativity"],
    c: "Teaching & Education",
    l: "entry",
  },
  {
    t: "Training Coordinator",
    sk: [
      "Training & Development",
      "Curriculum Design",
      "Communication",
      "Project Management",
    ],
    c: "Teaching & Education",
    l: "mid",
  },
  {
    t: "Educational Counselor",
    sk: [
      "Student Counseling",
      "Communication",
      "Educational Psychology",
      "Career Guidance",
    ],
    c: "Teaching & Education",
    l: "mid",
  },
  {
    t: "IT Instructor",
    sk: ["Teaching", "Python", "HTML", "CSS", "JavaScript"],
    c: "Teaching & Education",
    l: "mid",
  },
  {
    t: "Hotel Manager",
    sk: [
      "Hospitality Management",
      "Leadership",
      "Customer Service",
      "Operations Management",
    ],
    c: "Tourism & Hospitality",
    l: "senior",
  },
  {
    t: "Tour Guide",
    sk: ["Tour Guiding", "Communication", "Customer Service", "First Aid"],
    c: "Tourism & Hospitality",
    l: "entry",
  },
  {
    t: "Event Coordinator",
    sk: [
      "Event Planning",
      "Social Media",
      "Communication",
      "Budget Management",
    ],
    c: "Tourism & Hospitality",
    l: "mid",
  },
  {
    t: "Front Desk Officer",
    sk: ["Customer Service", "Communication", "MS Office", "Multitasking"],
    c: "Tourism & Hospitality",
    l: "entry",
  },
  {
    t: "Restaurant Manager",
    sk: [
      "Hospitality Management",
      "Teamwork",
      "Customer Service",
      "Inventory Management",
    ],
    c: "Tourism & Hospitality",
    l: "mid",
  },
  {
    t: "Airport Ground Staff",
    sk: ["Customer Service", "Communication", "Safety Management", "Teamwork"],
    c: "Tourism & Hospitality",
    l: "entry",
  },
  {
    t: "Travel Consultant",
    sk: ["Sales", "Customer Service", "Reservation Systems", "Communication"],
    c: "Tourism & Hospitality",
    l: "mid",
  },
  {
    t: "Chef de Partie",
    sk: ["Culinary Arts", "Kitchen Management", "Food Safety", "Creativity"],
    c: "Tourism & Hospitality",
    l: "mid",
  },
  {
    t: "Registered Nurse",
    sk: ["Nursing", "Patient Care", "Communication", "Medical Coding"],
    c: "Healthcare & Medical",
    l: "mid",
  },
  {
    t: "Medical Coder",
    sk: ["Medical Coding", "Excel", "Attention to Detail", "Healthcare IT"],
    c: "Healthcare & Medical",
    l: "entry",
  },
  {
    t: "Pharmacist",
    sk: ["Pharmacy", "Patient Care", "Drug Interactions", "Communication"],
    c: "Healthcare & Medical",
    l: "senior",
  },
  {
    t: "Lab Technician",
    sk: [
      "Laboratory Techniques",
      "Attention to Detail",
      "Medical Lab Technology",
      "Record Keeping",
    ],
    c: "Healthcare & Medical",
    l: "entry",
  },
  {
    t: "Dental Surgeon",
    sk: [
      "Surgery Assistance",
      "Patient Care",
      "Clinical Research",
      "Communication",
    ],
    c: "Healthcare & Medical",
    l: "senior",
  },
  {
    t: "Physiotherapist",
    sk: ["Physiotherapy", "Patient Care", "Rehabilitation", "Communication"],
    c: "Healthcare & Medical",
    l: "mid",
  },
  {
    t: "Health Program Officer",
    sk: [
      "Project Management",
      "Community Development",
      "Report Writing",
      "Data Analysis",
    ],
    c: "Healthcare & Medical",
    l: "mid",
  },
  {
    t: "Medical Representative",
    sk: ["Sales", "Pharmacy", "Communication", "Relationship Building"],
    c: "Healthcare & Medical",
    l: "entry",
  },
  {
    t: "Civil Engineer",
    sk: [
      "Civil Engineering",
      "AutoCAD",
      "Structural Analysis",
      "Project Management",
    ],
    c: "Engineering",
    l: "mid",
  },
  {
    t: "Site Engineer",
    sk: [
      "Site Management",
      "AutoCAD",
      "Construction Planning",
      "Quality Control",
    ],
    c: "Engineering",
    l: "mid",
  },
  {
    t: "Structural Engineer",
    sk: [
      "Structural Analysis",
      "AutoCAD",
      "Civil Engineering",
      "Building Codes",
    ],
    c: "Engineering",
    l: "senior",
  },
  {
    t: "Electrical Engineer",
    sk: [
      "Electrical Engineering",
      "AutoCAD",
      "Power Systems",
      "Safety Management",
    ],
    c: "Engineering",
    l: "mid",
  },
  {
    t: "Hydropower Engineer",
    sk: [
      "Hydro Power Engineering",
      "Project Management",
      "Environmental Engineering",
      "Surveying",
    ],
    c: "Engineering",
    l: "senior",
  },
  {
    t: "Mechanical Engineer",
    sk: [
      "Mechanical Engineering",
      "AutoCAD",
      "Manufacturing Processes",
      "Quality Assurance",
    ],
    c: "Engineering",
    l: "mid",
  },
  {
    t: "Environmental Engineer",
    sk: [
      "Environmental Engineering",
      "Water Resource Engineering",
      "Impact Assessment",
      "Project Management",
    ],
    c: "Engineering",
    l: "mid",
  },
  {
    t: "Project Engineer",
    sk: [
      "Project Management",
      "Civil Engineering",
      "Budget Management",
      "Leadership",
    ],
    c: "Engineering",
    l: "senior",
  },
  {
    t: "Marketing Manager",
    sk: [
      "Digital Marketing",
      "SEO",
      "Social Media",
      "Leadership",
      "Brand Management",
    ],
    c: "Marketing & Sales",
    l: "senior",
  },
  {
    t: "Sales Executive",
    sk: ["Sales", "Communication", "Customer Service", "Negotiation"],
    c: "Marketing & Sales",
    l: "entry",
  },
  {
    t: "Content Writer",
    sk: ["Content Writing", "SEO", "Social Media", "Research"],
    c: "Marketing & Sales",
    l: "entry",
  },
  {
    t: "Digital Marketing Specialist",
    sk: ["Digital Marketing", "SEO", "Google Ads", "Analytics"],
    c: "Marketing & Sales",
    l: "mid",
  },
  {
    t: "Brand Manager",
    sk: [
      "Brand Management",
      "Market Research",
      "Communication",
      "Strategic Planning",
    ],
    c: "Marketing & Sales",
    l: "senior",
  },
  {
    t: "Business Development Officer",
    sk: ["Sales", "Market Research", "Communication", "Strategic Planning"],
    c: "Marketing & Sales",
    l: "mid",
  },
  {
    t: "Social Media Manager",
    sk: ["Social Media", "Content Writing", "Digital Marketing", "Analytics"],
    c: "Marketing & Sales",
    l: "mid",
  },
  {
    t: "Sales Manager",
    sk: ["Sales", "Leadership", "Team Management", "Strategic Planning"],
    c: "Marketing & Sales",
    l: "senior",
  },
  {
    t: "HR Manager",
    sk: ["HR Management", "Recruitment", "Leadership", "Labor Law Compliance"],
    c: "Administration & HR",
    l: "senior",
  },
  {
    t: "Office Administrator",
    sk: ["Office Administration", "Excel", "Communication", "Multitasking"],
    c: "Administration & HR",
    l: "entry",
  },
  {
    t: "Recruitment Specialist",
    sk: ["Recruitment", "Communication", "Interviewing", "HR Management"],
    c: "Administration & HR",
    l: "mid",
  },
  {
    t: "Payroll Officer",
    sk: ["Payroll", "Excel", "Accounting", "Attention to Detail"],
    c: "Administration & HR",
    l: "mid",
  },
  {
    t: "Administrative Assistant",
    sk: [
      "Office Administration",
      "MS Office",
      "Communication",
      "Time Management",
    ],
    c: "Administration & HR",
    l: "entry",
  },
  {
    t: "Training & Development Officer",
    sk: [
      "Training & Development",
      "Curriculum Design",
      "Communication",
      "HR Management",
    ],
    c: "Administration & HR",
    l: "mid",
  },
  {
    t: "Construction Project Manager",
    sk: [
      "Project Management",
      "Construction Planning",
      "Site Management",
      "Budget Management",
    ],
    c: "Construction & Real Estate",
    l: "senior",
  },
  {
    t: "Quantity Surveyor",
    sk: ["Quantity Surveying", "AutoCAD", "Excel", "Cost Estimation"],
    c: "Construction & Real Estate",
    l: "mid",
  },
  {
    t: "Safety Officer",
    sk: [
      "Safety Management",
      "Risk Assessment",
      "Construction Planning",
      "Compliance",
    ],
    c: "Construction & Real Estate",
    l: "mid",
  },
  {
    t: "Construction Supervisor",
    sk: [
      "Site Management",
      "Team Leadership",
      "Quality Control",
      "Construction Planning",
    ],
    c: "Construction & Real Estate",
    l: "mid",
  },
  {
    t: "Mason / Foreman",
    sk: [
      "Construction Planning",
      "Team Leadership",
      "Blueprint Reading",
      "Quality Control",
    ],
    c: "Construction & Real Estate",
    l: "entry",
  },
  {
    t: "Agricultural Officer",
    sk: [
      "Agronomy",
      "Irrigation Systems",
      "Project Management",
      "Agricultural Extension",
    ],
    c: "Agriculture & Forestry",
    l: "mid",
  },
  {
    t: "Livestock Supervisor",
    sk: [
      "Livestock Management",
      "Veterinary Basics",
      "Record Keeping",
      "Teamwork",
    ],
    c: "Agriculture & Forestry",
    l: "entry",
  },
  {
    t: "Agronomist",
    sk: ["Agronomy", "Soil Science", "Crop Management", "Data Analysis"],
    c: "Agriculture & Forestry",
    l: "mid",
  },
  {
    t: "Irrigation Engineer",
    sk: [
      "Irrigation Systems",
      "Civil Engineering",
      "Water Resource Engineering",
      "AutoCAD",
    ],
    c: "Agriculture & Forestry",
    l: "mid",
  },
  {
    t: "Food Processing Technician",
    sk: [
      "Food Processing",
      "Quality Control",
      "Hygiene Standards",
      "Machine Operation",
    ],
    c: "Agriculture & Forestry",
    l: "entry",
  },
  {
    t: "Program Officer",
    sk: [
      "Project Management",
      "Grant Writing",
      "Monitoring & Evaluation",
      "Report Writing",
    ],
    c: "Legal & Compliance",
    l: "mid",
  },
  {
    t: "Monitoring & Evaluation Officer",
    sk: [
      "Monitoring & Evaluation",
      "Data Analysis",
      "Baseline Survey",
      "Report Writing",
    ],
    c: "Legal & Compliance",
    l: "mid",
  },
  {
    t: "Community Mobilizer",
    sk: [
      "Community Development",
      "Communication",
      "Capacity Building",
      "Field Operations",
    ],
    c: "Legal & Compliance",
    l: "entry",
  },
  {
    t: "Grant Manager",
    sk: [
      "Grant Writing",
      "Project Management",
      "Budget Management",
      "Donor Relations",
    ],
    c: "Legal & Compliance",
    l: "senior",
  },
  {
    t: "Field Coordinator",
    sk: ["Field Operations", "Team Coordination", "Logistics", "Communication"],
    c: "Legal & Compliance",
    l: "mid",
  },
  {
    t: "Journalist",
    sk: ["Journalism", "Content Writing", "Research", "Interviewing"],
    c: "Media & Communication",
    l: "mid",
  },
  {
    t: "Video Editor",
    sk: [
      "Video Editing",
      "Adobe Premiere",
      "Storytelling",
      "Attention to Detail",
    ],
    c: "Media & Communication",
    l: "mid",
  },
  {
    t: "Graphic Designer",
    sk: [
      "Graphic Design",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Creativity",
    ],
    c: "Design & Creative",
    l: "mid",
  },
  {
    t: "Media Producer",
    sk: [
      "Media Production",
      "Project Management",
      "Budget Management",
      "Team Coordination",
    ],
    c: "Media & Communication",
    l: "senior",
  },
  {
    t: "Social Media Content Creator",
    sk: ["Social Media", "Content Writing", "Photography", "Trend Analysis"],
    c: "Media & Communication",
    l: "entry",
  },
  {
    t: "Data Analyst",
    sk: ["Python", "Data Analysis", "SQL", "Excel", "Power BI"],
    c: "Data Science & Analytics",
    l: "mid",
  },
  {
    t: "Data Scientist",
    sk: [
      "Python",
      "Machine Learning",
      "Statistical Analysis",
      "SQL",
      "Data Visualization",
    ],
    c: "Data Science & Analytics",
    l: "senior",
  },
  {
    t: "Business Intelligence Analyst",
    sk: ["Power BI", "SQL", "Data Visualization", "Business Intelligence"],
    c: "Data Science & Analytics",
    l: "mid",
  },
  {
    t: "Research Analyst",
    sk: ["Statistical Analysis", "Excel", "Report Writing", "Data Collection"],
    c: "Data Science & Analytics",
    l: "entry",
  },
];

const EDU_MAP = {
  entry: ["High School / +2", "Diploma", "Bachelor's Degree"],
  mid: ["Bachelor's Degree", "Master's Degree"],
  senior: [
    "Bachelor's Degree",
    "Master's Degree",
    "Professional Certification",
  ],
  lead: ["Master's Degree", "MBA", "Professional Certification"],
  executive: ["Master's Degree", "MBA", "PhD"],
};

const BNF = [
  "Health insurance",
  "Provident fund",
  "Paid annual leave",
  "Performance bonus",
  "Professional development allowance",
  "Transportation allowance",
  "Lunch allowance",
  "Flexible working hours",
  "Remote work options",
  "Maternity/paternity leave",
  "Team building events",
  "Festival bonuses",
  "Overtime pay",
  "Skill certification support",
  "Mobile/internet allowance",
];

function rI(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function pR(a, n) {
  const s = [...a].sort(() => 0.5 - Math.random());
  return s.slice(0, n);
}
function pO(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function gN() {
  return `${pO(FN)} ${pO(LN)}`;
}
function gP() {
  return `98${rI(10000000, 99999999)}`;
}
function sM(uS, jS) {
  if (!uS || !jS) return 0;
  return jS.filter((s) => uS.includes(s)).length;
}
function gD(t, co, sk, lvl) {
  return `We are seeking a ${t} (${lvl}) to join ${co}. You will leverage skills in ${sk.slice(0, 3).join(", ")} to drive impactful results. Responsibilities include collaborating with cross-functional teams, delivering high-quality work, and contributing to organizational growth. Requirements: proven experience with ${sk.slice(0, 2).join(" and ")}, strong problem-solving abilities, and excellent communication.`;
}

async function seed() {
  console.log("=== Nepali Job Portal Seed ===\n");

  console.log("Cleaning existing data...");
  const { sequelize } = require("./config/database");
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  await JobView.destroy({ where: {}, truncate: true });
  await Application.destroy({ where: {}, truncate: true });
  await Job.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("  Data cleaned\n");

  console.log("Creating employers...");
  const emps = [];
  const se = [...EMP].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(N_EMP, se.length); i++) {
    const co = se[i];
    const em = await User.create({
      name: gN(),
      email: i === 0 ? "employer@nepal.com" : `employer${i + 1}@nepal.com`,
      password: PWD,
      role: "employer",
      company_name: co.n,
      phone: gP(),
      address: `${pO(CT)}, Nepal`,
      industry: co.i,
      company_size: pO(["1-10", "11-50", "51-200", "201-500", "500+"]),
      preferred_location: pO(CT),
    });
    emps.push(em);
    console.log(`  ${em.email} -> ${co.n}`);
  }
  console.log(`  ${emps.length} employers\n`);

  console.log("Creating job seekers...");
  const sks = [];
  let idx = 0;
  for (const g of GRP) {
    for (let i = 0; i < g.c; i++) {
      let sk = [...g.core];
      sk = [...new Set([...sk, ...pR(g.x, rI(1, 3))])];
      const s = await User.create({
        name: gN(),
        email: idx === 0 ? "seeker@nepal.com" : `seeker${idx + 1}@nepal.com`,
        password: PWD,
        role: "jobseeker",
        skills: sk,
        experience_level: pO(["entry", "mid", "senior"]),
        preferred_location: pO(CT),
        preferred_job_type: pO([
          "full-time",
          "part-time",
          "contract",
          "internship",
        ]),
        phone: gP(),
        address: `${pO(CT)}, Nepal`,
        education: pO([
          "Bachelor's Degree",
          "Master's Degree",
          "Diploma",
          "Professional Certification",
        ]),
        languages: ["Nepali", "English"],
      });
      sks.push(s);
      idx++;
    }
    console.log(`  ${g.n}: ${g.c}`);
  }
  console.log(`  Total seekers: ${sks.length}\n`);

  console.log("Creating jobs (sector-matched)...");
  const jobs = [];
  const empBySec = {};
  emps.forEach((e) => {
    const s = e.company_name
      ? EMP.find((x) => x.n === e.company_name)?.s
      : "Other";
    const k = s || "Other";
    if (!empBySec[k]) empBySec[k] = [];
    empBySec[k].push(e);
  });
  for (let i = 0; i < N_JOB; i++) {
    const tmpl = JT[i % JT.length];
    let pool = empBySec[tmpl.c] || emps;
    if (pool.length === 0) pool = emps;
    const emp = pO(pool);
    const salMin = rI(20000, 60000);
    const job = await Job.create({
      employer_id: emp.id,
      title: tmpl.t,
      description: gD(tmpl.t, emp.company_name, tmpl.sk, tmpl.l),
      company_name: emp.company_name,
      location: pO(CT),
      job_type: pO(["full-time", "part-time", "contract", "internship"]),
      category: tmpl.c,
      salary_min: salMin,
      salary_max: salMin + rI(30000, 140000),
      salary_currency: "NPR",
      required_skills: tmpl.sk,
      experience_level: tmpl.l,
      education_level: pO(EDU_MAP[tmpl.l] || EDU_MAP.mid),
      status: "active",
      vacancy: rI(1, 5),
      deadline: new Date(Date.now() + rI(7, 90) * 86400000),
      benefits: pR(BNF, rI(3, 6)).join(", "),
    });
    jobs.push(job);
  }
  console.log(`  ${jobs.length} jobs\n`);

  console.log("Simulating applications...");
  let appCnt = 0;
  const appD = [];
  for (const s of sks) {
    const nA = rI(5, 15);
    const seen = new Set();
    for (let a = 0; a < nA; a++) {
      const j = pO(jobs);
      if (seen.has(j.id)) continue;
      seen.add(j.id);
      const m = sM(s.skills, j.required_skills);
      const elMatch =
        (s.experience_level || "mid") === (j.experience_level || "mid")
          ? 0.3
          : 0;
      const prob = Math.min(0.95, (m > 0 ? m * 0.25 : 0.05) + elMatch);
      if (Math.random() > prob) continue;
      const st = "applied";
      appD.push({
        job_id: j.id,
        user_id: s.id,
        status: st,
        createdAt: new Date(Date.now() - rI(0, 30 * 86400000)),
      });
      appCnt++;
    }
  }
  if (appD.length > 0) await Application.bulkCreate(appD);
  console.log(`  ${appCnt} applications\n`);

  console.log("Simulating job views...");
  const vd = [];
  const viewPairs = new Set();
  for (const s of sks) {
    const nV = rI(8, 20);
    for (let v = 0; v < nV; v++) {
      const j = pO(jobs);
      const k = `${s.id}-${j.id}`;
      if (viewPairs.has(k)) continue;
      viewPairs.add(k);
      const m = sM(s.skills, j.required_skills);
      const act =
        Math.random() < (m > 1 ? 0.35 : 0.15)
          ? "apply"
          : Math.random() < 0.2
            ? "save"
            : "view";
      vd.push({
        user_id: s.id,
        job_id: j.id,
        view_duration: rI(10, 300),
        action_type: act,
        createdAt: new Date(Date.now() - rI(0, 30 * 86400000)),
      });
    }
  }
  if (vd.length > 0) await JobView.bulkCreate(vd);
  console.log(`  ${vd.length} views\n`);

  console.log("Running K-Means clustering...");
  try {
    const stats = await kMeansClustering.assignUserClusters();
    console.log(`  User clusters:`, stats);
    await kMeansClustering.trainJobClusters();
    console.log(`  Job clusters trained\n`);
  } catch (e) {
    console.log(`  Clustering skipped: ${e.message}\n`);
  }

  console.log("=== Final Counts ===");
  console.log(
    `Employers: ${await User.count({ where: { role: "employer" } })}`,
  );
  console.log(
    `Seekers:   ${await User.count({ where: { role: "jobseeker" } })}`,
  );
  console.log(`Jobs:      ${await Job.count()}`);
  console.log(`Apps:      ${await Application.count()}`);
  console.log(`Views:     ${await JobView.count()}`);
  console.log("\nSeed complete!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
