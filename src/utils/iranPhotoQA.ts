/**
 * Rights-first quality gate for an actual image dataset of Iranian medicine
 * packaging. A hyperlink to a third-party page is NEVER a licensed image.
 */
export type PhotoView = 'front' | 'back' | 'blister' | 'bottle' | 'ampoule' | 'authenticity-label';
export interface PhotoRights {
  basis: 'pharmacist-original-photo' | 'original-photo-with-consent' | 'written-manufacturer-license';
  rightsHolder: string;
  authorizedUse: 'clinical-reference-and-evaluation' | 'clinical-reference-only';
  permissionEvidenceId: string;
  permissionDate: string;
  expiresAt?: string;
}
export interface IranDrugPhotoManifest {
  imageId: string;
  productId: string;
  /** Must match a separately reviewed official registry record. */
  irc: string;
  fileSha256: string;
  sourceAssetPath: string;
  packagingRevision: string;
  capturedAt: string;
  view: PhotoView;
  rights: PhotoRights;
  /** Manually confirmed: no visible patient or private prescription data. */
  noPatientData: boolean;
  reviewerPrimary: string;
  reviewerSecondary: string;
  verifiedPackageIdentity: boolean;
}
export interface PhotoAudit {
  eligible: boolean;
  reasons: string[];
  /** Image presence or manifest approval never implies model fine-tuning. */
  usedForModelTraining: false;
}

const HEX64=/^[0-9a-f]{64}$/i;
const IRC16=/^\d{16}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const VIEWS:PhotoView[]=['front','back','blister','bottle','ampoule','authenticity-label'];

export function auditIranPhotoManifest(
  entry:IranDrugPhotoManifest,
  approvedRegistryIrcs:ReadonlySet<string>,
  now=new Date().toISOString().slice(0,10)
):PhotoAudit {
  const reasons:string[]=[];
  if(!entry.imageId?.trim() || !entry.productId?.trim())reasons.push('شناسه تصویر و محصول ضروری است.');
  if(!IRC16.test(entry.irc))reasons.push('IRC تصویر باید ۱۶ رقمی باشد.');
  else if(!approvedRegistryIrcs.has(entry.irc))reasons.push('کد IRC هنوز در فهرست پروانه‌های تأییدشده قرار ندارد.');
  if(!HEX64.test(entry.fileSha256))reasons.push('SHA-256 معتبر تصویر وجود ندارد.');
  if(!entry.sourceAssetPath?.trim() ||
    /^https?:\/\//i.test(entry.sourceAssetPath) ||
    entry.sourceAssetPath.includes('..') ||
    entry.sourceAssetPath.includes('\\'))
    reasons.push('تصویر باید شناسه فایل خصوصی و کنترل‌شده داشته باشد، نه آدرس وب یا مسیر ناامن.');
  if(!entry.packagingRevision?.trim())reasons.push('نسخه طراحی بسته‌بندی نامشخص است.');
  if(!DATE.test(entry.capturedAt)||entry.capturedAt>now)reasons.push('تاریخ عکس معتبر نیست.');
  if(!VIEWS.includes(entry.view))reasons.push('زاویه تصویر غیرمجاز است.');
  if(!entry.noPatientData)reasons.push('احتمال افشای اطلاعات بیمار وجود دارد.');
  if(!entry.verifiedPackageIdentity)reasons.push('هویت فرآورده هنوز بازبینی نشده است.');
  if(!entry.reviewerPrimary?.trim() || !entry.reviewerSecondary?.trim() ||
     entry.reviewerPrimary===entry.reviewerSecondary)
    reasons.push('تأیید مستقل توسط دو بازبین متمایز لازم است.');

  const rights=entry.rights;
  if(!rights || !['pharmacist-original-photo','original-photo-with-consent','written-manufacturer-license'].includes(rights.basis))
    reasons.push('مبنای تهیه یا استفاده از تصویر ثبت نشده است.');
  // First-party pharmacy photography needs only a recorded authorship/use
  // attestation, not a fictional written agreement with the manufacturer.
  // Third-party photos still require documented permission for the intended use.
  if(!rights?.rightsHolder?.trim() || !rights?.permissionEvidenceId?.trim())
    reasons.push('عکاس/مالک عکس و شناسه ثبت رضایت یا خوداظهاری مالک مشخص نیست.');
  if(rights?.authorizedUse!=='clinical-reference-and-evaluation')
    reasons.push('مجوز تصویر باید استفاده برای کتابخانه مرجع و ارزیابی را پوشش دهد.');
  if(!DATE.test(rights?.permissionDate||'') || rights.permissionDate>now)
    reasons.push('تاریخ مجوز معتبر نیست.');
  if(rights?.expiresAt && (!DATE.test(rights.expiresAt) || rights.expiresAt<now))
    reasons.push('مجوز استفاده تصویر منقضی شده است.');
  return {eligible:reasons.length===0,reasons,usedForModelTraining:false};
}

export function auditIranPhotoSet(
  entries:readonly IranDrugPhotoManifest[],
  officialRegistryIrcs:ReadonlySet<string>
):{
  total:number;eligible:number;ineligible:number;
  duplicateHashes:string[];
  perView:Record<PhotoView,number>;
  perProductReady:number;
  reviewSummary:Array<{imageId:string;eligible:boolean;reasons:string[]}>;
}{
  const hashes=new Set<string>();
  const duplicateHashes:string[]=[];
  const perView=Object.fromEntries(VIEWS.map(view=>[view,0])) as Record<PhotoView,number>;
  const reviewSummary:Array<{imageId:string;eligible:boolean;reasons:string[]}>=[];
  const viewMap=new Map<string,Set<string>>();
  let eligible=0;
  for(const image of entries){
    const audit=auditIranPhotoManifest(image,officialRegistryIrcs);
    const reasons=[...audit.reasons];
    if(hashes.has(image.fileSha256)){
      duplicateHashes.push(image.fileSha256);
      reasons.push('تصویر با همان SHA-256 تکراری است.');
    }
    hashes.add(image.fileSha256);
    const accepted=reasons.length===0;
    if(accepted){
      eligible++;
      perView[image.view]++;
      const revisionKey=image.productId+'::'+image.packagingRevision;
      const views=viewMap.get(revisionKey)??new Set<string>();
      views.add(image.view);viewMap.set(revisionKey,views);
    }
    reviewSummary.push({imageId:image.imageId,eligible:accepted,reasons});
  }
  // A single front photo is not a complete product reference; both front and
  // back of the same product/revision should be checked before training/eval.
  const perProductReady=[...viewMap.values()].filter(s=>s.has('front')&&s.has('back')).length;
  return {
    total:entries.length,eligible,ineligible:entries.length-eligible,
    duplicateHashes:[...new Set(duplicateHashes)],perView,perProductReady,reviewSummary,
  };
}
