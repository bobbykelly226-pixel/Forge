# Voice messages — October 22, 2026

Requested by Bobby after survey and beta feedback: replace the chat video composer with recorded voice messages; reserve video for a future Premium tier.

## Behavior

- Microphone button in active conversations; audio-only browser capture after an explicit Record tap.
- Up to 5 minutes; Stop, listen to a local preview, Record again, Send. No automatic sending.
- Permission denial, interruption and unsupported browsers show a recoverable explanation. Closing, leaving or stopping releases the microphone. Late permission results are discarded safely.
- A failed send retains the recording. Retries reuse its upload and client message ID. Voice sends and retries preserve an existing text draft.
- Private playback with native audio controls. Received voice messages can be reported; evidence is preserved and available to MFA-verified operators.
- New video sending is disabled in the composer, validation endpoint and message RPC. The retained video recorder is dormant. Historical video and View Once playback/reporting remain supported.
- This release does not create billing or Premium entitlements, live calls, or speech-to-text transcription.

## Data and privacy

Migration `20261022155005_conversation_voice_messages.sql` adds server-only audio checks and MP4/WebM audio allowances to the existing private media/evidence buckets. The server inspects actual bytes, one audio track, codec/container match and duration. Checks bind to immutable storage object IDs, sender, path, MIME and size. Existing connection/block rules remain enforced.

The same-origin microphone permission policy survives client navigation into chat. The browser still requires microphone permission; recording is triggered only by Record. Camera permission remains disabled.

The evidence table/bucket and historical helper names retain `video` for compatibility while accepting both supported voice and video types. No existing member content was removed.

## Initial release verification

- TypeScript check and production build passed; changed components/API passed ESLint.
- 36 focused tests passed, including actual AAC/MP4 and Opus/WebM byte inspection, over-limit rejection, video-as-audio rejection, existing video/View Once behavior and report scoping.
- Recorder lifecycle harness passed 12 checks with simulated media: preview, failure/retry, retake, cancellation, late permissions, denied permissions, automatic stop, background interruption, audio-only constraints, no automatic sending and no runtime errors.
- Database migration applied with 23 assertion calls using temporary authenticated sender, recipient and outsider fixtures. Verified uninspected/tampered media denial, idempotence, private recipient access, outsider denial, block/end enforcement and server-side video denial. All fixtures rolled back; zero test users remain.
- Full test run: 709 passed / 716 total. The seven unrelated failures were reproduced on unchanged main in administrator entry, beta feedback intake, notification polish and invitation-only error wording.
- Security advisors reviewed: the new server-only checks table intentionally has RLS with no member policies. The new authenticated security-definer lookup intentionally validates ownership and active conversation membership. Existing leaked-password-protection warning is outside this change (https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Five-minute limit follow-up — October 22, 2026

Bobby requested voice as a practical alternative to typing, with five minutes per message. This supersedes the initial 60-second limit. The recorder, minute/second timer, server byte validation, database inspection constraint and send RPC now use 300 seconds. Migration: `20261022160144_five_minute_voice_messages.sql`.

Five focused tests passed, including a 300-second AAC/MP4 file, a 299.5-second Opus/WebM file, a formerly rejected 61-second file, and rejection above 300 seconds. TypeScript and scoped ESLint passed. The simulated lifecycle harness confirmed recording continues beyond one minute, displays `1:00 / 5:00`, and stops at five minutes. Transactional database checks accepted the full five-minute message, rejected an inspection over 300 seconds, and retained all send/privacy/block/end checks. Test records were rolled back. Security-advisor categories/counts were unchanged.

The 10 MB attachment cap remains; the recorder requests 64 kbps audio (about 2.4 MB for five minutes before container overhead). Existing text messages remain available. This is a tap-to-record feature; it is not a hands-free driving mode.

## Remaining device verification

The test browser download was unavailable in this environment. A physical iPhone/Safari, Android/Chrome or installed-PWA recording and an authenticated two-device send/playback have not been exercised here. This is a verification limitation, not a claim that those flows were tested.
