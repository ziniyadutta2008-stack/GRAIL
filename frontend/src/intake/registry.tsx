import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { PORTFOLIO_PROPOSALS } from '../agents/deployedAgents'
import type { Role } from '../auth/session'
import { buildGovernancePackage, kpiMemoText, proposalsForPackage, type GovernancePackage } from './governancePackage'
import { DATA_AS_OF } from '../demo/demoData'
import {
  registrationDecision,
  suggestImpact,
  type ImpactAnswers,
  type ImpactSuggestion,
  type IntakeAnswers,
  type LifecycleGate,
} from './assess'

export interface Registration {
  id: string
  intake: IntakeAnswers
  impact: ImpactAnswers
  suggestion: ImpactSuggestion
  gate: LifecycleGate
  gateReason: string
  lastReview: string
  nextReview: string
  updatedBy: string
  discontinued?: boolean
}

export interface ReviewOverride {
  nextReview: string
  updatedBy: string
  /** The system stays on the register. The next review records that it is discontinued. */
  discontinued?: boolean
}

export type ProposalStatus = 'Draft' | 'Accepted' | 'Rejected'

/** A draft for named human review. Accepting it is not an approval. */
export interface AgentProposal {
  id: string
  agent: string
  task: string
  systemName: string
  sources: string[]
  assumptions: string[]
  proposedChange: string
  validation: string
  status: ProposalStatus
  /** The role that may amend, accept or reject this draft. */
  reviewerRole: Role
  /** Extra roles that may review the same draft. The primary reviewer stays in reviewerRole. */
  reviewerRoles?: Role[]
  /** Position in the FinanceGuard registration workflow. Other drafts omit it. */
  step?: number
  promptTemplate?: string
  promptVersion?: string
  confidence?: 'low' | 'medium' | 'high'
  inputTokens?: number
  outputTokens?: number
  estimatedCostUsd?: number
  latencyMs?: number
  amendedBy?: string
}

export interface KpiMemo {
  text: string
  status: ProposalStatus
  amendedBy?: string
}

interface StoredRegistry {
  registrations: Registration[]
  reviewOverrides: Record<string, ReviewOverride>
  proposals: AgentProposal[]
  packages: GovernancePackage[]
  kpiMemo: KpiMemo
}

interface RegistryState {
  registrations: Registration[]
  reviewOverrides: Record<string, ReviewOverride>
  proposals: AgentProposal[]
  packages: GovernancePackage[]
  kpiMemo: KpiMemo
  save: (intake: IntakeAnswers, impact: ImpactAnswers, updatedBy: string) => Registration
  amendKpiMemo: (text: string, amendedBy: string) => void
  decideKpiMemo: (status: Exclude<ProposalStatus, 'Draft'>) => void
  refreshKpiMemo: () => void
  updateNextReview: (id: string, nextReview: string, updatedBy: string) => void
  discontinue: (id: string, nextReview: string, updatedBy: string) => void
  recordProposal: (proposal: AgentProposal) => void
  decideProposal: (id: string, status: Exclude<ProposalStatus, 'Draft'>) => void
  amendProposal: (id: string, proposedChange: string, amendedBy: string) => void
}

const SEEDED_PROPOSALS: AgentProposal[] = [
  {
    id: 'proposal-financeguard-intake',
    agent: 'Governance Intake Agent',
    task: 'Review FinanceGuard AI purpose, users, data, vendor, deployment and human oversight',
    systemName: 'FinanceGuard AI',
    sources: ['FinanceGuard AI system record, data as of 2026-10-17'],
    assumptions: ['Preliminary materiality is a recommendation. A named person decides the gate.'],
    proposedChange:
      'FinanceGuard AI uses sensitive financial and personal data and needs enhanced human oversight before consequential outputs. Preliminary materiality High. A named person decides the gate.',
    validation: 'This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. Deterministic intake rules. No model was called. This is not an approval.',
    status: 'Draft',
    reviewerRole: 'governance_lead',
    step: 1,
    promptTemplate: 'governance_intake',
    promptVersion: 'v1',
    confidence: 'medium',
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    latencyMs: 0,
  },
]

const RegistryContext = createContext<RegistryState | null>(null)
const STORAGE_KEY = 'grail.registrations'

