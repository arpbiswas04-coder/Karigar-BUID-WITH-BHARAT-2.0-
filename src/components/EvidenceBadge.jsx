import React from 'react';
import { formatEvidenceScore } from '../utils/evidenceFormat.js';

export default function EvidenceBadge({ score }) {
  if (!Number.isFinite(score)) return <span className="evidence-score-badge inline-block w-fit whitespace-nowrap rounded-md border border-outline-variant px-2 py-1 text-xs text-on-surface-variant">Evidence: Not analyzed</span>;
  const label = `KARIGAR Trust Evidence Score: ${formatEvidenceScore(score)} / 100`;
  return <span className="evidence-score-badge inline-block w-fit whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-2 py-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100" title={label} aria-label={label}>
    Evidence Score: {formatEvidenceScore(score)}
  </span>;
}
