#!/usr/bin/env bash
# Deploy the ART EYE exhibitions pipeline to your Supabase project.
# Usage: ./scripts/deploy-pipeline.sh <PROJECT_REF>
# The exhibitions discovery function is FREE (no AI, no API key). The optional
# venue/enrichment functions use Claude — set ANTHROPIC_API_KEY to deploy those.
# Prereqs: `npm i -g supabase` and `supabase login` done once.
set -euo pipefail

REF="${1:?Usage: ./scripts/deploy-pipeline.sh <PROJECT_REF>}"

echo "→ Linking project $REF"
supabase link --project-ref "$REF"

echo "→ Applying migrations (schema + exhibition pipeline)"
supabase db push

echo "→ Deploying the free exhibitions discovery function (JSON-LD, no key needed)"
supabase functions deploy discover-exhibitions

# The functions below use Claude. Only deploy them if you've supplied a key.
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo "→ ANTHROPIC_API_KEY set — deploying the optional AI functions"
  supabase secrets set "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
  supabase functions deploy discover-venues || true
  supabase functions deploy validate-venues || true
  supabase functions deploy enrich-images || true
else
  echo "→ No ANTHROPIC_API_KEY set — skipping the optional AI functions (that's fine)"
fi

cat <<EOF

Done. Next:
  # dry run (nothing is written):
  curl "https://$REF.functions.supabase.co/discover-exhibitions?dry_run=1&limit=20"
  # for real (writes to the review queue):
  curl "https://$REF.functions.supabase.co/discover-exhibitions?limit=60"

Then review and approve — see docs/exhibitions-pipeline.md.
EOF
