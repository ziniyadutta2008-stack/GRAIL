import { describe, expect, it } from 'vitest'

import {
  canAccessAdministration,
  canEditDirectory,
  canMutateAiSystemRegister,
  canRegisterAiSystem,
  canRenameOrganization,
  canRunAgentDraft,
  hasPermission,
} from './permissions'

describe('role permissions', () => {
  it('grants the read-only reviewer only view_permitted_records', () => {
    expect(hasPermission('read_only_reviewer', 'view_permitted_records')).toBe(true)
    expect(canAccessAdministration('read_only_reviewer')).toBe(false)
    expect(canEditDirectory('read_only_reviewer')).toBe(false)
    expect(canRenameOrganization('read_only_reviewer')).toBe(false)
    expect(canRegisterAiSystem('read_only_reviewer')).toBe(false)
    expect(canMutateAiSystemRegister('read_only_reviewer')).toBe(false)
    expect(canRunAgentDraft('read_only_reviewer')).toBe(false)
  })

  it('lets governance lead and system owner register and mutate systems', () => {
    expect(canRegisterAiSystem('governance_lead')).toBe(true)
    expect(canMutateAiSystemRegister('system_owner')).toBe(true)
    expect(canRunAgentDraft('governance_lead')).toBe(true)
    expect(canAccessAdministration('governance_lead')).toBe(true)
  })

  it('keeps platform admin on tenant administration without governance mutations', () => {
    expect(canAccessAdministration('platform_admin')).toBe(true)
    expect(canEditDirectory('platform_admin')).toBe(true)
    expect(canRegisterAiSystem('platform_admin')).toBe(false)
    expect(canRunAgentDraft('platform_admin')).toBe(false)
  })
})
