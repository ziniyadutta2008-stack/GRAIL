import type { GovernanceMatrix, RaciCode } from './model'

export interface RaciIssue {
  message: string
  taskId?: string
  role?: string
}

export interface RaciValidation {
  errors: RaciIssue[]
  warnings: RaciIssue[]
  canSubmit: boolean
}

const MIN_TASKS_FOR_CONCENTRATION = 3
const ACCOUNTABLE_SHARE_LIMIT = 0.5
const OPERATING_SHARE_LIMIT = 0.75

function label(matrix: GovernanceMatrix, role: string): string {
  return matrix.role_labels[role] ?? role
}

function codesOf(task: GovernanceMatrix['tasks'][number]): RaciCode[] {
  return Object.values(task.assignments)
}

/** Exactly one A and at least one R on every task. Concentration warns and does not block. */
export function validateMatrix(matrix: GovernanceMatrix): RaciValidation {
  const errors: RaciIssue[] = []
  const warnings: RaciIssue[] = []
  if (matrix.tasks.length === 0) {
    errors.push({ message: 'The matrix has no tasks.' })
  }
  const known = new Set(matrix.roles)
  for (const task of matrix.tasks) {
    const unknown = Object.keys(task.assignments).filter((role) => !known.has(role))
    for (const role of unknown) errors.push({ message: `${task.name} uses an unknown stakeholder.`, taskId: task.id, role })
    const codes = codesOf(task).filter((code) => code !== '')
    if (codes.length === 0) errors.push({ message: `${task.name} has no assignments.`, taskId: task.id })
    const accountable = codes.filter((code) => code === 'A').length
    const responsible = codes.filter((code) => code === 'R').length
    if (accountable !== 1) {
      errors.push({ message: `${task.name} must have exactly one Accountable party; found ${accountable}.`, taskId: task.id })
    }
    if (responsible < 1) {
      errors.push({ message: `${task.name} must have at least one Responsible party.`, taskId: task.id })
    }
  }
  const used = new Set(matrix.tasks.flatMap((task) => matrix.roles.filter((role) => task.assignments[role])))
  for (const role of matrix.roles) {
    if (!used.has(role)) errors.push({ message: `${label(matrix, role)} has no assignments.`, role })
    if (!matrix.role_labels[role]?.trim()) errors.push({ message: 'Every stakeholder needs a name.', role })
  }

  const total = matrix.tasks.length
  if (total >= MIN_TASKS_FOR_CONCENTRATION) {
    for (const role of matrix.roles) {
      const codes = matrix.tasks.map((task) => task.assignments[role])
      const accountable = codes.filter((code) => code === 'A').length
      const operating = codes.filter((code) => code === 'A' || code === 'R').length
      const concentrated = accountable / total > ACCOUNTABLE_SHARE_LIMIT || (accountable >= 2 && operating / total > OPERATING_SHARE_LIMIT)
      if (concentrated) {
        warnings.push({
          role,
          message: `${label(matrix, role)} is Accountable for ${accountable} and operates ${operating} of ${total} tasks. Confirm that independent challenge exists.`,
        })
      }
    }
  }

  return { errors, warnings, canSubmit: errors.length === 0 }
}

/** Sign-off note for the Executive Approver. The governance lead edits it before it is sent. */
export function draftSignOff(matrix: GovernanceMatrix, validation: RaciValidation): string {
  const lines = [
    'To: Executive Approver',
    `Subject: Sign-off for ${matrix.title}`,
    '',
    'Accountability check. No model was called. This draft does not approve the matrix.',
    '',
  ]
  if (!validation.canSubmit) {
    lines.push('The matrix cannot be sent until every task has exactly one Accountable party and at least one Responsible party.')
    for (const error of validation.errors) lines.push(`- ${error.message}`)
    return lines.join('\n')
  }
  lines.push('Every task has exactly one Accountable party and at least one Responsible party.')
  lines.push('')
  lines.push('Assignments:')
  for (const task of matrix.tasks) {
    const accountable = matrix.roles.filter((role) => task.assignments[role] === 'A').map((role) => label(matrix, role))
    const responsible = matrix.roles.filter((role) => task.assignments[role] === 'R').map((role) => label(matrix, role))
    lines.push(`- ${task.name}: Accountable ${accountable.join(', ')}; Responsible ${responsible.join(', ')}.`)
  }
  lines.push('')
  lines.push('Judgment calls:')
  if (validation.warnings.length === 0) {
    lines.push('- No stakeholder holds an undue share of accountability. The approver can still ask for a change.')
  } else {
    for (const warning of validation.warnings) lines.push(`- ${warning.message}`)
  }
  if (matrix.memo_summary.trim()) {
    lines.push('')
    lines.push(`Recorded note: ${matrix.memo_summary.trim()}`)
  }
  lines.push('')
  lines.push('Please approve, reject, or return the matrix with comments. Approval is a named human action.')
  return lines.join('\n')
}
