/** A small set of inline icons. Decorative unless a label is supplied. */
const PATHS = {
  overview: 'M3 13h7V3H3zm0 8h7v-6H3zm11 0h7V11h-7zm0-18v6h7V3z',
  estate: 'M4 6h16M4 12h16M4 18h10M18 16l2 2 4-4',
  assess: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  actions: 'M5 12h14M12 5l7 7-7 7',
  decisions: 'M12 3v18M5 7h14l-3 6H8zM8 21h8',
  reports: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  admin: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 2z',
  success: 'M20 6L9 17l-5-5',
  warning: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  critical: 'M12 8v4m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  info: 'M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  neutral: 'M5 12h14',
  evidence: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  lightbulb: [
    'M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.4 18 9.2 18 8a6 6 0 0 0-12 0c0 1.2.3 2.4 1.5 3.5.8.8 1.3 1.5 1.5 2.5',
    'M9 18h6',
    'M10 22h4',
  ],
  pen: [
    'M13 21h8',
    'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
  ],
  bin: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'],
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  label?: string
  size?: number
}

export function Icon({ name, label, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {name === 'pen' ? (
        <>
          <path
            d="M8.7 6.15H18.3a1.55 1.55 0 0 1 1.55 1.55v10.55a1.55 1.55 0 0 1-1.55 1.55H7.35a1.55 1.55 0 0 1-1.55-1.55V8.15"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <g transform="translate(0.85 0.45) rotate(46 2 2)" fill="currentColor" stroke="none">
            <path d="M.95.3h7.4L10.85 2 8.35 3.7H.95A1.7 1.7 0 0 1 .95.3z" />
            <path d="M10.2 1.15 12.25 2 10.2 2.85z" />
          </g>
        </>
      ) : name === 'bin' ? (
        <path
          fill="currentColor"
          stroke="none"
          fillRule="evenodd"
          d="M9.3 1.7h5.4l.8 1.7H21a1.7 1.7 0 0 1 0 3.4H3a1.7 1.7 0 0 1 0-3.4h5.5l.8-1.7zM6.2 8.5h11.6c.6 0 1.1.5 1.1 1.1v8.8c0 1.6-1.3 2.8-2.9 2.8H8c-1.6 0-2.9-1.2-2.9-2.8V9.6c0-.6.5-1.1 1.1-1.1zM7.55 12.15a.7.7 0 0 1 .7-.7.7.7 0 0 1 .7.7v5.7a.7.7 0 0 1-.7.7.7.7 0 0 1-.7-.7v-5.7zM11.3 12.15a.7.7 0 0 1 .7-.7.7.7 0 0 1 .7.7v5.7a.7.7 0 0 1-.7.7.7.7 0 0 1-.7-.7v-5.7zM15.05 12.15a.7.7 0 0 1 .7-.7.7.7 0 0 1 .7.7v5.7a.7.7 0 0 1-.7.7.7.7 0 0 1-.7-.7v-5.7z"
        />
      ) : (
        (typeof PATHS[name] === 'string' ? [PATHS[name]] : PATHS[name]).map((d) => <path key={d} d={d} />)
      )}
    </svg>
  )
}
