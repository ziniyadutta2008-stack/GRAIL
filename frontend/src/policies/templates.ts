/**
 * Fill-in policy templates. They are organization starting points, not a certified policy,
 * a legal opinion, or a copy of a standard.
 */

export interface PolicyTemplateSection {
  heading: string
  prompt: string
}

export interface PolicyTemplate {
  id: string
  industry: string
  title: string
  reference: string
  appliesTo: string
  sections: PolicyTemplateSection[]
}

const COMMON: PolicyTemplateSection[] = [
  { heading: 'Purpose', prompt: 'State why this policy exists and which decision it governs.' },
  { heading: 'Scope', prompt: 'Name the AI system, the environments, and what is out of scope.' },
  { heading: 'Access and authorization', prompt: 'Who may use, administer, or change the system, and how access is removed.' },
  { heading: 'Monitoring', prompt: 'What is logged, who reviews it, and which threshold opens a review.' },
  { heading: 'Incident response', prompt: 'How an AI security incident is classified, who is told, and what evidence is kept.' },
  { heading: 'Model change and rollback', prompt: 'What counts as a material change, who approves it, and how a release is rolled back.' },
  { heading: 'Inference data', prompt: 'What data may be sent at inference time, how long it is kept, and what must not be sent.' },
  { heading: 'Roles', prompt: 'Name the owner, the accountable executive, and the reviewer. One person is accountable.' },
  { heading: 'Enforcement', prompt: 'What happens if the policy is not followed. Legal review of enforcement may still be open.' },
  { heading: 'Assumptions', prompt: 'List anything this policy assumes and has not evidenced.' },
]

const CHARTER: PolicyTemplateSection[] = [
  { heading: 'Purpose', prompt: 'State why the organization governs AI and what decision this charter authorises.' },
  { heading: 'Scope', prompt: 'Name the departments, AI systems, and uses inside the charter, and what remains outside it.' },
  { heading: 'Authority', prompt: 'State who may approve a material exception, a charter change, and a launch gate. The charter does not approve a system by itself.' },
  { heading: 'Membership', prompt: 'Name the executive sponsor, the AI Governance Lead, and the standing members. One person is accountable.' },
  { heading: 'Review cadence', prompt: 'State how often the charter is reviewed, and the date of the next review.' },
  { heading: 'Review triggers', prompt: 'State which events require a review before the next scheduled date, such as a critical KPI breach, scope expansion, restructuring, an audit finding, or a framework change.' },
  { heading: 'Operating-model change', prompt: 'State how a proposed change to roles, thresholds, or scope is recorded, who decides it, and the due date.' },
  { heading: 'Sign-off', prompt: 'Name the executive approver. An approved charter is a new version. It is not overwritten in place.' },
  { heading: 'Assumptions', prompt: 'List anything this charter assumes and has not evidenced.' },
]

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'charter',
    industry: 'All industries',
    title: 'AI Governance Charter',
    reference: 'POL-CHARTER',
    appliesTo: 'Every industry. The same charter template covers purpose, scope, authority, membership, and review cadence.',
    sections: CHARTER,
  },
  {
    id: 'standard',
    industry: 'All industries',
    title: 'Standard AI security and monitoring policy',
    reference: 'POL-SEC-STD',
    appliesTo: 'Any AI system. Start here, then add an industry template when the use is specialised.',
    sections: COMMON,
  },
  {
    id: 'banking',
    industry: 'Banking and financial services',
    title: 'Banking AI model policy',
    reference: 'POL-BANK',
    appliesTo: 'Credit, claims, trading, insurance, or other consequential financial uses.',
    sections: [
      ...COMMON,
      { heading: 'Model inventory', prompt: 'Record the model tier, business use, and whether the model affects regulatory capital or a customer outcome.' },
      { heading: 'Human override', prompt: 'State the point at which a person must review a consequential financial output before it is used.' },
      { heading: 'Customer financial data', prompt: 'State the personal and financial data in scope, the retention period, and the disposal method.' },
      { heading: 'Prohibited use', prompt: 'State uses that are not allowed, such as an automated decline with no human review.' },
    ],
  },
  {
    id: 'healthcare',
    industry: 'Healthcare and clinical use',
    title: 'Healthcare AI policy',
    reference: 'POL-HEALTH',
    appliesTo: 'Diagnostic support, clinical triage, or any use of health data.',
    sections: [
      ...COMMON,
      { heading: 'Clinical oversight', prompt: 'Name the qualified clinician who must review a significant diagnostic output before it is acted on.' },
      { heading: 'Health data', prompt: 'State the health-data categories, the lawful purpose, and what is excluded from training and inference.' },
      { heading: 'Clinical incident', prompt: 'State how a harmful or misleading clinical output is escalated, including who is told beyond the security team.' },
      { heading: 'Prohibited use', prompt: 'State that the system must not diagnose or treat on its own unless a separate approved policy says otherwise.' },
    ],
  },
  {
    id: 'customer-service',
    industry: 'Customer service',
    title: 'Customer-facing AI policy',
    reference: 'POL-CUST',
    appliesTo: 'Chatbots and assistants that answer customers.',
    sections: [
      ...COMMON,
      { heading: 'Customer notice', prompt: 'State how the customer is told they are interacting with an AI system and how to reach a person.' },
      { heading: 'Escalation', prompt: 'State which topics must be handed to a person, including complaints, vulnerability, and account changes.' },
      { heading: 'Output limits', prompt: 'State what the assistant must not say, including legal, medical, or financial advice it is not approved to give.' },
    ],
  },
  {
    id: 'workplace',
    industry: 'Workplace and employee support',
    title: 'Workplace AI policy',
    reference: 'POL-WORK',
    appliesTo: 'Internal assistants used by employees.',
    sections: [
      ...COMMON,
      { heading: 'Acceptable use', prompt: 'State the work purposes that are allowed and the business units in scope.' },
      { heading: 'Employment decisions', prompt: 'State whether the system may be used for hiring, performance, or discipline. The default is that it may not.' },
      { heading: 'Employee data', prompt: 'State which employee data may be used and what must stay out of prompts.' },
    ],
  },
]

