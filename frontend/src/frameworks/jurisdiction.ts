/**
 * Regulatory nexus for an AI system.
 * A mismatch warns. It does not block the record: a group may answer to more than one authority.
 */

export interface RegulatoryProfile {
  legalEntityJurisdiction: string
  deploymentJurisdictions: string[]
  dataSubjectJurisdictions: string[]
  sectorRegulator: string
  marketRegulator: string
  privacyRegulator: string
  applicableLegislation: string[]
  groupHomeRegulator: string
}

export interface SupervisoryAuthority {
  id: string
  name: string
  home: string
  adjective: string
  roles: Array<'sector' | 'market' | 'privacy' | 'group'>
}

export interface JurisdictionWarning {
  field: 'sectorRegulator' | 'marketRegulator' | 'privacyRegulator' | 'groupHomeRegulator'
  authorityId: string
  message: string
}

export const LEGAL_ENTITY_JURISDICTIONS = [
  'France',
  'Germany',
  'Switzerland',
  'United Kingdom',
  'United States',
  'Singapore',
  'South Korea',
  'European Union',
] as const

export const SCOPE_JURISDICTIONS = [...LEGAL_ENTITY_JURISDICTIONS, 'EU/EEA', 'Global'] as const

export const LEGISLATION = ['EU AI Act', 'GDPR', 'UK GDPR', 'PRA SS1/23', 'DPA 2018'] as const

export const AUTHORITIES: SupervisoryAuthority[] = [
  { id: 'acpr', name: 'ACPR', home: 'France', adjective: 'French', roles: ['sector', 'group'] },
  { id: 'amf', name: 'AMF', home: 'France', adjective: 'French', roles: ['market', 'group'] },
  { id: 'cnil', name: 'CNIL', home: 'France', adjective: 'French', roles: ['privacy'] },
  { id: 'bafin', name: 'BaFin', home: 'Germany', adjective: 'German', roles: ['sector', 'market', 'group'] },
  { id: 'bfdi', name: 'BfDI', home: 'Germany', adjective: 'German', roles: ['privacy'] },
  { id: 'finma', name: 'FINMA', home: 'Switzerland', adjective: 'Swiss', roles: ['sector', 'group'] },
  { id: 'pra', name: 'PRA', home: 'United Kingdom', adjective: 'UK', roles: ['sector', 'group'] },
  { id: 'fca', name: 'FCA', home: 'United Kingdom', adjective: 'UK', roles: ['market', 'group'] },
  { id: 'ico', name: 'ICO', home: 'United Kingdom', adjective: 'UK', roles: ['privacy'] },
  { id: 'frb', name: 'Federal Reserve', home: 'United States', adjective: 'US', roles: ['sector', 'group'] },
  { id: 'sec', name: 'SEC', home: 'United States', adjective: 'US', roles: ['market'] },
  { id: 'ftc', name: 'FTC', home: 'United States', adjective: 'US', roles: ['privacy'] },
  { id: 'mas', name: 'MAS', home: 'Singapore', adjective: 'Singapore', roles: ['sector', 'group'] },
  { id: 'pdpc', name: 'PDPC', home: 'Singapore', adjective: 'Singapore', roles: ['privacy'] },
  { id: 'pipc', name: 'PIPC', home: 'South Korea', adjective: 'South Korean', roles: ['privacy'] },
  { id: 'ecb', name: 'ECB', home: 'European Union', adjective: 'EU', roles: ['sector', 'group'] },
]

const PRIMARY_ADJECTIVE: Record<string, string> = {
  France: 'French',
  Germany: 'German',
  Switzerland: 'Swiss',
  'United Kingdom': 'UK',
  'United States': 'US',
  Singapore: 'Singapore',
  'South Korea': 'South Korean',
  'European Union': 'EU',
  'EU/EEA': 'EU/EEA',
}

/** National seats treated as inside an EU authority’s home, and the reverse. */
const EU_COMPATIBLE = new Set(['France', 'Germany', 'European Union', 'EU/EEA'])

const STORAGE_KEY = 'grail.regulatory-nexus'

export function emptyProfile(): RegulatoryProfile {
  return {
    legalEntityJurisdiction: '',
    deploymentJurisdictions: [],
    dataSubjectJurisdictions: [],
    sectorRegulator: '',
    marketRegulator: '',
    privacyRegulator: '',
    applicableLegislation: [],
    groupHomeRegulator: '',
  }
}

