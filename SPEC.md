# First mobile package contract

## Scope and data shape

`state.js`: `{version, session, revision, nextId, segments, history, confirmed}`. Segment `{id, source, draft, field}` has immutable submitted `source`. IDs are session-bound sequential integers. Only explicit manual classification sets `field`; freeform starts unassigned. Every add/edit increments revision; confirmation binds session+revision. Confirmation requires every included segment to be classified and nonblank. Empty entire A/P sections are valid. Export requires current confirmation and no pending unsubmitted text in the UI. Export is a human-confirmed draft, not a formal record.

State restore validates schema, identifiers, limits and replays correction history against the submitted sources/current draft. This validation catches inconsistency, not maliciously rewritten local storage. Restored confirmation is deliberately discarded. No external import/share endpoint exists. Original input means the text at the moment the user presses Add; OS transcription correctness remains the reviewer's responsibility.

`app.js`: event-driven presentation; safe DOM text APIs. All draft/field input invalidates review. Pending entry is optionally serialized with the current case. Storage disabled unless opted in; declining a saved-draft restore prevents overwriting it until explicit deletion. Storage failure is displayed and does not silently mark success. New-case operation stops if deleting old saved data fails. Other origin local-storage/cache entries are not removed.

## Acceptance criteria

1. Enter freeform or guided S/O/A/P; add preserves source; manually assign before confirming.
2. Editing keeps source and history, immediately disables export and clears review checkbox.
3. Confirm only with explicit review and complete classification; missing A/P allowed.
4. New case has no old text, source, history or confirmation; saved local draft is explicitly cleared.
5. Default editing writes no local storage. Opt-in saves current case and pending input; reload asks before restore and requires review anew.
6. Static assets resolve relative to project directory. SW cache bounded to exact fixed assets; no content URLs, query caching or runtime cache writes.
7. No model/API/recording/library fetch/telemetry/CDN; no real patient data fixtures.
8. Mobile controls ≥44px, visible keyboard focus, labels, live status, no autofocus. Real-device keyboard/install verification remains a separate gate.

## Risks and release gate

Browser/OS failure can lose memory-only drafts. localStorage is unencrypted and is not safe for shared-device clinical records. OS keyboard cloud processing cannot be controlled from a PWA. Blob downloads and install affordances differ by browser. Real device, privacy review and clinical governance remain required before any real clinical use.

Independent code and actual UI review are required before proposing publication. This package must not be represented as the earlier desktop/Ollama candidate fixed: that candidate remains frozen with the separate session/revision replay gap unreviewed.
