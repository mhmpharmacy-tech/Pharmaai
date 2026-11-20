/** Browser-only, private first-party product packaging photos.
 * Product images are not uploaded, not licensed from Darooyab and not used to
 * fine-tune an AI. Do not capture patients, prescriptions, personal labels.
 */
export type IranProductPhotoView='front'|'back';
export interface StoredIranProductPhoto {
  key:string;productId:string;view:IranProductPhotoView;
  blob:Blob; filename:string;sha256:string;storedAt:string;
}
const DB='pharmaai-iran-original-pack-photos-v1';
const STORE='photos';
const LIMIT=7*1024*1024;
const ALLOWED=new Set(['image/jpeg','image/png','image/webp']);

function dbOpen():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined')return reject(new Error('مرورگر ذخیره‌سازی محلی تصاویر را پشتیبانی نمی‌کند.'));
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('خطا در دسترسی به بانک عکس محلی'));
  });
}
export function validMedicinePhotoBytes(bytes:Uint8Array,mimeType:string):boolean{
  if(!ALLOWED.has(mimeType)||bytes.length===0||bytes.length>LIMIT)return false;
  const jpeg=mimeType==='image/jpeg'&&bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const png=mimeType==='image/png'&&bytes.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
  const webp=mimeType==='image/webp'&&bytes.length>=12
    &&String.fromCharCode(...bytes.slice(0,4))==='RIFF'
    &&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  return jpeg||png||webp;
}
export async function saveIranProductPhoto(productId:string,view:IranProductPhotoView,file:File){
  if(!productId||!['front','back'].includes(view))throw new Error('مشخصات محصول یا نمای عکس معتبر نیست.');
  if(!ALLOWED.has(file.type)||file.size>LIMIT||file.size<20)throw new Error('فقط تصویر JPG، PNG یا WebP تا حجم ۷ مگابایت پذیرفته است.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!validMedicinePhotoBytes(bytes,file.type))throw new Error('امضای واقعی فایل با فرمت اعلامی تصویر همخوان نیست.');
  if(typeof crypto==='undefined'||!crypto.subtle)throw new Error('امکان محاسبه هش امن تصویر در مرورگر وجود ندارد.');
  const hex=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
    .map(b=>b.toString(16).padStart(2,'0')).join('');
  const key=productId+':'+view;
  const photo:StoredIranProductPhoto={
    key,productId,view,blob:file,filename:file.name.slice(0,128),
    sha256:hex,storedAt:new Date().toISOString(),
  };
  const db=await dbOpen();
  try{
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(photo);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('ذخیره عکس انجام نشد.'));
      tx.onabort=()=>reject(tx.error||new Error('ذخیره عکس لغو شد.'));
    });
  }finally{db.close();}
  return {key,filename:photo.filename,sha256:photo.sha256};
}
export async function getIranProductPhoto(productId:string,view:IranProductPhotoView):Promise<StoredIranProductPhoto|null>{
  const db=await dbOpen();
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const r=tx.objectStore(STORE).get(productId+':'+view);
      r.onsuccess=()=>resolve((r.result as StoredIranProductPhoto|undefined)??null);
      r.onerror=()=>reject(r.error||new Error('خطا در خواندن عکس'));
    });
  }finally{db.close();}
}
export async function deleteIranProductPhoto(productId:string,view:IranProductPhotoView):Promise<void>{
  const db=await dbOpen();
  try{
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(productId+':'+view);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||new Error('خطا در حذف عکس'));
    });
  }finally{db.close();}
}
