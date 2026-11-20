import { useEffect, useMemo, useState } from 'react';
import { Download, ImagePlus, Search, Trash2, CheckCircle } from 'lucide-react';
import { DAROOYAB_GENERIC_REFERENCE_LINKS } from '../data/darooyabPublicFacts';
import { IRAN_EDITABLE_REVIEW_SEEDS, REVIEW_DRAFT_STORAGE_KEY,
  readIranProductReviewDrafts, newReviewDraft, sanitizeReviewDraft,
  validateIranReviewDraft, exportIranReviewSnapshot,
  type DraftsByProduct, type ProductReviewDraft } from '../utils/iranProductReview';
import { getIranProductPhoto, saveIranProductPhoto, deleteIranProductPhoto, type IranProductPhotoView } from '../utils/iranProductPhotoStore';
import { normalizeSearchText } from '../utils/localDrugSearch';

const FIELDS = [
  ['ingredient','نام ژنریک / مواد مؤثره'],
  ['strength','قدرت یا غلظت'],
  ['dosageForm','شکل دارویی'],
  ['packageSize','حجم یا تعداد در بسته'],
  ['manufacturer','شرکت تولیدکننده'],
  ['importer','شرکت واردکننده / نماینده'],
  ['irc','IRC شانزده رقمی'],
  ['gtin','GTIN شناسه کالا'],
  ['officialPriceRial','قیمت بررسی‌شده (ریال)'],
  ['officialPriceCheckedAt','تاریخ استعلام قیمت (YYYY-MM-DD)'],
  ['pharmacyNote','یادداشت داروساز و اختلاف منابع'],
] as const;

