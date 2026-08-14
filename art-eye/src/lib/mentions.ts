// @mentions in comments are stored as `@[Display Name](userId)` tokens rather
// than plain "@Bob Block" text — display names contain spaces, so a plain
// "@" trigger can't be parsed back out unambiguously. The composer inserts
// the token when you tap a suggestion; renderers turn it back into a tappable
// name via parseMentionSegments.

const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function insertMention(text: string, displayName: string, userId: string): string {
  const trimmed = text.replace(/@$/, ''); // drop the trailing "@" that triggered the picker
  const sep = trimmed.length > 0 && !trimmed.endsWith(' ') ? ' ' : '';
  return `${trimmed}${sep}@[${displayName}](${userId}) `;
}

export function extractMentionIds(text: string): string[] {
  const ids = new Set<string>();
  for (const m of text.matchAll(MENTION_RE)) ids.add(m[2]);
  return [...ids];
}

export type MentionSegment =
  | { type: 'text'; content: string }
  | { type: 'mention'; content: string; userId: string };

export function parseMentionSegments(text: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ type: 'text', content: text.slice(last, idx) });
    segments.push({ type: 'mention', content: m[1], userId: m[2] });
    last = idx + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) });
  return segments;
}
