import { useRetirement } from '../actions/retirementStore'
import { useOrganization } from '../auth/organizationName'
import { useAuth } from '../auth/AuthContext'
import { assessmentsFor } from '../assessments/catalog'
import {
  actions,
  auditRecords,
  exceptionRecords,
  findingRecords,
  isoRecords,
  raciMatrices,
  soc2Records,
  systemById,
  systemModelOwner,
} from '../demo/demoData'
import { assessApplicability, subjectFromIntake, subjectFromRecord } from '../frameworks/applicability'
import { lifecycleFor, type LifecycleSubject } from '../lifecycle/model'
import { useRegistry } from '../intake/registry'
import { downloadGovernanceReport, type GovernancePortfolio } from './governancePortfolio'

/** Downloads an HTML governance portfolio for one AI system. It does not approve anything. */
export function GovernanceReportButton({ systemId, name, compact = false }: { systemId: string; name?: string; compact?: boolean }) {
  const { name: organization } = useOrganization()
  const { session } = useAuth()
  const { registrations, packages, reviewOverrides } = useRegistry()
  const { hidden } = useRetirement()
  const label = name ? `Download governance report for ${name}` : 'Download governance report'

  const download = () => {
    const portfolio = buildPortfolio({
      systemId,
      organization,
      preparedBy: session?.persona.display_name || 'Named preparer',
      registration: registrations.find((item) => item.id === systemId),
      pack: packages.find((item) => item.systemId === systemId),
      nextReview: reviewOverrides[systemId]?.nextReview,
    })
    if (!portfolio) return
    downloadGovernanceReport({
      ...portfolio,
      findings: portfolio.findings.filter((row) => !hidden(row.cells[0] ?? '')),
      actions: portfolio.actions.filter((row) => !hidden(row.cells[0] ?? '')),
    })
  }

  return (
    <button type="button" className="button button-secondary" aria-label={label} onClick={download}>
      {compact ? 'Download' : 'Download governance report'}
    </button>
  )
}