export function defaultNextReview(asOf = DATA_AS_OF): string {
  const date = new Date(`${asOf}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 90)
  return date.toISOString().slice(0, 10)
}

function seededProposals(): AgentProposal[] {
  return [...SEEDED_PROPOSALS, ...PORTFOLIO_PROPOSALS].map((proposal) => ({ ...proposal }))
}

/** Refresh an unamended draft, keep a decision or amendment, and retain reviews created in this session. */
function mergeSeededProposals(stored: AgentProposal[]): AgentProposal[] {
  const byId = new Map(stored.map((proposal) => [proposal.id, proposal]))
  const seeds = seededProposals()
  const merged = seeds.map((seed) => {
    const existing = byId.get(seed.id)
    if (!existing || (existing.status === 'Draft' && !existing.amendedBy)) return seed
    return {
      ...seed,
      status: existing.status,
      proposedChange: existing.proposedChange,
      ...(existing.amendedBy ? { amendedBy: existing.amendedBy } : {}),
    }
  })
  const seedIds = new Set(seeds.map((seed) => seed.id))
  return [...merged, ...stored.filter((proposal) => !seedIds.has(proposal.id))]
}

function emptyRegistry(): StoredRegistry {
  return {
    registrations: [],
    reviewOverrides: {},
    proposals: seededProposals(),
    packages: [],
    kpiMemo: { text: kpiMemoText([]), status: 'Draft' },
  }
}

/** Older sessions stored a registration before the review package existed. Rebuild those drafts. */
function completeStored(stored: StoredRegistry): StoredRegistry {
  let packages = stored.packages
  let proposals = stored.proposals
  for (const registration of stored.registrations) {
    if (packages.some((item) => item.systemId === registration.id)) continue
    const pack = buildGovernancePackage({
      id: registration.id,
      systemName: registration.intake.systemName.trim() || 'Unnamed system',
      intake: registration.intake,
      impact: registration.impact,
    })
    packages = [...packages, pack]
    const existing = new Set(proposals.map((proposal) => proposal.id))
    proposals = [...proposalsForPackage(pack).filter((proposal) => !existing.has(proposal.id)), ...proposals]
  }
  const names = packages.map((item) => item.systemName)
  const keepMemo = stored.kpiMemo.status === 'Accepted' || Boolean(stored.kpiMemo.amendedBy)
  const kpiMemo = keepMemo ? stored.kpiMemo : { text: kpiMemoText(names), status: 'Draft' as const }
  return { ...stored, packages, proposals, kpiMemo }
}

function readStored(): StoredRegistry {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyRegistry()
    const parsed = JSON.parse(raw) as StoredRegistry | Registration[]
    if (Array.isArray(parsed)) return { ...emptyRegistry(), registrations: parsed }
    const packages = parsed.packages ?? []
    return {
      registrations: parsed.registrations ?? [],
      reviewOverrides: parsed.reviewOverrides ?? {},
      proposals: mergeSeededProposals(parsed.proposals ?? []),
      packages,
      kpiMemo: parsed.kpiMemo ?? { text: kpiMemoText(packages.map((item) => item.systemName)), status: 'Draft' },
    }
  } catch {
    return emptyRegistry()
  }
}

function writeStored(value: StoredRegistry) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredRegistry>(() => {
    const value = completeStored(readStored())
    writeStored(value)
    return value
  })

  const value = useMemo<RegistryState>(
    () => ({
      registrations: stored.registrations,
      reviewOverrides: stored.reviewOverrides,
      proposals: stored.proposals,
      packages: stored.packages,
      kpiMemo: stored.kpiMemo,
      save: (intake, impact, updatedBy) => {
        const suggestion = suggestImpact(intake, impact)
        const decision = registrationDecision(suggestion, impact)
        const previous = stored.registrations.find((item) => item.intake.systemName === intake.systemName)
        const registration: Registration = {
          id: previous?.id ?? `reg-${Date.now()}`,
          intake,
          impact,
          suggestion,
          gate: decision.gate,
          gateReason: decision.reason,
          lastReview: DATA_AS_OF,
          nextReview: previous?.nextReview ?? defaultNextReview(),
          updatedBy,
        }
        const pack = buildGovernancePackage({ id: registration.id, systemName: intake.systemName.trim() || 'Unnamed system', intake, impact })
        const packageIds = new Set(proposalsForPackage(pack).map((proposal) => proposal.id))
        const names = [pack, ...stored.packages.filter((item) => item.systemId !== registration.id)].map((item) => item.systemName)
        const keepMemo = stored.kpiMemo.status === 'Accepted' || Boolean(stored.kpiMemo.amendedBy)
        const next: StoredRegistry = {
          registrations: [registration, ...stored.registrations.filter((item) => item.id !== registration.id)],
          reviewOverrides: stored.reviewOverrides,
          proposals: [...proposalsForPackage(pack), ...stored.proposals.filter((item) => !packageIds.has(item.id))],
          packages: [pack, ...stored.packages.filter((item) => item.systemId !== registration.id)],
          kpiMemo: keepMemo ? stored.kpiMemo : { text: kpiMemoText(names), status: 'Draft' },
        }
        setStored(next)
        writeStored(next)
        return registration
      },
      updateNextReview: (id, nextReview, updatedBy) => {
        const registration = stored.registrations.find((item) => item.id === id)
        const previous = stored.reviewOverrides[id]
        const discontinued = previous?.discontinued === true || registration?.discontinued === true
        const kept = discontinued ? { discontinued: true as const } : {}
        const next: StoredRegistry = registration
          ? {
              registrations: stored.registrations.map((item) => (item.id === id ? { ...item, nextReview, updatedBy, ...kept } : item)),
              reviewOverrides: previous || discontinued ? { ...stored.reviewOverrides, [id]: { nextReview, updatedBy, ...kept } } : stored.reviewOverrides,
              proposals: stored.proposals,
              packages: stored.packages,
              kpiMemo: stored.kpiMemo,
            }
          : {
              registrations: stored.registrations,
              reviewOverrides: { ...stored.reviewOverrides, [id]: { nextReview, updatedBy, ...kept } },
              proposals: stored.proposals,
              packages: stored.packages,
              kpiMemo: stored.kpiMemo,
            }
        setStored(next)
        writeStored(next)
      },
      discontinue: (id, nextReview, updatedBy) => {
        const registration = stored.registrations.find((item) => item.id === id)
        const previous = stored.reviewOverrides[id]
        const date = previous?.nextReview ?? registration?.nextReview ?? nextReview
        const next: StoredRegistry = {
          registrations: stored.registrations.map((item) => (item.id === id ? { ...item, updatedBy, discontinued: true } : item)),
          reviewOverrides: { ...stored.reviewOverrides, [id]: { nextReview: date, updatedBy, discontinued: true } },
          proposals: stored.proposals,
          packages: stored.packages,
          kpiMemo: stored.kpiMemo,
        }
        setStored(next)
        writeStored(next)
      },
      amendKpiMemo: (text, amendedBy) => {
        const trimmed = text.trim()
        if (!trimmed || stored.kpiMemo.status === 'Accepted') return
        const next: StoredRegistry = { ...stored, kpiMemo: { text: trimmed, status: 'Draft', amendedBy } }
        setStored(next)
        writeStored(next)
      },
      decideKpiMemo: (status) => {
        if (stored.kpiMemo.status === 'Accepted') return
        const next: StoredRegistry = { ...stored, kpiMemo: { ...stored.kpiMemo, status } }
        setStored(next)
        writeStored(next)
      },
      refreshKpiMemo: () => {
        const next: StoredRegistry = {
          ...stored,
          kpiMemo: { text: kpiMemoText(stored.packages.map((item) => item.systemName)), status: 'Draft' },
        }
        setStored(next)
        writeStored(next)
      },
      recordProposal: (proposal) => {
        const next: StoredRegistry = {
          registrations: stored.registrations,
          reviewOverrides: stored.reviewOverrides,
          proposals: [proposal, ...stored.proposals.filter((item) => item.id !== proposal.id)],
          packages: stored.packages,
          kpiMemo: stored.kpiMemo,
        }
        setStored(next)
        writeStored(next)
      },
      decideProposal: (id, status) => {
        const next: StoredRegistry = {
          registrations: stored.registrations,
          reviewOverrides: stored.reviewOverrides,
          proposals: stored.proposals.map((item) => (item.id === id ? { ...item, status } : item)),
          packages: stored.packages,
          kpiMemo: stored.kpiMemo,
        }
        setStored(next)
        writeStored(next)
      },
      amendProposal: (id, proposedChange, amendedBy) => {
        const text = proposedChange.trim()
        if (!text) return
        const next: StoredRegistry = {
          registrations: stored.registrations,
          reviewOverrides: stored.reviewOverrides,
          proposals: stored.proposals.map((item) => (item.id === id ? { ...item, proposedChange: text, amendedBy, status: 'Draft' } : item)),
          packages: stored.packages,
          kpiMemo: stored.kpiMemo,
        }
        setStored(next)
        writeStored(next)
      },
    }),
    [stored],
  )

  return <RegistryContext value={value}>{children}</RegistryContext>
}

export function useRegistry(): RegistryState {
  const value = use(RegistryContext)
  if (!value) throw new Error('useRegistry must be used inside RegistryProvider')
  return value
}
