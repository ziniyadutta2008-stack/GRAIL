import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { INTRO_ACTIVITIES, INTRO_DURATION_MS } from './content'

interface FirstVisitIntroductionProps {
  onComplete: () => void
}

/** Full-viewport first visit overlay. Video is mounted once by HomePage underneath. */
export function FirstVisitIntroduction({ onComplete }: FirstVisitIntroductionProps) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const elapsedRef = useRef(0)
  const lastTickRef = useRef(0)

  useEffect(() => {
    lastTickRef.current = performance.now()
    const tick = window.setInterval(() => {
      const now = performance.now()
      const last = lastTickRef.current || now
      lastTickRef.current = now
      if (paused) return
      elapsedRef.current = Math.min(INTRO_DURATION_MS, elapsedRef.current + (now - last))
      const elapsed = elapsedRef.current
      setProgress((elapsed / INTRO_DURATION_MS) * 100)
      setIndex(Math.min(INTRO_ACTIVITIES.length - 1, Math.floor((elapsed / INTRO_DURATION_MS) * INTRO_ACTIVITIES.length)))
      if (elapsed >= INTRO_DURATION_MS) {
        window.clearInterval(tick)
        onComplete()
      }
    }, 100)
    return () => window.clearInterval(tick)
  }, [onComplete, paused])

  return (
    <div className="home-intro" role="dialog" aria-modal="true" aria-labelledby="home-intro-title">
      <div className="home-intro-scrim" />
      <div className="home-intro-content">
        <div className="home-brand">
          <span className="brand-mark" aria-hidden="true">G</span>
          <div>
            <p className="brand-name">GRAIL</p>
            <p id="home-intro-title">Governance, Risk, Assurance and AI Lifecycle</p>
          </div>
        </div>
        <p className="home-intro-lead">Enterprise AI and Model Risk Governance Control Plane</p>
        <p className="home-intro-support">Evidence-backed governance, from intake to executive decision.</p>
        <ul className="home-intro-activities" aria-live="polite">
          {INTRO_ACTIVITIES.map((label, activityIndex) => (
            <li key={label} className={activityIndex === index ? 'is-active' : undefined}>
              {label}
            </li>
          ))}
        </ul>
        <div className="home-intro-actions">
          <Link className="button button-primary" to="/sign-in" state={{ from: '/' }} onClick={onComplete}>
            Enter governance workspace
          </Link>
          <button type="button" className="button button-secondary" onClick={onComplete}>
            Skip introduction
          </button>
          <button
            type="button"
            className="button button-secondary"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? 'Play introduction' : 'Pause introduction'}
          </button>
        </div>
        <div className="home-intro-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="visually-hidden">Introduction progress {Math.round(progress)} percent.</p>
      </div>
    </div>
  )
}
