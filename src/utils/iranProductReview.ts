import { DAROOYAB_PUBLIC_PRODUCT_FACTS, DAROOYAB_GENERIC_REFERENCE_LINKS } from '../data/darooyabPublicFacts';
import { IRAN_MARKET_PRODUCT_EXEMPLARS, IRAN_MANUFACTURERS } from '../data/iranManufacturerProducts';
import { normalizeIranCode, validGtinCheckDigit } from './iranRegistryImport';

export type IranReviewSource = 'darooyab-public' | 'manufacturer-2024' | 'secondary-catalogue';
export interface IranReviewSeed {
  id: string;
  brand: string;
  ingredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  packageSize: string | null;
  manufacturer: string | null;
  importer: string | null;
  sourceUrl: string;
  sourceType: IranReviewSource;
  sourceObservedAt: string | null;
  integrityWarning: string | null;
  genericReferenceUrl: string | null;
}
export interface ProductReviewDraft {
  ingredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  packageSize: string | null;
  manufacturer: string | null;
  importer: string | null;
  irc: string | null;
  gtin: string | null;
  officialPriceRial: string | null;
  officialPriceCheckedAt: string | null;
  pharmacyNote: string | null;
  pharmacistIdentityChecked: boolean;
  photoFrontStored: boolean;
  photoBackStored: boolean;
  editedAt: string;
}
export const REVIEW_DRAFT_STORAGE_KEY='pharmaai-iran-product-review-v1';
export type DraftsByProduct = Record<string,ProductReviewDraft>;

const genericMap = new Map(
  DAROOYAB_GENERIC_REFERENCE_LINKS.map(x=>[x.genericName.toLowerCase().replace(/[^a-z0-9]+/g,''),x.sourceUrl])
);
const findGeneric=(ingredient:string|null):string|null=>{
  if(!ingredient) return null;
  const normalized=ingredient.toLowerCase().replace(/[^a-z0-9]+/g,'');
  return genericMap.get(normalized)??null;
};

/**
 * 25 directly inspected Darooyab product pages + 54 separate historical
 * manufacturer/secondary-catalogue exemplars. This is not a live regulator
 * registry nor permission to bulk mirror the source's protected materials.
 */
export const IRAN_EDITABLE_REVIEW_SEEDS: readonly IranReviewSeed[] = [
  ...DAROOYAB_PUBLIC_PRODUCT_FACTS.map(p=>({
    id:'darooyab:'+p.id,
    brand:p.brand,ingredient:p.ingredient,strength:p.strength,
    dosageForm:p.dosageForm,packageSize:p.packageSize,
    manufacturer:p.manufacturer,importer:p.importer,
    sourceUrl:p.sourceUrl,sourceType:'darooyab-public' as const,
    sourceObservedAt:p.observedAt,
    integrityWarning:p.integrityWarning??null,
    genericReferenceUrl:findGeneric(p.ingredient),
  })),
  ...IRAN_MARKET_PRODUCT_EXEMPLARS.map(p=>{
    const maker=IRAN_MANUFACTURERS.find(x=>x.id===p.manufacturerId);
    return {
      id:'catalogue:'+p.id,
      brand:p.brand,ingredient:p.genericName,strength:p.strengthLabel,
      dosageForm:p.form,packageSize:null,
      manufacturer:maker?.nameFa??null,importer:null,
      sourceUrl:p.sourceUrl,
      sourceType:p.sourceTier==='manufacturer-submitted-2024'?'manufacturer-2024' as const:'secondary-catalogue' as const,
      sourceObservedAt:p.sourceTier==='manufacturer-submitted-2024'?'2024':null,
      integrityWarning:null,
      genericReferenceUrl:findGeneric(p.genericName),
    };
  }),
];

const FIELD_NAMES=[
  'ingredient','strength','dosageForm','packageSize','manufacturer','importer',
  'irc','gtin','officialPriceRial','officialPriceCheckedAt','pharmacyNote',
] as const;

function cleanText(value:unknown,max=240):string|null {
  if(typeof value!=='string')return null;
  const cleaned=value.trim();
  return cleaned?cleaned.slice(0,max):null;
}
function validISODate(value:string|null):boolean {
  return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value)));
}
export function newReviewDraft():ProductReviewDraft{
  return {
    ingredient:null,strength:null,dosageForm:null,packageSize:null,
    manufacturer:null,importer:null,irc:null,gtin:null,
    officialPriceRial:null,officialPriceCheckedAt:null,pharmacyNote:null,
    pharmacistIdentityChecked:false,
    photoFrontStored:false,photoBackStored:false,editedAt:'',
  };
}

