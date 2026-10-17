import { describe, expect, it } from 'vitest'

import { pendingWork } from './retirement'

describe('pending work removed on discontinuation', () => {
  it('selects open findings, remediations, and incidents for that system only', () => {
    const removed = pendingWork(
      'financeguard-ai',
      [
        { id: 'GAP-01', systemId: 'financeguard-ai', status: 'Open' },
        { id: 'CH-GAP-1', systemId: 'contoso-health-diagnostic-support', status: 'Open' },
        { id: 'GAP-CLOSED', systemId: 'financeguard-ai', status: 'Closed' },
      ],
      [
        { id: 'RA-001', systemId: 'financeguard-ai', status: 'In Progress' },
        { id: 'RA-CLOSED', systemId: 'financeguard-ai', status: 'Closed' },
        { id: 'RA-ACCEPTED', systemId: 'financeguard-ai', status: 'Risk Accepted' },
        { id: 'RA-004', systemId: 'contoso-health-diagnostic-support', status: 'Open' },
      ],
      [
        { id: 'INC-1', systemId: 'financeguard-ai', status: 'Submitted' },
        { id: 'INC-2', systemId: 'financeguard-ai', status: 'Approved' },
        { id: 'INC-3', systemId: 'other', status: 'Submitted' },
      ],
    )
    expect(removed).toEqual({
      findingIds: ['GAP-01'],
      remediationIds: ['RA-001'],
      incidentIds: ['INC-1'],
    })
  })
})
