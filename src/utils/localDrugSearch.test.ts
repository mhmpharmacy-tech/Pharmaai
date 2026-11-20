import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMULARY_CATEGORIES, LOCAL_DRUG_FORMULARY } from '../data/localDrugFormulary';
import {
  countFormularyByCategory,
  findBestLocalDrugMatch,
  inferCategoryFromClass,
  normalizeSearchText,
  searchLocalFormulary,
} from './localDrugSearch';

test('LOCAL_DRUG_FORMULARY contains a comprehensive catalog (130+ unique clinical drugs) across all 8 categories', () => {
  assert.ok(
    LOCAL_DRUG_FORMULARY.length >= 130,
    `Expected at least 130 seeded drugs, got ${LOCAL_DRUG_FORMULARY.length}`
  );

  const ids = new Set<string>();
  const counts = countFormularyByCategory(LOCAL_DRUG_FORMULARY);
  assert.equal(counts.all, LOCAL_DRUG_FORMULARY.length);

  for (const cat of FORMULARY_CATEGORIES) {
    if (cat.id === 'all') continue;
    assert.ok(
      counts[cat.id] >= 10,
      `Expected at least 10 drugs in category ${cat.id}, got ${counts[cat.id]}`
    );
  }

  for (const med of LOCAL_DRUG_FORMULARY) {
    assert.ok(!ids.has(med.id), `Duplicate drug id: ${med.id}`);
    ids.add(med.id);
    assert.ok(med.persianName.trim().length > 0);
    assert.ok(med.genericName.trim().length > 0);
    assert.ok(med.dosing.adultDose.trim().length > 0);
    assert.ok(med.safety.criticalWarnings.length > 0);
    assert.ok(med.usage.dosageFormsAndVariations.length > 0);
  }
});

test('normalizeSearchText unifies Arabic/Persian letters and Persian digits', () => {
  assert.equal(normalizeSearchText('كلاريترومايسين ۵۰۰'), 'کلاریترومایسین 500');
  assert.equal(normalizeSearchText('  Atorvastatin-20mg '), 'atorvastatin 20mg');
});

test('searchLocalFormulary finds both original and newly added drugs by generic, Persian, brand, and strength', () => {
  const byGeneric = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'clopidog');
  assert.equal(byGeneric.length, 1);
  assert.equal(byGeneric[0].genericName, 'Clopidogrel');

  const byBrand = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'پلاویکس');
  assert.equal(byBrand[0].genericName, 'Clopidogrel');

  const byPersianWithStrength = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'سیپروفلوکساسین ۵۰۰');
  assert.equal(byPersianWithStrength.length, 1);
  assert.equal(byPersianWithStrength[0].genericName, 'Ciprofloxacin');

  const doac = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'زارلتو');
  assert.equal(doac[0]?.genericName, 'Rivaroxaban');

  const insulin = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'لانتوس');
  assert.equal(insulin[0]?.genericName, 'Insulin Glargine');

  const inhaler = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'سیمبیکورت');
  assert.equal(inhaler[0]?.genericName, 'Budesonide / Formoterol');

  const retinoid = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'روآکوتان');
  assert.equal(retinoid[0]?.genericName, 'Isotretinoin');
});

test('searchLocalFormulary filters cleanly by therapeutic category and high-alert flag', () => {
  const antibiotics = searchLocalFormulary(LOCAL_DRUG_FORMULARY, '', 'antibiotic');
  assert.ok(antibiotics.length >= 20);
  assert.ok(antibiotics.every((d) => d.category === 'antibiotic'));

  const cardioSearch = searchLocalFormulary(LOCAL_DRUG_FORMULARY, 'warfarin', 'antibiotic');
  assert.equal(cardioSearch.length, 0);

  const highAlertAll = searchLocalFormulary(LOCAL_DRUG_FORMULARY, '', 'all', undefined, true);
  assert.ok(highAlertAll.length >= 15);
  assert.ok(highAlertAll.every((d) => d.safety.highAlert === true));
});

test('findBestLocalDrugMatch returns exact/strong match and null for unknown drugs', () => {
  const match = findBestLocalDrugMatch(LOCAL_DRUG_FORMULARY, 'پنتوپرازول ۴۰');
  assert.ok(match);
  assert.equal(match.genericName, 'Pantoprazole');

  const newMatch = findBestLocalDrugMatch(LOCAL_DRUG_FORMULARY, 'تامسولوسین');
  assert.ok(newMatch);
  assert.equal(newMatch.genericName, 'Tamsulosin');

  const miss = findBestLocalDrugMatch(LOCAL_DRUG_FORMULARY, 'UnknownExperimentalDrug999');
  assert.equal(miss, null);
});

test('inferCategoryFromClass categorizes Persian therapeutic classes accurately across all 8 categories', () => {
  assert.equal(inferCategoryFromClass('آنتی‌بیوتیک ماکرولید'), 'antibiotic');
  assert.equal(inferCategoryFromClass('ضد فشار خون (ARB)'), 'cardio');
  assert.equal(inferCategoryFromClass('مهارکننده پمپ پروتون (PPI)'), 'gi');
  assert.equal(inferCategoryFromClass('ضد دیابت خوراکی'), 'endocrine');
  assert.equal(inferCategoryFromClass('گشادکننده سریع برونش (آسم)'), 'respiratory_allergy');
  assert.equal(inferCategoryFromClass('آلفابلوکر انتخابی پروستات'), 'urology_derm_eye');
  assert.equal(inferCategoryFromClass('ضدافسردگی و ضداضطراب (SSRI)'), 'neuro_psych');
});
