import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCounselingText,
  evaluateLocalInteractions,
  filterInteractionsBySeverity,
  formatPersianDigits,
  getInteractionsForMedication,
  mergeInteractions,
  mergeScannedMedications,
  normalizeDrugName,
  parseScanHistory,
  summarizePrescriptionRisk,
  updateMedicationDosingSchedule,
  validateCustomDosingSchedule,
  validateManualDrugInput,
} from './pharmacyLogic';
import type { DrugInteraction, MedicationItem } from '../types/pharmacy';

function makeMed(overrides: Partial<MedicationItem>): MedicationItem {
  return {
    id: overrides.id ?? 'med-1',
    persianName: overrides.persianName ?? 'داروی نمونه',
    genericName: overrides.genericName ?? 'SampleDrug',
    strength: overrides.strength ?? '500 mg',
    dosageForm: overrides.dosageForm ?? 'قرص',
    therapeuticClass: overrides.therapeuticClass ?? 'عمومی',
    sourceType: overrides.sourceType ?? 'prescription',
    dosing: overrides.dosing ?? {
      adultDose: '۵۰۰ میلی‌گرم روزانه',
      pediatricDose: 'بر اساس وزن',
      maxDailyDose: '۱۰۰۰ میلی‌گرم',
      renalHepaticAdjustment: 'نیاز به پایش در GFR کمتر از ۳۰',
    },
    safety: overrides.safety ?? {
      criticalWarnings: ['هشدار نمونه'],
      pregnancyLactation: 'با مشورت پزشک',
      commonSideEffects: ['تهوع خفیف'],
      monitoring: ['CBC'],
      highAlert: false,
    },
    usage: overrides.usage ?? {
      withFood: 'با غذا',
      timing: 'صبح',
      dosageFormsAndVariations: ['قرص ۵۰۰ میلی‌گرم'],
      patientCounseling: ['دوره درمان را کامل کنید'],
      missedDose: 'به محض یادآوری مصرف شود',
    },
  };
}

test('normalizeDrugName strips punctuation and normalizes whitespace', () => {
  assert.equal(normalizeDrugName('  Atorvastatin-20mg!! '), 'atorvastatin 20mg');
  assert.equal(normalizeDrugName('آتورواستاتین\u200c۲۰'), 'آتورواستاتین ۲۰');
});

test('mergeScannedMedications deduplicates identical drug + strength while keeping prescribed regimen', () => {
  const existing = [
    makeMed({
      id: 'existing-1',
      persianName: 'آتورواستاتین',
      genericName: 'Atorvastatin',
      strength: '20 mg',
      dosing: {
        adultDose: '۱۰ تا ۸۰ میلی‌گرم',
        pediatricDose: '۱۰ میلی‌گرم',
        maxDailyDose: '۸۰ میلی‌گرم',
        renalHepaticAdjustment: 'ممنوع در بیماری فعال کبدی',
        prescribedRegimen: 'شبی یک عدد',
      },
    }),
  ];

  const incoming = [
    makeMed({
      id: 'new-1',
      persianName: 'آتورواستاتین',
      genericName: 'Atorvastatin',
      strength: '20 mg',
      sourceType: 'box',
    }),
    makeMed({
      id: 'new-2',
      persianName: 'آزیترومایسین',
      genericName: 'Azithromycin',
      strength: '500 mg',
      sourceType: 'box',
    }),
  ];

  const merged = mergeScannedMedications(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'existing-1');
  assert.equal(merged[0].dosing.prescribedRegimen, 'شبی یک عدد');
  assert.equal(merged[1].genericName, 'Azithromycin');
});

test('evaluateLocalInteractions detects major Warfarin + Aspirin and moderate Warfarin + Omeprazole', () => {
  const warfarin = makeMed({
    id: 'w1',
    persianName: 'وارفارین',
    genericName: 'Warfarin',
    strength: '5 mg',
    safety: {
      criticalWarnings: ['خطر خونریزی'],
      pregnancyLactation: 'منع مصرف در بارداری',
      commonSideEffects: ['کبودی'],
      monitoring: ['INR'],
      highAlert: true,
    },
  });
  const aspirin = makeMed({
    id: 'a1',
    persianName: 'آسپرین',
    genericName: 'Aspirin',
    strength: '80 mg',
  });
  const omeprazole = makeMed({
    id: 'o1',
    persianName: 'امپرازول',
    genericName: 'Omeprazole',
    strength: '20 mg',
  });

  const ibuprofen = makeMed({
    id: 'i1',
    persianName: 'ایبوپروفن',
    genericName: 'Ibuprofen',
    strength: '400 mg',
  });

  const interactions = evaluateLocalInteractions([warfarin, aspirin, omeprazole, ibuprofen]);
  assert.equal(interactions.length, 4);
  assert.equal(interactions[0].severity, 'major');
  const warfarinNsaid = interactions.find(
    (item) => item.drugA.includes('Warfarin') && item.drugB.includes('Ibuprofen')
  );
  assert.ok(warfarinNsaid, 'Expected Warfarin + Ibuprofen interaction');
  assert.ok(warfarinNsaid.management.includes('استامینوفن'), 'Expected NSAID-specific acetaminophen alternative guidance');

  const summary = summarizePrescriptionRisk([warfarin, aspirin, omeprazole, ibuprofen], interactions);
  assert.equal(summary.totalMedications, 4);
  assert.equal(summary.majorCount, 3);
  assert.equal(summary.moderateCount, 1);
  assert.equal(summary.highAlertCount, 1);
  assert.equal(summary.overallLevel, 'critical');
});

