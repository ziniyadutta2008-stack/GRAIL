import { Link, Outlet, useOutletContext, useParams } from 'react-router'

import { ContextTabs } from '../../components/ContextTabs'
import { EmptyState } from '../../components/EmptyState'
import { NextReviewEditor } from '../../components/NextReviewEditor'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { SyntheticNotice } from '../../components/SyntheticNotice'
import { useAuth } from '../../auth/AuthContext'
import { canMutateAiSystemRegister } from '../../auth/permissions'
import { systemById, type AiSystem } from '../../demo/demoData'
import { useRetirement } from '../../actions/retirementStore'
import { useRegistry } from '../../intake/registry'
import { SYSTEM_TABS } from '../../navigation/navigation'
import { EthicalPosture } from '../../ethics/EthicsWorkbench'
import { GovernanceReportButton } from '../../reports/GovernanceReportButton'

export function useSystem(): AiSystem {
  return useOutletContext<AiSystem>()
}

/** Lifecycle gate with its blocking reason always visible, never hidden in a tooltip. */
function LifecycleGate({ system }: { system: AiSystem }) {
  return (
    <section className={`gate gate-${system.gate === 'No-Go' ? 'critical' : system.gate === 'Go' ? 'success' : 'warning'}`} aria-labelledby="gate-heading">
      <h2 id="gate-heading">
        Lifecycle gate: <StatusBadge label={system.gate} />
      </h2>
      <p>
        <strong>Scope:</strong> {system.gate_scope}
      </p>
      <p>
        <strong>Blocking conditions:</strong> {system.gate_reason}
      </p>
    </section>
  )
}

export function SystemLayout() {
  const { systemId } = useParams()
  const { reviewOverrides, updateNextReview } = useRegistry()
  const { retireSystem } = useRetirement()
  const { session } = useAuth()
  const canMutate = canMutateAiSystemRegister(session?.persona.role)
  const system = systemById(systemId)
  if (!system) {
    return (
      <EmptyState
        title="AI system not found"
        nextStep="The system may have been removed or you may not have access."
        action={<Link to="/ai-estate">Back to AI Estate</Link>}
      />
    )
  }
  const base = `/ai-estate/${system.id}`
  const nextReview = reviewOverrides[system.id]?.nextReview ?? system.next_review
  const editorName = session?.persona.display_name || 'Model owner'
  return (
    <div className="stack">
      <PageHeader
        title={system.name}
        description={system.description}
        breadcrumbs={[{ label: 'AI Estate', to: '/ai-estate' }, { label: system.name }]}
        primaryAction={<GovernanceReportButton systemId={system.id} />}
        meta={
          <>
            <span className="mono">{system.identifier}</span>
            <span>Lifecycle: {system.lifecycle_state}</span>
            <span className="review-meta">
              Next review
              <NextReviewEditor
                id={system.id}
                name={system.name}
                value={nextReview}
                discontinued={reviewOverrides[system.id]?.discontinued === true}
                canMutate={canMutate}
                onSave={(date) => {
                  if (!canMutate) return
                  updateNextReview(system.id, date, editorName)
                }}
                {...(canMutate
                  ? { onDiscontinue: () => retireSystem(system.id, nextReview, editorName) }
                  : {})}
              />
            </span>
          </>
        }
      />
      <SyntheticNotice />
      <LifecycleGate system={system} />
      <EthicalPosture owner={system.business_owner} systemId={system.id} />
      <ContextTabs
        label={`${system.name} sections`}
        tabs={SYSTEM_TABS.map((tab) => ({ label: tab.label, to: tab.segment ? `${base}/${tab.segment}` : base, end: !tab.segment }))}
      />
      <Outlet context={system} />
    </div>
  )
}
