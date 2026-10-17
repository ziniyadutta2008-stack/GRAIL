/**
 * Organization-authored readiness scope for two AICPA Trust Services Criteria categories.
 * The criteria text is not reproduced. This is not a SOC 2 examination.
 */

export const AICPA_TSC_SOURCE = {
  publisher: 'American Institute of Certified Public Accountants (AICPA)',
  title: '2017 Trust Services Criteria, with revised points of focus (2022)',
  url: 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
} as const

export interface Soc2CriterionLike {
  criterion_id: string
  name: string
  note: string
  result: string
}

export type TscCategory = 'Security' | 'Confidentiality'

export function tscCategory(criterion: Pick<Soc2CriterionLike, 'criterion_id' | 'name'>): TscCategory {
  const text = `${criterion.criterion_id} ${criterion.name}`
  if (/^C\d/i.test(criterion.criterion_id) || /confidential|retention|disposal/i.test(text)) return 'Confidentiality'
  return 'Security'
}

export interface ReadinessTheme {
  id: string
  title: string
  category: TscCategory
  pattern: RegExp
}

/** Security is the Common Criteria. These are the readiness themes, not reproduced AICPA points of focus. */
export const SECURITY_THEMES: ReadinessTheme[] = [
  { id: 'access', category: 'Security', title: 'Access management', pattern: /access/i },
  { id: 'crypto', category: 'Security', title: 'Cryptographic protection', pattern: /encrypt|cryptograph/i },
  { id: 'tls', category: 'Security', title: 'Transport layer security protocol documentation', pattern: /\btls\b|transmission|transport layer/i },
  { id: 'monitor', category: 'Security', title: 'System monitoring', pattern: /monitor/i },
  { id: 'incident', category: 'Security', title: 'Incident response', pattern: /incident/i },
]

/** Confidentiality (C). The four rows are this organization's data-lifecycle themes under that category. */
export const CONFIDENTIALITY_THEMES: ReadinessTheme[] = [
  { id: 'model-log', category: 'Confidentiality', title: 'Model access logging', pattern: /model access|access log/i },
  { id: 'pipeline', category: 'Confidentiality', title: 'Data pipeline integrity', pattern: /pipeline/i },
  { id: 'inference', category: 'Confidentiality', title: 'Inference endpoint monitoring', pattern: /inference endpoint/i },
  { id: 'privileged', category: 'Confidentiality', title: 'Privileged access governance', pattern: /privileged access/i },
]

export function criteriaForTheme(criteria: Soc2CriterionLike[], theme: ReadinessTheme): Soc2CriterionLike[] {
  return criteria.filter((criterion) => theme.pattern.test(`${criterion.criterion_id} ${criterion.name} ${criterion.note}`))
}

export const EVIDENCE_CHECKS = [
  'Timestamp validity',
  'Scope coverage',
  'System identification and traceability',
  'Chain of custody',
] as const

export const EVIDENCE_TYPES = [
  {
    id: 'configuration-screenshot',
    name: 'Configuration screenshot',
    mustShow: 'The system context and a timestamp',
  },
  {
    id: 'log-export',
    name: 'Log export',
    mustShow: 'User access attempts',
  },
] as const

export interface EvidenceSampleCheck {
  check: (typeof EVIDENCE_CHECKS)[number]
  reading: string
}

export interface EvidenceSample {
  id: (typeof EVIDENCE_TYPES)[number]['id']
  title: string
  notice: string
  fields: { label: string; value: string }[]
  attempts?: { at: string; actor: string; attempt: string; result: string; system: string }[]
  checks: EvidenceSampleCheck[]
}

/**
 * Illustration of the two evidence types. These rows are not attached to a system
 * and have not been tested. They do not support a Pass, Drift, or Fail result.
 */
export const EVIDENCE_SAMPLES: EvidenceSample[] = [
  {
    id: 'configuration-screenshot',
    title: 'Sample configuration screenshot',
    notice: 'Synthetic demonstration. No image file is stored, and this sample is not attached to FinanceGuard AI.',
    fields: [
      { label: 'System', value: 'FinanceGuard AI (financeguard-ai)' },
      { label: 'Context', value: 'Production inference service. The frame would show TLS minimum 1.2 and encryption at rest enabled.' },
      { label: 'Timestamp', value: '2026-10-17T09:14:22Z' },
      { label: 'Captured by', value: 'Elena Petrova, Control Owner' },
      { label: 'Reference', value: 'EV-SAMPLE-CONFIG' },
    ],
    checks: [
      { check: 'Timestamp validity', reading: 'The capture time is the demonstration data-as-of date, 2026-10-17.' },
      { check: 'Scope coverage', reading: 'The frame would name this inference service only, not a neighbouring system.' },
      { check: 'System identification and traceability', reading: 'The system identifier financeguard-ai would be visible in the frame.' },
      { check: 'Chain of custody', reading: 'Collector, time, and reference travel with the record. This sample has no file to custody.' },
    ],
  },
  {
    id: 'log-export',
    title: 'Sample log export',
    notice: 'Synthetic demonstration of user access attempts. This export is not attached to FinanceGuard AI and has not been tested.',
    fields: [
      { label: 'System', value: 'FinanceGuard AI (financeguard-ai)' },
      { label: 'Export window', value: '2026-10-16T00:00:00Z to 2026-10-17T00:00:00Z' },
      { label: 'Exported by', value: 'Samuel Brooks, Security Reviewer' },
      { label: 'Reference', value: 'EV-SAMPLE-LOG' },
    ],
    attempts: [
      { at: '2026-10-16T14:02:11Z', actor: 'analyst.north', attempt: 'Sign-in', result: 'Allowed', system: 'financeguard-ai' },
      { at: '2026-10-16T14:06:40Z', actor: 'unknown', attempt: 'Sign-in', result: 'Denied', system: 'financeguard-ai' },
      { at: '2026-10-16T18:22:03Z', actor: 'svc-inference', attempt: 'Model invoke', result: 'Allowed', system: 'financeguard-ai' },
    ],
    checks: [
      { check: 'Timestamp validity', reading: 'Each attempt has a UTC timestamp inside the stated export window.' },
      { check: 'Scope coverage', reading: 'The export is limited to sign-in and model invoke for this system.' },
      { check: 'System identification and traceability', reading: 'Every row names financeguard-ai.' },
      { check: 'Chain of custody', reading: 'The exporter and the reference would stay with the file. This sample has no file.' },
    ],
  },
]

/** A criterion is supported only when one of the two evidence types is actually attached. Notes are not that evidence. */
export function evidenceStatus(): 'Not attached' {
  return 'Not attached'
}
