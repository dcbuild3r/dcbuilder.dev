/**
 * Backfill additional job descriptions (non-World companies)
 * Run: bun run scripts/backfill-additional-descriptions.ts
 */

import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // ============= ALCHEMY JOBS =============
  "alchemy-account-executive": `Account Executive

Alchemy is the leading web3 development platform, powering 70% of the top teams in the ecosystem. We're looking for an Account Executive to own the entire sales process.

**Responsibilities:**
- Sales pipeline management and contract negotiation
- Client retention, renewals, and upsells
- Lead generation through multiple communication channels
- Educating prospects about blockchain infrastructure and troubleshooting
- CRM management and sales metrics tracking
- Cross-functional collaboration with product and engineering teams
- Post-sale customer support and satisfaction

**Requirements:**
- 4+ years quota-carrying sales experience selling SaaS/PaaS/IaaS
- Demonstrated success with enterprise technology sales to complex accounts
- Passion for cryptocurrency and blockchain sectors
- Self-starter mentality with autonomous execution ability
- Proficiency with CRM software and sales forecasting
- Strong communication and active listening skills
- In-office presence 3x weekly in San Francisco or New York

**Compensation:** $180,000 - $260,000/year base + uncapped commission + equity + benefits

**Location:** San Francisco or New York`,

  "alchemy-account-executive-enterprise": `Account Executive, Enterprise

Alchemy is recruiting an Enterprise Account Executive to lead strategic partnerships with major financial institutions, fintech innovators, and Web3 companies.

**About the Role:**
Navigate board-level relationships and collaborate daily with Alchemy's C-Suite while orchestrating complex, multi-year deals spanning multiple stakeholders globally.

**Responsibilities:**
- Own and grow a portfolio of high-value enterprise accounts
- Design and execute strategies using MEDDPICC methodology to secure seven- and eight-figure partnerships
- Serve as a trusted advisor for blockchain strategy
- Bring market intelligence back to leadership

**Requirements:**
- 7–10+ years closing complex SaaS/infrastructure deals with $500K+ ACV
- Track record breaking into net-new strategic accounts and expanding them into marquee wins
- Deep experience in financial services, fintech, or payments with credibility in Web3 teams
- Proven success navigating C-level, technical, and operational buyers through consultative cycles
- Comfort operating in fast-moving, category-creating markets

**Benefits:** Medical, dental, vision, gym reimbursement, home office budget, in-office meals, wellbeing perks, learning stipend, HSA/FSA plans, and fertility benefits

**Location:** New York or San Francisco`,

  "alchemy-customer-product-engineer-bucharest": `Customer Product Engineer

Alchemy is seeking a Customer Product Engineer to be the voice of the customer and the heartbeat of our developer community.

**About the Role:**
Blend technical support, product influence, and community engagement. Embedded in Discord, Telegram, and other developer forums.

**Responsibilities:**
- Provide direct technical support to developers building Web3 applications
- Help troubleshoot code, navigate APIs, and resolve RPC issues
- Capture customer insights that inform product development decisions
- Identify product gaps and influence the roadmap through data-driven observations
- Onboard new users and guide them toward activation milestones
- Act as an internal advocate for developer needs across Product and Engineering teams
- Translate user pain points into actionable product improvements

**Requirements:**
- 1+ years in developer relations, customer engineering, or technical support
- Technical background (Computer Science degree, bootcamp, or self-taught with portfolio projects)
- Proficiency in at least one programming language (JavaScript, Python, Solidity)
- Comfortable debugging API requests and blockchain-related development tools
- Strong written and verbal communication skills
- Crypto/Web3 experience or relevant side projects preferred

**Location:** Bucharest`,

  "alchemy-customer-product-engineer-apac": `Customer Product Engineer, APAC

Alchemy is seeking a Customer Product Engineer for the APAC region to support our developer community across Asia-Pacific.

**About the Role:**
Be the voice of the customer and the heartbeat of Alchemy's APAC developer community, providing technical support while influencing product direction.

**Responsibilities:**
- Provide direct technical support to APAC developers building Web3 applications
- Help troubleshoot code, navigate APIs, and resolve RPC issues
- Capture customer insights that inform product development decisions
- Identify product gaps and influence the roadmap
- Onboard new users and guide them toward activation milestones
- Act as an internal advocate for APAC developer needs

**Requirements:**
- 1+ years in developer relations, customer engineering, or technical support
- Technical background (CS degree, bootcamp, or self-taught)
- Proficiency in JavaScript, Python, or Solidity
- Strong written and verbal communication skills
- Crypto/Web3 experience preferred
- APAC timezone availability

**Location:** APAC (Remote)`,

  "alchemy-director-engineering-infra-platform": `Director of Engineering, Infrastructure & Platform

Alchemy is seeking a Director of Engineering to own the vision, strategy, and execution of one of the most sophisticated, high-throughput distributed systems in the blockchain ecosystem.

**Responsibilities:**
- Lead multiple engineering teams across Cloud Infrastructure, Platform, Data Platform, and Internal Tooling
- Define platform and infrastructure strategy emphasizing scalability, reliability, performance, and cost efficiency
- Serve as senior technical leader influencing architecture for large-scale distributed systems
- Partner with Product, Security, Finance, and Executive Leadership on strategic alignment
- Drive execution excellence through process evolution and clear prioritization
- Monitor emerging technologies in Web3, cloud infrastructure, and AI
- Build and mentor high-performing engineering leaders

**Requirements:**
- Bachelor's degree in Computer Science, Engineering, or equivalent experience
- 10+ years software engineering experience with deep distributed systems expertise
- 5+ years engineering leadership managing teams and critical production infrastructure
- Strong hands-on knowledge of large-scale distributed systems and cloud infrastructure
- Experience with Java, Kubernetes, AWS, and multi-region deployments preferred
- Excellent problem-solving, analytical, and decision-making capabilities

**Compensation:** $300,000 - $350,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-engineering-manager-platform": `Engineering Manager, Platform

