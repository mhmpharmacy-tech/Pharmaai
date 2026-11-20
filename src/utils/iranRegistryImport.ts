/**
 * Review gate for an authorized, explicitly supplied IFDA/TTAC product export.
 *
 * This module DOES NOT download/scrape regulator services, check license status
 * online, or declare a registration current. Every import is staged and pending
 * a human verification against the cited official record.
 */
export interface RegistryBatchProvenance {
  authority: 'IFDA-IRC' | 'TTAC';
  sourceUrl: string;
  datasetRelease: string;
  downloadedAt: string;
  rawSourceSha256: string;
  /** A manual lookup in a public official listing does not require a paid data feed.
   * This does NOT assert permission for systematic scraping or redistribution.
   */
  accessBasis?: 'authorized-export' | 'public-manual-review';
  usagePermissionReference: string;
  /** Specific archived record/screenshot or entry URL + capture evidence for a manual lookup. */
  publicRecordEvidenceId?: string;
}

export interface RegistryProductInput {
  irc: string;
  gtin?: string;
  genericName: string;
  brandName: string;
  manufacturerName: string;
  strength: string;
  dosageForm: string;
  route: string;
  regulatoryStatus: 'active' | 'suspended' | 'cancelled' | 'unknown';
}

export interface StagedIranProduct extends RegistryProductInput {
  id: string;
  verificationStatus: 'pending-pharmacist-review';
  provenance: RegistryBatchProvenance;
}

export interface RegistryImportReport {
  accepted: StagedIranProduct[];
  rejected: Array<{ row: number; reasons: string[] }>;
  conflicts: string[];
  duplicateIRC: string[];
  inputCount: number;
  /** Import alone NEVER approves an IRC registration or a clinical monograph. */
  verifiedCount: 0;
}

const LATIN: Record<string, string> = {
  '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
};

export function normalizeIranCode(code: string): string {
  return code.trim().replace(/[۰-۹٠-٩]/g, (c) => LATIN[c] ?? c);
}

function canonical(value: string): string {
  return value.normalize('NFKC').toLowerCase()
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک')
    .replace(/[\u200c\u200d\s\-_/().]+/g,'')
    .trim();
}

export function validGtinCheckDigit(input: string): boolean {
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(input)) return false;
  const digits = [...input].map(Number);
  const payload = digits.slice(0, -1);
  const sum = payload.reverse().reduce((total, number, i) =>
    total + number * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === digits.at(-1);
}

function validIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s) && !Number.isNaN(Date.parse(s));
}

export function validateBatchProvenance(source: RegistryBatchProvenance): string[] {
  const reasons: string[] = [];
  let host = '';
  try {
    const u = new URL(source.sourceUrl);
    if (u.protocol !== 'https:') throw new Error('HTTPS only');
    host = u.hostname.toLowerCase();
  } catch { reasons.push('لینک منبع رسمی معتبر و HTTPS نیست.'); }
  // Hostname exact matches/subdomains only. Other Iranian news or reseller
  // websites must never be represented as official IFDA/TTAC exports.
  const official = ['ttac.ir','fda.gov.ir'].some((domain) =>
    host === domain || host.endsWith('.' + domain));
  if (!official) reasons.push('دامنه منبع به وب‌سایت رسمی TTAC/سازمان غذا و دارو تعلق ندارد.');
  if (!source.datasetRelease.trim()) reasons.push('نسخه/تاریخ انتشار داده ثبت نشده است.');
  if (!validIsoDate(source.downloadedAt)) reasons.push('زمان دریافت با قالب معتبر ISO ثبت نشده است.');
  if (!/^[a-fA-F0-9]{64}$/.test(source.rawSourceSha256)) reasons.push('هش SHA-256 فایل منبع معتبر نیست.');
  const basis = source.accessBasis ?? 'authorized-export';
  if (basis === 'authorized-export') {
    if (source.usagePermissionReference.trim().length < 8)
      reasons.push('برای دریافت انبوه، مستند مجوز داده/دسترسی ثبت نشده است.');
  } else if (basis === 'public-manual-review') {
    if (!source.publicRecordEvidenceId?.trim() || source.publicRecordEvidenceId.trim().length < 8)
      reasons.push('برای مشاهده دستی عمومی، شناسه شاهد صفحه رسمی/تاریخ ثبت لازم است.');
  } else {
    reasons.push('روش به‌دست‌آوردن داده مشخص نیست.');
  }
  return reasons;
}

