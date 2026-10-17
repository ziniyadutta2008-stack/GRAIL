import { useState } from 'react'

import { DETERMINISTIC_AGENT_MODE } from '../agents/mode'

type NodeKind = 'Agent' | 'Deterministic' | 'Human'

interface ArchitectureNode {
  name: string
  kind: NodeKind
  detail: string
}

interface ArchitectureStage {
  title: string
  nodes: ArchitectureNode[]
}

const STAGES: ArchitectureStage[] = [
  {
    title: 'Intake',
    nodes: [
      {
        name: 'Governance Intake',
        kind: 'Agent',
        detail: 'Runs when system context is new or changed. Reviews purpose, users, data, deployment, vendor and human oversight.',
      },
    ],
  },
  {
    title: 'Mapping',
    nodes: [
      {
        name: 'Framework Mapping',
        kind: 'Agent',
        detail: 'Proposes Responsible AI, ISO/IEC 42001 and SOC 2 mappings for review.',
      },
    ],
  },
  {
    title: 'Evidence',
    nodes: [
      {
        name: 'Evidence and Assurance',
        kind: 'Agent',
        detail: 'Reviews relevance, provenance, currency and apparent sufficiency.',
      },
    ],
  },
  {
    title: 'In parallel',
    nodes: [
      {
        name: 'Gap and Remediation',
        kind: 'Agent',
        detail: 'Drafts findings, severity and actions with a definition of done.',
      },
      {
        name: 'Policy or exception draft',
        kind: 'Agent',
        detail: 'One run drafts either a policy section or an exception analysis. Both use the same worker and separate prompts.',
      },
    ],
  },
  {
    title: 'Consolidation',
    nodes: [
      {
        name: 'Council Secretariat',
        kind: 'Agent',
        detail: 'Assembles the draft council pack from the results of this run.',
      },
    ],
  },
  {
    title: 'Before review',
    nodes: [
      {
        name: 'Governance quality',
        kind: 'Deterministic',
        detail: 'Reports contradictions, missing evidence and unsupported claims.',
      },
    ],
  },
  {
    title: 'Checkpoint',
    nodes: [
      {
        name: 'Human review and approval',
        kind: 'Human',
        detail: 'A named person amends, accepts or rejects. The machine workflow stops at Awaiting Human Review.',
      },
    ],
  },
]

const BESIDE: ArchitectureNode[] = [
  {
    name: 'RACI validation',
    kind: 'Deterministic',
    detail: 'Requires exactly one Accountable party and at least one Responsible party.',
  },
  {
    name: 'SOC 2 readiness',
    kind: 'Deterministic',
    detail: 'A blocking Fail cannot yield Go. Conditional Go lists every open condition.',
  },
  {
    name: 'KPI and charter',
    kind: 'Deterministic',
    detail: 'Calculates the official KPIs and charter-review triggers.',
  },
  {
    name: 'Responsible AI Ethics',
    kind: 'Agent',
    detail: 'Proposes Proceed, Mitigate or Reject. Release state stays a deterministic rule.',
  },
  {
    name: 'Data Governance and Lineage',
    kind: 'Agent',
    detail: 'Proposes dataset and lineage findings. A dataset Fail does not by itself reject the use case.',
  },
]

/** Public explanation of the constrained agent path. The full diagram stays closed until requested. */
export function AgentArchitecture() {
  const [open, setOpen] = useState(false)
  return (
    <section className="home-section" aria-labelledby="architecture-title">
      <div className="home-section-head">
        <h2 id="architecture-title">Agent architecture</h2>
        <p>
          {DETERMINISTIC_AGENT_MODE} The workflow orchestrator sequences the approved path and stops at human review. Workers draft. Deterministic services calculate the official result.
        </p>
      </div>
      <ol className="orch-summary">
        {STAGES.map((stage) => (
          <li key={stage.title}>
            <span>{stage.title}</span>
            <strong>{stage.nodes.map((node) => node.name).join(' · ')}</strong>
          </li>
        ))}
      </ol>
      <p className="orch-summary-note">RACI, SOC 2 readiness, KPI and charter, Responsible AI Ethics, and Data Governance and Lineage stay beside this workflow.</p>
      <button
        type="button"
        className="home-architecture-toggle"
        aria-expanded={open}
        aria-controls="agent-architecture-detail"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide detailed agent architecture' : 'View detailed agent architecture'}
      </button>
      {open ? <ArchitectureDetail /> : null}
    </section>
  )
}

function ArchitectureDetail() {
  return (
    <figure className="orch" id="agent-architecture-detail">
        <figcaption className="orch-orchestrator">
          <strong>Workflow orchestrator</strong>
          <span>Validates the request, pins record versions, runs ready steps, retries only transient failures, and ends at Awaiting Human Review.</span>
        </figcaption>
        <ol className="orch-flow">
          {STAGES.map((stage) => (
            <li key={stage.title}>
              <p className="orch-stage">{stage.title}</p>
              <ul className="orch-nodes">
                {stage.nodes.map((node) => (
                  <li key={node.name} className={`orch-node orch-node-${node.kind.toLowerCase()}`}>
                    <span className="orch-kind">{node.kind}</span>
                    <strong>{node.name}</strong>
                    <span>{node.detail}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="orch-stage">Recorded beside this workflow</p>
        <ul className="orch-nodes">
          {BESIDE.map((node) => (
            <li key={node.name} className={`orch-node orch-node-${node.kind.toLowerCase()}`}>
              <span className="orch-kind">{node.kind}</span>
              <strong>{node.name}</strong>
              <span>{node.detail}</span>
            </li>
          ))}
        </ul>
        <p className="orch-note">
          The registration workflow calls the steps in the sequence above. Policy drafting and exception analysis share one worker, and a run selects one mode. RACI validation, SOC 2 readiness, KPI and charter triggers, ethics thresholds and governance quality remain code. Responsible AI Ethics and Data Governance and Lineage draft only. An agent recommendation cannot override those services, approve a release, or close a finding.
        </p>
      </figure>
  )
}