Alchemy seeks an Engineering Manager for Platform to lead teams building one of the most sophisticated and high-throughput distributed systems in the blockchain world.

**Responsibilities:**
- Lead Platform and Data Engineering teams on backend infrastructure development
- Oversee technical strategies enabling company-wide product delivery
- Stay current with technological advances to maintain competitive advantage
- Enhance team execution, mentor engineers, and refine processes during scaling
- Recruit and develop top-tier engineering talent
- Shape Alchemy's engineering culture through leadership and continuous learning initiatives

**Requirements:**
- Bachelor's degree in Computer Science, Engineering, or equivalent experience
- 7+ years software development experience, preferably in distributed systems
- 2+ years engineering management leading backend infrastructure teams at high-growth startups
- Expertise in large-scale distributed systems engineering and maintenance
- Strong problem-solving, analytical, and decision-making abilities

**Preferred:** Java, Kubernetes, AWS, multi-region and multi-cloud experience; blockchain ecosystem familiarity; passion for AI and crypto.

**Compensation:** $230,000 - $260,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-principal-software-engineer-backend": `Principal Software Engineer, Backend

Alchemy seeks a Principal Software Engineer to architect and maintain highly scalable infrastructure supporting our developer platform, which powers 70% of top web3 teams and 100+ million end users.

**Responsibilities:**
- Define the vision for the backend infrastructure that supports our developer platform and APIs
- Guide the team in executing against that vision
- Design, build and maintain highly scalable and reliable infrastructure, APIs, and services
- Lead system design discussions, stand-up meetings, and code reviews
- Develop and own best practices for backend infrastructure emphasizing high throughput, reliability, and low latency
- Debug production issues across services and multiple stack layers
- Collaborate with engineers, technical leaders, product managers, and designers