export function stageIranRegistry(
  records: RegistryProductInput[],
  provenance: RegistryBatchProvenance
): RegistryImportReport {
  const accepted: StagedIranProduct[] = [];
  const rejected: RegistryImportReport['rejected'] = [];
  const conflicts: string[] = [];
  const duplicateIRC: string[] = [];
  const sourceProblems = validateBatchProvenance(provenance);
  const ircs = new Map<string, RegistryProductInput>();
  if (!Array.isArray(records)) throw new Error('Registry records must be an array');

  for (let idx=0; idx<records.length; idx++) {
    const record = records[idx];
    const reasons = [...sourceProblems];
    if (!record || typeof record !== 'object') {
      rejected.push({row: idx+1, reasons: ['ساختار رکورد نامعتبر است.']});
      continue;
    }
    const irc = normalizeIranCode(String(record.irc ?? ''));
    if (!/^\d{16}$/.test(irc)) reasons.push('IRC باید ۱۶ رقم معتبر در قالب شناسه باشد؛ صرف قالب نشان‌دهنده ثبت رسمی نیست.');
    const gtin = record.gtin ? normalizeIranCode(String(record.gtin)) : undefined;
    if (gtin && !validGtinCheckDigit(gtin)) reasons.push('ساختار/رقم کنترلی GTIN نامعتبر است.');
    for (const field of ['genericName','brandName','manufacturerName','strength','dosageForm','route'] as const) {
      if (typeof record[field] !== 'string' || !record[field].trim()) reasons.push('فیلد ضروری ناقص: ' + field);
    }
    if (!['active','suspended','cancelled','unknown'].includes(record.regulatoryStatus))
      reasons.push('وضعیت پروانه نامعتبر است.');
    if (record.regulatoryStatus !== 'active')
      reasons.push('محصول در منبع به‌عنوان ثبت فعال معرفی نشده یا وضعیت آن نامعلوم است.');

    if (ircs.has(irc)) {
      duplicateIRC.push(irc);
      const prev = ircs.get(irc)!;
      const fields = ['genericName','brandName','manufacturerName','strength','dosageForm','route'] as const;
      if (fields.some((k) => canonical(String(prev[k])) !== canonical(String(record[k]))))
        conflicts.push('IRC تکراری با مشخصات ناسازگار: ' + irc);
      reasons.push('IRC تکراری در همان فایل.');
    } else if (/^\d{16}$/.test(irc)) {
      ircs.set(irc, record);
    }
    if (reasons.length) {
      rejected.push({row:idx+1,reasons});
      continue;
    }
    accepted.push({
      ...record,
      irc, gtin,
      id:'iran-irc-'+irc,
      verificationStatus:'pending-pharmacist-review',
      provenance,
    });
  }
  return {
    accepted, rejected, conflicts,
    duplicateIRC: [...new Set(duplicateIRC)],
    inputCount: records.length,
    verifiedCount: 0,
  };
}

/** A strict, small, quoted-cell CSV reader for manually exported official data.
 * Reject broken quotes instead of trying to repair patient/product identifiers.
 */
export function parseCsvWithHeaders(text: string): Record<string,string>[] {
  const input=text.replace(/^\uFEFF/,'');
  const lines:string[][]=[];
  let row:string[]=[], cell='', quoted=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(ch==='"'){
      if(quoted && input[i+1]==='"'){cell+='"';i++;continue;}
      if(!quoted && cell !== '') throw new Error('Unexpected CSV quote');
      quoted=!quoted; continue;
    }
    if(!quoted && (ch===',' || ch===';' || ch==='\n')){
      row.push(cell);cell='';
      if(ch==='\n'){lines.push(row);row=[];}
      continue;
    }
    if(!quoted && ch==='\r') continue;
    cell+=ch;
  }
  if(quoted)throw new Error('Unterminated quoted CSV cell');
  row.push(cell);
  if(row.some(x=>x.trim()))lines.push(row);
  if(!lines.length)return [];
  const headers=lines[0].map(x=>x.trim());
  if(new Set(headers).size!==headers.length || headers.some(h=>!h))
    throw new Error('Duplicate or blank CSV headers');
  return lines.slice(1).filter(r=>r.some(x=>x.trim())).map((r,index)=>{
    if(r.length!==headers.length)throw new Error('Incorrect field count on row '+(index+2));
    return Object.fromEntries(headers.map((h,i)=>[h,r[i].trim()]));
  });
}