/** Demonstration profiles. Contoso records the France / FINMA warning on purpose. */
export const SEED_PROFILES: Record<string, RegulatoryProfile> = {
  'contoso-customer-assistant': {
    legalEntityJurisdiction: 'France',
    deploymentJurisdictions: ['France', 'Germany'],
    dataSubjectJurisdictions: ['EU/EEA'],
    sectorRegulator: 'ACPR',
    marketRegulator: 'AMF',
    privacyRegulator: 'CNIL',
    applicableLegislation: ['EU AI Act', 'GDPR'],
    groupHomeRegulator: 'FINMA',
  },
  'financeguard-ai': {
    legalEntityJurisdiction: 'United Kingdom',
    deploymentJurisdictions: ['United Kingdom'],
    dataSubjectJurisdictions: ['United Kingdom'],
    sectorRegulator: 'PRA',
    marketRegulator: 'FCA',
    privacyRegulator: 'ICO',
    applicableLegislation: ['UK GDPR', 'DPA 2018', 'PRA SS1/23'],
    groupHomeRegulator: '',
  },
  'copilot-employee-support': {
    legalEntityJurisdiction: 'United States',
    deploymentJurisdictions: ['United States'],
    dataSubjectJurisdictions: ['United States'],
    sectorRegulator: '',
    marketRegulator: '',
    privacyRegulator: '',
    applicableLegislation: [],
    groupHomeRegulator: '',
  },
  'ai-analytics-service': {
    legalEntityJurisdiction: 'Singapore',
    deploymentJurisdictions: ['Singapore'],
    dataSubjectJurisdictions: ['Singapore'],
    sectorRegulator: 'MAS',
    marketRegulator: '',
    privacyRegulator: 'PDPC',
    applicableLegislation: [],
    groupHomeRegulator: '',
  },
  'meridian-cs-assistant': {
    legalEntityJurisdiction: 'European Union',
    deploymentJurisdictions: ['European Union'],
    dataSubjectJurisdictions: ['EU/EEA'],
    sectorRegulator: '',
    marketRegulator: '',
    privacyRegulator: '',
    applicableLegislation: ['EU AI Act', 'GDPR'],
    groupHomeRegulator: '',
  },
}

function readAll(): Record<string, RegulatoryProfile> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, RegulatoryProfile>) : {}
  } catch {
    return {}
  }
}

export function readProfile(systemId: string): RegulatoryProfile {
  return readAll()[systemId] ?? SEED_PROFILES[systemId] ?? emptyProfile()
}

export function writeProfile(systemId: string, profile: RegulatoryProfile): void {
  const next = { ...readAll(), [systemId]: profile }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function authorityByName(name: string): SupervisoryAuthority | undefined {
  return AUTHORITIES.find((item) => item.name === name)
}

function homeMatchesPrimary(home: string, primary: string): boolean {
  if (!primary) return true
  if (home === primary) return true
  if (home === 'European Union' && EU_COMPATIBLE.has(primary)) return true
  if ((primary === 'European Union' || primary === 'EU/EEA') && EU_COMPATIBLE.has(home)) return true
  return false
}

function mismatchMessage(authority: SupervisoryAuthority, primary: string): string {
  const primaryAdjective = PRIMARY_ADJECTIVE[primary] ?? primary
  return `Jurisdiction mismatch: ${authority.name} is a ${authority.adjective} supervisory authority, while the selected primary jurisdiction is ${primary}. Confirm a ${authority.adjective} regulatory nexus or select the relevant ${primaryAdjective} authority.`
}

/** Warnings only. An empty authority or a matching home produces none. */
export function jurisdictionWarnings(profile: RegulatoryProfile): JurisdictionWarning[] {
  const fields = [
    ['sectorRegulator', profile.sectorRegulator],
    ['marketRegulator', profile.marketRegulator],
    ['privacyRegulator', profile.privacyRegulator],
    ['groupHomeRegulator', profile.groupHomeRegulator],
  ] as const
  const warnings: JurisdictionWarning[] = []
  for (const [field, name] of fields) {
    const authority = authorityByName(name)
    if (!authority || homeMatchesPrimary(authority.home, profile.legalEntityJurisdiction)) continue
    warnings.push({ field, authorityId: authority.id, message: mismatchMessage(authority, profile.legalEntityJurisdiction) })
  }
  return warnings
}