**Requirements:**
- 10+ years of relevant industry experience
- BS/BA in Computer Science or equivalent
- Experience designing, building, scaling, and maintaining core backend software components
- API platform experience preferred
- Ability to solve complex design, scaling, latency, or performance problems in high-throughput, low-latency production systems
- Production experience with Java, Golang, or C++
- Cloud Native environments experience, particularly AWS
- Managed Kubernetes layers like AWS EKS preferred

**Location:** Bucharest`,

  "alchemy-product-engineer": `Product Engineer

Alchemy is seeking a Product Engineer to serve as the voice of the customer and the heartbeat of our developer community.

**About the Role:**
Embedded in Discord, Telegram, and other developer forums to provide technical support while influencing product direction.

**Responsibilities:**
- Build and ship code while working directly with customers to diagnose system-level issues across APIs, infrastructure, and on-chain workflows
- Convert user pain points into product improvements by partnering with Product and Engineering teams
- Design better onboarding flows, examples, and integrations
- Represent developer perspectives in internal discussions regarding usability and reliability

**Requirements:**
- 1+ years in developer relations, customer engineering, or technical support
- Technical foundation (CS degree, bootcamp, or self-taught with real projects)
- Proficiency in at least one programming language (JavaScript, Python, Solidity)
- Strong debugging skills for APIs and blockchain tools
- Excellent written and verbal communication abilities
- Web3/crypto experience or relevant side projects preferred

**Compensation:** $120,000 - $180,000/year + equity + benefits

**Location:** San Francisco or New York`,

  "alchemy-product-lead-chain-services": `Product Lead, Chain Services

Alchemy seeks a Product Lead to guide our Chain Services team, which helps blockchain developers create, customize and launch their own blockchains using Rollups.

**Responsibilities:**
- Develop long-term strategy alongside company leadership
- Design and execute go-to-market approaches for Rollups products
- Manage customer relationships with major Web3 and Web2 enterprises
- Shape product roadmaps through collaboration with customers and partners like Optimism and Arbitrum
- Build industry thought leadership for Chain Services
- Expand the team 5-10x over the coming year

**Requirements:**
- Founder experience or track record leading 0→1 high-growth products
- 5+ years collaborating directly with customers (interviews, product-led sales)
- 2+ years in web3/crypto sector
- Deep technical background (product management of developer tools, software engineering experience, or technical degree)
- Strong written and verbal communication abilities
- 3+ years managing people (preferred)

**Compensation:** $135,000 - $350,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-product-lead-node-services": `Product Lead, Node Services

Alchemy seeks a Product Lead to direct our Node Services product vertical, overseeing billions of API requests a day.

**Responsibilities:**
- Establish strategic direction for Alchemy's largest product and engineering team
- Develop roadmaps informed by customer relationships and data analysis
- Collaborate with leadership (CEO, CTO, Head of Engineering) on transformative initiatives
- Manage a growing Product Manager team supporting Node Services
- Contribute to company-wide product strategy
- Implement industry best practices for product excellence

**Requirements:**
- 6+ years product management experience
- 3+ years leading people/teams
- High-growth startup background
- Developer tools or API-scale product experience
- Excellent written and verbal communication
- Customer-focused listening and research skills
- Ability to work with unstructured data analytically

**Preferred:** Blockchain technology passion; founder experience.

**Compensation:** $135,000 - $350,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-product-marketing-manager": `Product Marketing Manager

Alchemy is hiring a Product Marketing Manager focused on Fintech & Financial Services.

**Responsibilities:**
- Own positioning for Alchemy's infrastructure tailored to financial use cases (cross-border payments, stablecoins)
- Lead product launches targeting financial institutions
- Translate blockchain capabilities into compelling value propositions for product leaders and executives
- Conduct customer research to understand fintech needs
- Create educational content like crypto playbooks and case studies
- Enable sales teams with collateral addressing buyer personas and competitive positioning
- Develop go-to-market strategies and drive measurable adoption

**Requirements:**
- 6+ years of product marketing experience with a focus on fintech, payments, financial services, or B2B SaaS
- Excel at translating complex infrastructure into clear business value
- Proven success launching products and driving revenue

