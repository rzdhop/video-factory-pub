#!/usr/bin/env bash
# Send a file to a resumable upload session (for example a cloud-drive upload), see docs/CONNECTORS.md.
#   tools/drive_put.sh <file> '<session url>' [mime type]
# The session url is the `location` header returned by the call that opens the upload session.
# Nothing here is tied to an account: the session url carries the authorisation.
set -euo pipefail
file="${1:?file}"; url="${2:?session url}"; mime="${3:-video/mp4}"
[ -f "$file" ] || { echo "no such file: $file" >&2; exit 1; }
curl -sS -m 900 -X PUT -H "Content-Type: $mime" --upload-file "$file" "$url" -w '\nHTTP %{http_code}\n'
