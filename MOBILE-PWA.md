# Mobile PWA candidate (2026-10-25)

This is a **local, unshipped candidate**, based on main `35623e1095cb7ebe973ff9b8f98f5d687dcb91e1` of `skydreamer0/clinic-voice-notes`. README.md is preserved verbatim as project history; its “not implemented” status describes the upstream repository. This candidate is not yet deployed or available on a public URL.

## What this package does

- A small vanilla HTML/CSS/JavaScript mobile interface, with no runtime packages, API key, backend or model.
- Tap a text field and use your Android/iOS keyboard's dictation feature, if available, or type normally. **The page does not access the microphone.** System dictation's processing/network behavior is outside this app's control; verify device, locale and keyboard privacy settings independently.
- Select S/O/A/P before adding each segment, or enter freeform text and manually classify afterward. This is **manual organization, not AI summarization**. A/P may be absent. The app does not generate diagnoses, prescriptions or treatment plans.
- Each added segment preserves the submitted text; later draft corrections retain a revision log. This is preservation of submitted text, not proof of original audio or tamper-proof auditing.
- Review all segments, explicitly confirm, then download a text draft with source and correction history. Every substantive edit/new input invalidates the current review. New case starts empty and deletes this app's saved draft after explicit confirmation.
- Memory by default. Browser local storage only with explicit opt-in; it is unencrypted and may be evicted. It is not a permanent clinical record store. Restore requires a user choice and always requires fresh review.

## Local verification

`npm ci --ignore-scripts && npm test` runs Node domain, static contract, service-worker simulation and jsdom integration tests. Playwright and jsdom are exact-pinned development-only dependencies, never browser/runtime dependencies. `npm run test:browser` runs actual Chromium/WebKit mobile-emulation scenarios after the official Playwright browser installation in standard GitHub-hosted CI. This is not a real iOS/Android voice test.

A static server can serve this directory for local cloud-workspace review. There is no application backend. Do not put identifiable patient data into test sessions, public source, URLs, logs or screenshots.

## Installation and hosting boundary

All app URLs, manifest scope/start URL and worker assets are relative to the directory, compatible in design with a GitHub Pages project subpath such as `/clinic-voice-notes/`. Service workers require a secure context (HTTPS or supported localhost). `file://` is not an install/offline test. GitHub is source hosting here; **no Pages settings, Actions workflows, repository permissions or deployments have been changed**.

The manifest contains a local SVG icon. Browser/platform install behavior and iOS home-screen icon rendering require actual-device verification; no universal install prompt or native-app guarantee is made. First load requires the hosted shell; offline use requires successful prior cache installation. The service worker caches only a hardcoded static asset list. No note text/audio is stored in Cache Storage. Arbitrary routes, query URLs, non-GET and cross-origin requests are not handled by it. An OS may still use the network for dictation even when this app shell is cached.

No automatic worker activation or page reload interrupts editing. A waiting update is announced; save work before closing and reopening all app tabs. Browser termination/background eviction may occur without `beforeunload`, particularly on mobile; the warning is best-effort, not a recovery guarantee.

## Explicitly not delivered

- Native iOS/Android app, on-device language model, automatic SOAP, audio recording/transcription engine.
- Clinical certification, authentication, encrypted storage, hospital integration or formal legal medical records.
- Real iOS/Android dictation, home-screen install, keyboard behavior, offline launch verification (pending independent real browser/device review).
- Merge, Pages activation or deployment. GitHub Draft PR/source publication is a separate reviewed delivery step.

## Primary documentation checked

- MDN service worker lifecycle and scope: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- MDN static caching: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching
- Apple dictation privacy (device settings indicate processing behavior): https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/

These support design constraints; they are not evidence that this candidate has passed a device test.

## Static shell release maintenance

After **any** app shell asset change run `node scripts/version-shell.js --write` before testing. It derives the worker cache version from the exact HTML/CSS/JS/manifest/icon bytes; the Node test rejects a stale worker version. The worker script therefore changes with every shipped shell change, so installed clients can discover an update instead of remaining permanently cache-first on stale assets. Cache names include the encoded registration scope, so cleanup never deletes another project scope's shell cache. This is a source-level release gate, not evidence of a real-browser update test.

## GitHub browser QA

The read-only `browser-qa.yml` workflow uses standard Ubuntu and exact action revisions, no deployment/token write permission, and no trace/video/artifact upload. The allowlisted local test server serves only app assets under `/clinic-voice-notes/`; no `.git`, source tests, receipts or documentation is served. Eight scenarios across Chromium/WebKit exercise source/correction/review/download, opt-in reload/new case, actual service-worker-controlled offline reload, and server access boundaries with synthetic text. Results remain pending until an actual GitHub run reaches its terminal state.

Official CI/browser installation reference: https://playwright.dev/docs/ci
