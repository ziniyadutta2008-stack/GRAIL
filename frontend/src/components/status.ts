/**
 * Maps governance vocabulary to a semantic tone. Tone only changes colour and icon;
 * the visible text label always carries the meaning.
 */
export type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral' | 'evidence'

const TONES: Record<string, Tone> = {
  // Lifecycle gate
  Go: 'success',
  'Conditional Go': 'warning',
  'No-Go': 'critical',
  // ISO/IEC 42001 mapping status
  Implemented: 'success',
  Partial: 'warning',
  Gap: 'critical',
  // SOC 2 readiness result
  Pass: 'success',
  Drift: 'warning',
  Fail: 'critical',
  'Not Tested': 'neutral',
  'Not recorded': 'neutral',
  'Not attached': 'neutral',
  'Not assessed': 'neutral',
  Challenged: 'warning',
  Accepted: 'success',
  Effective: 'success',
  Ineffective: 'critical',
  Requested: 'info',
  Returned: 'warning',
  // Severity
  Critical: 'critical',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
  // Record states
  Draft: 'neutral',
  Posted: 'success',
  Submitted: 'info',
  Reviewed: 'info',
  'Under Review': 'info',
  'In Review': 'info',
  Approved: 'success',
  'Approved with Conditions': 'warning',
  Active: 'info',
  Denied: 'critical',
  Rejected: 'critical',
  Expired: 'warning',
  Closed: 'neutral',
  Superseded: 'neutral',
  Open: 'warning',
  Planned: 'info',
  'In Progress': 'info',
  'In progress': 'info',
  'Not started': 'neutral',
  Blocked: 'critical',
  'Ready for Validation': 'evidence',
  'Risk Accepted': 'warning',
  Overdue: 'critical',
  Discontinued: 'neutral',
  // KPI trend labels
  Positive: 'success',
  Moderate: 'warning',
  Observation: 'neutral',
  Screened: 'info',
  Mitigate: 'warning',
  Reject: 'critical',
  Flag: 'warning',
  Clear: 'success',
  Concern: 'warning',
  'Critical Flag': 'critical',
  'Conditionally Approve': 'warning',
  P1: 'critical',
  Proceed: 'success',
  Escalate: 'warning',
  'Not Assessed': 'neutral',
  'Not Applicable': 'neutral',
  Monitor: 'warning',
  'Production hold': 'critical',
  'Remediation required': 'warning',
  'Under assessment': 'info',
  'Validation required': 'warning',
  'Approved for deployment': 'success',
  Suspended: 'critical',
  Retired: 'neutral',
  Restricted: 'critical',
  Confidential: 'warning',
  Internal: 'info',
  Public: 'success',
}

export function toneFor(label: string): Tone {
  return TONES[label] ?? 'neutral'
}
