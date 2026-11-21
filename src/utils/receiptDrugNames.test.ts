import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReceiptName, reconcileReceiptDrugText, type ReceiptTextEvidence } from './receiptDrugNames';

const observed=(line:string,name:string,strength=''):ReceiptTextEvidence=>({
  visibleLine:line,visibleDrugName:name,visibleStrength:strength,readability:'clear',
});

test('MVP: قرص دومپریدون maps to Domperidone without guessing 10mg',()=>{
  const result=reconcileReceiptDrugText(observed('قرص دومپریدون','قرص دومپریدون'));
  assert.equal(result.status,'name-candidate');
  assert.equal(result.genericName,'Domperidone');
  assert.equal(result.explicitStrength,null);
  assert.equal(result.clinicallyVerified,false);
  assert.ok(result.matchedReferenceIds.length>=1);
});

test('Persian/Arabic yeh and form words are normalized in receipt only',()=>{
  assert.equal(normalizeReceiptName('دومپريدون'),'دومپریدون');
  const result=reconcileReceiptDrugText(observed('قرص دومپريدون','دومپريدون'));
  assert.equal(result.genericName,'Domperidone');
  assert.equal(result.explicitStrength,null);
});

test('quantity of ten tablets is NOT transformed into 10mg',()=>{
  const result=reconcileReceiptDrugText(observed('دومپریدون ۱۰ عدد','دومپریدون','۱۰'));
  assert.equal(result.status,'name-candidate');
  assert.equal(result.explicitStrength,null);
});

test('explicit printed strength with unit and matching same-line text can be retained',()=>{
  const result=reconcileReceiptDrugText(observed(
    'قرص دومپریدون ۱۰ میلی گرم','دومپریدون','۱۰ میلی گرم'));
  assert.equal(result.genericName,'Domperidone');
  assert.equal(result.explicitStrength,'۱۰ میلی گرم');
});

test('strength cannot be filled from AI when it is missing on the actual receipt line',()=>{
  const result=reconcileReceiptDrugText(observed('قرص دومپریدون','دومپریدون','10 mg'));
  assert.equal(result.explicitStrength,null);
});

test('the displayed drug must appear on the same actual OCR line',()=>{
  const result=reconcileReceiptDrugText(observed('رسید داروخانه','دومپریدون'));
  assert.equal(result.status,'unreadable');
  assert.equal(result.genericName,null);
});

test('similar drug names do not merge through unsafe partial matching',()=>{
  const om=reconcileReceiptDrugText(observed('امپرازول','امپرازول'));
  const es=reconcileReceiptDrugText(observed('اس امپرازول','اس امپرازول'));
  assert.ok(om.status==='name-candidate'||om.status==='historical-only');
  assert.ok(es.status==='name-candidate'||es.status==='historical-only');
  if(om.genericName&&es.genericName)assert.notEqual(normalizeReceiptName(om.genericName),normalizeReceiptName(es.genericName));
});

test('unrecognized text does not invent a generic or dosage',()=>{
  const result=reconcileReceiptDrugText(observed('داروی ناشناخته بزرتپ۱','بزرتپ۱'));
  assert.equal(result.status,'not-found');
  assert.equal(result.genericName,null);
  assert.equal(result.explicitStrength,null);
});

test('poor quality receipt text is not promoted to a product identity',()=>{
  const result=reconcileReceiptDrugText({...observed('قرص دومپریدون','دومپریدون'),readability:'unreadable'});
  assert.equal(result.status,'unreadable');
  assert.equal(result.genericName,null);
});

test('hallucinated regimen and dosage form are never accepted from a receipt line', () => {
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص دومپریدون 10 mg',
    visibleDrugName:'دومپریدون',
    visibleStrength:'10 mg',
    visibleDosageForm:'آمپول',
    visibleRegimen:'هر ۸ ساعت بعد غذا',
    readability:'clear',
  });
  assert.equal(result.visibleDosageForm,null);
  assert.equal(result.visibleRegimen,null);
  assert.equal(result.explicitStrength,'10 mg');
});
test('literal regimen and form from the same printed line are allowed as unverified OCR', () => {
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص دومپریدون 10 mg هر ۸ ساعت',
    visibleDrugName:'دومپریدون',
    visibleStrength:'10 mg',
    visibleDosageForm:'قرص',
    visibleRegimen:'هر ۸ ساعت',
    readability:'clear',
  });
  assert.equal(result.visibleDosageForm,'قرص');
  assert.equal(result.visibleRegimen,'هر ۸ ساعت');
  assert.equal(result.clinicallyVerified,false);
});
test('strength may not match as a substring of a larger numeric dose', () => {
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص دومپریدون 11 mg',
    visibleDrugName:'دومپریدون',
    visibleStrength:'1 mg',
    readability:'clear',
  });
  assert.equal(result.explicitStrength,null);
});
test('unreadable receipt cannot retain dosing fragments', () => {
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص دومپریدون 10 mg هر ۸ ساعت',
    visibleDrugName:'دومپریدون',
    visibleStrength:'10 mg',
    visibleDosageForm:'قرص',
    visibleRegimen:'هر ۸ ساعت',
    readability:'unreadable',
  });
  assert.equal(result.explicitStrength,null);
  assert.equal(result.visibleRegimen,null);
  assert.equal(result.visibleDosageForm,null);
});

test('mismatched drug name invalidates all extracted dose and directions',()=>{
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص متفورمین 500 mg هر ۸ ساعت',
    visibleDrugName:'دومپریدون',
    visibleStrength:'500 mg',
    visibleDosageForm:'قرص',
    visibleRegimen:'هر ۸ ساعت',
    readability:'clear',
  });
  assert.equal(result.status,'unreadable');
  assert.equal(result.explicitStrength,null);
  assert.equal(result.visibleDosageForm,null);
  assert.equal(result.visibleRegimen,null);
});
test('regimen numbers cannot be substrings of different quantities',()=>{
  const result=reconcileReceiptDrugText({
    visibleLine:'قرص دومپریدون هر ۱۱ ساعت',
    visibleDrugName:'دومپریدون',
    visibleRegimen:'هر ۱ ساعت',
    readability:'clear',
  });
  assert.equal(result.visibleRegimen,null);
});
