import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { DATA_AS_OF } from '../demo/demoData'
import {
  BOUNDARY_PARTS,
  HARM_NAMES,
  draftImpact,
  emptyImpact,
  intakeNarrativeComplete,
  prohibitedUseGap,
  recommendLeadDecisions,
  screenRisks,
  suggestImpact,
  type ImpactAnswers,
  type IntakeAnswers,
  type RiskLevel,
  type SystemAssessment,
  type UseCategory,
} from '../intake/assess'
import { RegulatoryNexus } from '../frameworks/RegulatoryNexus'
import { readProfile, writeProfile } from '../frameworks/jurisdiction'
import { reviewIntake, type IntakeReview } from '../intake/intakeAgent'
import { useRegistry, type Registration } from '../intake/registry'
import { firstIncompleteStep, missingOnStep, nextWizardAction, stepComplete, WIZARD_STEPS } from '../intake/wizard'
import { readWorkbook } from '../intake/workbook'

const EMPTY_INTAKE: IntakeAnswers = {
  systemName: '',
  identifier: '',
  problemStatement: '',
  goals: '',
  expectedOutputs: '',
  dataInputs: '',
  users: '',
  vendor: '',
  deployment: '',
  autonomy: '',
  humanOversight: '',
  technology: '',
  affectedGroups: '',
  vulnerableGroups: '',
  wrongDecisionCost: '',
  successMetrics: '',
  processOwners: '',
  foreseeableUse: '',
  prohibitedUses: '',
  prohibitedUseCondition: '',
  geography: '',
  systemAssessment: '',
  proposedTier: '',
}

const DRAFT_KEY = 'grail.intake-draft'

interface SavedDraft {
  intake?: IntakeAnswers
  step?: number
}

function readDraft(): SavedDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as SavedDraft) : null
  } catch {
    return null
  }
}

const FIELD_COPY: Record<string, { label: string; hint: string }> = {
  systemName: { label: 'System name', hint: 'The name people will see in the AI estate.' },
  identifier: { label: 'Identifier', hint: 'Optional short code, such as CLAIMS-HELPER.' },
  problemStatement: { label: 'Problem statement', hint: 'The operational problem this system addresses.' },
  goals: { label: 'Goals and purpose', hint: 'What success looks like for the business process.' },
  processOwners: { label: 'Process owners', hint: 'Who sets objectives, selects data, sets thresholds and makes the final decision.' },
  successMetrics: { label: 'Success metrics', hint: 'How the organisation will know the system is working. Optional.' },
  dataInputs: { label: 'Data inputs', hint: 'Categories of data the system reads or produces.' },
  users: { label: 'Users', hint: 'The people who operate the system.' },
  affectedGroups: { label: 'Who is affected', hint: 'People affected by a recommendation, including people who do not use the system.' },
  vulnerableGroups: { label: 'Vulnerable groups', hint: 'Groups who could be harmed if a recommendation is wrong. Write None if there are none.' },
  wrongDecisionCost: { label: 'Cost of a wrong decision', hint: 'Operational, customer, or regulatory harm from a wrong output.' },
  technology: { label: 'Technology', hint: 'Model type and how it is hosted.' },
  vendor: { label: 'Vendor', hint: 'Internal, or the name of the third party.' },
  deployment: { label: 'Deployment', hint: 'Where the system runs and which systems it connects to.' },
  geography: { label: 'Deployment geography', hint: 'Countries or regions where the system is used. This chooses which laws are screened.' },
  autonomy: { label: 'Autonomy', hint: 'What the system can decide or do on its own.' },
  humanOversight: { label: 'Human oversight', hint: 'Who reviews an output before it is acted on.' },
  expectedOutputs: { label: 'Expected outputs', hint: 'The intended use: what the system produces for a person.' },
  foreseeableUse: { label: 'Foreseeable use', hint: 'Ways the system could be used beyond that intended purpose.' },
  prohibitedUses: { label: 'Prohibited uses', hint: 'Uses the system must not perform. Required for high-risk registration unless an open condition is recorded.' },
}

const STEP_FIELDS: string[][] = [
  ['systemName', 'identifier', 'problemStatement', 'goals', 'processOwners', 'successMetrics'],
  ['dataInputs', 'users', 'affectedGroups', 'vulnerableGroups', 'wrongDecisionCost'],
  ['technology', 'vendor', 'deployment', 'geography'],
  ['autonomy', 'humanOversight'],
  ['expectedOutputs', 'foreseeableUse', 'prohibitedUses'],
]

