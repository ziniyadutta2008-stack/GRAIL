import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import type { ApplicabilityReport } from './applicability'

/** Instruments actually screened for one system. Out-of-scope countries stay in the note. */
export function LawsAssessed({ report }: { report: ApplicabilityReport }) {
  return (
    <Card title="Laws, policies and frameworks assessed" description={report.summary}>
      <DataTable
        caption={`Laws and frameworks assessed for ${report.scopeLabel}`}
        rows={report.assessed}
        rowKey={(item) => item.id}
        columns={[
          { header: 'Instrument', cell: (item) => item.name },
          { header: 'Where it applies', cell: (item) => item.jurisdiction },
          { header: 'Kind', cell: (item) => item.kind },
          { header: 'Result', cell: (item) => <StatusBadge label={item.outcome} /> },
          { header: 'Why it was included', cell: (item) => item.rationale },
        ]}
      />
      <p>{report.notAssessed}</p>
      <p className="card-footnote">This is an applicability screen. It is not a legal opinion, a certification, or an audit opinion.</p>
    </Card>
  )
}
