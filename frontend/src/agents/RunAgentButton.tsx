import { useState } from 'react'

import { DETERMINISTIC_AGENT_MODE } from './mode'
import { useAuth } from '../auth/AuthContext'
import { canRunAgentDraft } from '../auth/permissions'
import { useRegistry, type AgentProposal } from '../intake/registry'

/** Records a draft for human review. Running the agent does not approve anything. */
export function RunAgentButton({ proposal, label }: { proposal: AgentProposal; label: string }) {
  const { session } = useAuth()
  const allowed = canRunAgentDraft(session?.persona.role)
  const { recordProposal } = useRegistry()
  const [recorded, setRecorded] = useState(false)

  if (!allowed) return null

  return (
    <span className="review-edit">
      <button
        type="button"
        className="button button-secondary"
        onClick={() => {
          if (!canRunAgentDraft(session?.persona.role)) return
          recordProposal({ ...proposal, status: 'Draft' })
          setRecorded(true)
        }}
      >
        {label}
      </button>
      {recorded ? <span role="status">{DETERMINISTIC_AGENT_MODE} Draft recorded on Overview for human review. No model was called. This is not an approval.</span> : null}
    </span>
  )
}
