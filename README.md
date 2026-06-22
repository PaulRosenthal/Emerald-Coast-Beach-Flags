# Emerald-Coast-Beach-Flags

This repository tracks beach flag statuses for areas across Northwest Florida.

## Current status

- `current-flag-status/south-walton` contains the South Walton beach flag retrieval workflow.
- A GitHub Actions workflow runs on push, schedule, and manual dispatch to update `flag-status/south-walton.txt`.

## Future expansion

- Additional locations will be added as separate subdirectories under `current-flag-status`.
- Each location will include its own retrieval script, package manifest, and workflow configuration.
- Retrieved status files will be written into the `flag-status` directory for easy access.
