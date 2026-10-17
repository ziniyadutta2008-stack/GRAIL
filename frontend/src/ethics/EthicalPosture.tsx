import { Link } from 'react-router'

/** Shown on every AI system. Estate systems are not given a fabricated ethics score. */
export function EthicalPosture({ owner }: { owner: string }) {
  return (
    <section className="gate gate-warning" aria-label="Ethical release">
      <h2>Ethical release</h2>
      <dl className="facts">
        <div className="fact"><dt>Overall ethical risk</dt><dd>Not assessed</dd></div>
        <div className="fact"><dt>Release state</dt><dd>Under assessment</dd></div>
        <div className="fact"><dt>Open Critical or High ethical findings</dt><dd>Not assessed</dd></div>
        <div className="fact"><dt>Evidence completeness</dt><dd>Not assessed</dd></div>
        <div className="fact"><dt>Next required action</dt><dd>Record principle scoring, affected parties and prohibited-use screening at intake.</dd></div>
        <div className="fact"><dt>Accountable owner</dt><dd>{owner}</dd></div>
      </dl>
      <p>
        No ethical review package is recorded for this system. The lifecycle gate stands on its own evidence.
        Use-case recommendation and release state stay separate. Agents recommend only.
        {' '}
        <Link to="ethics">Open Ethics and data</Link>
        {' '}
        on this system, or
        {' '}
        <Link to="/assess/ethics">the worked examples</Link>
        , including the patient-triage production hold.
      </p>
    </section>
  )
}
