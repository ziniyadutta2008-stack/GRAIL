import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { policyRecords, type Policy } from '../demo/demoData'

export type PolicyStatus = 'Draft' | 'Under Review' | 'Approved'

export interface PolicyDocument {
  id: string
  title: string
  version: string
  status: PolicyStatus
  owner: string
  summary: string
  fileName: string
  fileText: string | null
  fileDataUrl: string | null
  source: 'generated' | 'uploaded'
  /** The AI system this document belongs to. */
  systemId: string
}

export type PolicyDraftStatus = 'Draft' | 'Accepted' | 'Rejected'

/** A draft produced on one system's policy page. Accepting it is not a policy approval. */
export interface SystemPolicyDraft {
  systemId: string
  text: string
  status: PolicyDraftStatus
  amendedBy?: string
  added: boolean
  findingText: string
}

interface NewPolicy {
  id: string
  title: string
  version: string
  status: PolicyStatus
  owner: string
  summary: string
  systemId: string
  fileName?: string
  fileText?: string | null
  fileDataUrl?: string | null
}

interface LibraryState {
  policies: PolicyDocument[]
  updateStatus: (id: string, status: PolicyStatus) => void
  uploadVersion: (id: string, status: PolicyStatus, file: { fileName: string; fileText: string | null; fileDataUrl: string | null }) => void
  addPolicy: (policy: NewPolicy) => boolean
  draftFor: (systemId: string) => SystemPolicyDraft | undefined
  produceDraft: (systemId: string, text: string) => void
  amendDraft: (systemId: string, text: string, amendedBy: string) => void
  decideDraft: (systemId: string, status: Exclude<PolicyDraftStatus, 'Draft'>) => void
  addDraftToFindings: (systemId: string) => void
  amendFindingText: (systemId: string, text: string) => void
}

const LibraryContext = createContext<LibraryState | null>(null)
const STORAGE_KEY = 'grail.policies'
const DRAFT_KEY = 'grail.policy-drafts'
const STATUSES = new Set<PolicyStatus>(['Draft', 'Under Review', 'Approved'])

/** The next published version. 1.0 becomes 2.0 for both Draft and Approved uploads. */
export function nextPolicyVersion(current: string): string {
  const match = /^(\d+)/.exec(current.trim())
  const major = match ? Number(match[1]) + 1 : 1
  return `${major}.0`
}

export function policyDocumentText(policy: Pick<PolicyDocument, 'title' | 'id' | 'version' | 'status' | 'owner' | 'summary'>): string {
  return [
    'GRAIL policy document',
    'Synthetic demonstration data. This document is not certification, an audit opinion, or legal advice.',
    '',
    `Policy: ${policy.title}`,
    `Reference: ${policy.id}`,
    `Version: ${policy.version}`,
    `Status: ${policy.status}`,
    `Owner: ${policy.owner}`,
    '',
    policy.summary,
  ].join('\n')
}

function policyStatus(value: string): PolicyStatus {
  return STATUSES.has(value as PolicyStatus) ? (value as PolicyStatus) : 'Draft'
}

function summaryOf(record: Policy): string {
  if ('summary' in record && typeof record.summary === 'string') return record.summary
  if ('sections' in record) {
    return record.sections
      .map((section) => {
        const topic = 'topic' in section && section.topic ? ` (${section.topic.replaceAll('_', ' ')})` : ''
        return `${section.heading.replaceAll('_', ' ')}${topic}: ${section.summary}`
      })
      .join('\n')
  }
  return ''
}

function seedPolicies(): PolicyDocument[] {
  return policyRecords.map((record) => {
    const policy: PolicyDocument = {
      id: record.id,
      title: record.title,
      version: record.version,
      status: policyStatus(record.status),
      owner: record.owner,
      summary: summaryOf(record),
      fileName: '',
      fileText: null,
      fileDataUrl: null,
      source: 'generated',
      systemId: record.ai_system_id,
    }
    policy.fileName = `${record.id}-v${record.version}.txt`
    policy.fileText = policyDocumentText(policy)
    return policy
  })
}

function withSystem(policy: PolicyDocument, seeds: PolicyDocument[]): PolicyDocument {
  if (policy.systemId) return policy
  const seed = seeds.find((item) => item.id === policy.id)
  return { ...policy, systemId: seed?.systemId ?? 'financeguard-ai' }
}

