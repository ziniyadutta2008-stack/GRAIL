import { useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import type { Role } from '../auth/session'
import { Card } from '../components/Card'
import {
  AUTHORITIES,
  LEGAL_ENTITY_JURISDICTIONS,
  LEGISLATION,
  SCOPE_JURISDICTIONS,
  jurisdictionWarnings,
  readProfile,
  writeProfile,
  type RegulatoryProfile,
} from './jurisdiction'

const CAN_EDIT: Role[] = ['governance_lead', 'system_owner', 'privacy_legal_reviewer', 'platform_admin']

function toggle(current: string[], value: string, checked: boolean): string[] {
  return checked ? [...current, value] : current.filter((item) => item !== value)
}

/** Legal-entity, deployment, data-subject and regulator fields, with a mismatch warning. */
export function RegulatoryNexus({ systemId }: { systemId: string }) {
  const { session } = useAuth()
  const [profile, setProfile] = useState<RegulatoryProfile>(() => readProfile(systemId))
  const canEdit = session ? CAN_EDIT.includes(session.persona.role) : false
  const warnings = jurisdictionWarnings(profile)

  const update = (next: RegulatoryProfile) => {
    setProfile(next)
    writeProfile(systemId, next)
  }

  return (
    <Card
      title="Regulatory nexus"
      description="Primary jurisdiction is the legal-entity jurisdiction. A mismatch is a warning, not a block: a multinational organisation may be accountable to more than one regulator. This screen does not decide which authority is competent."
    >
      <div className="nexus-grid">
        <label className="field">
          Legal-entity jurisdiction
          <select
            aria-label="Legal-entity jurisdiction"
            value={profile.legalEntityJurisdiction}
            disabled={!canEdit}
            onChange={(event) => update({ ...profile, legalEntityJurisdiction: event.target.value })}
          >
            <option value="">Not recorded</option>
            {LEGAL_ENTITY_JURISDICTIONS.map((place) => <option key={place}>{place}</option>)}
          </select>
          <small>Primary jurisdiction used for the mismatch check.</small>
        </label>
        <fieldset className="choice-list">
          <legend>Deployment jurisdictions</legend>
          {SCOPE_JURISDICTIONS.map((place) => (
            <label className="choice" key={place}>
              <input
                type="checkbox"
                checked={profile.deploymentJurisdictions.includes(place)}
                disabled={!canEdit}
                onChange={(event) => update({ ...profile, deploymentJurisdictions: toggle(profile.deploymentJurisdictions, place, event.target.checked) })}
              />
              {place}
            </label>
          ))}
        </fieldset>
        <fieldset className="choice-list">
          <legend>Data-subject jurisdictions</legend>
          {SCOPE_JURISDICTIONS.map((place) => (
            <label className="choice" key={place}>
              <input
                type="checkbox"
                checked={profile.dataSubjectJurisdictions.includes(place)}
                disabled={!canEdit}
                onChange={(event) => update({ ...profile, dataSubjectJurisdictions: toggle(profile.dataSubjectJurisdictions, place, event.target.checked) })}
              />
              {place}
            </label>
          ))}
        </fieldset>
        <RegulatorSelect label="Sector regulator" value={profile.sectorRegulator} kind="sector" canEdit={canEdit} onChange={(sectorRegulator) => update({ ...profile, sectorRegulator })} />
        <RegulatorSelect label="Market regulator" value={profile.marketRegulator} kind="market" canEdit={canEdit} onChange={(marketRegulator) => update({ ...profile, marketRegulator })} />
        <RegulatorSelect label="Privacy regulator" value={profile.privacyRegulator} kind="privacy" canEdit={canEdit} onChange={(privacyRegulator) => update({ ...profile, privacyRegulator })} />
        <fieldset className="choice-list">
          <legend>Applicable legislation</legend>
          {LEGISLATION.map((name) => (
            <label className="choice" key={name}>
              <input
                type="checkbox"
                checked={profile.applicableLegislation.includes(name)}
                disabled={!canEdit}
                onChange={(event) => update({ ...profile, applicableLegislation: toggle(profile.applicableLegislation, name, event.target.checked) })}
              />
              {name}
            </label>
          ))}
        </fieldset>
        <RegulatorSelect
          label="Group/home regulator"
          hint="Record a group or home regulator only when the parent or legal entity is supervised there. FINMA applies only if the parent or legal entity is Swiss-regulated."
          value={profile.groupHomeRegulator}
          kind="group"
          canEdit={canEdit}
          onChange={(groupHomeRegulator) => update({ ...profile, groupHomeRegulator })}
        />
      </div>
      {warnings.length > 0 ? (
        <div className="jurisdiction-warning" role="status">
          {warnings.map((warning) => <p key={warning.field}>{warning.message}</p>)}
          <p>This warning does not block the record. Confirm the regulatory nexus or change the authority.</p>
        </div>
      ) : (
        <p>Selected authorities match the legal-entity jurisdiction, or none are recorded.</p>
      )}
    </Card>
  )
}

function RegulatorSelect({
  label,
  hint,
  value,
  kind,
  canEdit,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  kind: 'sector' | 'market' | 'privacy' | 'group'
  canEdit: boolean
  onChange: (value: string) => void
}) {
  const options = AUTHORITIES.filter((item) => item.roles.includes(kind))
  return (
    <label className="field">
      {label}
      <select aria-label={label} value={value} disabled={!canEdit} onChange={(event) => onChange(event.target.value)}>
        <option value="">Not recorded</option>
        {options.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}