export function IranProductReviewPanel({onBack}:{onBack:()=>void}) {
  const [drafts,setDrafts]=useState<DraftsByProduct>(()=>{
    try{return typeof window==='undefined'?{}:readIranProductReviewDrafts(localStorage.getItem(REVIEW_DRAFT_STORAGE_KEY))}
    catch{return {}}
  });
  const [selectedId,setSelectedId]=useState(IRAN_EDITABLE_REVIEW_SEEDS[0]?.id??'');
  const [query,setQuery]=useState('');
  const [source,setSource]=useState('all');
  const [onlyPending,setOnlyPending]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [photos,setPhotos]=useState<Record<string,string>>({});
  const selected=IRAN_EDITABLE_REVIEW_SEEDS.find(x=>x.id===selectedId);
  const draft=selected?drafts[selected.id]??newReviewDraft():newReviewDraft();

  useEffect(()=>{
    try{localStorage.setItem(REVIEW_DRAFT_STORAGE_KEY,JSON.stringify(drafts))}
    catch{setError('حافظه محلی کافی نیست؛ خروجی JSON تهیه کنید.')}
  },[drafts]);
  useEffect(()=>{
    if(!selected)return;
    let active=true;const urls:string[]=[];
    setPhotos({});
    Promise.all((['front','back'] as const).map(async view=>{
      try{
        const result=await getIranProductPhoto(selected.id,view);
        if(!result)return null;
        const url=URL.createObjectURL(result.blob);urls.push(url);
        return [view,url] as const;
      }catch{return null}
    })).then(rows=>{
      if(active)setPhotos(Object.fromEntries(rows.filter(x=>x!==null)));
      else urls.forEach(u=>URL.revokeObjectURL(u));
    });
    return()=>{active=false;urls.forEach(u=>URL.revokeObjectURL(u));};
  },[selectedId,draft.photoFrontStored,draft.photoBackStored]);

  const filtered=useMemo(()=>{
    const words=normalizeSearchText(query).split(' ').filter(Boolean);
    return IRAN_EDITABLE_REVIEW_SEEDS.filter(p=>
      (source==='all'||p.sourceType===source)&&
      (!onlyPending||!drafts[p.id]?.pharmacistIdentityChecked)&&
      words.every(w=>normalizeSearchText([p.brand,p.ingredient,p.strength,p.manufacturer,p.importer].join(' ')).includes(w))
    );
  },[query,source,onlyPending,drafts]);

  function change(key:typeof FIELDS[number][0],value:string) {
    if(!selected)return;
    setError('');setNotice('');
    setDrafts(prev=>{
      const earlier=sanitizeReviewDraft(prev[selected.id]);
      return {...prev,[selected.id]:{...earlier,[key]:value||null,
        pharmacistIdentityChecked:false,editedAt:new Date().toISOString()}};
    });
  }
  function markChecked(){
    if(!selected)return;
    const next:ProductReviewDraft={...draft,pharmacistIdentityChecked:true,editedAt:new Date().toISOString()};
    const problems=validateIranReviewDraft(selected,next);
    if(problems.length){setError(problems.join(' '));return}
    setDrafts(prev=>({...prev,[selected.id]:next}));
    setNotice('بررسی هویت محصول ثبت شد؛ این اقدام به معنی تأیید رسمی IRC یا دوزهای بالینی نیست.');
  }
  async function upload(view:IranProductPhotoView,file:File|null){
    if(!selected||!file)return;
    try{
      await saveIranProductPhoto(selected.id,view,file);
      setDrafts(prev=>{
        const old=sanitizeReviewDraft(prev[selected.id]);
        return {...prev,[selected.id]:{...old,
          [view==='front'?'photoFrontStored':'photoBackStored']:true,
          pharmacistIdentityChecked:false,editedAt:new Date().toISOString()}};
      });
      setNotice('عکس در همین مرورگر ذخیره شد؛ به سرور یا مدل ارسال نشده است.');setError('');
    }catch(e){setError(e instanceof Error?e.message:'خطا در ذخیره عکس')}
  }
  async function removePhoto(view:IranProductPhotoView){
    if(!selected)return;
    try{
      await deleteIranProductPhoto(selected.id,view);
      setDrafts(prev=>{
        const old=sanitizeReviewDraft(prev[selected.id]);
        return {...prev,[selected.id]:{...old,
          [view==='front'?'photoFrontStored':'photoBackStored']:false,
          pharmacistIdentityChecked:false,editedAt:new Date().toISOString()}};
      });
      setNotice('عکس محلی پاک شد.');
    }catch(e){setError(e instanceof Error?e.message:'حذف عکس ممکن نشد')}
  }
  function exportJson(){
    const blob=new Blob([JSON.stringify(exportIranReviewSnapshot(drafts),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='pharmaai-iran-product-review.json';link.click();
    URL.revokeObjectURL(url);
    setNotice('JSON دانلود شد. عکس‌های محلی در خروجی JSON گنجانده نشده‌اند.');
  }
  const checked=IRAN_EDITABLE_REVIEW_SEEDS.filter(p=>drafts[p.id]?.pharmacistIdentityChecked).length;
  return <section dir="rtl" aria-label="ویرایش و تکمیل محصولات ایرانی"
    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-extrabold text-slate-900">ویرایش بانک فرآورده‌های ایران</h1>
        <p className="mt-1 text-sm leading-7 text-slate-600">
          {IRAN_EDITABLE_REVIEW_SEEDS.length} فرآورده: ۲۵ صفحه محصول دارویاب، ۵۴ مورد کاتالوگی و
          {DAROOYAB_GENERIC_REFERENCE_LINKS.length} لینک مرجع ژنریک.
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={exportJson} type="button" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-bold text-white"><Download className="h-4 w-4"/> دریافت JSON</button>
        <button onClick={onBack} type="button" className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-xs">بازگشت</button>
      </div>
    </div>
    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">
      داده منبع صرفاً اطلاعات هویتی است؛ متن و تصاویر دارویاب کپی نشده‌اند.
      خانه‌های نامشخص خالی هستند. هیچ رکوردی از این پنل خودکار به بانک درمانی تأییدشده منتقل نمی‌شود.
      اصلاحات و عکس‌ها فقط در مرورگر دستگاه فعلی ذخیره می‌شوند.
    </p>
    <p className="mt-3 text-xs text-slate-600">{filtered.length} نتیجه · {checked} بررسی هویت محلی · ۰ تأیید رسمی IRC</p>
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.6fr)]">
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center gap-2"><Search className="h-4 w-4 text-slate-500"/>
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="برند، ژنریک، شرکت" aria-label="جست‌وجوی محصول" className="min-h-[42px] w-full text-sm outline-none"/>
        </div>
        <select value={source} onChange={e=>setSource(e.target.value)} aria-label="انتخاب منبع"
          className="mt-2 min-h-[40px] w-full rounded-lg border border-slate-300 bg-white text-xs">
          <option value="all">همه منابع</option>
          <option value="darooyab-public">دارویاب</option>
          <option value="manufacturer-2024">کاتالوگ تولیدکننده ۲۰۲۴</option>
          <option value="secondary-catalogue">کاتالوگ ثانویه</option>
        </select>
        <label className="mt-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyPending} onChange={e=>setOnlyPending(e.target.checked)}/> فقط بررسی‌نشده‌ها</label>
        <ul className="mt-3 max-h-[570px] space-y-1 overflow-y-auto">
          {filtered.map(p=><li key={p.id}>
            <button type="button" onClick={()=>{setSelectedId(p.id);setError('');setNotice('')}}
              aria-current={selectedId===p.id?'true':undefined}
              className={'w-full rounded-lg p-3 text-right '+(selectedId===p.id?'bg-teal-50 ring-1 ring-teal-200':'hover:bg-slate-50')}>
              <span className="block text-xs font-bold" dir="auto">{p.brand}</span>
              <span className="block text-[11px] text-slate-600" dir="auto">{p.strength??'قدرت نامعلوم'} · {p.manufacturer??'شرکت نامعلوم'}</span>
            </button>
          </li>)}
        </ul>
      </div>
      <div className="min-w-0 rounded-xl border border-slate-200 p-3 sm:p-4">
        {selected&&<>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold" dir="auto">{selected.brand}</h2>
            <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="min-h-[38px] rounded-lg border border-teal-300 px-3 py-2 text-xs font-semibold text-teal-800">مشاهده صفحه منبع</a>
          </div>
          {selected.integrityWarning&&<p role="alert" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-950">ناسازگاری منبع: {selected.integrityWarning}</p>}
          {selected.genericReferenceUrl&&<a href={selected.genericReferenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-teal-700 underline">مرجع ژنریک دارویاب</a>}
          <p className="mt-3 text-xs leading-6 text-slate-600">مقدار منبع زیر فیلد مشخص است. تغییر جدید را در کادر بنویس؛ مقدار اولیه حفظ می‌شود.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map(([key,label])=>{
              const baseValue=(selected as unknown as Record<string,unknown>)[key];
              return <label key={key} className={key==='pharmacyNote'?'sm:col-span-2':''}>
                <span className="block text-xs font-semibold text-slate-800">{label}</span>
                <input value={draft[key]??''} onChange={e=>change(key,e.target.value)} dir="auto"
                  placeholder="در صورت نیاز تکمیل یا اصلاح کنید"
                  className="mt-1 min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-teal-700 focus:outline-none"/>
                <span className="mt-1 block text-[10px] text-slate-500" dir="auto">{baseValue?'منبع: '+String(baseValue):'در منبع ثبت نشده'}</span>
              </label>;
            })}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['front','back'] as const).map(view=><div key={view} className="rounded-xl border border-dashed border-slate-300 p-3">
              <strong className="text-xs">عکس {view==='front'?'جلو':'پشت'} بسته (شخصی)</strong>
              {photos[view]&&<img src={photos[view]} alt={'عکس بسته '+selected.brand} className="mt-2 max-h-[180px] w-full object-contain"/>}
              <label className="mt-2 inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-teal-200 px-3 text-xs text-teal-700">
                <ImagePlus className="h-4 w-4"/> افزودن عکس
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={e=>{void upload(view,e.target.files?.[0]??null);e.target.value=''}}/>
              </label>
              {draft[view==='front'?'photoFrontStored':'photoBackStored']&&<button type="button" onClick={()=>void removePhoto(view)} className="ms-2 inline-flex min-h-[40px] items-center gap-1 text-xs text-red-700"><Trash2 className="h-4 w-4"/> حذف</button>}
            </div>)}
          </div>
          <p className="mt-2 text-[11px] text-slate-600">تصاویر را بدون نام بیمار، نسخه یا برچسب خصوصی ثبت کن. عکس‌ها در JSON خروجی نیستند و مدل با آن‌ها آموزش نمی‌بیند.</p>
          {error&&<p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p>}
          {notice&&<p role="status" className="mt-3 rounded-lg bg-teal-50 p-3 text-xs text-teal-800">{notice}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={markChecked} type="button" className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white"><CheckCircle className="h-4 w-4"/> ثبت بررسی هویت</button>
            <button type="button" onClick={()=>{setDrafts(prev=>{const x={...prev};delete x[selected.id];return x});setNotice('اصلاحات متنی پاک شدند؛ عکس‌های محلی باقی هستند.')}} className="min-h-[42px] rounded-lg border border-slate-300 px-4 text-xs">بازنشانی اصلاحات</button>
          </div>
        </>}
      </div>
    </div>
  </section>;
}
