# Design Brief — Portfolio Demo

## Audience and goals

Present a credible, easy-to-follow lead automation story to prospective clients and portfolio reviewers, for both small teams and larger sales organisations. Explain the qualification and routing decisions, and keep sample records clearly fictional.

## Visual and interaction direction

The existing UI uses a dark navy base with warm gold accents and a polished agency/operations-dashboard style. The landing page introduces the service and workflow; the form captures contact and project details; the `/admin` area presents a fictional 30-day pipeline. Keep workflow evidence and decision rationale prominent.

Navigation: a navy sidebar (top bar on mobile) groups Workspace (Overview, Leads, Meetings), Automation (Run history, Email log, How it works), and Team. A Small business / Enterprise switch sits in the header and beside the public form. The overview opens with a three-step tour. Every lead page leads with "Why it was routed this way".

Data display: tiers use an ordinal blue ramp (high #184f95, mid #3987e5, low #86b6ef) with a legend, hover tooltip, and table view; single-series bars use #2a78d6; at-capacity workload uses red with a numeric label. Impact figures are illustrative, computed from visible editable assumptions, and labeled as such.

## Accessibility and responsive behavior

Maintain semantic headings and form labels, visible keyboard focus, readable contrast, validation/error feedback, and layouts usable on narrow screens. Avoid relying on color alone to communicate tier or status. Recheck these behaviors when changing the UI; this document describes expectations, not a completed accessibility audit.

## Trust and privacy

Identify all sample people and lead data as fictional. Explain persistence before submission. Do not expose visitor records in public portfolio pages. The admin area reads generated demo data only; any future view of real submissions needs authentication first.