test('mergeInteractions keeps highest severity when AI and local rules report same pair', () => {
  const localItem: DrugInteraction = {
    id: 'local-1',
    drugA: 'کلوپیدوگرل (Clopidogrel)',
    drugB: 'امپرازول (Omeprazole)',
    severity: 'major',
    mechanism: 'مهار CYP2C19',
    clinicalEffect: 'کاهش اثر ضدپلاکتی',
    management: 'جایگزینی با پنتوپرازول',
    source: 'clinical-rule',
  };

  const aiItem: DrugInteraction = {
    id: 'ai-1',
    drugA: 'کلوپیدوگرل',
    drugB: 'امپرازول',
    severity: 'moderate',
    mechanism: 'مهار آنزیمی',
    clinicalEffect: 'اثر کمتر',
    management: 'پایش بیمار',
    source: 'ai',
  };

  const merged = mergeInteractions([aiItem], [localItem]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].severity, 'major');
});

test('filterInteractionsBySeverity and getInteractionsForMedication filter accurately', () => {
  const interactions: DrugInteraction[] = [
    {
      id: '1',
      drugA: 'وارفارین (Warfarin)',
      drugB: 'ایبوپروفن (Ibuprofen)',
      severity: 'major',
      mechanism: 'خونریزی',
      clinicalEffect: 'افزایش INR',
      management: 'پرهیز از مصرف همزمان',
    },
    {
      id: '2',
      drugA: 'آتورواستاتین (Atorvastatin)',
      drugB: 'آزیترومایسین (Azithromycin)',
      severity: 'moderate',
      mechanism: 'میوپاتی',
      clinicalEffect: 'درد عضلانی',
      management: 'پایش علائم عضلانی',
    },
  ];

  assert.equal(filterInteractionsBySeverity(interactions, 'major').length, 1);
  assert.equal(filterInteractionsBySeverity(interactions, 'minor').length, 0);
  assert.equal(filterInteractionsBySeverity(interactions, 'all').length, 2);

  const atorva = makeMed({ persianName: 'آتورواستاتین', genericName: 'Atorvastatin' });
  const related = getInteractionsForMedication(atorva, interactions);
  assert.equal(related.length, 1);
  assert.equal(related[0].id, '2');
});

test('validateManualDrugInput rejects empty and overly short queries', () => {
  assert.equal(validateManualDrugInput('   ').valid, false);
  assert.equal(validateManualDrugInput('a').valid, false);
  assert.equal(validateManualDrugInput('آموکسی‌سیلین ۵۰۰').valid, true);
});

test('formatPersianDigits and buildCounselingText produce Persian counseling sheet', () => {
  assert.equal(formatPersianDigits('500 mg'), '۵۰۰ mg');
  const med = makeMed({ persianName: 'متفورمین', genericName: 'Metformin', strength: '500 mg' });
  const text = buildCounselingText([med], []);
  assert.ok(text.includes('متفورمین'));
  assert.ok(text.includes('برگه راهنمای مصرف'));
});

test('parseScanHistory safely ignores malformed JSON', () => {
  assert.deepEqual(parseScanHistory('{invalid-json'), []);
  assert.deepEqual(parseScanHistory(null), []);
});

test('updateMedicationDosingSchedule updates, clears, preserves on merge, and includes schedule in counseling text', () => {
  const med1 = makeMed({ id: 'm1', persianName: 'آموکسی‌سیلین', genericName: 'Amoxicillin', strength: '500 mg' });
  const med2 = makeMed({ id: 'm2', persianName: 'ایبوپروفن', genericName: 'Ibuprofen', strength: '400 mg' });

  const updated = updateMedicationDosingSchedule([med1, med2], 'm1', '  هر ۸ ساعت   ۱ کپسول  ');
  assert.equal(updated[0].customDosingSchedule, 'هر ۸ ساعت ۱ کپسول');
  assert.equal(updated[1].customDosingSchedule, undefined);

  // Preserved when rescanning same drug without a custom schedule
  const merged = mergeScannedMedications(updated, [
    makeMed({ id: 'm1-rescan', persianName: 'آموکسی‌سیلین', genericName: 'Amoxicillin', strength: '500 mg' }),
  ]);
  assert.equal(merged[0].customDosingSchedule, 'هر ۸ ساعت ۱ کپسول');

  // Appears in patient counseling text
  const counseling = buildCounselingText(updated, []);
  assert.ok(counseling.includes('برنامه مصرف روزانه'));
  assert.ok(counseling.includes('هر ۸ ساعت ۱ کپسول'));

  // Clearing with blank whitespace removes customDosingSchedule
  const cleared = updateMedicationDosingSchedule(updated, 'm1', '   ');
  assert.equal(cleared[0].customDosingSchedule, undefined);

  // Overly long schedule fails validation
  const tooLong = validateCustomDosingSchedule('a'.repeat(121));
  assert.equal(tooLong.valid, false);
});

