import { describe, expect, it } from 'vitest'

import { systemById } from '../demo/demoData'
import { assessmentsFor } from './catalog'

describe('assessment records', () => {
  it('gives FinanceGuard seven open assessments and does not approve any of them', () => {
    const system = systemById('financeguard-ai')
    expect(system).toBeDefined()
    if (!system) return
    const records = assessmentsFor(system)
    expect(records.map((record) => record.title)).toEqual([
      'AI impact assessment',
      'Privacy and DPIA screening',
      'Fundamental rights and affected-person assessment',
      'Model-risk assessment',
      'Security and threat assessment',
      'Vendor and third-party assessment',
      'Regulatory applicability classification',
    ])
    expect(records.every((record) => record.version === '1.0')).toBe(true)
    expect(records.every((record) => record.status === 'Draft' || record.status === 'In Review')).toBe(true)
    expect(records.find((record) => record.id.endsWith('-vendor'))?.status).toBe('Draft')
    expect(records.find((record) => record.id.endsWith('-dpia'))?.rationale).toMatch(/not a DPIA/)
    const regulatory = records.find((record) => record.id.endsWith('-regulatory'))
    expect(regulatory?.answers.find((answer) => answer.question === 'Geography used for the screen')?.answer).toBe('United Kingdom')
    expect(regulatory?.answers.map((answer) => answer.answer).join(' ')).toMatch(/does not classify/)
    expect(records.every((record) => record.evidence.every((item) => item.status === 'Not attached'))).toBe(true)
  })
})
