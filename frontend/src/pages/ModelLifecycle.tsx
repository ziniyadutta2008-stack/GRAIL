import { useMemo, useState } from 'react'

import { StatusBadge } from '../components/StatusBadge'
import { systems as estateSystems, type AiSystem } from '../demo/demoData'
import { activeStageIndex, GOVERNANCE_RAILS, lifecycleFor, type LifecycleStage } from '../lifecycle/model'

/** Portfolio or system view of the engineering lifecycle. Governance rails stay active at every stage. */
export function ModelLifecycle({ systems = estateSystems, systemId }: { systems?: AiSystem[]; systemId?: string }) {
  const available = systemId ? systems.filter((system) => system.id === systemId) : systems
  const [selectedId, setSelectedId] = useState(systemId ?? available[0]?.id ?? '')
  const system = available.find((item) => item.id === selectedId) ?? available[0]
  const stages = useMemo(() => (system ? lifecycleFor(system) : []), [system])
  const [active, setActive] = useState(() => activeStageIndex(stages))
  const stage = stages[active] ?? stages[0]

  if (!system || !stage) return null

  const chooseSystem = (id: string) => {
    setSelectedId(id)
    const next = available.find((item) => item.id === id)
    setActive(next ? activeStageIndex(lifecycleFor(next)) : 0)
  }

  return (
    <section className="card lifecycle" aria-labelledby="model-lifecycle-heading">
      <header className="card-header">
        <div>
          <h2 id="model-lifecycle-heading">AI and model lifecycle</h2>
          <p className="muted card-description">
            Data, development, test, validation, deployment, monitoring, change and retirement.
            A material change returns to independent validation. Retirement archives the decision.
            RACI, controls and findings stay active at every stage. They are not a step that happens once.
          </p>
        </div>
      </header>
      <p className="muted">Governance rails, active throughout</p>
      <ul className="governance-rails" aria-label="Governance rails active at every stage">
        {GOVERNANCE_RAILS.map((rail) => (
          <li key={rail}>{rail}</li>
        ))}
      </ul>
      {available.length > 1 ? (
        <label className="field">
          AI system
          <select aria-label="Lifecycle system" value={system.id} onChange={(event) => chooseSystem(event.target.value)}>
            {available.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <ol className="model-stages" aria-label="AI and model lifecycle stages">
        {stages.map((item, index) => (
          <li key={item.id}>
            <button type="button" aria-current={index === active ? 'step' : undefined} onClick={() => setActive(index)}>
              <span className="lifecycle-step">{item.number}</span>
              <span className="lifecycle-name">{item.title}</span>
              <StatusBadge label={item.status} />
            </button>
          </li>
        ))}
      </ol>
      <StageDetail stage={stage} />
    </section>
  )
}

function StageDetail({ stage }: { stage: LifecycleStage }) {
  return (
    <article className="stack" aria-label={stage.title}>
      <h3>{stage.number}. {stage.title}</h3>
      <p>{stage.captures}</p>
      {stage.status === 'In progress' && stage.evidencePercent < 100 ? (
        <p>In progress means this is the first stage that still lacks mandatory exit evidence. Later stages stay Not started until this one is approved. Status is derived. It is not selected by hand.</p>
      ) : null}
      <dl className="facts">
        <div className="fact"><dt>Owner</dt><dd>{stage.owner}</dd></div>
        <div className="fact"><dt>Accountable executive</dt><dd>{stage.accountableExecutive}</dd></div>
        <div className="fact"><dt>Status</dt><dd><StatusBadge label={stage.status} /></dd></div>
        <div className="fact"><dt>Target date</dt><dd>{stage.targetDate}</dd></div>
        <div className="fact"><dt>Entry criteria</dt><dd>{stage.entryCriteria}</dd></div>
        <div className="fact"><dt>Exit criteria</dt><dd>{stage.exitCriteria}</dd></div>
        <div className="fact"><dt>Evidence completion</dt><dd>{stage.evidencePercent}% of the expected evidence is recorded. Missing items stay missing.</dd></div>
        <div className="fact"><dt>Open findings</dt><dd>{stage.openFindings}</dd></div>
        <div className="fact"><dt>Open exceptions</dt><dd>{stage.openExceptions}</dd></div>
        <div className="fact"><dt>Reviewer</dt><dd>{stage.reviewer}</dd></div>
        <div className="fact"><dt>Current version</dt><dd>{stage.currentVersion}</dd></div>
        <div className="fact"><dt>Previous version</dt><dd>{stage.previousVersion}</dd></div>
        <div className="fact"><dt>Blocking issue</dt><dd>{stage.blockingIssue}</dd></div>
        <div className="fact"><dt>Next action</dt><dd>{stage.nextAction}</dd></div>
        <div className="fact"><dt>Responsible AI and data</dt><dd>{stage.ethicsActivity}</dd></div>
      </dl>
      <h4>Principal governance evidence</h4>
      <ul>
        {stage.evidence.map((item) => (
          <li key={item.label}>{item.label}: {item.state}</li>
        ))}
      </ul>
      <p>{stage.engineeringLink}</p>
    </article>
  )
}
