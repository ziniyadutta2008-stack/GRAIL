/**
 * Read the model-owner workbook into the intake form.
 * System assessment and proposed risk tier are never copied from the file.
 */

import { readSheet } from 'read-excel-file/universal'

import type { IntakeAnswers } from './assess'

export const OWNER_FIELD_MAP = {
  system_name: 'systemName',
  identifier: 'identifier',
  problem_statement: 'problemStatement',
  goals: 'goals',
  expected_outputs: 'expectedOutputs',
  data_inputs: 'dataInputs',
  users: 'users',
  vendor: 'vendor',
  deployment: 'deployment',
  deployment_geography: 'geography',
  autonomy: 'autonomy',
  human_oversight: 'humanOversight',
  technology: 'technology',
  affected_groups: 'affectedGroups',
  vulnerable_groups: 'vulnerableGroups',
  wrong_decision_cost: 'wrongDecisionCost',
  success_metrics: 'successMetrics',
  process_owners: 'processOwners',
  prohibited_uses: 'prohibitedUses',
  foreseeable_use: 'foreseeableUse',
} as const

const LEAD_ONLY_KEYS = new Set(['system_assessment', 'proposed_tier', 'proposed_risk_tier', 'risk_tier'])
const KEY_HEADERS = new Set(['field_key', 'key'])
const ANSWER_HEADERS = new Set(['model_owner_answer', 'answer'])

export class WorkbookFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkbookFormatError'
  }
}

export interface WorkbookImport {
  intake: IntakeAnswers
  filledFields: string[]
  ignoredLeadFields: string[]
}

type OwnerField = (typeof OWNER_FIELD_MAP)[keyof typeof OWNER_FIELD_MAP]

export function applyWorkbookRows(rows: unknown[][], current: IntakeAnswers): WorkbookImport {
  const headerIndex = rows.findIndex((row) => row.some((cell) => KEY_HEADERS.has(normaliseKey(cellText(cell)))))
  if (headerIndex < 0) {
    throw new WorkbookFormatError('The workbook needs a field_key column. Use the GRAIL template.')
  }
  const header = rows[headerIndex] ?? []
  const keyIndex = header.findIndex((cell) => KEY_HEADERS.has(normaliseKey(cellText(cell))))
  const answerIndex = header.findIndex((cell) => ANSWER_HEADERS.has(normaliseKey(cellText(cell))))
  if (answerIndex < 0) {
    throw new WorkbookFormatError('The workbook needs a model_owner_answer column. Use the GRAIL template.')
  }
  const intake: IntakeAnswers = { ...current }
  const filledFields: string[] = []
  const ignoredLeadFields: string[] = []
  for (const row of rows.slice(headerIndex + 1)) {
    const key = normaliseKey(cellText(row[keyIndex]))
    const answer = cellText(row[answerIndex])
    if (!key) continue
    if (LEAD_ONLY_KEYS.has(key)) {
      if (answer) ignoredLeadFields.push(key)
      continue
    }
    const field = OWNER_FIELD_MAP[key as keyof typeof OWNER_FIELD_MAP]
    if (!field || !answer) continue
    intake[field] = answer
    filledFields.push(field)
  }
  if (filledFields.length === 0) {
    throw new WorkbookFormatError('The workbook has no model-owner answers to read.')
  }
  return { intake, filledFields, ignoredLeadFields }
}

export async function readWorkbook(file: File, current: IntakeAnswers): Promise<WorkbookImport> {
  let rows: unknown[][]
  try {
    rows = await readSheet(file)
  } catch {
    throw new WorkbookFormatError('GRAIL could not read this file. Use the .xlsx template.')
  }
  return applyWorkbookRows(rows, current)
}

export async function readSampleWorkbook(current: IntakeAnswers): Promise<WorkbookImport> {
  const response = await fetch('/templates/grail-governance-intake-sample.xlsx')
  if (!response.ok) throw new WorkbookFormatError('The sample workbook is not available on this site.')
  const blob = await response.blob()
  return readWorkbook(new File([blob], 'grail-governance-intake-sample.xlsx'), current)
}

function normaliseKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function cellText(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).trim()
}

export type { OwnerField }
