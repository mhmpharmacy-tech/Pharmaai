import { LOCAL_DRUG_FORMULARY } from '../data/localDrugFormulary';
import { DAROOYAB_PUBLIC_PRODUCT_FACTS } from '../data/darooyabPublicFacts';
import { IRAN_REFERENCE_INDEX } from '../data/iranReference';

export type ReceiptNameStatus = 'name-candidate' | 'ambiguous' | 'historical-only' | 'not-found' | 'unreadable';

export interface ReceiptTextEvidence {
  /** One line of the printed receipt as actually read by OCR; never reconstructed from general drug knowledge. */
  visibleLine: string;
  /** Visible name from the same line; dose/strength need not be present. */
  visibleDrugName: string;
  /** Literal strength, only if printed clearly on that same line. */
  visibleStrength?: string;
  visibleDosageForm?: string;
  visibleRegimen?: string;
  readability?: 'clear' | 'partial' | 'unreadable';
}

export interface ReceiptNameResolution {
  status: ReceiptNameStatus;
  observedName: string;
  genericName: string | null;
  explicitStrength: string | null;
  visibleDosageForm: string | null;
  visibleRegimen: string | null;
  matchedReferenceIds: string[];
  reasons: string[];
  /** A text match is NOT a verified prescription, product authorization or clinical dose. */
  clinicallyVerified: false;
}

const PERSIAN_DIGITS:Record<string,string>={
  '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
};
export function normalizeReceiptName(value:string):string{
  return (value??'').normalize('NFKC').toLowerCase()
    .replace(/[۰-۹٠-٩]/g,ch=>PERSIAN_DIGITS[ch]??ch)
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک')
    .replace(/[أإ]/g,'ا').replace(/ؤ/g,'و')
    .replace(/[\u064b-\u065f\u200c\u200d]/g,'')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g,'')
    .trim();
}
const DOSAGE_WORDS = ['قرص','کپسول','شربت','سوسپانسیون','قطره','آمپول','ویال','پماد','کرم','ژل',
  'شیاف','اسپری','پودر','پرل','تابلت','tablet','tab','capsule','cap'];
