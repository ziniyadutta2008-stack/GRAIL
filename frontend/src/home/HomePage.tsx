import { useCallback, useState } from 'react'
import { Link } from 'react-router'

import { DETERMINISTIC_AGENT_MODE } from '../agents/mode'
import { Icon } from '../components/Icon'
import {
  FRAMEWORK_BADGES,
  GOVERNANCE_RAILS,
  HOME_ACTIVITIES,
  HOME_ROLES,
  LIFECYCLE_STAGES,
  SAFEGUARDS,
  clearIntroSeen,
  introAlreadySeen,
  markIntroSeen,
  prefersReducedMotion,
  saveDataPreferred,
} from './content'
import { AgentArchitecture } from './AgentArchitecture'
import { FirstVisitIntroduction } from './FirstVisitIntroduction'
import { HeroGovernanceVideo } from './HeroGovernanceVideo'
import '../styles/home.css'

function shouldStartWithIntro(): boolean {
  if (typeof window === 'undefined') return false
  if (introAlreadySeen()) return false
  if (prefersReducedMotion()) return false
  if (saveDataPreferred()) return false
  return true
}

/** Public homepage. Authenticated visitors never reach this route; they see the Overview. */
export function HomePage() {
  const [introOpen, setIntroOpen] = useState(shouldStartWithIntro)
  const posterOnly = prefersReducedMotion() || saveDataPreferred()

  const finishIntro = useCallback(() => {
    markIntroSeen()
    setIntroOpen(false)
  }, [])

  const replay = () => {
    clearIntroSeen()
    if (prefersReducedMotion() || saveDataPreferred()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setIntroOpen(true)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className={`home${introOpen ? ' home-intro-open' : ''}`}>
      {introOpen ? <FirstVisitIntroduction onComplete={finishIntro} /> : null}

      <a className="skip-link" href="#home-main">Skip to homepage content</a>
      <header className="home-topbar">
        <div className="home-brand">
          <span className="brand-mark" aria-hidden="true">G</span>
          <div>
            <p className="brand-name">GRAIL</p>
            <p className="home-brand-sub">AI governance control plane</p>
          </div>
        </div>
        <div className="home-topbar-actions">
          <button type="button" className="button button-secondary" onClick={replay}>
            Replay overview
          </button>
          <Link className="button button-primary" to="/sign-in" state={{ from: '/' }}>
            Enter governance workspace
          </Link>
        </div>
      </header>

      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-hero-title">
          <div className="home-hero-copy">
            <p className="home-eyebrow">GRAIL AI Governance Platform</p>
            <h1 id="home-hero-title">Govern AI systems with evidence, accountability and control.</h1>
            <p className="home-hero-support">
              Connect responsible AI, data governance, model risk, controls, remediation and executive approval across the complete AI lifecycle.
            </p>
            <div className="home-hero-actions">
              <Link className="button button-primary" to="/sign-in" state={{ from: '/' }}>
                Enter governance workspace
              </Link>
              <a className="button button-secondary" href="#lifecycle">
                Explore the lifecycle
              </a>
            </div>
            <p className="home-hero-status">Human-accountable decisions • Traceable evidence • Lifecycle governance</p>
          </div>
          {/* One video mount for intro and hero — CSS expands the slot during the introduction. */}
          <div className="home-video-slot">
            <HeroGovernanceVideo posterOnly={posterOnly} />
          </div>
        </section>

        <section className="home-section" aria-labelledby="activities-title">
          <div className="home-section-head">
            <h2 id="activities-title">Platform activities</h2>
            <p>Six concise capabilities. Each opens the corresponding workspace area after sign-in.</p>
          </div>
          <ul className="home-activity-grid">
            {HOME_ACTIVITIES.map((activity) => (
              <li key={activity.id}>
                <Link className="home-activity-card" to="/sign-in" state={{ from: activity.to }}>
                  <img
                    className="home-activity-photo"
                    src={activity.image}
                    srcSet={`${activity.image.replace('.jpg', '-640.jpg')} 640w, ${activity.image} 1152w`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 360px"
                    alt=""
                    width={1152}
                    height={864}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="home-activity-icon" aria-hidden="true">
                    <Icon name={activity.icon} size={22} />
                  </span>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="home-section home-section-muted" id="lifecycle" aria-labelledby="lifecycle-title">
          <div className="home-section-head">
            <h2 id="lifecycle-title">AI and model lifecycle</h2>
            <p>Governance rails stay active from intake through retirement.</p>
          </div>
          <ol className="home-lifecycle">
            {LIFECYCLE_STAGES.map((stage) => (
              <li key={stage}>{stage}</li>
            ))}
          </ol>
          <ul className="home-rails">
            {GOVERNANCE_RAILS.map((rail) => (
              <li key={rail}>{rail}</li>
            ))}
          </ul>
        </section>

        <section className="home-section" aria-labelledby="roles-title">
          <div className="home-section-head">
            <h2 id="roles-title">Role-based governance</h2>
            <p className="home-roles-statement">Agent-assisted analysis. Deterministic controls. Human-accountable decisions.</p>
            <p>{DETERMINISTIC_AGENT_MODE} Accountable humans approve, reject, accept risk and close findings.</p>
          </div>
          <ul className="home-role-grid">
            {HOME_ROLES.map((role) => (
              <li key={role.title}>
                <h3>{role.title}</h3>
                <p>{role.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <AgentArchitecture />

        <section className="home-section home-section-muted" aria-labelledby="safeguards-title">
          <div className="home-section-head">
            <h2 id="safeguards-title">Governance safeguards</h2>
            <p>Designed to support evidence-backed assessment. Framework mapping is not certification or legal advice.</p>
          </div>
          <ul className="home-safeguard-grid">
            {SAFEGUARDS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="home-frameworks">
            <p className="home-frameworks-label">Mapped to</p>
            <ul>
              {FRAMEWORK_BADGES.map((badge) => (
                <li key={badge}>{badge}</li>
              ))}
            </ul>
            <p className="home-frameworks-note">
              Framework mapping supports governance assessment and evidence management; it does not itself constitute certification or legal advice.
            </p>
          </div>
        </section>

        <section className="home-cta" aria-labelledby="cta-title">
          <h2 id="cta-title">Enter the governance workspace</h2>
          <p>Register systems, evidence controls, remediate findings and record executive decisions with a complete audit trail.</p>
          <Link className="button button-primary" to="/sign-in" state={{ from: '/' }}>
            Enter governance workspace
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <p>GRAIL — Governance, Risk, Assurance and AI Lifecycle.</p>
        <nav className="home-footer-links" aria-label="Technical references">
          <a href="https://github.com/ziniyadutta2008-stack/GRAIL/blob/main/README.md" target="_blank" rel="noreferrer">View technical README</a>
          <a href="https://github.com/ziniyadutta2008-stack/GRAIL/blob/main/docs/architecture/overview.md" target="_blank" rel="noreferrer">View deployment architecture</a>
          <a href="https://github.com/ziniyadutta2008-stack/GRAIL" target="_blank" rel="noreferrer">View GitHub repository</a>
          <a href="https://github.com/ziniyadutta2008-stack/GRAIL/tree/main/.github/workflows" target="_blank" rel="noreferrer">View CI/CD and environment strategy</a>
        </nav>
        <p>Illustrative AI-generated photographs. No real customer, employee or patient data is shown.</p>
        <p>Synthetic demonstration environment. Not a certification, attestation or legal opinion.</p>
      </footer>
    </div>
  )
}