**Bonus:** Experience at high-growth startups, blockchain/DeFi backgrounds, developer marketing expertise, or account-based marketing proficiency.

**Compensation:** $150,000 - $200,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-protocol-engineer": `Protocol Engineer

Alchemy seeks a Protocol Engineer to architect and build distributed protocols augmenting our developer platform, emphasizing security, performance, and scalability.

**Responsibilities:**
- Design and develop distributed protocols with focus on security, performance, and scalability
- Write, deploy, and test smart contracts in production environments
- Establish best practices for protocol upgrades and versioning across networks
- Collaborate with engineering, product, and design teams on user-facing applications
- Mentor engineers in Solidity/EVM topics and best practices
- Stay current with Solidity releases, developer tooling, and security exploits

**Requirements:**
- 6+ years relevant industry experience
- 2+ years smart contract development with production deployments of original protocols and security audits
- BS/BA in Computer Science
- Extreme proficiency with Solidity and the EVM
- Experience designing distributed protocols
- Experience building, testing, deploying, and maintaining high-traffic smart contracts

**Preferred:** Experience managing protocols with significant TVL; startup experience; blockchain and Web3 passion.

**Compensation:** $135,000 - $350,000/year + equity + benefits

**Location:** New York or San Francisco`,

  "alchemy-sales-manager": `Sales Manager

Alchemy is seeking a high-impact Commercial Sales Manager to lead, scale, and operationalize our rapidly growing commercial sales team.

**Responsibilities:**
- Manage and mentor Account Executives, fostering accountability and professional growth
- Act as player-coach, maintaining an active sales pipeline while modeling selling excellence
- Lead pipeline reviews, deal strategy sessions, and performance check-ins
- Recruit, onboard, and train new sales representatives
- Oversee full-funnel execution from prospecting through close
- Drive consistent performance in high-velocity commercial motions
- Partner with Product, Marketing, Solutions Engineering, and RevOps

**Requirements:**
- 5–7+ years B2B SaaS/PaaS/IaaS sales experience
- 2+ years managing Account Executives
- Proven track record managing high-velocity teams exceeding quotas
- Strong pipeline management and SFDC proficiency
- Ability to influence cross-functional stakeholders

**Location:** New York or San Francisco`,

  "alchemy-software-engineer-backend-transactions": `Software Engineer (Backend) - Transactions Engine

Alchemy seeks a Senior Backend Engineer to lead core transaction infrastructure development, focusing on systems handling gasless transactions that execute reliably at scale.

**Responsibilities:**
- Set technical direction for core transaction and wallet-adjacent backend systems
- Design and maintain APIs serving external developers and internal teams
- Lead architecture decisions emphasizing scalability, correctness, and operational resilience
- Partner across product, infrastructure, and protocol teams on multi-quarter initiatives
- Raise engineering standards through design reviews and technical mentorship

**Requirements:**
- 7+ years relevant industry experience
- BS/BA in Computer Science
- Senior-level backend engineering with large production systems
- Proficiency in Java, TypeScript, and/or Rust
- Demonstrated track record designing widely-used, durable APIs
- Understanding of smart contract execution (reading ABIs, logs, traces, transaction receipts)
- Leadership experience on complex cross-team technical projects
- Web3 experience preferred

**Compensation:** $200,000 - $220,000/year + equity + benefits

**Location:** New York, Remote, or San Francisco`,

  "alchemy-software-engineer-solutions": `Software Engineer - Solutions

Alchemy seeks a Solutions Engineer to work with strategic customers on designing scalable systems and optimizing blockchain infrastructure performance.

**Responsibilities:**
- Help top-tier teams design, scale, and optimize their use of Alchemy's infrastructure
- Deeply understand customer goals and guide them through onboarding and long-term success
- Write code to help customers unlock the full potential of the stack
- Translate customer needs into product insights and roadmap priorities
- Act as technical point of contact for strategic accounts
- Work across Product, Engineering, and Business Development teams

