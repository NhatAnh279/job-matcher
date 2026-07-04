import re


SKILLS = {

    "IT": [
        # Programming Languages
        "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript",
        "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Scala",
        "R", "MATLAB", "Perl", "Shell Scripting", "Bash",

        # Web Development
        "HTML", "CSS", "React", "Angular", "Vue.js", "Next.js",
        "Node.js", "Express.js", "Django", "Flask", "FastAPI",
        "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails",
        "Frontend", "Backend", "Full Stack",
        "REST API", "GraphQL", "WebSocket",

        # Mobile Development
        "iOS Development", "Android Development",
        "React Native", "Flutter", "SwiftUI",

        # Databases
        "SQL", "MySQL", "PostgreSQL", "SQLite",
        "MongoDB", "Redis", "Elasticsearch",
        "Firebase", "DynamoDB", "Cassandra",
        "Database Design", "Data Modeling",

        # Cloud
        "AWS", "Amazon Web Services",
        "GCP", "Google Cloud Platform",
        "Azure", "Microsoft Azure",
        "Heroku", "Vercel", "Netlify", "Render",
        "Cloud Architecture", "Serverless",

        # DevOps
        "Docker", "Kubernetes", "Jenkins",
        "CI/CD", "GitHub Actions", "GitLab CI",
        "Terraform", "Ansible",
        "Linux", "Ubuntu", "Windows Server",

        # Version Control
        "Git", "GitHub", "GitLab", "Bitbucket",

        # Data Science & ML
        "Machine Learning", "ML",
        "Deep Learning", "Neural Networks",
        "NLP", "Natural Language Processing",
        "Computer Vision",
        "TensorFlow", "PyTorch", "Keras",
        "scikit-learn", "Pandas", "NumPy",
        "Data Analysis", "Data Visualization",
        "Jupyter Notebook", "Power BI", "Tableau",

        # Cybersecurity
        "Cybersecurity", "Information Security",
        "Penetration Testing", "Vulnerability Assessment",
        "Firewall", "Encryption",
        "SIEM", "SOC", "Incident Response",

        # Networking
        "Networking", "TCP/IP", "DNS", "DHCP",
        "VPN", "Load Balancing", "CDN",

        # Testing
        "Unit Testing", "Integration Testing",
        "Selenium", "Jest", "Pytest",
        "QA", "Quality Assurance",
        "Test Automation",

        # Agile & Project Management
        "Agile", "Scrum", "Kanban",
        "Jira", "Confluence", "Trello",

        # Other
        "API Development", "Microservices",
        "System Design", "Software Architecture",
        "Technical Documentation",
        "Debugging", "Code Review"
    ],

    "Business": [
        # Business Management
        "Business Management", "Business Administration",
        "Business Development", "Strategic Planning",
        "Corporate Strategy", "Operations Management",
        "Organizational Development", "Change Management",

        # Project Management
        "Project Management", "Program Management",
        "Portfolio Management", "PMO", "Project Planning",
        "Scheduling", "Budget Management",
        "Stakeholder Management", "Resource Planning",

        # Finance & Analysis
        "Financial Analysis", "Budgeting", "Forecasting",
        "Business Analysis", "Data Analysis",
        "Business Intelligence", "KPI Development",
        "Reporting", "Power BI", "Tableau", "Excel",

        # Process Improvement
        "Lean", "Six Sigma", "Process Improvement",
        "Continuous Improvement", "Quality Management",

        # Enterprise Systems
        "ERP", "SAP", "Oracle ERP", "Microsoft Dynamics",
        "CRM", "Salesforce",

        # Soft Skills
        "Leadership", "Communication", "Negotiation",
        "Decision Making", "Problem Solving",
        "Critical Thinking", "Presentation Skills"
    ],

    "Banking": [
        # Retail Banking
        "Retail Banking", "Commercial Banking",
        "Corporate Banking", "Private Banking",
        "Investment Banking",

        # Finance
        "Financial Modeling", "Financial Reporting",
        "Accounting", "Bookkeeping", "Auditing",
        "Cash Flow Analysis",

        # Risk & Compliance
        "Risk Management", "Credit Risk",
        "Market Risk", "Operational Risk",
        "AML", "KYC", "Fraud Detection",
        "Regulatory Compliance",

        # Investments
        "Portfolio Management", "Asset Management",
        "Equity Research", "Fixed Income",
        "Treasury", "Forex", "Derivatives",

        # Lending
        "Credit Analysis", "Loan Processing",
        "Mortgage Lending", "Underwriting",

        # Banking Software
        "SWIFT", "Temenos", "Finacle", "Bloomberg Terminal"
    ],

    "Healthcare": [
        # Clinical
        "Patient Care", "Clinical Assessment",
        "Nursing", "Emergency Care",
        "Critical Care", "Surgery Assistance",

        # Medical Systems
        "Electronic Health Records",
        "Electronic Medical Records",
        "Epic", "Cerner", "Meditech",

        # Diagnostics
        "Radiology", "Ultrasound",
        "MRI", "CT Scan",
        "Laboratory Testing",

        # Administration
        "Healthcare Administration",
        "Medical Billing",
        "Medical Coding",
        "ICD-10", "CPT",

        # Compliance
        "HIPAA",
        "Infection Control",
        "Patient Safety",

        # Research
        "Clinical Research",
        "Clinical Trials",
        "Medical Research"
    ],

    "Hospitality": [

        # Customer Service
        "Customer Service", "Guest Relations", "Guest Experience",
        "Customer Satisfaction", "Complaint Resolution",
        "Customer Retention", "Client Relations",

        # Hotel Operations
        "Hotel Management", "Hotel Operations",
        "Front Office", "Front Desk",
        "Reception", "Concierge",
        "Reservations", "Check-in", "Check-out",
        "Room Management", "Night Audit",

        # Housekeeping
        "Housekeeping", "Laundry Operations",
        "Room Inspection", "Cleaning Standards",
        "Facility Maintenance",

        # Food & Beverage
        "Food Service", "Food Preparation",
        "Food Safety", "Food Handling",
        "Restaurant Management",
        "Banquet Service",
        "Catering",
        "Bartending",
        "Bar Management",
        "Wine Service",
        "Coffee Making",
        "Barista",

        # Events
        "Event Planning", "Event Coordination",
        "Conference Management",
        "Wedding Coordination",
        "Venue Management",

        # Hospitality Systems
        "POS Systems",
        "Micros POS",
        "Oracle Hospitality",
        "Opera PMS",
        "Booking Management",

        # Inventory
        "Inventory Management",
        "Stock Control",
        "Purchasing",
        "Vendor Management",

        # Finance
        "Cash Handling",
        "Billing",
        "Invoice Processing",

        # Leadership
        "Team Leadership",
        "Staff Scheduling",
        "Training",
        "Supervision",

        # Safety
        "Food Hygiene",
        "Workplace Safety",
        "Health & Safety",

        # Soft Skills
        "Communication",
        "Multitasking",
        "Time Management",
        "Problem Solving"
    ],

    # ==========================================================
    # Engineering
    # ==========================================================
    "Engineering": [

        # Core Engineering
        "Mechanical Engineering",
        "Electrical Engineering",
        "Civil Engineering",
        "Structural Engineering",
        "Chemical Engineering",
        "Industrial Engineering",
        "Manufacturing Engineering",
        "Automotive Engineering",
        "Aerospace Engineering",
        "Marine Engineering",

        # Design Software
        "AutoCAD",
        "SolidWorks",
        "CATIA",
        "Creo",
        "Fusion 360",
        "Inventor",
        "ANSYS",
        "MATLAB",
        "Simulink",
        "Revit",

        # Design
        "Mechanical Design",
        "Electrical Design",
        "Structural Design",
        "3D Modeling",
        "CAD",
        "CAM",
        "Blueprint Reading",
        "Technical Drawing",

        # Manufacturing
        "CNC Programming",
        "Machining",
        "Injection Molding",
        "Lean Manufacturing",
        "Six Sigma",
        "Process Engineering",
        "Production Planning",

        # Quality
        "Quality Assurance",
        "Quality Control",
        "Root Cause Analysis",
        "Failure Analysis",
        "FMEA",
        "ISO 9001",

        # Project Management
        "Project Engineering",
        "Engineering Management",
        "Project Planning",
        "Cost Estimation",
        "Risk Assessment",

        # Construction
        "Site Engineering",
        "Building Codes",
        "Construction Management",

        # Electrical
        "PLC Programming",
        "SCADA",
        "Control Systems",
        "Instrumentation",

        # Maintenance
        "Preventive Maintenance",
        "Predictive Maintenance",
        "Equipment Maintenance",
        "Troubleshooting",

        # Analysis
        "Finite Element Analysis",
        "Computational Fluid Dynamics",
        "Thermodynamics",
        "Fluid Mechanics",
        "Heat Transfer",

        # Safety
        "OSH",
        "Risk Management",
        "Hazard Analysis"
    ],

    # ==========================================================
    # Law
    # ==========================================================
    "Law": [

        # Legal Practice
        "Legal Research",
        "Legal Writing",
        "Legal Drafting",
        "Case Preparation",
        "Case Management",
        "Litigation",
        "Legal Analysis",

        # Corporate
        "Corporate Law",
        "Commercial Law",
        "Contract Law",
        "Contract Drafting",
        "Contract Negotiation",
        "Mergers & Acquisitions",

        # Criminal
        "Criminal Law",
        "Criminal Defense",
        "Evidence Review",

        # Civil
        "Civil Litigation",
        "Dispute Resolution",
        "Alternative Dispute Resolution",
        "Mediation",
        "Arbitration",

        # Employment
        "Employment Law",
        "Labor Law",

        # Property
        "Property Law",
        "Real Estate Law",

        # Intellectual Property
        "Patent Law",
        "Trademark Law",
        "Copyright Law",
        "Intellectual Property",

        # Compliance
        "Regulatory Compliance",
        "Legal Compliance",
        "Risk Assessment",
        "Governance",

        # Documentation
        "Legal Documentation",
        "Due Diligence",
        "Document Review",

        # Court
        "Court Procedures",
        "Trial Preparation",
        "Witness Preparation",

        # Software
        "LexisNexis",
        "Westlaw",
        "Legal Case Management",

        # Soft Skills
        "Negotiation",
        "Critical Thinking",
        "Attention to Detail",
        "Public Speaking"
    ],

    # ==========================================================
    # Art
    # ==========================================================
    "Art": [

        # Traditional Art
        "Drawing",
        "Sketching",
        "Painting",
        "Watercolor",
        "Oil Painting",
        "Acrylic Painting",
        "Portrait Drawing",
        "Figure Drawing",

        # Digital Art
        "Digital Painting",
        "Concept Art",
        "Illustration",
        "Comic Illustration",
        "Character Design",
        "Environment Design",

        # Graphic Design
        "Graphic Design",
        "Brand Identity",
        "Logo Design",
        "Typography",
        "Layout Design",
        "Print Design",
        "Packaging Design",

        # UI/UX
        "UI Design",
        "UX Design",
        "Wireframing",
        "Prototyping",
        "User Research",

        # Animation
        "2D Animation",
        "3D Animation",
        "Motion Graphics",
        "Storyboarding",

        # 3D
        "3D Modeling",
        "3D Sculpting",
        "Texturing",
        "Rendering",

        # Photography
        "Photography",
        "Photo Editing",
        "Photo Retouching",

        # Video
        "Video Editing",
        "Color Grading",
        "Visual Effects",

        # Adobe
        "Adobe Photoshop",
        "Adobe Illustrator",
        "Adobe InDesign",
        "Adobe Lightroom",
        "Adobe Premiere Pro",
        "Adobe After Effects",

        # Other Software
        "Figma",
        "Sketch",
        "Canva",
        "Blender",
        "ZBrush",
        "Procreate",

        # Creative
        "Creative Direction",
        "Visual Storytelling",
        "Art Direction",
        "Brand Design",
        "Design Thinking"
    ],  
    "Music": [

        # Music Theory
        "Music Theory",
        "Harmony",
        "Melody",
        "Rhythm",
        "Ear Training",
        "Sight Reading",
        "Music Arrangement",
        "Music Composition",
        "Orchestration",
        "Songwriting",
        "Lyric Writing",

        # Performance
        "Vocal Performance",
        "Live Performance",
        "Stage Performance",
        "Choir",
        "Ensemble Performance",

        # Instruments
        "Piano",
        "Keyboard",
        "Guitar",
        "Bass Guitar",
        "Drums",
        "Violin",
        "Cello",
        "Flute",
        "Saxophone",
        "Trumpet",
        "Percussion",

        # Production
        "Music Production",
        "Audio Recording",
        "Sound Recording",
        "Mixing",
        "Mastering",
        "Audio Editing",
        "Sound Design",
        "Beat Making",
        "MIDI Programming",

        # DAWs
        "Ableton Live",
        "FL Studio",
        "Logic Pro",
        "Pro Tools",
        "Cubase",
        "Studio One",
        "GarageBand",
        "Reason",

        # Audio Engineering
        "Audio Engineering",
        "Live Sound",
        "Microphone Placement",
        "Studio Recording",
        "Signal Processing",

        # Software & Plugins
        "Kontakt",
        "Serum",
        "Omnisphere",
        "Auto-Tune",
        "Melodyne",

        # Business
        "Music Publishing",
        "Music Licensing",
        "Copyright",
        "Royalty Management",

        # Soft Skills
        "Creativity",
        "Collaboration",
        "Improvisation",
        "Performance Coaching"
    ],

    # ==========================================================
    # Marketing
    # ==========================================================
    "Marketing": [

        # Digital Marketing
        "Digital Marketing",
        "Online Marketing",
        "Inbound Marketing",
        "Outbound Marketing",
        "Growth Marketing",
        "Performance Marketing",

        # SEO & SEM
        "SEO",
        "Technical SEO",
        "Local SEO",
        "Keyword Research",
        "Link Building",
        "SEM",
        "Google Ads",
        "Bing Ads",
        "PPC",

        # Social Media
        "Social Media Marketing",
        "Facebook Marketing",
        "Instagram Marketing",
        "LinkedIn Marketing",
        "TikTok Marketing",
        "YouTube Marketing",
        "Pinterest Marketing",
        "Social Media Management",
        "Community Management",

        # Content
        "Content Marketing",
        "Content Strategy",
        "Content Creation",
        "Copywriting",
        "Blog Writing",
        "Email Marketing",
        "Newsletter Marketing",

        # Analytics
        "Google Analytics",
        "Google Tag Manager",
        "Marketing Analytics",
        "A/B Testing",
        "Conversion Rate Optimization",
        "Data Analysis",

        # CRM
        "CRM",
        "Salesforce",
        "HubSpot",
        "Mailchimp",
        "Marketo",

        # Branding
        "Brand Management",
        "Brand Strategy",
        "Brand Development",
        "Brand Positioning",

        # Campaigns
        "Campaign Management",
        "Lead Generation",
        "Lead Nurturing",
        "Customer Acquisition",
        "Customer Retention",

        # Research
        "Market Research",
        "Competitor Analysis",
        "Consumer Insights",
        "Customer Journey Mapping",

        # Design
        "Canva",
        "Adobe Photoshop",
        "Adobe Illustrator",

        # E-commerce
        "Shopify",
        "WooCommerce",
        "E-commerce Marketing",

        # Soft Skills
        "Communication",
        "Presentation Skills",
        "Creative Thinking",
        "Strategic Planning"
    ],

    # ==========================================================
    # Education
    # ==========================================================
    "Education": [

        # Teaching
        "Teaching",
        "Instruction",
        "Lesson Planning",
        "Curriculum Development",
        "Curriculum Design",
        "Classroom Management",
        "Student Assessment",
        "Student Engagement",

        # Learning
        "Differentiated Instruction",
        "Blended Learning",
        "Online Teaching",
        "Distance Learning",
        "Adult Education",
        "Special Education",
        "STEM Education",

        # Educational Technology
        "Educational Technology",
        "Google Classroom",
        "Canvas LMS",
        "Moodle",
        "Blackboard",
        "Microsoft Teams",
        "Zoom",

        # Assessment
        "Testing",
        "Grading",
        "Rubric Development",
        "Learning Outcomes",

        # Student Support
        "Academic Advising",
        "Mentoring",
        "Tutoring",
        "Student Counseling",

        # Administration
        "School Administration",
        "Educational Leadership",
        "Program Coordination",
        "Policy Development",

        # Training
        "Corporate Training",
        "Workshop Facilitation",
        "Instructional Design",
        "Learning Management Systems",

        # Research
        "Educational Research",
        "Data Analysis",
        "Report Writing",

        # Soft Skills
        "Communication",
        "Leadership",
        "Patience",
        "Conflict Resolution",
        "Time Management",
        "Organization"
    ],

    # ==========================================================
    # Construction
    # ==========================================================
    "Construction": [

        # Construction Management
        "Construction Management",
        "Project Management",
        "Site Management",
        "Site Supervision",
        "Construction Planning",
        "Project Scheduling",

        # Design & Planning
        "Blueprint Reading",
        "Technical Drawings",
        "Building Design",
        "Building Codes",
        "Building Inspection",

        # Software
        "AutoCAD",
        "Revit",
        "Civil 3D",
        "Primavera P6",
        "Microsoft Project",

        # Trades
        "Carpentry",
        "Concrete",
        "Bricklaying",
        "Masonry",
        "Roofing",
        "Plumbing",
        "Electrical Installation",
        "HVAC Installation",
        "Drywall Installation",
        "Painting",
        "Flooring",
        "Welding",

        # Equipment
        "Heavy Equipment Operation",
        "Excavator Operation",
        "Bulldozer Operation",
        "Crane Operation",
        "Forklift Operation",

        # Estimation
        "Cost Estimation",
        "Quantity Surveying",
        "Material Takeoff",
        "Procurement",

        # Quality & Safety
        "Quality Assurance",
        "Quality Control",
        "Construction Safety",
        "OSHA Compliance",
        "Risk Assessment",
        "Hazard Identification",

        # Materials
        "Steel Construction",
        "Concrete Construction",
        "Timber Construction",
        "Road Construction",
        "Bridge Construction",

        # Utilities
        "Surveying",
        "Land Development",
        "Drainage Systems",
        "Earthworks",

        # Soft Skills
        "Leadership",
        "Communication",
        "Problem Solving",
        "Team Coordination",
        "Time Management"
    ],  
    "Retail/Sales": [

        # Sales
        "Sales",
        "Retail Sales",
        "Inside Sales",
        "Outside Sales",
        "B2B Sales",
        "B2C Sales",
        "Enterprise Sales",
        "Consultative Selling",
        "Solution Selling",
        "Relationship Selling",

        # Customer Service
        "Customer Service",
        "Customer Experience",
        "Customer Support",
        "Customer Relationship Management",
        "Complaint Resolution",
        "Client Relations",

        # Sales Process
        "Lead Generation",
        "Prospecting",
        "Cold Calling",
        "Lead Qualification",
        "Sales Presentation",
        "Product Demonstration",
        "Negotiation",
        "Closing Sales",
        "Follow-up",
        "Account Management",

        # Retail Operations
        "Retail Management",
        "Store Management",
        "Store Operations",
        "Visual Merchandising",
        "Merchandising",
        "Inventory Management",
        "Inventory Control",
        "Stock Replenishment",
        "Stock Rotation",
        "Loss Prevention",

        # POS & Payments
        "POS Systems",
        "Cash Handling",
        "Cash Register",
        "Credit Card Processing",
        "Returns Processing",

        # Analytics
        "Sales Forecasting",
        "Sales Reporting",
        "Sales Analytics",
        "Revenue Growth",
        "KPI Tracking",

        # CRM
        "Salesforce",
        "HubSpot CRM",
        "Zoho CRM",
        "Microsoft Dynamics CRM",

        # E-commerce
        "E-commerce",
        "Shopify",
        "WooCommerce",
        "Online Sales",
        "Marketplace Management",
        "Amazon Seller Central",

        # Soft Skills
        "Communication",
        "Persuasion",
        "Upselling",
        "Cross-selling",
        "Relationship Building",
        "Problem Solving",
        "Time Management",
        "Teamwork"
    ],

    # ==========================================================
    # HR / Recruitment
    # ==========================================================
    "HR/Recruitment": [

        # Recruitment
        "Recruitment",
        "Talent Acquisition",
        "Executive Search",
        "Headhunting",
        "Sourcing",
        "Candidate Screening",
        "Resume Screening",
        "Interviewing",
        "Behavioral Interviewing",
        "Technical Recruitment",

        # Hiring
        "Hiring",
        "Onboarding",
        "Offboarding",
        "Background Checks",
        "Reference Checks",

        # HR Operations
        "Human Resources",
        "HR Administration",
        "HR Operations",
        "HR Policies",
        "Employee Relations",
        "Performance Management",
        "Performance Reviews",

        # Compensation
        "Payroll",
        "Compensation",
        "Benefits Administration",
        "Salary Benchmarking",

        # Learning & Development
        "Training",
        "Employee Development",
        "Learning & Development",
        "Succession Planning",
        "Career Development",

        # Compliance
        "Employment Law",
        "Labor Law",
        "Workplace Compliance",
        "HR Compliance",
        "Workplace Investigations",

        # HR Systems
        "HRIS",
        "Workday",
        "SAP SuccessFactors",
        "BambooHR",
        "ADP",
        "Oracle HCM",

        # Recruiting Platforms
        "LinkedIn Recruiter",
        "Indeed",
        "Greenhouse",
        "Lever",
        "iCIMS",

        # Workforce Planning
        "Workforce Planning",
        "Organizational Development",
        "Employee Engagement",
        "Change Management",

        # Soft Skills
        "Communication",
        "Conflict Resolution",
        "Negotiation",
        "Coaching",
        "Leadership",
        "Confidentiality"
    ],

    # ==========================================================
    # Logistics / Supply Chain
    # ==========================================================
    "Logistics/Supply Chain": [

        # Supply Chain
        "Supply Chain Management",
        "Supply Chain Planning",
        "Supply Chain Optimization",
        "Demand Planning",
        "Capacity Planning",

        # Logistics
        "Logistics",
        "Transportation Management",
        "Freight Management",
        "Shipping",
        "Receiving",
        "Distribution",
        "Fleet Management",
        "Last Mile Delivery",

        # Procurement
        "Procurement",
        "Strategic Sourcing",
        "Purchasing",
        "Vendor Management",
        "Supplier Relationship Management",
        "Contract Negotiation",

        # Warehouse
        "Warehouse Management",
        "Warehouse Operations",
        "Inventory Management",
        "Inventory Control",
        "Cycle Counting",
        "Order Fulfillment",
        "Picking",
        "Packing",

        # International Trade
        "Import",
        "Export",
        "Customs Clearance",
        "Trade Compliance",
        "Incoterms",

        # ERP
        "SAP",
        "Oracle SCM",
        "Microsoft Dynamics",
        "ERP",
        "WMS",
        "TMS",

        # Manufacturing
        "Lean Manufacturing",
        "Six Sigma",
        "Production Planning",
        "Material Planning",
        "MRP",

        # Analytics
        "Forecasting",
        "Data Analysis",
        "Demand Forecasting",
        "Cost Optimization",
        "KPI Reporting",

        # Safety
        "Workplace Safety",
        "Forklift Operation",
        "Hazard Management",

        # Soft Skills
        "Communication",
        "Problem Solving",
        "Negotiation",
        "Time Management",
        "Leadership"
    ],

    # ==========================================================
    # Science / Research
    # ==========================================================
    "Science/Research": [

        # Research
        "Scientific Research",
        "Research",
        "Research Methodology",
        "Experimental Design",
        "Literature Review",
        "Hypothesis Testing",
        "Grant Writing",
        "Technical Writing",
        "Scientific Writing",
        "Peer Review",

        # Laboratory
        "Laboratory Techniques",
        "Laboratory Safety",
        "Sample Preparation",
        "Sample Collection",
        "Laboratory Management",
        "Quality Assurance",
        "Quality Control",

        # Biology
        "Molecular Biology",
        "Cell Biology",
        "Microbiology",
        "Biochemistry",
        "Genetics",
        "Immunology",
        "Biotechnology",

        # Chemistry
        "Analytical Chemistry",
        "Organic Chemistry",
        "Inorganic Chemistry",
        "Physical Chemistry",

        # Physics
        "Physics",
        "Materials Science",
        "Nanotechnology",

        # Statistics & Data
        "Statistics",
        "Biostatistics",
        "Data Analysis",
        "Data Visualization",
        "Machine Learning",
        "Bioinformatics",

        # Programming
        "Python",
        "R",
        "MATLAB",
        "SPSS",
        "SAS",
        "SQL",

        # Laboratory Equipment
        "PCR",
        "ELISA",
        "Flow Cytometry",
        "Chromatography",
        "Mass Spectrometry",
        "Microscopy",
        "Spectroscopy",

        # Clinical Research
        "Clinical Research",
        "Clinical Trials",
        "GCP",
        "GLP",
        "GMP",

        # Documentation
        "Research Documentation",
        "Data Management",
        "Regulatory Compliance",
        "Report Writing",
        "Publication Preparation",

        # Soft Skills
        "Critical Thinking",
        "Problem Solving",
        "Attention to Detail",
        "Communication",
        "Collaboration",
        "Project Management"
    ]    
}

