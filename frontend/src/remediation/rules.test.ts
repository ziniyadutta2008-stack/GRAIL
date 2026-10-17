import { describe, expect, it } from 'vitest'

import { evidenceDraftError, type EvidenceDraft } from '../evidence/store'
import { canValidateClosure, nextStatuses } from './rules'

const draft: EvidenceDraft = {
  subjectId: 'iso-fg-A.7.2',
  title: 'Impact assessment extract',
  owner: 'Elena Petrova',
  classification: 'Restricted',
  source: 'FinanceGuard portfolio, page 4',
  collectedOn: '2026-10-01',
  validFrom: '2026-10-01',
  expiresOn: '2027-01-15',
  reference: 'https://example.internal/impact',
  fileName: '',
  testProcedure: 'Read the attached extract against the control.',
  sample: 'One system, FinanceGuard AI.',
  submittedBy: 'Elena Petrova',
}

describe('evidence and closure rules', () => {
  it('requires the evidence fields and withholds closure until evidence is accepted', () => {
    expect(evidenceDraftError(draft)).toBe('')
    expect(evidenceDraftError({ ...draft, reference: '', fileName: '' })).toMatch(/link or choose a file/)
    expect(evidenceDraftError({ ...draft, fileName: 'notes.exe' })).toMatch(/PDF, DOCX/)
    expect(nextStatuses('In Progress', false)).toEqual(['Blocked'])
    expect(nextStatuses('In Progress', true)).toEqual(['Blocked', 'Ready for Validation'])
    expect(canValidateClosure('system_owner', 'High')).toBe(false)
    expect(canValidateClosure('internal_audit', 'Critical')).toBe(true)
    expect(canValidateClosure('governance_lead', 'High')).toBe(false)
    expect(canValidateClosure('governance_lead', 'Medium')).toBe(true)
  })
})
