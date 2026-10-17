import { useEffect, useId, useState } from 'react'

import { sha256Hex } from '../agents/hash'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS } from '../auth/session'
import { useRegistry, type AgentProposal } from '../intake/registry'

const MONEY = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

function ProposalCard({ proposal }: { proposal: AgentProposal }) {
  const { session } = useAuth()
  const { decideProposal, amendProposal } = useRegistry()
  const [amending, setAmending] = useState(false)
  const [draft, setDraft] = useState(proposal.proposedChange)
  const [outputHash, setOutputHash] = useState('')
  const taskId = useId()

  useEffect(() => {
    let current = true
    void sha256Hex(proposal.proposedChange).then((hash) => {
      if (current) setOutputHash(hash)
    })
    return () => {
      current = false
    }
  }, [proposal.proposedChange])

  const save = () => {
    const name = session?.persona.display_name || 'Named reviewer'
    amendProposal(proposal.id, draft, name)
    setAmending(false)
  }

  return (
    <li className="proposal">
      <p>
        {proposal.step ? <span className="mono">Step {proposal.step} of 6. </span> : null}
        <strong>{proposal.agent}</strong> proposed a review of {proposal.systemName}.
      </p>
      <p>Assigned to the {ROLE_LABELS[proposal.reviewerRole]} to amend, accept or reject.</p>
      <p id={taskId}>{proposal.task}</p>
      {amending ? (
        <label className="field">
          Amendment for {proposal.agent}
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} />
        </label>
      ) : (
        <p>{proposal.proposedChange}</p>
      )}
      {proposal.amendedBy ? <p>Amended by {proposal.amendedBy}. The proposal remains a draft until it is accepted or rejected.</p> : null}
      <p>
        <span className="muted">Sources: </span>
        {proposal.sources.join('; ')}
      </p>
      <p>
        <span className="muted">Assumptions: </span>
        {proposal.assumptions.join(' ')}
      </p>
      <p>
        <span className="muted">Validation: </span>
        {proposal.validation}
      </p>
      <p className="proposal-meta">
        Prompt {proposal.promptTemplate ?? 'not recorded'} {proposal.promptVersion ?? ''}. Model: none, deterministic rules. Confidence: {proposal.confidence ?? 'not recorded'}, explanatory only. Tokens: {proposal.inputTokens ?? 0} in, {proposal.outputTokens ?? 0} out.
        Estimated cost {MONEY.format(proposal.estimatedCostUsd ?? 0)}. Latency {proposal.latencyMs ?? 0} ms.
      </p>
      <p className="proposal-hash">Output hash: {outputHash || 'Calculating output hash.'}</p>
      {proposal.status === 'Draft' ? (
        <div className="button-row">
          {amending ? (
            <>
              <button type="button" className="button button-primary" onClick={save}>
                Save amendment for {proposal.agent}
              </button>
              <button type="button" className="button button-secondary" onClick={() => { setDraft(proposal.proposedChange); setAmending(false) }}>
                Cancel amendment
              </button>
            </>
          ) : (
            <>
              <button type="button" className="button button-secondary" aria-describedby={taskId} onClick={() => setAmending(true)}>
                Amend {proposal.agent} draft for {proposal.systemName}
              </button>
              <button type="button" className="button button-primary" aria-describedby={taskId} onClick={() => decideProposal(proposal.id, 'Accepted')}>
                Accept {proposal.agent} draft for {proposal.systemName}
              </button>
              <button type="button" className="button button-secondary" aria-describedby={taskId} onClick={() => decideProposal(proposal.id, 'Rejected')}>
                Reject {proposal.agent} draft for {proposal.systemName}
              </button>
            </>
          )}
        </div>
      ) : (
        <p>
          {proposal.status} by a named person. The underlying records are unchanged. This does not approve an exception, sign a RACI, close remediation, or declare a control effective.
        </p>
      )}
    </li>
  )
}

export function ProposalReview({ proposals }: { proposals: AgentProposal[] }) {
  const workflow = proposals.filter((proposal) => proposal.step).sort((left, right) => (left.step ?? 0) - (right.step ?? 0))
  const others = proposals.filter((proposal) => !proposal.step && proposal.status === 'Draft')
  return (
    <>
      {workflow.length > 0 ? (
        <>
          <h3>Drafts assigned to you</h3>
          <p className="muted">
            These are the steps you amend, accept or reject. Other steps stay with their assigned role. Accepting a draft does not approve an exception, sign the RACI, close remediation, declare a control effective, or claim certification.
          </p>
          <ol className="proposal-list">
            {workflow.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </ol>
        </>
      ) : null}
      {others.length > 0 ? (
        <>
          <h3>Other drafts</h3>
          <ul className="proposal-list">
            {others.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </ul>
        </>
      ) : null}
    </>
  )
}
