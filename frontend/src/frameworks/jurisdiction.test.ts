import { describe, expect, it } from 'vitest'
import { required } from '../test-utils'

import { jurisdictionWarnings, SEED_PROFILES, type RegulatoryProfile } from './jurisdiction'

const france: RegulatoryProfile = {
  legalEntityJurisdiction: 'France',
  deploymentJurisdictions: ['France', 'Germany'],
  dataSubjectJurisdictions: ['EU/EEA'],
  sectorRegulator: 'ACPR',
  marketRegulator: 'AMF',
  privacyRegulator: 'CNIL',
  applicableLegislation: ['EU AI Act', 'GDPR'],
  groupHomeRegulator: 'FINMA',
}

describe('jurisdiction mismatch warning', () => {
  it('warns when FINMA is recorded for a French legal entity and does not treat it as a block', () => {
    const warnings = jurisdictionWarnings(france)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]?.field).toBe('groupHomeRegulator')
    expect(warnings[0]?.message).toBe(
      'Jurisdiction mismatch: FINMA is a Swiss supervisory authority, while the selected primary jurisdiction is France. Confirm a Swiss regulatory nexus or select the relevant French authority.',
    )
  })

  it('stays quiet when the group regulator matches the legal entity', () => {
    expect(jurisdictionWarnings({ ...france, groupHomeRegulator: 'ACPR' })).toEqual([])
  })

  it('treats an EU authority as consistent with a French legal entity', () => {
    expect(jurisdictionWarnings({ ...france, groupHomeRegulator: 'ECB' })).toEqual([])
  })

  it('warns for a German authority even when Germany is a deployment jurisdiction', () => {
    const warnings = jurisdictionWarnings({ ...france, groupHomeRegulator: '', sectorRegulator: 'BaFin' })
    expect(warnings.map((item) => item.authorityId)).toEqual(['bafin'])
    expect(warnings[0]?.message).toMatch(/BaFin is a German supervisory authority/)
  })

  it('seeds the Contoso example with the FINMA warning and leaves FinanceGuard aligned', () => {
    expect(jurisdictionWarnings(required(SEED_PROFILES['contoso-customer-assistant'])).map((item) => item.authorityId)).toEqual(['finma'])
    expect(jurisdictionWarnings(required(SEED_PROFILES['financeguard-ai']))).toEqual([])
  })
})
