import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // === BERACHAIN ===
  "berachain-apac-bd": `APAC Business Development

Berachain is a high-performance EVM-identical Layer 1 blockchain built on the novel Beaconkit framework, leveraging its unique Proof-of-Liquidity (PoL) consensus to accelerate applications and reward users.

**About the Role:**
As a member of the APAC business development team you'll be responsible for growing Berachain's presence in the Chinese crypto market. You'll focus on cultivating and activating Chinese retail users, trading communities, and developer ecosystems. This is a highly cross-functional role that involves ecosystem partnerships, community growth, developer relations, and cultural localization.

**Key Responsibilities:**
- Ecosystem Growth: Build and execute go-to-market strategies to drive adoption of Berachain among Chinese users and developers
- Community Engagement: Develop relationships with key influencers, trading communities, and local media to raise awareness and drive organic interest
- Developer Relations: Work closely with Chinese developer communities to onboard new builders, support dApp development, and organize hackathons, meetups, and educational initiatives
- Localization: Tailor Berachain's messaging, documentation, and content to fit the Chinese market with cultural and linguistic nuances
- Partnership Development: Identify and cultivate strategic partnerships with exchanges, wallets, DeFi protocols, and other ecosystem players

**Requirements:**
- Native/fluent proficiency in Mandarin or Cantonese
- Experience in both tradfi/web2 and crypto-native business development initiatives
- Strong problem-solving and analytical skills
- Deep network across China, Hong Kong, and the broader APAC region
- Proven ability to drive adoption and growth in crypto markets

**Location:** Greater China (Remote-friendly)`,

  "berachain-head-investor-relations": `Head of Investor Relations

Berachain is a high-performance EVM-identical Layer 1 blockchain with mainnet launched in Feb 2025. As of June 2025, it stands as a top 10 L1 by TVL and one of the only L1 ecosystems with a means of returning value to tokenholders through Proof of Liquidity.

**About the Role:**
The Head of Investor Relations will be responsible for shaping Berachain's narrative to institutional investors, managing external communications related to the BERA token, and leading strategic investor engagements globally. You will act as the bridge between the core team and the investor ecosystem, ensuring alignment, clarity, and trust.

**Key Responsibilities:**
- Investor Positioning & Communication: Craft compelling narratives and presentations to articulate the BERA token's role in the Berachain ecosystem
- Own development of investor materials: pitch decks, token reports, ecosystem updates, and FAQs
- Deliver clear, consistent, and compliant messaging to institutional investors across all channels
- Lead global investor roadshows, virtual briefings, and 1:1 meetings
- Build and maintain strong relationships with VCs, hedge funds, family offices, and asset managers
- Collaborate with Business Development and Partnerships teams to align capital engagement

**Requirements:**
- Extensive experience in investor relations, preferably in crypto or fintech
- Strong understanding of token economics and blockchain ecosystems
- Excellent written and verbal communication skills
- Track record of building relationships with institutional investors
- Strategic thinking with ability to translate complex technical concepts

**Location:** Remote | Global`,

  "berachain-korea-lead": `Korea Ecosystem Lead

Berachain is a high-performance EVM-identical Layer 1 blockchain with a strong Korean community through partnerships with local partners including A41, Despread, NodeInfra, 1XP and others, supplemented by listings on Upbit and Bithumb.

**About the Role:**
As the Korea Ecosystem Lead, you'll be responsible for growing Berachain's presence in the Korean crypto market. You'll focus on cultivating and activating Korean retail users, trading communities, and developer ecosystems. This is a highly cross-functional role that involves ecosystem partnerships, community growth, developer relations, and cultural localization.

**Key Responsibilities:**
- Ecosystem Growth: Build and execute go-to-market strategies to drive adoption among Korean users and developers
- Community Engagement: Develop relationships with key influencers, trading communities, and local media
- Developer Relations: Work closely with Korean developer communities to onboard new builders, support dApp development, and organize hackathons and meetups
- Localization: Tailor Berachain's messaging, documentation, and content for the Korean market
- Partnership Development: Identify and cultivate strategic partnerships with Korean exchanges, wallets, and DeFi protocols

**Requirements:**
- Native/fluent proficiency in Korean
- Deep network in Korean crypto ecosystem
- Experience in crypto business development or marketing
- Strong understanding of Korean market dynamics
- Excellent communication and relationship-building skills

**Location:** Seoul, South Korea (Remote-friendly)`,

  "berachain-marketing-lead": `Marketing Lead

Berachain is a high-performance EVM-identical Layer 1 blockchain with a community of 30k+ on Twitter and ~45k+ on Discord, built entirely organically without marketing spend.

**About the Role:**
The Marketing Lead would work closely with leadership to develop and implement marketing strategies and guide the Berachain brand's evolution over time. The ideal candidate will work to increase market penetration across traditional finance, web2 ecosystems, and the existing crypto-native ecosystem across both EVM and Cosmos.

**Key Responsibilities:**
- Develop and implement comprehensive marketing strategies
- Work with BD, Engineering, and Design teams to produce content
- Own the marketing calendar and develop go-to-market strategies for product launches
- Act as a user & protocol advocate, engaging with users and stakeholders
- Drive and quantify ROI of marketing initiatives and campaigns
- Build and scale marketing teams for brand awareness

**Requirements:**
- 3+ years of experience in marketing, business development, or sales in blockchain/fintech
- Track record of leading marketing initiatives at L1s or DeFi protocols
- Experience with HTML, CSS, and Wordpress for simple webpage buildout
- Strong understanding of DeFi, NFT-fi, GameFi landscapes
- Experience managing social accounts and media initiatives (Twitter, Discord, etc.)
- Robust interpersonal communication and collaboration skills

**Preference:** Strong preference for in-person role at Toronto offices

**Location:** Toronto (Remote-friendly)`,

  // === SUCCINCT ===
  "succinct-apac-lead": `APAC Lead

Succinct builds zero-knowledge infrastructure for developers. Our core product is SP1, a breakthrough zkVM that enables developers to generate ZK proofs from normal code with state-of-the-art performance.

**About the Role:**
We're seeking an APAC Lead to enhance our presence and partnerships in Asia, driving adoption of our products and engaging with local communities.

**Responsibilities:**
- Drive Succinct's APAC strategy – building our network among developers, exchanges, VCs, miners, and founders across the region
- Represent Succinct in Asian crypto markets, ensuring we're as well known in APAC as in the West
- Plan and execute "move the needle" activations: developer events, ecosystem meetups, and high-value meeting itineraries
- Drive adoption of Succinct products through partnerships, relationships, and community engagement
- Serve as the bridge between our global team and APAC market dynamics
- Partner closely with founders and leadership on APAC presence strategy

**Requirements:**
- Experience taking a token project to market or working at a leading exchange
- Deep network across Asia: connected to builders, VCs, miners, and founders
- Fluency in English + Korean or Chinese
- Strong understanding of Asian crypto market dynamics
- Proven ability to organize high-impact events and activations
- Charismatic communicator for relationship-driven meetings and larger stages

**Compensation:** $125K - $175K + equity/token package

**Location:** Remote`,

  "succinct-head-of-marketing": `Head of Marketing

Succinct's mission is to make zero-knowledge proofs simple and accessible for all builders. Our infrastructure is in production with top teams including Polygon, Celestia, Avail, Mantle ($2B TVL), Celo, and many more.

**About the Role:**
We're looking for a Head of Marketing to lead the overall marketing strategy from product launch to long-term growth. You'll execute the marketing roadmap, amplify Succinct's narrative, and make technical work relatable for diverse audiences.

**Responsibilities:**
- Lead overall marketing strategy from product launch to long-term growth
- Execute marketing roadmap including product launches and community initiatives
- Amplify Succinct's narrative, making technical work relatable for diverse audiences
- Develop marketing channels beyond Web3 for effective developer acquisition
- Enhance conversion growth through optimized user journeys and A/B testing
- Build and manage a high-performing marketing team
- Oversee marketing operations, managing teams and vendors

**Requirements:**
- 8+ years of marketing experience, with 3+ years in senior leadership roles
- Proven track record in driving end-to-end marketing strategy and operations
- Familiarity with token ecosystems and community engagement dynamics
- Skilled in translating complex technical concepts into appealing narratives
- Experience managing agencies, vendors, or distributed marketing teams
- Data-driven with strong ability to leverage analytics

**Compensation:** $175K - $225K + equity/token package

**Location:** San Francisco (Preferred), Remote`,

  "succinct-head-of-product": `Head of Product

Succinct builds zero-knowledge infrastructure for developers. We've raised $55M from Paradigm and are a small, high-performing team focused on building deeply technical products with real-world adoption.

**About the Role:**
We're looking for a Head of Product to define the product vision, roadmap, and growth opportunities for our zkVM and Prover Network products.

**Responsibilities:**
- Establish product goals aligned with business objectives
- Lead collaborative product management across marketing, engineering, and design teams
- Prioritize product features based on market research and user feedback
- Drive product launches and coordinate with stakeholders
- Monitor market trends and competitors to keep products competitive
- Utilize data analytics to inform decision-making
- Build and lead a world-class product team

**Requirements:**
- 8+ years of product management experience
- Experience with developer tools, infrastructure, or blockchain products
- Strong technical background with ability to work closely with engineering
- Data-driven decision maker with excellent analytical skills
- Experience scaling products from 0 to 1 and beyond
- Deep understanding of zero-knowledge proofs and blockchain technology preferred

**Compensation:** $200K - $250K + equity/token package

**Location:** San Francisco (Preferred), Remote`,

  // === AZTEC ===
  "aztec-executive-assistant": `Executive Assistant

Aztec builds privacy tooling for public blockchains. We invented Plonk, the industry-standard zkSNARK, and Noir, the universal language of zero knowledge. We've raised $125 million from a16z crypto, Paradigm, Variant, Consensys, and a_capital.

**About the Role:**
We're looking for an exceptionally organized, detail-driven Executive Assistant to support our Chief Marketing Officer while driving operational excellence across Marketing.

**Responsibilities:**
- Support the CMO with calendar management, email triage, meeting scheduling, expense submission, and travel coordination
- Prepare All Hands presentations, internal decks, slide setup, formatting, and reformatting
- Support preparation of reports, business summaries, and retrospectives
- Maintain project momentum by sending reminders, tracking progress, and holding owners accountable
- Oversee weekly meetings and build operational checklists
- Support Notion setup, organization, and database maintenance
- Track and follow up on Action Items across projects and meetings
- Assist with contract and agreement preparation, including DocuSign management
- Manage invoice tracking, payment reminders, and Finance coordination
- Coordinate conference attendance tracking and travel bookings
- Organize two offsites per year for the marketing team

**Requirements:**
- 2-4+ years of experience in an Executive Assistance role
- Strong project management experience with track record of delivering complex projects
- Exceptional organizational skills managing multiple workstreams
- Strong communication skills with experience holding teams accountable
- Proficiency with Google Workspace, Notion, Slack, and project management platforms
- Comfort working autonomously in a fast-paced, distributed environment

**Location:** New York City, NY (USA)`,

  "aztec-senior-legal-counsel": `Senior Legal Counsel

Aztec Labs is a UK headquartered software development company that developed the Aztec Network, the first open-source, permissionless, decentralized and programmable privacy Layer 2 on Ethereum.

**About the Role:**
We are looking for someone to serve as senior legal counsel. You will work closely with our General Counsel to identify and navigate potential legal and regulatory challenges, and develop internal processes across product, business development, finance, human resources, operations, and compliance.

**Responsibilities:**
- Work closely with operations team and manage relationships with external counsel and policy groups
- Assist in drafting regulatory responses to consultations to shape policy
- Conduct legal research and analysis; attend policy meeting updates
- Horizon scanning of regulatory developments
- Manage legal aspects of company's share option/token pool strategy
- Manage company's internal corporate affairs, filings, board process, resolutions/minutes
- Collaborate with cross-functional partners on legal implications across strategy, product, partnerships, compliance, IP, and negotiations
- Help build and improve internal contract templates and legal documentation database
- Assist in developing policies and procedures for compliance

**Requirements:**
- 5+ years of legal practice experience
- Strong understanding of web3 regulations and crypto/fintech industry
- Experience in corporate and regulatory matters
- Ability to provide commercial, risk-sensitive legal solutions
- Strong interpersonal skills for cross-jurisdictional relationships
- Experience with contract drafting and negotiation

**Location:** London, UK / New York City, NY (USA)`,

  "aztec-software-engineer-devops": `Software Engineer Generalist - DevOps

Aztec is building a first-of-its-kind Layer 2 with private smart contracts, requiring new cryptographic primitives, a zero-knowledge DSL, and a privacy-friendly execution environment.

**About the Role:**
We're looking for a DevOps Engineering Lead who thrives in a fast-paced environment and is excited by the prospect of growing a team to 10x our development velocity while preserving quality and security.

**Responsibilities:**
- Own internal platforms critical to developing, testing, deploying, and monitoring code
- Design and implement IaC, CI/CD pipelines, and automation to minimize lead time
- Develop and enforce best practices for observability, monitoring, alerting, and incident response
- Architect and implement scalable, secure, cost-efficient cloud infrastructure (GCP/AWS)
- Lead technical design discussions and post-mortem reviews
- Mentor and develop team members

**Requirements:**
- 7+ years of relevant industry experience
- Strong expertise in cloud platforms, bare metal, and distributed systems
- Proven experience building, scaling, and maintaining production infrastructure
- Proficiency with Infrastructure-as-Code (Terraform), container orchestration (Kubernetes), and CI/CD pipelines
- Experience with observability stacks (Prometheus, Grafana)
- Strong background in automation, scripting, and tooling (Bash)
- Excellent ability to diagnose and resolve complex system issues
- Self-starter mindset balancing technical depth, team leadership, and strategic impact
- Located in or able to work within GMT to EST time zones

**Nice to Have:** Experience in Web3 or high-growth startups

**Location:** London, UK / New York City (Remote-friendly)`,

  // === FLASHBOTS ===
  "flashbots-senior-backend-engineer": `Senior Backend Engineer

Flashbots is a research and development organization formed to mitigate the negative externalities and existential risks posed by Maximal Extractable Value (MEV). Our mission is clear: illuminate, democratize and distribute.

**About the Role:**
We're looking for seasoned, self-starter Backend Engineers who thrive in rapidly evolving environments, learn new technologies on the fly, and tackle complex problems with a builder mentality.

**Responsibilities:**
- Contribute actively to development of Flashbots' core products (Block Builder, MEV-Share, SUAVE, and future offerings)
- Create and manage comprehensive technical documentation for public use
- Develop and maintain public API services and developer-friendly tools for the Flashbots ecosystem
- Implement robust tests to ensure quality and stability
- Engage positively with our community, addressing technical issues

**Requirements:**
- 5+ years of experience in production systems, skilled in Rust or Go
- Experience building scalable services, ideally in the Ethereum space
- Ability to contribute effectively in an asynchronous work environment
- Adaptable, accountable, and solution-oriented with focus on high-impact solutions
- T-Shaped skills: depth in specific area with breadth across multiple areas

**Nice to Have:**
- Deep familiarity with Ethereum ecosystem and MEV supply chain
- Experience working across Ethereum stack (Lighthouse, Prysm, Geth, Reth, smart contracts)
- Contributed to open-source projects

**Benefits:**
- Significantly above market rate equity compensation
- Unlimited PTO with high level of freedom and autonomy
- Attractive health coverage for US employees
- $3000 yearly budget for self-development

**Location:** Remote (Worldwide)`,

  "flashbots-senior-devops-engineer": `Senior DevOps Engineer

Flashbots builds products to maximally decentralize public blockchains, redistribute MEV, and empower users. MEV-Boost has been adopted by over 90% of Ethereum validators.

**About the Role:**
We're looking for senior DevOps engineers to maintain Flashbots infrastructure, contribute to open-sourcing our software, and support Suave's future success.

**Responsibilities:**
- Maintain and improve network architecture for clusters of Ethereum nodes
- Support frontend and backend tools for Flashbots data initiatives
- Design, build, and scale testing infrastructure for Flashbots products and services
- Contribute to and maintain observability standards
- Participate in on-call rotation for critical infrastructure
- Create automation and tooling
- Administrate Kubernetes clusters and deployments in IaC
- Contribute to foundational infrastructure in blockchains and rollups
- Collaborate on cutting-edge TEE systems development

**Requirements:**
- 4+ years experience as a problem solver within DevOps/SRE environments
- Modern DevOps practices (CI/CD pipelines, infrastructure as code, code reviews)
- Flexible, accountable, and focused on high-impact solutions
- Comfortable with async contributing, both collaboratively and self-sufficiently
- Deep understanding of engineering principles and best practices
- Production experience with monitoring, alerting, and incident response
- Familiar with blockchain infrastructure and MEV problem space

**Nice to Have:**
- Experience with Clickhouse and Postgres
- Experience with Ethereum and her many layers

**Benefits:**
- Fully remote with flat hierarchy
- Competitive salary + significantly above market rate equity
- Regular team on-sites (Morocco, Amsterdam, Costa Rica)
- Unlimited PTO with yearly self-development budget

**Location:** Remote (Worldwide)`,

  // === ELECTRIC CAPITAL ===
  "electric-capital-content-creator-crypto-data": `Content Creator - Crypto Data

Electric Capital is a top early-stage venture firm investing in crypto and other frontier technologies.

**About the Role:**
We're looking for a passionate data explorer who loves finding stories hidden in blockchain data and sharing them with the world.

**What You'll Do:**
- Explore and publish: Dig through on-chain data, developer activity, and protocol metrics to uncover hidden insights
- Transform discoveries into Twitter threads, blog posts, and data visualizations
- Build dashboard sites to drive the narrative (like developerreport.com, nftpulse.org, stablepulse.org)
- Identify emerging crypto narratives and collaborate to build go-to resources
- Engage with the community and build your personal brand as a data-driven thought leader

**Requirements:**
- 2+ years creating data-driven content or analysis
- Strong SQL skills and comfort with complex datasets
- Python proficiency (Pandas, Jupyter) for analysis and automation
- Excellent storytelling abilities—turning complexity into clear insights
- Self-directed and able to thrive in independent, fast-moving environment

**Nice to Have:**
- Hands-on experience with on-chain data (DeFi, NFTs, staking, infrastructure)
- Build Dune dashboards or use similar blockchain analytics tools
- Already publish crypto analysis online
- Pro at using AI tools (GPT-4, Claude, Cursor)
- Background in content creation, journalism, or technical writing

**Compensation:** $150K - $180K + bonuses + carried interest participation

**Benefits:** Comprehensive health coverage, 401(k) matching, home office budget, lunch/snacks in office

**Location:** San Francisco or New York`,

  "electric-capital-finance-associate": `Finance Associate

Electric Capital is a top early-stage venture firm investing in crypto and other frontier technologies. The Finance team manages all aspects of fund operations while developing new processes for the dynamic crypto environment.

**About the Role:**
You will work directly with Electric's co-founders, controllers, and senior management to deliver fund reporting, audits, and operational processes. You will also participate in building new AI technologies to optimize operations.

**Responsibilities:**
- Fund Reporting: Review quarterly reports, reconcile digital asset transactions against blockchain, review and distribute capital statements, manage fund administrator relationships
- Annual Audit: Review annual financial statements, work with auditors on timely issuance, manage audit requests
- Fund Operations: Work on capital calls, distributions, redemptions, investment funding, expense payment and cash receipts
- Monitor fund finances and investments, tracking within proprietary portfolio database
- Assist with finance inquiries from investors
- Participate in SPV finance processes
- Assist with fund tax compliance and K-1 review

**Requirements:**
- Bachelor's degree in accounting, tax or related field
- 3-5+ years of asset management auditing or accounting experience, at least 2 years in VC/PE
- CPA highly preferred; passing FAR & REG required
- Flexible, collaborative, proactive self-starter
- Strong analytical skills and excellent judgment
- Excellent Excel and Google Sheets skills
- Passion for crypto, tech and/or AI is a big plus
- Based in San Francisco or New York, willing to come to office 2 days/week

**Compensation:** $120K - $160K + bonuses + carried interest

**Location:** San Francisco or New York`,

  "electric-capital-finance-associate-tax": `Finance Associate (Tax Focus)

Electric Capital is a top early-stage venture firm investing in crypto and other frontier technologies.

**About the Role:**
As a Finance Associate with Tax Focus, you will gain broad exposure to nascent technologies while working directly with Electric's co-founders, controllers, and senior management to deliver fund reporting, audits, and tax compliance processes.

**Responsibilities:**
- Fund Reporting: Review quarterly reports, reconcile digital asset transactions, manage fund administrator relationships
- Annual Audit: Review financial statements, work with auditors, manage audit requests
- Fund Operations: Capital calls, distributions, redemptions, investment funding
- Lead tax compliance processes including review of K-1s and tax returns
- Monitor fund finances and investments
- Participate in SPV finance processes including tax matters
- Assist with finance inquiries from investors

**Requirements:**
- Bachelor's degree in accounting, tax, or related field
- 3-5+ years of asset management auditing or accounting experience with tax focus
- CPA highly preferred; passing FAR & REG required
- Strong understanding of partnership taxation and K-1 preparation
- Experience with crypto/digital asset tax considerations preferred
- Flexible, collaborative, proactive self-starter
- Strong analytical skills and excellent judgment
- Based in San Francisco or New York

**Compensation:** $120K - $160K + bonuses + carried interest

**Location:** San Francisco or New York`,

  "electric-capital-investor-relations-associate": `Investor Relations Associate

Electric Capital is a top early-stage venture firm investing in crypto and other frontier technologies.

**About the Role:**
You will work directly with Electric's co-founders, Investor Strategy, Finance, and Operations teams to drive projects that scale the firm's operations, particularly in how we serve our limited partners (LPs).

**Responsibilities:**
- Serve as primary point of contact for LP inquiries with strong client-oriented mindset
- Gather information to respond to LP requests for reports, tax documents, and fund interest transfers
- Manage communications to onboard new LPs and process distributions
- Maintain organized records of LP interactions
- Document existing operational workstreams related to LP services
- Identify inefficiencies and propose solutions for process improvement
- Identify opportunities for automation of repetitive tasks
- Project manage internal improvement projects
- Explore AI tooling and basic scripting to streamline workflows

**Requirements:**
- 2-4 years of experience in financial operations, investment client success, project management, or data analysis
- Bachelor's degree required; Finance, Economics, or Business Administration preferred
- Proficiency in Microsoft Office Suite and Google Workspace
- Excellent verbal and written communication skills
- Strong attention to detail
- Proven ability to manage multiple priorities

**Compensation:** $130K - $170K + bonuses + carried interest

**Location:** San Francisco or New York`,

  // === NASCENT ===
  "nascent-accounting-analyst": `Accounting Analyst

Nascent builds and captures opportunities in open markets and permissionless technologies.

**About the Role:**
As an Accounting Analyst, you'll sit at the center of how the business runs—shaping the systems and standards behind financial data across traditional finance workflows and emerging digital asset structures.

**Key Responsibilities:**
- Own the books across fiat and crypto, running full-cycles from wallet/exchange to ledger to reporting
- Turn messy data into reliable systems by partnering with engineering and operations
- Be the source of financial truth, keeping reconciliations, ledgers, and documentation audit-ready
- Automate what doesn't need to be manual using integrations, smart tools, or lightweight scripting
- Hunt down issues before they become problems and drive improvements
- Support ongoing improvement of Nascent's crypto accounting system

**About You:**
- Hands-on, detail-driven, and unafraid to dive into the weeds
- Use AI and automation to work smarter and push quality higher
- Solve problems at the root, shifting from quick fixes to scalable systems
- Thrive in ambiguity and move fast in scrappy environments
- Own outcomes and deliver without hand-holding

**Requirements:**
- 3-6 years in accounting, audit, or financial operations
- Formal accounting training (CPA track or equivalent)
- High digital fluency with AI-driven workflows and modern analytics tools
- Proven ability to operate in fast-moving, ambiguous environments

**Compensation:** $80K - $130K

**Location:** Remote (within +/- 3 hours of EST)`,

  "nascent-full-stack-talent-partner": `Full Stack Talent Partner

Nascent builds and captures opportunities in open markets and permissionless technologies.

**About the Role:**
As a Full Stack Talent Partner, you'll sit at the intersection of people, performance, and systems. You'll help shape how our team operates using tools, automation, and sharp judgment to build high-impact talent operations that scale.

**Responsibilities:**
- Talent Acquisition: Lead end-to-end recruiting from scoping roles to managing recruiting partners
- Onboarding: Leverage tooling to support high-efficiency onboarding outcomes
- People-Centric Learning & Performance: Collaborate on initiatives that increase engagement and performance
- Strategy Execution: Support team leaders to align people and teams behind goals
- Insights & Impact: Measure effectiveness of people strategies using data analysis
- Continuous Improvement: Leverage AI tools, LLMs, and automation agents to enhance operational efficiency

**About You:**
- People-Focused: Enjoy supporting others and thrive in team environments
- Bias for Action: Take initiative and execute efficiently with high autonomy
- High-Energy & Collaborative: Build strong relationships across teams
- High Digital Proficiency: Comfortable with AI tools and LLMs
- 5-10 years of experience moving across Talent and People Ops

**Nice to Have:**
- Interest in human motivation and performance management
- Exposure to AI tooling, recruiting, or people operations

**Compensation:** $80K - $120K

**Benefits:** Comprehensive health benefits, 16 weeks paid parental leave, home office stipend, retirement matching, unlimited PTO

**Location:** Remote (Pacific Time preferred, +/- 4 hours of EST)`,

  "nascent-junior-accounting-analyst": `Junior Accounting Analyst

Nascent builds and captures opportunities in open markets and permissionless technologies.

**About the Role:**
As a Junior Accounting Analyst, you'll work across a wide mix of financial assets, from traditional finance workflows to emerging digital asset structures, playing a key role in shaping how data is captured, cleaned, and automated.

**Key Responsibilities:**
- Partner with engineering and operations to turn messy data into dependable workflows
- Own the books across fiat and crypto, running full-cycles from wallet/exchange to ledger
- Be the source of financial truth, keeping reconciliations and documentation audit-ready
- Automate what doesn't need to be manual using integrations and smart tools
- Hunt down issues before they become problems
- Support improvement of Nascent's crypto accounting system

**About You:**
- Hands-on, detail-driven, and unafraid to dive into the weeds
- Use AI and automation to work smarter
- Solve problems at the root, shifting to scalable systems
- Thrive in ambiguity and move fast
- Own outcomes and deliver without hand-holding

**Requirements:**
- 2-3 years in accounting, audit, or financial operations
- Formal accounting training (CPA track or equivalent)
- High digital fluency with AI-driven workflows
- Proven ability to operate in fast-moving environments

**Nice to Have:**
- Time spent at a Big 4 firm
- Familiarity with crypto accounting or digital asset workflows
- Background in lean teams or startup environments

**Compensation:** $80K - $130K

**Location:** Remote (within +/- 3 hours of EST)`,

  // === PERPL ===
  "perpl-founding-backend-engineer": `Founding Engineer (Backend)

Perpl is a high-performance, orderbook-based perpetual DEX built on Monad, a next-gen EVM-compatible L1 designed for parallel execution. We are building the first fully decentralized perpetuals exchange around a Central Limit Order Book (CLOB).

**About the Role:**
We're looking for a Principal Backend Engineer (Founding Engineer) who enjoys architecting and implementing the systems that connect users to our DEX.

**Responsibilities:**
- Design complete systems to connect desktop and mobile clients to our decentralized perpetuals exchange
- Architect critical systems that collect external data our blockchain systems depend upon
- Work cross-functionally to deliver performant and reliable end-to-end solutions
- Mentor team members on engineering best practices
- Own end-to-end performance across the stack
- Design and implement custom components and blockchain-specific components (indexers, liquidator bots)

**Requirements:**
- Significant experience architecting secure production backend systems at scale
- Experience with virtualization, notification systems, databases (relational, in-memory, time-series), and data pipeline tools
- Experience with Rust, Go, or other high-performance languages
- Track record of shipping products and writing production-grade code

**Nice to Have:**
- Proficiency in Rust
- Knowledge of EVM, DEXs, Perpetuals, and DeFi primitives
- Experience in high-paced startup environments
- Excellent communication skills

**Location:** London (In-person first with remote flexibility)`,

  "perpl-quant-trader": `Quantitative Trader

Perpl is a high-performance, orderbook-based perpetual DEX built on Monad. We're building infrastructure to support CEX-grade trading experiences in a fully decentralized, transparent environment.

**About the Role:**
We're seeking an Internal Quantitative Trader to design, implement, and operate delta-neutral market-making strategies across Perpl's orderbook and vault system.

**Responsibilities:**
- Design and implement automated market-making strategies that remain delta-neutral
- Actively manage capital allocations and position risk across internal trading vaults
- Monitor and adjust inventory, exposure, and quote behaviour based on market conditions
- Calibrate pricing, spread, and inventory management logic to meet target return/risk parameters
- Analyze performance and iterate on models to improve efficiency and reduce adverse selection
- Collaborate with engineering and product teams on strategy integration
- Maintain robust monitoring and alerting systems
- Produce internal reports on liquidity provision, risk metrics, and trading outcomes

**Requirements:**
- 3+ years in quantitative trading
- Strong Python/Rust skills
- Risk management experience
- Strong analytical skills
- Self-directed and execution-focused
- Aligned with the ethos of decentralized finance

**Compensation:** Competitive salary with performance incentives

**Location:** London`,

  "perpl-staff-backend-engineer": `Staff Backend Engineer

Perpl is building a gas-efficient fully decentralised exchange (DEX) on Monad, the first high-throughput EVM chain with parallel execution.

**About the Role:**
We're looking for a Staff Backend Engineer to develop and maintain systems connecting users to our DEX and transmitting external data to our blockchain systems.

**Responsibilities:**
- Develop and maintain backend systems that collect critical external data
- Build backend systems that connect users to our blockchain systems
- Work with the Principal Backend Engineer on architecture and implementation
- Ensure performance and reliability of backend services

**Requirements:**
- Experience developing secure production backend systems at scale on cloud infrastructure
- Experience with virtualization, notification systems, relational/in-memory/time-series databases, and data pipeline tools
- Experience working with Rust, Go, or other high-performance languages
- Track record of shipping products and writing production-grade code

**Nice to Have:**
- Proficiency in Rust
- Knowledge of EVM, DEXs, Perpetuals, and DeFi primitives
- Past experience in high-paced startup environments
- Excellent communication skills

**Location:** London (In-person first with remote flexibility)`,

  "perpl-staff-infra-engineer": `Staff Infrastructure Engineer

Perpl is a high-performance, orderbook-based perpetual DEX built on Monad, enabling traders and LPs to operate in a fully permissionless, transparent environment with zero slippage and deep liquidity.

**About the Role:**
We're looking for a Staff Infrastructure Engineer to build and maintain the cloud infrastructure powering our decentralized exchange.

**Responsibilities:**
- Design and implement scalable, secure cloud infrastructure
- Build and maintain CI/CD pipelines and deployment automation
- Implement observability, monitoring, and alerting systems
- Manage Kubernetes clusters and container orchestration
- Ensure high availability and reliability of all systems
- Collaborate with backend and smart contract engineers

**Requirements:**
- Significant experience with cloud platforms (AWS, GCP, or Azure)
- Strong expertise in Infrastructure-as-Code (Terraform, Pulumi)
- Experience with Kubernetes and container orchestration
- Proficiency in CI/CD pipeline design and implementation
- Experience with monitoring and observability tools (Prometheus, Grafana, DataDog)
- Strong scripting skills (Bash, Python)

**Nice to Have:**
- Experience with blockchain infrastructure
- Knowledge of DeFi and DEX operations
- Experience in high-frequency trading infrastructure

**Location:** London (In-person first with remote flexibility)`,

  "perpl-videographer": `Videographer / Content Lead

Perpl is a high-performance, orderbook-based perpetual DEX built on Monad. We're building infrastructure to support CEX-grade trading experiences in a fully decentralized environment.

**About the Role:**
We're looking for a Videographer/Content Lead to produce engaging video content for our social channels, starting freelance with potential transition to full-time.

**What You'll Do:**
- Produce one video per week: from raw idea to final cut (editing is the priority)
- Help tell stories through memes, commentary, motion graphics, or IRL footage
- Pitch and collaborate on content ideas aligned with trending topics and internet culture
- Create for TikTok, Twitter/X, YouTube Shorts, IG Reels
- Build the foundation for a repeatable content engine that scales

**You Might Be a Fit If You:**
- Are comfortable building narrative arcs from prompts or tweets
- Know how to make something funny with $0 budget and iPhone clips
- Can edit with style—jump cuts, pacing, text overlays, reaction inserts
- Are fluent in meme culture, online niches, and Gen Z humor
- Think like a creator: understand why people scroll, skip, and share
- Have a good sense of humor and better sense of timing

**Style Inspiration:**
- Dry humor, absurd juxtapositions, layered irony
- Low-fi edits that feel intentional and self-aware
- Internet-native finance/tech satire

**Nice to Have:** Experience in crypto, trading, AI, gaming, or weird internet corners

**Location:** London (Remote flexible)`,
};

async function main() {
  console.log("Starting batch4 job description backfill...\n");

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
