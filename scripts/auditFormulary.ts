/**
 * Inventory audit, not a clinical validation. Reports static seeded
 * medication records and provenance coverage without treating any entry
 * as approved. Run: bun run audit:formulary
 */
import { LOCAL_DRUG_FORMULARY } from '../src/data/localDrugFormulary';
import { CLINICAL_EVIDENCE_NOTES, getClinicalEvidenceForDrug } from '../src/data/clinicalEvidence';
import { IRAN_REFERENCE_INDEX, IRAN_INDEX_PROVENANCE } from '../src/data/iranReference';
import { IRAN_MANUFACTURERS, IRAN_MARKET_PRODUCT_EXEMPLARS } from '../src/data/iranManufacturerProducts';

type Row = (typeof LOCAL_DRUG_FORMULARY)[number];

function missingFields(med: Row): string[] {
  const absent: string[] = [];
  for (const key of ['id', 'persianName', 'genericName', 'strength', 'dosageForm'] as const) {
    if (!med[key]?.trim()) absent.push(key);
  }
  for (const key of ['adultDose', 'pediatricDose', 'maxDailyDose', 'renalHepaticAdjustment'] as const) {
    if (!med.dosing?.[key]?.trim()) absent.push(`dosing.${key}`);
  }
  if (!Array.isArray(med.safety?.criticalWarnings) || med.safety.criticalWarnings.length === 0) {
    absent.push('safety.criticalWarnings');
  }
  return absent;
}

const idSet = new Set<string>();
const duplicates: string[] = [];
const incomplete: Array<{id: string; missing: string[]}> = [];
const categoryCounts: Record<string, number> = {};
const genericNames = new Set<string>();
let sourceNotes = 0;
let cachedFromAi = 0;

for (const record of LOCAL_DRUG_FORMULARY) {
  if (idSet.has(record.id)) duplicates.push(record.id);
  idSet.add(record.id);
  genericNames.add(record.genericName.toLowerCase());
  categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
  if (getClinicalEvidenceForDrug(record.genericName).length > 0) sourceNotes++;
  if (record.cachedFromAi) cachedFromAi++;
  const missing = missingFields(record);
  if (missing.length > 0) incomplete.push({ id: record.id, missing });
}

const report = {
  meaning: 'Data completeness only; NO drug dose has been approved by this audit',
  totalFormularyRecords: LOCAL_DRUG_FORMULARY.length,
  iraniManufacturerProductExamples: IRAN_MARKET_PRODUCT_EXEMPLARS.length,
  iraniManufacturerCompanies: IRAN_MANUFACTURERS.length,
  productExamplesWithoutIRC: IRAN_MARKET_PRODUCT_EXEMPLARS.filter((p) => p.registration.status === 'not-verified').length,
  productExamplesWithoutLicensedPhoto: IRAN_MARKET_PRODUCT_EXEMPLARS.filter((p) => p.packageImage.status === 'missing-authorized-image').length,
  externalProductPhotoPages: IRAN_MARKET_PRODUCT_EXEMPLARS.filter((p) => Boolean(p.externalPhotoPageUrl)).length,
  historicalIranianIndexHeadings: IRAN_REFERENCE_INDEX.length,
  historicalSourceYear: IRAN_INDEX_PROVENANCE.archiveYear,
  historicalHeadingsAreClinicalMonographs: false,
  historicalHeadingsVerifiedForCurrentMarket: IRAN_INDEX_PROVENANCE.verifiedForCurrentMarket,
  distinctGenericNamesAsSpelled: genericNames.size,
  recordsWithProvisionalSourceNotes: sourceNotes,
  totalProvisionalSourceNotes: CLINICAL_EVIDENCE_NOTES.length,
  pharmacistApprovedRecords: 0,
  categoryCounts,
  duplicateIds: duplicates,
  structurallyIncomplete: incomplete,
  staticAiCachedRecords: cachedFromAi,
};
console.log(JSON.stringify(report, null, 2));

if (IRAN_MARKET_PRODUCT_EXEMPLARS.length < 50) {
  console.error('Iran manufacturer-product pilot unexpectedly incomplete.');
  process.exitCode = 1;
}
if (IRAN_REFERENCE_INDEX.length < 790) {
  console.error('Iran historical reference index unexpectedly incomplete.');
  process.exitCode = 1;
}
if (duplicates.length || incomplete.length || cachedFromAi) {
  console.error('Formulary static catalog audit failed. Fix data issues before merge.');
  process.exitCode = 1;
}
