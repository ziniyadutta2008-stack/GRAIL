import { Link, Route, Routes } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { RequirePermission } from '../auth/RequirePermission'
import { SignInPage } from '../auth/SignInPage'
import { AppShell } from '../components/AppShell'
import { EmptyState } from '../components/EmptyState'
import { ActionsLayout, FindingRecord, FindingsList, IncidentRecord, Incidents, RemediationBacklog, RemediationRecord } from '../pages/ActionsPages'
import { AiEstatePage } from '../pages/AiEstatePage'
import { IntakePage } from '../pages/IntakePage'
import { AssessControlLayout, ControlRecord, IsoIndex, IsoSystem, RaciIndex, Soc2Index, Soc2System } from '../pages/AssessControlPages'
import { LawsWatchPage } from '../pages/LawsWatchPage'
import { EthicsCasePage } from '../pages/EthicsCasePage'
import { EthicsPracticePage } from '../pages/EthicsPracticePage'
import { PolicyIndex, SystemPolicies } from '../pages/PoliciesPage'
import { DecisionTracker } from '../pages/DecisionTrackerPage'
import { Approvals, CharterReviews, CouncilDecision, CouncilDecisions, DecisionsLayout, ExceptionRecordPage, ExceptionsList } from '../pages/DecisionsPages'
import { OverviewPage } from '../pages/OverviewPage'
import { AdministrationLayout, AuditTrail, Configuration, CouncilPacks, ReportsLayout, UsersAndRoles } from '../pages/ReportsAdminPages'
import { SystemLayout } from '../pages/system/SystemLayout'
import { AssessmentRecord, SystemActivity, SystemAssessments, SystemControls, SystemExceptions, SystemFindings, SystemOverview, SystemRaci } from '../pages/system/SystemSections'
import { SystemEthicsPage } from '../pages/system/SystemEthicsPage'
import { RetirementProvider } from '../actions/retirementStore'
import { LensProvider } from './LensContext'

function NotFound() {
  return <EmptyState title="Page not found" nextStep="Use the primary navigation, or return to the Overview." action={<Link to="/">Go to Overview</Link>} />
}

function SignedInShell() {
  const { session } = useAuth()
  if (!session) return null
  return (
    <RetirementProvider>
      <LensProvider key={session.persona.id} role={session.persona.role}>
        <AppShell />
      </LensProvider>
    </RetirementProvider>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<SignedInShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="ai-estate" element={<AiEstatePage />} />
          <Route
            path="ai-estate/intake"
            element={
              <RequirePermission
                permission={['manage_governance_program', 'maintain_assigned_systems']}
                fallbackTitle="Registration is restricted"
                fallbackDescription="Only a governance lead or system owner can register an AI system."
              >
                <IntakePage />
              </RequirePermission>
            }
          />
          <Route path="ai-estate/:systemId" element={<SystemLayout />}>
            <Route index element={<SystemOverview />} />
            <Route path="raci" element={<SystemRaci />} />
            <Route path="assessments" element={<SystemAssessments />} />
            <Route path="assessments/:assessmentId" element={<AssessmentRecord />} />
            <Route path="controls" element={<SystemControls />} />
            <Route path="findings" element={<SystemFindings />} />
            <Route path="ethics" element={<SystemEthicsPage />} />
            <Route path="exceptions" element={<SystemExceptions />} />
            <Route path="activity" element={<SystemActivity />} />
          </Route>
          <Route path="assess" element={<AssessControlLayout />}>
            <Route index element={<RaciIndex />} />
            <Route path="iso42001" element={<IsoIndex />} />
            <Route path="iso42001/:systemId" element={<IsoSystem />} />
            <Route path="iso42001/:systemId/controls/:mappingId" element={<ControlRecord />} />
            <Route path="soc2" element={<Soc2Index />} />
            <Route path="soc2/:systemId" element={<Soc2System />} />
            <Route path="laws" element={<LawsWatchPage />} />
            <Route path="policies" element={<PolicyIndex />} />
            <Route path="ethics" element={<EthicsPracticePage />} />
            <Route path="ethics/:caseId" element={<EthicsCasePage />} />
            <Route path="policies/:systemId" element={<SystemPolicies />} />
          </Route>
          <Route path="actions" element={<ActionsLayout />}>
            <Route index element={<RemediationBacklog />} />
            <Route path="findings" element={<FindingsList />} />
            <Route path="findings/:findingId" element={<FindingRecord />} />
            <Route path="remediation/:actionId" element={<RemediationRecord />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="incidents/:incidentId" element={<IncidentRecord />} />
          </Route>
          <Route path="decisions" element={<DecisionsLayout />}>
            <Route index element={<Approvals />} />
            <Route path="exceptions" element={<ExceptionsList />} />
            <Route path="exceptions/:exceptionId" element={<ExceptionRecordPage />} />
            <Route path="charter-reviews" element={<CharterReviews />} />
            <Route path="council" element={<CouncilDecisions />} />
            <Route path="council/:decisionId" element={<CouncilDecision />} />
            <Route path="systems/:systemId" element={<DecisionTracker />} />
          </Route>
          <Route path="reports" element={<ReportsLayout />}>
            <Route index element={<CouncilPacks />} />
            <Route path="audit-trail" element={<AuditTrail />} />
          </Route>
          <Route
            path="administration"
            element={
              <RequirePermission
                permission={['administer_tenant', 'manage_governance_program']}
                fallbackTitle="Administration is restricted"
                fallbackDescription="Only a platform administrator or AI governance lead can open Administration."
              >
                <AdministrationLayout />
              </RequirePermission>
            }
          >
            <Route index element={<UsersAndRoles />} />
            <Route path="configuration" element={<Configuration />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
