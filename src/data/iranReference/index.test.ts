import test from 'node:test';
import assert from 'node:assert/strict';
import { IRAN_REFERENCE_INDEX, IRAN_INDEX_PROVENANCE } from './index';
import { normalizeSearchText } from '../../utils/localDrugSearch';

test('historical source contains the expected number of deduplicated reference headings', () => {
  assert.equal(IRAN_REFERENCE_INDEX.length, 809);
  assert.equal(IRAN_INDEX_PROVENANCE.archiveYear, 2008);
  assert.equal(IRAN_INDEX_PROVENANCE.verifiedForCurrentMarket, false);
  assert.equal(IRAN_INDEX_PROVENANCE.approvedClinicalMonographs, 0);
});

test('each historical entry preserves traceability and cannot imply verified dosing', () => {
  const seen = new Set<string>();
  for (const item of IRAN_REFERENCE_INDEX) {
    assert.ok(item.heading.length >= 5);
    assert.ok(item.sourcePdfPage >= 23 && item.sourcePdfPage <= 997);
    assert.equal(item.sourceStatus, 'historical-index-unverified');
    assert.equal('dosing' in item, false);
    assert.equal('safety' in item, false);
    assert.equal('prescribedRegimen' in item, false);
    assert.ok(!seen.has(item.id));
    seen.add(item.id);
  }
});

test('historical Persian and English names remain searchable, without clinical promotion', () => {
  function search(query: string) {
    const words = normalizeSearchText(query).split(' ').filter(Boolean);
    return IRAN_REFERENCE_INDEX.filter((item) => {
      const normalized = normalizeSearchText(item.heading);
      return words.every((word) => normalized.includes(word));
    });
  }
  assert.ok(search('ایبوپروفن').some((x) => x.heading.includes('Ibuprofen')));
  assert.ok(search('metformine').some((x) => x.sourcePdfPage === 654));
  assert.ok(search('آکاربوز').some((x) => x.sourcePdfPage === 25));
  assert.equal(search('not-a-real-drug-here').length, 0);
});
