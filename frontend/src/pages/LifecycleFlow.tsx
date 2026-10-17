import { Link } from 'react-router'

const STAGES = [
  { title: 'Intake', detail: 'Register the system, its use, data and deployment.', to: '/ai-estate/intake' },
  { title: 'Classification', detail: 'Confirm materiality and the lifecycle gate.', to: '/ai-estate' },
  { title: 'Impact assessment', detail: 'Record harm, boundaries and the governance lead decision.', to: '/ai-estate/intake#impact-assessment' },
  { title: 'RACI', detail: 'Name one Accountable party and at least one Responsible party.', to: '/assess' },
  { title: 'Controls and evidence', detail: 'Map the control and attach current evidence.', to: '/assess/iso42001' },
  { title: 'Findings and remediation', detail: 'Own each gap, its due date and definition of done.', to: '/actions/findings' },
  { title: 'Independent validation', detail: 'A different person validates High or Critical closure.', to: '/actions' },
  { title: 'Executive decision', detail: 'Approve the sign-off, exception or council decision.', to: '/decisions' },
  { title: 'Monitoring, incidents and change', detail: 'Record an incident or a material change.', to: '/actions/incidents' },
  { title: 'Periodic review and retirement', detail: 'Set the next review, or record that the system is discontinued.', to: '/ai-estate' },
] as const

/** The operating path from intake to review. Each stage opens the screen for that work. */
export function LifecycleFlow() {
  return (
    <section className="card lifecycle" aria-labelledby="lifecycle-heading">
      <header className="card-header">
        <div>
          <h2 id="lifecycle-heading">Governance workflow</h2>
          <p className="muted card-description">
            Impact assessment, RACI, controls and evidence, findings and decisions.
            These activities stay open across the model lifecycle. A later screen does not close an earlier record.
          </p>
        </div>
      </header>
      <ol className="lifecycle-flow" aria-label="Governance workflow stages">
        {STAGES.map((stage, index) => (
          <li key={stage.title}>
            <Link to={stage.to}>
              <span className="lifecycle-step">{index + 1}</span>
              <span className="lifecycle-copy">
                <span className="lifecycle-name">{stage.title}</span>
                <span className="lifecycle-detail">{stage.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
