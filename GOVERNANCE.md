# Governance

Kitland is maintained in the open. This document records who can make project
decisions, how contributors can earn responsibility, and how releases are
approved.

## Roles

- **Contributors** open issues, improve code or documentation, and participate
  in technical discussion.
- **Maintainers** review and merge changes, triage reports, steward documented
  contracts, and approve releases. The current maintainer is
  [@outof0](https://github.com/outof0).
- **Security and release owner** is the current maintainer until another owner
  is explicitly recorded in `CODEOWNERS` and this document.

Repository permissions, not authorship of an individual file, determine who may
merge or publish. A maintainer does not approve their own security-sensitive
capability expansion without recording the risk review in the pull request.

## Decisions

Routine, reversible changes use pull-request review and lazy consensus. Allow at
least three business days for material community feedback when practical.

An ADR is required before changing a public route or package contract, adding a
remote service, broadening a browser/extension permission, introducing payload
persistence or telemetry, or changing the local-first privacy boundary.
Security fixes may merge privately or on an accelerated timeline and are
documented after coordinated disclosure.

When consensus cannot be reached, the maintainer decides and records the
rationale and dissenting trade-offs. Decisions can be revisited with new
evidence.

## Becoming a maintainer

A contributor may be invited after sustained, constructive work that shows
sound review judgment, respect for privacy/security boundaries, reliable follow
through, and familiarity with the release process. The change must update this
document and `CODEOWNERS` in the same pull request.

Maintainers may step down at any time. After six months without project activity
or a response to private contact, active maintainers may document a succession
decision. Project trademarks, package ownership, deployment credentials, and
security-report access must be transferred deliberately rather than inferred
from source contributions.

## Releases and security

The release owner follows [RELEASING.md](RELEASING.md), verifies the protected
CI artifact, and owns rollback communication. Vulnerabilities follow
[SECURITY.md](SECURITY.md); conduct concerns follow
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
