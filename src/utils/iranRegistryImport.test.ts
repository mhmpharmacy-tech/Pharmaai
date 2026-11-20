import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIranCode,
  validGtinCheckDigit,
  validateBatchProvenance,
  stageIranRegistry,
  parseCsvWithHeaders,
  type RegistryBatchProvenance,
  type RegistryProductInput,
} from './iranRegistryImport';

const provenance:RegistryBatchProvenance = {
  authority:'IFDA-IRC',
  sourceUrl:'https://irc.fda.gov.ir/Home/HomePage',
  datasetRelease:'synthetic-test-only',
  downloadedAt:'2026-11-21T01:00:00.000Z',
  rawSourceSha256:'a'.repeat(64),
  usagePermissionReference:'TEST-PERMISSION-NOT-A-REAL-LICENSE',
};
const sample:RegistryProductInput = {
  irc:'1234567890123456',gtin:'12345670',
  genericName:'Amoxicillin',
  brandName:'Synthetic sample — NOT A REAL REGISTERED PRODUCT',
  manufacturerName:'Example Pharma',
  strength:'125 mg/5 mL',dosageForm:'suspension',route:'oral',
  regulatoryStatus:'active',
};

test('IRC format, Persian digits and GTIN check digit are checked',()=>{
  assert.equal(normalizeIranCode('۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶'),'1234567890123456');
  assert.equal(validGtinCheckDigit('12345670'),true);
  assert.equal(validGtinCheckDigit('12345671'),false);
  assert.equal(validGtinCheckDigit('1234567890123x'),false);
});

test('stage remains pending review even when the synthetic export is structurally valid',()=>{
  const output=stageIranRegistry([sample],provenance);
  assert.equal(output.accepted.length,1);
  assert.equal(output.rejected.length,0);
  assert.equal(output.accepted[0].verificationStatus,'pending-pharmacist-review');
  assert.equal(output.verifiedCount,0);
});

test('duplicate IRC and contradictory dosage/maker are flagged, not accepted',()=>{
  const bad={...sample,strength:'250 mg/5 mL',manufacturerName:'Another Pharma'};
  const report=stageIranRegistry([sample,bad],provenance);
  assert.equal(report.accepted.length,1);
  assert.equal(report.rejected.length,1);
  assert.equal(report.conflicts.length,1);
  assert.deepEqual(report.duplicateIRC,['1234567890123456']);
});

test('inactive entries, illegal codes, invalid GTINs and empty mandatory fields are rejected',()=>{
  const report=stageIranRegistry([
    {...sample,regulatoryStatus:'cancelled'},
    {...sample,irc:'123',gtin:'12345671'},
    {...sample,irc:'1111111111111111',brandName:''},
  ],provenance);
  assert.equal(report.accepted.length,0);
  assert.equal(report.rejected.length,3);
});

test('reported official source must be exact regulator domain and have documented provenance',()=>{
  assert.deepEqual(validateBatchProvenance(provenance),[]);
  const fake={...provenance,sourceUrl:'https://ttac.ir.evil.example/registry'};
  assert.ok(validateBatchProvenance(fake).some(x=>x.includes('دامنه')));
  const noRights={...provenance,usagePermissionReference:''};
  assert.ok(validateBatchProvenance(noRights).some(x=>x.includes('مجوز')));
  assert.equal(stageIranRegistry([sample],fake).accepted.length,0);
});

test('quoted CSV with comma in name, semicolon delimiter and malformed rows',()=>{
  const out=parseCsvWithHeaders('irc,brandName,genericName\n123,"Acme, 500",Amoxicillin\n');
  assert.equal(out[0].brandName,'Acme, 500');
  const alt=parseCsvWithHeaders('irc;brandName\n123;Acme\n');
  assert.equal(alt[0].irc,'123');
  assert.throws(()=>parseCsvWithHeaders('irc,brandName\n123,"oops'));
  assert.throws(()=>parseCsvWithHeaders('irc,brandName\n123'));
});


test('pharmacist can stage manually observed public IRC record without fabricated bulk-data license', () => {
  const publicObservation = {
    ...provenance,
    accessBasis: 'public-manual-review' as const,
    usagePermissionReference: '',
    publicRecordEvidenceId: 'public-IRC-page-captured-2026-11-21',
  };
  assert.deepEqual(validateBatchProvenance(publicObservation),[]);
  const report=stageIranRegistry([sample],publicObservation);
  assert.equal(report.accepted.length,1);
  assert.equal(report.verifiedCount,0);
  assert.equal(report.accepted[0].verificationStatus,'pending-pharmacist-review');

  const undocumented = {...publicObservation,publicRecordEvidenceId:''};
  assert.ok(validateBatchProvenance(undocumented).some(x=>x.includes('شاهد')));
  assert.equal(stageIranRegistry([sample],undocumented).accepted.length,0);
});
