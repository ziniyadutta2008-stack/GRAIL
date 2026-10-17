/**
 * Applicability screen for laws and frameworks.
 * Geography and sector decide what is assessed. A result is not a legal opinion,
 * a classification, a certification, or an audit opinion.
 */

import type { ImpactAnswers, IntakeAnswers } from '../intake/assess'

export type LawOutcome = 'Screened' | 'Gap'

export interface ApplicabilitySubject {
  deployment: string
  geography: string
  users: string
  data: string
  model: string
  uses: string
  oversight: string
  decisions: string
  materiality: string
}

export interface LawAssessment {
  id: string
  name: string
  jurisdiction: string
  kind: 'Law' | 'Framework' | 'Supervisory expectation' | 'Screening note'
  outcome: LawOutcome
  rationale: string
}

export interface ApplicabilityReport {
  scopeLabel: string
  places: string[]
  summary: string
  assessed: LawAssessment[]
  notAssessed: string
}

const PLACES = [
  'United Kingdom',
  'European Union',
  'France',
  'United States',
  'Singapore',
  'South Korea',
  'China',
  'Japan',
  'Canada',
  'Brazil',
  'Australia',
  'India',
  'United Arab Emirates',
] as const

const GLOBAL = /\b(global|worldwide|international|multi-country|multi country|all jurisdictions|all regions)\b/i
const UK = /\b(united kingdom|great britain|britain|england|scotland|wales|northern ireland|\buk\b|\bpra\b|\bfca\b)\b/i
const FRANCE = /\b(france|french|\bcnil\b)\b/i
const EU = /\b(european union|\beu\b|\beea\b|eurozone|euro area|\becb\b|germany|german|italy|italian|spain|spanish|netherlands|dutch|ireland|irish|belgium|sweden|poland)\b/i
const US = /\b(united states|u\.s\.a\.|\busa\b|u\.s\.|colorado|new york|illinois|california|federal reserve|sr 11-7)\b/i
const SINGAPORE = /\b(singapore|\bmas\b|\bimda\b|\bpdpa\b)\b/i
const KOREA = /\b(south korea|republic of korea|\bkorea\b|korean)\b/i
const CHINA = /\b(china|chinese|\bcac\b|beijing|shanghai)\b/i
const JAPAN = /\b(japan|japanese|\bmeti\b|\bcao\b)\b/i
const CANADA = /\b(canada|canadian|quebec|\baida\b)\b/i
const BRAZIL = /\b(brazil|brazilian|\blgpd\b)\b/i
const AUSTRALIA = /\b(australia|australian)\b/i
const INDIA = /\b(india|indian|\bmeity\b)\b/i
const UAE = /\b(united arab emirates|\buae\b|dubai|abu dhabi)\b/i
const FINANCIAL = /\b(financ\w*|bank|credit|payment|insurance|trading|claims|investment|prudential|underwriting)\b/i
const HEALTH = /\b(health|clinic|clinical|diagnos|medical|patient|hospital)\b/i
const EMPLOYMENT = /\b(hiring|recruitment|employment decision|automated employment|video interview)\b/i
const CREDIT = /\b(creditworth|credit scor|credit decision|loan approval)\b/i
const LLM = /\b(llm|language model|generative|chatbot|copilot|\bgpt\b)\b/i
const PERSONAL = /\b(personal|customer|health|financial|patient|employee data|account data|\bpii\b)\b/i
const HIGH_RISK = /\b(biometric|law enforcement|critical infrastructure|education admission|essential service|insurance pricing)\b/i
const EURO_BANK = /\b(eurozone|euro area|\becb\b|significant institution)\b/i
const CUSTOMER_FACING = /\bcustomer-facing\b/i
const NOT_CUSTOMER_FACING = /\b(?:no|not)\s+customer-facing\b/i

const NOT_A_LEGAL_OPINION = 'This screen does not classify the system and is not a legal opinion.'

function corpus(subject: ApplicabilitySubject): string {
  return [subject.geography, subject.deployment, subject.users, subject.data, subject.model, subject.uses, subject.decisions, subject.oversight].join(' ')
}

