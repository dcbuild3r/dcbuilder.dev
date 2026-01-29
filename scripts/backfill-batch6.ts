import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // === ROCKAWAYX ===
  "rockawayx-data-engineer-solvers": `Data Engineer - Solvers

RockawayX Labs is building cutting-edge blockchain infrastructure and DeFi solutions.

**About the Role:**
Join our solvers team to build data infrastructure for intent-based trading systems.

**Responsibilities:**
- Build data pipelines for solver performance analytics
- Develop monitoring and alerting systems
- Analyze on-chain data for optimization opportunities
- Create dashboards and reporting tools
- Collaborate with trading and engineering teams

**Requirements:**
- Strong SQL and Python skills
- Experience with data pipeline tools (Airflow, dbt)
- Understanding of blockchain data structures
- Experience with time-series databases
- Analytical mindset and attention to detail

**Location:** Prague or Remote`,

  "rockawayx-defi-analyst": `DeFi Analyst

RockawayX is a multi-strategy crypto investment firm with teams spanning VC, yield, and validator operations.

**About the Role:**
Analyze DeFi protocols and opportunities to inform investment and trading strategies.

**Responsibilities:**
- Research and analyze DeFi protocols and mechanisms
- Monitor DeFi market trends and opportunities
- Evaluate protocol risks and tokenomics
- Support investment decision-making with data-driven analysis
- Track portfolio protocol performance

**Requirements:**
- Deep understanding of DeFi protocols (lending, DEXs, derivatives)
- Strong analytical and quantitative skills
- Experience with on-chain data analysis
- Understanding of smart contract mechanics
- Excellent communication skills

**Location:** Prague, Dubai, or Remote`,

  "rockawayx-infrastructure-principal": `Infrastructure Principal

RockawayX operates blockchain infrastructure across multiple networks.

**About the Role:**
Lead infrastructure strategy and operations for our validator and blockchain services.

**Responsibilities:**
- Define infrastructure strategy across networks
- Lead team of infrastructure engineers
- Ensure high availability and security of validator operations
- Optimize performance and cost efficiency
- Drive technical roadmap and standards

**Requirements:**
- 8+ years infrastructure engineering experience
- Experience running blockchain validators or nodes
- Strong leadership and team management skills
- Deep knowledge of Linux, networking, and security
- Experience with cloud and bare-metal infrastructure

**Location:** Dubai, Prague, or Remote`,

  "rockawayx-junior-quant-research-analyst": `Junior Quant Research Analyst

RockawayX Credit Fund focuses on quantitative trading strategies in crypto markets.

**About the Role:**
Support quantitative research and strategy development for crypto trading.

**Responsibilities:**
- Assist in developing and testing trading strategies
- Analyze market data and identify patterns
- Build backtesting frameworks and tools
- Support model development and validation
- Document research findings

**Requirements:**
- Degree in Mathematics, Statistics, CS, or related field
- Strong programming skills (Python preferred)
- Understanding of statistics and probability
- Interest in crypto markets and trading
- Strong analytical and problem-solving skills

**Location:** Remote`,

  "rockawayx-quant-trading-analyst": `Quant Trading Analyst

RockawayX Credit Fund deploys quantitative trading strategies across crypto markets.

**About the Role:**
Develop and execute quantitative trading strategies for crypto markets.

**Responsibilities:**
- Develop and implement trading strategies
- Analyze market microstructure and opportunities
- Build and maintain trading infrastructure
- Monitor and optimize strategy performance
- Research new alpha generation opportunities

**Requirements:**
- 2+ years quantitative trading experience
- Strong programming skills in Python or similar
- Deep understanding of market microstructure
- Experience with crypto markets preferred
- Strong mathematical and statistical background

**Location:** Remote`,

  "rockawayx-software-engineer-solvers": `Software Engineer - Solvers

RockawayX Labs builds advanced solvers for cross-chain intent protocols.

**About the Role:**
Engineer systems that move millions—fast, safe, and fully autonomous.

**Responsibilities:**
- Build advanced solvers for protocols like deBridge, Mayan, and Wormhole
- Engineer systems handling chain reorgs, rebalancing, threshold signing
- Compete and collaborate with the best teams in blockchain
- Develop high-performance, autonomous trading systems

**Requirements:**
- Strong engineering skills, ideally in Rust
- Deep knowledge of Solana and EVM internals (bonus)
- Relentless focus on quality and reliability
- Self-driven with real product ownership
- Fast learner who figures things out

**What We Offer:**
- Office in Prague with flexible hybrid setup
- Team of experts spanning VC, yield, and validator ops
- Solid base salary with serious bonus upside

**Location:** Prague or Remote`,

  "rockawayx-solana-venture-analyst": `Solana Venture Analyst

RockawayX invests across the Solana ecosystem through its venture arm.

**About the Role:**
Source and evaluate investment opportunities in the Solana ecosystem.

**Responsibilities:**
- Source and evaluate Solana ecosystem investment opportunities
- Conduct due diligence on protocols and teams
- Analyze tokenomics and market dynamics
- Support portfolio companies post-investment
- Build relationships in the Solana ecosystem

**Requirements:**
- Deep understanding of Solana ecosystem
- Experience in venture capital or crypto research
- Strong analytical and financial modeling skills
- Network in Solana builder community
- Excellent communication and presentation skills

**Location:** Prague, Dubai, or Remote`,

  // === MONAD FOUNDATION ===
  "monad-foundation-bd-lead-payments": `Business Development Lead, Payment Network

Monad Foundation promotes the development and expansion of the Monad blockchain protocol.

**About the Role:**
Build the payments ecosystem on Monad by developing partnerships with fintechs, PSPs, banks, and stablecoin issuers.

**Responsibilities:**
- Identify, engage, and onboard key ecosystem partners
- Structure and negotiate agreements for Monad as a global settlement layer
- Collaborate on launch strategy including marketing narrative and early integrations
- Evangelize Monad to crypto and fintech communities
- Rapidly develop expertise in stablecoins, payments, and settlements

**Requirements:**
- Track record closing marquee deals in fintech, payments, or traditional finance
- Deep curiosity about stablecoins and crypto/fintech intersection
- Hustler mindset—you make things happen with limited structure
- Strong network or ability to build one quickly in crypto and fintech
- Excellent communicator who moves between technical and business contexts
- Based in or willing to relocate to NYC

**Compensation:** ~$200K base

**Location:** New York City`,

  "monad-foundation-ecosystem-nyc": `Ecosystem Activations, NYC

Monad Foundation is growing the Monad ecosystem through strategic activations.

**About the Role:**
Drive ecosystem growth through events and activations in the NYC market.

**Responsibilities:**
- Plan and execute ecosystem events in NYC
- Build relationships with NYC-based builders and investors
- Coordinate with marketing on activation campaigns
- Support ecosystem partners with local presence
- Represent Monad at industry events

**Requirements:**
- Experience in crypto events or community management
- Strong network in NYC crypto ecosystem
- Excellent organizational and communication skills
- Ability to work independently
- Based in New York City

**Location:** New York City`,

  "monad-foundation-global-events": `Global Events

Monad Foundation supports global adoption of the Monad protocol.

**About the Role:**
Lead global events strategy to build Monad's presence worldwide.

**Responsibilities:**
- Develop and execute global events strategy
- Plan major conferences and ecosystem events
- Coordinate regional activations across markets
- Manage events team and vendors
- Build relationships with event partners

**Requirements:**
- 5+ years event management experience
- Experience with crypto conferences and events
- Strong project management skills
- Ability to travel internationally
- Excellent vendor and stakeholder management

**Location:** Remote`,

  "monad-foundation-head-of-korea": `Head of Korea

Monad Foundation is expanding its presence in the Korean market.

**About the Role:**
Lead Monad's Korea operations to build ecosystem adoption.

**Responsibilities:**
- Develop and execute Korea market strategy
- Build relationships with Korean exchanges, investors, and builders
- Lead local marketing and community initiatives
- Manage Korean team and operations
- Represent Monad with Korean stakeholders

**Requirements:**
- Native Korean speaker
- Deep network in Korean crypto ecosystem
- Experience in market leadership or BD roles
- Understanding of Korean regulatory landscape
- Strong leadership and communication skills

**Location:** Seoul, Korea`,

  "monad-foundation-latam-bd": `LATAM Head/Lead Institutional BD

Monad Foundation is building presence across Latin America.

**About the Role:**
Lead institutional business development across Latin America.

**Responsibilities:**
- Build institutional partnerships in LATAM markets
- Develop relationships with exchanges, funds, and enterprises
- Execute regional go-to-market strategy
- Support ecosystem growth in key LATAM markets
- Represent Monad at regional events

**Requirements:**
- Strong network in LATAM crypto/fintech ecosystem
- Spanish and/or Portuguese fluency
- Experience in institutional BD or sales
- Understanding of LATAM regulatory landscape
- Ability to travel within the region

**Location:** Remote (LATAM)`,

  // === LUCIS ===
  "lucis-ai-data-engineer": `AI & Data Engineer

Lucis is building the future of preventive healthcare with AI-powered insights.

**About the Role:**
Build AI and data infrastructure to power personalized health insights.

**Responsibilities:**
- Design and implement AI/ML pipelines for health data
- Build data infrastructure for health analytics
- Develop models for health risk prediction
- Ensure data privacy and compliance
- Collaborate with medical and product teams

**Requirements:**
- 3+ years experience in AI/ML engineering
- Strong Python and data engineering skills
- Experience with healthcare data preferred
- Understanding of ML model deployment
- Knowledge of data privacy requirements

**Location:** Remote`,

  "lucis-growth-acquisition-manager": `Growth Acquisition Manager

Lucis is scaling its preventive health platform.

**About the Role:**
Drive user acquisition and growth for the Lucis health platform.

**Responsibilities:**
- Develop and execute growth strategies
- Manage paid acquisition channels
- Optimize conversion funnels
- Analyze growth metrics and experiments
- Collaborate with product and marketing teams

**Requirements:**
- 3+ years in growth marketing
- Experience with paid acquisition channels
- Strong analytical and data skills
- Understanding of subscription business models
- Health/wellness industry experience preferred

**Location:** Remote`,

  "lucis-preventive-medicine-doctor": `Preventive Medicine Doctor

Lucis is revolutionizing preventive healthcare with personalized insights.

**About the Role:**
Provide medical expertise to ensure quality and accuracy of health recommendations.

**Responsibilities:**
- Review and validate health content and recommendations
- Consult on medical accuracy of AI-generated insights
- Support product development with medical expertise
- Stay current on preventive medicine research
- Ensure compliance with medical guidelines

**Requirements:**
- MD with focus on preventive/lifestyle medicine
- Experience in digital health or telemedicine
- Strong communication skills
- Comfortable with AI and technology
- Passion for preventive health

**Location:** Remote`,

  "lucis-senior-software-engineer": `Senior Software Engineer

Lucis is building technology to transform preventive healthcare.

**About the Role:**
Build core platform features for the Lucis health application.

**Responsibilities:**
- Design and implement backend services
- Build APIs and integrations
- Ensure scalability and reliability
- Collaborate with frontend and data teams
- Contribute to technical architecture decisions

**Requirements:**
- 5+ years software engineering experience
- Strong backend development skills
- Experience with cloud infrastructure
- Understanding of healthcare data requirements
- API design and integration experience

**Location:** Remote`,

  // === UNISWAP LABS ===
  "uniswap-phd-research-fellow": `PhD Research Fellow

Uniswap Labs is seeking a PhD candidate or graduate for a 6-month paid fellowship starting in June 2025.

**About the Fellowship:**
Work on cutting-edge research projects in market economics, mechanism design, and DeFi at Uniswap's NYC HQ.

**Responsibilities:**
- Work on cutting-edge research projects in market economics and mechanism design
- Develop strong industry and company knowledge
- Learn about Uniswap's culture and operations
- Work on projects aligned with your area of study
- Receive training designed to help you succeed

**Requirements:**
- PhD or PhD candidate in economics, finance, or operations research
- Ability to independently design and execute research plans
- Interest in decentralized finance and crypto-economics
- Self-starter with proactive approach
- High level of enthusiasm

**Nice to Have:**
- Love for the unicorns 🦄

**To Apply:** Submit your CV and a research statement.

**Location:** New York City (remote-optional)`,

  "uniswap-senior-application-security-engineer": `Senior Application Security Engineer

Uniswap Labs builds products that help millions access DeFi, processing over $2.9 trillion in volume.

**About the Role:**
Secure Uniswap's applications across web, mobile, and browser extension products.

**Responsibilities:**
- Conduct security reviews of application code
- Identify and remediate security vulnerabilities
- Develop security tooling and automation
- Collaborate with engineering on secure development
- Respond to security incidents

**Requirements:**
- 5+ years application security experience
- Strong understanding of web and mobile security
- Experience with code review and penetration testing
- Knowledge of crypto/blockchain security
- Excellent communication skills

**Location:** New York or US-based Remote`,

  "uniswap-senior-backend-engineer-platform": `Senior Backend Engineer, Platform

Uniswap Labs powers the Uniswap Protocol across Ethereum and 12+ chains.

**About the Role:**
Build platform infrastructure that powers Uniswap's products and services.

**Responsibilities:**
- Design and build backend platform services
- Develop APIs and data infrastructure
- Ensure platform scalability and reliability
- Collaborate with product and frontend teams
- Drive technical excellence and best practices

**Requirements:**
- 5+ years backend engineering experience
- Strong systems design skills
- Experience with distributed systems
- Understanding of blockchain infrastructure
- Excellent problem-solving abilities

**Location:** New York or US-based Remote`,

  "uniswap-senior-product-designer": `Senior Product Designer

Uniswap Labs is reshaping how value flows on the internet.

**About the Role:**
Design intuitive experiences for Uniswap's web, mobile, and extension products.

**Responsibilities:**
- Lead design for product features
- Conduct user research and testing
- Create design systems and components
- Collaborate with product and engineering
- Drive design quality and consistency

**Requirements:**
- 5+ years product design experience
- Strong portfolio of shipped products
- Experience with web and mobile design
- Understanding of DeFi user needs
- Excellent Figma skills

**Location:** New York or US-based Remote`,

  // === ALCHEMY ===
  "alchemy-executive-assistant-founders-sf": `Executive Assistant, Founders

Alchemy powers 70% of top web3 teams and 90%+ of web2 companies building in web3, backed by Lightspeed, Silver Lake, a16z, and others.

**About the Role:**
Support the founders as their right-hand person and force multiplier during this exciting chapter of Alchemy's growth.

**Responsibilities:**
- Manage daily schedules and logistics for internal and external meetings
- Plan complex projects and design systems for effectiveness
- Expand business relationships and interactions
- Handle high-level strategic planning with maniacal focus on detail
- Communicate constantly with stakeholders including investors, advisors, and partners

**What We're Looking For:**
- Execution/Hustle: High energy and bias towards action
- Highly Organized: Strategic planning with focus on detail
- Stellar Communication: High-quality written and verbal skills
- Proactive problem-solving and anticipation of issues

**What You'll Get:**
- Firsthand view of how a $10B company runs
- Massive ownership and creative liberties
- Opportunity to continually take on more responsibility

**Location:** San Francisco`,

  "alchemy-executive-assistant-founders-ny": `Executive Assistant, Founders

Alchemy's mission is to bring web3 to a billion people by providing builders with the tools they need.

**About the Role:**
Support the founder in New York as their right-hand person during Alchemy's hyper-growth phase.

**Responsibilities:**
- Manage all aspects of the founder's daily schedule
- Coordinate logistics for meetings with investors, advisors, and partners
- Plan complex projects and optimize systems
- Handle communications and stakeholder relationships
- Take on unbounded responsibility and ownership

**Requirements:**
- High energy and bias towards action
- Exceptional organizational skills
- Outstanding written and verbal communication
- Proactive problem-solving mindset
- Experience in high-growth environments preferred

**Location:** New York`,

  "alchemy-sales-dev-rep-us": `Sales Development Representative

Alchemy provides the complete developer platform for web3, powering top brands like Polymarket, OpenSea, Circle, and WorldCoin.

**About the Role:**
Lead outbound and inbound sales efforts to educate customers about blockchain infrastructure.

**Responsibilities:**
- Generate and qualify sales leads
- Conduct outreach to potential customers
- Educate prospects on blockchain infrastructure
- Manage customer relationships through sales cycle
- Collaborate with account executives on opportunities

**Requirements:**
- 1+ years in sales development or similar role
- Strong communication and interpersonal skills
- Interest in blockchain and web3 technology
- Self-motivated with ability to work independently
- Experience with CRM tools

**Location:** US (Hybrid)`,

  "alchemy-sales-dev-rep-singapore": `Sales Development Representative

Alchemy powers 100+ million end users through its developer platform.

**About the Role:**
Drive sales development in the APAC region from our Singapore office.

**Responsibilities:**
- Generate leads in APAC markets
- Qualify and nurture prospects
- Educate customers on Alchemy products
- Support regional sales team
- Build pipeline for account executives

**Requirements:**
- 1+ years in sales development
- Understanding of APAC markets
- Strong communication skills
- Interest in blockchain technology
- Based in Singapore

**Location:** Singapore`,

  // === RITUAL ===
  "ritual-research-intern": `Research Intern

Ritual is building a sovereign execution layer for AI, with the first blockchain custom-built for AI-native operations.

**About the Role:**
Contribute to cutting-edge research at the intersection of crypto and AI.

**Responsibilities:**
- Support research projects in AI/crypto intersection
- Analyze and synthesize technical literature
- Assist with experiments and prototypes
- Document and communicate findings
- Collaborate with research team

**Requirements:**
- Currently pursuing PhD or MS in relevant field
- Strong background in ML, cryptography, or distributed systems
- Programming skills (Python, Rust preferred)
- Interest in crypto and AI intersection
- Strong analytical and communication skills

**Location:** Remote`,

  "ritual-software-engineer-intern": `Software Engineer Intern

Ritual's Infernet enables developers to access AI models on-chain via smart contracts.

**About the Role:**
Build infrastructure at the intersection of crypto and AI.

**Responsibilities:**
- Develop features for Ritual products
- Write clean, tested code
- Collaborate with engineering team
- Learn blockchain and AI technologies
- Contribute to technical documentation

**Requirements:**
- Currently pursuing CS degree or equivalent
- Strong programming skills
- Interest in blockchain and AI
- Ability to learn quickly
- Good communication skills

**Location:** Remote`,

  "ritual-tee-specialist": `TEE Specialist

Ritual is pioneering on-chain AI with secure compute verification.

**About the Role:**
Pioneer the next generation of on-chain compute verifiability solutions using TEE technology.

**Responsibilities:**
- Design and implement TEE-based solutions for secure AI execution
- Develop TEE + GPU integration patterns for AI workloads
- Build verification mechanisms using TEE capabilities
- Design secure network traffic attestation systems
- Implement practical, market-ready TEE solutions

**Requirements:**
- Deep expertise in TEE technologies (SGX, TDX, SEV-SNP)
- Strong systems programming (C++, Rust) with secure enclave focus
- Experience with GPU integration in TEE environments
- Solid Linux systems and kernel-level programming
- Track record shipping production TEE implementations
- Experience with TEE SDKs (Gramine, Open Enclave)

**Nice to Have:**
- Experience with AI/ML systems
- Knowledge of blockchain development
- Background in cryptography
- Experience with zkTLS, TLSNotary

**Location:** Remote`,

  // === WONDERLAND ===
  "wonderland-backend-developer": `Backend Developer

Wonderland builds cutting-edge open-source infrastructure for DeFi and web3.

**About the Role:**
Build backend systems for open-source DeFi infrastructure.

**Responsibilities:**
- Design and develop backend services
- Build APIs and integrations
- Ensure system reliability and performance
- Contribute to open-source projects
- Collaborate with distributed team

**Requirements:**
- 3+ years backend development experience
- Strong programming skills (TypeScript, Go, or Rust)
- Experience with blockchain infrastructure
- Open-source contribution experience preferred
- Excellent async communication skills

**Location:** Remote`,

  "wonderland-partner-lead": `Partner Lead

Wonderland collaborates with top protocols and DAOs to build infrastructure.

**About the Role:**
Lead partnership development for Wonderland's infrastructure offerings.

**Responsibilities:**
- Identify and develop partnership opportunities
- Manage relationships with protocols and DAOs
- Support partners with integration and adoption
- Collaborate with engineering on partner needs
- Represent Wonderland in the ecosystem

**Requirements:**
- Experience in crypto BD or partnerships
- Strong network in DeFi ecosystem
- Understanding of protocol infrastructure
- Excellent communication and negotiation skills
- Self-directed and entrepreneurial mindset

**Location:** Remote`,

  "wonderland-solidity-developer": `Solidity Developer

Wonderland specializes in building secure, efficient smart contract infrastructure.

**About the Role:**
Develop smart contracts for DeFi protocols and infrastructure.

**Responsibilities:**
- Design and implement smart contracts
- Conduct security reviews and testing
- Optimize gas efficiency
- Contribute to protocol architecture
- Support audits and documentation

**Requirements:**
- 3+ years Solidity development experience
- Strong security-focused development practices
- Experience with DeFi protocols
- Familiarity with testing frameworks (Foundry, Hardhat)
- Excellent code quality standards

**Location:** Remote`,

  // === INFRARED FINANCE ===
  "infrared-senior-backend-engineer": `Senior Backend Engineer

Infrared Finance is the flagship application for Berachain's Proof of Liquidity consensus mechanism.

**About the Role:**
Build and optimize backend infrastructure for Infrared's liquid staking and PoL systems.

**Responsibilities:**
- Architect and build backend services and APIs
- Optimize backend processes for scalability and performance
- Design monitoring and analytics systems
- Implement security best practices
- Collaborate with smart contract and frontend teams

**Requirements:**
- Bachelor's or Master's in Computer Science or related field
- 5+ years software development experience
- Proficiency in Golang with backend services experience
- Knowledge of cryptographic principles and blockchain technologies
- Familiarity with cloud services and container orchestration

**Preferred:**
- Experience with building and deploying smart contracts
- Experience running Ethereum validators
- Experience with LSD protocols on Ethereum/Cosmos

**Compensation:** $125K - $999K+ USD/year

**Location:** Remote`,

  "infrared-senior-frontend-engineer": `Senior Frontend Engineer

Infrared Finance maximizes value through its Proof of Liquidity vaults and iBGT liquid staked derivative.

**About the Role:**
Build exceptional frontend experiences for Infrared's DeFi applications.

**Responsibilities:**
- Design and implement user interfaces
- Build responsive web applications
- Integrate with smart contracts and APIs
- Optimize performance and user experience
- Collaborate with design and backend teams

**Requirements:**
- 5+ years frontend development experience
- Strong React/TypeScript skills
- Experience with DeFi interfaces
- Understanding of web3 integration patterns
- Excellent UI/UX sensibility

**Preferred:**
- Experience with Figma and design tools
- Knowledge of blockchain interactions
- Previous DeFi product experience

**Location:** Remote`,

  "infrared-senior-smart-contracts-engineer": `Senior Smart Contracts Engineer

Infrared Finance reimagines liquid staking in the context of Berachain's three-token architecture.

**About the Role:**
Lead secure development of EVM-based liquid staking derivative protocol.

**Responsibilities:**
- Lead development of liquid staking smart contracts on Berachain
- Architect contracts with emphasis on security, scalability, and efficiency
- Proactively identify and mitigate security risks
- Collaborate with auditors on security reviews
- Stay updated with Berachain developments and protocol upgrades

**Requirements:**
- Bachelor's or Master's in Computer Science or related field
- 3+ years experience with focus on blockchain security
- Expertise in Ethereum/Cosmos protocols
- Experience identifying and mitigating security vulnerabilities
- Familiarity with Ethereum development (Geth, Lido) and security tools

**Preferred:**
- Advanced proficiency in Solidity
- Experience with LSD protocols
- Successful track record in DeFi engineering

**Location:** Remote`,
};

async function main() {
  console.log("Starting batch6 job description backfill...\n");

  let updated = 0;
  let notFound = 0;

  for (const [jobId, description] of Object.entries(jobDescriptions)) {
    const result = await db
      .update(jobs)
      .set({ description })
      .where(eq(jobs.id, jobId))
      .returning({ id: jobs.id });

    if (result.length > 0) {
      console.log(`✓ Updated: ${jobId}`);
      updated++;
    } else {
      console.log(`✗ Not found: ${jobId}`);
      notFound++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Total: ${Object.keys(jobDescriptions).length}`);

  process.exit(0);
}

main().catch(console.error);
