import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

import { ContextTabs, type TabLink } from '../components/ContextTabs'
import { PageHeader } from '../components/PageHeader'
import { SyntheticNotice } from '../components/SyntheticNotice'

interface AreaLayoutProps {
  title: string
  description: string
  tabs: TabLink[]
  primaryAction?: ReactNode
}

/** A primary navigation area with its contextual functions as secondary tabs. */
export function AreaLayout({ title, description, tabs, primaryAction }: AreaLayoutProps) {
  return (
    <div className="stack">
      <PageHeader title={title} description={description} primaryAction={primaryAction} />
      <SyntheticNotice />
      <ContextTabs label={`${title} sections`} tabs={tabs} />
      <Outlet />
    </div>
  )
}
