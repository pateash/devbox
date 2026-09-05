# DevBox

DevBox is a local-first macOS desktop application that brings a developer's actionable work into one place. It does not replace GitHub or Jira. It reads selected signals from them, turns related signals into one work thread, and opens the original system for detailed work.

The first release supports multiple local workspaces plus GitHub and Jira Cloud integrations. Slack, direct write actions, hosted sync, and team collaboration are intentionally outside V1.

## Planning documents

- [Product and UX specification](docs/PRODUCT.md)
- [Electron architecture and data design](docs/ARCHITECTURE.md)
- [Implementation plan and validation](docs/IMPLEMENTATION.md)
- [CI/CD pipeline and release guide](docs/CI_CD.md)

## V1 outcome

A developer can create named workspaces such as `Acme Platform` and `Personal OSS`, connect a different GitHub and Jira account to each one, and see a quiet, useful dashboard of their review requests, their pull requests with failed checks, and Jira issues assigned to them. When a pull request references a Jira key, DevBox joins them into one work card and deep-links back to GitHub or Jira.

## Product principles

1. Attention over activity: show what needs action, not an indiscriminate event stream.
2. Existing tools remain authoritative: every detail view can open its source page.
3. Local first: provider content is synced directly from the Mac and cached only locally.
4. Explicit trust: scopes, refresh time, integration health, and data removal are visible.
5. Few excellent integrations before many shallow ones.
