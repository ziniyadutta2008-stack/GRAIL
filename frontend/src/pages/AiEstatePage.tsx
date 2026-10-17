import { Link } from 'react-router'

import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { NextReviewEditor } from '../components/NextReviewEditor'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { SyntheticNotice } from '../components/SyntheticNotice'
import { useAuth } from '../auth/AuthContext'
import { canMutateAiSystemRegister, canRegisterAiSystem } from '../auth/permissions'
import { systems, type AiSystem } from '../demo/demoData'
import { assessApplicability, subjectFromIntake, subjectFromRecord, type ApplicabilityReport } from '../frameworks/applicability'
import { useRetirement } from '../actions/retirementStore'
import { useRegistry, type Registration } from '../intake/registry'
import { GovernanceReportButton } from '../reports/GovernanceReportButton'

function lawsFor(id: string, registrations: Registration[], seeded: AiSystem[]): ApplicabilityReport {
  const registration = registrations.find((item) => item.id === id)
  if (registration) return assessApplicability(subjectFromIntake(registration.intake, registration.impact))
  const system = seeded.find((item) => item.id === id)
  if (system) return assessApplicability(subjectFromRecord(system))
  return assessApplicability({ deployment: '', geography: '', users: '', data: '', model: '', uses: '', oversight: '', decisions: '', materiality: '' })
}

interface EstateRow {
  id: string
  identifier: string
  name: string
  href: string
  lifecycle: string
  gate: string
  gateReason: string
  materiality: string
  lastReview: string
  updatedBy: string
  nextReview: string
  discontinued: boolean
}

export function AiEstatePage() {
  const { registrations, reviewOverrides, updateNextReview } = useRegistry()
  const { retireSystem } = useRetirement()
  const { session } = useAuth()
  const role = session?.persona.role
  const canRegister = canRegisterAiSystem(role)
  const canMutate = canMutateAiSystemRegister(role)
  const editorName = session?.persona.display_name || 'Model owner'
  const rows: EstateRow[] = [
    ...registrations.map((item) => {
      const override = reviewOverrides[item.id]
      return {
        id: item.id,
        identifier: item.intake.identifier || 'NEW',
        name: item.intake.systemName,
        href: `/ai-estate/intake?id=${item.id}`,
        lifecycle: 'Registered',
        gate: item.gate ?? 'Conditional Go',
        gateReason: item.gateReason ?? '',
        materiality: item.suggestion?.suggestedTier ?? '',
        lastReview: item.lastReview ?? '',
        updatedBy: override?.updatedBy ?? item.updatedBy ?? '',
        nextReview: override?.nextReview ?? item.nextReview ?? '',
        discontinued: override?.discontinued === true || item.discontinued === true,
      }
    }),
    ...systems.map((system) => {
      const override = reviewOverrides[system.id]
      return {
        id: system.id,
        identifier: system.identifier,
        name: system.name,
        href: `/ai-estate/${system.id}`,
        lifecycle: system.lifecycle_state,
        gate: system.gate,
        gateReason: system.gate_reason,
        materiality: system.materiality,
        lastReview: system.last_review,
        updatedBy: override?.updatedBy ?? system.business_owner,
        nextReview: override?.nextReview ?? system.next_review,
        discontinued: override?.discontinued === true,
      }
    }),
  ]
  return (
    <div className="stack">
      <PageHeader
        title="AI Estate"
        description="Registered AI systems with their lifecycle state, gate, materiality and review dates."
        primaryAction={
          canRegister ? (
            <Link className="button button-primary" to="/ai-estate/intake">
              Register AI system
            </Link>
          ) : undefined
        }
      />
      <SyntheticNotice />
      <Card title="AI systems" description={`${rows.length} systems, including registrations from this browser session.`}>
        <DataTable
          caption="AI systems"
          rows={rows}
          rowKey={(row) => row.id}
          columns={[
            { header: 'ID', mono: true, cell: (row) => row.identifier },
            { header: 'SYSTEM', cell: (row) => <Link to={row.href}>{row.name}</Link> },
            { header: 'LIFECYCLE', cell: (row) => row.lifecycle },
            { header: 'GATE', cell: (row) => <StatusBadge label={row.gate} /> },
            { header: 'REASON', cell: (row) => row.gateReason },
            { header: 'MATERIALITY', cell: (row) => <StatusBadge label={row.materiality} /> },
            { header: 'LAST REVIEW', cell: (row) => row.lastReview },
            { header: 'UPDATED BY', cell: (row) => row.updatedBy },
            {
              header: 'REPORT',
              cell: (row) => <GovernanceReportButton systemId={row.id} name={row.name} compact />,
            },
            {
              header: 'NEXT REVIEW',
              cell: (row) => (
                <NextReviewEditor
                  id={row.id}
                  name={row.name}
                  value={row.nextReview}
                  discontinued={row.discontinued}
                  canMutate={canMutate}
                  onSave={(nextReview) => {
                    if (!canMutate) return
                    updateNextReview(row.id, nextReview, editorName)
                  }}
                  {...(canMutate
                    ? { onDiscontinue: () => retireSystem(row.id, row.nextReview, editorName) }
                    : {})}
                />
              ),
            },
          ]}
        />
      </Card>
      <Card
        title="Laws, policies and frameworks assessed"
        description="Each system is screened only for the geography and sector recorded on it. A United Kingdom-only financial system includes PRA SS1/23 and excludes the ECB. Global screens the full catalogue. Open a system for the rationale. This is not a legal opinion or a certification."
      >
        <DataTable
          caption="Laws and frameworks assessed by AI system"
          rows={rows}
          rowKey={(row) => `laws-${row.id}`}
          columns={[
            { header: 'SYSTEM', cell: (row) => <Link to={row.href}>{row.name}</Link> },
            { header: 'SCOPE', cell: (row) => lawsFor(row.id, registrations, systems).scopeLabel },
            { header: 'ASSESSED AGAINST', cell: (row) => lawsFor(row.id, registrations, systems).assessed.map((item) => item.name).join('; ') },
            { header: 'GAPS', cell: (row) => lawsFor(row.id, registrations, systems).assessed.filter((item) => item.outcome === 'Gap').map((item) => item.name).join('; ') || 'None' },
          ]}
        />
      </Card>
    </div>
  )
}
