# 15-second conversation video — implementation checkpoint

Scope approved September 16: camera button in active message composer; camera and microphone; countdown; preview/retake/send; private inline playback. No identity verification claims. Separate from profile introductions and optional uploads.

## Release state

Draft PR #98 includes FIX-013 / PR97; do not merge independently without its prerequisite. Founder approved Preview activation. Shared migration applied and verified as live version 20260916141125. Production frontend remains unchanged and video disabled. next.config.ts enables video only for Vercel Preview builds on codex/video-messages and codex/fix008-discovery-persistent (explicit false disables it).

Migration: 20260916133132_conversation_video_messages.sql. Adds service-only inspection records, MP4/WebM allowances, immutable-upload protection and a validated-video requirement to the existing send RPC. Existing message/conversation/block guards remain. No member/account fixtures are created outside disposable tests.

Server downloads using the member's authenticated storage access and checks actual media using pinned Mediabunny container parsing. Maximum 15 seconds, 10 MB, one video track and one audio track, H264/AAC MP4 or VP8/VP9/Opus WebM. Claimed MIME/duration are not trusted. Duration is computed from media tracks rather than trusting the client or only a claimed metadata duration. Short recorder auto-stop has an encoding margin; recordings may finish slightly before 15 seconds. Format selection is negotiated with the browser.

Inspection records are bound to storage object identity. Members cannot insert records, overwrite an inspected upload, or reuse a deleted object's inspection. No new public storage access. Video permission is allowed only on conversation pages. Playback requests a fresh short-lived signed URL; existing authorization applies. Like existing signed attachments, an already issued URL remains valid until expiration.

## Verification completed locally

- TypeScript and ESLint checks.
- 665 application tests.
- Production build.
- Generated actual short MP4 and WebM accepted; actual 16-second MP4 rejected.
- npm audit: zero reported vulnerabilities.

## Remaining release gates

- PR Validation #185 passed application and database checks at 6bd4e022601679674a9c7ee254c1e555431a3a42 (665 application tests and full database suite).
- Browser recorder lifecycle using actual camera/microphone: permission denial/retry, stop/auto-stop, preview, retake, send, cancellation/unmount, device interruption, portrait/landscape.
- Real two-account Preview send/playback/reload; block/end denial; retry without duplicate messages. Preserve existing text drafts.
- Stable Preview deployment and real-device validation. Leave Production video off and PR unmerged until reviewed.

Browser automation daemon failed to start in this workspace. No physical-device or end-to-end video-send success is claimed. Local temporary recorder lab was removed before commit.

The earlier upload approval block was resolved by explicit founder approval. PR #98 is uploaded and draft/unmerged. Shared backend activation was separately approved and completed. Live MIME constraint name differed from disposable CI; the first transaction rolled back, and the corrected migration handles both names. Private bucket, inspection-table RLS, service-only inspection writes, and pg_catalog-first function search paths were verified. Stable Preview: https://preview.forgedinlife.com/login. No Production frontend rollout.