const prefixes=DOSAGE_WORDS.map(normalizeReceiptName).sort((a,b)=>b.length-a.length);
function stripDosageWords(value:string):string{
  let n=normalizeReceiptName(value);
  // Never strip within drug name. Only an explicit prefix/suffix descriptor.
  for(let i=0;i<2;i++){
    const prefix=prefixes.find(word=>n.startsWith(word)&&n.length>word.length+2);
    if(prefix)n=n.slice(prefix.length);
    const suffix=prefixes.find(word=>n.endsWith(word)&&n.length>word.length+2);
    if(suffix)n=n.slice(0,-suffix.length);
  }
  return n;
}
interface Entry { generic:string; id:string; priority:number }
const known=new Map<string,Entry[]>();
function add(key:string|undefined,generic:string|undefined,id:string,priority:number){
  if(!key?.trim()||!generic?.trim())return;
  const normalized=stripDosageWords(key);
  if(normalized.length<4)return;
  const list=known.get(normalized)??[];
  if(!list.some(e=>e.id===id&&e.generic===generic))
    list.push({generic,id,priority});
  known.set(normalized,list);
}
for(const p of LOCAL_DRUG_FORMULARY){
  add(p.persianName,p.genericName,p.id,3);
  add(p.genericName,p.genericName,p.id,3);
  // A slash-delimited display field often contains descriptions, so only
  // the first brand section can be used if it is an unambiguous short label.
  const brand=p.brandName?.split('/')[0]?.trim()??'';
  if(brand && brand.length<45 && !/[()\d]/.test(brand))add(brand,p.genericName,p.id,2);
}
for(const p of DAROOYAB_PUBLIC_PRODUCT_FACTS){
  if(p.ingredient){
    add(p.brand,p.ingredient,'darooyab:'+p.id,2);
    add(p.ingredient,p.ingredient,'darooyab:'+p.id,2);
  }
}
const HISTORICAL=new Map<string,string[]>();
for(const p of IRAN_REFERENCE_INDEX){
  const persian=(p.heading.match(/[\u0600-\u06ff][\u0600-\u06ff\s\u200c\-]+/g)??[])
    .map(v=>stripDosageWords(v))
    .filter(v=>v.length>=5);
  for(const key of persian){
    const ids=HISTORICAL.get(key)??[];
    if(!ids.includes(p.id))ids.push(p.id);
    HISTORICAL.set(key,ids);
  }
}
const STRENGTH_UNITS='mg|mcg|µg|ug|iu|g|میلی\\s*گرم|میکرو\\s*گرم|گرم|واحد|درصد';
const STRENGTH_RE=new RegExp('(?:^|\\s)(\\d+(?:[.,]\\d+)?)\\s*('+STRENGTH_UNITS+')(?=\\s|$|/|٪|%)','iu');
function visibleStrengthOnSameLine(e:ReceiptTextEvidence):string|null{
  const line=e.visibleLine.trim();
  const strength=(e.visibleStrength??'').trim();
  if(!line || !strength)return null;
  const matched=strength.match(STRENGTH_RE);
  if(!matched)return null;
  const literal=normalizeReceiptName(strength);
  if(!literal||!normalizeReceiptName(line).includes(literal))return null;
  return strength.slice(0,45);
}
export function reconcileReceiptDrugText(e:ReceiptTextEvidence):ReceiptNameResolution{
  const observed=(e.visibleDrugName??'').trim().slice(0,140);
  const line=(e.visibleLine??'').trim().slice(0,350);
  const base={observedName:observed,explicitStrength:visibleStrengthOnSameLine(e),
    visibleDosageForm:(e.visibleDosageForm??'').trim().slice(0,50)||null,
    visibleRegimen:(e.visibleRegimen??'').trim().slice(0,100)||null,
    clinicallyVerified:false as const};
  if(e.readability==='unreadable'||!observed||!line)
    return {...base,status:'unreadable',genericName:null,matchedReferenceIds:[],
      reasons:['نام دارو یا خط واقعی رسید قابل‌خواندن نیست.']};
  const normalized=stripDosageWords(observed);
  if(normalized.length<4 || !normalizeReceiptName(line).includes(normalized))
    return {...base,status:'unreadable',genericName:null,matchedReferenceIds:[],
      reasons:['نام گزارش‌شده باید در متن همان خطِ خوانده‌شده وجود داشته باشد.']};
  const matches=known.get(normalized)??[];
  if(matches.length){
    const distinctGenerics=new Map<string,string>();
    for(const m of matches)distinctGenerics.set(normalizeReceiptName(m.generic),m.generic);
    if(distinctGenerics.size>1)
      return {...base,status:'ambiguous',genericName:null,
        matchedReferenceIds:matches.map(m=>m.id),
        reasons:['این نام به بیش از یک ژنریک/ترکیب مرتبط است؛ تأیید داروساز لازم است.']};
    const first=[...matches].sort((a,b)=>b.priority-a.priority)[0];
    return {...base,status:'name-candidate',genericName:first.generic,
      matchedReferenceIds:[...new Set(matches.map(m=>m.id))],
      reasons:[base.explicitStrength
        ?'نام و قدرت خوانده‌شده کاندید تطبیق هستند؛ تأیید نهایی داروساز لازم است.'
        :'نام دارو پیدا شد اما قدرت روی همان خط به‌طور صریح قابل‌تأیید نیست؛ قدرت خالی می‌ماند.']};
  }
  const historical=HISTORICAL.get(normalized)??[];
  if(historical.length)
    return {...base,status:'historical-only',genericName:null,matchedReferenceIds:historical,
      reasons:['عنوان فقط در نمایه آرشیوی یافت شد؛ نام استاندارد ژنریک و وضعیت فعلی تأیید نشده‌اند.']};
  return {...base,status:'not-found',genericName:null,matchedReferenceIds:[],
    reasons:['نام در فهرست متنی محدود پیدا نشد؛ بدون جایگزینی حدسی نیازمند بررسی است.']};
}