function buildPortfolio(input: {
  systemId: string
  organization: string
  preparedBy: string
  registration: ReturnType<typeof useRegistry>['registrations'][number] | undefined
  pack: ReturnType<typeof useRegistry>['packages'][number] | undefined
  nextReview: string | undefined
}): GovernancePortfolio | null {
  const seeded = systemById(input.systemId)
  if (seeded) {
    const subject: LifecycleSubject = seeded
    const raci = raciMatrices.find((matrix) => matrix.ai_system_id === seeded.id)
    const soc = soc2Records.find((item) => item.ai_system_id === seeded.id)
    const findings = findingRecords.filter((item) => item.ai_system_id === seeded.id)
    const related = new Set([seeded.id, raci?.id, ...findings.map((item) => item.id), ...exceptionRecords.filter((item) => item.ai_system_id === seeded.id).map((item) => item.id)].filter(Boolean) as string[])
    return {
      organization: input.organization,
      preparedBy: input.preparedBy,
      systemId: seeded.id,
      identifier: seeded.identifier,
      name: seeded.name,
      description: seeded.description,
      lifecycle: seeded.lifecycle_state,
      gate: seeded.gate,
      gateScope: seeded.gate_scope,
      gateReason: seeded.gate_reason,
      materiality: seeded.materiality,
      owner: systemModelOwner(seeded),
      vendor: seeded.vendor,
      model: seeded.model_type,
      deployment: seeded.deployment,
      users: seeded.users.join('; '),
      data: seeded.data_categories.join('; '),
      sensitivity: seeded.sensitivity,
      intended: seeded.intended_uses.join('; '),
      prohibited: seeded.prohibited_uses.join('; '),
      oversight: seeded.human_oversight,
      decisions: seeded.automated_decisions,
      lastReview: seeded.last_review,
      nextReview: input.nextReview ?? seeded.next_review,
      lawSummary: assessApplicability(subjectFromRecord(seeded)).summary,
      laws: assessApplicability(subjectFromRecord(seeded)).assessed.map((item) => ({ cells: [item.name, item.jurisdiction, item.outcome, item.rationale] })),
      stages: lifecycleFor(subject),
      findings: findings.map((item) => ({ cells: [item.id, item.severity, item.title, item.status, item.owner] })),
      actions: actions.filter((item) => item.ai_system_id === seeded.id).map((item) => ({ cells: [item.id, item.title, item.status, item.due_date, item.owner] })),
      controls: isoRecords.filter((item) => item.ai_system_id === seeded.id).map((item) => ({ cells: [item.control_ref, item.control_title, item.status, item.owner, item.evidence_note] })),
      soc2Recommendation: soc?.expected_recommendation ?? '',
      soc2: soc?.criteria.map((item) => ({ cells: [item.criterion_id, item.name, item.result, item.note] })) ?? [],
      raciTitle: raci?.title ?? '',
      raciStatus: raci ? `Version ${raci.version}, ${raci.status}` : '',
      raciTasks: raci?.tasks.map((task) => ({ cells: [task.name, accountable(task.assignments)] })) ?? [],
      exceptions: exceptionRecords.filter((item) => item.ai_system_id === seeded.id).map((item) => ({ cells: [item.id, item.title, item.decision, item.state, item.expiry_date ?? 'None'] })),
      assessments: assessmentsFor(seeded).map((item) => ({ cells: [item.title, item.version, item.status, item.reviewer, item.dueDate] })),
      audit: auditRecords.filter((item) => related.has(item.entity_id)).map((item) => ({ cells: [item.occurred_at, item.action, item.entity_id, item.reason] })),
    }
  }

  const registration = input.registration
  if (!registration) return null
  const intake = registration.intake
  const subject: LifecycleSubject = {
    id: registration.id,
    name: intake.systemName,
    gate: registration.gate,
    gate_reason: registration.gateReason,
    lifecycle_state: 'Registered',
    business_owner: intake.processOwners || registration.updatedBy,
    model_owner: intake.processOwners || registration.updatedBy,
    intended_uses: [intake.expectedOutputs].filter(Boolean),
    prohibited_uses: intake.prohibitedUses?.trim() ? [intake.prohibitedUses.trim()] : [],
    users: [intake.users].filter(Boolean),
    data_categories: [intake.dataInputs].filter(Boolean),
    deployment: intake.deployment,
    materiality: registration.suggestion.suggestedTier,
    human_oversight: intake.humanOversight,
    model_type: intake.technology,
    next_review: input.nextReview ?? registration.nextReview,
  }
  const laws = assessApplicability(subjectFromIntake(intake, registration.impact))
  const pack = input.pack
  return {
    organization: input.organization,
    preparedBy: input.preparedBy,
    systemId: registration.id,
    identifier: intake.identifier || registration.id,
    name: intake.systemName || 'Unnamed system',
    description: intake.problemStatement,
    lifecycle: 'Registered',
    gate: registration.gate,
    gateScope: 'Registration gate',
    gateReason: registration.gateReason,
    materiality: registration.suggestion.suggestedTier,
    owner: subject.business_owner,
    vendor: intake.vendor,
    model: intake.technology,
    deployment: intake.deployment,
    users: intake.users,
    data: intake.dataInputs,
    sensitivity: 'Recorded on the intake',
    intended: intake.expectedOutputs,
    prohibited: intake.prohibitedUses?.trim() || intake.prohibitedUseCondition?.trim() || '',
    oversight: intake.humanOversight,
    decisions: intake.autonomy,
    lastReview: registration.lastReview,
    nextReview: subject.next_review,
    lawSummary: laws.summary,
    laws: laws.assessed.map((item) => ({ cells: [item.name, item.jurisdiction, item.outcome, item.rationale] })),
    stages: lifecycleFor(subject),
    findings: (pack?.findings ?? []).map((item) => ({ cells: [item.id, item.severity, item.title, item.status, item.owner] })),
    actions: (pack?.actions ?? []).map((item) => ({ cells: [item.id, item.title, item.status, item.due_date, item.owner] })),
    controls: (pack?.iso ?? []).map((item) => ({ cells: [item.control_ref, item.control_title, item.status, item.owner, item.evidence_note] })),
    soc2Recommendation: pack?.soc2.expected_recommendation ?? '',
    soc2: pack?.soc2.criteria.map((item) => ({ cells: [item.criterion_id, item.name, item.result, item.note] })) ?? [],
    raciTitle: '',
    raciStatus: 'Not recorded',
    raciTasks: [],
    exceptions: [],
    assessments: [],
    audit: [],
  }
}

function accountable(assignments: Record<string, string>): string {
  const match = Object.entries(assignments).find(([, code]) => code === 'A')
  return match?.[0] ?? 'Not recorded'
}
