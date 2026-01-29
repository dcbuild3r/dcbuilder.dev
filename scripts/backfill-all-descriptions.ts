/**
 * Backfill job descriptions from job website data
 * Run: bun run scripts/backfill-all-descriptions.ts
 */

import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Comprehensive job descriptions compiled from job websites
const jobDescriptions: Record<string, string> = {
  // ============= WORLD JOBS =============
  "world-brand-designer": `Brand Designer

World is building a real human network designed to accelerate people in the age of AI. We're looking for a Brand Designer to help imagine, define, evolve and maintain what this unique project looks and feels like.

**About the Role:**
Reporting to the Head of Brand Design, you will collaborate closely with stakeholders across the organization to understand both strategic objectives and operational requirements, translating these insights into clear and culturally resonant design.

**Responsibilities:**
- Define and create a visual language as an extension of the brand (illustrations, icons, colors, typography, animations)
- Be an advocate for consistent and cohesive design throughout the company
- Contribute to World's Brand Standards
- Educate others on design thinking, brand experience, and design-driven storytelling
- Collaborate with Content Marketing to establish a clear brand voice, tone, and personality
- Continually iterate on concepts to make the brand relevant and relatable

**Requirements:**
- 6+ years of experience in creating comprehensive design systems
- Portfolio showcasing skills in motion, illustration, typography, photography, and data visualization
- Able to create brand systems, behaviors, and design solutions with high craftsmanship
- Innovative design thinking for communication and marketing touch points
- Detail-oriented, from concept to final output

**Compensation:** $148,000 - $175,000/year + equity + benefits

**Location:** San Francisco`,

  "world-bd-lead-japan": `Business Development Lead, Japan

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Business Development Lead to drive World's expansion and partnerships in Japan.

**About the Role:**
Lead business development efforts in Japan, one of the world's most important technology markets. Build strategic partnerships, grow the World network, and establish World as a trusted partner in the Japanese market.

**Responsibilities:**
- Develop and execute business development strategy for Japan
- Build and maintain relationships with key partners, enterprises, and institutions
- Identify and pursue strategic partnership opportunities
- Collaborate with regional teams to align on go-to-market strategies
- Represent World at industry events and conferences in Japan
- Report on market trends, competitive landscape, and growth opportunities

**Requirements:**
- 7+ years of business development experience in Japan
- Strong network in Japanese tech, finance, or enterprise sectors
- Fluent in Japanese and English
- Experience scaling products or services in the Japanese market
- Understanding of blockchain, identity, or fintech preferred
- Excellent communication and negotiation skills

**Benefits:** Competitive compensation, equity, healthcare, and professional development

**Location:** Tokyo, Japan`,

  "world-bd-manager-central-europe": `Business Development Manager, Central Europe

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Business Development Manager to define and drive growth through high-impact strategic partnerships across Poland, Germany, and Austria.

**About the Role:**
Based in Munich, you will work with General Managers and Operations Leads to expand World's core offerings through partnership execution across Central Europe.

**Responsibilities:**
- Identify and evaluate partnership opportunities in delivery platforms, mobility, fintech, and VC networks
- Structure deals and design partnership models (e.g., "Orb-on-demand" via Bolt or Uber)
- Lead cross-functional execution with internal teams (Ops, Legal, Product, Marketing)
- Develop regional partnership strategy and playbooks with replicable frameworks
- Define KPIs and build dashboards to measure partnership performance
- Represent the company externally and build networks in the VC/fintech ecosystem
- Support internal stakeholders with partner context and regional insights

**Requirements:**
- 7+ years relevant experience in Investment Banking, Consultancy, or fast-growth tech
- Proven business development, sales, or related experience
- Fluent in German and English
- Entrepreneurial mindset with strong growth orientation
- Ability to work cross-functionally and influence without formal authority
- Executive presence and strategic thinking capabilities
- Resourcefulness and adaptability in fast-paced environments
- Based in Munich; willing to travel across Central Europe

**Location:** Munich, Germany`,

  "world-bd-manager-western-europe": `Business Development Manager, Western Europe

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Business Development Manager to drive regional growth through strategic partnerships across UK, Spain, Italy, and Portugal.

**About the Role:**
You will report to General Managers and Operations Leads to expand World's core offerings through partnership execution across Western Europe.

**Responsibilities:**
- Map and evaluate ecosystem opportunities across delivery platforms, mobility, fintech, and VC networks
- Engage partners, structure deals, and design collaboration models throughout their lifecycle
- Align internal teams (Ops, Legal, Product, Marketing) to launch and scale partnerships
- Create regional partnership playbooks and replicable frameworks
- Define KPIs, build dashboards, and refine models based on data insights
- Build networks with senior executives in VC/fintech/delivery sectors
- Support stakeholders with partner context and regional insights

**Requirements:**
- 7+ years in high-performance environments (investment banking, consulting, or growth-stage tech)
- Proven experience in business development, sales, or a related role
- Full fluency in German and English
- Entrepreneurial mindset with resourcefulness and resilience
- Strategic thinking with business acumen
- Executive presence and persuasive communication skills
- Based in London; travel across Western Europe required

**Location:** London, UK`,

  "world-chief-privacy-officer": `Chief Privacy Officer

World is building a real human network designed to accelerate people in the age of AI. As Chief Privacy Officer, you will lead our Privacy Legal team and ensure compliance with global privacy regulations.

**About the Role:**
Serve as a member of legal leadership, helping to build and support the strategy for the legal team. Lead and develop our Privacy Legal team responsible for privacy, security, and AI-related legal guidance.

**Responsibilities:**
- Co-architect the legal organization and lead the Privacy Legal team
- Ensure compliance with global privacy and data protection regulations through development and maintenance of a global privacy program
- Establish and maintain relationships with regulatory, governmental, industry, and peer groups
- Oversee privacy-related regulatory investigation and response work
- Act as the legal point of contact for the Information Security team
- Help scale the legal organization by developing innovative processes
- Stay abreast of emerging legal trends and best practices in tech

**Requirements:**
- 15+ years of experience in privacy, security, and AI laws
- Very strong understanding of GDPR, LGPD, APAC privacy laws, and other global privacy laws
- Experience building privacy programs from the ground up
- First-hand experience with privacy regulatory investigations and incident response
- JD degree and active state bar membership
- In-house counsel experience preferred

**Compensation:** $300,000 - $375,000/year + equity + benefits

**Location:** San Francisco`,

  "world-director-central-ops": `Director of Central Operations

World is building a real human network designed to accelerate people in the age of AI. As Director of Central Operations, you will design, optimize, and scale the core systems that power World's global market operations.

**About the Role:**
Lead and continuously improve core global functions including Logistics, Global Projects, back office support, Trust & Safety, and Customer Support. Enable the Market Operations team to achieve hyper-growth of the World network.

**Responsibilities:**
- Drive operational efficiency, cost reduction, and service quality across all markets
- Build scalable systems and processes that enable regional teams to execute faster
- Develop performance metrics and dashboards to monitor efficiency, quality, and cost
- Identify bottlenecks and implement structural improvements
- Establish best practices, playbooks, and process documentation for global consistency
- Partner with Device, Legal, Engineering, and Finance teams
- Manage and mentor leaders across all functional areas
- Build a high-performing, data-driven team culture

**Requirements:**
- Bachelor's degree in business, economics, engineering, or related field
- 10+ years of experience managing large-scale, physical operations across multiple countries
- Cost-conscious and efficiency-focused mindset
- Analytical and data-driven approach
- Experience leading leaders
- MBA or equivalent advanced degree preferred

**Compensation:** $290,000 - $320,000/year + equity + benefits

**Location:** San Francisco`,

  "world-field-ops-lead": `Field Operations Lead

World is building a real human network designed to accelerate people in the age of AI. As Field Operations Lead, you will manage and optimize World's on-the-ground verification operations.

**About the Role:**
Lead field operations teams to ensure smooth, efficient, and high-quality Orb verification experiences for users. Drive operational excellence across verification locations.

**Responsibilities:**
- Manage day-to-day field operations and verification teams
- Optimize verification processes and user experience
- Train and develop field operations staff
- Monitor and improve key operational metrics
- Coordinate with central operations on logistics and support
- Handle escalations and resolve operational issues
- Ensure compliance with operational standards and protocols

**Requirements:**
- 5+ years of experience in field operations or retail operations management
- Strong leadership and people management skills
- Experience scaling operations in high-growth environments
- Data-driven approach to operational optimization
- Excellent problem-solving and communication skills
- Willingness to travel as needed

**Benefits:** Competitive compensation, equity, healthcare, and professional development

**Location:** San Francisco or Remote`,

  "world-fullstack-engineer-world-id": `Full Stack Software Engineer, World ID

World is building a real human network designed to accelerate people in the age of AI. We're looking for a Full Stack Software Engineer to expand the World ID ecosystem through developer-facing APIs, Web SDKs, user applications, and partner integrations.

**About the Role:**
This position serves as the primary touchpoint for our partners, making their success your own. You'll build the tools and infrastructure that enable developers worldwide to integrate World ID.

**Responsibilities:**
- Design and maintain the public-facing JavaScript/TypeScript SDK with robust documentation and ease of integration
- Support partner efforts by building reference applications, browser extensions, and integration tools
- Build scalable APIs and backend services using TypeScript for applications, SDKs, and partner requirements
- Design and maintain web components and end-user facing applications leveraging World ID
- Work with product managers, designers, and engineers to deliver cohesive solutions
- Guide junior engineers and contractors through code review and project oversight

**Requirements:**
- Strong communication and collaborative skills
- Experience supporting third-party developers
- Expertise in modern JavaScript/TypeScript frameworks
- Track record maintaining public-facing SDKs or developer libraries
- Server-side development and RESTful API experience
- Full-stack capability across web servers, databases, and client logic
- Familiarity with Go, Rust, or compiled languages preferred

**Compensation:** $220,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-gm-mexico": `General Manager, Mexico and Central America

World is building a real human network designed to accelerate people in the age of AI. As General Manager for Mexico and Central America, you will lead World's expansion across this high-potential region.

**About the Role:**
Own all operations, growth, and partnerships in Mexico and Central America. Lead a regional team to scale World's presence and drive adoption of World ID and World App.

**Responsibilities:**
- Develop and execute regional strategy for Mexico and Central America
- Build and lead high-performing regional team
- Drive user growth and network expansion
- Establish strategic partnerships with local businesses and institutions
- Manage P&L and operational efficiency
- Represent World with government, media, and industry stakeholders
- Coordinate with global teams on product and operations

**Requirements:**
- 10+ years of experience in general management or country leadership roles
- Deep knowledge of Mexican and Central American markets
- Proven track record of scaling businesses in Latin America
- Strong network in tech, finance, or telecommunications
- Fluent in Spanish and English
- Experience with consumer products or marketplaces preferred

**Benefits:** Competitive compensation, equity, healthcare, relocation support

**Location:** Mexico City`,

  "world-gm-south-cone": `General Manager, South Cone

World is building a real human network designed to accelerate people in the age of AI. As General Manager for the South Cone, you will lead World's operations across Argentina, Chile, and the Southern Cone region.

**About the Role:**
Drive growth in one of World's most active markets. Own all operations, growth, and partnerships across Argentina, Chile, Uruguay, and Paraguay.

**Responsibilities:**
- Develop and execute regional strategy for the South Cone
- Build and lead high-performing regional team
- Drive user growth and network expansion
- Establish strategic partnerships with local businesses and institutions
- Manage P&L and operational efficiency
- Navigate regulatory environments across multiple countries
- Coordinate with global teams on product and operations

**Requirements:**
- 10+ years of experience in general management or country leadership roles
- Deep knowledge of South American markets, particularly Argentina and Chile
- Proven track record of scaling businesses in Latin America
- Strong network in tech, finance, or consumer sectors
- Fluent in Spanish and English
- Experience with consumer products or fintech preferred

**Benefits:** Competitive compensation, equity, healthcare, relocation support

**Location:** Buenos Aires or Santiago`,

  "world-gm-germany": `General Manager, Germany

World is building a real human network designed to accelerate people in the age of AI. As General Manager for Germany, you will lead World's operations in Europe's largest economy.

**About the Role:**
Drive growth and operations in Germany, a key market for World's European expansion. Build partnerships and scale the network across German-speaking markets.

**Responsibilities:**
- Develop and execute strategy for Germany
- Build and lead high-performing regional team
- Drive user growth and network expansion
- Establish strategic partnerships with enterprises and institutions
- Navigate German regulatory environment
- Represent World with government, media, and industry stakeholders
- Coordinate with Munich engineering teams and global operations

**Requirements:**
- 10+ years of experience in general management or country leadership roles
- Deep knowledge of German market and business culture
- Proven track record of scaling tech businesses in Germany
- Strong network in tech, finance, or enterprise sectors
- Fluent in German and English
- Experience with privacy-conscious products preferred

**Benefits:** Competitive compensation, equity, healthcare

**Location:** Munich or Berlin`,

  "world-graphic-designer": `Graphic Designer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Graphic Designer to help establish and scale World's brand identity globally.

**About the Role:**
Reporting to the Head of Brand Design, you will scale the brand design system globally and across surfaces while maintaining creative quality and consistency.

**Responsibilities:**
- Create print and digital production materials aligned with brand guidelines
- Scale the brand design system globally and across surfaces while maintaining quality
- Manage high-volume design requests from cross-functional teams with tight deadlines
- Develop design systems and pre-approved asset toolkits
- Occasionally design executive presentations (10-15% of capacity)
- Juggle multiple projects simultaneously across different markets
- Produce high-fidelity visual assets, graphic materials, sketch and concept ideas

**Requirements:**
- 3-5+ years graphic design experience (print and digital)
- Proficiency in Adobe Creative Suite, Figma, and design software
- Strong composition, layout, and design fundamentals
- Ability to work independently and collaboratively
- Design systems experience for large brands
- US work authorization required
- Must be in San Francisco office minimum 4 days weekly

**Bonus Skills:** Typography, color theory, motion design, video production, UI/UX expertise, accessibility knowledge, and Web3 familiarity.

**Compensation:** $100,000 - $120,000/year + equity + benefits

**Location:** San Francisco`,

  "world-growth-ops-lead-italy": `Growth & Operations Lead, Italy

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Growth & Operations Lead to drive market operations in Italy.

**About the Role:**
Lead World's market operations in Italy as a strategic and operational leadership role. Manage Operator performance, drive sustainable user growth, and ensure compliance with Italian regulatory standards while maintaining brand reputation.

**Responsibilities:**
- Lead the growth and operational performance of World in Italy, ensuring strong Operator execution, compliance, and user experience
- Source, onboard, and manage Operators while maintaining alignment with global standards and local regulatory requirements
- Oversee location strategy and event approvals for brand activations across Italy
- Partner with Legal and Policy teams on compliance with Italian data protection and financial regulations
- Collaborate with Marketing on user-centric campaigns
- Implement operational best practices for efficiency and scalability
- Track performance metrics and translate insights into strategic decisions
- Deliver Operator training sessions (in-person and remote)

**Requirements:**
- 7+ years in operations, business development, or growth management within technology, fintech, or high-growth sectors
- Proven track record managing distributed teams or partner networks across multiple locations
- Strong knowledge of Italian regulatory landscape (GDPR, data protection, financial regulation)
- Exceptional relationship-building and communication abilities
- Data-driven analytical capabilities
- Entrepreneurial mindset with comfort navigating ambiguity
- Based in Rome and willing to travel across Italy and occasionally within Europe

**Location:** Rome, Italy`,

  "world-head-product-design": `Head of Product Design

World is building a real human network designed to accelerate people in the age of AI. As Head of Product Design, you will lead the product design team and shape the experience for millions of users worldwide.

**About the Role:**
Define and execute the product design vision for World App and related products. Build and lead a world-class design team that creates intuitive, delightful experiences.

**Responsibilities:**
- Lead product design strategy and vision
- Build, mentor, and grow the product design team
- Define design systems and standards
- Partner with product, engineering, and research teams
- Drive user-centered design practices
- Present design work to leadership and stakeholders
- Shape the end-to-end user experience

**Requirements:**
- 12+ years of product design experience, 5+ years in leadership
- Portfolio demonstrating exceptional mobile and web design
- Experience building and scaling design teams
- Track record of shipping products used by millions
- Strong understanding of design systems
- Excellent communication and presentation skills
- Experience with fintech or identity products preferred

**Benefits:** Competitive compensation, equity, healthcare, professional development

**Location:** San Francisco`,

  "world-head-protocol": `Head of Protocol

World is building a real human network designed to accelerate people in the age of AI. As Head of Protocol, you will lead the development of World's core protocol and cryptographic systems.

**About the Role:**
Define the technical direction for World ID protocol, privacy-preserving systems, and on-chain infrastructure. Lead a team of world-class protocol engineers and cryptographers.

**Responsibilities:**
- Lead protocol design and development for World ID
- Define technical roadmap for privacy-preserving identity systems
- Build and mentor protocol engineering team
- Drive research and implementation of advanced cryptography
- Coordinate with Ethereum Foundation and ecosystem partners
- Ensure protocol security and scalability
- Represent World in technical and standards communities

**Requirements:**
- 10+ years of experience in protocol development or cryptography
- Deep expertise in zero-knowledge proofs and privacy-preserving systems
- Track record of shipping protocol-level systems
- Published research or significant open-source contributions
- Strong leadership and team-building skills
- PhD in cryptography, computer science, or related field preferred

**Benefits:** Competitive compensation, significant equity, healthcare

**Location:** San Francisco or Remote`,

  "world-logistics-ops-lead-na": `Logistics Operations Lead, North America

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Logistics Operations Lead to manage supply chain operations across North America.

**About the Role:**
Based at the Dallas Hub, coordinate the movement of goods across the U.S., Canada, and Mexico, ensuring shipments are accurate, compliant, and timely.

**Responsibilities:**
- Coordinate inbound and outbound shipments while maintaining accuracy and documentation
- Manage logistics data in ERP and TMS systems to track inventory movements between hubs
- Prepare shipping and customs documentation including invoices and hazmat declarations
- Resolve delivery exceptions and customs issues collaboratively with 3PLs and carriers
- Support process improvements enhancing visibility, automation, and delivery performance

**Requirements:**
- Detail-oriented approach thriving in fast-moving operations environments
- Understanding of customs and international shipping processes in North America
- Strong accountability—resolving rather than just reporting issues
- Continuous improvement mindset seeking workflow efficiencies
- Ability to adapt quickly under pressure when circumstances change

**Compensation:** $115,000 - $130,000/year + equity + benefits

**Location:** Dallas, Texas`,

  "world-manager-device-automation-qa": `Manager/Senior Manager, Device Automation & QA

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Device Automation & QA Manager to oversee software quality for device platforms.

**About the Role:**
Serve as the final quality gate for device software releases. Operate independently from product development teams with accountability for release readiness and test fleet health.

**Responsibilities:**
- Design and operate scalable automated testing infrastructure spanning devices, hardware-in-the-loop systems, backend services, and CI/CD pipelines
- Lead QA strategy and serve as independent verification authority
- Recruit and manage a technical QA and automation engineering team
- Act as build and release manager, handling scheduling and readiness reviews
- Design regression, smoke, and nightly test workflows
- Investigate field issues as first-line triage before escalation
- Improve test coverage, execution speed, and system reliability

**Requirements:**
- Deep hands-on expertise with software and hardware debugging
- Experience designing automation systems at scale with device fleets
- Ability to write and review high-quality test code
- Capability to read production firmware and translate understanding into targeted tests
- Natural curiosity about edge cases and failure modes
- Comfort with ambiguity and independent decision-making
- Strong mentoring and team development skills
- Systems-thinking approach to anticipating infrastructure bottlenecks

**Compensation:** $217,000 - $260,000/year + equity + benefits

**Location:** San Francisco`,

  "world-marketing-manager-central-europe": `Marketing Manager, Central Europe

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Marketing Manager to develop and execute regional marketing strategy for Central Europe.

**About the Role:**
Increase brand awareness, positive sentiment and drive app downloads and sign-ups across Central European markets.

**Responsibilities:**
- Formulate comprehensive marketing strategy with omnichannel planning and OKR measurement frameworks
- Maintain brand consistency while acting as regional brand manager
- Execute projects with meticulous attention to detail
- Report performance metrics to marketing and finance stakeholders
- Drive app adoption and Orb sign-up initiatives
- Collaborate cross-functionally with product, legal, policy, and operations teams
- Align regional efforts with global strategy while contributing local insights
- Coordinate with vendors on creative development and deployment

**Requirements:**
- 7+ years in brand marketing or creative strategy, preferably in fast-growing organizations
- Strong creative instinct with autonomous decision-making ability
- Adaptability and resilience in complex, ambiguous environments
- Top-tier communication and relationship-building skills
- Demonstrated track record at tier-one companies or startups
- Deep understanding of local Central European culture and communities
- Fluent English and EU work authorization
- Bonus skills: copywriting, web design, graphic design, video editing, digital marketing, SEO
- Full-time in-office commitment (5 days/week)
- Willingness to travel up to 40% across Central Europe

**Location:** Munich, Germany`,

  "world-marketing-manager-us": `Marketing Manager, US

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Marketing Manager to develop and execute regional marketing strategy for the US market.

**About the Role:**
Build brand awareness, drive app downloads, and increase Orb sign-ups while making World welcoming, relatable and inspiring to all Americans.

**Responsibilities:**
- Develop comprehensive marketing strategy with omnichannel planning and OKR measurement
- Maintain brand standards and creative integrity across regional executions
- Drive brand sentiment through data-driven reporting and stakeholder communication
- Partner with cross-functional teams (product, legal, policy) on expansion initiatives
- Manage vendor relationships and creative project development
- Balance global vision with localized marketing approaches

**Requirements:**
- 7+ years in brand marketing or creative strategy, preferably at fast-growing organizations
- Strong creative instinct with autonomous decision-making ability
- Top-tier communication and relationship-building skills
- Navigate complexity and ambiguity without requiring blueprints
- Understanding of local culture and community engagement
- Fluent English, US work authorization
- 5-day in-office requirement in SF
- Willing to travel 40% across US

**Additional Skills (valued):** Copywriting, web design, graphic design, video editing, SEO, UI/UX design

**Compensation:** $175,000 - $200,000/year + equity + benefits

**Location:** San Francisco`,

  "world-ops-manager-us": `Operations Manager, US

World is building a real human network designed to accelerate people in the age of AI. We're seeking an Operations Manager to lead physical deployment and servicing operations for World's Orb installations across US locations.

**About the Role:**
Be the backbone of our physical deployment and servicing operations in the US, requiring hands-on leadership of site launches, team management, and operational excellence across hundreds of locations.

**Responsibilities:**
- Direct in-field setup and servicing for kiosks and retail installations
- Coordinate deliveries, connectivity, and readiness with logistics and tech teams
- Train and certify Orb Operators and partner staff
- Manage a small regional team of Field Specialists with mentorship
- Develop and refine deployment, servicing, and escalation playbooks
- Build relationships with retail and mall management
- Track and report KPIs including speed, uptime, quality, and operator readiness

**Requirements:**
- 10+ years operational or field-based leadership experience
- Proven success managing distributed teams and technical deployments
- Hands-on comfort with light hardware setup and network troubleshooting
- High tolerance for travel and dynamic work environments
- Strong communication and partner-management skills
- Builder's mindset: you bring structure to ambiguity and lead from the front
- Thrives in continuous-launch environments scaling nationally

**Compensation:** $200,000 - $245,000/year + equity + benefits

**Location:** San Francisco or US-based`,

  "world-product-counsel": `Product Counsel

World is building a real human network designed to accelerate people in the age of AI. We're seeking an experienced Product Counsel to join our legal team.

**About the Role:**
Provide legal guidance across consumer protection, AI, biometrics, privacy, financial regulations, marketing, IP, and digital currencies.

**Responsibilities:**
- Serve as legal advisor to product and engineering teams throughout development cycles
- Identify and mitigate product, regulatory, privacy, and safety risks across jurisdictions
- Create scalable legal strategies and advance AI/cryptocurrency policy positions
- Draft terms of use, policies, and support go-to-market initiatives
- Cross-functional collaboration with teams across the organization

**Requirements:**
- 5+ years in product counsel roles within fintech or technology
- Knowledge of financial services, blockchain, AI, IP, privacy, biometrics, online safety, marketing, or consumer protection
- Strong analytical, problem-solving, and communication skills
- Project management experience with cross-functional leadership
- Adaptability in fast-paced environments
- US candidates: JD from top-tier law school and state bar membership

**Compensation:** $235,000 - $300,000/year + equity + benefits

**Location:** San Francisco or Munich`,

  "world-pm-human-modalities": `Product Manager, Human Modalities

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Product Manager to define and drive the roadmap for our "Proof of Human" technology.

**About the Role:**
Bridge science, engineering, and product development, working with biometrics research and engineering teams on iris recognition and emerging verification modalities.

**Responsibilities:**
- Define, structure, and prioritize workstreams across biometrics research and modalities product development
- Build 18–36 month strategic plans with clear milestones, ownership, and measurable outcomes
- Convert scientific advances into scalable, privacy-preserving product features
- Coordinate priorities and resources with the broader World ID ecosystem and developer community
- Translate complex technical progress into clear strategy for leadership and partners
- Establish robust planning and execution processes for high-velocity R&D teams

**Requirements:**
- Systems-level thinking connecting research pipelines to user outcomes
- Strong technical fluency in machine learning, computer vision, or biometric systems
- Experience managing multidisciplinary programs spanning software, hardware, and data science
- Track record converting technical innovation into shipped, user-facing products
- Exceptional communication skills for translating deep tech into strategy
- Commitment to clarity, measurable impact, and cross-functional collaboration

**Compensation:** $200,000 - $245,000/year + equity + benefits

**Location:** San Francisco`,

  "world-regional-logistics-manager-eu-apac": `Regional Logistics Manager II (EU/APAC)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Regional Logistics Manager to oversee end-to-end logistics operations across Europe and Asia-Pacific regions.

**About the Role:**
Direct warehousing, fulfillment, and import/export activities while ensuring regulatory compliance and operational excellence across global hardware distribution networks.

**Responsibilities:**
- Manage logistics operations ensuring efficient, compliant, and timely movement of goods across both regions
- Collaborate with global operations, supply chain, compliance teams, plus external third-party logistics providers and customs partners
- Oversee hazardous materials shipments with compliance to IATA, IMDG, and ADR regulations
- Maintain accurate data using ERP and Transportation Management Systems for visibility and audit readiness

**Requirements:**
- Deep expertise in global trade regulations, customs procedures, and hazardous goods classification
- Detail-oriented approach with strong organizational and problem-solving capabilities for complex international logistics
- Excellent communication skills across diverse teams and time zones
- Proficiency with ERP/TMS platforms and data-driven optimization mindset

**Location:** Munich, Germany`,

  "world-security-engineering-intern": `Security Engineering Internship

World is building a real human network designed to accelerate people in the age of AI. We're offering a Security Engineering Internship focused on building distributed analytics systems within our Detection & Response team.

**About the Role:**
Build blockchain-based verifiable compute for detection engineering, where smart contracts incentivize third parties to execute specific code against designated datasets, publish outputs, and cryptographically prove calculation accuracy.

**Responsibilities:**
- Develop components for an automated detection and response system protecting 17+ million World ID users
- Work on infrastructure handling millions of daily identity and financial transactions
- Build decentralized detection mechanisms using blockchain-published audit events
- Scale systems to eventually protect billions of users across trusted and untrusted hardware
- Maintain privacy protections while enabling public blockchain transparency

**Requirements:**
- Studying/researching/working with verifiable compute (e.g. zero knowledge ML or zero knowledge virtual machines)
- Some exposure to Rust programming
- Strong critical thinking and communication abilities
- Cross-functional collaboration capability
- Thriving in fast-paced, collaborative environments

**Nice-to-Have:** Hands-on experience with RiscZero, Succinct, Boundless, or similar zero-knowledge virtual machine frameworks

**Location:** San Francisco`,

  "world-sr-accounting-ops-manager": `Senior Accounting Operations Manager

World is building a real human network designed to accelerate people in the age of AI. We're seeking a strategic and hands-on leader to oversee core accounting operations during rapid company growth.

**About the Role:**
Report to the Financial Controller and manage the general ledger team while strengthening internal controls and driving process excellence.

**Responsibilities:**
- Lead global accounting operations including general ledger, payroll, leases, equity, fixed assets, and intercompany consolidation
- Oversee monthly, quarterly, and annual close cycles per U.S. GAAP standards
- Identify and deliver automation opportunities, including the use of AI and system enhancements to streamline processes
- Design and implement internal controls and master data governance frameworks
- Build scalable accounting processes supporting research and product initiatives
- Manage external auditor relationships
- Mentor and develop high-performing accounting teams

**Requirements:**
- 10–15 years senior accounting leadership experience in public companies, late-stage startups, or public accounting
- End-to-end management of core operations and close cycles
- Proven automation initiative success with AI and system enhancements
- Strong project management capabilities
- Team building and development track record
- Bachelor's degree with CPA/CA certification
- Deep U.S. GAAP and financial reporting knowledge
- SAP or comparable ERP system experience (strongly preferred)
- Familiarity with FloQast, Tipalti, Navan, or Brex/Mercury (preferred)

**Compensation:** $175,000 - $200,000/year + equity + benefits

**Location:** San Francisco (7 AM PST start required for India team collaboration)`,

  "world-sr-android-engineer-orbmini": `Senior Android Application Software Engineer, OrbMini

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Android Application Software Engineer to contribute to developing next-generation consumer electronics devices focused on human verification.

**About the Role:**
Be one of the Device Organization's first application-focused software engineers at the new San Francisco office.

**Responsibilities:**
- Own complete architecture, development, maintenance, and debugging of applications on consumer devices
- Design and implement high-performance user-facing applications
- Create UI/UX for core applications on internally developed devices
- Participate in design reviews and provide system architecture input
- Collaborate cross-functionally on product roadmap integration prioritizing stability, power, and performance
- Document application architecture, testing procedures, and validation results
- Coordinate with software engineers on system-level validation and hardware/software integration
- Support production debugging and user research studies

**Requirements:**
- Bachelor's or Master's degree in Computer Science or related field
- 4+ years hands-on Android application development
- 6+ years total software development experience
- UI development experience for consumer electronics at scale
- Strong Kotlin proficiency
- In-depth Android SDK knowledge
- Unit and UI testing expertise
- Ability to work independently on complex projects
- Cross-domain debugging capability in fast-paced environments
- Commitment to rigorous documentation and testing
- Startup-environment comfort with proactive, hands-on approach

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-android-framework-engineer": `Senior Android Framework Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Software Development Engineer to join our Device Organization as one of our first device software engineers working on next-generation hardware devices.

**About the Role:**
Design and maintain embedded Linux and Android system components, including kernel modules and system daemons.

**Responsibilities:**
- Develop custom HALs and AOSP extensions
- Define communication interfaces between system components
- Manage the complete software development lifecycle from concept to production
- Serve as liaison between firmware/hardware and Android application teams
- Collaborate on system performance optimization
- Support overseas development with partners
- Mentor junior engineers

**Requirements:**
- Bachelor's or Master's degree in Electrical Engineering or related field
- 7+ years of hands-on software development experience across the full stack
- Proficiency in C/C++/Rust
- Linux kernel programming experience
- Android and AOSP platform experience
- Demonstrated success shipping high-volume mobile Android devices
- Deep AOSP knowledge and HAL framework expertise
- Custom HAL implementation experience
- Familiarity with cross-compilation toolchains and device trees

**Nice-to-Have:** Knowledge of Yocto, Buildroot, or Android build systems; hands-on embedded Linux and BSP development experience.

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-android-kernel-engineer": `Senior Android Kernel Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Android Kernel Engineer to work on our Device Software team, which owns all Orb software.

**About the Role:**
The Orb is a secure biometric imaging system, designed to seamlessly prove humanness in a privacy-preserving way. It processes biometric data locally on-device rather than server-side, maintaining strict privacy standards.

**Responsibilities:**
- Port software to Android-based systems
- Optimize image capture and processing code
- Support firmware verifiability
- Advance scalability and performance across global device fleets
- Work with Rust programming on NVIDIA Jetson platforms running custom GNU/Linux

**Requirements:**
- Rust and Linux real-world application experience
- 5+ years in systems programming, robotics, or IoT
- Large-scale device fleet deployment experience
- AOSP device building and HAL integration expertise
- Security-critical application development background
- Strong communication and project management abilities

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** Munich, Germany`,

  "world-sr-business-recruiter": `Senior Business Recruiter

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Business Recruiter to partner with leadership and shape hiring strategy.

**About the Role:**
Own full-cycle recruitment across operations, marketing, legal, policy, and finance—from sourcing through offer close.

**Responsibilities:**
- Design interview processes and influence hiring decisions
- Drive sourcing experimentation and creative candidate searches
- Build ATS reporting systems
- Mentor team members
- Deliver exceptional candidate experiences

**Requirements:**
- 6+ years recruiting experience in fast-growing startups/scaleups
- Strong individual ownership and creativity in candidate searches
- Collaborative approach with demonstrated influence capabilities
- Problem-solving ability and comfort with ambiguity
- Data-driven decision-making using metrics and narrative
- Passion for exceptional candidate experience

**Compensation:** $180,000 - $200,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-camera-validation-engineer": `Senior Camera Systems Validation Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Camera Systems Validation Engineer to validate cutting-edge camera modules and imaging systems for consumer devices.

**About the Role:**
Ensure camera systems meet stringent performance, reliability, and quality standards.

**Responsibilities:**
- Develop and execute validation plans for camera sensors, optics, and image processing
- Characterize performance metrics including resolution, noise, color accuracy, and low-light behavior
- Build automated test setups and regression testing scripts
- Debug hardware/firmware/software integration issues across teams
- Conduct root-cause analysis on camera system failures
- Document methodologies and performance reports
- Engage suppliers on module validation and quality assurance
- Develop scalable test infrastructure

**Requirements:**
- Bachelor's or Master's degree in Optics, Electrical Engineering, or Computer Engineering
- 4+ years of hands-on camera system validation experience
- Understanding of camera sensors, ISP pipelines, and image quality metrics
- Python or MATLAB proficiency for automation
- Experience with test equipment (charts, light sources, goniometers, spectrometers)
- Strong hardware/software debugging capabilities
- Image processing algorithm familiarity

**Compensation:** $200,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-data-scientist-fraud": `Senior Data Scientist, Fraud

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Data Scientist to combat fraud within World's ecosystem.

**About the Role:**
Investigate fraud alerts, monitor detection platforms, and develop ML-based solutions to prevent malicious activities targeting our global verification network.

**Responsibilities:**
- Analyze behavioral patterns using SQL and visualization tools to identify fraud signals
- Lead root cause investigations on fraud incidents and prevention opportunities
- Evaluate individual transactions against internal policies to determine legitimacy
- Contribute insights to machine learning models and detection rule systems
- Triage escalations from internal and external stakeholders

**Requirements:**
- Bachelor's degree in quantitative field
- 6+ years hands-on data science experience
- SQL expertise and programming skills (Python preferred)
- Ability to work decisively in ambiguous, fast-paced environments
- On-call availability during heightened risk periods

**Preferred:**
- Fraud analytics or fintech background
- Machine learning model development experience
- Master's degree

**Compensation:** $182,000 - $215,000/year + equity + benefits

**Location:** San Francisco or Munich`,

  "world-sr-electrical-engineer-concept": `Senior Electrical Engineer, Concept Engineering

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Electrical Engineer to lead concept development for biometric verification devices.

**About the Role:**
Design and prototype next-generation "proof of human" technology while collaborating across product, industrial design, and software teams.

**Responsibilities:**
- Architect and design device concepts to rapidly derisk future programs
- Oversee electrical systems development
- Design prototypes for advanced sensing systems
- Perform technology selection with risk analysis
- Ensure systems meet performance standards
- Drive cross-functional collaboration emphasizing design-for-manufacturability, cost optimization, power efficiency, and circuit implementation
- Microcontroller programming in C with real-time operating systems
- Mentor junior engineers

**Requirements:**
- Bachelor's or Master's degree in electrical or computer engineering
- 7+ years in electronics product development (concept through multilayer PCB layout)
- Project leadership experience
- Circuit simulation proficiency
- Knowledge of industry standards and regulatory requirements
- Embedded systems and microcontroller expertise
- Test equipment experience (oscilloscopes, logic analyzers, VNA)
- Embedded camera-based hardware integration background
- C programming for microcontrollers with RTOS experience (FreeRTOS/Zephyr)
- Strong English communication skills

**Preferred:** Multimodal sensing development, startup environments, high-volume consumer device shipping, and sensor vendor collaboration.

**Compensation:** $200,000 - $255,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-embedded-engineer-concept": `Senior Embedded Software Engineer, Concept Engineering

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Embedded Systems Engineer to lead end-to-end embedded software development for prototype devices.

**About the Role:**
Collaborate with Software, Product, UX, and Industrial Design teams to create functional prototypes that shape the company's technological direction.

**Responsibilities:**
- Architect and debug embedded firmware for concept devices to minimize future program risks
- Support hardware validation and design decisions for the engineering team
- Develop low-level drivers and board support packages for microcontrollers and sensors
- Manage hardware-firmware integration and cross-boundary debugging
- Participate in design reviews focused on system architecture and testability
- Optimize stability, power consumption, and performance through cross-functional collaboration
- Validate hardware designs using oscilloscopes, logic analyzers, and lab equipment
- Document firmware architecture, testing procedures, and validation outcomes
- Mentor junior engineers in development practices

**Requirements:**
- Bachelor's or Master's degree in Electrical or Computer Engineering
- 7+ years hands-on firmware development experience
- Consumer electronics systems development at scale
- C/C++ proficiency for embedded systems (bare-metal, RTOS, or Linux)
- Zephyr RTOS and Linux kernel experience
- Proficiency with oscilloscopes, logic analyzers, JTAG, UART, SPI, I2C protocols
- Manufacturing test software development experience
- Strong independent problem-solving and cross-domain debugging abilities

**Nice-to-Have:** Secure boot and firmware update pipeline experience; camera hardware and vision sensor integration expertise; Rust programming experience.

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-embedded-engineer-orb-munich": `Senior Embedded Software Engineer, Orb (Munich)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Embedded Software Engineer to join our Device Software team in Munich.

**About the Orb:**
A secure biometric imaging system designed to seamlessly prove humanness in a privacy-preserving way. It performs local analysis of biometric data with no backend storage, transferring authenticated images to user devices for World ID verification.

**About the Role:**
The Device Software team manages all Orb software, including biometric imaging, fraud detection systems, and security-hardened operating environments. Software development occurs in Rust on custom GNU/Linux running NVIDIA Jetson hardware.

**Responsibilities:**
- Scale Orb capabilities through Android platform porting
- Optimize image processing
- Support firmware verifiability improvements
- Support manufacturing, testing automation, and hardware deployment

**Requirements:**
- Rust and Linux production experience
- 5+ years systems programming, robotics, or IoT background
- Large-scale device fleet deployment experience
- AOSP development and HAL integration expertise
- Security-critical application development
- Strong communication and project management abilities
- Mission-driven, collaborative mindset

**Location:** Munich, Germany`,

  "world-sr-embedded-engineer-orb-sf": `Senior Embedded Software Engineer, Orb (San Francisco)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Embedded Software Engineer to join our Device Software team in San Francisco.

**About the Role:**
The Device Software team develops all software running on the Orb, including biometric imaging, fraud detection, and security-hardened operating systems. This position focuses on advancing Orb software toward greater scale, decentralization, and performance across a global fleet deployed to millions of users.

**Responsibilities:**
- Develop core software in Rust on custom GNU/Linux for NVIDIA Jetson platforms
- Port software to Android-based systems and optimize image processing code
- Support manufacturing, test automation, and hardware integration
- Ensure software verifiability and deployment to distributed device networks
- Contribute to strategy and implementation across technical subsystems

**Requirements:**
- Rust and Linux experience in production applications
- 5+ years in systems programming, robotics, or IoT development
- Track record shipping software to large device fleets
- AOSP development and HAL integration experience
- Security-critical application development background
- Strong communication and project management abilities

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-embedded-engineer-orbmini": `Senior Embedded Software Engineer, OrbMini

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Embedded Software Engineer for OrbMini device development.

**About the Role:**
Own the architecture, development, maintenance, and debugging of embedded firmware for roadmap devices.

**Responsibilities:**
- Design low-level drivers and board support packages for microcontrollers and sensors
- Lead hardware/firmware integration and cross-boundary debugging
- Support hardware validation and design reviews
- Evaluate new designs using oscilloscopes and logic analyzers
- Mentor junior engineers
- Coordinate with JDM/ODM partners overseas

**Requirements:**
- Bachelor's or Master's in Electrical/Computer Engineering
- 7+ years embedded firmware development experience
- Proficiency in C/C++ for bare-metal, RTOS, or Linux systems
- Hands-on microcontroller and SoC board bring-up expertise
- Mastery of debugging tools (JTAG, UART, SPI, I2C, PCIe)
- Consumer electronics large-scale development background

**Preferred Skills:** Zephyr RTOS and Linux kernel expertise; Android/AOSP platform experience; secure boot and firmware update pipeline knowledge; camera hardware or vision sensor integration background; Rust programming experience.

**Compensation:** $220,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-embedded-engineer-test": `Senior Embedded Software Engineer, Test

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Embedded Software Engineer to build and maintain automated test infrastructure for hardware devices.

**About the Role:**
Own hardware components of our automated and manual test platforms and design systems to automate user behavior in a test environment.

**Responsibilities:**
- Design hardware-in-the-loop (HIL) testers and manage large-scale test fleets
- Create test infrastructure spanning devices (Orb and future products) and test stations that simulate human interaction
- Establish quality benchmarks and test strategies alongside product teams
- Investigate and reproduce field issues, triaging before handoff to other teams
- Improve test coverage, execution speed, and system reliability through fault-injection testing

**Requirements:**
- Hands-on expertise debugging devices, test rigs, and electrical signals
- Experience designing automation hardware systems at scale
- Ability to write maintainable test frameworks and review test code
- Capability to read firmware and software code to develop targeted tests
- Naturally curious approach to finding bugs and edge cases
- Comfort working with ambiguity without detailed instructions
- Systems-thinking mindset regarding testing bottlenecks

**Compensation:** $176,000 - $220,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-fraud-engineer": `Senior Fraud Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Fraud Engineer to protect the World App and its users through comprehensive fraud controls and security integration.

**Responsibilities:**
- Own end-to-end the integrations of our most critical controls including Face Auth liveness detection
- Integrate with the Fraud Risk Engine
- Develop systems enabling operations teams to respond to user reports across the stack
- Manage SDK/API integrations with external providers
- Implement platform-specific safeguards for Android and iOS
- Partner with data analytics and fraud teams to identify false positives
- Collaborate with Product teams improving user experience for those encountering these systems
- Review engineering changes affecting fraud control systems
- Enforce strict access controls and data retention policies
- Minimize user data collection throughout all implementations

**Requirements:**
- Cross-functional collaboration and self-organization abilities
- Strong technical architecture skills across backend and mobile platforms
- Privacy-minded and capable of adopting an adversarial mindset
- Excellent communication skills
- Direct individual contribution capability across the tech stack

**Nice-to-Have:** Security, fraud, trust & safety domain experience; mobile development proficiency (Android/iOS); data analysis and engineering background.

**Compensation:** $221,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-it-engineer": `Senior IT Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior IT Engineer who combines IT engineering with infrastructure automation.

**About the Role:**
Rather than traditional ticket-based support, focus on building systems, automating processes, and developing internal tools for a 400+ person organization.

**Responsibilities:**
- Design and implement Infrastructure as Code solutions
- Build API integrations connecting enterprise systems
- Develop internal tools to reduce operational overhead
- Enhance security posture through system automation
- Support a distributed, global team

**Requirements:**
- Minimum 7 years IT industry experience
- Identity environment governance via Infrastructure as code frameworks, ideally Terraform
- API integration deployment using tools like Workato
- Internal tool development experience with platforms such as Retool
- Enterprise LLM management tool experience
- Strong problem-solving and communication skills
- Mentoring capability

**Compensation:** $174,500 - $190,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-product-design-engineer": `Senior Product Design Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Design Engineer (Mechanical) to support product development from R&D through manufacturing handover.

**About the Role:**
Design innovative, reliable and manufacturable mechanical components across the full product lifecycle.

**Responsibilities:**
- Design components and systems based on product specifications
- Execute full lifecycle product development (design, develop, test, manufacture, implement)
- Collaborate with industrial design, electrical engineering, and supply chain teams
- Develop outline and theoretical designs
- Build prototypes and conduct experiments with data analysis
- Modify designs to meet requirements and resolve malfunctions
- Evaluate product performance, reliability, and safety
- Improve manufacturability with production teams
- Select materials and estimate manufacturing costs
- Prepare documentation

**Requirements:**
- Proven mechanical engineering experience
- Proficiency with FEA, CFD, and PLM software
- Expertise in 3D design tools (SolidWorks, PTC Creo)
- Strong analytical and creative abilities
- Knowledge of mechanics, kinematics, thermodynamics, materials science
- Experience designing injection-molded components
- Bachelor's or Master's degree in mechanical engineering or mechatronics
- Excellent communication and collaboration skills
- English fluency

**Nice-to-Have:** Tech industry experience with electronic devices; fast-paced startup background.

**Compensation:** $200,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-pm-growth-incentives": `Senior Product Manager, Growth Incentives

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Manager to manage World's global incentive programs—including airdrops and referral systems—that drive user expansion.

**About the Role:**
Oversee multi-million dollar monthly budgets focused on sustainable growth.

**Responsibilities:**
- Optimize incentive programs including Worldcoin airdrops and referral mechanisms
- Manage substantial monthly budgets while maintaining program efficiency
- Design and test new incentive models balancing user attraction with unit economics
- Coordinate across product, economics, finance, data science, marketing, fraud prevention, and regional teams
- Use data and experimentation to measure effectiveness and identify improvements
- Model ROI and cost efficiency with finance partners
- Adapt programs for international markets and cultural contexts
- Foster analytical rigor and experimentation standards

**Requirements:**
- 8+ years as a Product Manager in growth, incentives, or performance-based initiatives
- Proven track record scaling referral systems, cashback programs, or reward campaigns
- Strong analytical capabilities and data interpretation skills
- Background in economics, data science, or quantitative problem-solving
- Experience thriving in fast-paced, high-growth environments
- International market familiarity
- Action bias and sense of urgency

**Compensation:** $220,000 - $280,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-pm-growth-lifecycle": `Senior Product Manager, Growth Lifecycle

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Manager to own the complete user journey from acquisition through long-term engagement.

**About the Role:**
Drive growth across acquisition and onboarding through activation, retention, and long-term engagement.

**Responsibilities:**
- Optimize onboarding experiences and first-time user flows for smooth activation
- Manage lifecycle communications including in-app messages and push notifications
- Evolve the World App homepage using machine learning for personalized content
- Conduct A/B testing and experimentation to improve lifecycle metrics
- Collaborate cross-functionally with product, design, data science, and engineering teams
- Advocate for global users with culturally relevant, localized experiences
- Drive organizational alignment on growth priorities

**Requirements:**
- 8+ years as a Product Manager with demonstrated growth track record
- Experience in Performance Marketing and SEO
- Strong data analysis skills and collaboration with data scientists
- International/multi-market environment experience
- Both strategic and execution-oriented mindset
- Proven ability to navigate ambiguity and create actionable roadmaps
- User experience focus and bias toward action

**Compensation:** $220,000 - $280,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-pm-growth-modalities": `Senior Product Manager, Growth Modalities

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Manager to shape the end-to-end Orb verification journey—from discovery and booking through completion.

**About the Role:**
Own how millions experience World's core offering globally.

**Responsibilities:**
- Manage the complete verification journey, including discovery, appointment booking, and in-person verification processes
- Design and scale multiple verification modalities: operator-guided, self-serve, on-demand, and decentralized operations
- Lead cross-functional collaboration with product, engineering, hardware, marketing, and operations teams
- Drive growth and accessibility to expand global verification adoption
- Optimize digital and real-world user experience touchpoints
- Align product strategy with physical Orb deployment and field performance
- Use data and experimentation to identify friction points and improve conversion rates
- Champion localization and cultural adaptation for diverse markets
- Incorporate field partner feedback into improvements
- Travel internationally to observe users and refine experiences in context
- Influence stakeholders on global growth priorities

**Requirements:**
- 8+ years as a Product Manager with growth, service design, or operationally complex product experience
- International market experience with localization expertise
- Hardware or physical component product background (logistics, retail, IoT, mobility preferred)
- Data-driven, experimentation-focused approach
- Cross-functional collaboration skills
- Willingness to travel globally for field research

**Compensation:** $220,000 - $280,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-pm-hardware-devices": `Senior Product Manager, Hardware Devices

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Manager to lead next-generation hardware development for our proof-of-human verification platform.

**About the Role:**
Span concept through global deployment for identity verification devices.

**Responsibilities:**
- Identify emerging technologies and new form factors for hardware products
- Develop product lifecycle management from prototyping to mass production
- Collaborate across engineering, design, operations, and blockchain teams
- Define long-term vision and strategy for identity verification devices
- Navigate international scaling challenges including compliance and logistics
- Create go-to-market strategies with business and marketing teams

**Requirements:**
- 5+ years hardware product management or consumer electronics experience
- Bachelor's degree in Engineering (or equivalent)
- Ability to operate autonomously in high-ambiguity situations
- Experience launching hardware globally from concept to production

**Preferred:** Blockchain technology, cryptographic identity, industrial design knowledge, regulatory compliance familiarity.

**Compensation:** $200,000 - $245,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-product-security-engineer-munich": `Senior Product Security Engineer (Munich)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Security Engineer for a hands-on technical leadership position focused on embedding security throughout the development lifecycle.

**About the Role:**
This is not a role for box-tickers—it requires thinking from first principles to solve novel security challenges at global scale.

**Responsibilities:**
- Lead secure architecture reviews and threat modeling for applications and cloud services
- Engineer automated security guardrails and reusable libraries for developers
- Conduct deep-dive security code reviews in Rust, Go, and Python
- Own vulnerability management from bug bounty triage to remediation
- Scale Secure SDLC and bug bounty programs

**Requirements:**
- 6+ years in Product Security, Application Security, or Cloud Security
- Proficiency in code review and development (Rust, Go, Python)
- Extensive AWS architecture security experience with infrastructure-as-code tools
- Expertise leading threat modeling sessions
- Strong background implementing security tooling (SAST, DAST, SCA) in CI/CD pipelines
- Deep understanding of OWASP Top 10 and distributed, mobile-first systems security

**Preferred:** Security champions program scaling experience; Kubernetes/EKS and container security expertise; mobile application or smart contract security knowledge.

**Compensation:** €146,000 - €172,000/year + equity + benefits

**Location:** Munich, Germany`,

  "world-sr-product-security-engineer-sf": `Senior Product Security Engineer (San Francisco)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Product Security Engineer for a hands-on security leadership position.

**About the Role:**
Safeguard products powering World's identity and financial network infrastructure.

**Responsibilities:**
- Lead secure architecture reviews and threat modeling for applications and cloud services
- Engineer automated security guardrails and reusable libraries for developers
- Conduct deep-dive security code reviews in Rust, Go, and Python
- Own vulnerability management from bug bounty triage to remediation
- Scale Secure SDLC and bug bounty programs across the growing organization

**Requirements:**
- 6+ years in Product Security, Application Security, or Cloud Security
- Proficiency coding and reviewing Rust, Go, Python
- Extensive AWS architecture security experience with Terraform/CDK expertise
- Expert-level threat modeling facilitation skills
- Strong background implementing security tools (SAST, DAST, SCA) in CI/CD pipelines
- Deep knowledge of OWASP Top 10 and distributed, mobile-first system security

**Nice-to-Have:** Security champions program scaling experience; Kubernetes (EKS) and container security expertise; mobile application or smart contract security focus.

**Compensation:** $221,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-qa-engineer": `Senior Quality Assurance Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Quality Assurance Engineer to own and drive end-to-end quality improvements while embedding in product engineering squads.

**Responsibilities:**
- Establish testing automation frameworks and best practices
- Build core automation test suites covering onboarding and verification flows
- Collaborate with teams to develop automation plans alongside features
- Perform manual QA, issue triage, and reproduction assistance
- Contribute directly across Android, iOS, and backend using AI tools

**Requirements:**
- Quality tools, frameworks, and culture ownership
- Cross-functional collaboration (PMs, localization, legal, support)
- Leadership and mentorship of junior engineers
- Android and iOS development experience
- Automation testing frameworks expertise
- AI programming tools familiarity
- Self-starting mindset and initiative

**Compensation:** $153,500 - $195,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-software-engineer-android": `Senior Software Engineer, Android

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Software Engineer for Android development on the World App team.

**About the Role:**
Own key software components across four strategic areas:
- **Expand:** Scale World ID and World App through new verification methods, streamlined enrollment, and account management improvements
- **Engage:** Build product features, SDKs, cloud integrations, and privacy solutions for secure information attestation
- **Excel:** Develop core infrastructure optimizing security, privacy, compliance, and reliability
- **Extend:** Advance an open, decentralized platform enabling third-party integration without proprietary dependencies

**Requirements:**
- Native Android design and development experience
- Track record of solving complex problems elegantly
- Demonstrated collaboration skills
- Ability to learn rapidly and communicate clearly
- Voice customer insights into product solutions
- Maintain focus on priorities
- Interest in finance, privacy, and digital identity domains

**Compensation:** $230,000 - $270,000/year + equity + benefits

**Location:** San Francisco (relocation support available)`,

  "world-sr-software-engineer-android-financial": `Senior Software Engineer, Android Financial Products

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Android Engineer to lead development of our World Wallet—the most popular self-custody wallet in the world.

**About the Role:**
Own the Android build of World Card, virtual accounts across multiple countries and currencies, and crypto trading features.

**Responsibilities:**
- Design, build, debug, and scale the wallet app
- Collaborate with designers and users
- Build core technologies supporting millions of users globally
- Improve transaction success rates, speed optimization, security, privacy, compliance, and development velocity

**Requirements:**
- Native Android development expertise
- Exceptional software writing ability
- Capacity to tackle complex problems
- Strong prioritization, speed, organization, and collaboration skills
- Ability to translate customer feedback into solutions
- Genuine interest in fintech, privacy, and digital identity sectors
- Clear communication abilities
- Proven capacity for rapid skill acquisition

**Compensation:** $230,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-software-engineer-ios-sf": `Senior Software Engineer, iOS (San Francisco)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Software Engineer for iOS development.

**About the Role:**
Focus on four core areas:
- **Expand:** Grow World ID and World App through new verification methods and streamlined enrollment
- **Engage:** Develop features, SDKs, cloud integrations, and privacy-preserving solutions; collaborate cross-functionally
- **Excel:** Build infrastructure optimizing security, privacy, compliance, and reliability
- **Extend:** Advance decentralized platform capabilities for third-party developers

**Requirements:**
- Extensive native iOS development experience
- Track record of exceptional software and elegant problem-solving
- Strong collaboration, prioritization, and communication skills
- Ability to master new domains and voice customer feedback into product solutions
- Passion for finance, privacy, and digital identity

**Compensation:** $221,000 - $250,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-software-engineer-ios-munich": `Senior Software Engineer, iOS (Munich)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Software Engineer for iOS development in Munich.

**About the Role:**
Develop face authentication—an on-device verification method enabling users to confirm humanity through their phone camera, expanding World ID beyond physical Orb locations.

**Responsibilities:**
- Expand World ID growth through iOS face authentication improvements and enrollment simplification
- Engage with internal ML teams on authentication engine development and production features
- Build infrastructure optimizing security, privacy, compliance, and reliability
- Extend platform capabilities for third-party developer integration

**Requirements:**
- Proven native iOS design and development experience
- Track record of exceptional software and elegant problem-solving
- Strong collaboration, prioritization, and organizational abilities
- Demonstrated capacity to master new technical domains
- Clear, concise communication skills
- Interest in finance, privacy, and digital identity

**Plus factors:** Camera API experience, native library integration (Rust/C++ via Swift), or on-device ML background.

**Location:** Munich, Germany`,

  "world-sr-software-engineer-protocol": `Senior Software Engineer, Protocol

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Software Engineer to develop production-grade systems for the World ecosystem.

**About the Role:**
Focus on cryptography, Ethereum/L2s, and zero-knowledge protocols.

**Responsibilities:**
- Write clean, efficient and maintainable code in Rust
- Design services supporting World ID and World Chain
- Own features from design through deployment
- Contribute to code reviews
- Maintain production systems

**Requirements:**
- 5+ years professional software engineering
- Minimum 2 years Rust in production (or C++/Go with strong Rust interest)
- T-Shaped skill set with exposure to distributed systems, cryptography, or blockchain
- Complex problem-solving mindset
- Collaborative approach
- Strong communication abilities

**Compensation:** $221,000 - $260,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-staff-embedded-engineer-orb-munich": `Senior Staff/Principal Embedded Software Engineer, Orb (Munich)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Staff/Principal Embedded Software Engineer for our Munich office.

**About the Role:**
The Device Software team develops all Orb software, including biometric imaging systems, on-device fraud detection, and security-hardened operating systems. Core software is written in Rust on custom GNU/Linux (NVIDIA Jetson platform).

**Responsibilities:**
- Port software to Android-based systems
- Optimize image capture and processing code
- Support software verifiability across the global fleet
- Manufacturing support and hardware bring-up
- Test automation development

**Requirements:**
- 10+ years in systems programming, robotics, or IoT devices
- Rust and Linux production experience
- Track record shipping software to large device fleets
- AOSP device building and HAL integration experience
- Security-critical application development
- Strong communication and project management skills
- Versatility from strategic planning through implementation
- Mission-driven, collaborative mindset

**Location:** Munich, Germany`,

  "world-sr-staff-embedded-engineer-orb-sf": `Senior Staff/Principal Embedded Software Engineer, Orb (San Francisco)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Staff/Principal Embedded Software Engineer for our San Francisco office.

**About the Role:**
The Device Software team manages all Orb software, including biometric imaging, fraud detection, and security-hardened operating systems. This position involves advancing the platform toward greater scale and decentralization.

**Responsibilities:**
- Port to Android systems
- Optimize image processing
- Support manufacturing, testing automation, and hardware deployment
- Work with Rust on custom GNU/Linux for NVIDIA Jetson platforms

**Requirements:**
- 10+ years in systems programming, robotics, or IoT development
- Production experience with Rust and Linux
- Track record shipping software to device fleets
- AOSP development and HAL integration experience
- Security-critical application building
- Strong communication and project management abilities

**Compensation:** $270,000 - $325,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-technical-recruiter": `Senior Technical Recruiter

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Technical Recruiter for full-cycle recruiting focused on engineering, data, and product hiring.

**Responsibilities:**
- Partner deeply with hiring managers and execs to scope roles and design interview loops
- Manage complete hiring processes from sourcing through candidate closure
- Build ATS reporting
- Support headcount planning
- Mentor team members on recruiting best practices

**Requirements:**
- 6+ years of recruiting experience
- Track record closing technical talent at fast-growing companies
- Individual ownership and collaborative influence
- Problem-solving abilities
- Data-driven decision-making
- Enthusiasm for rapid experimentation and candidate experience excellence

**Compensation:** $160,000 - $190,000/year + equity + benefits

**Location:** San Francisco`,

  "world-sr-staff-economist": `Senior/Staff Economist

World is building a real human network designed to accelerate people in the age of AI. We're seeking an applied economist to advance decision-making through empirical rigor and economic reasoning.

**Responsibilities:**
- Frame economic questions relevant to growth, incentives, and policy
- Design and analyze experiments informing user incentives, marketing, and market operations
- Develop quasi-experimental studies using methods like difference-in-differences, synthetic control, and instrumental variables
- Estimate structural models for demand, dynamic choice, or market design to simulate counterfactuals
- Apply causal ML approaches (meta-learners, causal forests, uplift) for heterogeneous effects
- Execute at data scale using Python and SQL for reproducible analysis
- Communicate findings through decision memos quantifying trade-offs and implications
- Strengthen measurement by defining metrics and detecting interference

**Requirements:**
- PhD in Economics, Econometrics, or related field
- Deep expertise in at least two of: observational causal inference, experimentation, structural modeling
- Strong Python (pandas/numpy; statsmodels/scikit-learn) and SQL proficiency
- Ability to explain complex economic concepts clearly

**Preferred:**
- 4+ years post-PhD applied work (Staff level requirement)
- Structural demand estimation, dynamic discrete choice, two-sided markets
- Causal ML, Bayesian methods, time-series analysis
- Track record influencing major product or policy decisions
- Blockchain data experience

**Compensation:** $205,000 - $285,000/year + equity + benefits

**Location:** San Francisco`,

  "world-snr-growth-ops-lead-rola": `Snr Growth & Operations Lead, ROLA

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Growth & Operations Lead for Rest of Latin America (ROLA) markets.

**About the Role:**
Lead day-to-day operations and growth across the ROLA markets, reporting to the Latin America Region Manager. This role demands operational excellence, analytical capability, and stakeholder sensitivity.

**Responsibilities:**
- Execute market operations and manage operating partners daily
- Motivate local partners, operators, and affiliates while tracking KPIs (verifications, customer acquisition cost, engagement)
- Implement trust and safety protocols including site audits and mystery shopper programs
- Serve as local intelligence hub gathering insights on user sentiment and regulatory climate
- Support university and tech hub partnerships
- Maintain rigorous documentation and reporting to headquarters

**Requirements:**
- 5+ years in operations, growth, or partner management (technology/fintech preferred)
- Experience managing multi-stakeholder ecosystems
- Demonstrated compliance and risk identification abilities
- Event and activation leadership experience
- Strong data analytics skills with dashboards and spreadsheets
- Fluent in Spanish and English
- Based in Buenos Aires; ~75% travel availability
- Bachelor's degree in Business, Economics, or Political Science

**Ideal Profile:** Entrepreneurial, scrappy, integrity-driven, and self-directed—capable of thriving in ambiguity while translating strategy into local execution.

**Location:** Buenos Aires, Argentina`,

  "world-snr-growth-lead-uk": `Snr Growth Lead II, UK

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Senior Growth Lead for the UK market.

**About the Role:**
Strategic and operational leadership position overseeing UK market expansion. Manage day-to-day Operator performance, drive sustainable user growth, and maintain compliance with UK regulations.

**Responsibilities:**
- Lead UK growth and operational performance, ensuring strong Operator execution
- Source, onboard, and manage Operators and key partners
- Oversee location strategy and brand activation approvals
- Ensure full compliance with UK data protection and financial regulations
- Collaborate on high-trust, user-centric marketing campaigns
- Implement operational best practices for scalability
- Track performance metrics and assess risks
- Deliver Operator training sessions

**Requirements:**
- 7+ years in operations, business development, or growth management (tech/fintech preferred)
- Proven success managing distributed teams across multiple sites
- Strong understanding of GDPR and UK regulatory landscape
- Exceptional relationship-building and communication skills
- Data-driven decision-making ability
- Entrepreneurial mindset with comfort navigating ambiguity
- Must be based in London; willing to travel across UK and Europe

**Location:** London, UK`,

  "world-software-engineer-ai-data-infra": `Software Engineer, AI Data Infrastructure

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Software Engineer for AI Data Infrastructure combining backend development, data engineering, and infrastructure work.

**About the Role:**
Build infrastructure supporting iris recognition and fraud detection technology at billion-user scale.

**Responsibilities:**
- Design resilient data ingestion pipelines from edge devices with traceability and versioning
- Develop transformation processes for production-grade datasets ready for AI training
- Build secure APIs for large-scale dataset access with governance controls
- Create monitoring systems with automated checks and self-healing capabilities
- Develop MLOps tooling for research team iteration cycles
- Construct lightweight dashboards using Streamlit or Next.js
- Manage the lifecycle of critical data assets including lineage tracking

**Requirements:**
- 4-6 years proficiency in Python and Go for production services
- Docker and Kubernetes containerization expertise
- AWS services (S3, KMS, IAM) and Terraform infrastructure-as-code skills
- Data pipeline design experience with Snowflake or similar SQL platforms
- CI/CD pipeline and GitHub Actions familiarity
- MongoDB and schema evolution capabilities
- Data modeling and backward-compatible schema design fundamentals

**Nice-to-Have:** Event-driven pipeline experience (SQS, SNS, Lambda); Datadog or Prometheus monitoring; Rust proficiency or willingness to learn.

**Compensation:** €125,000 - €153,000/year + equity + benefits

**Location:** Munich, Germany`,

  "world-software-engineer-backend-cloud": `Software Engineer, Backend & Cloud

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Backend & Cloud Software Engineer (IC4) to join our backend/platform team.

**About the Role:**
Own APIs, data, and cloud infrastructure end-to-end. Build Node.js/TypeScript services, GraphQL over Postgres, event-driven pipelines, and AWS foundations.

**Responsibilities:**
- Design service boundaries, API contracts (GraphQL/REST), and data models
- Build robust Node.js/TypeScript services and Lambda endpoints with strict typing
- Lead AWS infrastructure design emphasizing least-privilege IAM and networking
- Drive reliability through caching, pagination, connection pooling, and rate limiting
- Own database migrations and schema lifecycle planning
- Establish observability with structured logging, metrics, and Datadog tracing
- Harden security via Auth0, KMS, and audit trails
- Mentor IC3 engineers and establish engineering standards

**Requirements:**
- Substantial professional experience with Node.js/TypeScript and AWS
- Proven track record shipping production APIs over relational databases
- Expert-level AWS knowledge (Lambda, API Gateway, SQS, EventBridge, CloudFront, S3, CloudWatch)
- Strong SQL/Postgres fundamentals including indices, query plans, and transactions
- GraphQL experience, ideally with Hasura
- Security-minded approach to IAM, secret management, and threat modeling
- Excellent mentoring and cross-functional communication skills
- Git and modern CI/CD tooling proficiency

**Nice-to-Have:** Event-driven architectures at scale; edge/SSR caching and API contract testing; OpenNext/serverless Next.js deployment; CI/CD, feature flags, and canary deployments.

**Location:** Munich, Germany`,

  "world-software-engineer-fullstack": `Software Engineer, Full Stack

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Full Stack Software Engineer to join a fast-moving product engineering team.

**About the Role:**
Build end-to-end experiences across web and APIs using Next.js, React/TypeScript, Node.js services, and GraphQL-powered data layers.

**Responsibilities:**
- Construct polished, accessible interfaces using Next.js, React, and TypeScript
- Design performant Node.js APIs and serverless endpoints
- Integrate GraphQL (Hasura) with robust typing and code generation
- Implement secure authentication and session management via Auth0
- Own complete feature lifecycles from specifications through rollout
- Optimize performance using SSR/SSG, caching, and streaming techniques
- Collaborate across design, data, security, and infrastructure teams
- Enhance developer experience through shared libraries and tooling

**Requirements:**
- Production experience shipping web applications with Next.js, React, and TypeScript
- Competency with Node.js/TypeScript services (REST/GraphQL) and serverless patterns
- Strong product intuition balancing speed, UX quality, and correctness
- Understanding of data modeling, GraphQL, and SQL fundamentals
- Clear communication with ownership mindset and ability to execute under ambiguity
- IC3+ level capability (independent delivery through multi-sprint project leadership)

**Nice-to-Have:** AWS services and infrastructure-as-code; observability practices; CI/CD, feature flags, and gradual rollout strategies; high-quality testing practices with Vitest and Playwright.

**Location:** Munich, Germany`,

  "world-staff-backend-engineer": `Staff Backend Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Backend Engineer for our World ID team.

**About the Role:**
Build core infrastructure for a decentralized digital identity protocol.

**Responsibilities:**
- Take ownership of the design, development, and scaling for mission-critical software including decentralized, privacy-preserving systems
- Guide engineering teams through complex projects, delivering solutions for novel challenges
- Coach junior engineers while collaborating with senior leadership and product managers
- Shape the technical roadmap for World ID, identifying priorities and driving initiatives to completion

**Technical Focus Areas:**
Credential issuance, decentralized cloud platforms, MPC systems, blockchain integration, zero-knowledge proofs, biometric verification, and network integration.

**Requirements:**
- Senior technical leadership experience
- Proven ability managing complex initiatives end-to-end
- Track record mentoring engineering teams
- Deep expertise designing reliable, scalable backend systems
- Strong communication abilities across technical and non-technical audiences

**Compensation:** $225,500 - $265,000/year + equity + benefits

**Location:** San Francisco`,

  "world-staff-fraud-engineer": `Staff Fraud Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Fraud Engineer to own fraud controls and security integrations.

**Responsibilities:**
- Manage end-to-end implementation of critical safeguards including facial authentication, liveness detection, and time-of-use enforcement
- Integrate fraud risk engines and operations response systems
- Develop platform-specific protections for Android and iOS
- Collaborate with analytics teams to minimize false positives
- Partner with product teams on user experience improvements
- Review engineering changes affecting security systems
- Implement strict access controls while minimizing data collection

**Requirements:**
- Proficiency in cross-functional collaboration and self-organization
- Strong technical architecture skills across backend and mobile platforms
- Privacy-focused mindset with adversarial thinking capabilities
- Excellent communication abilities
- Hands-on engineering contributions across the stack

**Preferred:** Security, fraud, or trust & safety background; mobile development expertise (Android/iOS); data analysis and engineering skills.

**Compensation:** $276,500 - $310,000/year + equity + benefits

**Location:** San Francisco`,

  "world-staff-infra-engineer": `Staff Infrastructure Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Infrastructure Engineer to establish our infrastructure presence in the United States.

**About the Role:**
Combine hands-on systems administration with automation and Site Reliability Engineering (SRE) practices. Support critical systems including anonymous multi-party computation platforms, internal security services, and blockchain node deployments.

**Responsibilities:**
- Contribute to technical direction and best practices
- Work across infrastructure automation, systems administration, and reliability engineering
- Support distributed global teams

**Requirements:**
- Minimum 10 years of infrastructure engineering experience
- Strong systems engineering foundation with Linux, networking, and cloud platforms (AWS/GCP)
- Infrastructure-as-code experience (Terraform)
- Large-scale, distributed systems background
- Problem-solving orientation and initiative
- Clear communication skills for distributed teams
- Motivation aligned with the company's mission

**Compensation:** $276,500 - $300,000/year + equity + benefits

**Location:** San Francisco`,

  "world-staff-product-design-engineer": `Staff Product Design Engineer

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Product Design Engineer (Mechanical) for device development.

**About the Team:**
The Device Team manages supply chain, manufacturing, logistics, physical security, field compliance, and technical support for hardware reaching global audiences.

**Responsibilities:**
- Design mechanical components and systems per requirements
- Execute full lifecycle development: design through manufacturing
- Build and test prototypes with rigorous data analysis
- Collaborate with industrial design and electrical engineering
- Evaluate performance, reliability, and safety
- Optimize manufacturability with production teams
- Select materials and estimate manufacturing costs
- Prepare technical documentation

**Requirements:**
- Proven mechanical engineering experience
- Proficiency with FEA, CFD, and PLM software
- Expertise in 3D design tools (SolidWorks, PTC Creo)
- Strong understanding of mechanics, kinematics, thermodynamics
- Experience designing injection-molded components
- Bachelor's or Master's in mechanical engineering or mechatronics
- Excellent communication skills

**Compensation:** $246,000 - $280,000/year + equity + benefits

**Location:** San Francisco`,

  "world-staff-product-security-engineer-munich": `Staff Product Security Engineer (Munich)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Product Security Engineer for hands-on technical leadership.

**About the Role:**
Embed security throughout the development lifecycle for World's identity and financial network products. Think from first principles to solve novel security challenges.

**Responsibilities:**
- Lead secure architecture reviews and threat modeling for applications and cloud services
- Engineer automated security guardrails and reusable libraries for developers
- Conduct deep-dive code and infrastructure reviews in Rust, Go, and Python
- Own vulnerability management, from bug bounty triage to remediation
- Scale Secure SDLC and bug bounty programs across the engineering organization

**Requirements:**
- 12+ years in Product Security, Application Security, or Cloud Security
- Proficiency in code review and development (Rust, Go, Python)
- Extensive AWS architecture security experience with infrastructure-as-code (Terraform, CDK)
- Expertise in threat modeling and providing actionable engineering guidance
- Strong background implementing security tooling (SAST, DAST, SCA) and CI/CD integration
- Deep knowledge of OWASP Top 10 and distributed, mobile-first system security

**Nice-to-Have:** Security champions program scaling experience; Kubernetes (EKS) and container security expertise; mobile application or smart contract security interests.

**Compensation:** €182,000 - €210,000/year + equity + benefits

**Location:** Munich, Germany`,

  "world-staff-product-security-engineer-sf": `Staff Product Security Engineer (San Francisco)

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Product Security Engineer for hands-on technical leadership.

**About the Role:**
This is not a role for box-tickers—it requires first-principles thinking on novel security challenges at global scale.

**Responsibilities:**
- Lead architecture reviews and threat modeling for applications and cloud services
- Design automated security guardrails and developer-focused libraries
- Conduct deep-dive code and infrastructure reviews (Rust, Go, Python)
- Manage vulnerability triage and remediation workflows
- Scale Secure SDLC and bug bounty programs

**Requirements:**
- 12+ years in Product, Application, or Cloud Security
- Proficiency in Rust, Go, Python code review
- Extensive AWS architecture security experience (Terraform, CDK)
- Threat modeling expertise
- Security tooling implementation (SAST, DAST, SCA)
- OWASP Top 10 and distributed systems knowledge

**Nice-to-Have:** Security champions program scaling; Kubernetes/EKS container security; mobile application security; smart contract security.

**Compensation:** $276,000 - $320,000/year + equity + benefits

**Location:** San Francisco`,

  "world-staff-software-engineer-protocol": `Staff Software Engineer, Protocol

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Staff Software Engineer to develop core protocols powering the World ecosystem.

**About the Team:**
Build trustless, decentralized, and privacy-preserving systems built to scale to billions of users, collaborating with Ethereum ecosystem leaders on open research initiatives.

**Responsibilities:**
- Design and implement production-ready services supporting the World ecosystem
- Write clean, efficient code in Rust
- Own features from design through deployment and provide code reviews
- Collaborate across cryptography, blockchain, AI, and hardware teams
- Manage deployments, monitoring, and production service maintenance

**Requirements:**
- 10+ years professional software engineering experience
- 2+ years building production systems with Rust
- T-shaped expertise in distributed systems, protocol design, blockchain, or zero-knowledge cryptography
- Extensive production service experience with observability tools (tracing, logging, metrics, alerting)
- Incident response and on-call operations background
- Commitment to clean, well-tested code and engineering best practices

**Compensation:** $225,000 - $275,000/year + equity + benefits

**Location:** San Francisco`,

  "world-systems-delivery-lead": `Systems & Delivery Lead

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Systems & Delivery Lead to drive operational excellence across technical programs.

**About the Role:**
Lead cross-functional delivery efforts ensuring smooth execution of technical programs and system implementations.

**Responsibilities:**
- Drive program delivery across multiple technical workstreams
- Coordinate between engineering, product, and operations teams
- Manage dependencies and risk mitigation strategies
- Establish delivery standards and best practices
- Track progress and communicate status to stakeholders

**Requirements:**
- Strong program management experience in technical environments
- Experience coordinating complex, cross-functional initiatives
- Excellent communication and stakeholder management skills
- Data-driven approach to tracking and reporting
- Ability to navigate ambiguity and drive clarity

**Location:** San Francisco`,

  "world-tpm-device-compliance": `Technical Program Manager, Device Compliance

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Technical Program Manager to oversee global device launches while ensuring regulatory compliance.

**About the Role:**
Collaborate with product and engineering teams to solve compliance challenges and shape designs that establish world-class trust, safety, and reliability.

**Responsibilities:**
- Manage homologation projects with internal teams and external regulatory partners
- Partner early with product/engineering to ensure devices meet regulatory standards
- Develop risk assessments and requirements for new products and design modifications
- Create compliance processes and tools
- Mentor junior team members building the device compliance function

**Requirements:**
- Electrical engineering background or equivalent
- 7+ years in product compliance or related roles
- Experience launching electronic consumer products globally
- Systematic mindset balanced with fast-paced environment adaptation
- Strong stakeholder communication abilities
- Proven project management skills

**Compensation:** $180,000 - $220,000/year + equity + benefits

**Location:** San Francisco`,

  "world-tpm-world-id": `Technical Program Manager, World ID

World is building a real human network designed to accelerate people in the age of AI. We're seeking a Technical Program Manager focused on driving operational excellence and ensuring seamless execution of technical and non-technical programs across the World ID initiative.

**Responsibilities:**
- Lead program management efforts
- Orchestrate the product development lifecycle
- Collaborate across cross-functional teams
- Track progress and identify blockers
- Manage partner integration programs
- Establish delivery standards for internal and external initiatives

**Requirements:**
- 5+ years in technical program management or engineering leadership
- Strong engineering background with coding proficiency
- Deep understanding of software development lifecycles
- Excellent stakeholder management and communication abilities
- Experience managing external partner programs
- Familiarity with privacy, security, and decentralized technologies
- Bachelor's degree in Computer Science, Engineering, or equivalent experience

**Preferred:** Web3, blockchain, or digital identity experience; ability to design and optimize processes; comfort navigating ambiguity with strong ownership mentality.

**Compensation:** $238,000 - $270,000/year + equity + benefits

**Location:** San Francisco`,

  "world-engineering-fellowship": `TFH Engineering Fellowship

World is building a real human network designed to accelerate people in the age of AI. We're offering an Engineering Fellowship program targeting early-career builders.

**About the Program:**
Fellows receive real responsibility on production systems. Strong performers typically transition to full-time roles at or shortly after program completion. The fellowship emphasizes accountability for measurable outcomes rather than traditional internship structures.

**Application Requirements:**
- Resume and portfolio/GitHub links
- LinkedIn profile and phone number
- Ability to relocate to greater San Francisco
- Disclosure of sponsorship needs
- Demonstrate AI tool usage in development work
- Share exceptional achievements and recent projects

**Application Deadline:** February 28, 2026

**Location:** San Francisco (in-person, full-time)`,

  "world-spaces-manager": `World Spaces Manager

World is building a real human network designed to accelerate people in the age of AI. We're seeking a World Spaces Manager to manage flagship World Spaces locations.

**About the Role:**
World Spaces serve as physical touchpoints where customers can experience our human verification technology. Oversee daily operations while maintaining premium customer experiences.

**Responsibilities:**
- Operate one or more World Spaces locations according to established standards
- Recruit and develop staff to achieve customer satisfaction metrics
- Plan and execute community events and visitor engagement activities
- Drive foot traffic through local partnerships and marketing campaigns
- Monitor budgets and track key performance indicators (CAC, cost per visit, verification costs)
- Collaborate with central teams to improve operational procedures

**Requirements:**
- Background in operations, hospitality, retail, or experiential marketing with team management experience
- Data analysis capabilities
- Strong cross-functional communication
- Comfort operating in fast-paced startup environments with changing priorities

**Compensation:** $115,000 - $130,000/year + equity + benefits

**Location:** San Francisco`,
};

async function main() {
  console.log("Starting job description backfill...\n");

  let updated = 0;
  let notFound = 0;

  for (const [jobId, description] of Object.entries(jobDescriptions)) {
    try {
      const result = await db
        .update(jobs)
        .set({ description })
        .where(eq(jobs.id, jobId))
        .returning({ id: jobs.id, title: jobs.title });

      if (result.length > 0) {
        console.log(`✓ Updated: ${result[0].title}`);
        updated++;
      } else {
        console.log(`✗ Not found: ${jobId}`);
        notFound++;
      }
    } catch (error) {
      console.error(`✗ Error updating ${jobId}:`, error);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);
  process.exit(0);
}

main();
