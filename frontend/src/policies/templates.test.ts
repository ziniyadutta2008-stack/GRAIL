import { describe, expect, it } from 'vitest'
import { required } from '../test-utils'

import { POLICY_TEMPLATES, readCompletedTemplate, suggestedTemplateId, templateMarkdown } from './templates'

describe('policy templates', () => {
  it('offers a standard security template and an industry template for each specialised use', () => {
    expect(POLICY_TEMPLATES.map((template) => template.id)).toEqual(['charter', 'standard', 'banking', 'healthcare', 'customer-service', 'workplace'])
    const charter = POLICY_TEMPLATES.find((template) => template.id === 'charter')
    expect(charter?.industry).toBe('All industries')
    expect(templateMarkdown(required(charter))).toContain('Review cadence')
    expect(templateMarkdown(required(charter))).toContain('does not approve a system by itself')
    expect(suggestedTemplateId('financeguard-ai')).toBe('banking')
    expect(suggestedTemplateId('contoso-health-diagnostic-support')).toBe('healthcare')
    expect(suggestedTemplateId('contoso-customer-assistant')).toBe('customer-service')
    expect(suggestedTemplateId('copilot-employee-support')).toBe('workplace')
  })

  it('rejects a blank template and accepts one with an owner, a reference, and an answer', () => {
    const banking = POLICY_TEMPLATES.find((template) => template.id === 'banking')
    expect(banking).toBeDefined()
    if (!banking) return
    const blank = templateMarkdown(banking, { systemName: 'FinanceGuard AI', reference: 'POL-BANK-financeguard-ai' })
    expect(blank).toContain('not a certified policy')
    expect(blank).toContain('Human override')
    expect(readCompletedTemplate(blank)).toBeNull()

    const filled = blank.replace('owner: [Name the policy owner]', 'owner: Model Owner').replace('Answer:\n', 'Answer: A person reviews a consequential output before it is used.\n')
    const completed = readCompletedTemplate(filled)
    expect(completed?.reference).toBe('POL-BANK-financeguard-ai')
    expect(completed?.owner).toBe('Model Owner')
    expect(completed?.answers[0]).toContain('consequential output')
  })
})
