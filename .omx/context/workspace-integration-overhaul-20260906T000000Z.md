# Workspace integration overhaul context

- Task: Replace the personal-bucket sidebar model with workspace-scoped Git and Tickets sections, and make integration configuration the first-run setup path.
- Desired outcome: A workspace remains the durable container. GitHub repository selection and Jira project selection are workspace configuration, while navigation is organized around work domains.
- Evidence: `src/renderer/main.tsx` currently exposes Overview, Inbox, My Work, Saved, a Tools heading, and provider entries. It already has GitHub repository assignment and Jira project configuration flows.
- Constraints: Preserve the existing global GitHub connection versus workspace repository assignments, preserve the in-progress Jira implementation, and do not overwrite unrelated worktree changes.
- Unknowns: No persisted saved-view model exists, so Saved will be removed rather than reinterpreted as an unsupported feature.
- Likely touchpoints: `src/renderer/main.tsx`, `src/renderer/styles.css`, renderer tests if present.