**Requirements:**
- 5+ years in technical roles (solutions engineering, software engineering, developer relations, or similar)
- Strong foundation in systems design, APIs, and distributed architecture
- Experience working directly with customers in B2B SaaS or infrastructure settings
- Comfortable writing and reading code in Python, TypeScript, or similar languages
- Strong communication skills for translating technical concepts to diverse audiences
- Passion for blockchain and crypto infrastructure

**Compensation:** $150,000 - $225,000/year + equity + benefits

**Location:** New York or San Francisco`,

  // ============= RITUAL JOBS =============
  "ritual-core-protocol-engineer": `Core Protocol Engineer

Ritual seeks a Core Protocol Engineer to extend the EVM for advanced compute capabilities, working on Ethereum execution clients (Geth/Reth).

**Responsibilities:**
- Design and implement extensions to EVM clients (Geth/Reth) for supporting stateful precompiles
- Integrate mechanism design into the execution layer through research collaboration
- Optimize transaction processing for diverse computational workloads
- Address state access conflict solutions
- Contribute to protocol development and EIP implementations
- Design testing frameworks for client modifications

**Requirements:**
- Deep EVM and execution client knowledge
- Strong precompile implementation and optimization experience
- Proficiency in Go, Rust, and Solidity
- Active Ethereum protocol engagement
- Parallel execution pattern expertise
- Consensus and blockchain architecture understanding
- EIP implementation capability
- Production blockchain shipping experience

**Preferred:** Mempool dynamics and MEV-boost knowledge; mechanism design background; proof system expertise; Ethereum client codebase contributions.

**Benefits:** Competitive compensation with bonuses, top-tier healthcare, 401k matching, flexible remote/hybrid arrangements

**Location:** Remote`,

  "ritual-devex-engineer": `Developer Experience Engineer

Ritual seeks a Developer Experience Engineer to build foundational tools enabling developers to work with our AI-blockchain infrastructure.

**Responsibilities:**
- Design frameworks for AI-enabled blockchain development
- Build local development environments for streamlined testing
- Create CLIs and SDKs for complex interactions
- Develop debugging and simulation capabilities
- Produce technical documentation and tutorials
- Run community workshops and hackathons
- Nurture open-source communities around development tools

**Requirements:**
- Strong experience in Rust, TypeScript, or Python
- Open-source contributions
- Deep understanding of EVM architecture and smart contract development
- Modern AI development and MLOps experience
- Container technologies expertise
- Technical communication abilities

**Preferred:** Blockchain tooling contributions (Foundry, Anvil, wagmi, viem); compiler experience; AI infrastructure knowledge; developer community growth track records.

**Benefits:** Competitive compensation with bonuses, top-tier healthcare, 401k matching, flexible work arrangements

**Location:** Remote`,

  "ritual-distributed-systems-engineer": `Distributed Systems Engineer

Ritual seeks a Distributed Systems Engineer to build and scale blockchain infrastructure for AI operations, focusing on heterogeneous compute network development.

**Responsibilities:**
- Design distributed systems components for the heterogeneous network
- Develop P2P networking protocols optimized for AI and blockchain consensus
- Build infrastructure for monitoring and observability
- Architect state management solutions across specialized nodes
- Collaborate with research teams on novel algorithms
- Create testing frameworks for distributed components

**Requirements:**
- Deep expertise in Go and/or Rust for production systems
- Strong P2P systems and networking protocol knowledge
- Proven blockchain node development and operation experience
- High-throughput system optimization skills
- Advanced Linux and command-line proficiency
- Kubernetes and infrastructure orchestration experience
- Grafana and Prometheus monitoring expertise
- Fault-tolerant application design experience

**Nice-to-Have:** AI/ML systems familiarity; cryptography knowledge; open-source distributed systems contributions.

**Benefits:** Competitive compensation, top-tier healthcare, 401k matching, flexible remote/hybrid work

