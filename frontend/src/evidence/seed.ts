import type { EvidenceItem } from './store'

const VERSION_TWO =
  'Synthetic demonstration extract. FinanceGuard AI impact assessment, approved version.'
const VERSION_ONE =
  'Synthetic demonstration extract. FinanceGuard AI impact assessment, version 1.'

/** SHA-256 of the version 2 extract. Recheck compares this value with the same text. */
export const SEEDED_EVIDENCE_SHA256 = 'e5033cb1a1babdb3f03bd03245546d2365053652e569e1c543a42f6ae1f60c96'
const VERSION_ONE_SHA256 = '9d73d02af5fdde1274c30002bfbfd15fbe23fdf872671a3bc81042d49baefb3e'

const SUBJECT = 'iso-fg-A.7.2'

function previewHref(text: string): string {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
}

/**
 * Completed synthetic evidence for FinanceGuard A.7.2.
 * Version 2 is current. Version 1 is superseded. This is demonstration data.
 */
export const SEEDED_EVIDENCE: EvidenceItem[] = [
  {
    id: 'EVD-0001',
    subjectId: SUBJECT,
    title: 'Completed business-impact extract',
    owner: 'Elena Petrova',
    classification: 'Restricted',
    source: 'FinanceGuard portfolio, approved extract',
    collectedOn: '2026-10-01',
    validFrom: '2026-10-02',
    expiresOn: '2027-04-30',
    reference: '',
    fileName: 'impact-assessment-v2.txt',
    contentSha256: SEEDED_EVIDENCE_SHA256,
    version: 2,
    storageKey: 'quarantine/iso-fg-A.7.2/EVD-0001/v2/impact-assessment-v2.txt',
    previewHref: previewHref(VERSION_TWO),
    objectPreview: VERSION_TWO,
    supersededBy: '',
    supersedes: 'EVD-0001-v1',
    integrityResult: 'Verified',
    validationResult: 'Validated',
    validator: 'Lucas Meyer',
    linkedGate: 'FinanceGuard AI — Conditional Go',
    linkedFinding: 'GAP-01',
    testProcedure: 'Compare the approved extract with the A.7.2 control objective and the linked finding.',
    sample: 'FinanceGuard AI, one system. Synthetic demonstration data.',
    designEffectiveness: 'Effective',
    operatingEffectiveness: 'Effective',
    state: 'Accepted',
    lifecycle: 'Approved',
    validatedAt: '2026-10-02T15:10:00Z',
    submittedBy: 'Elena Petrova',
    submittedOn: '2026-10-01',
    reviews: [
      {
        status: 'Accepted',
        comments: 'Design and operating effectiveness are both Effective. This demonstration review does not attest the control.',
        actor: 'Lucas Meyer',
        at: '2026-10-02',
      },
    ],
    auditEvents: [
      { at: '2026-10-01T09:00:00Z', action: 'Uploaded', actor: 'Elena Petrova', detail: 'Version 2 extract received.' },
      { at: '2026-10-01T09:01:00Z', action: 'Quarantined', actor: 'Evidence service', detail: 'Object placed under the quarantine prefix. The preview keeps this copy in the browser. The deployed service uses the encrypted evidence bucket.' },
      { at: '2026-10-01T09:05:00Z', action: 'Scanned', actor: 'Evidence service', detail: 'Malware scan recorded for this synthetic object. The portfolio preview does not run a live scanner.' },
      { at: '2026-10-01T09:06:00Z', action: 'Integrity verified', actor: 'Evidence service', detail: `SHA-256 ${SEEDED_EVIDENCE_SHA256} matches the stored extract.` },
      { at: '2026-10-01T11:00:00Z', action: 'Under review', actor: 'Elena Petrova', detail: 'Submitted for independent review.' },
      { at: '2026-10-02T15:10:00Z', action: 'Approved', actor: 'Lucas Meyer', detail: 'Reviewer accepted version 2. Acceptance does not mark the control Implemented.' },
    ],
  },
  {
    id: 'EVD-0001-v1',
    subjectId: SUBJECT,
    title: 'Business-impact extract, first version',
    owner: 'Elena Petrova',
    classification: 'Restricted',
    source: 'FinanceGuard portfolio, first extract',
    collectedOn: '2026-08-01',
    validFrom: '2026-08-01',
    expiresOn: '2026-09-30',
    reference: '',
    fileName: 'impact-assessment-v1.txt',
    contentSha256: VERSION_ONE_SHA256,
    version: 1,
    storageKey: 'quarantine/iso-fg-A.7.2/EVD-0001/v1/impact-assessment-v1.txt',
    previewHref: previewHref(VERSION_ONE),
    objectPreview: VERSION_ONE,
    supersededBy: 'EVD-0001',
    supersedes: '',
    integrityResult: 'Verified',
    validationResult: 'Validated',
    validator: 'Lucas Meyer',
    linkedGate: 'FinanceGuard AI — Conditional Go',
    linkedFinding: 'GAP-01',
    testProcedure: 'Compare the first extract with the A.7.2 control objective.',
    sample: 'FinanceGuard AI, one system. Synthetic demonstration data.',
    designEffectiveness: 'Effective',
    operatingEffectiveness: 'Effective',
    state: 'Accepted',
    lifecycle: 'Superseded',
    validatedAt: '2026-08-12T10:00:00Z',
    submittedBy: 'Elena Petrova',
    submittedOn: '2026-08-01',
    reviews: [
      {
        status: 'Accepted',
        comments: 'Accepted, then replaced by version 2.',
        actor: 'Lucas Meyer',
        at: '2026-08-12',
      },
    ],
    auditEvents: [
      { at: '2026-08-01T09:00:00Z', action: 'Uploaded', actor: 'Elena Petrova', detail: 'Version 1 extract received.' },
      { at: '2026-08-01T09:01:00Z', action: 'Quarantined', actor: 'Evidence service', detail: 'Object placed under the quarantine prefix.' },
      { at: '2026-08-01T09:05:00Z', action: 'Scanned', actor: 'Evidence service', detail: 'Scan recorded for this synthetic object.' },
      { at: '2026-08-01T09:06:00Z', action: 'Integrity verified', actor: 'Evidence service', detail: `SHA-256 ${VERSION_ONE_SHA256} matches the stored extract.` },
      { at: '2026-08-12T10:00:00Z', action: 'Approved', actor: 'Lucas Meyer', detail: 'Reviewer accepted version 1.' },
      { at: '2026-09-30T00:00:00Z', action: 'Expired', actor: 'Evidence service', detail: 'Version 1 passed its expiry date.' },
      { at: '2026-10-02T15:10:00Z', action: 'Superseded', actor: 'Elena Petrova', detail: 'Superseded by EVD-0001 version 2. This record is not the authoritative version.' },
    ],
  },
]
