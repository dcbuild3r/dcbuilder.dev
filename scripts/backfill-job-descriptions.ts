/**
 * Backfill job descriptions from Exa search results
 * Usage: bun run scripts/backfill-job-descriptions.ts
 */

import { db } from "../src/db";
import { jobs } from "../src/db/schema";
import { eq } from "drizzle-orm";

// Job data from Exa searches - collected above
const jobDescriptions: Record<string, string> = {
  "prime-intellect-applied-research-evals": `Applied Research - Evals & Data

This is a customer-facing role at the intersection of cutting-edge RL/post-training methods, applied data, and agent systems. You'll have a direct impact on shaping how advanced models are aligned, evaluated, deployed, and used in the real world.

**Role Impact:**
- Advancing Agent Capabilities: Designing and iterating on next-generation AI agents that tackle real workloads—workflow automation, reasoning-intensive tasks, and decision-making at scale
- Building Robust Infrastructure: Developing the distributed systems, evaluation pipelines, and coordination frameworks that enable agents to operate reliably and at massive scale
- Bridge Between Customers & Research: Translating customer needs and insights from applied data into clear technical requirements that guide product and research priorities
- Prototype in the Field: Rapidly designing and deploying agents, evals, and harnesses alongside customers to validate solutions

**Responsibilities:**
- Work side-by-side with customers to deeply understand workflows, data sources, and bottlenecks
- Prototype agents, data pipelines, and eval harnesses tailored to real use cases
- Design and implement novel RL and post-training methods (RLHF, RLVR, GRPO, etc.) to align large models with domain-specific tasks
- Build evaluation harnesses and verifiers to measure reasoning, robustness, and agentic behavior
- Architect and maintain distributed training and inference pipelines

**Requirements:**
- Strong background in machine learning engineering, with experience in post-training, RL, or large-scale model alignment
- Deep expertise in distributed training/inference frameworks (vLLM, sglang, Ray, Accelerate)
- Experience deploying containerized systems at scale (Docker, Kubernetes, Terraform)
- Track record of research contributions in ML/RL

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-applied-research-rl": `Applied Research - RL & Agents

This is a customer-facing role at the intersection of cutting-edge RL/post-training methods and applied agent systems. You'll have a direct impact on shaping how advanced models are aligned, deployed, and used in the real world.

**Role Impact:**
- Advancing Agent Capabilities: Designing and iterating on next-generation AI agents that tackle real workloads—workflow automation, reasoning-intensive tasks, and decision-making at scale
- Building Robust Infrastructure: Developing the distributed systems and coordination frameworks that enable agents to operate reliably, efficiently, and at massive scale
- Bridge Between Customers & Research: Translate customer needs into clear technical requirements that guide product and research priorities
- Prototype in the Field: Rapidly design and deploy agents, evals, and harnesses alongside customers to validate solutions

**Responsibilities:**
- Work side-by-side with customers to deeply understand workflows and bottlenecks
- Prototype agents and eval harnesses tailored to real use cases
- Design and implement novel RL and post-training methods (RLHF, RLVR, GRPO, etc.) to align large models with domain-specific tasks
- Build evaluation harnesses and verifiers to measure reasoning, robustness, and agentic behavior
- Rapidly prototype and iterate on AI agents for automation, workflow orchestration, and decision-making
- Architect and maintain distributed training/inference pipelines
- Develop observability and monitoring (Prometheus, Grafana, tracing)

**Requirements:**
- Strong background in machine learning engineering, with experience in post-training, RL, or large-scale model alignment
- Deep expertise in distributed training/inference frameworks (vLLM, sglang, Ray, Accelerate)
- Experience deploying containerized systems at scale (Docker, Kubernetes, Terraform)
- Track record of research contributions in ML/RL

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-account-executive": `Account Executive

Own the full sales cycle for a high-velocity and high-complexity product - compute, RL infrastructure, and post-training services. Work a focused book of high-potential accounts and convert interest into pilots and long-term contracts.

**Responsibilities:**
- Run full-cycle sales: outbound efforts, discovery, technical scoping, pilot design, negotiation, and closing
- Prospect, qualify, and manage a pipeline of high-value enterprise accounts
- Present compute and RL post-training services as a cohesive solution to ML and infrastructure teams
- Collaborate with Solutions and Technical Account Managers to ensure smooth onboarding of clients and effective pilot execution
- Maintain rigorous pipeline hygiene, forecasting accuracy, and CRM discipline
- Identify opportunities to expand existing accounts into multi-year engagements
- Contribute to go-to-market playbooks, crafting messaging, and developing sales strategies

**Qualifications:**
- 2-5 years of enterprise sales experience in developer tools, cloud, infrastructure, or AI products
- Proven ability to close $50k to $300k+ ACV deals with technical buyers
- Technical fluency in GPUs, compute, ML development, and post-training topics
- Strong outbound instincts to engage AI labs and ML teams
- Excellent communication skills to manage complex cycles and multiple stakeholders
- Demonstrates high ownership and thrives in dynamic, ambiguous environments
- Bonus: Experience with ML infra, network in the AI/ML ecosystem

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-ai-research-resident": `AI Research Resident - Open Source AGI

A unique 3-12 month opportunity for exceptional researchers, engineers, and hackers to join Prime Intellect and contribute to state-of-the-art decentralized AI research. This program is designed to provide a bridge for brilliant technical minds from diverse fields to transition into AI research and development.

**About the Program:**
The Prime Intellect AI Research Residency is a paid, full-time program that offers hands-on experience working on real-world AI challenges alongside our world-class research team.

**What You'll Do:**
- Collaborate with leading experts in AI, distributed systems, and protocols to develop state-of-the-art open language models, coding agents, and scientific discovery models
- Contribute to projects focused on democratizing AI and making it universally accessible
- Gain practical experience in developing and deploying large-scale AI models using novel architectures and distributed training techniques across thousands of GPUs
- Publish research papers and present findings at top-tier AI conferences
- Develop a strong network within the decentralized AI community

**Focus Areas:**
- Distributed AI Infrastructure: Contribute to the Prime Intellect protocol, enabling massively scalable, distributed compute marketplaces
- Open Language Models: Build large language models like open-source software, allowing for continual improvement
- Coding Agents: Train AI agents that deeply understand code semantics

**Who We're Looking For:**
- PhD students or postdoctoral researchers in CS, mathematics, physics, neuroscience
- Experienced software engineers with a strong interest in transitioning to AI research
- Self-taught individuals with a proven track record of exceptional technical contributions
- Candidates with experience in machine learning, distributed systems, or protocols

**Benefits:** Competitive compensation with equity incentives, flexible work arrangements, visa sponsorship and relocation assistance, quarterly team off-sites and conferences.`,

  "prime-intellect-business-ops-lead": `Business Operations Lead

Work directly with the CEO and leadership to design scalable systems and processes, handling high-priority initiatives across various functions.

**Responsibilities:**
- Build and optimize core company systems across GTM, finance, operations, and product
- Drive key operational initiatives end-to-end — scoping, planning, execution, iteration
- Develop reporting and dashboards for company-level metrics — revenue, compute usage, burn, GTM efficiency
- Partner with leadership on operating cadence — weekly reviews, quarterly planning, board materials
- Own vendor and partner coordination across compute suppliers, contractors, and service providers
- Improve internal processes to reduce friction across teams — from contracting to onboarding to budgeting
- Support fundraising materials, investor reporting, and strategic narrative development
- Ensure cross-team alignment and unblock high-priority projects
- Manage internal knowledge and process documentation as the company scales

**Requirements:**
- 3-7 years in business operations, strategy, consulting, finance, or startup ops
- Exceptional generalist problem-solver who moves fast and thinks in systems
- Strong analytical abilities — financial modeling, dashboards, forecasting, data synthesis
- Operational rigor — you create clarity, structure, and repeatable processes from chaos
- Comfort with technical products and high-level ML/compute concepts
- Excellent communicator who works seamlessly across engineering, GTM, and leadership
- Bias for action and ownership — you unblock yourself and others
- Bonus: Startup or founder experience, understanding of cloud compute/ML workflows, experience with Notion, HubSpot/Salesforce, BI tools

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-founders-associate": `Founder's Associate, Business Operations

A high-trust, high-pace role for someone with exceptional judgment and execution who wants to operate at the center of a frontier AI company. You'll work directly with leadership to drive priorities forward, keep execution tight, and remove friction across the org.

**What You'll Do:**
- Act as a day-to-day extension of senior management: follow-ups, prioritisation, and closing loops
- Turn ambiguous problems into clear plans, timelines, owners, and shipped results
- Drive special projects across functions (ops, finance, recruiting coordination, internal comms, logistics)
- Prepare briefs, updates, decision memos, and meeting notes that keep everyone aligned
- Build lightweight systems that make execution predictable (tracking, documentation, SOPs)
- Create a high-quality internal "operating rhythm": weekly priorities, reporting, and accountability
- Spot recurring friction and implement fixes that reduce overhead for the team
- Jump on whatever is highest priority that week — and deliver without hand-holding
- Coordinate across time zones (SF/Berlin) to ensure tight communication and fast turnaround
- Support key moments: hiring/onboarding coordination, team planning, travel/event logistics

**Who We're Looking For:**
- Elite execution ability: fast, precise, relentlessly reliable
- Can operate independently with excellent judgment and follow-through
- Communicate clearly and proactively, especially in high-velocity environments
- Strong organisational instincts and can impose structure on ambiguity
- Enjoy being accountable for outcomes, not just tasks
- Common backgrounds: top-performing early-career candidates from finance, consulting, investing, research, or high-intensity startups

**Benefits:** Competitive compensation with equity incentives, flexible work (SF-based), visa sponsorship, professional development budget, team off-sites.`,

  "prime-intellect-founding-gtm-lead": `Founding GTM Lead

As a founding member of the Go-To-Market team, you'll be at the forefront of shaping sales and marketing strategies to secure partnerships, expand the GPU marketplace, and grow a long-term client base.

**Your Role:**
Drive revenue growth and foster partnerships that position Prime Intellect as a trusted compute partner for companies scaling their resources or developing next-gen LLMs and multimodal models. Architect and execute comprehensive revenue strategy, focusing on building sales infrastructure while driving revenue through enterprise and mid-market compute partnerships.

**Responsibilities:**
- Identify and nurture high-value leads through targeted prospecting and inbound/outbound strategies
- Develop and execute GTM strategies to launch and scale our decentralized training platform in key U.S. and European markets
- Build strategic partnerships with industry leaders, including cloud providers and AI tool developers
- Refine and communicate our unique value proposition to diverse audiences
- Lead the creation of compelling sales and marketing materials (case studies, white papers, customer success stories)
- Drive comprehensive revenue strategy targeting upper-mid market and enterprise clients ($100k+ ACV)
- Build and execute Prime Intellect's complete sales playbook
- Design and launch a hybrid SDR program incorporating in-house teams, third-party partners, and AI agent capabilities
- Implement sales technology stack and CRM architecture to enable data-driven decision making

**Requirements:**
- Proven experience leading GTM strategies for AI/ML products
- Expertise in translating complex technical concepts into clear, impactful messaging
- Track record of building partnerships that drive growth within the AI/ML ecosystem
- Strong communication and leadership skills
- Familiarity with LinkedIn, HubSpot, and industry-standard AI/ML tools

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-head-of-enterprise": `Head of Enterprise

Lead enterprise sales for Prime Intellect, positioning the company as a trusted compute partner for organizations scaling their AI resources or developing next-gen LLMs and multimodal models.

**Your Role:**
Own the full enterprise sales cycle for complex, high-value compute and RL infrastructure deals. Work with a focused book of high-potential accounts and convert interest into pilots and long-term contracts.

**Responsibilities:**
- Run full-cycle enterprise sales: outbound efforts, discovery, technical scoping, pilot design, negotiation, and closing
- Prospect, qualify, and manage a pipeline of high-value enterprise accounts ($100k+ ACV)
- Present compute and RL post-training services as a cohesive solution to ML and infrastructure teams
- Collaborate with Solutions and Technical Account Managers to ensure smooth onboarding
- Build strategic partnerships with industry leaders and AI tool developers
- Contribute to go-to-market playbooks and sales strategies

**Requirements:**
- 5+ years of enterprise sales experience in developer tools, cloud, infrastructure, or AI products
- Proven ability to close $100k to $1M+ ACV deals with technical buyers
- Technical fluency in GPUs, compute, ML development, and post-training topics
- Strong network in the AI/ML ecosystem
- Excellent communication skills to manage complex cycles and C-level stakeholders

**Compensation:** $250,000+ base with significant equity incentives. Flexible work (SF-based preferred), visa sponsorship, professional development budget.`,

  "prime-intellect-head-of-growth": `Head of Growth

Lead cross-functional Growth organization spanning Sales, Marketing, Partnerships, and Customer Success. Connect technology to the market by defining go-to-market strategy and building systems for scaling revenue efficiently.

**Responsibilities:**
- Build and lead a cross-functional Growth organization
- Define go-to-market strategy for RL infrastructure: pricing, packaging, and positioning
- Own revenue forecasting, pipeline visibility, and operational cadence
- Design data-driven systems for deal tracking, reporting, and forecasting accuracy
- Lead enterprise sales cycles for post-training and multi-node cluster deals (64+ GPUs, 6+ month durations)
- Develop repeatable playbooks for design-partner conversions and enterprise onboarding
- Build strategic partnerships with compute providers, AI companies, and research labs
- Drive developer and enterprise awareness through campaigns, launches, community, and content
- Partner with Product to align market feedback with roadmap
- Run quantitative experiments on activation, conversion, and usage metrics
- Build the CS motion across onboarding, usage analytics, renewals, and expansion workflows
- Implement CRM-based renewal tracking and feedback loops

**Requirements:**
- 5+ years leading growth, GTM, or revenue functions at a B2B or infrastructure startup
- Fluent in both technical and commercial conversations — comfortable discussing GPUs, APIs, and pricing models
- Proven ability to build scalable systems (CRM, forecasting, dashboards)
- Track record of closing enterprise-scale infrastructure or developer-tooling deals
- Analytical, curious, and comfortable in high-ambiguity environments

**Benefits:** Competitive compensation with equity incentives, flexible work (remote/SF/Berlin), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-revenue-ops": `Head of Revenue Operations

Own the end-to-end revenue operations engine across Sales, Growth, and Customer teams. Design the systems, data models, and processes that make revenue predictable and GTM execution surgical.

**Responsibilities:**
- Own GTM systems across the funnel - CRM, marketing automation, product analytics, billing, and data warehouse
- Design and maintain CRM architecture so that pipeline, stages, and fields reflect reality and support accurate forecasting
- Build and standardize reporting for leadership: pipeline health, conversion rates, cohort performance, NRR, GRR, compute GMV
- Partner with Head of Enterprise Sales and AEs on territory design, quota setting, compensation plans, and performance tracking
- Run deal desk for complex deals - pricing structure, approvals, non-standard terms
- Connect product usage and compute consumption data to revenue metrics for usage-based and hybrid models
- Define and implement lead routing, SLAs, and handoffs between Marketing, Sales, TAM, and Solutions
- Automate repetitive GTM workflows so Sales and CS can focus on customers
- Create and maintain a single source of truth for revenue data across tools and teams
- Partner with Finance on revenue recognition, forecasting assumptions, and board reporting inputs
- Evaluate and manage the GTM tech stack - select tools, own vendor relationships, ensure adoption

**Requirements:**
- 5+ years in revenue operations, sales operations, or GTM operations at a B2B startup
- Deep expertise in CRM architecture and sales technology stacks
- Strong analytical skills and experience with business intelligence tools
- Experience with usage-based or consumption-based pricing models
- Excellent cross-functional communication skills

**Benefits:** Competitive compensation with equity incentives, flexible work (SF-based), visa sponsorship, professional development budget.`,

  "prime-intellect-internship": `Internship

We're looking for exceptional interns who've already built real systems, contributed to open-source, or gone deep across technical domains.

**About the Role:**
If you thrive in open-ended, high-stakes problem spaces and want to push the limits of open, distributed AI, we want to hear from you. Whether your strength is in AI, systems, distributed compute, cryptography, or something unexpected, what matters is how fast you learn, how well you execute, and how deeply you think.

**What We're Looking For:**
- Exceptional builders who've already shipped real systems
- Open-source contributors with a track record of technical contributions
- Deep technical expertise across AI, systems, distributed compute, or cryptography
- Fast learners who execute well and think deeply
- People excited about decentralized AGI

Tell us what excites you about Prime Intellect, something impressive you've built, and how you'd accelerate decentralized AGI.

**Benefits:** Competitive compensation, flexible work arrangements (SF or remote), visa sponsorship available.`,

  "prime-intellect-lead-design-engineer": `Lead Design Engineer

Build and shape the product experience of how users train and evaluate models on the Prime Intellect platform. This is a novel design space working directly with research teams on the experience between software frameworks, CLI tools, and platform.

**Core Responsibilities:**
- Design and implement interfaces across the platform covering compute orchestration and RL training
- Translate complex backend systems into intuitive, production-ready product experiences
- Own end-to-end product development from concept to deployment
- Build and maintain a scalable design system with reusable components
- Build for technical audiences: AI engineers and general software engineers
- Convert RL concepts into usable visual primitives and interactive workflows
- Implement platform developer tools including onboarding flows and debugging interfaces
- Create seamless interactions between frameworks and platform UI

**Requirements:**
- Strong portfolio demonstrating shipped technical or data-driven tool interfaces
- Proficiency with modern frontend frameworks (Next.js)
- Experience designing and building for developers in technical domains
- Familiarity with AI/ML concepts and workflows
- Systems thinking: ability to create scalable, maintainable component architectures

**Nice to Have:**
- Experience building ML research tools, IDEs, or developer platforms
- Backend development capabilities (Python, Node.js)
- Animation and interaction design
- Data visualization experience
- Design tool proficiency (Figma)

**Benefits:** Competitive salary with significant equity, remote-first with SF hub option, tool/software budget, conference attendance opportunities.`,

  "prime-intellect-mts-fullstack": `Member of Technical Staff - Full Stack

A hybrid role spanning both the developer platform and infrastructure layers. Work on the developer-facing platform for AI workload management and the underlying distributed infrastructure that powers training systems.

**Platform Development:**
- Build intuitive web interfaces for AI workload management and monitoring
- Develop REST APIs and backend services in Python
- Create real-time monitoring and debugging tools
- Implement user-facing features for resource management and job control

**Infrastructure Development:**
- Design and implement distributed training infrastructure in Rust
- Build high-performance networking and coordination components
- Create infrastructure automation pipelines with Ansible
- Manage cloud resources and container orchestration
- Implement scheduling systems for heterogeneous hardware (CPU, GPU, TPU)

**Platform Skills Required:**
- Strong Python backend development (FastAPI, async)
- Modern frontend development (TypeScript, React/Next.js, Tailwind)
- Experience building developer tools and dashboards
- RESTful API design and implementation

**Infrastructure Skills Required:**
- Systems programming experience with Rust
- Infrastructure automation (Ansible, Terraform)
- Container orchestration (Kubernetes)
- Cloud platform expertise (GCP preferred)
- Observability tools (Prometheus, Grafana)

**Nice to Have:** GPU computing and ML infrastructure experience, AI/ML model architecture knowledge, high-performance networking, open-source contributions.

**Benefits:** Competitive compensation with significant equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`,

  "prime-intellect-mts-gpu-infra": `Member of Technical Staff - GPU Infrastructure

As Solutions Architect for GPU Infrastructure, you'll be the technical expert who transforms customer requirements into production-ready systems capable of training the world's most advanced AI models.

**Customer Architecture & Design:**
- Partner with clients to understand workload requirements and design optimal GPU cluster architectures
- Create technical proposals and capacity planning for clusters ranging from 100 to 10,000+ GPUs
- Develop deployment strategies for LLM training, inference, and HPC workloads
- Present architectural recommendations to technical and executive stakeholders

**Infrastructure Deployment & Optimization:**
- Deploy and configure orchestration systems including SLURM and Kubernetes for distributed workloads
- Implement high-performance networking with InfiniBand, RoCE, and NVLink interconnects
- Optimize GPU utilization, memory management, and inter-node communication
- Configure parallel filesystems (Lustre, BeeGFS, GPFS) for optimal I/O performance
- Tune system performance from kernel parameters to CUDA configurations

**Production Operations & Support:**
- Serve as primary technical escalation point for customer infrastructure issues
- Diagnose and resolve complex problems across the full stack - hardware, drivers, networking, and software
- Implement monitoring, alerting, and automated remediation systems
- Provide 24/7 on-call support for critical customer deployments
- Create runbooks and documentation for customer operations teams

**Requirements:**
- 3+ years hands-on experience with GPU clusters and HPC environments
- Deep expertise with SLURM and Kubernetes in production GPU settings
- Proven experience with InfiniBand, RoCE, and high-performance networking

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget.`,

  "prime-intellect-mts-inference": `Member of Technical Staff - Inference

A hybrid position spanning cloud LLM serving, LLM inference optimization and RL systems. You will be working on advancing our ability to evaluate and serve models trained with our Environment Hub at scale.

**Key Areas:**
- Building the infrastructure to serve and evaluate large language models at scale
- Optimizing inference performance for RL-trained models
- Developing systems for real-time model evaluation and feedback

**Core Responsibilities:**
- Design and implement high-performance inference infrastructure
- Optimize LLM serving for latency and throughput
- Build evaluation systems for RL-trained models
- Develop integration between training and inference systems
- Scale inference workloads across distributed GPU clusters

**Requirements:**
- Strong background in LLM inference optimization
- Experience with inference frameworks (vLLM, TensorRT-LLM, etc.)
- Deep understanding of GPU memory management and optimization
- Experience with distributed systems and container orchestration
- Familiarity with RL systems and training pipelines

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites.`,

  "prime-intellect-open-application": `Open Application for Unconventional Talent

Prime Intellect is always looking for exceptional people who don't fit into predefined boxes. If you have unconventional background but believe you can contribute to building open superintelligence infrastructure, we want to hear from you.

**What We're Looking For:**
- Exceptional technical or operational capabilities
- Track record of building impressive things
- Deep passion for open-source AI and democratizing access to AGI
- Ability to thrive in ambiguity and move fast
- Strong communication and collaboration skills

**Why Apply:**
- Shape the future of decentralized AI development
- Work with a talented, mission-driven team
- Competitive compensation with significant equity
- Flexible work arrangements (remote or SF)
- Visa sponsorship and relocation support available

Tell us about something impressive you've built and how you'd contribute to Prime Intellect's mission.`,

  "prime-intellect-research-distributed": `Research Engineer - Distributed Training

Play a crucial role in shaping Prime Intellect's technological direction, focusing on the decentralized AI training stack. If you love scaling things and maximizing training efficiency, this role is for you.

**Responsibilities:**
- Lead and participate in novel research to build a massive scale, highly reliable and secure decentralized training orchestration solution
- Optimize the performance, cost, and resource utilization of AI workloads by leveraging the most recent advances for compute & memory optimization techniques
- Contribute to the development of our open-source libraries and frameworks for distributed model training
- Publish research in top-tier AI conferences such as ICML & NeurIPS
- Distill highly technical project outcomes in layman approachable technical blogs
- Stay up-to-date with the latest advancements in AI/ML infrastructure and tools

**Requirements:**
- Strong background in AI/ML engineering, with extensive experience in designing and implementing end-to-end pipelines for training and deploying large-scale AI models
- Deep expertise in distributed training techniques, frameworks (PyTorch Distributed, DeepSpeed, MosaicML's LLM Foundry), and tools (Ray)
- Experience in large-scale model training including distributed training techniques (data, tensor & pipeline parallelism)
- Solid understanding of MLOps best practices, including model versioning, experiment tracking, and CI/CD pipelines
- Passion for advancing the state-of-the-art in decentralized AI model training

**Benefits:** Competitive compensation with equity and token incentives, flexible work (remote or SF), visa sponsorship and relocation assistance, quarterly team off-sites and conferences.`,

  "prime-intellect-research-rl": `Research Engineer - Reinforcement Learning

Work on cutting-edge reinforcement learning research to advance Prime Intellect's open superintelligence stack. Focus on developing novel RL methods for training frontier AI models.

**Responsibilities:**
- Design and implement novel RL and post-training methods (RLHF, RLVR, GRPO, etc.)
- Build evaluation harnesses and verifiers to measure reasoning, robustness, and agentic behavior
- Contribute to open-source RL libraries and frameworks
- Publish research in top-tier AI conferences
- Collaborate with infrastructure teams to scale RL training

**Requirements:**
- Strong background in reinforcement learning research
- Experience with large-scale model training and alignment
- Deep expertise in modern RL methods and their applications to LLMs
- Track record of research contributions (publications, open-source)
- Proficiency with PyTorch and distributed training frameworks

**Nice to Have:**
- Experience with RLHF, Constitutional AI, or other alignment methods
- Background in agent systems and decision-making
- Multi-agent RL experience

**Benefits:** Competitive compensation with equity incentives, flexible work (remote or SF), visa sponsorship, professional development budget, team off-sites and conferences.`
};

async function main() {
  console.log("Starting job description backfill...\n");

  for (const [jobId, description] of Object.entries(jobDescriptions)) {
    try {
      const result = await db
        .update(jobs)
        .set({ description })
        .where(eq(jobs.id, jobId))
        .returning({ id: jobs.id, title: jobs.title });

      if (result.length > 0) {
        console.log(`✓ Updated: ${result[0].title}`);
      } else {
        console.log(`✗ Not found: ${jobId}`);
      }
    } catch (error) {
      console.error(`✗ Error updating ${jobId}:`, error);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

main();
