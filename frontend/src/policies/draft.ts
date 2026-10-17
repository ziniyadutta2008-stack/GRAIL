/** A deterministic policy draft from the documents recorded for one AI system. No model is called. */

export interface DraftSource {
  id: string
  title: string
  version: string
  status: string
  summary: string
}

export function policyDraftFromDocuments(systemName: string, documents: DraftSource[], applicability = ''): string {
  const sources = documents.map((document) => `${document.id} ${document.title} v${document.version} (${document.status})`).join('; ')
  const approved = documents.filter((document) => document.status === 'Approved')
  const pending = documents.filter((document) => document.status !== 'Approved')
  const paragraphs = [
    `Draft for ${systemName}, drawn from the policy documents on this page.`,
    `Sources: ${sources}.`,
  ]
  if (documents.some((document) => document.id === 'POL-SEC-01')) {
    paragraphs.push(
      'Address GAP-01 and GAP-02: classify AI security incidents, require human review before consequential outputs, and keep continuous monitoring.',
    )
  }
  for (const document of approved) {
    const sentence = document.summary.split('\n')[0] ?? document.summary
    paragraphs.push(`${document.id}: ${sentence}`)
  }
  if (pending.length > 0) {
    paragraphs.push(`Not used as approved sources: ${pending.map((document) => `${document.id} is ${document.status}`).join('; ')}.`)
  }
  if (applicability) paragraphs.push(`Laws and frameworks in scope: ${applicability}`)
  paragraphs.push('Unresolved assumption: legal review of enforcement is not recorded on these documents. This draft does not decide that any law is met.')
  paragraphs.push('This demonstration runs agents in deterministic mode. Production deployments can optionally use Amazon Bedrock for evidence-grounded drafting. This draft does not approve a policy, an exception, or a control. No model was called.')
  return paragraphs.join('\n\n')
}