const PLACEHOLDER_OWNER = '[Name the policy owner]'

export function suggestedTemplateId(systemId: string): string {
  if (systemId === 'contoso-health-diagnostic-support') return 'healthcare'
  if (systemId === 'contoso-customer-assistant') return 'customer-service'
  if (systemId === 'copilot-employee-support') return 'workplace'
  if (systemId === 'financeguard-ai' || systemId === 'meridian-cs-assistant' || systemId === 'ai-analytics-service') return 'banking'
  return 'standard'
}

export function templateFileName(template: PolicyTemplate): string {
  return `grail-${template.reference.toLowerCase()}-template.md`
}

export function templateMarkdown(template: PolicyTemplate, context?: { systemName?: string; reference?: string }): string {
  const reference = context?.reference ?? `${template.reference}-[system identifier]`
  const system = context?.systemName ?? '[AI system name]'
  const lines = [
    '# GRAIL policy template',
    'Synthetic starting point. Fill the owner line and every Answer line. This is not a certified policy, an audit opinion, or legal advice.',
    '',
    `template_id: ${template.id}`,
    `reference: ${reference}`,
    `title: ${template.title}`,
    `industry: ${template.industry}`,
    `system: ${system}`,
    `owner: ${PLACEHOLDER_OWNER}`,
    '',
    template.appliesTo,
    '',
  ]
  for (const section of template.sections) {
    lines.push(`## ${section.heading}`, `Prompt: ${section.prompt}`, 'Answer:', '')
  }
  return lines.join('\n')
}

export interface CompletedTemplate {
  reference: string
  title: string
  owner: string
  industry: string
  body: string
  answers: string[]
}

/** Read a filled GRAIL template. Returns null when the owner, reference, or answers are still blank. */
export function readCompletedTemplate(text: string): CompletedTemplate | null {
  if (!/^template_id:/m.test(text)) return null
  const header = (key: string) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
    return match?.[1]?.trim() ?? ''
  }
  const reference = header('reference')
  const title = header('title')
  const owner = header('owner')
  const industry = header('industry')
  const answers = [...text.matchAll(/^Answer:\s*(.+)$/gm)].map((match) => match[1]?.trim() ?? '').filter((answer) => answer.length > 0 && !answer.startsWith('['))
  if (!reference || reference.includes('[') || !title || !owner || owner.includes('[') || answers.length === 0) return null
  return { reference, title, owner, industry, body: text, answers }
}

export function downloadPolicyTemplate(template: PolicyTemplate, context?: { systemName?: string; reference?: string }) {
  const markdown = templateMarkdown(template, context)
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = templateFileName(template)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
