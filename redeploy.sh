#!/usr/bin/env bash
# One-command redeploy of the NUQD Digital Wealth app to GitHub Pages, pointed at
# a permanent backend. Usage:
#
#   ./redeploy.sh https://nuqd-core.onrender.com
#
# It rebuilds the static export with the backend URL baked in, then publishes
# out/ to the gh-pages branch via a git worktree (a normal fast-forward push —
# no `git push -f`, which the sandbox blocks). The critical .nojekyll file is
# always written, without which GitHub Pages' Jekyll strips _next/ and the app
# dies (stuck splash / dead buttons).
set -euo pipefail

URL="${1:-}"
if [ -z "$URL" ]; then echo "usage: ./redeploy.sh <backend-url>   e.g. https://nuqd-core.onrender.com"; exit 1; fi
URL="${URL%/}"  # strip trailing slash

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "→ building static export against $URL"
rm -rf out
PAGES=true NEXT_PUBLIC_API_BASE_URL="$URL" npm run build

echo "→ publishing out/ to gh-pages"
WT="$(mktemp -d)"
git worktree add --force "$WT" gh-pages
# wipe tracked files (keep .git), copy the fresh build in
find "$WT" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -r out/. "$WT"/
touch "$WT/.nojekyll"   # MUST exist or Jekyll strips _next/ → dead app
git -C "$WT" add -A
git -C "$WT" commit -m "deploy: point app at $URL" || { echo "(nothing changed)"; }
git -C "$WT" push origin gh-pages
git worktree remove --force "$WT"

echo "✓ deployed. Verify a chunk returns 200:"
echo "  curl -sI https://seo598.github.io/nuqd-app/_next/static/chunks/ | head -1"
echo "  then open https://seo598.github.io/nuqd-app/"
