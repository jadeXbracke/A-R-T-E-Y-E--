#!/usr/bin/env bash
# Deploy the ART EYE exhibitions pipeline to your Supabase project.
# Usage: ANTHROPIC_API_KEY=sk-ant-... ./scripts/deploy-pipeline.sh <PROJECT_REF>
# Prereqs: `npm i -g supabase` and `supabase login` done once.
set -euo pipefail

REF="${1:?Usage: ANTHROPIC_API_KEY=... ./scripts/deploy-pipeline.sh <PROJECT_REF>}"
: "${ANTHROPIC_API_KEY:?Set ANTHROPIC_API_KEY in the environment first}"

echo "→ Linking project $REF"
supabase link --project-ref "$REF"

echo "→ Applying migrations (schema + exhibition pipeline)"
supabase db push

echo "→ Setting the Anthropic secret"
supabase secrets set "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"

echo "→ Deploying the discovery functions"
supabase functions deploy discover-exhibitions
supabase functions deploy discover-venues || true
supabase functions deploy validate-venues || true
supabase functions deploy enrich-images || true

cat <<EOF

Done. Next:
  # dry run (nothing is written):
  curl "https://$REF.functions.supabase.co/discover-exhibitions?dry_run=1&limit=20"
  # for real (writes to the review queue):
  curl "https://$REF.functions.supabase.co/discover-exhibitions?limit=60"

Then review and approve — see docs/exhibitions-pipeline.md.
EOF