**Location:** Remote`,

  "ritual-frontend-engineer": `Frontend Engineer

Ritual seeks a Frontend Engineer to build interfaces for developers to interact with our AI and blockchain infrastructure.

**Responsibilities:**
- Design transaction monitoring interfaces visualizing infrastructure lifecycle, broker status, and node operations
- Build dashboards for node deployment, monitoring, and management across cloud providers
- Develop web applications enabling users to provision and manage node infrastructure
- Create real-time dashboards for distributed compute resources and container management
- Implement DeFi-style protocol interaction interfaces
- Collaborate with product, design, and backend teams

**Requirements:**
- Proficiency in HTML/CSS, TypeScript, and React
- Experience productionizing UIs for decentralized applications on EVM blockchains
- Strong Web3 wallet integration skills (wagmi, ethers)
- Full-stack capabilities with end-to-end troubleshooting ability
- Dashboard and data visualization experience
- State management and real-time data handling expertise
- Knowledge of cross-chain transactions and blockchain infrastructure

**Nice-to-Have:** Multi-platform development; distributed systems interfaces; AI/ML infrastructure monitoring; container orchestration interfaces.

**Benefits:** Competitive compensation with bonuses, 100% healthcare premium coverage, 401k matching, remote flexibility

**Location:** Remote`,

  "ritual-growth-engineer": `Growth Engineer

Ritual seeks a Growth Engineer to spearhead integration of Ritual's cutting-edge AI infrastructure with partner applications and protocols.

**Responsibilities:**
- Manage full partner integration lifecycle from scoping through maintenance
- Provide technical support and develop reusable integration standards
- Maintain comprehensive API and SDK documentation
- Work across AI/ML, distributed systems, and blockchain technologies
- Evaluate and adopt new tools to improve integration capabilities

**Requirements:**
- Blockchain engineering expertise in production environments
- Familiarity with web3 tools (Ethers, Viem, Foundry)
- Comprehensive understanding of the web3 landscape including DeFi, L1/L2s, and bridges
- Fluency in Python or TypeScript
- Hands-on Solidity and EVM smart contract experience
- Unix proficiency
- Strong written communication skills

**Preferred:** AWS/GCP infrastructure deployment with Terraform; open-source contributions.

**Benefits:** Competitive compensation with bonuses, top-tier healthcare, 401k matching, flexible arrangements

**Location:** Remote`,

  "ritual-ecosystem-engineer": `Ecosystem Engineer

Ritual seeks an Ecosystem Engineer to build proof-of-concepts demonstrating Ritual's capabilities at the intersection of AI and blockchain.

**Responsibilities:**
- Drive ecosystem growth experiments and developer onboarding initiatives
- Track emerging technologies in autonomous agents and AI orchestration
- Build compelling proof-of-concepts using cutting-edge frameworks
- Create reference implementations and sample applications
- Develop technical partnerships through demos and integrations
- Produce educational content and tutorials for developers

**Requirements:**
- Strong TypeScript and/or Python expertise
- Rapid prototyping and validation skills
- Knowledge of autonomous agent frameworks and AI orchestration tools
- Solidity and EVM smart contract development experience
- Proficiency with web3 tools (Ethers, Viem, Foundry)
- Product intuition and shipped product experience

**Nice-to-Have:** Developer relations background; open-source contributions; infrastructure-as-code experience; data analysis expertise.

**Benefits:** Competitive compensation, 100% healthcare premiums, 401k matching, remote flexibility

**Location:** Remote`,

  "ritual-ml-engineer": `Machine Learning Engineer

Ritual seeks a Machine Learning Engineer for applied ML work building blockchain infrastructure for AI.

**Responsibilities:**
- Scale model inference and predictions using state-of-the-art models
- Create end-to-end connections between ML models and user-facing systems like APIs and applications
- Build large-scale data and ML processing systems across full product lifecycles
- Collaborate cross-functionally with engineers, researchers, product managers, and designers

