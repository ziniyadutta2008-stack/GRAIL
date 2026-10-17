import { useEffect, useId, useRef, useState } from 'react'

import { prefersReducedMotion, saveDataPreferred } from './content'

const DESKTOP_WEBM = '/videos/grail-governance-hero.webm'
const DESKTOP_MP4 = '/videos/grail-governance-hero.mp4'
const MOBILE_WEBM = '/videos/grail-governance-mobile.webm'
const MOBILE_MP4 = '/videos/grail-governance-mobile.mp4'
export const HERO_POSTER = '/images/grail-hero-governance.jpg'

interface HeroGovernanceVideoProps {
  /** When true, keep the poster only (intro reduced-motion / save-data). */
  posterOnly?: boolean
  className?: string
}

function useMobileMedia(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 768px)').matches
      : false,
  )
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(max-width: 768px)')
    const onChange = () => setMobile(query.matches)
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return mobile
}

/**
 * Shared cinematic hero media. Mount once on the homepage so the intro and hero
 * do not download the asset twice. Decorative footage; product copy stays in HTML.
 */
export function HeroGovernanceVideo({ posterOnly = false, className = '' }: HeroGovernanceVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const labelId = useId()
  const mobile = useMobileMedia()
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [inView, setInView] = useState(true)
  const reduced = prefersReducedMotion()
  const saveData = saveDataPreferred()
  const usePoster = posterOnly || reduced || saveData || failed

  useEffect(() => {
    const node = videoRef.current
    if (!node || usePoster || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [usePoster])

  useEffect(() => {
    const onVisibility = () => {
      const node = videoRef.current
      if (!node || usePoster) return
      if (document.hidden) node.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [usePoster])

  useEffect(() => {
    const node = videoRef.current
    if (!node || usePoster) return
    if (!inView || document.hidden) {
      node.pause()
      return
    }
    const attempt = node.play()
    if (attempt) {
      void attempt.catch(() => setFailed(true))
    }
  }, [inView, usePoster, mobile])

  const toggle = () => {
    const node = videoRef.current
    if (!node || usePoster) return
    if (node.paused) {
      void node.play().catch(() => setFailed(true))
    } else {
      node.pause()
    }
  }

  return (
    <div className={`hero-video ${className}`.trim()}>
      {!usePoster ? (
        <p id={labelId} className="visually-hidden">
          Illustrative silent footage of governance professionals reviewing AI systems, data lineage, testing evidence and executive decisions. No real customer, employee or patient data is shown.
        </p>
      ) : null}
      {usePoster ? (
        <img
          className="hero-video-media"
          src={HERO_POSTER}
          srcSet="/images/grail-hero-governance-768.jpg 768w, /images/grail-hero-governance.jpg 1280w"
          sizes="100vw"
          alt=""
          aria-hidden="true"
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="async"
        />
      ) : (
        <>
          <img
            className="hero-video-media hero-video-poster"
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            width={1280}
            height={720}
            fetchPriority="high"
            decoding="async"
          />
          <video
            ref={videoRef}
            className="hero-video-media"
            muted
            loop
            playsInline
            preload="none"
            poster={HERO_POSTER}
            aria-hidden="true"
            aria-labelledby={labelId}
            onError={() => {
              setFailed(true)
              setPlaying(false)
            }}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
          {mobile ? (
            <>
              <source src={MOBILE_WEBM} type="video/webm" />
              <source src={MOBILE_MP4} type="video/mp4" />
            </>
          ) : (
            <>
              <source src={DESKTOP_WEBM} type="video/webm" />
              <source src={DESKTOP_MP4} type="video/mp4" />
            </>
          )}
        </video>
        </>
      )}
      {!usePoster ? (
        <button type="button" className="hero-video-toggle" onClick={toggle} aria-pressed={playing}>
          {playing ? 'Pause video' : 'Play video'}
        </button>
      ) : null}
      <p className="hero-video-note">
        {playing && !usePoster
          ? 'Illustrative AI-generated footage. No real customer, employee or patient data is shown.'
          : 'Illustrative AI-generated photograph. No real customer, employee or patient data is shown.'}
      </p>
    </div>
  )
}
