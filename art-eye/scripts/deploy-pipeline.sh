#!/usr/bin/env bash
# Deploy the ART EYE exhibitions pipeline to your Supabase project.
# Usage: [GEMINI_API_KEY=...] ./scripts/deploy-pipeline.sh <PROJECT_REF>
# discover-exhibitions reads free JSON-LD first and falls back to Google Gemini
# for venues without it — set GEMINI_API_KEY to enable that fallback.
# The optional venue/enrichment functions use Claude — set ANTHROPIC_API_KEY too.
# Prereqs: `npm i -g supabase` and `supabase login` done once.
set -euo pipefail

REF="${1:?Usage: [GEMINI_API_KEY=...] ./scripts/deploy-pipeline.sh <PROJECT_REF>}"

echo "→ Linking project $REF"
supabase link --project-ref "$REF"

echo "→ Applying migrations (schema + exhibition pipeline)"
supabase db push

if [ -n "${GEMINI_API_KEY:-}" ]; then
  echo "→ Setting the Gemini secret (AI fallback for venues without JSON-LD)"
  supabase secrets set "GEMINI_API_KEY=$GEMINI_API_KEY"
  [ -n "${GEMINI_MODEL:-}" ] && supabase secrets set "GEMINI_MODEL=$GEMINI_MODEL"
else
  echo "→ No GEMINI_API_KEY set — JSON-LD only (AI fallback disabled)"
fi

echo "→ Deploying the exhibitions discovery function"
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
