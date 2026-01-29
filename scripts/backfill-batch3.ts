/**
 * Backfill batch 3 - More companies
 * Run: bun run scripts/backfill-batch3.ts
 */

import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // ============= UNISWAP LABS =============
  "uniswap-backend-engineer-unichain": `Backend Engineer - Unichain

Uniswap Labs is building products to unlock value through universal exchange. We're looking for an enthusiastic Backend Engineer to help us build the next chain that will be the house of liquidity and DeFi.

**About the Role:**
We recently launched an Optimism L2 chain that we want to scale and expand. You'll work on critical infrastructure powering the Uniswap Protocol, the largest onchain marketplace with billions of dollars in weekly volume.

**Responsibilities:**
- Write high quality and well tested code, and review code from other team members
- Take charge of driving strategic technical initiatives to ensure the reliability and scalability of the chain
- Manage projects comprehensively from requirements gathering and design to debugging, testing, and release management
- Design, build, and maintain large-scale production systems on the cloud
- Be part of the on-call rotation to guarantee 24/7 chain availability
- Provide guidance and technical leadership to peers

**Requirements:**
- 2+ years of software engineering experience
- 2+ years experience in Golang, Rust, TypeScript, or similar
- Experience designing, building, and maintaining large-scale production systems
- Desire to stay up-to-date with modern software development practices and Web3 technologies

**Nice to Have:** Experience with Optimism chain or OP codebase; Solidity experience; time-series monitoring systems; AWS experience.

**Benefits:** Unlimited PTO, 100% company-paid medical/dental/vision, 401(k), $1,500 education stipend, up to 16 weeks paid parental leave, home office setup allowance

**Location:** New York or US-based Remote`,

  "uniswap-senior-backend-engineer": `Senior Backend Engineer

Uniswap Labs is seeking a passionate Senior Backend Engineer to contribute to the development of cutting-edge financial products.

**About the Role:**
The Uniswap Protocol is the leading decentralized trading and automated market making protocol on Ethereum. Join our highly impactful team to build the future of decentralized finance.

**Responsibilities:**
- Write and review high-quality, thoroughly tested code
- Collaborate closely with product managers, designers, and engineers to transform requirements into exceptional products
- Provide technical leadership and guidance to peers in navigating architectural and coding tradeoffs
- Drive strategic technical initiatives across engineering pods
- Design, build, and maintain large-scale cloud-based production systems

**Requirements:**
- 6+ years of software engineering experience
- Proficient coding with deep understanding of cloud architectures and algorithms
- Ability to build systems from scratch (0→1)
- Experience mentoring junior engineers
- Strong debugging skills

**Nice to Have:** Prior Technical Lead experience; time-series monitoring systems; CS degree; TypeScript proficiency; AWS familiarity.

**Compensation:** $180,000 - $220,000/year + equity + tokens + benefits

**Location:** New York or Remote`,

  "uniswap-senior-frontend-engineer": `Senior Frontend Engineer

Uniswap Labs is looking for a Senior Frontend Engineer to build world-class decentralized trading interfaces.

**About the Role:**
Work on the Uniswap Interface, Mobile App, and Extension—products powered by the Uniswap Protocol, the largest onchain marketplace with billions of dollars in weekly volume across thousands of tokens.

**Responsibilities:**
- Build and maintain high-quality user interfaces for decentralized applications
- Collaborate with designers to create intuitive, responsive experiences
- Write clean, well-tested code and participate in code reviews
- Drive technical decisions and mentor junior engineers
- Stay current with Web3 frontend best practices

**Requirements:**
- 5+ years of frontend engineering experience
- Strong proficiency in React, TypeScript, and modern JavaScript
- Experience building production applications for Web3/DeFi
- Understanding of Web3 libraries (ethers.js, wagmi, viem)
- Excellent problem-solving and communication skills

**Benefits:** Unlimited PTO, 100% company-paid healthcare, 401(k), education stipend, parental leave, home office allowance

**Location:** New York or Remote`,

  "uniswap-senior-smart-contract-engineer": `Senior Smart Contract Engineer

Uniswap Labs is seeking a Senior Smart Contract Engineer to work on the core protocol and related smart contracts.

**About the Role:**
The Uniswap Protocol is the leading decentralized exchange on Ethereum. Help build and maintain the smart contracts that power billions of dollars in trading volume.

**Responsibilities:**
- Design, develop, and audit smart contracts for the Uniswap ecosystem
- Write comprehensive test suites and documentation
- Collaborate with security researchers on audits and bug bounties
- Research and implement new DeFi primitives
- Optimize gas efficiency and contract security

**Requirements:**
- 4+ years of smart contract development experience
- Expert-level Solidity proficiency
- Deep understanding of the EVM and DeFi protocols
- Experience with testing frameworks (Foundry, Hardhat)
- Security-first mindset with audit experience

**Benefits:** Competitive compensation, unlimited PTO, 100% company-paid healthcare, 401(k), equity and token compensation

**Location:** New York or Remote`,

  "uniswap-staff-backend-engineer": `Staff Backend Engineer

Uniswap Labs is seeking a Staff Backend Engineer to drive technical strategy and build critical infrastructure.

**About the Role:**
Lead the development of backend systems powering the Uniswap ecosystem, which processes billions in weekly trading volume.

**Responsibilities:**
- Drive technical strategy and architecture decisions
- Design and build large-scale distributed systems
- Mentor and develop engineering talent
- Lead cross-functional technical initiatives
- Ensure system reliability, scalability, and performance

**Requirements:**
- 8+ years of software engineering experience
- Proven track record building and scaling production systems
- Strong leadership and mentoring abilities
- Deep expertise in distributed systems architecture
- Experience with cloud infrastructure (AWS)

**Compensation:** $210,000 - $250,000/year + equity + tokens + benefits

**Location:** New York or US-based Remote`,

  // ============= DUNE =============
  "dune-platform-engineer": `Platform Engineer

Dune is on a mission to make crypto data accessible. We're seeking a Platform Engineer to build and operate the systems that power our analytics platform.

**About Dune:**
We're a collaborative multi-chain analytics platform used by thousands of developers, analysts, and investors. With ~60 employees across Europe and US timezones, we're backed by Coatue and Union Square Ventures.

**Responsibilities:**
- Design, operate, and continuously improve cloud infrastructure using infrastructure-as-code, monitoring, and observability
- Own critical parts of the platform: identify bottlenecks, propose improvements, drive reliability and performance
- Run Kubernetes in production and evolve operations
- Develop and maintain automation, CI/CD pipelines, and internal tooling
- Build monitoring and observability systems
- Participate in on-call rotation and incident response

**Requirements:**
- Strong experience with cloud infrastructure and Kubernetes
- Infrastructure-as-code expertise (Terraform)
- Monitoring and observability experience (Grafana, Prometheus)
- Production systems operations background
- Strong debugging and problem-solving skills

**Location:** Europe or US East Coast (Remote)`,

  "dune-software-engineer-blockchain-data": `Software Engineer - Blockchain Data

Dune is seeking a Software Engineer to scale our data platform for an ever-growing volume of blockchain data.

**About the Role:**
Work on large-scale distributed systems and databases, building a data platform that facilitates performant SQL queries across petabytes of blockchain data.

**Responsibilities:**
- Automate processes to reduce operational toil by leveraging AI and building agents
- Work on one of the fastest engineering teams in the industry
- Contribute to enterprise-grade software delivery
- Write code in Kotlin, Java, Rust, and Go with emphasis on design and performance
- Assume ownership of components within our blockchain data platform
- Engage in distributed systems, large databases, SQL processing, and performance challenges
- Design distributed systems and participate in architectural decisions

**Requirements:**
- Coding experience in any JVM language
- Zeal for writing well-designed, testable software
- Great collaboration and communication skills
- Experience with distributed systems and databases

**Location:** Europe or US East Coast (Remote)`,

  // ============= ETHEREUM FOUNDATION =============
  "ef-protocol-tester-consensus": `Protocol Tester - Consensus Layer

The Ethereum Foundation is seeking passionate individuals to help reduce the risk of software failures across the Ethereum protocol.

**About the Role:**
As part of the EF Testing Team, you'll collaborate with testers, operators, client developers, and protocol researchers to ensure protocol upgrades are thoroughly tested.

**Responsibilities:**
- Contribute to the open-source community by sharing ideas, improvements, and solutions
- Collaborate with other teams to ensure seamless code integration and test results
- Improve test methods and enhance test infrastructure
- Implement and execute reliable, deterministic tests for protocol upgrades

**Requirements:**
- Desire to openly share improvements, ideas, failures, and successes
- Familiarity with the entire software development life cycle
- Intermediate experience in Linux environments
- 2+ years experience with Python
- 2+ years experience as a software tester
- Foundational knowledge of the Consensus Layer protocol

**Nice to Have:** Automation in CI pipelines; Go programming; open-source contributions; pytest framework experience; Ethereum beacon chain familiarity.

**Location:** Remote (Global)`,

  "ef-developer-tooling-coordinator": `Developer Tooling Coordinator

The Ethereum Foundation is seeking a Developer Tooling Coordinator to support the Ethereum developer ecosystem.

**About the Role:**
Help coordinate developer tooling efforts across the Ethereum ecosystem, ensuring developers have the resources they need to build on Ethereum.

**Responsibilities:**
- Coordinate developer tooling initiatives across the ecosystem
- Identify gaps in developer experience and tooling
- Support grant programs for developer tools
- Engage with the developer community
- Document and share best practices

**Requirements:**
- Strong understanding of Ethereum development
- Experience with developer tools and SDKs
- Excellent communication and coordination skills
- Community engagement experience
- Technical background in software development

**Location:** Remote (Global)`,

  // ============= MONAD FOUNDATION =============
  "monad-foundation-design-engineer": `Design Engineer

The Monad Foundation is seeking a Design Engineer to own the behavioral layer of our products, including interaction logic, motion systems, and micro-interactions.

**About the Role:**
Sit within the Design Team and define how features feel before engineering builds them. Shape state transitions, sequencing, timing, and patterns that reduce cognitive load and build trust.

**Responsibilities:**
- Define interaction models, state diagrams, and multi-step flows
- Design motion as communication—timing scales, easing curves, hierarchy
- Build motion tokens and reusable interaction primitives
- Create GSAP/Framer Motion animations
- Prototype flows in real code (Next.js) to validate experience early
- Design multi-state component behavior
- Bridge the gap between design and engineering

**Requirements:**
- Strong prototyping skills in code (React, Next.js)
- Experience with animation libraries (GSAP, Framer Motion)
- Eye for detail and timing in interactions
- Ability to think in behaviors instead of screens
- Understanding of design systems

**Location:** Remote`,

  "monad-foundation-graphic-designer": `Graphic Designer

The Monad Foundation is seeking a Graphic Designer to create visual assets for our ecosystem.

**About Monad:**
The Monad blockchain is a performant and parallel EVM Layer 1 that will help decentralized apps eat the world.

**Responsibilities:**
- Create visual assets for marketing and brand materials
- Design graphics for social media and community content
- Develop brand guidelines and maintain visual consistency
- Collaborate with marketing and community teams
- Support ecosystem projects with design resources

**Requirements:**
- 3+ years of graphic design experience
- Proficiency in design tools (Figma, Adobe Creative Suite)
- Portfolio demonstrating brand and marketing work
- Understanding of Web3 and crypto culture
- Strong attention to detail

**Location:** Remote`,

  "monad-foundation-motion-designer": `Motion Designer

The Monad Foundation is seeking a Motion Designer to create animated content for our ecosystem.

**Responsibilities:**
- Create motion graphics for marketing and educational content
- Design animated assets for social media and community
- Develop motion guidelines and systems
- Collaborate with design and marketing teams
- Support ecosystem projects with motion design

**Requirements:**
- 3+ years of motion design experience
- Proficiency in After Effects, Cinema 4D, or similar
- Understanding of animation principles
- Portfolio demonstrating motion work
- Web3 and crypto interest

**Location:** Remote`,

  "monad-foundation-technical-program-manager": `Technical Program Manager

The Monad Foundation is seeking a Technical Program Manager to coordinate technical initiatives across our ecosystem.

**Responsibilities:**
- Coordinate technical programs and initiatives
- Manage cross-functional projects between engineering and ecosystem teams
- Track progress and identify blockers
- Facilitate communication between stakeholders
- Drive delivery of key milestones

**Requirements:**
- 5+ years of technical program management experience
- Strong understanding of blockchain technology
- Excellent communication and coordination skills
- Experience working with distributed teams
- Track record of delivering complex technical projects

**Location:** Remote`,

  // ============= REMAINING ALCHEMY JOBS =============
  "alchemy-account-executive-solana": `Account Executive, Solana

Alchemy is seeking an Account Executive to drive sales for our Solana products.

**About the Role:**
Own the entire sales process for Solana developers and teams building on Alchemy's infrastructure.

**Responsibilities:**
- Manage Solana-focused sales pipeline
- Build relationships with Solana ecosystem projects
- Educate prospects on Alchemy's Solana capabilities
- Close deals and drive revenue growth
- Collaborate with product team on Solana features

**Requirements:**
- 4+ years quota-carrying sales experience
- Knowledge of the Solana ecosystem
- Technical understanding of blockchain infrastructure
- Strong communication and negotiation skills
- Self-starter with autonomous execution ability

**Location:** San Francisco or New York`,

  "alchemy-product-lead-solana": `Product Lead, Solana

Alchemy seeks a Product Lead to drive our Solana product vertical.

**Responsibilities:**
- Define product strategy for Solana offerings
- Collaborate with engineering on roadmap execution
- Engage with Solana ecosystem partners and customers
- Drive product adoption and growth
- Build industry thought leadership

**Requirements:**
- 5+ years product management experience
- Deep knowledge of the Solana ecosystem
- Technical background in developer tools
- Strong communication skills
- Experience with 0→1 products

**Location:** New York or San Francisco`,

  "alchemy-senior-brand-designer": `Senior Brand Designer (Contractor)

Alchemy seeks a Senior Brand Designer to shape our visual identity.

**Responsibilities:**
- Create brand assets and marketing materials
- Develop visual guidelines and systems
- Design for web, print, and digital channels
- Collaborate with marketing on campaigns
- Maintain brand consistency

**Requirements:**
- 5+ years brand design experience
- Strong portfolio demonstrating brand work
- Proficiency in design tools
- Understanding of Web3 and tech branding
- Excellent attention to detail

**Location:** Contract, Remote`,

  // ============= REMAINING RITUAL JOBS =============
  "ritual-controller": `Controller

Ritual is seeking a Controller to manage financial operations.

**Responsibilities:**
- Oversee accounting and financial reporting
- Manage budgeting and forecasting
- Ensure compliance with regulations
- Lead finance team operations
- Support fundraising and investor relations

**Requirements:**
- 8+ years of accounting/finance experience
- CPA or equivalent certification
- Experience with tech/crypto companies
- Strong analytical skills
- Leadership experience

**Benefits:** Competitive compensation, top-tier healthcare, 401k matching, remote flexibility

**Location:** Remote`,

  "ritual-legal-counsel": `Legal Counsel

Ritual is seeking Legal Counsel to support our AI-blockchain infrastructure.

**Responsibilities:**
- Provide legal guidance on products and operations
- Draft and review contracts and agreements
- Navigate regulatory requirements
- Support corporate transactions
- Manage outside counsel relationships

**Requirements:**
- JD and bar admission
- 5+ years legal experience
- Understanding of blockchain/crypto regulations
- Contract drafting expertise
- Tech industry experience preferred

**Benefits:** Competitive compensation, top-tier healthcare, 401k matching, remote flexibility

**Location:** Remote`,

  "ritual-validator-engineer": `Validator Engineer

Ritual seeks a Validator Engineer to build and maintain blockchain validation infrastructure.

**Responsibilities:**
- Build and operate validator infrastructure
- Ensure high availability and performance
- Implement monitoring and alerting
- Optimize staking operations
- Collaborate on protocol improvements

**Requirements:**
- Experience running blockchain validators
- Strong systems engineering skills
- Kubernetes and infrastructure expertise
- Understanding of consensus mechanisms
- On-call availability

**Benefits:** Competitive compensation, top-tier healthcare, 401k matching, remote flexibility

**Location:** Remote`,

  // ============= REMAINING MORPHO JOBS =============
  "morpho-curator-market-specialist": `Curator / Market Specialist

Morpho is seeking a Curator/Market Specialist to manage lending markets on our protocol.

**Responsibilities:**
- Curate and manage lending markets
- Analyze market performance and risks
- Work with partners on market creation
- Monitor market health and parameters
- Support protocol growth initiatives

**Requirements:**
- Deep understanding of DeFi lending
- Risk analysis experience
- Data analysis skills
- Strong communication abilities
- Crypto market knowledge

**Location:** Paris or Remote`,

  "morpho-infrastructure-engineer": `Infrastructure Engineer

Morpho is seeking an Infrastructure Engineer to build and maintain our backend systems.

**Responsibilities:**
- Build and maintain cloud infrastructure
- Implement monitoring and observability
- Ensure system reliability and performance
- Support development teams
- Manage deployments and CI/CD

**Requirements:**
- 3+ years infrastructure engineering
- AWS/GCP experience
- Kubernetes expertise
- Infrastructure-as-code (Terraform)
- Strong debugging skills

**Location:** Paris or Remote`,

  "morpho-risk-analyst": `Risk Analyst

Morpho is seeking a Risk Analyst to monitor and manage protocol risks.

**Responsibilities:**
- Monitor protocol risk metrics
- Analyze market and credit risks
- Develop risk models and frameworks
- Support risk parameter decisions
- Create risk reports and dashboards

**Requirements:**
- Quantitative background
- DeFi protocol understanding
- Data analysis skills
- Risk modeling experience
- Strong analytical abilities

**Location:** Paris or Remote`,

  // ============= ROCKAWAYX REMAINING =============
  "rockawayx-cpp-developer": `C++ Developer - High-Performance Trading Systems

RockawayX seeks a C++ Developer for high-performance trading systems.

**Responsibilities:**
- Develop low-latency trading systems in C++
- Optimize performance-critical code
- Build market-making infrastructure
- Implement trading algorithms
- Ensure system reliability

**Requirements:**
- 3+ years C++ development
- Low-latency systems experience
- Understanding of trading systems
- Performance optimization skills
- Strong debugging abilities

**Location:** Prague (hybrid)`,

  "rockawayx-quant-research-analyst": `Quant Research Analyst

RockawayX seeks a Quant Research Analyst for quantitative trading strategies.

**Responsibilities:**
- Develop quantitative trading models
- Analyze market data and patterns
- Backtest trading strategies
- Collaborate with trading teams
- Research new alpha sources

**Requirements:**
- Quantitative background (math, physics, CS)
- Programming skills (Python, R)
- Statistical analysis expertise
- Understanding of financial markets
- Strong analytical abilities

**Location:** Prague or Remote`,

  "rockawayx-defi-analyst": `DeFi Analyst

RockawayX seeks a DeFi Analyst to research decentralized finance opportunities.

**Responsibilities:**
- Analyze DeFi protocols and opportunities
- Monitor DeFi market trends
- Evaluate yield strategies
- Support investment decisions
- Create research reports

**Requirements:**
- Deep DeFi knowledge
- On-chain analysis skills
- Understanding of yield strategies
- Strong research abilities
- Data analysis experience

**Location:** Prague or Remote`,
};

async function main() {
  console.log("Starting batch 3 job description backfill...\n");

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
