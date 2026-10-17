import { Link } from 'react-router'

import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { EthicsWorkbench } from '../../ethics/EthicsWorkbench'
import { lifecycleFor } from '../../lifecycle/model'
import { useSystem } from './SystemLayout'

/** Operational ethics workbench for one estate system. */
export function SystemEthicsPage() {
  const system = useSystem()
  const stages = lifecycleFor(system)
  return (
    <div className="stack">
      <EthicsWorkbench systemId={system.id} systemName={system.name} />
      <Card title="Lifecycle gates that this assessment feeds" description="A stage cannot be approved while mandatory evidence is missing. The deployment gate stays blocked when a prerequisite fails.">
        <DataTable
          caption={`Lifecycle status for ${system.name}`}
          rows={stages}
          rowKey={(stage) => stage.id}
          columns={[
            { header: 'Stage', cell: (stage) => stage.title },
            { header: 'Status', cell: (stage) => <StatusBadge label={stage.status} /> },
            { header: 'Evidence', cell: (stage) => `${stage.evidencePercent}%` },
            { header: 'Blocking issue', cell: (stage) => stage.blockingIssue },
          ]}
        />
        <p><Link to="/assess/ethics">Worked examples</Link> stay separate from this system record.</p>
      </Card>
    </div>
  )
}
