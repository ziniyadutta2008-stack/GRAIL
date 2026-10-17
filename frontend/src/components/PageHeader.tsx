import type { ReactNode } from 'react'

import { Breadcrumbs, type Crumb } from './Breadcrumbs'

interface PageHeaderProps {
  title: string
  description: string
  breadcrumbs?: Crumb[]
  /** The single dominant action for the page. */
  primaryAction?: ReactNode
  meta?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, primaryAction, meta }: PageHeaderProps) {
  return (
    <header className="page-header">
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="page-header-row">
        <div className="page-header-text">
          <h1>{title}</h1>
          <p className="muted">{description}</p>
          {meta ? <div className="page-header-meta">{meta}</div> : null}
        </div>
        {primaryAction ? <div className="page-header-action">{primaryAction}</div> : null}
      </div>
    </header>
  )
}
