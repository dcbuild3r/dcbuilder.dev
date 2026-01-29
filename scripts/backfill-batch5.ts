import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

const jobDescriptions: Record<string, string> = {
  // === MERGE LABS ===
  "merge-automation-engineer": `Automation Engineer

Merge Labs is a frontier research lab with the mission of bridging biological and artificial intelligence to maximize human ability, agency and experience. We're developing fundamentally new approaches to brain-computer interfaces.

**About the Role:**
As an Automation Engineer, you will build automation pipelines to enable key research programs to move as quickly as possible. You will collaborate closely with program leads, project scientists, data scientists, and engineers to co-design, implement, and scale research pipelines.

**Responsibilities:**
- Serve as an integral member of research project teams, contributing to project design, execution, and analysis
- Conceive, design, and validate creative automation strategies to improve experimental throughput
- Collaborate with electrical, mechanical, and software engineers to build custom setups
- Collaborate with data science/ML engineers to integrate metadata tracking, computational design, and analysis
- Own the quality, reliability, and integrity of data produced by automated pipelines
- Scope, acquire, build, program, and validate instrumentation and software
- Apply biological context and experimental understanding to guide automation strategy

**Requirements:**
- Experience with lab automation systems (robotic arms, liquid handlers, plate readers)
- Proficiency in programming languages like Python, C++, or similar
- Strong analytical and problem-solving skills
- Effective communication and teamwork abilities
- Bachelor's degree in Engineering or related field

**Compensation:** $165,000 - $215,000/year

**Location:** San Francisco Bay Area`,

  "merge-computational-neuroscientist": `Computational Neuroscientist

Merge Labs is a frontier research lab building the world's first scalable benchmark for brain-AI communication, bridging biological and artificial intelligence.

**About the Role:**
You will help drive the scientific and technical roadmap for our first-generation human data program—setting data requirements, architecting analysis infrastructure, and developing metrics that quantify and push the boundaries of how much information we can read from the human brain.

**Responsibilities:**
- Design and analyze experiments: Run human studies that empirically measure and expand read bandwidth using functional ultrasound imaging
- Develop signal-processing and ML methods: Improve SNR, stability, and interpretability of neural signals
- Architect data infrastructure: Design schemas, pipelines, and feature stores for multi-participant, multi-session datasets
- Establish benchmarks and evaluation suites: Create standardized datasets and scoring metrics
- Collaborate cross-functionally: Work with hardware, clinical, and ML teams
- Publish and communicate: Write internal technical reports and external papers

**Requirements:**
- PhD in Computational Neuroscience, Machine Learning, or related field
- Strong background in neural signal processing and ML methods
- Experience with experimental design and human studies
- Proficiency in Python and data pipeline tools
- Excellent communication skills

**Compensation:** $270,000 - $315,000/year

**Location:** San Francisco Bay Area`,

  "merge-electrical-engineer": `Electrical Engineer

Merge Labs is building the most advanced interface to the brain, capable of interacting with neurons at unprecedented scale and bandwidth.

**About the Role:**
We are seeking a Staff Electrical Engineer to own the architecture, design, and validation of our core electronics systems and R&D infrastructure.

**Responsibilities:**
- Architect, design, simulate, and verify complex electronic systems
- Own the design and layout of critical PCBAs (mixed-signal integrity, power architecture, thermal solutions)
- Develop and deploy automated test infrastructure (ATE), including test firmware (C) and system scripting (Python)
- Own technical relationships with design vendors and PCBA assembly/test houses
- Collaborate with software, mechanical, and clinical teams for system-level integration
- Mentor engineers and establish best practices

**Requirements:**
- Deep expertise in complex electronic systems (mixed-signal, power, FPGA/ASIC integration)
- Strong software capabilities (Python/C) for test infrastructure
- Experience with full lifecycle from architecture to manufacturing transfer
- Rigorous, analytical approach to problem-solving

**Compensation:** $260,000 - $305,000/year

**Location:** San Francisco Bay Area`,

  "merge-head-of-vivarium": `Head of Vivarium

Merge Labs is developing fundamentally new approaches to brain-computer interfaces that interact with the brain at high bandwidth.

**About the Role:**
Lead and manage vivarium operations to support cutting-edge neuroscience research at the intersection of biology and AI.

**Responsibilities:**
- Oversee all vivarium operations including animal husbandry, health monitoring, and regulatory compliance
- Develop and implement animal care protocols aligned with research needs
- Manage vivarium staff and coordinate with research teams
- Ensure compliance with IACUC regulations and institutional policies
- Optimize breeding programs and colony management
- Collaborate with researchers on experimental design and animal models

**Requirements:**
- Advanced degree in veterinary medicine or related field
- 5+ years experience managing research vivarium operations
- Strong knowledge of AAALAC and IACUC regulations
- Experience with neuroscience research animal models preferred
- Leadership and team management experience

**Location:** San Francisco Bay Area`,

  "merge-mechanical-engineer": `Mechanical Engineer

Merge Labs is assembling a team of exceptional builders across electrical, mechanical, and materials science engineering to build technology that scales.

**About the Role:**
Design and develop mechanical systems for next-generation brain-computer interface devices.

**Responsibilities:**
- Design and prototype mechanical components for BCI devices
- Develop manufacturing processes and documentation
- Collaborate with electrical and bioengineering teams on system integration
- Conduct FEA and other simulations for design validation
- Manage relationships with manufacturing vendors
- Ensure designs meet biocompatibility and regulatory requirements

**Requirements:**
- BS/MS in Mechanical Engineering or related field
- Experience with medical device design preferred
- Proficiency in CAD software (SolidWorks, etc.)
- Strong understanding of materials and manufacturing processes
- Experience with rapid prototyping and iterative design

**Location:** San Francisco Bay Area`,

  "merge-ml-research-scientist-bayesian": `ML Research Scientist - Bayesian Optimization

Merge Labs is tackling some of the most audacious problems in molecular engineering, synthetic biology, and neuroscience.

**About the Role:**
Develop and apply Bayesian optimization methods to accelerate molecular design and experimental optimization.

**Responsibilities:**
- Design and implement Bayesian optimization algorithms for molecular engineering
- Develop surrogate models for complex biological systems
- Collaborate with experimental teams to design adaptive experiments
- Build scalable optimization pipelines
- Publish research findings in top venues

**Requirements:**
- PhD in Machine Learning, Statistics, or related field
- Strong background in Bayesian methods and Gaussian processes
- Experience with optimization in high-dimensional spaces
- Proficiency in Python and ML frameworks
- Publication record in relevant venues

**Location:** San Francisco Bay Area`,

  "merge-ml-research-scientist-denovo": `ML Research Scientist - De Novo Design

Merge Labs is developing fundamentally new approaches at the intersection of molecular engineering and AI.

**About the Role:**
Develop machine learning methods for de novo molecular and protein design.

**Responsibilities:**
- Design and implement generative models for molecular design
- Develop methods for protein engineering and optimization
- Collaborate with wet lab teams to validate computational predictions
- Build and maintain ML pipelines for molecular design
- Stay current with latest research in generative AI for biology

**Requirements:**
- PhD in Machine Learning, Computational Biology, or related field
- Experience with generative models (VAEs, GANs, diffusion models, etc.)
- Strong background in molecular representations and featurization
- Proficiency in Python, PyTorch/JAX
- Publication record in ML or computational biology

**Location:** San Francisco Bay Area`,

  "merge-mle-mlops-fullstack": `MLE/MLOps/Full-stack DL Engineer

Merge Labs is building the infrastructure to support cutting-edge research at the intersection of biology and AI.

**About the Role:**
Build and maintain ML infrastructure and full-stack systems for deep learning research and deployment.

**Responsibilities:**
- Design and implement ML training and inference pipelines
- Build and maintain MLOps infrastructure (experiment tracking, model registry, deployment)
- Develop full-stack applications for internal tools and data visualization
- Optimize deep learning workflows for performance and scale
- Collaborate with research scientists to productionize models

**Requirements:**
- Strong experience with ML frameworks (PyTorch, TensorFlow)
- Experience with MLOps tools (MLflow, Weights & Biases, etc.)
- Full-stack development skills (React, Python/FastAPI)
- Experience with cloud platforms (AWS, GCP)
- Understanding of distributed training and inference

**Location:** San Francisco Bay Area`,

  "merge-optical-systems-engineer": `Optical Systems Engineer

Merge Labs is building advanced imaging systems for brain-computer interfaces.

**About the Role:**
Design and develop optical systems for neural imaging at unprecedented scale.

**Responsibilities:**
- Design optical systems for functional ultrasound and other imaging modalities
- Develop optical prototypes and test fixtures
- Collaborate with electrical and mechanical engineers on system integration
- Optimize optical performance through simulation and testing
- Support manufacturing transition of optical subsystems

**Requirements:**
- MS/PhD in Optical Engineering, Physics, or related field
- Experience with optical system design and simulation
- Proficiency with optical design software (Zemax, Code V)
- Understanding of imaging system fundamentals
- Experience with medical imaging preferred

**Location:** San Francisco Bay Area`,

  "merge-research-associate": `Research Associate

Merge Labs is building capabilities across molecular assembly, protein expression, mammalian cell culture, advanced microscopy, and sequencing.

**About the Role:**
Support research programs across multiple scientific disciplines.

**Responsibilities:**
- Perform laboratory experiments according to established protocols
- Maintain detailed laboratory records and documentation
- Support method development and optimization
- Operate and maintain laboratory equipment
- Collaborate with scientists and engineers across teams

**Requirements:**
- BS/MS in Biology, Biochemistry, or related field
- 1-3 years laboratory experience
- Strong attention to detail and organizational skills
- Experience with cell culture, molecular biology, or biochemistry
- Ability to work independently and in teams

**Location:** San Francisco Bay Area`,

  "merge-research-platform-scientist": `Research Platform Scientist

Merge Labs Research Platform Team builds experimental capabilities needed to solve audacious problems with high speed and rigor.

**About the Role:**
Build and optimize research platforms that accelerate scientific discovery.

**Responsibilities:**
- Develop and optimize experimental workflows and protocols
- Build and validate new assay platforms
- Collaborate with program teams to establish research capabilities
- Integrate platforms with data science and ML pipelines
- Document methods and train team members

**Requirements:**
- PhD in relevant scientific field
- Strong experimental and method development skills
- Experience with high-throughput experimental systems
- Programming skills for data analysis and automation
- Excellent collaboration and communication skills

**Location:** San Francisco Bay Area`,

  "merge-scientist-biochemistry": `Scientist - Biochemistry

Merge Labs is solving problems in molecular engineering and synthetic biology to enable next-generation brain-computer interfaces.

**About the Role:**
Lead biochemistry research to support molecular engineering and protein development programs.

**Responsibilities:**
- Design and execute biochemistry experiments
- Develop and optimize protein purification and characterization methods
- Support molecular engineering and protein design efforts
- Analyze data and communicate findings to cross-functional teams
- Mentor junior team members

**Requirements:**
- PhD in Biochemistry, Chemical Biology, or related field
- Strong expertise in protein biochemistry and enzymology
- Experience with protein expression and purification
- Proficiency with analytical techniques (HPLC, mass spec, etc.)

**Location:** San Francisco Bay Area`,

  "merge-scientist-cell-biology": `Scientist - Cell Biology

Merge Labs is building new approaches to brain-computer interfaces using cutting-edge cell biology.

**About the Role:**
Lead cell biology research to support our neuroscience and bioengineering programs.

**Responsibilities:**
- Design and execute cell biology experiments
- Develop and optimize cell culture and assay methods
- Support iPSC and primary cell culture programs
- Analyze data and communicate findings
- Collaborate with engineering and computational teams

**Requirements:**
- PhD in Cell Biology, Neuroscience, or related field
- Strong expertise in mammalian cell culture
- Experience with primary neurons or iPSC-derived cells preferred
- Proficiency with microscopy and flow cytometry

**Location:** San Francisco Bay Area`,

  "merge-scientist-gene-delivery": `Scientist - Gene Delivery

Merge Labs is developing novel gene delivery approaches for brain-computer interface applications.

**About the Role:**
Lead research on gene delivery methods for neural applications.

**Responsibilities:**
- Design and test gene delivery vectors (AAV, lentivirus, non-viral)
- Optimize delivery methods for neural tissue
- Characterize expression and biodistribution
- Collaborate with neuroscience and engineering teams
- Stay current with gene therapy field developments

**Requirements:**
- PhD in Gene Therapy, Virology, or related field
- Strong expertise in viral vector production and characterization
- Experience with in vivo gene delivery
- Understanding of regulatory considerations

**Location:** San Francisco Bay Area`,

  "merge-scientist-immunology": `Scientist - Immunology

Merge Labs is addressing immunological challenges in brain-computer interface development.

**About the Role:**
Lead immunology research to ensure safety and biocompatibility of our neural interfaces.

**Responsibilities:**
- Design and execute immunology studies
- Characterize immune responses to implanted materials
- Develop strategies to minimize immunogenicity
- Collaborate with materials science and neuroscience teams
- Support regulatory submissions with immunology data

**Requirements:**
- PhD in Immunology or related field
- Experience with implant immunology or biomaterials
- Strong background in immune assays and analysis
- Understanding of neuroimmunology preferred

**Location:** San Francisco Bay Area`,

  "merge-scientist-neurobiology": `Scientist - Neurobiology

Merge Labs is building the most advanced interface to the brain at the intersection of neuroscience and AI.

**About the Role:**
Lead neurobiology research to understand and interface with neural circuits.

**Responsibilities:**
- Design and execute neuroscience experiments
- Develop methods for neural recording and stimulation
- Analyze neural data using computational methods
- Collaborate with engineering and ML teams
- Contribute to scientific publications

**Requirements:**
- PhD in Neuroscience, Neurobiology, or related field
- Experience with electrophysiology or neural imaging
- Strong data analysis and programming skills
- Familiarity with brain-computer interfaces preferred

**Location:** San Francisco Bay Area`,

  "merge-scientist-protein-engineering": `Scientist - Protein Engineering

Merge Labs is engineering proteins for next-generation brain-computer interfaces.

**About the Role:**
Lead protein engineering efforts to develop novel molecular tools.

**Responsibilities:**
- Design and engineer proteins using computational and experimental methods
- Develop high-throughput screening approaches
- Characterize engineered proteins biochemically and functionally
- Collaborate with ML teams on protein design
- Mentor junior scientists

**Requirements:**
- PhD in Protein Engineering, Biochemistry, or related field
- Strong expertise in protein design and directed evolution
- Experience with high-throughput protein expression
- Familiarity with computational protein design tools

**Location:** San Francisco Bay Area`,

  "merge-senior-application-engineer": `Senior Application Engineer

Merge Labs is building research infrastructure to support frontier neuroscience research.

**About the Role:**
Develop and support applications that enable cutting-edge research across the organization.

**Responsibilities:**
- Develop software applications for research infrastructure
- Build data pipelines and analysis tools
- Support researchers with technical implementations
- Integrate hardware and software systems
- Document and maintain application codebases

**Requirements:**
- BS/MS in Computer Science or related field
- Strong Python programming skills
- Experience with scientific computing and data pipelines
- Familiarity with web development
- Excellent problem-solving abilities

**Location:** San Francisco Bay Area`,

  "merge-senior-infrastructure-engineer": `Senior Infrastructure Engineer - Hybrid Cloud & On-Prem Systems

Merge Labs is building secure, scalable infrastructure for sensitive research data.

**About the Role:**
Design and manage hybrid cloud and on-premises infrastructure for research computing.

**Responsibilities:**
- Design and implement hybrid cloud/on-prem infrastructure
- Manage high-performance computing resources
- Ensure security and compliance for sensitive data
- Build and maintain CI/CD pipelines
- Support research teams with infrastructure needs

**Requirements:**
- 5+ years infrastructure engineering experience
- Strong experience with cloud platforms (AWS, GCP) and on-prem systems
- Expertise in Kubernetes, Terraform, and configuration management
- Understanding of security best practices
- Experience with HPC environments preferred

**Location:** San Francisco Bay Area`,

  "merge-senior-data-engineer": `Senior/Staff Data Engineer (Scientific Data Engineer)

Merge Labs is building data infrastructure to support cutting-edge research at scale.

**About the Role:**
Build and maintain data infrastructure that enables scientific discovery.

**Responsibilities:**
- Design and implement data pipelines for scientific data
- Build data platforms for ML training and analysis
- Develop data quality and governance frameworks
- Collaborate with scientists and ML engineers
- Optimize data systems for performance and scale

**Requirements:**
- 5+ years data engineering experience
- Strong experience with Python, SQL, and data pipeline tools
- Experience with cloud data platforms
- Understanding of ML data requirements
- Experience with scientific data preferred

**Location:** San Francisco Bay Area`,

  "merge-talent-partner": `Talent Partner

Merge Labs is growing our team of exceptional builders across multiple disciplines.

**About the Role:**
Partner with hiring managers to recruit world-class talent across scientific, engineering, and operational roles.

**Responsibilities:**
- Manage full-cycle recruiting for technical and scientific roles
- Develop sourcing strategies for specialized talent
- Build relationships with academic institutions and industry networks
- Improve recruiting processes and candidate experience
- Partner with hiring managers on workforce planning

**Requirements:**
- 5+ years recruiting experience, preferably in biotech or tech
- Experience recruiting scientific and engineering talent
- Strong sourcing and candidate engagement skills
- Data-driven approach to recruiting
- Excellent communication and relationship building

**Location:** San Francisco Bay Area`,

  // === MORPHO ===
  "morpho-customer-support-specialist": `Customer Support Specialist

Morpho is a leading DeFi lending protocol with over $10 billion in deposits, backed by Ribbit Capital, a16z crypto, Coinbase Ventures, and others.

**About the Role:**
Deliver world-class support to Morpho users and integrators across all time zones.

**Responsibilities:**
- Provide support through Discord, Telegram, Intercom, and Slack
- Own and maintain documentation and community platforms
- Analyze and document user issues using Etherscan, Phalcon, and Tenderly
- Engage proactively with users across time zones
- Collaborate with engineering and product teams
- Build technical knowledge of Morpho's protocols and smart contracts

**Requirements:**
- 3+ years of customer support experience
- 3+ years of experience in DeFi
- Deep understanding of DeFi protocols and blockchain technology
- Experience with tools like Etherscan, Phalcon, Tenderly
- Fluent English with professional communication skills

**Location:** Remote (Americas, APAC)`,

  "morpho-defi-business-analyst": `DeFi Business Analyst

Morpho is experiencing explosive growth as the new standard for DeFi lending.

**About the Role:**
Turn on-chain data into business clarity by monitoring Morpho's lending activity and identifying high-value opportunities.

**Responsibilities:**
- Monitor Morpho lending flows across 20+ networks
- Aggregate and prioritize on-chain signals to surface BD opportunities
- Prepare daily high-value signal briefs for BD and growth teams
- Maintain weekly and monthly reports on protocol health and growth
- Run deep-dive analyses on chains, assets, and user behaviors
- Partner with growth engineering to improve data stack
- Surface emerging DeFi opportunities

**Requirements:**
- 3+ years in business analysis, data analysis, or strategy roles at fintech/DeFi firms
- Excellent understanding of DeFi protocols, liquidity, and active players
- Strong familiarity with SQL and Python
- Ability to work with blockchain data tools (Allium, Dune, Subgraphs)
- Strong business acumen and problem-solving skills

**Location:** Paris or Remote (-5h to +2h GMT)`,

  "morpho-general-counsel": `General Counsel

Morpho is scaling its team to establish itself as a cornerstone of the new internet-native financial system.

**About the Role:**
Build and lead a world-class Legal & Public Affairs organization to strengthen Morpho's credibility and enable faster decision-making.

**Responsibilities:**
- Build and scale high-performing Legal & Public Affairs organization
- Own Legal + Public Affairs roadmaps aligned with business priorities
- Lead US institutional readiness: negotiate complex partnerships (US institutional/TradFi)
- Increase velocity and decision quality with risk-weighted paths to "yes"
- Represent Morpho externally with partners, counsel, and regulators

**Requirements:**
- 15+ years of legal & public affairs experience, including in-house leadership
- Proven track record negotiating major US institutional/TradFi partnerships
- Web3/crypto exposure (digital assets, DeFi, trading/lending)
- Experience building and scaling teams through growth phases
- First-principles thinking and strong decision quality under uncertainty

**Compensation:** $200,000 - $300,000/year

**Location:** NYC or Remote (ET)`,

  "morpho-head-of-people": `Head of People

Morpho is a leading DeFi lending protocol scaling its team of contributors.

**About the Role:**
Lead people operations to build and retain a world-class team as Morpho scales globally.

**Responsibilities:**
- Develop and execute people strategy aligned with business goals
- Build and scale recruiting, onboarding, and retention programs
- Design compensation and benefits frameworks
- Foster culture and employee engagement
- Ensure compliance with employment regulations across jurisdictions

**Requirements:**
- 8+ years of people/HR experience in high-growth tech/fintech
- Experience scaling teams in distributed, global organizations
- Strong understanding of compensation and equity practices
- Experience with crypto/startup environments preferred

**Location:** Paris or Remote`,

  "morpho-integrations-engineer-apac": `Integrations Engineer - APAC

Morpho is building the infrastructure for the new standard in DeFi lending.

**About the Role:**
Support technical integrations with partners and protocols across the APAC region.

**Responsibilities:**
- Support integrations with exchanges, wallets, and protocols in APAC
- Provide technical guidance to integration partners
- Debug and resolve integration issues
- Collaborate with product and engineering teams
- Document integration patterns and best practices

**Requirements:**
- 3+ years software engineering experience
- Strong understanding of DeFi protocols and smart contracts
- Experience with Solidity and EVM development
- Excellent communication skills in English and regional languages
- Based in APAC time zones

**Location:** Remote (APAC)`,

  "morpho-protocol-security-engineer": `Protocol Security Engineer

Morpho is building secure, efficient lending infrastructure for DeFi.

**About the Role:**
Ensure the security of Morpho's smart contracts and protocol infrastructure.

**Responsibilities:**
- Conduct security audits of smart contracts
- Develop and maintain security monitoring systems
- Respond to and investigate security incidents
- Collaborate with external auditors and bug bounty hunters
- Build security tooling and automated testing

**Requirements:**
- 3+ years security engineering experience
- Deep expertise in Solidity and smart contract security
- Experience with security auditing and vulnerability assessment
- Familiarity with DeFi protocols and attack vectors
- Strong analytical and problem-solving skills

**Location:** Paris or Remote`,

  "morpho-risk-analyst": `Risk Analyst

Morpho is building the open lending network with best-in-class risk management.

**About the Role:**
Analyze and manage risks across Morpho's lending protocol.

**Responsibilities:**
- Monitor and analyze protocol risk metrics
- Develop risk models for collateral and liquidation parameters
- Assess risks of new asset listings and integrations
- Produce risk reports for stakeholders
- Collaborate with product teams on risk frameworks

**Requirements:**
- 3+ years experience in risk analysis, preferably in DeFi or fintech
- Strong quantitative and analytical skills
- Understanding of DeFi lending mechanics and risks
- Proficiency with data analysis tools (Python, SQL)
- Experience with financial risk modeling

**Location:** Paris or Remote`,

  "morpho-senior-enterprise-partnerships": `Senior Enterprise Partnerships

Morpho is scaling adoption through strategic enterprise partnerships.

**About the Role:**
Drive enterprise adoption by building partnerships with institutions, DAOs, and large protocols.

**Responsibilities:**
- Identify and pursue strategic enterprise partnership opportunities
- Lead complex partnership negotiations and structuring
- Develop partnership frameworks and go-to-market strategies
- Collaborate with product and engineering on partner requirements
- Manage ongoing partner relationships for expansion

**Requirements:**
- 5+ years in enterprise sales or partnerships, preferably in crypto/fintech
- Track record closing large, complex deals
- Strong understanding of DeFi and institutional crypto needs
- Excellent negotiation and communication skills
- Network in the institutional/enterprise crypto space

**Location:** NYC, Paris, or Remote`,

  "morpho-technical-product-marketing-manager": `Technical Product Marketing Manager

Morpho is establishing itself as the new standard for DeFi lending.

**About the Role:**
Drive product marketing strategy to communicate Morpho's technical differentiation and value proposition.

**Responsibilities:**
- Develop product positioning and messaging for technical audiences
- Create technical content (documentation, guides, case studies)
- Support product launches with marketing campaigns
- Enable sales and BD teams with product knowledge
- Analyze competitive landscape and market trends

**Requirements:**
- 4+ years in product marketing, preferably in developer tools or DeFi
- Strong technical background with ability to understand smart contracts
- Excellent writing and communication skills
- Experience marketing to developers and technical audiences
- Understanding of DeFi protocols and market dynamics

**Location:** Paris or Remote`,

  // === CATEGORY LABS ===
  "category-labs-infra-engineer-apac": `Infrastructure Engineer, APAC

Category Labs (formerly Monad Labs) is a team of systems engineers and researchers building at the frontier of decentralized technology, backed by $225M in Series A funding led by Paradigm.

**About the Role:**
Scale and support global networks running baremetal servers for a high-performance blockchain.

**Responsibilities:**
- Scale and support global networks running baremetal servers in dozens of data centers
- Productionize blockchain software for thousands of geo-diverse nodes
- Dive deep into network issues to maximize uptime and robustness
- Build automated tools for operational improvement
- Interface between node operators and core developers
- Participate in on-call rotation for production support

**Requirements:**
- Deep experience with network protocols (TCP/IP, UDP) and debugging
- Significant experience with container technologies (Docker, Kubernetes, Terraform, Ansible)
- Highly proficient with command-line Linux and git
- Proficient in Python, Go, or C++
- Experience writing infrastructure deployment scripts
- Experience with observability and security practices

**Highly Valued:** Experience running baremetal nodes at a validator or L1 company

**Location:** APAC`,

  "category-labs-open-application": `Open Application

Category Labs (formerly Monad Labs) is building step-function improvements over existing blockchain solutions, backed by $225M from Paradigm, Electric Capital, Greenoaks, Dragonfly, and Coinbase Ventures.

**About Category Labs:**
We're building the fastest EVM-compatible blockchain with parallel execution. Our team combines systems engineering expertise with deep blockchain knowledge.

If you're passionate about blockchain infrastructure and don't see a specific role that fits, we'd love to hear from you. We're always looking for exceptional talent in:
- Systems Engineering
- Cryptography Research
- Protocol Development
- Developer Relations
- Operations

**What We Value:**
- Deep technical expertise
- Collaborative, low-ego culture
- High-quality outputs
- Mission-driven work

**Benefits:**
- Competitive salary and equity
- Medical, dental, and vision insurance
- Unlimited PTO
- Remote-friendly culture

**Location:** Global`,

  "category-labs-senior-researcher-mechanism-design": `Senior Researcher, Mechanism Design

Category Labs is building the frontier of decentralized technology with innovations in blockchain performance and economics.

**About the Role:**
Lead research on mechanism design for blockchain protocols.

**Responsibilities:**
- Design economic mechanisms for protocol security and incentives
- Analyze game-theoretic properties of consensus mechanisms
- Model and simulate protocol economics
- Collaborate with engineering on mechanism implementation
- Publish research and contribute to academic discourse

**Requirements:**
- PhD in Economics, Computer Science, or related field
- Strong background in mechanism design and game theory
- Experience with blockchain protocol economics
- Publication record in relevant venues
- Strong analytical and mathematical skills

**Location:** Remote`,

  "category-labs-senior-researcher-systems": `Senior Researcher, Systems

Category Labs is pushing the boundaries of blockchain performance through systems research.

**About the Role:**
Lead systems research to enable breakthrough blockchain performance.

**Responsibilities:**
- Research novel approaches to consensus and execution
- Design and analyze distributed systems algorithms
- Prototype and benchmark system improvements
- Collaborate with engineering on implementation
- Publish research and contribute to the field

**Requirements:**
- PhD in Computer Science with focus on distributed systems
- Deep expertise in consensus protocols and networking
- Experience with high-performance systems
- Publication record in systems venues
- Strong programming skills

**Location:** Remote`,

  "category-labs-senior-software-engineer": `Senior Software Engineer

Category Labs is building step-function improvements in blockchain technology.

**About the Role:**
Build core blockchain infrastructure for the fastest EVM-compatible chain.

**Responsibilities:**
- Design and implement core blockchain systems
- Optimize performance for high-throughput execution
- Contribute to consensus and networking layers
- Write high-quality, well-tested code
- Collaborate with researchers on novel solutions

**Requirements:**
- 5+ years software engineering experience
- Strong systems programming skills (Rust, Go, C++)
- Experience with distributed systems
- Understanding of blockchain technology
- Strong problem-solving abilities

**Location:** Remote`,

  "category-labs-senior-software-engineer-compiler": `Senior Software Engineer, Compiler

Category Labs is building compiler infrastructure for next-generation blockchain execution.

**About the Role:**
Design and implement compiler optimizations for high-performance EVM execution.

**Responsibilities:**
- Build compiler infrastructure for EVM bytecode
- Implement JIT compilation and optimization passes
- Profile and optimize execution performance
- Contribute to VM design and implementation
- Collaborate with protocol researchers

**Requirements:**
- 5+ years compiler or VM development experience
- Strong knowledge of compiler optimization techniques
- Experience with LLVM or similar frameworks
- Understanding of EVM and smart contract execution
- Strong systems programming skills (Rust, C++)

**Location:** Remote`,

  "category-labs-smart-contract-engineer": `Smart Contract Engineer

Category Labs is enabling developers to build on the fastest EVM-compatible blockchain.

**About the Role:**
Build smart contracts and developer tooling for the Category Labs ecosystem.

**Responsibilities:**
- Develop smart contracts for protocol infrastructure
- Build developer tools and libraries
- Conduct security reviews and testing
- Create documentation and examples
- Support ecosystem developers

**Requirements:**
- 3+ years Solidity development experience
- Strong understanding of EVM and gas optimization
- Experience with testing frameworks (Foundry, Hardhat)
- Security-minded development practices
- Excellent documentation skills

**Location:** Remote`,

  "category-labs-technical-program-manager": `Technical Program Manager

Category Labs is coordinating complex technical initiatives to deliver breakthrough blockchain technology.

**About the Role:**
Drive execution of complex technical programs across engineering and research teams.

**Responsibilities:**
- Manage cross-functional technical programs
- Coordinate between engineering, research, and operations teams
- Track progress and manage dependencies
- Identify and mitigate risks
- Communicate status to stakeholders

**Requirements:**
- 5+ years technical program management experience
- Strong understanding of software development processes
- Experience in infrastructure or blockchain companies
- Excellent communication and organizational skills
- Ability to work with highly technical teams

**Location:** Remote`,

  // === ETHEREUM FOUNDATION ===
  "ef-apac-policy-manager": `APAC Policy Manager

The Ethereum Foundation (EF) is a global non-profit dedicated to assisting the Ethereum ecosystem in realizing the potential of Ethereum as open, neutral infrastructure.

**About the Role:**
Track critical regional and national policy developments across APAC, translate complex issues for technical audiences, and coordinate ecosystem policy strategy.

**Responsibilities:**
- Convene and maintain a trusted network of APAC stakeholders
- Produce neutral, high-quality explainer materials (briefs, primers, FAQs)
- Curate APAC policy digests and host knowledge-sharing calls
- Map priority policy files and regulatory timelines across APAC jurisdictions
- Develop ecosystem-level readiness plans and frameworks
- Translate technical realities into accessible narratives
- Support workshops and roundtables that reduce information asymmetry

**Requirements:**
- 7+ years in legislative staff, public policy, or regulatory affairs
- Strong grasp of APAC policy environments
- Exceptional ability to create clear, neutral, technically informed materials
- Comfort engaging with developers on blockchain concepts
- Fluency in Mandarin or other APAC languages preferred

**Location:** Remote (Contract)`,

  "ef-associate-global-policy": `Associate, Global Policy Strategy

The Ethereum Foundation supports Ethereum's long-term success through strategic resource allocation and ecosystem advocacy.

**About the Role:**
Support global policy initiatives to ensure Ethereum's interests are represented in policy discussions worldwide.

**Responsibilities:**
- Research and analyze global policy developments affecting Ethereum
- Support policy managers with research and materials
- Monitor regulatory developments across jurisdictions
- Contribute to policy briefs and position papers
- Coordinate with ecosystem stakeholders on policy matters

**Requirements:**
- 3+ years in policy research or advocacy
- Understanding of blockchain technology and Ethereum
- Strong research and writing skills
- Ability to work across jurisdictions
- Interest in open-source and decentralized technology

**Location:** Remote`,

  "ef-comms-wizard-devcon": `Comms Wizard | Devcon 8

Devcon is the oldest and most prominent event in the Ethereum community, attracting developers, designers, researchers, and creators worldwide.

**About the Role:**
Lead communications for Devcon 8, the premier Ethereum developer conference.

**Responsibilities:**
- Develop and execute communications strategy for Devcon
- Manage media relations and press inquiries
- Create compelling content across channels
- Coordinate with speakers and sponsors on messaging
- Build excitement and engagement in the community

**Requirements:**
- 5+ years in communications or PR
- Experience with tech or crypto events
- Strong writing and storytelling skills
- Network in crypto media
- Passion for Ethereum and developer communities

**Location:** Remote (Contract)`,

  "ef-legal-counsel": `Legal Counsel

The Ethereum Foundation is a global non-profit dedicated to supporting Ethereum and related technologies.

**About the Role:**
Provide legal counsel across internal matters, commercial agreements, and organizational operations.

**Responsibilities:**
- Draft, review, and negotiate commercial agreements
- Support Devcon and EF events with contract review
- Handle IP matters including trademarks and licensing
- Advise on data protection and privacy issues
- Identify legal risks and provide mitigation strategies
- Work with and manage external counsel
- Improve internal legal templates and workflows

**Requirements:**
- 5+ years post-qualification legal experience
- Training at top-tier international law firm
- Solid experience in corporate and commercial law
- Qualification in European jurisdiction; LL.M preferred
- Experience in international environments
- Excellent written and spoken English

**Location:** Berlin (Remote-friendly)`,

  "ef-legal-operations-associate": `Legal Operations Associate

The Ethereum Foundation manages legal operations across a global, distributed organization.

**About the Role:**
Support legal operations and administrative functions for the EF legal team.

**Responsibilities:**
- Manage contract lifecycle and documentation
- Maintain legal databases and filing systems
- Coordinate with external counsel and vendors
- Support compliance and regulatory filings
- Assist with legal research and projects

**Requirements:**
- 2+ years legal operations or paralegal experience
- Strong organizational and administrative skills
- Experience with contract management systems
- Attention to detail and process improvement
- Familiarity with tech or nonprofit organizations

**Location:** Remote`,

  "ef-local-production-devcon": `Local Production Magician | Devcon 8

Devcon is an annual 4-day conference that brings together the global Ethereum community.

**About the Role:**
Manage local production logistics for Devcon 8.

**Responsibilities:**
- Coordinate local vendors and venues
- Manage on-site production logistics
- Oversee AV, staging, and technical setup
- Liaise with local authorities and suppliers
- Ensure smooth execution of all production elements

**Requirements:**
- 5+ years event production experience
- Experience with large-scale tech conferences
- Strong vendor and logistics management skills
- Ability to work in fast-paced environments
- Local market knowledge for event location

**Location:** Event Location (Contract)`,

  "ef-programming-lead-devcon": `Programming Lead | Devcon 8

Devcon attracts developers, designers, researchers, and creators passionate about Ethereum and decentralization.

**About the Role:**
Lead programming and content curation for Devcon 8.

**Responsibilities:**
- Curate conference programming and speaker lineup
- Design session formats and tracks
- Coordinate with speakers and content contributors
- Ensure high-quality, diverse programming
- Manage programming team and review process

**Requirements:**
- Experience in conference programming or content curation
- Deep knowledge of Ethereum ecosystem and technology
- Strong network in developer and research communities
- Excellent organizational and communication skills
- Passion for education and community building

**Location:** Remote (Contract)`,

  // === DUNE ===
  "dune-account-executive": `Account Executive

Dune is on a mission to make crypto data accessible, with a collaborative multi-chain analytics platform used by thousands of developers, analysts, and investors.

**About the Role:**
Drive new business across Dune's data products, focusing on DataShare and Enterprise analytics contracts.

**Responsibilities:**
- Own the full sales cycle: discovery, scoping, demos, technical deep dives, negotiation, and closing
- Upsell self-serve base by identifying power users via analytics and CRM
- Lead outbound efforts to researchers, funds, exchanges, DAOs, and venture firms
- Translate dashboards into deals with tailored pitches

**Requirements:**
- 4+ years B2B SaaS sales experience, including 2+ years in crypto or data/analytics
- Experience selling to researchers, funds, TradFi, or protocol teams
- Know how to build pipeline from scratch (Telegram, Twitter, LinkedIn, Dune)
- Experience managing CRM pipelines (HubSpot preferred)
- Based in US (ET) or Europe

**Location:** Remote (US/Europe)`,

  "dune-account-executive-nyc": `Account Executive (Based in NYC)

Dune is backed by Coatue and Union Square Ventures, building the platform for onchain data analysis.

**About the Role:**
Own enterprise sales in the NYC market for Dune's data products.

**Responsibilities:**
- Full sales cycle for enterprise data products
- Build relationships with NYC-based crypto firms, funds, and exchanges
- Identify and pursue new business opportunities
- Upsell and expand existing accounts
- Collaborate with product team on customer feedback

**Requirements:**
- 4+ years B2B SaaS sales experience
- 2+ years selling data/analytics or crypto products
- Based in NYC
- Experience with CRM (HubSpot preferred)
- Strong network in NYC crypto ecosystem preferred

**Location:** New York City`,

  "dune-customer-success-manager": `Customer Success Manager

Dune is hiring to support its most important growth initiative—ensuring customers realize value from onchain data products.

**About the Role:**
Own and grow a portfolio of enterprise customers with responsibility for retention, expansion, and success.

**Responsibilities:**
- Proactively manage customer relationships ahead of renewal cycles
- Partner with customers on complex data use cases
- Identify upsell and expansion opportunities
- Collaborate with Sales on account strategies
- Work with Support and Engineering on technical issues
- Build feedback loops with Product team
- Track customer health and commercial risk

**Requirements:**
- 3-6+ years in Customer Success or Account Management within B2B SaaS
- Experience with technical or data products
- Comfortable with complex solutions, not transactional products
- Experience owning commercial outcomes (renewals, upsells, NDR)
- Familiarity with crypto, blockchain, or financial data
- Based in US (ET) or Europe

**Location:** Remote (US/Europe)`,

  "dune-growth-product-manager": `Growth Product Manager

Dune is building the product that empowers a new generation of onchain analysts.

**About the Role:**
Drive product-led growth for Dune's analytics platform.

**Responsibilities:**
- Own growth metrics and product-led growth initiatives
- Design experiments to improve activation and retention
- Analyze user behavior and identify growth opportunities
- Collaborate with engineering on growth features
- Define and track growth KPIs

**Requirements:**
- 4+ years product management experience
- Experience with product-led growth
- Strong analytical skills and data fluency
- Understanding of user acquisition and retention
- Experience with developer or data products preferred

**Location:** Remote (US/Europe)`,

  "dune-product-marketing-manager": `Product Marketing Manager

Dune is establishing itself as the essential platform for onchain data.

**About the Role:**
Drive product marketing to communicate Dune's value to analysts, developers, and enterprises.

**Responsibilities:**
- Develop product positioning and messaging
- Create content for product launches
- Enable sales with product knowledge and materials
- Analyze competitive landscape
- Gather customer insights for product team

**Requirements:**
- 4+ years product marketing experience
- Experience marketing data or developer products
- Strong writing and communication skills
- Understanding of crypto and blockchain data
- Analytical mindset

**Location:** Remote (US/Europe)`,

  "dune-revenue-operations-manager": `Revenue Operations Manager

Dune is scaling its go-to-market operations to support rapid growth.

**About the Role:**
Build and optimize revenue operations to enable sales, marketing, and customer success teams.

**Responsibilities:**
- Manage CRM and sales tech stack
- Build reporting and analytics for revenue teams
- Optimize sales processes and workflows
- Support territory and quota planning
- Enable data-driven decision making

**Requirements:**
- 4+ years revenue operations experience
- Strong HubSpot or Salesforce expertise
- Experience with B2B SaaS revenue operations
- Strong analytical and process design skills
- Experience in high-growth startups

**Location:** Remote (US/Europe)`,

  "dune-sales-development-manager": `Sales Development Manager

Dune is building the SDR team to fuel enterprise growth.

**About the Role:**
Build and lead the sales development team to generate enterprise pipeline.

**Responsibilities:**
- Recruit, train, and develop SDR team
- Set SDR targets and manage performance
- Develop outbound playbooks and strategies
- Collaborate with AEs on pipeline handoff
- Optimize SDR tech stack and processes

**Requirements:**
- 4+ years in sales development or management
- Experience building and scaling SDR teams
- Track record of pipeline generation
- Understanding of crypto or data markets
- Strong coaching and leadership skills

**Location:** Remote (US/Europe)`,
};

async function main() {
  console.log("Starting batch5 job description backfill...\n");

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
