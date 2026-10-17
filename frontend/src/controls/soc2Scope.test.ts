import { describe, expect, it } from 'vitest'
import { required } from '../test-utils'

import { criteriaForTheme, evidenceStatus, tscCategory, CONFIDENTIALITY_THEMES, EVIDENCE_SAMPLES, EVIDENCE_TYPES, SECURITY_THEMES } from './soc2Scope'

const financeGuard = [
  { criterion_id: 'CC6.1', name: 'Security: access and transmission', result: 'Drift', note: 'TLS configuration and access samples not provided.' },
  { criterion_id: 'CC7.1', name: 'Confidentiality: data retention and disposal', result: 'Fail', note: 'No deletion logs or at-rest encryption configuration.' },
]

describe('SOC 2 Trust Services scope', () => {
  it('places Common Criteria in Security and retention in Confidentiality', () => {
    expect(tscCategory(required(financeGuard[0]))).toBe('Security')
    expect(tscCategory(required(financeGuard[1]))).toBe('Confidentiality')
    expect(tscCategory({ criterion_id: 'CC7.1', name: 'Encryption' })).toBe('Security')
  })

  it('matches recorded criteria to a theme and leaves unstated lifecycle themes empty', () => {
    const access = required(SECURITY_THEMES.find((theme) => theme.id === 'access'))
    const logging = required(CONFIDENTIALITY_THEMES.find((theme) => theme.id === 'model-log'))
    expect(criteriaForTheme(financeGuard, access).map((row) => row.criterion_id)).toEqual(['CC6.1'])
    expect(criteriaForTheme(financeGuard, logging)).toEqual([])
    expect(evidenceStatus()).toBe('Not attached')
  })

  it('illustrates both evidence types without treating the samples as attached', () => {
    expect(EVIDENCE_SAMPLES.map((sample) => sample.id)).toEqual(EVIDENCE_TYPES.map((item) => item.id))
    for (const sample of EVIDENCE_SAMPLES) {
      expect(sample.notice).toMatch(/not attached/i)
      expect(sample.checks.map((item) => item.check)).toEqual([
        'Timestamp validity',
        'Scope coverage',
        'System identification and traceability',
        'Chain of custody',
      ])
    }
    expect(EVIDENCE_SAMPLES[1]?.attempts).toHaveLength(3)
  })
})