test('evaluateLocalInteractions detects newly added clinical rules across expanded formulary', () => {
  const rivaroxaban = makeMed({ id: 'r1', persianName: 'ریواروکسابان', genericName: 'Rivaroxaban', strength: '15 mg' });
  const ibuprofen = makeMed({ id: 'i2', persianName: 'ایبوپروفن', genericName: 'Ibuprofen', strength: '400 mg' });
  const doacRule = evaluateLocalInteractions([rivaroxaban, ibuprofen]);
  assert.equal(doacRule.length, 1);
  assert.equal(doacRule[0].severity, 'major');

  const levo = makeMed({ id: 'l1', persianName: 'لووتیروکسین سدیم', genericName: 'Levothyroxine Sodium', strength: '50 mcg' });
  const iron = makeMed({ id: 'f1', persianName: 'فروس سولفات', genericName: 'Ferrous Sulfate', strength: '325 mg' });
  const levoRule = evaluateLocalInteractions([levo, iron]);
  assert.equal(levoRule.length, 1);
  assert.equal(levoRule[0].severity, 'moderate');

  const iso = makeMed({ id: 'iso1', persianName: 'ایزوترتینوئین', genericName: 'Isotretinoin', strength: '20 mg' });
  const doxy = makeMed({ id: 'doxy1', persianName: 'داکسی‌سایکلین', genericName: 'Doxycycline', strength: '100 mg' });
  const isoRule = evaluateLocalInteractions([iso, doxy]);
  assert.equal(isoRule.length, 1);
  assert.equal(isoRule[0].severity, 'major');

  const alp = makeMed({ id: 'alp1', persianName: 'آلپرازولام', genericName: 'Alprazolam', strength: '0.5 mg' });
  const tram = makeMed({ id: 'tram1', persianName: 'ترامادول', genericName: 'Tramadol', strength: '50 mg' });
  const cnsRule = evaluateLocalInteractions([alp, tram]);
  assert.equal(cnsRule.length, 1);
  assert.equal(cnsRule[0].severity, 'major');
});



test('limited interaction screening never claims a prescription is clinically safe', () => {
  const a = makeMed({ id: 'one', genericName: 'UnknownMedicineA' });
  const b = makeMed({ id: 'two', genericName: 'UnknownMedicineB' });
  const interactions = evaluateLocalInteractions([a, b]);
  assert.equal(interactions.length, 0);
  const summary = summarizePrescriptionRisk([a, b], interactions);
  assert.equal(summary.overallLevel, 'unverified');
  assert.match(buildCounselingText([a, b], interactions), /ناقص/);
});

test('ingredient matching excludes substrings that could fabricate a drug interaction', () => {
  const a = makeMed({ id: 'one', persianName: 'DrugA', genericName: 'WarfarinlikeCompound' });
  const b = makeMed({ id: 'two', persianName: 'DrugB', genericName: 'AspirinlikeCompound' });
  assert.equal(evaluateLocalInteractions([a, b]).length, 0);
});

test('warfarin sodium and aspirin still match the core clinical rule', () => {
  const a = makeMed({ id: 'one', persianName: 'وارفارین', genericName: 'Warfarin Sodium' });
  const b = makeMed({ id: 'two', persianName: 'آسپرین', genericName: 'Aspirin' });
  assert.ok(evaluateLocalInteractions([a, b]).some((x) => x.severity === 'major'));
});

test('macrolide-statin safety distinguishes clarithromycin from azithromycin', () => {
  const simva = makeMed({ id: 's', genericName: 'Simvastatin', persianName: 'سیمواستاتین' });
  const clarithro = makeMed({ id: 'c', genericName: 'Clarithromycin', persianName: 'کلاریترومایسین' });
  const azithro = makeMed({ id: 'a', genericName: 'Azithromycin', persianName: 'آزیترومایسین' });
  assert.ok(evaluateLocalInteractions([simva, clarithro]).some((x) => x.severity === 'major'));
  assert.equal(evaluateLocalInteractions([simva, azithro]).length, 0);
});

test('routine aspirin plus atorvastatin does not generate a fabricated minor interaction', () => {
  const asa = makeMed({ id: 'a', genericName: 'Aspirin', persianName: 'آسپرین' });
  const atorva = makeMed({ id: 's', genericName: 'Atorvastatin', persianName: 'آتورواستاتین' });
  assert.equal(evaluateLocalInteractions([asa, atorva]).length, 0);
});
