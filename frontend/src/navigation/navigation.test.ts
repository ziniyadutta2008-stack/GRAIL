import { primaryNavFor, PRIMARY_NAV, SYSTEM_TABS } from './navigation'

describe('primary navigation', () => {
  it('never exceeds seven persistent items', () => {
    expect(PRIMARY_NAV.length).toBeLessThanOrEqual(7)
  })

  it('matches the CLAUDE.md order exactly', () => {
    expect(PRIMARY_NAV.map((item) => item.label)).toEqual([
      'Overview',
      'AI Estate',
      'Assess and Control',
      'Actions',
      'Decisions',
      'Reports and Audit',
      'Administration',
    ])
  })

  it('omits Administration for the read-only reviewer', () => {
    expect(primaryNavFor('read_only_reviewer').map((item) => item.label)).not.toContain('Administration')
    expect(primaryNavFor('read_only_reviewer')).toHaveLength(6)
    expect(primaryNavFor('governance_lead')).toHaveLength(7)
  })

  it('defines the contextual AI system tabs including Ethics and data', () => {
    expect(SYSTEM_TABS.map((tab) => tab.label)).toEqual([
      'Overview',
      'RACI',
      'Assessments',
      'Controls and Evidence',
      'Findings and Actions',
      'Ethics and data',
      'Exceptions',
      'Activity',
    ])
  })
})
