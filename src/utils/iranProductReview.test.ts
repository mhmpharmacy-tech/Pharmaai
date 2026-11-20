import test from 'node:test';
import assert from 'node:assert/strict';
import { DAROOYAB_PUBLIC_PRODUCT_FACTS, DAROOYAB_GENERIC_REFERENCE_LINKS } from '../data/darooyabPublicFacts';
import {
  IRAN_EDITABLE_REVIEW_SEEDS, newReviewDraft, sanitizeReviewDraft,
  resolvedIranReviewField, validateIranReviewDraft,
  readIranProductReviewDrafts, exportIranReviewSnapshot,
} from './iranProductReview';
import { validMedicinePhotoBytes } from './iranProductPhotoStore';

test('only directly inspected source-linked identity facts are seeded; unknown fields stay null',()=>{
  assert.equal(DAROOYAB_PUBLIC_PRODUCT_FACTS.length,25);
  assert.equal(DAROOYAB_GENERIC_REFERENCE_LINKS.length,25);
  assert.equal(IRAN_EDITABLE_REVIEW_SEEDS.length,79);
  const ids=new Set<string>();
  const pages=new Set<string>();
  for(const p of DAROOYAB_PUBLIC_PRODUCT_FACTS){
    assert.ok(p.sourceUrl.startsWith('https://www.darooyab.ir/B-'));
    assert.ok(!pages.has(p.sourceUrl));
    pages.add(p.sourceUrl);
    assert.ok(p.brand&&p.manufacturer);
    assert.equal(p.irc,null);
    assert.equal(p.gtin,null);
    assert.equal(p.officialPriceRial,null);
    assert.equal(p.authorizedImagePath,null);
    assert.equal(p.currentRegistration,null);
  }
  for(const p of IRAN_EDITABLE_REVIEW_SEEDS){
    assert.ok(!ids.has(p.id));
    ids.add(p.id);
    assert.ok(p.sourceUrl.startsWith('https://'));
  }
});

test('a contradictory product source ingredient stays empty pending pharmacist research',()=>{
  const untrusted=IRAN_EDITABLE_REVIEW_SEEDS.find(p=>p.id==='darooyab:novothirteen');
  assert.ok(untrusted);
  assert.equal(untrusted.ingredient,null);
  assert.ok(untrusted.integrityWarning);
  const unfilled=newReviewDraft();
  assert.equal(resolvedIranReviewField(untrusted,unfilled,'ingredient'),null);
  assert.ok(validateIranReviewDraft(untrusted,{...unfilled,pharmacistIdentityChecked:true}).length>0);
});

test('source values are immutable and source/overlay values remain separate',()=>{
  const product=IRAN_EDITABLE_REVIEW_SEEDS.find(p=>p.id==='darooyab:kepatemp-125')!;
  assert.equal(product.strength,'125 mg/5 mL');
  const corrected=sanitizeReviewDraft({strength:'125 mg/5 mL',pharmacyNote:'بازبینی روی بسته واقعی'});
  assert.equal(resolvedIranReviewField(product,corrected,'strength'),'125 mg/5 mL');
  assert.equal(product.strength,'125 mg/5 mL');
  assert.equal(corrected.irc,null);
});

test('invalid IRC, GTIN and unsupported price never pass the optional identity review',()=>{
  const p=IRAN_EDITABLE_REVIEW_SEEDS[0];
  const broken=sanitizeReviewDraft({
    irc:'1234',gtin:'12345671',officialPriceRial:'۱۲۳.۴',
    officialPriceCheckedAt:'',pharmacistIdentityChecked:true,
  });
  const issues=validateIranReviewDraft(p,broken);
  assert.ok(issues.length>=3);
  const clean=sanitizeReviewDraft({
    irc:'۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶',gtin:'12345670',
    officialPriceRial:'150000',officialPriceCheckedAt:'2026-11-20',
    pharmacistIdentityChecked:true,
  });
  assert.equal(clean.irc,'1234567890123456');
  assert.deepEqual(validateIranReviewDraft(p,clean),[]);
});

test('corrupt local metadata cannot forge new source products or approvals',()=>{
  const recovered=readIranProductReviewDrafts(JSON.stringify({
    'not-in-source':{pharmacistIdentityChecked:true},
    [IRAN_EDITABLE_REVIEW_SEEDS[0].id]:{irc:'',pharmacistIdentityChecked:'true',ingredient:'ignored?'},
  }));
  assert.equal('not-in-source' in recovered,false);
  assert.equal(recovered[IRAN_EDITABLE_REVIEW_SEEDS[0].id].pharmacistIdentityChecked,false);
  assert.deepEqual(readIranProductReviewDrafts('not-json'),{});
  const snapshot=exportIranReviewSnapshot(recovered);
  assert.equal(snapshot.sourceProductCount,79);
  assert.equal(snapshot.officialRegistrationVerifiedByThisExport,false);
  assert.equal(snapshot.visualModelTrainedOnPhotos,false);
  assert.equal(snapshot.imageBlobsIncluded,false);
  assert.equal(snapshot.records.length,79);
});

test('photo file signatures are checked before saving user-captured images locally',()=>{
  const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3]);
  const jpg=new Uint8Array([255,216,255,1,2]);
  const webp=new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80,1]);
  assert.equal(validMedicinePhotoBytes(png,'image/png'),true);
  assert.equal(validMedicinePhotoBytes(jpg,'image/jpeg'),true);
  assert.equal(validMedicinePhotoBytes(webp,'image/webp'),true);
  assert.equal(validMedicinePhotoBytes(png,'image/jpeg'),false);
  assert.equal(validMedicinePhotoBytes(new Uint8Array(1),'image/png'),false);
});
