import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import type { IntakeAnswers } from './assess'
import { applyWorkbookRows, readWorkbook } from './workbook'

const empty: IntakeAnswers = {
  systemName: '',
  identifier: '',
  problemStatement: '',
  goals: '',
  expectedOutputs: '',
  dataInputs: '',
  users: '',
  vendor: '',
  deployment: '',
  autonomy: '',
  humanOversight: '',
  technology: '',
  affectedGroups: '',
  vulnerableGroups: '',
  wrongDecisionCost: '',
  successMetrics: '',
  processOwners: '',
  systemAssessment: 'Narrow Internal Support Tool',
  proposedTier: 'High',
}

describe('model-owner workbook', () => {
  it('fills owner fields and leaves the governance lead classification unchanged', async () => {
    const samplePath = resolve(process.cwd(), 'public/templates/grail-governance-intake-sample.xlsx')
    const file = new File([readFileSync(samplePath)], 'grail-governance-intake-sample.xlsx')
    const imported = await readWorkbook(file, empty)
    expect(imported.intake.systemName).toBe('Claims helper')
    expect(imported.intake.identifier).toBe('CLAIMS-HELPER')
    expect(imported.intake.vendor).toContain('Northwind')
    expect(imported.intake.humanOversight).toContain('analyst reviews')
    expect(imported.intake.prohibitedUses).toContain('Must not decline a claim')
    expect(imported.intake.foreseeableUse).toContain('decline a claim')
    expect(imported.intake.systemAssessment).toBe('Narrow Internal Support Tool')
    expect(imported.intake.proposedTier).toBe('High')
    expect(imported.ignoredLeadFields).toEqual([])
  })

  it('ignores a proposed tier that a model owner added to the sheet', () => {
    const imported = applyWorkbookRows(
      [
        ['field_key', 'field_label', 'model_owner_answer'],
        ['system_name', 'System name', 'Queue helper'],
        ['proposed_tier', 'Proposed risk tier', 'Low'],
        ['system_assessment', 'System assessment', 'Workflow Automation System'],
      ],
      empty,
    )
    expect(imported.intake.systemName).toBe('Queue helper')
    expect(imported.intake.proposedTier).toBe('High')
    expect(imported.intake.systemAssessment).toBe('Narrow Internal Support Tool')
    expect(imported.ignoredLeadFields).toEqual(['proposed_tier', 'system_assessment'])
  })
})
