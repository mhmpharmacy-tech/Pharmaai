import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IRAN_MANUFACTURERS,
  IRAN_MARKET_PRODUCT_EXEMPLARS,
} from '../data/iranManufacturerProducts';
import { matchIranianPackage, normalizePackageText } from './iranPackageMatching';

test('manufacturer-product exemplars are source-linked and do not impersonate an official registration', () => {
  assert.equal(IRAN_MANUFACTURERS.length, 3);
  assert.equal(IRAN_MARKET_PRODUCT_EXEMPLARS.length, 54);
  const ids = new Set<string>();
  for (const p of IRAN_MARKET_PRODUCT_EXEMPLARS) {
    assert.ok(p.sourceUrl.startsWith('https://'));
    assert.equal(p.registration.status, 'not-verified');
    assert.equal(p.packageImage.status, 'missing-authorized-image');
    assert.equal('price' in p, false);
    assert.equal('irc' in p.registration, false);
    assert.ok(p.brand.trim() && p.genericName.trim() && p.strengthLabel.trim());
    assert.ok(IRAN_MANUFACTURERS.some((m) => m.id === p.manufacturerId));
    assert.ok(!ids.has(p.id), `duplicate product ${p.id}`);
    ids.add(p.id);
    if (p.externalPhotoPageUrl) assert.ok(p.externalPhotoPageUrl.startsWith('https://'));
  }
});

test('Persian forms and Persian digits match a known manufacturer-contributed antibiotic', () => {
  const r = matchIranianPackage({
    brand: 'Amorax 125',
    strength: '۱۲۵ میلی گرم / ۵ میلی لیتر',
    dosageForm: 'پودر برای تهیه سوسپانسیون',
    manufacturer: 'داروسازی دانا',
    generic: 'Amoxicillin',
    visualQuality: 'clear',
  });
  assert.equal(r.status, 'catalog-candidate');
  assert.equal(r.productId, 'daana-amorax-125');
  assert.equal(r.regulatoryVerified, false);
  assert.equal(r.photoVerified, false);
});

test('strength conflict must fail closed even for a known brand/manufacturer', () => {
  const r = matchIranianPackage({
    brand: 'Zaxime 200', strength: '400 mg', dosageForm: 'tablet',
    manufacturer: 'داروسازی دانا', generic: 'Cefixime',
  });
  // 400 mg is a different, explicitly catalogued Zaxime product.
  assert.equal(r.productId, 'daana-zaxime-400');
  assert.equal(r.status, 'catalog-candidate');
  const conflict = matchIranianPackage({
    brand: 'Zaxime', strength: '800 mg', dosageForm: 'tablet',
    manufacturer: 'داروسازی دانا',
  });
  assert.equal(conflict.status, 'conflict');
});

test('wrong ingredient, manufacturer and dosage form cannot be silently reconciled', () => {
  const base = {brand:'Amorax',strength:'125 mg/5 mL',dosageForm:'oral suspension',manufacturer:'Daana'};
  assert.equal(matchIranianPackage({...base,generic:'Azithromycin'}).status, 'conflict');
  assert.equal(matchIranianPackage({...base,manufacturer:'Farabi'}).status, 'conflict');
  assert.equal(matchIranianPackage({...base,dosageForm:'tablet'}).status, 'conflict');
});

test('incomplete or unreadable image never becomes an approved product match', () => {
  assert.equal(matchIranianPackage({brand:'Amorax',strength:'125 mg/5 mL',visualQuality:'unreadable'}).status,'insufficient-evidence');
  assert.equal(matchIranianPackage({brand:'Amorax'}).status,'insufficient-evidence');
  assert.equal(matchIranianPackage({brand:'unknown brand',strength:'125 mg',manufacturer:'Daana'}).status,'not-found');
  assert.equal(matchIranianPackage({brand:'Amorax',strength:'125 mg/5 mL'}).status,'ambiguous');
});

test('normalization does not confuse strength 20 with 200 and retains Persian names', () => {
  assert.equal(normalizePackageText('داروسازی ياران'), 'داروسازی یاران');
  assert.equal(matchIranianPackage({
    brand:'CinnoTec',strength:'20 mg',manufacturer:'CinnaGen',dosageForm:'capsule',
  }).status, 'conflict');
  assert.equal(matchIranianPackage({
    brand:'CinnoTec 240',strength:'۲۴۰ mg',manufacturer:'CinnaGen',dosageForm:'capsule',
    generic:'Dimethyl fumarate',
  }).status, 'catalog-candidate');
});

test('compound strength can be matched only to a declared alternative', () => {
  const known = matchIranianPackage({
    brand:'Clamox 625',strength:'500 mg/125 mg',
    dosageForm:'tablet',manufacturer:'Daana',
    generic:'Amoxicillin + Clavulanic acid',
  });
  assert.equal(known.status, 'catalog-candidate');
  assert.equal(known.productId, 'daana-clamox-625');
});
