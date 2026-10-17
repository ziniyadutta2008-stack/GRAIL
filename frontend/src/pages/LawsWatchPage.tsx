import { useAuth } from '../auth/AuthContext'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { LAW_INSTRUMENTS, RESEARCH_NOTES } from '../frameworks/lawWatch'
import { useLawWatch } from '../frameworks/lawWatchStore'

function formatPosted(iso: string): string {
  const [year, month, day] = iso.split('-')
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${Number(day)} ${names[Number(month) - 1]} ${year}`
}

function SourceLink({ title, url }: { title: string; url: string }) {
  return <a href={url} rel="noreferrer">{title}</a>
}

/** Read-only catalogue plus sourced research notes. A person posts a note; the watch does not. */
export function LawsWatchPage() {
  const { session } = useAuth()
  const { notes, postNote, rejectNote } = useLawWatch()
  const canPost = session?.persona.role === 'governance_lead'
  const postedOn = (instrumentId: string) => {
    const covered = instrumentId === 'france' ? 'eu-ai-act' : instrumentId
    const match = RESEARCH_NOTES.find((note) => note.instrumentId === covered)
    const state = match ? notes.find((item) => item.id === match.id) : undefined
    return state?.status === 'Posted' && state.postedOn ? formatPosted(state.postedOn) : 'None posted'
  }

  return (
    <div className="stack">
      <Card
        title="Laws and frameworks"
        description="Country, regional and international instruments used by the applicability screen. Key points are short readings of the cited source. An update appears as posted on this site only after the AI Governance Lead accepts a sourced research note. This page is not a legal opinion."
      >
        <DataTable
          caption="AI laws and frameworks"
          rows={LAW_INSTRUMENTS}
          rowKey={(item) => item.id}
          columns={[
            { header: 'Where', cell: (item) => item.jurisdiction },
            { header: 'Instrument', cell: (item) => item.name },
            { header: 'Kind', cell: (item) => item.kind },
            {
              header: 'Key points',
              cell: (item) => (
                <ul className="key-points">
                  {item.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              ),
            },
            { header: 'Official source', cell: (item) => <SourceLink title={item.source.publisher} url={item.source.url} /> },
            { header: 'Posted on this site', cell: (item) => postedOn(item.id) },
          ]}
        />
      </Card>
      {RESEARCH_NOTES.map((note) => {
        const state = notes.find((item) => item.id === note.id)
        const status = state?.status ?? 'Draft'
        return (
          <Card
            key={note.id}
            title={note.title}
            description={`Regulatory Watch. Researched ${formatPosted(note.researchedOn)}. No model was called, and this preview does not search the web. The note quotes the cited Official Journal provisions.`}
            action={<StatusBadge label={status === 'Posted' ? 'Posted' : status === 'Rejected' ? 'Rejected' : 'Draft'} />}
          >
            {note.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p>
              <strong>Posted on this site:</strong> {status === 'Posted' && state?.postedOn ? formatPosted(state.postedOn) : 'Not yet posted'}
            </p>
            <DataTable
              caption={`Sources for ${note.title}`}
              rows={note.sources}
              rowKey={(source) => source.url}
              columns={[
                { header: 'Source', cell: (source) => <SourceLink title={source.title} url={source.url} /> },
                { header: 'Publisher', cell: (source) => source.publisher },
                { header: 'Document date', cell: (source) => source.documentDate },
              ]}
            />
            {status === 'Draft' && canPost ? (
              <div className="button-row">
                <button type="button" className="button button-primary" onClick={() => postNote(note.id)}>Post update on this site</button>
                <button type="button" className="button button-secondary" onClick={() => rejectNote(note.id)}>Reject note</button>
              </div>
            ) : null}
            {status === 'Draft' && !canPost ? <p>Waiting for the AI Governance Lead to post or reject this note.</p> : null}
            {status === 'Posted' ? <p>Posted by the AI Governance Lead. The catalogue date above uses this posted date. Posting does not change a control, a gate, or a legal classification.</p> : null}
            {status === 'Rejected' ? <p>Rejected. It is not shown as a current update in the catalogue.</p> : null}
          </Card>
        )
      })}
    </div>
  )
}
