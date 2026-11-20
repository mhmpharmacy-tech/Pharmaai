/**
 * Evaluate real held-out photographic observations supplied by a pharmacist.
 * This script DOES NOT invent patient/product images or fake performance.
 * Expected JSON:
 * {
 *   "cases":[IranPackageEvaluationCase, ...],
 *   "photos":[IranDrugPhotoManifest, ...],
 *   "officialRegistryIrcs":["..."],
 *   "sourceEvidenceId":"signed review record or authorized dataset"
 * }
 * bun run vision:evaluate -- --input=private-data/iran-photo-eval.json
 */
import fs from 'node:fs';
import { auditIranPhotoSet, type IranDrugPhotoManifest } from '../src/utils/iranPhotoQA';
import { evaluateIranPackaging, type IranPackageEvaluationCase } from '../src/utils/iranRecognitionBenchmark';

const input=process.argv.find(x=>x.startsWith('--input='))?.slice('--input='.length);
if(!input) {
  console.error('Required --input=FILE. No benchmark dataset is bundled or implied.');
  process.exit(2);
}
const raw=JSON.parse(fs.readFileSync(input,'utf8')) as {
  cases:IranPackageEvaluationCase[];
  photos:IranDrugPhotoManifest[];
  officialRegistryIrcs:string[];
  sourceEvidenceId:string;
};
if(!raw||!Array.isArray(raw.cases)||!Array.isArray(raw.photos)||
   !Array.isArray(raw.officialRegistryIrcs)||!raw.sourceEvidenceId?.trim())
  throw new Error('Missing cases, licensed photos, verified-registry IRC list or provenance');
if(raw.cases.length<1)throw new Error('Cannot report recognition accuracy on an empty dataset');
const photoAudit=auditIranPhotoSet(raw.photos,new Set(raw.officialRegistryIrcs));
const photoById=new Map(raw.photos.map(p=>[p.imageId,p]));
if(photoById.size!==raw.photos.length)throw new Error('Duplicate image IDs in photo manifest');
const eligibleIds=new Set(photoAudit.reviewSummary.filter(x=>x.eligible).map(x=>x.imageId));
if(photoAudit.ineligible || raw.cases.some(c=>!eligibleIds.has(c.imageId)))
  throw new Error('Some cases lack licensed, approved, independently reviewed source photos');
const perProduct= new Set(raw.cases.map(c=>c.expectedProductId).filter(Boolean));
const metrics=evaluateIranPackaging(raw.cases);
console.log(JSON.stringify({
  reportType:'Measured held-out package-label reconciliation on independently supplied observations, NOT model fine-tuning',
  evidence:raw.sourceEvidenceId,
  distinctGroundTruthProducts:perProduct.size,
  eligiblePhotos:photoAudit.eligible,
  productPairsWithFrontAndBack:photoAudit.perProductReady,
  ...metrics,
},null,2));
