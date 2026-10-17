import { useEffect, useId, useRef, useState } from 'react'

import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { StatusBadge } from '../components/StatusBadge'
import {
  AICPA_TSC_SOURCE,
  CONFIDENTIALITY_THEMES,
  EVIDENCE_CHECKS,
  EVIDENCE_SAMPLES,
  EVIDENCE_TYPES,
  SECURITY_THEMES,
  criteriaForTheme,
  evidenceStatus,
  type Soc2CriterionLike,
} from './soc2Scope'

/** Lightbulb beside the words SOC 2. Opens the criteria and the two evidence samples. */
export function Soc2InfoButton() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <>
      <button type="button" className="icon-button soc-info-button" aria-expanded={open} aria-label="About SOC 2" onClick={() => setOpen(true)}>
        <Icon name="lightbulb" />
      </button>
      {open ? (
      <div className="soc-guide-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <div className="soc-guide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="card-title-row">
          <h2 id={titleId}>About SOC 2</h2>
          <button ref={closeRef} type="button" className="button secondary" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p>
          SOC 2 Trust Services Criteria are published by the American Institute of Certified Public Accountants (AICPA).
          This readiness review uses Security, the Common Criteria, and Confidentiality, the C category.
          The criteria text is not reproduced. This is an internal readiness assessment, not a SOC 2 examination or an auditor’s opinion.
        </p>
        <h3>Security, Common Criteria</h3>
        <p>
          Security covers controls that protect systems against unauthorized access, both from outside the organization and from inside it.
          The readiness themes are access management, cryptographic protection, transport layer security protocol documentation, system monitoring, and incident response.
        </p>
        <h3>Confidentiality, C category</h3>
        <p>
          Confidentiality addresses how the organization identifies, protects, and disposes of information designated as confidential, including information shared under a contract or a regulation.
          The data-lifecycle themes used here are model access logging, data pipeline integrity, inference endpoint monitoring, and privileged access governance.
        </p>
        <h3>Evidence the review looks for</h3>
        <p>
          Two evidence types are accepted. Each is checked for timestamp validity, scope coverage, system identification and traceability, and chain of custody.
          A note in a readiness record is not one of these types. The samples below are illustrations. They are not attached to an AI system and they do not change a readiness result.
        </p>
        {EVIDENCE_SAMPLES.map((sample) => (
          <article key={sample.id} className="stack" aria-label={sample.title}>
            <h3>{sample.title}</h3>
            <p>{sample.notice}</p>
            <dl className="facts">
              {sample.fields.map((field) => (
                <div className="fact" key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
            {sample.attempts ? (
              <div className="table-wrap">
                <table className="data-table">
                  <caption>Sample user access attempts</caption>
                  <thead>
                    <tr>
                      <th scope="col">Time (UTC)</th>
                      <th scope="col">Actor</th>
                      <th scope="col">Attempt</th>
                      <th scope="col">Result</th>
                      <th scope="col">System</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.attempts.map((attempt) => (
                      <tr key={`${attempt.at}-${attempt.actor}`}>
                        <td>{attempt.at}</td>
                        <td>{attempt.actor}</td>
                        <td>{attempt.attempt}</td>
                        <td>{attempt.result}</td>
                        <td>{attempt.system}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <h4>How the four checks read this sample</h4>
            <ul>
              {sample.checks.map((item) => (
                <li key={item.check}><strong>{item.check}.</strong> {item.reading}</li>
              ))}
            </ul>
          </article>
        ))}
        <p className="card-footnote">
          Source: <a href={AICPA_TSC_SOURCE.url} rel="noreferrer">{AICPA_TSC_SOURCE.publisher}, {AICPA_TSC_SOURCE.title}</a>.
        </p>
      </div>
      </div>
      ) : null}
    </>
  )
}

/** Explains the two Trust Services Criteria categories used by this readiness review. */
export function Soc2ScopePanel() {
  return (
    <Card
      title="Trust Services Criteria"
      description="SOC 2 Trust Services Criteria are published by the American Institute of Certified Public Accountants (AICPA). This review uses Security, the Common Criteria, and Confidentiality, the C category. The criteria text is not reproduced. This is an internal readiness assessment, not a SOC 2 examination or an auditor’s opinion."
    >
      <dl className="facts">
        <div className="fact">
          <dt>Security, Common Criteria</dt>
          <dd>
            Controls that protect the system against unauthorized access, both from outside the organization and from inside it.
            The readiness themes are access management, cryptographic protection, transport layer security protocol documentation, system monitoring, and incident response.
          </dd>
        </div>
        <div className="fact">
          <dt>Confidentiality, C category</dt>
          <dd>
            How the organization identifies, protects, and disposes of information designated as confidential, including information shared under a contract or a regulation.
            The data-lifecycle themes are model access logging, data pipeline integrity, inference endpoint monitoring, and privileged access governance.
          </dd>
        </div>
      </dl>
      <p className="card-footnote">
        Source: <a href={AICPA_TSC_SOURCE.url} rel="noreferrer">{AICPA_TSC_SOURCE.publisher}, {AICPA_TSC_SOURCE.title}</a>.
      </p>
    </Card>
  )
}

/** Shows which recorded criteria cover each theme, and that the two evidence types are not attached. */
export function Soc2EvidencePanel({ criteria }: { criteria: Soc2CriterionLike[] }) {
  const themes = [...SECURITY_THEMES, ...CONFIDENTIALITY_THEMES]
  return (
    <Card
      title="Evidence the readiness review accepts"
      description="A criterion is not treated as supported by a narrative alone. The review looks for two evidence types. Neither is attached for this system, so the four checks are not applied."
    >
      <DataTable
        caption="Security and Confidentiality themes"
        rows={themes}
        rowKey={(theme) => theme.id}
        columns={[
          { header: 'Category', cell: (theme) => theme.category },
          { header: 'Theme', cell: (theme) => theme.title },
          {
            header: 'Recorded criteria',
            cell: (theme) => {
              const matched = criteriaForTheme(criteria, theme)
              if (matched.length === 0) return <StatusBadge label="Not recorded" />
              return matched.map((criterion) => `${criterion.criterion_id} ${criterion.result}`).join(', ')
            },
          },
        ]}
      />
      <DataTable
        caption="Audit evidence types"
        rows={EVIDENCE_TYPES.map((item) => ({ ...item, status: evidenceStatus() }))}
        rowKey={(item) => item.id}
        columns={[
          { header: 'Evidence', cell: (item) => item.name },
          { header: 'Must show', cell: (item) => item.mustShow },
          { header: 'Checks', cell: () => EVIDENCE_CHECKS.join('; ') },
          { header: 'This system', cell: (item) => <StatusBadge label={item.status} /> },
        ]}
      />
    </Card>
  )
}