export function IntakePage() {
  const { session } = useAuth()
  const { registrations, save } = useRegistry()
  const [params] = useSearchParams()
  const existing = registrations.find((item) => item.id === params.get('id'))
  const saved = existing ? null : readDraft()
  const [step, setStep] = useState(() => {
    if (window.location.hash === '#impact-assessment') return 5
    return existing ? 0 : Math.min(saved?.step ?? 0, WIZARD_STEPS.length - 1)
  })
  const [intake, setIntake] = useState<IntakeAnswers>({
    ...EMPTY_INTAKE,
    ...saved?.intake,
    ...existing?.intake,
    geography: existing?.intake.geography ?? saved?.intake?.geography ?? '',
  })
  const [impact, setImpact] = useState<ImpactAnswers>(existing?.impact ?? emptyImpact(intake))
  const [workbookFile, setWorkbookFile] = useState<File | null>(null)
  const [workbookNotice, setWorkbookNotice] = useState<string | null>(null)
  const [review, setReview] = useState<IntakeReview | null>(null)
  const [registered, setRegistered] = useState<Registration | null>(null)

  useEffect(() => {
    if (existing) return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ intake, step }))
  }, [existing, intake, step])

  const setField = (key: keyof IntakeAnswers, value: string) => {
    setIntake((current) => ({ ...current, [key]: value }))
    setReview(null)
  }
  const suggestion = suggestImpact(intake, impact)
  const leadRecommendation = recommendLeadDecisions(intake, impact)
  const leadReady = impact.useCategory !== '' && impact.evidence.trim().length > 0 && impact.launchConditions.trim().length > 0
  const openCondition = prohibitedUseGap(intake)
  const missing = missingOnStep(step, intake)
  const nextAction = nextWizardAction(step, intake, review !== null && review.status === 'Completed')
  const narrativeReady = intakeNarrativeComplete(intake) && Boolean(intake.prohibitedUses?.trim() || intake.prohibitedUseCondition?.trim())

  const onWorkbookFile = (event: ChangeEvent<HTMLInputElement>) => {
    setWorkbookFile(event.target.files?.[0] ?? null)
  }

  const readOwnerWorkbook = async () => {
    if (!workbookFile) return
    try {
      const imported = await readWorkbook(workbookFile, intake)
      setIntake(imported.intake)
      setImpact(emptyImpact(imported.intake))
      setReview(null)
      setWorkbookNotice(`Read ${imported.filledFields.length} answers from the workbook. System assessment and proposed risk tier were left unchanged.`)
      setStep(firstIncompleteStep(imported.intake))
    } catch (error) {
      setWorkbookNotice(error instanceof Error ? error.message : 'The workbook could not be read.')
    }
  }

  const runReview = () => {
    if (!narrativeReady) return
    const result = reviewIntake(intake)
    setReview(result)
    if (result.status === 'Completed') setImpact(draftImpact(intake))
  }

  const register = (event: FormEvent) => {
    event.preventDefault()
    if (!leadReady || openCondition || review?.status !== 'Completed') return
    const record = save(intake, impact, session?.persona.display_name || 'Governance lead')
    if (!existing) writeProfile(record.id, readProfile('intake-draft'))
    sessionStorage.removeItem(DRAFT_KEY)
    setRegistered(record)
  }

  if (registered) {
    return (
      <>
        <PageHeader title={registered.intake.systemName} description="Registered in AI Estate. The gate is a deterministic rule. It is not a launch approval." />
        <section className="card stack">
          <p>Registered in AI Estate. Lifecycle gate <StatusBadge label={registered.gate} />. {registered.gateReason}</p>
          <p>Materiality {registered.suggestion.suggestedTier}. Updated by {registered.updatedBy}. Last review {registered.lastReview}.</p>
          <Link className="button" to="/ai-estate">View in AI Estate</Link>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={existing ? intake.systemName || 'Register an AI system' : 'Register an AI system'}
        description="Seven sections. The draft stays in this browser until you register or leave the session. A model is not called."
      />
      <section className="card stack">
        <h2>Model-owner workbook</h2>
        <p>Load the completed workbook, or enter each section yourself. System assessment and proposed risk tier stay with the governance lead.</p>
        <p>
          <a href="/templates/grail-governance-intake-template.xlsx">Download the blank workbook</a>
          {' · '}
          <a href="/templates/grail-governance-intake-sample.xlsx">Download the sample workbook</a>
        </p>
        <label className="field">
          Model-owner workbook
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onWorkbookFile} />
        </label>
        <button className="button secondary" type="button" onClick={() => void readOwnerWorkbook()} disabled={!workbookFile}>Read workbook into the form</button>
        {workbookNotice ? <p role="status">{workbookNotice}</p> : null}
        {intake.systemName ? <p>Draft saved for {intake.systemName}.</p> : null}
      </section>

      <ol className="wizard-steps" aria-label="Registration progress">
        {WIZARD_STEPS.map((item, index) => {
          const done = index < 5 ? stepComplete(index, intake) : index === 5 ? review?.status === 'Completed' : leadReady
          const current = index === step
          return (
            <li key={item.id}>
              <button type="button" aria-current={current ? 'step' : undefined} onClick={() => setStep(index)}>
                <span>{index + 1}</span>
                {item.title}
                <small>{done ? 'Complete' : current ? 'Current' : 'Not started'}</small>
              </button>
            </li>
          )
        })}
      </ol>
      <p>
        {missing.length > 0 ? `Still needed: ${missing.join(', ')}.` : 'This section has the mandatory answers.'} Next: {nextAction}
      </p>

      <form className="stack" onSubmit={register}>
        {step < 5 ? (
          <section className="card stack">
            <h2>{WIZARD_STEPS[step]?.title}</h2>
            {STEP_FIELDS[step]?.map((key) => {
              const copy = FIELD_COPY[key]
              if (!copy) return null
              const long = !['systemName', 'identifier', 'geography'].includes(key)
              const id = `intake-${key}`
              const control = {
                id,
                'aria-describedby': `${id}-hint`,
                value: String(intake[key as keyof IntakeAnswers] ?? ''),
                onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(key as keyof IntakeAnswers, event.target.value),
              }
              return (
                <div className="field" key={key}>
                  <label htmlFor={id}>{copy.label}</label>
                  {long ? <textarea rows={3} {...control} /> : <input {...control} />}
                  <small id={`${id}-hint`}>{copy.hint}</small>
                </div>
              )
            })}
            {step === 2 ? <RegulatoryNexus systemId={existing?.id ?? 'intake-draft'} /> : null}
            {step === 4 ? (
              <label className="choice">
                <input
                  type="checkbox"
                  checked={Boolean(intake.prohibitedUseCondition?.trim())}
                  onChange={(event) => setField('prohibitedUseCondition', event.target.checked ? (intake.prohibitedUseCondition?.trim() || 'Prohibited uses are not yet recorded.') : '')}
                />
                Record prohibited uses as an open condition
              </label>
            ) : null}
            {step === 4 && intake.prohibitedUseCondition?.trim() ? (
              <label className="field">
                Open condition
                <textarea rows={3} value={intake.prohibitedUseCondition} onChange={(event) => setField('prohibitedUseCondition', event.target.value)} />
                <small>High-risk intake can be registered only when this condition is explicit. It is not a prohibited-use list.</small>
              </label>
            ) : null}
          </section>
        ) : null}

        {step === 5 ? (
          <section className="card stack" id="impact-assessment">
            <h2>Risk screening</h2>
            <p>The governance lead enters the classification. The screen explains each inherent rating. Residual risk stays Not assessed until a reviewer records it.</p>
            <fieldset className="choice-list" disabled={!narrativeReady}>
              <legend>System assessment</legend>
              {(['Narrow Internal Support Tool', 'Workflow Automation System', 'Higher-risk Decision Support System'] as const satisfies readonly SystemAssessment[]).map((option) => (
                <label className="choice" key={option}>
                  <input type="radio" name="system-assessment" checked={intake.systemAssessment === option} onChange={() => setField('systemAssessment', option)} />
                  {option}
                </label>
              ))}
            </fieldset>
            <label className="field">
              Proposed risk tier
              <select aria-label="Proposed risk tier" value={intake.proposedTier} disabled={!narrativeReady} onChange={(event) => setField('proposedTier', event.target.value as RiskLevel | '')}>
                <option value="">Select a tier</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <button className="button" type="button" onClick={runReview} disabled={!narrativeReady}>Review with Governance Intake Agent</button>
            {review ? <IntakeReviewCard review={review} /> : null}
            {review?.status === 'Completed' ? (
              <>
                <h3>Screened risks</h3>
                <p>Each inherent rating comes from the intake text. Evidence is not attached. A reviewer decision is Not reviewed until residual risk is set.</p>
                {screenRisks(intake).map((item) => (
                  <article className="card stack" key={item.name} aria-label={item.name}>
                    <h3>{item.name}</h3>
                    <p>Inherent risk: {item.inherent}. Source: {item.source}</p>
                    <p>Rationale: {item.rationale}</p>
                    <p>Evidence: {item.evidence}</p>
                    <p>Control response: {item.controlResponse}</p>
                    <p>Assessor: {item.assessor}</p>
                    <label className="field">
                      Residual risk
                      <select
                        aria-label={`${item.name} residual risk`}
                        value={impact.residualRatings[item.name] ?? ''}
                        onChange={(event) => setImpact((current) => ({
                          ...current,
                          residualRatings: { ...current.residualRatings, [item.name]: event.target.value as RiskLevel | '' },
                        }))}
                      >
                        <option value="">Not assessed</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </label>
                    <p>Reviewer decision: {impact.residualRatings[item.name] ? 'Recorded in this session. This does not accept the risk.' : 'Not reviewed.'}</p>
                  </article>
                ))}
                <fieldset className="choice-list">
                  <legend>Possible harms</legend>
                  {HARM_NAMES.map((name) => (
                    <label className="choice" key={name}>
                      <input type="checkbox" checked={impact.harms[name] ?? false} onChange={(event) => setImpact((current) => ({ ...current, harms: { ...current.harms, [name]: event.target.checked } }))} />
                      {name}
                    </label>
                  ))}
                </fieldset>
              </>
            ) : null}
          </section>
        ) : null}

        {step === 6 ? (
          <section className="card stack">
            <h2>Review and submit</h2>
            {review ? <IntakeReviewCard review={review} /> : <p>Run the Governance Intake Agent on the risk screening step before registering.</p>}
            <section className="stack">
              <h3>Governance Intake Agent recommendation</h3>
              <p>The agent recommends the three launch decisions. The form stays empty until the governance lead types them.</p>
              <dl className="detail-list">
                <div><dt>Use category</dt><dd>{leadRecommendation.useCategory}</dd></div>
                <div><dt>Evidence</dt><dd>{leadRecommendation.evidence}</dd></div>
                <div><dt>Launch conditions</dt><dd>{leadRecommendation.launchConditions}</dd></div>
              </dl>
            </section>
            <label className="field">
              Use category
              <select aria-label="Use category" value={impact.useCategory} onChange={(event) => setImpact((current) => ({ ...current, useCategory: event.target.value as UseCategory | '' }))}>
                <option value="">Select a use category</option>
                <option>Approved Workflow</option>
                <option>Convenience Shortcut</option>
                <option>Prohibited use</option>
              </select>
            </label>
            <label className="field">
              Evidence supporting the decision to proceed
              <textarea rows={3} aria-label="Evidence supporting the decision to proceed" value={impact.evidence} onChange={(event) => setImpact((current) => ({ ...current, evidence: event.target.value }))} />
            </label>
            <label className="field">
              Clear launch conditions
              <textarea rows={3} aria-label="Clear launch conditions" value={impact.launchConditions} onChange={(event) => setImpact((current) => ({ ...current, launchConditions: event.target.value }))} />
            </label>
            {openCondition ? (
              <p role="alert">High-risk intake cannot be registered until prohibited uses are written, or an open condition is recorded on the use step.</p>
            ) : null}
            <Suggestion suggestion={suggestion} />
            <p>Boundary parts considered: {BOUNDARY_PARTS.join(', ')}. Data as of {DATA_AS_OF}.</p>
            <button className="button" type="submit" disabled={!leadReady || openCondition || review?.status !== 'Completed'}>Register</button>
          </section>
        ) : null}

        <div className="button-row">
          <button className="button secondary" type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < 6 ? (
            <button
              className="button"
              type="button"
              disabled={missing.length > 0 || (step === 5 && review?.status !== 'Completed')}
              onClick={() => setStep((current) => Math.min(WIZARD_STEPS.length - 1, current + 1))}
            >
              {step === 5 ? 'Continue to review and submit' : 'Continue'}
            </button>
          ) : null}
        </div>
      </form>
    </>
  )
}

function Suggestion({ suggestion }: { suggestion: ReturnType<typeof suggestImpact> }) {
  return (
    <div className="stack">
      <p>Suggested tier <StatusBadge label={suggestion.suggestedTier} />. Readiness: {suggestion.readiness}.</p>
      <p>{suggestion.draft}</p>
      {suggestion.missing.length > 0 ? <p>Still needed before a person could consider launch: {suggestion.missing.join('; ')}.</p> : null}
    </div>
  )
}

function IntakeReviewCard({ review }: { review: IntakeReview }) {
  return (
    <section className="card stack">
      <h3>Governance Intake Agent review</h3>
      <p><StatusBadge label={review.status} /> Confidence is explanatory and is not an approval.</p>
      <p>Materiality recommendation</p>
      <p>{review.preliminaryMateriality}</p>
      <p>{review.materialityRationale}</p>
      {review.questions.length > 0 ? (
        <>
          <h3>Questions for the model owner</h3>
          <ul>{review.questions.map((item) => <li key={item}>{item}</li>)}</ul>
        </>
      ) : <p>The intake has the fields this screen checks, including prohibited uses.</p>}
      <p>No model was called. This recommendation does not register the system.</p>
    </section>
  )
}
