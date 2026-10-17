import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import type { Role } from '../auth/session'
import { Card } from '../components/Card'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { systemById, systemModelOwner, systems } from '../demo/demoData'
import { assessApplicability, subjectFromRecord } from '../frameworks/applicability'
import { policyDraftFromDocuments } from '../policies/draft'
import { downloadPolicy, usePolicies, type PolicyDocument, type PolicyStatus } from '../policies/library'
import { downloadPolicyTemplate, POLICY_TEMPLATES, readCompletedTemplate, suggestedTemplateId, type PolicyTemplate } from '../policies/templates'

const STATUSES: PolicyStatus[] = ['Draft', 'Under Review', 'Approved']

/** Organization KPIs that the seeded posture makes relevant for that system. */
const KPI_WATCH: Record<string, string> = {
  'financeguard-ai': 'Audit Readiness, Remediation Velocity, Exception Backlog Age',
  'copilot-employee-support': 'Policy Adoption',
  'contoso-customer-assistant': 'Control Completion',
  'ai-analytics-service': 'Audit Readiness',
  'meridian-cs-assistant': 'Policy Adoption, Control Completion',
  'contoso-health-diagnostic-support': 'Remediation Velocity, Audit Readiness',
}

const UPLOAD_STATUSES: PolicyStatus[] = ['Draft', 'Approved']
const MAX_BYTES = 1_000_000
const DRAFT_REVIEWER: Role = 'security_reviewer'
const CAN_ADD_FINDING: Role[] = ['governance_lead', 'security_reviewer', 'system_owner']

async function readPolicyFile(file: File): Promise<{ fileName: string; fileText: string | null; fileDataUrl: string | null }> {
  if (file.size > MAX_BYTES) throw new Error('The file is larger than 1 MB. Choose a smaller document.')
  const textual = file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)
  if (textual) return { fileName: file.name, fileText: await file.text(), fileDataUrl: null }
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('GRAIL could not read that file.'))
    reader.readAsDataURL(file)
  })
  return { fileName: file.name, fileText: null, fileDataUrl }
}

export function PolicyIndex() {
  const { policies } = usePolicies()
  return (
    <div className="stack">
    <PolicyTemplates />
    <Card
      title="Policies"
      description="Each AI system keeps its own policy documents. Open a system to upload a completed template and review it. The Policy and Exception Drafting Agent drafts a section from those documents on the system page."
    >
      <DataTable
        caption="Policies by AI system"
        rows={systems}
        rowKey={(system) => system.id}
        columns={[
          { header: 'AI system', cell: (system) => <Link to={`/assess/policies/${system.id}`}>{system.name}</Link> },
          { header: 'Documents', cell: (system) => policies.filter((policy) => policy.systemId === system.id).length },
          { header: 'Approved', cell: (system) => policies.filter((policy) => policy.systemId === system.id && policy.status === 'Approved').length },
          { header: 'Draft', cell: (system) => policies.filter((policy) => policy.systemId === system.id && policy.status === 'Draft').length },
        ]}
      />
    </Card>
    </div>
  )
}

