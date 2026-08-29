# Analytics-driven first-value implementation

Tracks implementation for issue #27.

## Goals
- Make activation → first successful title/meta generation measurable.
- Preserve stable site-install identity across sessions.
- Distinguish first vs repeat generation.
- Classify technical failure reasons separately from quota/billing friction.
- Make the post-activation path lead clearly to first value.

## Acceptance checks
- plugin_opened includes lifecycle context.
- generation success includes `is_first_generation`.
- generation failure includes a safe machine-readable failure category.
- activation/open/generation can be joined by `site_install_id`.
- returning sessions can be distinguished from first-time sessions.

This file is intentionally small; the detailed acceptance criteria remain in GitHub issue #27.
