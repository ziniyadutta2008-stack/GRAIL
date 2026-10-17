import { seedMatrices, type GovernanceMatrix, type RaciCode } from './model'
import { draftSignOff, validateMatrix } from './validate'
import { required } from '../test-utils'

function assign(matrix: GovernanceMatrix, taskIndex: number, codes: Record<string, RaciCode>): GovernanceMatrix {
  return {
    ...matrix,
    tasks: matrix.tasks.map((task, index) => (index === taskIndex ? { ...task, assignments: codes } : task)),
  }
}

describe('RACI accountability check', () => {
  it('accepts the FinanceGuard matrix and flags concentrated accountability', () => {
    const matrix = seedMatrices().find((item) => item.id === 'raci-financeguard')
    expect(matrix).toBeDefined()
    const result = validateMatrix(required(matrix))
    expect(result.canSubmit).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings.map((warning) => warning.message).join(' ')).toContain('Model Owner / Business Sponsor')
    const draft = draftSignOff(required(matrix), result)
    expect(draft).toContain('exactly one Accountable')
    expect(draft).toContain('Judgment calls')
    expect(draft).toContain('Model Owner / Business Sponsor')
    expect(draft).not.toContain('certification')
  })

  it('blocks a task that does not have exactly one Accountable and one Responsible party', () => {
    const matrix = seedMatrices()[0]
    expect(matrix).toBeDefined()
    const current = required(matrix)
    const cleared = Object.fromEntries(current.roles.map((role) => [role, role === current.roles[0] ? 'C' : (current.tasks[0]?.assignments[role] ?? '')])) as Record<string, RaciCode>
    const missingAccountable = validateMatrix(assign(current, 0, cleared))
    expect(missingAccountable.canSubmit).toBe(false)
    expect(missingAccountable.errors.some((error) => error.message.includes('exactly one Accountable'))).toBe(true)

    const onlyConsulted = Object.fromEntries(current.roles.map((role, index) => [role, index === 0 ? 'A' : 'C'])) as Record<string, RaciCode>
    const noResponsible = validateMatrix({ ...current, tasks: [{ ...required(current.tasks[0]), assignments: onlyConsulted }] })
    expect(noResponsible.errors.some((error) => error.message.includes('at least one Responsible'))).toBe(true)
  })
})