# Common Skills Extraction Function
def extract_skills(text):
    extracted_skills = []
    text_lower = text.lower()
    for skills in SKILLS.values():
        sorted_skills = sorted(skills, key=len, reverse=True)
        for skill in sorted_skills:
            # Special Character Handling
            if '+' in skill or '#' in skill or '.' in skill:
                if skill.lower() in text_lower:
                    extracted_skills.append(skill)
            else:
                pattern = r'\b' + re.escape(skill.lower()) + r'\b'
                if re.search(pattern, text_lower):
                    extracted_skills.append(skill)
    
    # Solving edge cases            
    if ("C++" in extracted_skills or "C#" in extracted_skills) and "C" in extracted_skills:
        extracted_skills.remove("C")
    if "ASP.NET" in extracted_skills and ".NET" in extracted_skills:
        extracted_skills.remove(".NET")
    
    return list(set(extracted_skills))

# Highlighting skills in JD
def highlight_skills(resume_text, jd_text):
    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(jd_text)
    
    skill_positions = []
    for skill in jd_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        for match in re.finditer(pattern, jd_text, re.IGNORECASE):
            highlight = "matched" if skill in resume_skills else "missing"
            skill_positions.append({
                "start": match.start(),
                "end": match.end(),
                "text": match.group(),
                "highlight": highlight
            })
        
    skill_positions.sort(key=lambda x: x["start"])
    
    segments = []
    current = 0
    
    for pos in skill_positions:
        if current < pos["start"]:
            segments.append({"text": jd_text[current:pos["start"]], "highlight": None})
        segments.append({"text": pos["text"], "highlight": pos["highlight"]})
        current = pos["end"]
        
    if current < len(jd_text):
        segments.append({"text": jd_text[current:], "highlight": None})
    
    return segments
    
    
    


