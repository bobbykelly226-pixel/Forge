# Account Lifecycle and Privacy Controls

Status: Punchlist #4 draft implementation
Production migration: not applied
Production deployment: not approved

## Plain-English behavior

- **Pause:** removes a member from Discovery immediately. Their profile, connections, and existing conversations remain. Resuming does not automatically turn Discovery back on.
- **Deactivate:** requires the current password. It disables Discovery and member interactions while retaining the account for later reactivation.
- **Export:** requires the current password and creates a one-time JSON download link that expires after five minutes. The link is consumed on first use.
- **Delete:** requires the current password plus typing `DELETE`. Profile/private/questionnaire data is removed or de-identified, profile and message attachments are removed, message bodies are de-identified, and the Supabase Auth user is soft-deleted and signed out.
- **Required retention:** legal acceptances, safety reports and evidence, operator enforcement, lifecycle audit events, and other legally or operationally required records remain.
- **Legal hold:** an active legal hold blocks account deletion. Members see only that a preservation requirement exists; the private reason is available only in the MFA-protected administrator workspace.

## Security boundaries

1. Password confirmation occurs only in a server action using a transient Supabase client.
2. Successful confirmation is bound to the member's current live `auth.sessions` session ID and expires after ten minutes.
3. Deactivation, export, and deletion cannot rely on a stale JWT alone.
4. Export tokens are server-created, single-use, expire after five minutes, and are consumed atomically.
5. Destructive deletion preparation and legal-hold changes are service-role-only database functions.
6. Lifecycle and governance tables have RLS enabled and grant no direct access to ordinary authenticated clients.
7. Governance actions require the exact operator allowlist plus authenticator assurance and create append-only audit events.

## Retention classes

| Class | Purpose |
|---|---|
| `standard` | Normal member lifecycle retention |
| `safety_extended` | Extended preservation connected to trust-and-safety needs |
| `legal_required` | Preservation required for legal or regulatory reasons |

`retain_until` is optional because a valid hold may not have a known end date. Release of a hold is a separate, audited operator action.

## Release checklist

- Review and approve the migration separately.
- Apply the migration to a non-Production Supabase environment first.
- Verify RLS, grants, triggers, and pgTAP tests.
- Test pause/resume with two members and confirm existing messages remain.
- Test deactivation/reactivation with current and incorrect passwords.
- Test export once, retry the same link, and test after expiry.
- Test deletion against a disposable member with and without a legal hold.
- Confirm all member sessions are invalid after deletion.
- Confirm required safety/legal/audit evidence remains.
- Only then approve merge, Production migration, and Production deployment.