function PolicyTemplates({ systemId, systemName, onUpload }: { systemId?: string; systemName?: string; onUpload?: (file: File) => Promise<string | null> }) {
  const suggested = systemId ? suggestedTemplateId(systemId) : ''
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const download = (template: PolicyTemplate) => {
    downloadPolicyTemplate(template, systemId && systemName ? { systemName, reference: `${template.reference}-${systemId}` } : undefined)
  }
  const upload = async (file: File | null) => {
    if (!onUpload || !file) return
    setError('')
    const result = await onUpload(file)
    if (result) setError(result)
    else setNotice(`${file.name} is saved as a draft policy for this system. It is not approved.`)
  }
  return (
    <Card
      title="Policy templates"
      description="Download the AI Governance Charter, the standard AI security template, or an industry template. Fill the owner and the Answer lines, then upload the file while assessing an AI system. A completed template starts as Draft. It does not approve the charter or the policy."
    >
      <DataTable
        caption="AI policy templates"
        rows={POLICY_TEMPLATES}
        rowKey={(template) => template.id}
        columns={[
          { header: 'Industry', cell: (template) => template.industry },
          {
            header: 'Template',
            cell: (template) => (
              <span>
                {template.title}
                {template.id === suggested ? <span className="muted"> · Suggested for this system</span> : null}
              </span>
            ),
          },
          { header: 'Use', cell: (template) => template.appliesTo },
          {
            header: 'Download',
            cell: (template) => (
              <button type="button" className="button button-secondary" onClick={() => download(template)}>
                {`Download ${template.title}`}
              </button>
            ),
          },
        ]}
      />
      {onUpload ? (
        <label className="field">
          Completed template for this system
          <input
            type="file"
            accept=".md,.txt,text/plain,text/markdown"
            aria-label="Upload a completed policy template"
            onChange={(event) => void upload(event.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <p>Open an AI system to upload the completed template onto that system.</p>
      )}
      {notice ? <p role="status">{notice}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </Card>
  )
}

export function SystemPolicies() {
  const { systemId } = useParams()
  const system = systemById(systemId)
  const { policies, updateStatus, uploadVersion, addPolicy, produceDraft } = usePolicies()
  const documents = policies.filter((policy) => policy.systemId === system?.id)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<PolicyStatus>('Draft')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const startUpload = (policy: PolicyDocument) => {
    setUploadingId(policy.id)
    setUploadStatus(policy.status === 'Approved' ? 'Approved' : 'Draft')
    setUploadFile(null)
    setError('')
  }

  const saveUpload = async (event: FormEvent) => {
    event.preventDefault()
    if (!uploadingId || !uploadFile) {
      setError('Choose the document to upload.')
      return
    }
    try {
      const file = await readPolicyFile(uploadFile)
      uploadVersion(uploadingId, uploadStatus, file)
      setUploadingId(null)
      setUploadFile(null)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'GRAIL could not read that file.')
    }
  }

  if (!system) {
    return <EmptyState title="This AI system is not in the estate" nextStep="Return to the policy list." action={<Link to="/assess/policies">All policies</Link>} />
  }

  const draft = () => {
    if (documents.length === 0) {
      setError('Add a policy document for this system before drafting.')
      return
    }
    const laws = assessApplicability(subjectFromRecord(system))
    produceDraft(system.id, policyDraftFromDocuments(system.name, documents, `${laws.summary} ${laws.notAssessed}`))
    setError('')
  }

  const uploadTemplate = async (file: File): Promise<string | null> => {
    const textual = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)
    if (!textual) return 'Upload the completed template as a .md or .txt file.'
    let text = ''
    try {
      text = await file.text()
    } catch {
      return 'GRAIL could not read that file.'
    }
    const completed = readCompletedTemplate(text)
    if (!completed) return 'Fill the reference, the policy owner, and at least one Answer line. Download a GRAIL template if this file is not one.'
    const created = addPolicy({
      id: completed.reference,
      title: completed.title,
      version: '1.0',
      status: 'Draft',
      owner: completed.owner,
      summary: completed.answers[0] ?? '',
      systemId: system.id,
      fileName: file.name,
      fileText: completed.body,
    })
    return created ? null : 'That reference is already used. Change the reference line and upload again.'
  }

  return (
    <div className="stack">
      <PolicyTemplates systemId={system.id} systemName={system.name} onUpload={uploadTemplate} />
      <Card
        title={`Policies: ${system.name}`}
        description={`Documents for this system. Model owner: ${systemModelOwner(system)}. KPIs to watch: ${KPI_WATCH[system.id] ?? 'Policy Adoption, Control Completion'}. Uploading a new draft or approved document raises the version by 1. Changing status alone leaves the version unchanged.`}
        action={
          <span className="button-row">
            <Link to="/assess/policies">All systems</Link>
            <button type="button" className="button button-secondary" onClick={draft}>
              Draft with Policy and Exception Agent
            </button>
            <button type="button" className="button button-primary" onClick={() => { setAdding((open) => !open); setError('') }}>
              Add policy document
            </button>
          </span>
        }
      >
        {adding ? <NewPolicyForm systemId={system.id} onCancel={() => setAdding(false)} onCreate={addPolicy} /> : null}
        <form onSubmit={(event) => void saveUpload(event)}>
          <DataTable
            caption={`Policies for ${system.name}`}
            rows={documents}
            empty={<EmptyState title="No policy documents" nextStep="Add a policy document for this system. The drafting agent uses the documents on this page." />}
            rowKey={(policy) => policy.id}
            columns={[
              { header: 'Policy', cell: (policy) => policy.title },
              { header: 'Reference', mono: true, cell: (policy) => policy.id },
              { header: 'Version', mono: true, cell: (policy) => policy.version },
              {
                header: 'Status',
                cell: (policy) => (
                  <span className="review-edit">
                    <label className="visually-hidden" htmlFor={`policy-status-${policy.id}`}>
                      Status for {policy.title}
                    </label>
                    <select
                      id={`policy-status-${policy.id}`}
                      value={policy.status}
                      onChange={(event) => updateStatus(policy.id, event.target.value as PolicyStatus)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <StatusBadge label={policy.status} />
                  </span>
                ),
              },
              { header: 'Owner', cell: (policy) => policy.owner },
              {
                header: 'Document',
                cell: (policy) =>
                  uploadingId === policy.id ? (
                    <span className="review-edit">
                      <label className="visually-hidden" htmlFor={`policy-file-${policy.id}`}>
                        New document for {policy.title}
                      </label>
                      <input
                        id={`policy-file-${policy.id}`}
                        type="file"
                        accept=".txt,.md,.csv,.pdf,.docx,text/plain,application/pdf"
                        onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                      />
                      <label className="visually-hidden" htmlFor={`policy-upload-status-${policy.id}`}>
                        Status of the uploaded document for {policy.title}
                      </label>
                      <select
                        id={`policy-upload-status-${policy.id}`}
                        value={uploadStatus}
                        onChange={(event) => setUploadStatus(event.target.value as PolicyStatus)}
                      >
                        {UPLOAD_STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      <button type="submit" className="button button-primary">
                        Save document
                      </button>
                      <button type="button" className="button button-secondary" onClick={() => setUploadingId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span className="review-edit">
                      <button type="button" className="button button-secondary" aria-label={`Download ${policy.title}`} onClick={() => downloadPolicy(policy)}>
                        Download
                      </button>
                      <button type="button" className="button button-secondary" aria-label={`Upload new version for ${policy.title}`} onClick={() => startUpload(policy)}>
                        Upload new version
                      </button>
                    </span>
                  ),
              },
            ]}
          />
          {error ? <p role="alert">{error}</p> : null}
        </form>
      </Card>
      <PolicyDraftReview systemId={system.id} systemName={system.name} />
    </div>
  )
}

function PolicyDraftReview({ systemId, systemName }: { systemId: string; systemName: string }) {
  const { session } = useAuth()
  const { draftFor, amendDraft, decideDraft, addDraftToFindings } = usePolicies()
  const draft = draftFor(systemId)
  const [amending, setAmending] = useState(false)
  const [text, setText] = useState('')
  const role = session?.persona.role
  const canReview = role === DRAFT_REVIEWER
  const canAdd = role ? CAN_ADD_FINDING.includes(role) : false

  if (!draft) {
    return (
      <Card title="Policy and Exception Drafting Agent" description="The draft appears here after you run the agent. It uses the policy documents on this page. Accepting it does not approve a policy or an exception.">
        <EmptyState title="No draft for this system" nextStep="Add the system's policy documents, then draft a section for the Security Reviewer." />
      </Card>
    )
  }

  const save = () => {
    amendDraft(systemId, text, session?.persona.display_name || 'Named reviewer')
    setAmending(false)
  }

  return (
    <Card
      title="Policy and Exception Drafting Agent"
      description={`Draft for ${systemName}. Assigned to the Security Reviewer to amend, accept or reject. Accepting it does not approve a policy or an exception. No model was called.`}
    >
      {amending ? (
        <label className="field">
          Amendment
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} />
        </label>
      ) : (
        draft.text.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)
      )}
      {draft.amendedBy ? <p>Amended by {draft.amendedBy}. The draft stays open until the Security Reviewer accepts or rejects it.</p> : null}
      {draft.status === 'Draft' && canReview ? (
        <div className="button-row">
          {amending ? (
            <>
              <button type="button" className="button button-primary" onClick={save}>Save amendment</button>
              <button type="button" className="button button-secondary" onClick={() => setAmending(false)}>Cancel amendment</button>
            </>
          ) : (
            <>
              <button type="button" className="button button-secondary" onClick={() => { setText(draft.text); setAmending(true) }}>Amend draft</button>
              <button type="button" className="button button-primary" onClick={() => decideDraft(systemId, 'Accepted')}>Accept draft</button>
              <button type="button" className="button button-secondary" onClick={() => decideDraft(systemId, 'Rejected')}>Reject draft</button>
            </>
          )}
        </div>
      ) : null}
      {draft.status === 'Draft' && !canReview ? <p>Waiting for the Security Reviewer to amend, accept or reject this draft.</p> : null}
      {draft.status === 'Rejected' ? <p>Rejected by the Security Reviewer. Run the agent again after the policy documents change. This does not deny an exception.</p> : null}
      {draft.status === 'Accepted' && !draft.added && canAdd ? (
        <div className="button-row">
          <p>Accepted. The policy documents are unchanged.</p>
          <button type="button" className="button button-primary" onClick={() => addDraftToFindings(systemId)}>Add to findings and actions</button>
        </div>
      ) : null}
      {draft.status === 'Accepted' && !draft.added && !canAdd ? <p>Accepted. The AI Governance Lead, Security Reviewer or System or Model Owner can add it to findings and actions.</p> : null}
      {draft.added ? (
        <p>
          Added to findings and actions. <Link to={`/ai-estate/${systemId}/findings`}>Open findings and actions for {systemName}</Link>
        </p>
      ) : null}
    </Card>
  )
}

function NewPolicyForm({ systemId, onCancel, onCreate }: { systemId: string; onCancel: () => void; onCreate: (policy: { id: string; title: string; version: string; status: PolicyStatus; owner: string; summary: string; systemId: string }) => boolean }) {
  const [title, setTitle] = useState('')
  const [reference, setReference] = useState('')
  const [owner, setOwner] = useState('')
  const [version, setVersion] = useState('1.0')
  const [status, setStatus] = useState<PolicyStatus>('Draft')
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const created = onCreate({ id: reference, title, version, status, owner, summary: '', systemId })
    if (!created) {
      setError('Enter a policy name, reference, owner and version. The reference must be new.')
      return
    }
    onCancel()
  }

  return (
    <form className="stack lead-decision" onSubmit={submit}>
      <p className="muted">The reference is the policy identifier. The version you enter is the first version.</p>
      <label className="field">
        Policy name
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="field">
        Reference
        <input value={reference} onChange={(event) => setReference(event.target.value)} required />
      </label>
      <label className="field">
        Owner
        <input value={owner} onChange={(event) => setOwner(event.target.value)} required />
      </label>
      <label className="field">
        Version
        <input value={version} onChange={(event) => setVersion(event.target.value)} required />
      </label>
      <label className="field">
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value as PolicyStatus)}>
          {STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="button-row">
        <button type="submit" className="button button-primary">
          Save policy document
        </button>
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
