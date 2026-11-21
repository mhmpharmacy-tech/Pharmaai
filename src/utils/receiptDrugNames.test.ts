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
