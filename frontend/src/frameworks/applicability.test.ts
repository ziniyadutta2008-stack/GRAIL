import { describe, expect, it } from 'vitest'

import { assessApplicability, type ApplicabilitySubject } from './applicability'

const base: ApplicabilitySubject = {
  deployment: '',
  geography: '',
  users: 'Analysts',
  data: 'Internal notes',
  model: 'A scoring model',
  uses: 'Rank a queue',
  oversight: 'A person reviews the output',
  decisions: 'Recommends only',
  materiality: 'Low',
}

function names(subject: ApplicabilitySubject): string[] {
  return assessApplicability(subject).assessed.map((item) => item.name)
}

describe('law and framework applicability', () => {
  it('screens global frameworks and leaves country laws out when geography is not recorded', () => {
    const report = assessApplicability({ ...base, model: 'Fine-tuned language model', data: 'Personal financial data' })
    expect(report.scopeLabel).toBe('Geography not stated')
    expect(names({ ...base, model: 'Fine-tuned language model', data: 'Personal financial data' })).toContain('ISO/IEC 42001')
    expect(names({ ...base, model: 'Fine-tuned language model', data: 'Personal financial data' })).toContain('OWASP Top 10 for LLM Applications 2025')
    expect(names({ ...base, model: 'Fine-tuned language model', data: 'Personal financial data' }).join(' ')).not.toContain('EU AI Act')
    expect(report.notAssessed).toContain('PRA SS1/23')
    expect(report.notAssessed).toContain('not against the ECB')
  })

  it('screens a United Kingdom financial system against PRA SS1/23 and not the ECB', () => {
    const report = assessApplicability({
      ...base,
      geography: 'United Kingdom',
      data: 'Personal financial claims',
      model: 'Language model',
      uses: 'Claims review',
    })
    const assessed = report.assessed.map((item) => item.id)
    expect(report.scopeLabel).toBe('United Kingdom')
    expect(assessed).toContain('pra-ss123')
    expect(assessed).toContain('uk-gdpr')
    expect(assessed).not.toContain('eu-ai-act')
    expect(assessed).not.toContain('ecb')
    expect(report.notAssessed).toContain('not screened against the ECB')
  })

  it('flags EU database registration when a possible high-risk use is deployed in the European Union', () => {
    const report = assessApplicability({
      ...base,
      geography: 'European Union',
      data: 'Health data',
      model: 'Diagnostic model',
      uses: 'Diagnostic decision support',
      materiality: 'Critical',
    })
    const act = report.assessed.find((item) => item.id === 'eu-ai-act')
    expect(act?.outcome).toBe('Gap')
    expect(act?.rationale).toContain('Article 49')
    expect(act?.rationale).toContain('EU database')
    expect(act?.rationale).toContain('2 December 2027')
    expect(act?.rationale).toContain('does not classify')
  })

  it('screens the full catalogue when deployment is global', () => {
    const report = assessApplicability({
      ...base,
      geography: 'Global',
      data: 'Personal financial data',
      model: 'Language model',
      uses: 'Credit decision support',
      materiality: 'High',
    })
    const assessed = report.assessed.map((item) => item.id)
    expect(report.scopeLabel).toBe('Global')
    for (const id of ['eu-ai-act', 'pra-ss123', 'ecb', 'cnil', 'sr-11-7', 'mas', 'kr-ai-act', 'owasp-llm-2025']) {
      expect(assessed).toContain(id)
    }
    expect(report.assessed.find((item) => item.id === 'eu-ai-act')?.rationale).toContain('Article 49')
  })

  it('adds CNIL when France is named and does not treat that as a separate French AI statute', () => {
    const report = assessApplicability({ ...base, geography: 'France', data: 'Customer records' })
    const assessed = report.assessed.map((item) => item.id)
    expect(assessed).toContain('eu-ai-act')
    expect(assessed).toContain('cnil')
    expect(report.assessed.find((item) => item.id === 'cnil')?.rationale).toContain('applies directly')
  })
})
