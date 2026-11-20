import test from 'node:test';
import assert from 'node:assert/strict';
import { auditIranPhotoManifest, auditIranPhotoSet, type IranDrugPhotoManifest } from './iranPhotoQA';
import { evaluateIranPackaging } from './iranRecognitionBenchmark';

const syntheticIRC='1234567890123456';
const base:IranDrugPhotoManifest={
  imageId:'synthetic-front',productId:'daana-amorax-125',irc:syntheticIRC,
  fileSha256:'a'.repeat(64),sourceAssetPath:'private-data/product-001-front.png',
  packagingRevision:'test-box-revision-A',capturedAt:'2026-10-01',view:'front',
  rights:{
    basis:'original-photo-with-consent',rightsHolder:'Test rights holder',
    authorizedUse:'clinical-reference-and-evaluation',
    permissionEvidenceId:'synthetic-permission-record-only',
    permissionDate:'2026-10-01',
  },
  noPatientData:true,reviewerPrimary:'Reviewer A',
  reviewerSecondary:'Reviewer B',verifiedPackageIdentity:true,
};

test('two distinct QA reviewers and an explicitly reviewed IRC are required for each photo',()=>{
  const result=auditIranPhotoManifest(base,new Set([syntheticIRC]));
  assert.equal(result.eligible,true);
  assert.equal(result.usedForModelTraining,false);
  assert.equal(auditIranPhotoManifest(base,new Set()).eligible,false);
  assert.equal(auditIranPhotoManifest({...base,reviewerSecondary:'Reviewer A'},new Set([syntheticIRC])).eligible,false);
  assert.equal(auditIranPhotoManifest({...base,noPatientData:false},new Set([syntheticIRC])).eligible,false);
});

test('third-party URLs and missing rights cannot be promoted to a licensed photo set',()=>{
  const web={...base,sourceAssetPath:'https://example.com/borrowed.jpg'};
  assert.equal(auditIranPhotoManifest(web,new Set([syntheticIRC])).eligible,false);
  const noConsent={...base,rights:{...base.rights,permissionEvidenceId:''}};
  assert.equal(auditIranPhotoManifest(noConsent,new Set([syntheticIRC])).eligible,false);
  const expired={...base,rights:{...base.rights,expiresAt:'2026-01-01'}};
  assert.equal(auditIranPhotoManifest(expired,new Set([syntheticIRC])).eligible,false);
});

test('real pack-reference preparation requires independently approved front and back',()=>{
  const back={...base,imageId:'synthetic-back',fileSha256:'b'.repeat(64),view:'back' as const};
  const result=auditIranPhotoSet([base,back],new Set([syntheticIRC]));
  assert.equal(result.total,2);
  assert.equal(result.eligible,2);
  assert.equal(result.perProductReady,1);
  const duplicate=auditIranPhotoSet([base,{...back,fileSha256:base.fileSha256}],new Set([syntheticIRC]));
  assert.equal(duplicate.ineligible,1);
  assert.equal(duplicate.perProductReady,0);
});

test('ground-truth benchmark detects wrong strength and hallucinated matches to unknown products',()=>{
  const result=evaluateIranPackaging([
    {
      id:'case-known-correct',imageId:'eval-01',datasetSplit:'evaluation',
      packageRevision:'rev-A',expectedProductId:'daana-amorax-125',
      observed:{brand:'Amorax 125',strength:'125 mg/5 mL',
        dosageForm:'oral suspension',manufacturer:'Daana',generic:'Amoxicillin'},
    },
    {
      id:'case-known-wrong-strength',imageId:'eval-02',datasetSplit:'evaluation',
      packageRevision:'rev-B',expectedProductId:'daana-zaxime-200',
      observed:{brand:'Zaxime',strength:'400 mg',
        dosageForm:'tablet',manufacturer:'Daana',generic:'Cefixime'},
    },
    {
      id:'case-unknown-false-accept',imageId:'eval-03',datasetSplit:'evaluation',
      packageRevision:'rev-C',expectedProductId:null,
      observed:{brand:'Zaxime',strength:'400 mg',
        dosageForm:'tablet',manufacturer:'Daana',generic:'Cefixime'},
    },
    {
      id:'case-unknown-abstain',imageId:'eval-04',datasetSplit:'evaluation',
      packageRevision:'rev-D',expectedProductId:null,
      observed:{brand:'TotallyUnknownProduct',strength:'1 mg',dosageForm:'tablet'},
    },
  ]);
  assert.equal(result.total,4);
  assert.equal(result.accepted,3,JSON.stringify(result.confusion));
  assert.equal(result.correctAccepted,1);
  assert.equal(result.incorrectAccepted,2);
  assert.equal(result.wrongStrengthAccepted,1);
  assert.equal(result.unknownAccepted,1);
  assert.equal(result.abstained,1);
  assert.equal(result.precisionAccepted,1/3);
  assert.equal(result.recallKnown,1/2);
  assert.equal(result.coverage,3/4);
  assert.equal(result.unknownFalseAcceptRate,1/2);
});

test('an empty benchmark has null undefined-denominator metrics instead of invented performance',()=>{
  const result=evaluateIranPackaging([]);
  assert.equal(result.total,0);
  assert.equal(result.precisionAccepted,null);
  assert.equal(result.recallKnown,null);
  assert.equal(result.unknownFalseAcceptRate,null);
});

test('a case cannot be part of train/dev data or duplicate a held-out image',()=>{
  const sample={
    id:'case-1',imageId:'photo-1',datasetSplit:'evaluation' as const,
    packageRevision:'Rev-A',expectedProductId:null,
    observed:{brand:'unknown',strength:'10 mg'},
  };
  assert.throws(()=>evaluateIranPackaging([sample,{...sample,id:'case-2'}]));
  assert.throws(()=>evaluateIranPackaging([{...sample,datasetSplit:'train' as never}]));
});


test('self-photographed pharmacy packaging can be staged without manufacturer contract',()=>{
  const selfPhoto={
    ...base,
    rights:{
      basis:'pharmacist-original-photo' as const,
      rightsHolder:'Pharmacist Photographer',
      authorizedUse:'clinical-reference-and-evaluation' as const,
      permissionEvidenceId:'photo-owner-attestation-2026-11',
      permissionDate:'2026-10-01',
    },
  };
  const reviewed=auditIranPhotoManifest(selfPhoto,new Set([syntheticIRC]));
  assert.equal(reviewed.eligible,true);
  assert.equal(reviewed.usedForModelTraining,false);
});
