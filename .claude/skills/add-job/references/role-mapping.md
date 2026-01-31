# Job Role/Department Mapping

The `department` field categorizes jobs by function. Use one of these values:

## Available Departments

| Slug | Label | When to Use |
|------|-------|-------------|
| `engineering` | Engineering | Software engineers, developers, DevOps, SRE |
| `design` | Design | UI/UX designers, product designers, graphic designers |
| `product` | Product | Product managers, product owners |
| `marketing` | Marketing | Marketing managers, content marketers, growth marketers |
| `sales` | Sales | Sales representatives, account executives |
| `business-development` | Business Development | BD managers, partnership managers |
| `research` | Research | Researchers, research scientists, research engineers |
| `hr` | Human Resources | HR managers, recruiters, people ops |
| `legal` | Legal | Lawyers, legal counsel, compliance |
| `finance` | Finance | Finance managers, accountants, controllers |
| `operations` | Operations | Operations managers, COO roles |
| `community` | Community | Community managers, community leads |
| `devrel` | Developer Relations | Developer advocates, developer evangelists |
| `support` | Support | Customer support, technical support |
| `executive` | Executive | C-suite, founders, VPs |
| `data` | Data | Data engineers, data scientists, analysts |
| `security` | Security | Security engineers, security researchers |
| `strategy` | Strategy | Strategy roles, chief of staff |
| `content` | Content | Content writers, technical writers |

## Mapping Guidelines

### By Job Title

| Title Contains | Department |
|----------------|------------|
| "Engineer", "Developer", "Architect" | `engineering` |
| "Designer", "UI", "UX" | `design` |
| "Product Manager", "PM", "Product Owner" | `product` |
| "Marketing", "Growth" | `marketing` |
| "Sales", "Account Executive", "AE" | `sales` |
| "BD", "Business Development", "Partnerships" | `business-development` |
| "Researcher", "Research Scientist" | `research` |
| "Recruiter", "HR", "People", "Talent" | `hr` |
| "Legal", "Counsel", "Compliance" | `legal` |
| "Finance", "Accountant", "Controller" | `finance` |
| "Operations", "Ops" | `operations` |
| "Community" | `community` |
| "DevRel", "Developer Advocate", "Developer Relations" | `devrel` |
| "Support", "Customer Success" | `support` |
| "CEO", "CTO", "CFO", "COO", "VP", "Founder" | `executive` |
| "Data Engineer", "Data Scientist", "Analyst" | `data` |
| "Security Engineer", "Security Researcher" | `security` |
| "Strategy", "Chief of Staff" | `strategy` |
| "Writer", "Content", "Technical Writer" | `content` |

### Special Cases

- **Research Engineer** → `research` (primary focus is research)
- **ML Engineer** → `engineering` (primary focus is engineering)
- **Security Engineer** → `security` (specialized)
- **DevOps/SRE** → `engineering` (infrastructure engineering)
- **Product Designer** → `design`
- **Growth Engineer** → `engineering` (technical growth)
- **Growth Marketer** → `marketing` (non-technical growth)