function placesFrom(text: string): string[] {
  if (GLOBAL.test(text)) return [...PLACES]
  const places: string[] = []
  if (UK.test(text)) places.push('United Kingdom')
  if (EU.test(text) || FRANCE.test(text)) places.push('European Union')
  if (FRANCE.test(text)) places.push('France')
  if (US.test(text)) places.push('United States')
  if (SINGAPORE.test(text)) places.push('Singapore')
  if (KOREA.test(text)) places.push('South Korea')
  if (CHINA.test(text)) places.push('China')
  if (JAPAN.test(text)) places.push('Japan')
  if (CANADA.test(text)) places.push('Canada')
  if (BRAZIL.test(text)) places.push('Brazil')
  if (AUSTRALIA.test(text)) places.push('Australia')
  if (INDIA.test(text)) places.push('India')
  if (UAE.test(text)) places.push('United Arab Emirates')
  return places
}

function highRisk(text: string, materiality: string): boolean {
  if (CREDIT.test(text) || EMPLOYMENT.test(text) || HEALTH.test(text) || HIGH_RISK.test(text)) return true
  return /^(High|Critical)$/.test(materiality) && /\b(consequential|automated decision)\b/i.test(text)
}

export function assessApplicability(subject: ApplicabilitySubject): ApplicabilityReport {
  const text = corpus(subject)
  const places = placesFrom(text)
  const unique = [...new Set(places)]
  const global = GLOBAL.test(text)
  const financial = FINANCIAL.test(text)
  const personal = PERSONAL.test(text)
  const llm = LLM.test(text)
  const risk = highRisk(text, subject.materiality)
  const customerFacing = CUSTOMER_FACING.test(text) && !NOT_CUSTOMER_FACING.test(text)
  const assessed: LawAssessment[] = []
  const add = (item: LawAssessment) => assessed.push(item)

  add({
    id: 'iso-42001',
    name: 'ISO/IEC 42001',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'AI management-system mapping is screened for every system. A mapping is not certification, and Implemented still requires current evidence.',
  })
  add({
    id: 'iso-23894',
    name: 'ISO/IEC 23894',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'AI risk-management guidance is screened alongside ISO/IEC 42001. The standard text is not reproduced.',
  })
  add({
    id: 'nist-ai-rmf',
    name: 'NIST AI Risk Management Framework 1.0',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'Govern, Map, Measure and Manage are the reference functions. Alignment is not claimed.',
  })
  add({
    id: 'oecd',
    name: 'OECD AI Principles',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'Inclusive growth, human-centred values, transparency, robustness and accountability are screened as principles, not as a statute.',
  })
  add({
    id: 'unesco',
    name: 'UNESCO Recommendation on the Ethics of Artificial Intelligence',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'UNESCO soft-law ethics recommendation is screened for every system. It is not a statute.',
  })
  add({
    id: 'coe-ai',
    name: 'Council of Europe Framework Convention on AI',
    jurisdiction: 'International',
    kind: 'Law',
    outcome: 'Screened',
    rationale: 'The Framework Convention is screened as an international treaty track. Confirm ratifications before treating Party duties as in force for a geography.',
  })
  add({
    id: 'g7-hiroshima',
    name: 'G7 Hiroshima AI Process',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'Voluntary Hiroshima Process code for advanced AI systems. Alignment is not claimed.',
  })
  add({
    id: 'ieee-ethics',
    name: 'IEEE ethically aligned design and AI standards',
    jurisdiction: 'International',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'IEEE voluntary ethics and 7000-series standards are screened as professional references, not as law.',
  })
  add({
    id: 'ms-rai',
    name: 'Microsoft Responsible AI Standard v2',
    jurisdiction: 'Organization reference',
    kind: 'Framework',
    outcome: 'Screened',
    rationale: 'Organization-authored goal references only. The screen does not decide that the standard is met.',
  })
  if (llm) {
    const described = /prompt injection|sensitive information disclosure/i.test(text)
    add({
      id: 'owasp-llm-2025',
      name: 'OWASP Top 10 for LLM Applications 2025',
      jurisdiction: 'International',
      kind: 'Framework',
      outcome: described ? 'Screened' : 'Gap',
      rationale: described
        ? 'The registration describes prompt-injection or disclosure controls. The OWASP list is not reproduced, and the description is not evidence.'
        : 'The system uses a language model. Prompt injection, sensitive-information disclosure and improper output handling are not described. The OWASP list is not reproduced.',
    })
  }

  const inUk = unique.includes('United Kingdom')
  const inEu = unique.includes('European Union')
  const inFrance = unique.includes('France')
  const inUs = unique.includes('United States')
  const inSg = unique.includes('Singapore')
  const inKr = unique.includes('South Korea')
  const inCn = unique.includes('China')
  const inJp = unique.includes('Japan')
  const inCa = unique.includes('Canada')
  const inBr = unique.includes('Brazil')
  const inAu = unique.includes('Australia')
  const inIn = unique.includes('India')
  const inUae = unique.includes('United Arab Emirates')

  if (inUk) {
    add({
      id: 'uk-principles',
      name: 'UK pro-innovation AI principles',
      jurisdiction: 'United Kingdom',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'No single United Kingdom AI statute is applied by this screen. The pro-innovation principles were screened because deployment is recorded in the United Kingdom.',
    })
    if (personal) {
      add({
        id: 'uk-gdpr',
        name: 'UK GDPR and Data Protection Act 2018',
        jurisdiction: 'United Kingdom',
        kind: 'Law',
        outcome: 'Gap',
        rationale: 'Personal, customer or financial data is described and deployment is in the United Kingdom. No UK GDPR record is attached.',
      })
    }
    if (financial) {
      add({
        id: 'pra-ss123',
        name: 'PRA SS1/23 model risk management',
        jurisdiction: 'United Kingdom',
        kind: 'Supervisory expectation',
        outcome: 'Gap',
        rationale: 'The use is financial and deployment is in the United Kingdom, so PRA SS1/23 is screened. No model-risk inventory is attached. This does not decide whether the firm is a PRA-regulated bank.',
      })
      add({
        id: 'fca',
        name: 'FCA conduct expectations for AI',
        jurisdiction: 'United Kingdom',
        kind: 'Supervisory expectation',
        outcome: 'Screened',
        rationale: 'FCA consumer and conduct expectations are screened for a United Kingdom financial use. This is not an FCA determination.',
      })
    }
  }

  if (inEu) {
    add({
      id: 'eu-ai-act',
      name: 'EU AI Act, Regulation (EU) 2024/1689',
      jurisdiction: 'European Union',
      kind: 'Law',
      outcome: risk ? 'Gap' : 'Screened',
      rationale: risk
        ? `The recorded use can indicate a high-risk AI system. If that classification is confirmed for an Annex III system, Article 49 requires the provider to register themselves and the system in the EU database before placing it on the market or putting it into service. Annex III high-risk obligations apply from 2 December 2027. Critical-infrastructure systems are registered nationally, and some law-enforcement and migration systems use a non-public section. No registration evidence is attached. ${NOT_A_LEGAL_OPINION}`
        : `The EU AI Act was screened${customerFacing ? ', including transparency for a customer-facing system' : ''}. The recorded use does not by itself indicate an Annex III high-risk system or an Article 49 EU-database registration. ${NOT_A_LEGAL_OPINION}`,
    })
    if (personal) {
      add({
        id: 'gdpr',
        name: 'GDPR, Regulation (EU) 2016/679',
        jurisdiction: 'European Union',
        kind: 'Law',
        outcome: 'Gap',
        rationale: 'Personal or customer data is described and deployment includes the European Union. No GDPR record is attached.',
      })
    }
    if (financial) {
      const euroArea = global || EURO_BANK.test(text)
      add({
        id: 'ecb',
        name: 'ECB supervisory expectations for models',
        jurisdiction: 'European Union',
        kind: 'Supervisory expectation',
        outcome: euroArea ? 'Gap' : 'Screened',
        rationale: euroArea
          ? 'A euro-area or global financial use was recorded, so ECB supervisory expectations for models were screened. The screen does not decide whether the firm is a significant institution. No model-risk evidence is attached.'
          : 'The use is financial and deployment includes the European Union. ECB expectations may apply to a significant euro-area institution. Confirm that status before treating them as in scope.',
      })
    }
  }

  if (inFrance) {
    add({
      id: 'cnil',
      name: 'France: CNIL and the Loi Informatique et Libertés',
      jurisdiction: 'France',
      kind: 'Law',
      outcome: 'Gap',
      rationale: 'France is in scope. The EU AI Act applies directly; this screen does not add a separate French horizontal AI statute. CNIL remains the data-protection authority. No CNIL analysis is attached, and this is not a CNIL opinion.',
    })
  }

  if (inUs) {
    add({
      id: 'us-federal',
      name: 'No comprehensive US federal AI statute identified',
      jurisdiction: 'United States',
      kind: 'Screening note',
      outcome: 'Screened',
      rationale: 'No comprehensive US federal AI statute identified; assess applicable sectoral laws, state AI laws and agency requirements. Instruments that the recorded use indicates, such as SR 11-7, NYC Local Law 144, the Illinois Artificial Intelligence Video Interview Act or the Colorado Artificial Intelligence Act, are listed separately. NIST AI RMF remains in the international set. This screen is not a legal opinion.',
    })
    if (financial) {
      add({
        id: 'sr-11-7',
        name: 'SR 11-7 and OCC model-risk guidance',
        jurisdiction: 'United States',
        kind: 'Supervisory expectation',
        outcome: 'Gap',
        rationale: 'The use is financial and deployment includes the United States. SR 11-7 is supervisory guidance, not a statute. No model-risk evidence is attached.',
      })
    }
    if (EMPLOYMENT.test(text)) {
      add({
        id: 'nyc-ll144',
        name: 'NYC Local Law 144 (AEDT)',
        jurisdiction: 'United States',
        kind: 'Law',
        outcome: /new york/i.test(text) ? 'Gap' : 'Screened',
        rationale: /new york/i.test(text)
          ? 'An employment decision tool is described for New York. A bias-audit record for Local Law 144 is not attached.'
          : 'An employment use is described in the United States. Local Law 144 can apply to automated employment decision tools in New York City. Confirm that geography before treating it as in scope.',
      })
    }
    if (/illinois/i.test(text) || /video interview/i.test(text)) {
      add({
        id: 'illinois-video',
        name: 'Illinois Artificial Intelligence Video Interview Act',
        jurisdiction: 'United States',
        kind: 'Law',
        outcome: /illinois/i.test(text) ? 'Gap' : 'Screened',
        rationale: /illinois/i.test(text)
          ? 'A video-interview or Illinois employment use is described. Transparency and sensitive-data handling evidence for the Illinois Act is not attached.'
          : 'A video-interview use is described in the United States. The Illinois Artificial Intelligence Video Interview Act can apply for Illinois candidates. Confirm that geography before treating it as in scope.',
      })
    }
    if (/colorado/i.test(text) || (global && risk)) {
      add({
        id: 'colorado-ai',
        name: 'Colorado Artificial Intelligence Act',
        jurisdiction: 'United States',
        kind: 'Law',
        outcome: 'Screened',
        rationale: 'The Colorado Artificial Intelligence Act can apply to high-risk consequential decisions about Colorado consumers. Confirm that those consumers are in scope. This screen does not decide applicability.',
      })
    }
  }

  if (inSg) {
    add({
      id: 'imda-mgf',
      name: 'IMDA Model AI Governance Framework',
      jurisdiction: 'Singapore',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'Singapore has no horizontal AI statute in this screen. The IMDA Model AI Governance Framework is voluntary and was screened because deployment includes Singapore.',
    })
    if (personal) {
      add({
        id: 'pdpa',
        name: 'Singapore PDPA',
        jurisdiction: 'Singapore',
        kind: 'Law',
        outcome: 'Gap',
        rationale: 'Personal or customer data is described and deployment includes Singapore. No PDPA record is attached.',
      })
    }
    if (financial) {
      add({
        id: 'mas',
        name: 'MAS FEAT and AI risk-management guidelines',
        jurisdiction: 'Singapore',
        kind: 'Supervisory expectation',
        outcome: 'Gap',
        rationale: 'The use is financial and deployment includes Singapore. MAS FEAT principles and the MAS Guidelines on AI Risk Management are supervisory expectations, not a horizontal statute. No MAS evidence is attached.',
      })
    }
  }

  if (inKr) {
    add({
      id: 'kr-ai-act',
      name: 'Korea AI Framework Act',
      jurisdiction: 'South Korea',
      kind: 'Law',
      outcome: llm || risk ? 'Gap' : 'Screened',
      rationale: 'The Framework Act on the Development of Artificial Intelligence and the Creation of a Foundation for Trust has applied since 22 January 2026. High-impact AI duties and generative-AI notice may apply. No Korean notice or filing evidence is attached. This is not a classification.',
    })
    if (personal) {
      add({
        id: 'pipa',
        name: 'Korea Personal Information Protection Act',
        jurisdiction: 'South Korea',
        kind: 'Law',
        outcome: 'Gap',
        rationale: 'Personal or customer data is described and deployment includes South Korea. No PIPA record is attached.',
      })
    }
  }

  if (inCn) {
    add({
      id: 'china-ai',
      name: 'China generative AI, deep-synthesis and algorithm rules',
      jurisdiction: 'China',
      kind: 'Law',
      outcome: llm || risk ? 'Gap' : 'Screened',
      rationale: 'China is in scope. Targeted CAC measures on generative AI, deep synthesis and algorithm recommendation may apply for services to the public in China. No China filing or labelling evidence is attached. This is not a market-access determination.',
    })
  }

  if (inJp) {
    add({
      id: 'japan-ai',
      name: 'Japan AI Promotion Act (Act No. 53 of 2025)',
      jurisdiction: 'Japan',
      kind: 'Law',
      outcome: 'Screened',
      rationale: 'Japan’s AI Promotion Act is screened as a promotion statute with cooperation duties. It is not treated as an EU-style fine regime on this screen.',
    })
  }

  if (inCa) {
    add({
      id: 'canada-federal',
      name: 'Canada federal AI statute screening note',
      jurisdiction: 'Canada',
      kind: 'Screening note',
      outcome: 'Screened',
      rationale: 'No comprehensive federal Canadian AI statute is identified after Bill C-27 died. Assess the Directive on Automated Decision-Making and Quebec Law 25 separately.',
    })
    add({
      id: 'canada-adm',
      name: 'Canada Directive on Automated Decision-Making',
      jurisdiction: 'Canada',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'Federal automated-decision directive. Confirm whether the deployer is a Government of Canada institution before treating it as in scope.',
    })
    if (/quebec/i.test(text) || personal) {
      add({
        id: 'quebec-law25',
        name: 'Quebec Law 25 (automated decision transparency)',
        jurisdiction: 'Canada',
        kind: 'Law',
        outcome: /quebec/i.test(text) ? 'Gap' : 'Screened',
        rationale: /quebec/i.test(text)
          ? 'Quebec is recorded. Law 25 transparency and governance evidence is not attached.'
          : 'Canadian personal-data use is recorded. Confirm Quebec geography before treating Law 25 as in scope.',
      })
    }
  }

  if (inBr) {
    add({
      id: 'brazil-lgpd',
      name: 'Brazil LGPD automated-decision rights',
      jurisdiction: 'Brazil',
      kind: 'Law',
      outcome: personal ? 'Gap' : 'Screened',
      rationale: personal
        ? 'Brazil is in scope with personal data. LGPD automated-decision review evidence is not attached.'
        : 'Brazil is in scope. LGPD automated-decision duties apply when personal data is processed.',
    })
    add({
      id: 'brazil-eca',
      name: 'Brazil ECA Digital algorithmic duties',
      jurisdiction: 'Brazil',
      kind: 'Law',
      outcome: 'Screened',
      rationale: 'ECA Digital algorithmic duties are screened for services that may reach Brazilian minors. Confirm product scope before treating reporting duties as in force.',
    })
  }

  if (inAu) {
    add({
      id: 'australia-ai',
      name: 'Australia AI Ethics Principles and privacy ADM transparency',
      jurisdiction: 'Australia',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'Australia has no horizontal AI Act on this screen. Voluntary ethics principles and privacy ADM transparency are screened.',
    })
  }

  if (inIn) {
    add({
      id: 'india-ai',
      name: 'India MeitY AI advisories and draft rules',
      jurisdiction: 'India',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'MeitY advisories and draft AI materials are screened. A comprehensive Indian AI Act is not treated as enacted on this screen.',
    })
  }

  if (inUae) {
    add({
      id: 'uae-ai',
      name: 'UAE National Strategy for Artificial Intelligence 2031',
      jurisdiction: 'United Arab Emirates',
      kind: 'Framework',
      outcome: 'Screened',
      rationale: 'UAE national AI strategy materials are screened. They are not treated as a single horizontal AI statute on this screen.',
    })
  }

  const scopeLabel = global ? 'Global' : unique.length ? unique.join(', ') : 'Geography not stated'
  const skipped = PLACES.filter((place) => !unique.includes(place as typeof PLACES[number]))
  const placeList = PLACES.join(', ')
  const notAssessed = global
    ? `Deployment is recorded as global, so the ${placeList} catalogues were screened together. A row is not a finding that every duty applies.`
    : unique.length
      ? `Not assessed, because deployment is recorded as ${unique.join(', ')}: ${skipped.join(', ')}. A United Kingdom-only financial system is not screened against the ECB. An EU or global financial system is.`
      : `Deployment geography is not recorded, so country laws were not assessed. A United Kingdom-only financial system is screened against PRA SS1/23 and UK GDPR, and not against the ECB. An EU financial system is screened against the EU AI Act and, where a euro-area bank is indicated, ECB supervisory expectations. Record Global to screen the full catalogue (${placeList}).`

  const gaps = assessed.filter((item) => item.outcome === 'Gap').length
  return {
    scopeLabel,
    places: unique,
    summary: `${scopeLabel}. ${assessed.length} instruments assessed, ${gaps} with no evidence attached. Gap means a duty appears in scope and evidence is missing. Screened means the instrument was reviewed. Neither result is compliance.`,
    assessed,
    notAssessed,
  }
}

export function subjectFromIntake(intake: IntakeAnswers, impact: ImpactAnswers): ApplicabilitySubject {
  return {
    deployment: intake.deployment,
    geography: intake.geography ?? '',
    users: intake.users,
    data: `${intake.dataInputs} ${intake.affectedGroups}`,
    model: intake.technology,
    uses: `${intake.problemStatement} ${intake.goals} ${intake.expectedOutputs}`,
    oversight: intake.humanOversight,
    decisions: `${intake.autonomy} ${impact.decisionImpact} ${impact.intendedUse}`,
    materiality: intake.proposedTier,
  }
}

export function subjectFromRecord(system: {
  deployment: string
  geography: string
  users: string[]
  data_categories: string[]
  model_type: string
  intended_uses: string[]
  human_oversight: string
  automated_decisions: string
  materiality: string
  description: string
}): ApplicabilitySubject {
  return {
    deployment: system.deployment,
    geography: system.geography,
    users: system.users.join(' '),
    data: system.data_categories.join(' '),
    model: system.model_type,
    uses: `${system.description} ${system.intended_uses.join(' ')}`,
    oversight: system.human_oversight,
    decisions: system.automated_decisions,
    materiality: system.materiality,
  }
}
