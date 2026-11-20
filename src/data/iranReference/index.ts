import { IRAN_INDEX_PART_1 } from './part1';
import { IRAN_INDEX_PART_2 } from './part2';
import { IRAN_INDEX_PART_3 } from './part3';
import { IRAN_INDEX_PART_4 } from './part4';
import { IRAN_INDEX_PART_5 } from './part5';
import { IRAN_INDEX_PART_6 } from './part6';
import { IRAN_INDEX_PART_7 } from './part7';
import { IRAN_INDEX_PART_8 } from './part8';

/**
 * Reference-only index derived from the user-provided Persian generic-drugs
 * PDF whose creation metadata dates to 2008.
 *
 * Indexing a heading is NOT proof of Iranian market authorization today,
 * availability, contemporary formulation, efficacy, dosing or safety.
 * The underlying book is not reproduced or distributed here.
 */
export interface IranReferenceEntry {
  id: string;
  heading: string;
  sourcePdfPage: number;
  sourceStatus: 'historical-index-unverified';
}

const SOURCE_ROWS: ReadonlyArray<readonly [string, number]> = [
  ...IRAN_INDEX_PART_1,
  ...IRAN_INDEX_PART_2,
  ...IRAN_INDEX_PART_3,
  ...IRAN_INDEX_PART_4,
  ...IRAN_INDEX_PART_5,
  ...IRAN_INDEX_PART_6,
  ...IRAN_INDEX_PART_7,
  ...IRAN_INDEX_PART_8,
];

const unique = new Map<string, IranReferenceEntry>();
for (const [heading, sourcePdfPage] of SOURCE_ROWS) {
  // Prevent repeated page-boundary extracts; retain distinct formulations.
  const normalized = heading.normalize('NFKC').toLowerCase().replace(/[\s()،,.]+/g, '');
  const key = `${sourcePdfPage}:${normalized}`;
  if (unique.has(key)) continue;
  unique.set(key, {
    id: `iran-legacy-${sourcePdfPage}-${unique.size + 1}`,
    heading,
    sourcePdfPage,
    sourceStatus: 'historical-index-unverified',
  });
}
export const IRAN_REFERENCE_INDEX: IranReferenceEntry[] = [...unique.values()];

export const IRAN_INDEX_PROVENANCE = {
  description: 'داروهای ژنریک ایران — مدخل‌های استخراج‌شده از PDF ارسالی',
  archiveYear: 2008,
  filePages: 1007,
  verifiedForCurrentMarket: false,
  approvedClinicalMonographs: 0,
} as const;
