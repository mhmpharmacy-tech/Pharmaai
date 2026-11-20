/**
 * Server-side image input guard for pharmacy packaging and prescriptions.
 * Payloads are ephemeral; this module does not retain image files.
 */
export interface ValidatedImageInput {
  cleanBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  byteLength: number;
}

export class ImageInputError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = 'ImageInputError';
  }
}

const MAX_BYTES = 7 * 1024 * 1024;
const MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateImageInput(image: unknown, providedMime: unknown): ValidatedImageInput {
  if (typeof image !== 'string') throw new ImageInputError('تصویر معتبر ارسال نشده است.');
  let base64 = image;
  let dataMime = '';
  if (image.startsWith('data:')) {
    const separator = image.indexOf(',');
    if (separator <= 0) throw new ImageInputError('ساختار تصویر معتبر نیست.');
    const header = image.slice(0, separator);
    const match = header.match(/^data:(image\/(?:jpeg|png|webp));base64$/);
    if (!match) throw new ImageInputError('فرمت فایل تصویر پشتیبانی نمی‌شود.');
    dataMime = match[1];
    base64 = image.slice(separator + 1);
  }
  const mime = dataMime || providedMime;
  if (typeof mime !== 'string' || !MIME.has(mime)) {
    throw new ImageInputError('فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود.');
  }
  if (dataMime && typeof providedMime === 'string' && providedMime !== dataMime) {
    throw new ImageInputError('نوع فایل با اطلاعات تصویری ارسال‌شده متفاوت است.');
  }
  if (!base64 || base64.length > Math.ceil(MAX_BYTES / 3) * 4 + 8) {
    throw new ImageInputError('حجم تصویر بیش از حد مجاز است (حداکثر ۷ مگابایت).');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    throw new ImageInputError('تصویر دارای داده خراب یا نامعتبر است.');
  }
  const data = Buffer.from(base64, 'base64');
  if (!data.length || data.length > MAX_BYTES) {
    throw new ImageInputError('حجم تصویر معتبر نیست (حداکثر ۷ مگابایت).');
  }
  const realMime = data.length >= 12 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
    ? 'image/jpeg'
    : data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      ? 'image/png'
      : data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF'
        && data.toString('ascii', 8, 12) === 'WEBP'
        ? 'image/webp' : null;
  if (realMime !== mime) {
    throw new ImageInputError('فرمت واقعی فایل با فرمت اعلام‌شده یکسان نیست.');
  }
  return {
    cleanBase64: base64,
    mimeType: mime as ValidatedImageInput['mimeType'],
    byteLength: data.length,
  };
}
