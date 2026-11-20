import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLINICAL_EVIDENCE_NOTES,
  EVIDENCE_REFERENCES,
  getClinicalEvidenceForDrug,
  normalizeEvidenceDrugKey,
} from './clinicalEvidence';

test('references resolve and all extracted guidance stays pending human review', () => {
  assert.ok(CLINICAL_EVIDENCE_NOTES.length >= 9);
  for (const note of CLINICAL_EVIDENCE_NOTES) {
    assert.equal(note.reviewStatus, 'pending-pharmacist-review');
    assert.ok(note.clinicalSummary.trim().length > 20);
    assert.ok(note.boundaries.trim().length > 20);
    assert.ok(note.references.length > 0);
    for (const ref of note.references) {
      assert.ok(EVIDENCE_REFERENCES[ref], `Unknown citation: ${ref}`);
      assert.ok(EVIDENCE_REFERENCES[ref].location.length > 15);
    }
  }
});

test('generic variants resolve to a single ingredient record', () => {
  assert.equal(normalizeEvidenceDrugKey('Metformin HCl ER'), 'metformin');
  assert.equal(normalizeEvidenceDrugKey('Warfarin Sodium'), 'warfarin');
  assert.equal(normalizeEvidenceDrugKey('Acetaminophen (Paracetamol)'), 'acetaminophen');
  assert.equal(normalizeEvidenceDrugKey('Insulin Glargine'), 'insulin-glargine');
  assert.equal(normalizeEvidenceDrugKey('UnknownMedication'), null);
});

test('amoxicillin-clavulanate is not confused with plain amoxicillin', () => {
  const single = getClinicalEvidenceForDrug('Amoxicillin');
  const combo = getClinicalEvidenceForDrug('Amoxicillin / Clavulanate');
  assert.equal(single.length, 1);
  assert.equal(combo.length, 1);
  assert.equal(single[0].id, 'aom-amoxicillin');
  assert.equal(combo[0].id, 'aom-amoxicillin-clavulanate');
});

test('unmatched drug has no fabricated source-backed guidance', () => {
  assert.deepEqual(getClinicalEvidenceForDrug('Unknown New Molecule'), []);
  assert.ok(getClinicalEvidenceForDrug('Clopidogrel').length > 0);
  assert.ok(getClinicalEvidenceForDrug('Ibuprofen').length > 0);
});
