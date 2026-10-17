import { describe, expect, it } from 'vitest'
import { required } from '../test-utils'

import { systems } from '../demo/demoData'
import { GOVERNANCE_RAILS, lifecycleFor } from './model'

describe('AI and model lifecycle', () => {
  it('keeps FinanceGuard blocked at deployment readiness and does not invent engineering evidence', () => {
    const finance = systems.find((system) => system.id === 'financeguard-ai')
    expect(finance).toBeDefined()
    const stages = lifecycleFor(finance as NonNullable<typeof finance>)
    expect(stages.map((stage) => stage.title)).toEqual([
      'Intake and classification',
      'Data preparation and readiness',
      'Model development or configuration',
      'Testing and evaluation',
      'Independent validation',
      'Deployment readiness and approval',
      'Release and deployment',
      'Production monitoring and assurance',
      'Change and revalidation',
      'Retirement',
    ])
    const data = required(stages[1])
    expect(data.evidence.find((item) => item.label === 'Lineage')?.state).toBe('Missing')
    expect(data.evidence.find((item) => item.label === 'Lawful basis')?.state).toBe('Missing')
    expect(data.evidencePercent).toBe(0)
    expect(stages.filter((stage) => stage.status === 'In progress').length).toBeLessThanOrEqual(1)
    expect(stages[0]?.status).not.toBe('Approved')
    const readiness = required(stages[5])
    expect(readiness.status).toBe('Blocked')
    expect(readiness.blockingIssue).toContain('CC7.1')
    expect(readiness.evidencePercent).toBeLessThan(100)
    expect(stages[6]?.status).toBe('Not started')
    expect(stages[6]?.currentVersion).toBe('Not recorded')
    expect(GOVERNANCE_RAILS).toContain('RACI')
    expect(GOVERNANCE_RAILS).toContain('Audit trail')
  })
})