function readStored(): PolicyDocument[] {
  const seeds = seedPolicies()
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return seeds
    const parsed = JSON.parse(raw) as PolicyDocument[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map((policy) => withSystem(policy, seeds)) : seeds
  } catch {
    return seeds
  }
}

function readDrafts(): Record<string, SystemPolicyDraft> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, SystemPolicyDraft>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStored(policies: PolicyDocument[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(policies))
}

function writeDrafts(drafts: Record<string, SystemPolicyDraft>) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

export function downloadPolicy(policy: PolicyDocument) {
  const href = policy.fileDataUrl ?? URL.createObjectURL(new Blob([policy.fileText ?? policyDocumentText(policy)], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = href
  link.download = policy.fileName || `${policy.id}-v${policy.version}.txt`
  link.click()
  if (!policy.fileDataUrl) URL.revokeObjectURL(href)
}

export function PolicyLibraryProvider({ children }: { children: ReactNode }) {
  const [policies, setPolicies] = useState<PolicyDocument[]>(readStored)
  const [drafts, setDrafts] = useState<Record<string, SystemPolicyDraft>>(readDrafts)

  const value = useMemo<LibraryState>(() => {
    const commit = (next: PolicyDocument[]) => {
      setPolicies(next)
      writeStored(next)
    }
    const commitDrafts = (next: Record<string, SystemPolicyDraft>) => {
      setDrafts(next)
      writeDrafts(next)
    }
    return {
      policies,
      updateStatus: (id, status) => {
        commit(
          policies.map((policy) => {
            if (policy.id !== id) return policy
            const next = { ...policy, status }
            return policy.source === 'generated' ? { ...next, fileText: policyDocumentText(next) } : next
          }),
        )
      },
      uploadVersion: (id, status, file) => {
        commit(
          policies.map((policy) => {
            if (policy.id !== id) return policy
            const version = nextPolicyVersion(policy.version)
            return {
              ...policy,
              version,
              status,
              fileName: file.fileName,
              fileText: file.fileText,
              fileDataUrl: file.fileDataUrl,
              source: 'uploaded' as const,
            }
          }),
        )
      },
      addPolicy: (policy) => {
        const id = policy.id.trim()
        const title = policy.title.trim()
        const owner = policy.owner.trim()
        const version = policy.version.trim()
        if (!id || !title || !owner || !version || policies.some((item) => item.id.toLowerCase() === id.toLowerCase())) return false
        const document: PolicyDocument = {
          id,
          title,
          version,
          status: policy.status,
          owner,
          summary: policy.summary.trim() || 'Organization-authored policy. No further summary was supplied.',
          fileName: policy.fileName || `${id}-v${version}.txt`,
          fileText: policy.fileText ?? null,
          fileDataUrl: policy.fileDataUrl ?? null,
          source: policy.fileText || policy.fileDataUrl ? 'uploaded' : 'generated',
          systemId: policy.systemId,
        }
        if (document.source === 'generated') document.fileText = policyDocumentText(document)
        commit([document, ...policies])
        return true
      },
      draftFor: (systemId) => drafts[systemId],
      produceDraft: (systemId, text) => {
        const existing = drafts[systemId]
        if (existing?.status === 'Accepted') return
        commitDrafts({ ...drafts, [systemId]: { systemId, text, status: 'Draft', added: false, findingText: '' } })
      },
      amendDraft: (systemId, text, amendedBy) => {
        const existing = drafts[systemId]
        if (!existing || existing.status !== 'Draft') return
        commitDrafts({ ...drafts, [systemId]: { ...existing, text, amendedBy } })
      },
      decideDraft: (systemId, status) => {
        const existing = drafts[systemId]
        if (!existing || existing.status === 'Accepted') return
        commitDrafts({ ...drafts, [systemId]: { ...existing, status } })
      },
      addDraftToFindings: (systemId) => {
        const existing = drafts[systemId]
        if (!existing || existing.status !== 'Accepted' || existing.added) return
        commitDrafts({ ...drafts, [systemId]: { ...existing, added: true, findingText: existing.text } })
      },
      amendFindingText: (systemId, text) => {
        const existing = drafts[systemId]
        if (!existing?.added) return
        commitDrafts({ ...drafts, [systemId]: { ...existing, findingText: text } })
      },
    }
  }, [policies, drafts])

  return <LibraryContext value={value}>{children}</LibraryContext>
}

export function usePolicies(): LibraryState {
  const value = use(LibraryContext)
  if (!value) throw new Error('usePolicies must be used inside PolicyLibraryProvider')
  return value
}