**Requirements:**
- Software engineering experience
- Background building and deploying ML models
- Proficiency in Python and ML frameworks like PyTorch, TensorFlow, and Jax
- Ability to evaluate ML system tradeoffs
- Strong ownership and independent problem-solving skills

**Preferred:** ML system tools (TinyML, Triton, CUDA, ROCm, Exo, MLIR); DataOps, MLOps, and orchestration pipelines; modern ML architecture and inference optimization; privacy and decentralization-focused technology work.

**Benefits:** Competitive compensation with bonuses, top-tier healthcare, 401k matching, flexible arrangements

**Location:** Remote`,

  "ritual-smart-contract-engineer": `Smart Contract Engineer

Ritual seeks an experienced smart contract engineer to develop and maintain open-source smart contract libraries and frameworks.

**Responsibilities:**
- Develop and maintain smart contract frameworks and libraries
- Oversee the complete smart contract release lifecycle, including audit management
- Research novel smart contract functionality beyond EVM capabilities
- Partner across engineering, design, research, and product teams

**Requirements:**
- Strong software engineering fundamentals
- Expert-level Solidity skills plus proficiency in another programming language
- Deep EVM knowledge and understanding of L1/L2/L3 environmental differences
- Familiarity with node architectures (geth, reth, op-stack, orbit)
- Prior smart contract audit experience (either role)
- Excellent written and collaborative communication skills

**Preferred:** Non-EVM execution environment expertise; open-source project contribution or maintenance background.

**Benefits:** Competitive salary, annual bonus, 100% healthcare premium coverage, 401k matching, remote flexibility

**Location:** Remote`,

  // ============= MORPHO JOBS =============
  "morpho-senior-protocol-engineer": `Senior Protocol Engineer

Morpho is a leading DeFi lending protocol with $10+ billion in deposits. We're looking for a Senior Protocol Engineer to contribute to research and development of lending mechanisms.

**About the Role:**
Contribute to research and design ideas for lending mechanisms, liquidations, and oracles. Develop prototypes and products primarily in Solidity.

**Responsibilities:**
- Research and design lending mechanisms, liquidations, and oracles
- Develop prototypes and products in Solidity
- Collaborate cross-functionally with engineering and leadership on architecture decisions
- Stay current with blockchain technology advancements

**Requirements:**
- Master's degree in quantitative fields (Math, Computer Science, Physics, Statistics, Economics)
- 5+ years in software architectural design of complex systems
- 2+ years in blockchain R&D with strong protocol design and implementation track record
- Excellent written and verbal communication skills

**Nice to Have:** Experience writing smart contracts securing significant TVL; deep EVM and Solidity understanding; PhD in quantitative fields; publications in cryptography, security, or blockchain.

**Location:** Paris or Remote (GMT -4 to +2)`,

  "morpho-senior-frontend-engineer": `Senior Frontend Engineer

Morpho is a leading DeFi lending protocol. We're seeking a Senior Frontend Engineer to build world-class DeFi user experiences.

**Responsibilities:**
- Design and ship end-to-end features using React, TypeScript, and Next.js
- Implement secure Web3 interactions with wagmi and viem for wallet connections and on-chain data
- Establish scalable frontend architectures with patterns for state management and component reuse
- Collaborate with Design on accessible, responsive interfaces
- Optimize performance through bundle analysis and Web3 interaction flows
- Maintain code quality via reviews, documentation, and testing
- Mentor teammates on React and Web3 best practices

**Requirements:**
- 4+ years building production React applications
- 2+ years with Next.js and TypeScript
- Web3 tooling exposure (viem, wagmi)
- Track record shipping high-quality web apps in finance
- Demonstrated ability improving performance and reliability

**Location:** Paris or Remote (GMT -5 to +2)`,

  "morpho-staff-fullstack-engineer": `Staff Fullstack Engineer

Morpho is seeking a Staff Fullstack Engineer to design, build, and scale full-stack systems powering our DeFi lending platform.

