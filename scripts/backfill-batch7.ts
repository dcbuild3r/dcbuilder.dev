import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // Ackee Blockchain
  "ackee-ethereum-solidity-auditor": `Ethereum (Solidity) Auditor

Ackee Blockchain is a leading blockchain security firm specializing in smart contract audits and security assessments. We help secure top blockchain products and teach at the Czech Technical University in Prague.

You will review smart contracts, blockchain infrastructure code, and decentralized applications for security vulnerabilities using a combination of manual code review and analysis with our tool suite.

**Responsibilities:**
- Work directly with leading blockchain industry teams to review their code and help secure their products
- Design and implement solutions to difficult engineering and research problems
- Collaborate with teammates to maintain and continually improve existing blockchain security tools using modern software engineering practices

**Requirements:**
- Passionate about blockchain technology, crypto-economic protocol design, game theory, and decentralized finance
- Basic understanding of common cryptographic vulnerabilities
- Professional understanding of Solidity or Rust development and deployment of smart contracts
- Great written and spoken communication skills
- Care about building high-quality, well-tested code
- Proficient with Git

**Compensation:** $65,000 - $130,000/year (estimated)

**Location:** Remote (GMT+3 to GMT+0) or Hybrid in Prague, CZ`,

  "ackee-solana-rust-auditor": `Solana (Rust) Auditor

Ackee Blockchain is a leading blockchain security firm specializing in smart contract audits and security assessments. We run the School of Solana certification course and contribute to open-source blockchain security.

You will review smart contracts, blockchain infrastructure code, and decentralized applications for security vulnerabilities using a combination of manual code review and analysis with our tool suite.

**Responsibilities:**
- Work directly with leading blockchain industry teams to review their code and help secure their products
- Design and implement solutions to difficult engineering and research problems
- Collaborate with teammates to maintain and continually improve existing blockchain security tools
- Produce open source contributions, visit or speak at conferences

**Requirements:**
- Passionate about blockchain technology, crypto-economic protocol design, game theory, and decentralized finance
- Basic understanding of common cryptographic vulnerabilities; experience as a Pen Tester or White Hat hacker is ideal
- Professional experience in C/C++ (or other) development, with willingness to learn Rust
- Care about building high-quality, well-tested code
- Proficient with Git

**Location:** Remote (GMT+3 to GMT+0) or Hybrid in Prague, CZ`,

  // Agora
  "agora-fullstack-engineer": `Full-Stack Software Engineer

Agora is building intuitive tools for seamless onchain governance, trusted by leading protocols like Optimism, ENS, and Uniswap. Our goal is to build deep collaboration tools that enable the next era of onchain coordination.

You will work on building out the next generation of Agora's governance applications focusing on the product, scaling it, and end user experience.

**Responsibilities:**
- Work closely with head of engineering, design, and product to build and own features end to end
- Work on the front-end with strong opinions on where data should live in the backend
- Give yourself and the team leverage by writing automated tests and good docs
- Work on contracts, architecture, data layer and mobile experience improvements

**Requirements:**
- Developers who have worked on at least three production grade stacks and distributed systems with object oriented languages
- We heavily rely on TypeScript, React & Next.js, and also have data pipelines in Python & SQL
- Understanding of Ethereum's architecture and familiarity with L2 solutions
- Ability to read Solidity code
- Strong computer science fundamentals, particularly in building scalable and maintainable systems
- Track record of delivering high-quality, maintainable code
- Want to start committing code on day one

**Nice to Have:**
- Experience working on open-source projects
- Expertise in designing for crypto applications
- Knowledge of the Governance Ecosystem (e.g., ERC20Votes)
- Experience working with EVM Indexers

**Location:** Remote (EST/PST Preferred)`,

  "agora-smart-contract-engineer": `Smart Contract Engineer

Agora is transforming how communities collaborate by building intuitive tools for seamless onchain governance. Trusted by leading protocols such as Optimism, ENS, and Uniswap, Agora's governance platform is integral to critical protocol upgrades, ecosystem funding, and decentralized stewardship.

**What You'll Do:**
- Write clear, maintainable, and secure smart contract code
- Architect modular and upgradeable smart contract solutions for Agora Governor on EVM and non-EVM chains
- Lead rigorous testing, auditing, and penetration tests to ensure bulletproof contracts
- Partner with leading clients (Optimism, ENS, Uniswap, Scroll) to design governance features
- Stay ahead with emerging tech like MACI private voting, ZK-proofs (Succinct's SP1 zkVM), WorldID integration

**Projects for 2025:**
- Private Voting: Implement advanced privacy solutions like MACI and secure TEE compute
- zkProofs and governance: Integrate cutting-edge zk systems for enhanced scalability and privacy
- Cross-chain governance and execution for multi-chain protocols
- Identity verification systems such as WorldID for secure governance participation
- Advanced staking and participation models (veTokens)
- Modular governance components for next-generation platforms

**Requirements:**
- Strong Solidity expertise and smart contract security mindset
- Experience with EVM and interest in non-EVM chains
- Understanding of governance systems and DeFi primitives

**Location:** Remote (EST/PST Preferred)`,

  // Bagel
  "bagel-founding-gtm-lead": `Founding GTM Lead

Bagel Labs is a distributed machine learning research lab working towards open-source superintelligence. We ignore years of experience and pedigree - if you have high agency, we want to hear from you.

**Role:**
Work directly with the CEO and own go-to-market end to end, land the first partners, loop their feedback into product, iterate to PMF.

**Responsibilities:**
- Map partners, rank by impact and pursue
- Lead high level technical and commercial conversations
- Represent Bagel at ML events
- Track metrics, report learning, adjust strategy

**Requirements (flexible):**
- Record of GTM, BD, or partnerships in an early-stage deep tech startup
- Deep understanding of the AI stack; knowledge of decentralized-AI tooling is a plus
- Existing network of builders, investors, or partners in AI
- Bias to action and data
- Crisp written and verbal communication

**What We Offer:**
- Competitive salary plus founding-team-level equity
- Direct influence on company trajectory and culture

**Location:** San Francisco`,

  "bagel-mts-infra": `Member of Technical Staff (Infra)

Bagel Labs is a distributed machine learning research lab working towards open-source superintelligence. We ignore years of experience and pedigree - if you have high agency and tolerance for ambiguity, we want to hear from you.

**Role Overview:**
You will design, build, and relentlessly optimize the infrastructure that trains and serves large diffusion models. Your job is to make GPUs go faster, make clusters behave, and make training and inference scale across multiple nodes, regions, and hardware types.

This role sits at the intersection of systems engineering, performance engineering, and research enablement. You will touch kernels, networking, orchestration, compilers, and model code when needed.

**Key Responsibilities:**
- Build and operate distributed training stacks for diffusion models (U-Net, DiT, video diffusion, world-model variants) across multi-node GPU clusters
- Implement and tune parallelism strategies for training and inference (data parallel, tensor parallel, pipeline parallel, ZeRO/FSDP-style sharding)
- Profile end-to-end GPU performance and remove bottlenecks (CUDA graphs, kernel fusion, NCCL tuning)
- Own inference serving for diffusion workloads with high throughput and predictable latency
- Design robust orchestration for heterogeneous and preemptible environments
- Build observability that is actually useful: step-time breakdowns, VRAM headroom, NCCL health, cost per sample
- Implement pragmatic quantization and precision strategies (BF16/FP16/TF32/FP8, INT8/INT4)
- Improve developer velocity through reproducible environments and CI for performance regressions

**Who You Might Be:**
You are the person teammates call when GPUs underperform, distributed training deadlocks, or a "simple" deployment turns into debugging. You like the ugly truth in traces and profiler timelines.

**What We Offer:**
- Top of the market compensation
- Ownership of work that sets the direction for decentralized AI
- In-person role at Toronto office
- Deeply technical culture where bold ideas are debated and built

**Location:** Toronto, Canada`,

  // Blockchain Capital
  "blockchain-capital-legal-research-scholar": `Legal Research Scholar

Blockchain Capital is the first dedicated venture capital firm to invest exclusively in the blockchain technology sector. We've backed over 170 founders including Coinbase, OpenSea, Matter Labs, EigenLayer, Kraken, Anchorage, Aave, and Circle.

Our legal team is looking for a legal extern to work cross-functionally across our fund, with a focus on legal and regulatory research topics that impact crypto and blockchain technologies.

**Responsibilities:**
- Conduct deep research and analysis on legal and regulatory matters related to crypto and blockchain industries
- Select a research project based on the legal and regulatory landscape and present to our research team
- Take a qualitative and quantitative approach to research projects/discussions

**What We're Looking For:**
- A general understanding of smart contracts, crypto-economics, and blockchain technologies
- Strong writing and communication skills
- Excellent interpersonal skills, ability to think creatively and have a point of view
- 2L or 3L in law school to work closely with our legal team

**Additional Details:**
- Fully remote externship
- Part-time position over 8-10 weeks

**Location:** Remote`,

  "blockchain-capital-research-scholar-2026": `Research Scholar - 2026

Blockchain Capital is a first-mover venture firm investing in the decentralized space, dedicated to supporting founders in all stages of growth. We've backed over 170 entrepreneurs including Coinbase, OpenSea, Matter Labs, EigenLayer, Worldcoin, Kraken, Anchorage, Aave, and Circle.

Our investment strategy is research-driven. As a Research Scholar, you will work alongside a team that has seen multiple cycles of this rapidly evolving industry, conducting deep research and analysis to inform our investment decisions.

**Responsibilities:**
- Conduct deep research and analysis on industry verticals, technical trends, and more
- Identify and reason emerging trends in the space, and distill appropriate investment themes
- Take a qualitative and technically quantitative approach to research projects
- Present ideas and analysis regularly to the broader investment and research team

**What We're Looking For:**
- A strong understanding of smart contracts, crypto economics and blockchain technologies generally
- Robust analytical skills that allow for identifying trends and assessing data
- Ability to aggregate information from a variety of sources and distill data into informed insights
- Strong writing and communication skills
- Excellent interpersonal skills, ability to think creatively and have a point of view
- Technical background in engineering, computer science, math or data science (preferred but not required)

**Additional Details:**
- Must be able to work in NYC or SF
- Must have right/authorization to work in the US over the summer
- Summer 2026 position, full-time, paid position over 12 weeks
- Rising Seniors, Grad students, MBAs or older

**Location:** New York, NY or San Francisco, CA`,

  // CoinFund
  "coinfund-blockchain-venture-investor": `Blockchain Venture Investor

CoinFund is a cryptonative investment firm that has championed the leaders of the new internet since 2015. Through seed, venture, and liquid strategies, we invest in emergent technologies before they're trends. Today, CoinFund has a portfolio of over 120 companies, protocols, and projects across the blockchain space.

**The Role:**
We seek ultra-talented, highly visible individuals comfortable with non-consensus thinking who will further enhance CoinFund's strong investing reputation, engage communities, present on social media, and pride themselves on their motivation to succeed.

**Responsibilities:**
- Survey entire crypto and blockchain technology ecosystem and pursue the highest-quality investment opportunities
- Achieve round-leading investments in the most important crypto companies across Series A through D stages
- Build an active portfolio of extraordinary investments
- Expand CoinFund's (and your) reputation as one of the highest-quality investors in crypto
- Work closely with CEOs and management teams to provide differentiating insight and deliver resources

**What We're Looking For:**
- Invested in the long-game of crypto
- Mission-driven - those who abandon ego and act in service of our investors and portfolio company founders
- Healthy risk appetite - thrive in ambiguity and embrace both the vicissitudes and promises of this breakthrough industry
- Deep understanding of blockchain technology and web3 ecosystem

**Compensation:** $200,000 - $400,000/year + benefits & fund carry

**Location:** Miami, FL | New York, NY | Boston, MA`,

  // Goldsky
  "goldsky-solutions-engineer": `Solutions Engineer

Goldsky is building the most powerful data platform for Web3. We bridge the gap by making it seamless for developers to power their applications with realtime onchain data. Our infrastructure powers hundreds of projects including Zora, Optimism, POAP, NounsDAO, 0x Labs, Immutable, and Polymarket.

We've raised over $20M from Dragonfly Capital, Felicis Ventures, 0x Labs, Uniswap Labs, Protocol Labs, and angels including Elad Gil and the Plaid founders.

**Our Values:**
- Take ownership: We take pride in doing our best work
- Keep process light: We opt for simple as much as we can
- Output > Input: We shoot for 1 hour of insight over 8 hours of sweat
- Have a good time: This is going to be a long car trip

**What You'll Do:**
- Work with customers to understand their data needs and help them build solutions
- Support onboarding of new customers to the platform
- Help improve and build out our product based on customer feedback
- Build tooling and automation to improve customer experience

**Requirements:**
- Experience with blockchain data and Web3 infrastructure
- Strong technical background with ability to understand complex data systems
- Excellent communication skills
- Problem-solving mindset

**Perks:**
- Work with the sharpest crew you've ever met
- Best health, dental, vision plans - free
- Every other Friday off
- Remote-friendly with fresh hardware and team offsites
- Quarterly offsites to exotic locales

**Location:** Remote`,

  // Inco
  "inco-devops-engineer": `DevOps Engineer

Inco is building the confidentiality layer for blockchains through encryption technologies. We're building the next generation of secure, scalable, and privacy-enhancing solutions to web3 that empower fintech, payments, and blockchain applications to have the same confidentiality capabilities as web2.

**Who You Are:**
We're looking for someone with a genuine engineering mindset - deeply curious about how things work under the hood and passionate about building robust, elegant solutions. You take ownership of your work from conception to production, treating infrastructure as a craft.

**Responsibilities:**
- Design, build, and maintain production-level infrastructure
- Own systems end-to-end: from architecture to monitoring and scaling
- Drive optimization of performance, latency, and reliability
- Ensure security and reliability in a high-stakes environment where correctness matters
- Work closely with cross-functional teams to deliver features on time
- Maintain strong documentation practices

**Requirements:**
- Strong experience with cloud infrastructure and DevOps practices
- Experience with containerization and orchestration (Docker, Kubernetes)
- Understanding of blockchain infrastructure
- Excellent problem-solving skills

**Location:** Hybrid (Bangalore office, 3 days/week)`,

  "inco-senior-backend-engineer-rust": `Senior Backend Engineer (Rust)

Inco is building the confidentiality layer for blockchains through fully homomorphic encryption (FHE) technologies. Our fhEVM makes it possible to write private smart contracts and perform computations on top of encrypted data without requiring its decryption.

**Who You Are:**
We're looking for a senior backend engineer with strong production experience in Rust who thrives on solving complex problems and building performant systems end-to-end. You understand how to optimize backend systems at scale, and you take full ownership of features from architecture and design to deployment and monitoring.

**Responsibilities:**
- Design, build, and maintain production-level backend services in Rust
- Own systems end-to-end: from database schema and APIs to monitoring and scaling
- Drive optimization of performance, latency, and reliability across backend services
- Lead technical design discussions, code reviews, and mentoring of junior engineers
- Collaborate closely with protocol, DevOps, and product teams
- Ensure security and reliability in a high-stakes environment

**Bonus:**
- Design and implement backend services that integrate with blockchain infrastructure (Ethereum, Solana, etc.)
- Contribute to new product features at the intersection of Web3 and privacy-preserving technologies

**Requirements:**
- 3-5+ years of production experience in Rust
- Strong experience with distributed systems
- Understanding of blockchain technologies

**Location:** Hybrid (Bangalore office, 3 days/week)`,

  // Kodiak Finance
  "kodiak-fullstack-engineer": `Full-Stack Engineer

Kodiak is Berachain's Native Liquidity Hub - a foundational building block for liquidity on Berachain. Part of the inaugural class of the Build-A-Bera incubator, our products reimagine how users trade and interact on-chain.

**Product Suite:**
- Decentralized Exchange (Kodiak DEX): Non-custodial, highly capital-efficient trading powered by concentrated and full-range AMMs
- Automated Liquidity Manager (Kodiak Islands): Set-and-forget automated concentrated liquidity strategy vaults
- Integrated Incentive Layer (Sweetened Islands): Tapping into Berachain's PoL mechanism
- No-Code Token Deployer Factory (Panda Factory): Permissionless deployment of new tokens
- Kodiak Validator: Supporting overall security of Berachain

**Role Overview:**
As an early stage core contributor, you will work with the engineering team to maintain and automate our existing product stack in production, as well as collaborating with the product team to rapidly iterate and drive new product development.

**Responsibilities:**
- Develop and maintain web applications (dapps) for the DEX and related products
- Ensure the security and reliability of the platform in mainnet production
- Implement and test Solidity smart contracts
- Collaborate with the product team to define and implement new features
- Optimize code for performance and maintainability

**Requirements:**
- 1+ years of engineering experience in DeFi (specifically, Ethereum/EVM)
- Proficiency in HTML, CSS, JavaScript, TypeScript, and modern JavaScript frameworks (React)
- Strong experience with ethers.js and web3 front-end tools (Wagmi, Viem, Rainbowkit)
- Experience with smart-contract development tools such as Foundry and Hardhat

**Preferred:**
- Solidity/EVM smart contract development experience
- Familiarity with back-end tools (subgraph, AWS, etc)
- DeFi power-user / contributor to open-source projects

**Location:** Remote`,

  // Kuru
  "kuru-quant-engineer": `Quant Engineer

Kuru Labs is building next-generation trading infrastructure for crypto markets.

**What You'll Do:**
- Develop and implement quantitative trading strategies
- Build and optimize trading systems and infrastructure
- Analyze market data and identify trading opportunities
- Work closely with the team on research and development

**Requirements:**
- Strong quantitative and analytical skills
- Experience with trading systems or quantitative finance
- Proficiency in programming languages (Python, Rust, or similar)
- Understanding of crypto markets and DeFi

**Location:** Remote`,

  // Let's Go DevOps
  "letsgo-senior-devops-engineer": `Senior DevOps Engineer

Let's Go DevOps provides infrastructure and DevOps services for blockchain and web3 projects.

**What You'll Do:**
- Design, build, and maintain cloud infrastructure for blockchain projects
- Implement CI/CD pipelines and automation
- Manage Kubernetes clusters and containerized workloads
- Ensure security and reliability of production systems
- Work with development teams to optimize deployment processes

**Requirements:**
- Strong experience with cloud platforms (AWS, GCP)
- Kubernetes expertise and container orchestration
- Experience with Infrastructure as Code (Terraform, Pulumi)
- Understanding of blockchain infrastructure and node operations
- Strong Linux administration skills
- Experience with monitoring and observability tools (Prometheus, Grafana)

**Location:** Remote`,

  // MegaETH
  "megaeth-assistant-general-counsel": `Assistant General Counsel / Senior Counsel

MegaLabs is building MegaETH, the first real-time blockchain with sub-millisecond block times and 100,000+ TPS. Our technical innovations include a new state trie, write-optimized storage backend, bytecode compilation, parallel execution, and streaming EVM.

**The Role:**
We are seeking an Assistant General Counsel to join our legal team. The successful candidate will report to the General Counsel and work on novel legal issues while having autonomy, career growth, and leadership exposure.

**What You'll Work On:**
- Core focus on transactional and product matters
- Novel legal issues in the blockchain and crypto space
- Regulatory compliance and risk management
- Contract negotiation and corporate governance
- Working with engineering and product teams on legal aspects of protocol development

**What We're Looking For:**
- Passionate about crypto and blockchain technology
- Intellectually curious and hard working
- Problem solver with strong analytical skills
- JD from accredited law school
- Experience in corporate law, technology transactions, or fintech
- Understanding of blockchain technology and crypto regulatory landscape

**Location:** Remote`,

  // Nethermind
  "nethermind-founding-protocol-engineer": `Founding Protocol Engineer (Web3 + AI)

ChaosChain (a Nethermind project) is the accountability protocol for the on-chain AI economy. Today, AI agents are black boxes - it's impossible to cryptographically verify their actions. We're building the foundational trust layer for the entire autonomous economy.

**The Role:**
As our first engineering hire, you will be the technical cornerstone of ChaosChain. You will take our proven architecture and prototypes and lead the charge in building, testing, and deploying a production-ready, mainnet protocol.

**Responsibilities:**
- Core Protocol Development: Design, build, test, and deploy Solidity smart contracts (ChaosCore factory, StudioProxy architecture, RewardsDistributor engine)
- Integrate Cutting-Edge Tech: Implement off-chain components via XMTP and permanent storage on IPFS/Arweave
- Ensure Security & Reliability: Write comprehensive tests, participate in security audits, build robust monitoring
- SDK & Tooling: Evolve our Python and TypeScript SDKs into a world-class developer toolkit
- Partner Engineering: Collaborate with launch partners like Gaia and EigenCloud

**Must-Haves:**
- Deep Solidity & EVM Expertise with Foundry or Hardhat
- Full-Stack Web3 Fluency: Expert in TypeScript/Node.js, Ethers.js/Viem
- Protocol-Level Thinker: Cross-chain communication, transaction lifecycle
- A Builder's Mindset: Portfolio that shows you love to build
- Technical Leadership & Ownership
- Velocity with Precision: Ship fast but never compromise on security/testing

**Location:** Remote (Worldwide)`,

  // Ooga Booga
  "ooga-booga-lead-defi-developer": `Lead DeFi Developer

Ooga Booga is Berachain's native liquidity aggregator, aggregating 12+ liquidity sources to always find you the best price.

**Responsibilities:**
- Lead the end-to-end development of DeFi solutions
- Design and implement robust backend infrastructure for dApps
- Architect and develop smart contracts on EVM chains
- Collaborate with cross-functional teams to define requirements and prioritize features
- Ensure security, scalability, and efficiency of DeFi solutions
- Stay abreast of the latest advancements in web3, DeFi, and backend frameworks
- Write high-quality, thoroughly tested code

**Requirements:**
- 5+ years of professional software development experience, with 2+ years in blockchain (ideally in leadership role)
- Extensive expertise in backend development (Node.js, Go, or Rust)
- Strong grasp of blockchain, smart contracts, and DeFi protocols
- Proficiency in Solidity and EVM smart contract development
- Proven track record building and deploying DeFi protocols
- Experience leading and motivating development teams
- Excellent communication and collaboration skills

**Preferred Qualifications:**
- Contributions to open-source blockchain projects
- Experience with automated testing and CI/CD pipelines
- Ability to design and build SDKs
- Familiarity with Google Cloud Platform
- Experience addressing MEV concerns
- Proficiency in microservices architecture and containerization (Docker, Kubernetes)
- Understanding of latest EIPs relevant to DeFi

**Location:** Remote`,

  // RareBetSports
  "rarebetsports-director-engineering": `Director of Engineering

RareBetSports is a web3 ecosystem designed to capture the thrill of sports and crypto. Built for the next generation of fans and communities of the future, featuring RareLink - a daily fantasy sports product where users can 100X their crypto.

**About the Role:**
Lead the engineering team building the future of daily fantasy sports on blockchain, launching on Monad.

**What You'll Do:**
- Lead and grow the engineering team
- Architect and oversee development of smart contracts and backend systems
- Drive technical strategy and roadmap
- Build trustless execution with verified results and instant payouts
- Work with the RBS Oracle powering 10,000+ data points

**What We're Looking For:**
- Strong engineering leadership experience
- Deep understanding of blockchain technology and smart contracts
- Experience building production DeFi or gaming applications
- Ability to scale teams and systems
- Passion for sports and crypto

**Tech Stack:**
- EVM smart contracts
- Multi-token support (Monad, Ethereum, USDC)
- Real-time oracle data

**Location:** Remote`,

  // Reilabs
  "reilabs-compiler-engineer": `Compiler Engineer

Reilabs is a research & development agency focused on zero-knowledge cryptography and its applications. We're hiring a Compiler Engineer with strong foundations in modern computer architecture, compiler design, and type systems.

**Responsibilities:**
- Design, develop, and maintain compilers and tooling for zero-knowledge systems
- Contribute high quality open source code
- Meet with stakeholders to decide on the right architecture for problems at hand
- Optimize and improve performance and reliability
- Independently drive projects
- Collaborate with a fully distributed team

**Requirements:**
- At least 3 years of professional experience in software development
- Some experience and interest in Rust programming language
- Excellent problem-solving and analytical skills

**Our Offer:**
- $40-$60 per hour (depends on experience) on a B2B contract
- Fully remote position within GMT-8 to GMT+2 timezones (Americas, Europe, Africa)
- Complete autonomy in your time management
- Part-time engagements possible (at least 30 hours per week)

**Location:** Remote (GMT-8 to GMT+2)`,

  "reilabs-rust-engineer": `Rust Engineer

Reilabs is a research & development agency focused on zero-knowledge cryptography and its applications. We're hiring a Senior Rust Engineer with experience working with blockchain, compilers, virtualization, or highly-available infrastructure.

**Responsibilities:**
- Contribute high quality open source code
- Design, develop, and maintain app backends, compilers or cryptography protocols
- Meet with stakeholders to decide on the right architecture for problems at hand
- Optimize and improve performance and reliability
- Independently drive projects
- Collaborate with a fully distributed team

**Requirements:**
- At least 3 years of professional experience in software development
- Experience and interest in Rust programming language
- Experience in developing distributed web services or compilers/VMs
- Interest in cryptography and the blockchain ecosystem
- Excellent problem-solving and analytical skills

**Our Offer:**
- $40-$70 per hour (depends on experience) on a B2B contract
- Fully remote position within GMT-8 to GMT+2 timezones (Americas, Europe, Africa)
- Complete autonomy in your time management
- Part-time engagements possible (at least 30 hours per week)

**Location:** Remote (GMT-8 to GMT+2)`,

  // Rhinestone
  "rhinestone-wildcard": `Wildcard (Open Application)

Rhinestone is building the infrastructure for modular smart accounts. We're the leading provider of ERC-7579 compliant modules that extend the functionality of smart accounts, enabling features like session keys, resource locks, and cross-chain intents.

**About Us:**
We're at the forefront of account abstraction (ERC-4337) and modular smart account development. Our technology powers smart accounts with modules for validators, executors, hooks, and fallbacks that can be added and removed without redeploying the account.

**What We're Building:**
- Rhinestone Intents: Cross-chain execution with resource locks
- Smart Wallet SDK: Tools for developers to build with modular accounts
- ModuleKit: Framework for building and testing smart account modules
- Module Registry: Decentralized registry for verified modules

**What We're Looking For:**
We're always interested in hearing from talented individuals who are passionate about:
- Smart contract development (Solidity)
- Account abstraction (ERC-4337, ERC-7579)
- TypeScript/JavaScript development
- Developer tooling and SDKs
- Security and auditing
- Product and design

**If you're excited about modular smart accounts and don't see a specific role that fits, we'd love to hear from you.**

**Location:** Remote`,

  // Sorella
  "sorella-senior-protocol-engineer": `Senior Protocol Engineer

Sorella Labs believes MEV is not an inevitability, but a consequence of inadequately designed decentralized applications. Our mission is to stop value leakage at its source by creating more efficient and fair protocols.

**Our Core Values:**
- Performance over pedigree: We value contributions based on impact, not background
- Crypto native: Dedicated pioneers with deep-rooted knowledge of the ecosystem
- Research-driven: Rigorous research and data analytics fostering transparency
- Perpetual learners: Prioritizing curiosity and agility to navigate emerging challenges

**What You'll Do:**
- Design and implement protocol-level solutions to address MEV
- Build efficient and fair DeFi protocols
- Conduct research on market microstructure and protocol design
- Work with a small, highly technical team on cutting-edge problems

**What We're Looking For:**
- Deep understanding of Ethereum, MEV, and DeFi
- Strong protocol engineering and smart contract development skills
- Research mindset with ability to translate ideas into production code
- Experience with Rust, Solidity, or similar languages

**Location:** New York (Remote considered)`,

  "sorella-wildcard": `Wildcard (Open Application)

Sorella Labs is building sustainable on-chain markets by stopping value leakage at its source. We believe MEV is not an inevitability, but a consequence of inadequately designed decentralized applications.

**Our Core Values:**
- Performance over pedigree: We value contributions based on impact, not background
- Crypto native: Dedicated pioneers with deep-rooted knowledge expanding DeFi's frontiers while staying true to its ethos
- Research-driven: Rigorous research and data analytics fostering transparency and empowering informed decision-making
- Perpetual learners: Prioritizing curiosity and agility to navigate and tackle emerging challenges

**What We're Looking For:**
If you're passionate about creating fair markets for all DeFi users and don't see a specific role listed, we'd love to hear from you. We're interested in:
- Protocol engineers
- Researchers
- Smart contract developers
- Data analysts
- Anyone with deep MEV and DeFi expertise

**Location:** New York (Remote considered)`,

  // Variant
  "variant-investment-partner-liquid-venture": `Investment Partner - Liquid Venture

Variant is a seed-stage crypto fund. Since 2020, we've helped projects like Uniswap, Phantom, Morpho, and World become category-defining companies. We're known for being hands-on - founders describe us as their "first call" and "day to day" partners who "care deeply."

In addition to our early-stage venture practice, we run a concentrated strategy investing in liquid, publicly traded digital assets.

**The Role:**
We're hiring an Investment Partner to support Variant's liquid investment strategy. This role involves fundamental, bottoms-up investment analysis with top-down portfolio management.

**Responsibilities:**
- Thesis development & research: Develop and refine frameworks for identifying liquid investment opportunities. Go deep into market structures, tokenomics, catalysts, and regulatory dynamics
- Collaboration & integration: Partner with the investment team to ensure venture and liquid strategies reinforce each other
- Portfolio monitoring: Actively track and monitor public tokens, including buy and sell plans
- Portfolio support: Work with founders to strategize on network launches, tokenomics, and market maker support

**Ideal Attributes:**
- Digital asset investment expertise: 3+ years in trading, research, or portfolio management, ideally in digital assets, hedge funds, or prop trading firms
- Track record: Demonstrated investment track record in liquid crypto markets
- Crypto-native: Deep understanding of onchain ecosystems, tokenomics, DeFi primitives, and governance
- Analytical rigor: Exceptional ability to synthesize data, build frameworks, and articulate defensible theses
- Deeply passionate about what's going on onchain

**Compensation:** $200,000 - $300,000/year base salary + benefits & fund carry

**Location:** New York, NY (In-person, SoHo office)`,
};

async function main() {
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
