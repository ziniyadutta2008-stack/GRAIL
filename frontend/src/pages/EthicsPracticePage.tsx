import { Link } from 'react-router'

import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { SyntheticNotice } from '../components/SyntheticNotice'
import { ETHICS_CASES } from '../ethics/cases'
import { lifecycleFor } from '../lifecycle/model'
import { systems } from '../demo/demoData'

const sample = systems[0]

/** Portfolio view of Responsible AI and data practice, organised by lifecycle stage. */
export function EthicsPracticePage() {
  const stages = sample ? lifecycleFor(sample) : []
  return (
    <div className="stack">
      <SyntheticNotice />
      <Card
        title="Responsible AI and data practice"
        description="GRAIL governs and evidences ethical AI activities. It does not make the ethical decision, and it is not the model-building platform. An agent may draft a recommendation. The rule and a named reviewer determine the outcome. This is not a legal opinion or a certification."
      >
        <p>Use-case recommendation, dataset decision and release state are recorded separately. A dataset Fail rejects that dataset for the proposed use. It does not by itself reject the use case. A rejected dataset cannot be linked to an approved training or deployment release.</p>
      </Card>
      <Card title="Across the lifecycle" description="Responsible AI and data governance runs at every stage. It is not one late assessment.">
        <DataTable
          caption="Responsible AI and data activity by lifecycle stage"
          rows={stages}
          rowKey={(stage) => stage.id}
          columns={[
            { header: 'Stage', cell: (stage) => stage.title },
            { header: 'Responsible AI and data activity', cell: (stage) => stage.ethicsActivity },
          ]}
        />
      </Card>
      <Card title="Worked examples" description="These cases are the demonstration fixtures. They are not the six systems in the AI estate. Thresholds are demo policy configuration, not a universal standard.">
        <DataTable
          caption="Ethics and data cases"
          rows={ETHICS_CASES}
          rowKey={(item) => item.id}
          columns={[
            { header: 'Case', cell: (item) => <Link to={`/assess/ethics/${item.id}`}>{item.name}</Link> },
            { header: 'Stage', cell: (item) => item.stage },
            { header: 'Use case', cell: (item) => <StatusBadge label={item.useCase} /> },
            { header: 'Dataset', cell: (item) => <StatusBadge label={item.datasetDecision} /> },
            { header: 'Release state', cell: (item) => <StatusBadge label={item.release} /> },
            { header: 'Next action', cell: (item) => item.nextAction },
          ]}
        />
      </Card>
    </div>
  )
}