**Responsibilities:**
- Architect end-to-end delivery across web apps, APIs, and indexers
- Design scalable API and SDK strategies with versioning and documentation
- Build high-performance data pipelines processing on-chain events with sub-second UI responsiveness
- Lead design reviews and mentor 5-10 engineers
- Optimize system performance by identifying bottlenecks and reducing p95 latency
- Partner with product and protocol teams on scope clarification and success metrics
- Own incident readiness with dashboards, alerts, and on-call practices

**Requirements:**
- 8-10+ years building full-stack applications at scale with measurable business impact
- Track record designing systems handling millions of daily requests with high availability
- Leadership of cross-team technical initiatives without formal authority
- Deep TypeScript expertise across client and server environments
- Familiarity with React, Next.js, GraphQL, REST, WebSockets, Node.js, PostgreSQL, Redis, indexers, and monitoring tools

**Location:** Paris or Remote (GMT -5 to +2)`,

  "morpho-staff-senior-backend-engineer": `Staff/Senior Backend Engineer

Morpho seeks a backend engineer to build and maintain reliable, high-performance backend services and APIs powering our DeFi lending platform.

**Responsibilities:**
- Design and operate backend services using TypeScript/Node and GraphQL
- Model data and optimize PostgreSQL schemas for performance and correctness
- Collaborate across frontend, product, and security teams
- Monitor production systems with focus on observability and incident response
- Simplify systems and reduce technical debt
- For senior roles: mentor engineers and own critical backend domains

**Requirements:**
- **Senior (3-5 years):** Backend systems development with GraphQL APIs and PostgreSQL expertise
- **Staff (8-10+ years):** Cross-team design leadership, large-scale project delivery, strong data modeling

**Location:** Paris or Remote (GMT -5 to +2)`,

  // ============= ROCKAWAYX JOBS =============
  "rockawayx-senior-rust-developer": `Senior Rust Developer

RockawayX seeks a Senior Rust Developer to build a greenfield, programmable, low-latency RPC service that accelerates on-chain execution for Web3 applications.

**Responsibilities:**
- Design and maintain performant systems in Rust
- Write tested, documented code with strong CI/CD practices
- Collaborate cross-functionally on blockchain solutions
- Conduct code reviews and implement security best practices
- Develop Web3 applications meeting functional requirements

**Requirements:**
- 3+ years Rust and systems programming experience
- Software development expertise (Git, CI/CD, Agile, code reviews)
- Problem-solving skills with attention to detail
- Proficiency in TypeScript, Go, or similar backend languages
- REST/JSON API experience

**Preferred:** Blockchain platforms and Web3 knowledge; high-performance networking or distributed systems exposure; performance testing experience; open-source Rust or blockchain contributions.

**Location:** Prague (hybrid, 3-4 days onsite)`,

  "rockawayx-blockchain-developer": `Blockchain Developer

RockawayX seeks a Blockchain Developer to build technical systems for a market-neutral fund executing credit and liquidity strategies on-chain.

**Responsibilities:**
- Design and maintain automated strategies for credit, liquidity, and yield generation across CeFi and DeFi
- Build execution systems interfacing with exchanges, on-chain protocols, and yield platforms
- Develop monitoring and visualization tools
- Create secure data pipelines and backend infrastructure
- Set up observability tools (Grafana, PagerDuty, custom dashboards)
- Build real-time security monitoring for wallets and smart contracts
- Work with investment and research teams on strategy deployment

**Requirements:**
- Strong Python proficiency (required); Rust preferred
- Deep DeFi and blockchain infrastructure knowledge
- Database experience (SQL, Postgres)
- Monitoring tools expertise
- Systems design and API integration skills
- Security principles understanding

**Bonus:** Smart contract experience (Solidity, Move, Rust); credit markets or structured finance exposure; cloud infrastructure familiarity (AWS/GCP).

**Location:** Remote`,
};

async function main() {
  console.log("Starting additional job description backfill...\n");

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
