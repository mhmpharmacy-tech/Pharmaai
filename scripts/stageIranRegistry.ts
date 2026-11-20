/**
 * Explicit local-only import of a user-authorized IFDA/TTAC export.
 *
 * Usage:
 * bun run registry:stage -- --input=/private/official-export.csv \
 *   --source=https://irc.fda.gov.ir/Home/HomePage \
 *   --release=1405-08 --permission=contract-REF \
 *   --write
 *
 * The source URL is provenance metadata, NOT evidence that the file itself
 * was downloaded from that URL. Validation creates only PENDING REVIEW rows.
 * The caller must independently corroborate the export and usage rights.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  parseCsvWithHeaders,
  stageIranRegistry,
  type RegistryProductInput,
  type RegistryBatchProvenance,
} from '../src/utils/iranRegistryImport';

function option(name:string):string {
  return process.argv.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3)??'';
}

const input=option('input');
const sourceUrl=option('source');
const datasetRelease=option('release');
const usagePermissionReference=option('permission');
const write=process.argv.includes('--write');
if(!input||!sourceUrl||!datasetRelease||!usagePermissionReference) {
  console.error('Required --input=FILE --source=https://[official IFDA/TTAC] --release=VERSION --permission=REFERENCE [--write]');
  process.exit(2);
}
const raw=fs.readFileSync(input);
if(raw.length>40*1024*1024)throw new Error('Too many bytes for one staged batch');
const content=raw.toString('utf8');
let records:RegistryProductInput[];
if(input.toLowerCase().endsWith('.json')) {
  const decoded:unknown=JSON.parse(content);
  if(!Array.isArray(decoded))throw new Error('The JSON root must be an array');
  records=decoded as RegistryProductInput[];
} else if(input.toLowerCase().endsWith('.csv')) {
  records=parseCsvWithHeaders(content) as unknown as RegistryProductInput[];
}else{
  throw new Error('Only UTF-8 CSV or JSON exports are accepted. Convert XLS/XLSX outside the importer.');
}
const officialSource:RegistryBatchProvenance={
  authority:'IFDA-IRC',
  sourceUrl,
  datasetRelease,
  downloadedAt:new Date().toISOString(),
  rawSourceSha256:createHash('sha256').update(raw).digest('hex'),
  usagePermissionReference,
};
const result=stageIranRegistry(records,officialSource);
console.log(JSON.stringify({
  attempted:result.inputCount,
  stagedPendingReview:result.accepted.length,
  rejected:result.rejected,
  duplicateIRC:result.duplicateIRC,
  conflicts:result.conflicts,
  verified:result.verifiedCount,
  sourceSha256:officialSource.rawSourceSha256,
},null,2));
if(result.rejected.length||result.conflicts.length)process.exitCode=1;
if(write){
  const outputDir=path.join(process.cwd(),'private-data');
  fs.mkdirSync(outputDir,{recursive:true,mode:0o700});
  const outputFile=path.join(outputDir,'iran-irc-pending-review.json');
  fs.writeFileSync(outputFile,JSON.stringify(result.accepted,null,2),{mode:0o600});
  console.log('Pending-review private staging file:',outputFile);
}
