import { Link, useParams } from 'react-router'

import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { DETERMINISTIC_AGENT_MODE } from '../agents/mode'
import { ETHICS_CASES, LINEAGE_NODES } from '../ethics/cases'
import { DEMO_FAIRNESS_POLICY } from '../ethics/rules'

/** One ethics case. The header separates the use-case result from the release state. */
export function EthicsCasePage() {
  const { caseId } = useParams()
  const item = ETHICS_CASES.find((entry) => entry.id === caseId)
  if (!item) {
    return <EmptyState title="This ethics case is not on the record" nextStep="Return to Responsible AI and data practice." action={<Link to="/assess/ethics">Ethics and data</Link>} />
  }
  return (
    <div className="stack">
      <p><Link to="/assess/ethics">Ethics and data</Link></p>
      <section className="gate gate-warning" aria-label="Ethical release">
        <h2>{item.name}</h2>
        <dl className="facts">
          <div className="fact"><dt>Overall ethical risk</dt><dd>{item.ethicalRisk}</dd></div>
          <div className="fact"><dt>Use-case recommendation</dt><dd><StatusBadge label={item.useCase} /></dd></div>
          <div className="fact"><dt>Dataset decision</dt><dd><StatusBadge label={item.datasetDecision} /></dd></div>
          <div className="fact"><dt>Executive decision</dt><dd>{item.executive}</dd></div>
          <div className="fact"><dt>Release state</dt><dd><StatusBadge label={item.release} /></dd></div>
          <div className="fact"><dt>Open Critical or High</dt><dd>{item.openCriticalHigh}</dd></div>
          <div className="fact"><dt>Evidence completeness</dt><dd>{item.evidenceCompleteness}</dd></div>
          <div className="fact"><dt>Next required action</dt><dd>{item.nextAction}</dd></div>
          <div className="fact"><dt>Accountable owner</dt><dd>{item.owner}</dd></div>
        </dl>
        <p>Rule {item.ruleId}. Policy {item.policyVersion}.</p>
        <p>Rule-evaluation and agent draft: {item.assessedOn} Independent review: {item.reviewedOn} Reviewer: {item.reviewer}.</p>
        <p>Deterministic policy engine draft: {item.agentDraft}. {DETERMINISTIC_AGENT_MODE} No model was called. The rule result is {item.useCase}. The named reviewer recorded that result. The engine did not approve, reject, accept risk, or close a finding.</p>
      </section>

      {item.principles.length > 0 ? (
        <Card title="Responsible AI" description={`${item.population}. Ratings are categorical. They are not averaged. Open a principle to read rationale, harm, evidence and mitigation.`}>
          <div className="stack">
            {item.principles.map((row) => (
              <details key={row.principle} className="card">
                <summary>
                  {row.principle} — <StatusBadge label={row.rating} />
                </summary>
                <dl className="facts">
                  <div className="fact"><dt>Rationale</dt><dd>{row.rationale}</dd></div>
                  <div className="fact"><dt>Harm and affected population</dt><dd>{row.harm}</dd></div>
                  <div className="fact"><dt>Evidence</dt><dd>{row.evidence}</dd></div>
                  <div className="fact"><dt>Missing evidence</dt><dd>{row.missing}</dd></div>
                  <div className="fact"><dt>Required mitigation</dt><dd>{row.mitigation}</dd></div>
                  <div className="fact"><dt>Owner</dt><dd>{row.owner}</dd></div>
                  <div className="fact"><dt>Reviewer</dt><dd>{row.reviewer}</dd></div>
                </dl>
              </details>
            ))}
          </div>
        </Card>
      ) : null}

      {item.checks.length > 0 ? (
        <Card title="Data practices" description="Pass, Flag, Fail, or Not Applicable. A Fail rejects this dataset for the proposed use.">
          <DataTable
            caption="Data ethics checklist"
            rows={item.checks}
            rowKey={(row) => row.check}
            columns={[
              { header: 'Check', cell: (row) => row.check },
              { header: 'Result', cell: (row) => <StatusBadge label={row.result} /> },
              { header: 'Record', cell: (row) => row.record },
            ]}
          />
        </Card>
      ) : null}

      {item.assets.length > 0 || item.id === 'lineage' || item.id === 'triage' ? (
        <Card title="Lineage" description="Each node has an identifier, version and status. A blocked asset stays out of the training run.">
          <DataTable
            caption="Lineage nodes"
            rows={[...LINEAGE_NODES]}
            rowKey={(row) => row.id}
            columns={[
              { header: 'ID', mono: true, cell: (row) => row.id },
              { header: 'Stage', cell: (row) => row.stage },
              { header: 'Asset', cell: (row) => `${row.name} ${row.version}` },
              { header: 'Source', cell: (row) => row.source },
              { header: 'Consent', cell: (row) => row.consent },
              { header: 'Status', cell: (row) => <StatusBadge label={row.status} /> },
            ]}
          />
          {item.assets.length > 0 ? (
            <DataTable
              caption="Data assets"
              rows={item.assets}
              rowKey={(row) => row.name}
              columns={[
                { header: 'Asset', cell: (row) => row.name },
                { header: 'Fine-tuning use', cell: (row) => <StatusBadge label={row.use} /> },
                { header: 'Consent and licensing', cell: (row) => row.record },
              ]}
            />
          ) : null}
        </Card>
      ) : null}

      {item.metrics.length > 0 ? (
        <Card title="Fairness review" description={`${DEMO_FAIRNESS_POLICY.label}. DIR below ${DEMO_FAIRNESS_POLICY.dirP1Below} or disparity above ${DEMO_FAIRNESS_POLICY.disparityP1Above} is P1 under this demo policy. Aggregate metrics only. Raw applicant or patient records are not sent to a model.`}>
          <DataTable
            caption="Aggregate fairness metrics"
            rows={item.metrics}
            rowKey={(row) => row.name}
            columns={[
              { header: 'Metric', cell: (row) => row.name },
              { header: 'Value', cell: (row) => String(row.value) },
              { header: 'Demo result', cell: (row) => <StatusBadge label={(row.kind === 'dir' ? row.value < DEMO_FAIRNESS_POLICY.dirP1Below : row.value > DEMO_FAIRNESS_POLICY.disparityP1Above) ? 'P1' : 'Clear'} /> },
            ]}
          />
          {item.incident ? <p>Ethics incident {item.incident}. The demo policy blocks deployment while this P1 is open. Human review is required.</p> : null}
        </Card>
      ) : null}

      {item.features.length > 0 ? (
        <Card title="Data quality" description={item.policyLabel}>
          <DataTable
            caption="Feature quality"
            rows={item.features}
            rowKey={(row) => row.feature}
            columns={[
              { header: 'Feature', cell: (row) => row.feature },
              { header: 'Drift', cell: (row) => String(row.drift) },
              { header: 'Outliers', cell: (row) => String(row.outliers) },
              { header: 'Disposition', cell: (row) => <StatusBadge label={row.disposition} /> },
            ]}
          />
        </Card>
      ) : null}

      {item.indexes.length > 0 ? (
        <Card title="Classification and retention" description="An index inherits the most restrictive source classification unless an authorised reviewer evidences a different treatment.">
          <DataTable
            caption="Embedding indexes"
            rows={item.indexes}
            rowKey={(row) => row.name}
            columns={[
              { header: 'Index', cell: (row) => row.name },
              { header: 'Classification', cell: (row) => <StatusBadge label={row.classification} /> },
              { header: 'Retention', cell: (row) => row.retention },
              { header: 'Sensitive data', cell: (row) => row.sensitive },
            ]}
          />
        </Card>
      ) : null}

      {item.options.length > 0 ? (
        <Card title="Mitigation" description="The selected option is a recommendation until a named reviewer approves it. Post-processing does not remove bias inside the model.">
          <DataTable
            caption="Mitigation options"
            rows={item.options}
            rowKey={(row) => row.option}
            columns={[
              { header: 'Option', cell: (row) => row.option },
              { header: 'Ethical effectiveness', cell: (row) => row.ethical },
              { header: 'Operational feasibility', cell: (row) => row.operational },
              { header: 'Reversibility', cell: (row) => row.reversibility },
              { header: 'Auditability', cell: (row) => row.auditability },
              { header: 'Performance trade-off', cell: (row) => row.performance },
              { header: 'Cross-group impact', cell: (row) => row.crossGroup },
              { header: 'Residual risk', cell: (row) => row.residualRisk },
              { header: 'Selected', cell: (row) => (row.selected ? 'Selected for approval' : 'Not selected') },
            ]}
          />
          {item.mitigation ? <p>Selected mitigation: {item.mitigation}. Pre- and post-mitigation testing and independent closure are required before the release gate can close. The implementer cannot independently validate a High or Critical closure.</p> : null}
        </Card>
      ) : null}

      {item.tickets.length > 0 ? (
        <Card title="Steward tickets" description="A threshold breach opens a steward ticket. Closure needs a re-test and an independent validator.">
          <DataTable
            caption="Data quality steward tickets"
            rows={item.tickets}
            rowKey={(ticket) => ticket.id}
            columns={[
              { header: 'Ticket', mono: true, cell: (ticket) => ticket.id },
              { header: 'Feature', cell: (ticket) => ticket.feature },
              { header: 'Metric', cell: (ticket) => `${ticket.metric}: ${ticket.observed} against ${ticket.threshold}` },
              { header: 'Severity', cell: (ticket) => <StatusBadge label={ticket.severity} /> },
              { header: 'Steward', cell: (ticket) => ticket.steward },
              { header: 'Remediation', cell: (ticket) => ticket.remediation },
              { header: 'Retest', cell: (ticket) => ticket.retest },
              { header: 'Validator', cell: (ticket) => ticket.validator },
              { header: 'State', cell: (ticket) => <StatusBadge label={ticket.open ? 'Open' : 'Closed'} /> },
            ]}
          />
        </Card>
      ) : null}

      <Card title="Ethical review" description={`Source: ${item.source}. Stage: ${item.stage}.`}>
        {item.gates.length > 0 ? (
          <DataTable
            caption="Release gates"
            rows={item.gates}
            rowKey={(gate) => gate.gate}
            columns={[
              { header: 'Gate', cell: (gate) => gate.gate },
              { header: 'State', cell: (gate) => <StatusBadge label={gate.open ? 'Open' : 'Closed'} /> },
              { header: 'What remains', cell: (gate) => gate.record },
            ]}
          />
        ) : <p>No mandatory release gate is open on this record.</p>}
        <p>Affected population: {item.population}. A deployment cannot proceed while a mandatory gate is open.</p>
      </Card>
    </div>
  )
}