export function sanitizeReviewDraft(value:unknown):ProductReviewDraft{
  const v=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const out=newReviewDraft();
  for(const name of FIELD_NAMES)out[name]=cleanText(v[name],name==='pharmacyNote'?1200:240);
  if(out.irc)out.irc=normalizeIranCode(out.irc);
  if(out.gtin)out.gtin=normalizeIranCode(out.gtin);
  out.pharmacistIdentityChecked=v.pharmacistIdentityChecked===true;
  out.photoFrontStored=v.photoFrontStored===true;
  out.photoBackStored=v.photoBackStored===true;
  out.editedAt=typeof v.editedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(v.editedAt)?v.editedAt.slice(0,35):'';
  return out;
}

/** Leaves a genuine missing source value null unless the pharmacist filled it. */
export function resolvedIranReviewField(
  product:IranReviewSeed,
  draft:ProductReviewDraft|undefined,
  field:'ingredient'|'strength'|'dosageForm'|'packageSize'|'manufacturer'|'importer'
):string|null {
  return draft?.[field]??product[field];
}

export function validateIranReviewDraft(seed:IranReviewSeed,draft:ProductReviewDraft):string[]{
  const errors:string[]=[];
  if(draft.irc&&!/^\d{16}$/.test(draft.irc))errors.push('IRC باید در صورت ثبت، ۱۶ رقم باشد.');
  if(draft.gtin&&!validGtinCheckDigit(draft.gtin))errors.push('GTIN واردشده رقم کنترلی معتبر ندارد.');
  if(draft.officialPriceRial&&!/^[1-9]\d{0,17}$/.test(draft.officialPriceRial))
    errors.push('قیمت فقط به ریال و به‌صورت عدد صحیح مثبت ثبت شود.');
  if(!validISODate(draft.officialPriceCheckedAt))
    errors.push('تاریخ استعلام قیمت معتبر نیست.');
  if(draft.officialPriceRial&&!draft.officialPriceCheckedAt)
    errors.push('در صورت ثبت قیمت، تاریخ استعلام نیز الزامی است.');
  if(draft.pharmacistIdentityChecked){
    const missing=(['ingredient','strength','dosageForm','manufacturer'] as const)
      .filter(field=>!resolvedIranReviewField(seed,draft,field));
    if(missing.length)errors.push('پیش از بررسی هویت، ماده مؤثره، قدرت، فرم و شرکت را تکمیل کنید.');
    if(seed.integrityWarning && !draft.pharmacyNote)
      errors.push('ناسازگاری منبع باید در یادداشت داروساز تعیین تکلیف شود.');
  }
  return errors;
}
export function readIranProductReviewDrafts(raw:string|null):DraftsByProduct{
  if(!raw||raw.length>2*1024*1024)return {};
  try{
    const decoded:unknown=JSON.parse(raw);
    if(!decoded||typeof decoded!=='object'||Array.isArray(decoded))return {};
    const known=new Set(IRAN_EDITABLE_REVIEW_SEEDS.map(x=>x.id));
    const validEntries=Object.entries(decoded).filter(([id])=>known.has(id)).slice(0,IRAN_EDITABLE_REVIEW_SEEDS.length);
    return Object.fromEntries(validEntries.map(([id,val])=>[id,sanitizeReviewDraft(val)]));
  }catch{return {};}
}

export function exportIranReviewSnapshot(drafts:DraftsByProduct){
  return {
    schema:'pharmaai-iran-review-v1',
    sourceProductCount:IRAN_EDITABLE_REVIEW_SEEDS.length,
    officialRegistrationVerifiedByThisExport:false,
    visualModelTrainedOnPhotos:false,
    imageBlobsIncluded:false,
    records:IRAN_EDITABLE_REVIEW_SEEDS.map(p=>({
      ...p,
      reviewed:sanitizeReviewDraft(drafts[p.id]),
      outstanding:['irc','gtin','officialPriceRial','officialPriceCheckedAt',
        'packageSize','ingredient','strength','dosageForm','manufacturer','importer'].filter(k=>{
        const field=k as keyof ProductReviewDraft;
        const patch=drafts[p.id]?.[field];
        const fromSeed=k in p?(p as unknown as Record<string,unknown>)[k]:null;
        return patch==null&&fromSeed==null;
      }),
    })),
  };
}
