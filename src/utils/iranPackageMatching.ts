import { IRAN_MANUFACTURERS, IRAN_MARKET_PRODUCT_EXEMPLARS, type IranianMarketProduct } from '../data/iranManufacturerProducts';

/** Untrusted text emitted by a visual OCR/model pass, not a verified product label. */
export interface ObservedPackageText {
  brand?: string;
  manufacturer?: string;
  generic?: string;
  strength?: string;
  dosageForm?: string;
  irc?: string;
  gtin?: string;
  visibleText?: string[];
  visualQuality?: 'clear' | 'partial' | 'unreadable';
}

export interface PackagingResolution {
  status: 'insufficient-evidence' | 'not-found' | 'ambiguous' | 'conflict' | 'catalog-candidate';
  productId?: string;
  manufacturerName?: string;
  brand?: string;
  genericName?: string;
  strengthLabel?: string;
  dosageForm?: string;
  sourceUrl?: string;
  sourceTier?: IranianMarketProduct['sourceTier'];
  reasons: string[];
  /** No product can ever be declared regulatory-verified using this list. */
  regulatoryVerified: false;
  /** No product photo has been loaded or used for model training here. */
  photoVerified: false;
}

const digits: Record<string, string> = {
  '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
};

export function normalizePackageText(text: string): string {
  return text.toLowerCase()
    .replace(/[۰-۹٠-٩]/g, (d) => digits[d] ?? d)
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u200c\u200d\u064b-\u065f\u0640®™]/g, '')
    .replace(/[‐‑–—]/g, '-')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedStrength(value: string): string {
  return value.toLowerCase()
    .replace(/[۰-۹٠-٩]/g, (ch) => digits[ch] ?? ch)
    .replace(/µg|μg/g, 'mcg')
    .replace(/milligrams?|میلی\s*گرم/g, 'mg')
    .replace(/milliliters?|میلی\s*لیتر/g, 'ml')
    .replace(/international\s*units?/g, 'iu')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/\(.*$/, '')
    .trim();
}

function strengthMatches(observed: string, catalog: string): boolean {
  const o = normalizedStrength(observed);
  const c = normalizedStrength(catalog);
  if (!o || !c) return false;
  if (o === c) return true;
  // A combination may be printed as "625 mg" or "500/125 mg".
  // Only accept exact declared alternative, never loose substring matches.
  const combo = catalog.match(/\(([^)]+)\)/);
  if (combo) {
    const alt = normalizedStrength(combo[1]);
    if (o === alt) return true;
    const num = alt.match(/^(\d+)\/(\d+)(mg)$/);
    if (num && o === `${num[1]}mg/${num[2]}mg`) return true;
  }
  return false;
}

export type PackagingForm = IranianMarketProduct['form'];

function formFromObserved(text: string): PackagingForm | null {
  const n = normalizePackageText(text);
  if (!n) return null;
  if (/prefilled|pre filled|سرنگ.*(پر|آماده)|pfs/.test(n)) return 'prefilled-syringe';
  if (/\b(?:injection\s+pen|auto[ -]?injector|pen)\b|قلم تزریق|قلم/.test(n)) return 'injection-pen';
  if (/suspension|powder.*susp|سوسپانسیون|پودر.*شربت/.test(n)) return 'oral-suspension';
  if (/chewable|جویدنی/.test(n)) return 'chewable-tablet';
  if (/softgel|soft gel|کپسول نرم/.test(n)) return 'softgel';
  if (/capsule|کپسول/.test(n)) return 'capsule';
  if (/tablet|قرص/.test(n)) return 'tablet';
  if (/vial|ویال|تزریقی/.test(n)) return 'injection-vial';
  return null;
}

function brandMatches(observed: string, brand: string): boolean {
  const o = normalizePackageText(observed);
  const b = normalizePackageText(brand);
  // Visible product may contain "Brand 125", but not a wholly different name.
  return Boolean(o && b && (o === b || o.startsWith(b + ' ')));
}

function manufacturerMatches(observed: string, companyId: string): boolean | null {
  if (!observed.trim()) return null;
  const maker = IRAN_MANUFACTURERS.find((x) => x.id === companyId);
  if (!maker) return false;
  const s = normalizePackageText(observed);
  const names = [maker.nameFa, maker.nameEn, maker.id].map(normalizePackageText);
  return names.some((name) => s === name || s.includes(name) || name.includes(s) && s.length >= 4);
}

function result(status: PackagingResolution['status'], reasons: string[], product?: IranianMarketProduct): PackagingResolution {
  const maker = product && IRAN_MANUFACTURERS.find((m) => m.id === product.manufacturerId);
  return {
    status, reasons,
    ...(product ? {
      productId: product.id,
      manufacturerName: maker?.nameFa,
      brand: product.brand,
      genericName: product.genericName,
      strengthLabel: product.strengthLabel,
      dosageForm: product.form,
      sourceUrl: product.sourceUrl,
      sourceTier: product.sourceTier,
    } : {}),
    regulatoryVerified: false,
    photoVerified: false,
  };
}

/**
 * Fail-closed reconciliation; only texts explicitly reported as visible on the
 * uploaded package are assessed. No image embedding, web scraping, or auto
 * verification of license, price, authenticity or current availability.
 */
export function matchIranianPackage(
  observed: ObservedPackageText,
  catalog: readonly IranianMarketProduct[] = IRAN_MARKET_PRODUCT_EXEMPLARS
): PackagingResolution {
  if (observed.visualQuality === 'unreadable') {
    return result('insufficient-evidence', ['تصویر برای شناسایی بسته‌بندی خوانا نیست.']);
  }
  if (!observed.brand?.trim() || !observed.strength?.trim()) {
    return result('insufficient-evidence', ['نام برند و قدرت دارو باید واقعاً روی بسته قابل‌خواندن باشند.']);
  }

  const brands = catalog.filter((p) => brandMatches(observed.brand!, p.brand));
  if (brands.length === 0) return result('not-found', ['برند در نمونه‌های محدود محصولات ایرانی ثبت نشده؛ نبود رکورد به معنی جعلی‌بودن نیست.']);

  // A label such as "Zaxime 200" cannot match the 400-mg product even when
  // the model separately (and inconsistently) reads "400 mg" from the image.
  const brandsWithConsistentSuffix = brands.filter((p) => {
    const normalizedBrand = normalizePackageText(observed.brand!);
    const normalizedProductBrand = normalizePackageText(p.brand);
    const remainder = normalizedBrand.slice(normalizedProductBrand.length).trim();
    const suffixStrength = remainder.match(/^(\d+(?:\.\d+)?)$/);
    if (!suffixStrength) return true;
    return normalizedStrength(p.strengthLabel).startsWith(suffixStrength[1] + 'mg')
      || normalizedStrength(p.strengthLabel).startsWith(suffixStrength[1] + 'iu')
      || normalizedStrength(p.strengthLabel).startsWith(suffixStrength[1] + 'mcg');
  });
  if (!brandsWithConsistentSuffix.length) {
    return result('conflict', ['عدد درج‌شده در نام تجاری با قدرت ثبت‌شده روی بسته مغایرت دارد.']);
  }

  const exactStrengths = brandsWithConsistentSuffix.filter((p) => strengthMatches(observed.strength!, p.strengthLabel));
  if (!exactStrengths.length) {
    return result('conflict', ['قدرت خوانده‌شده با رکوردهای برند تطبیق ندارد؛ امکان اشتباه OCR یا تفاوت فرآورده وجود دارد.']);
  }
  const observedForm = formFromObserved(observed.dosageForm || '');
  const afterForm = observedForm ? exactStrengths.filter((p) => p.form === observedForm) : exactStrengths;
  if (!afterForm.length) return result('conflict', ['شکل دارویی مشاهده‌شده با فرآورده‌های دارای این برند و قدرت مطابقت ندارد.']);

  const generic = normalizePackageText(observed.generic || '');
  const afterGeneric = generic
    ? afterForm.filter((p) => normalizePackageText(p.genericName) === generic)
    : afterForm;
  if (!afterGeneric.length) return result('conflict', ['ماده مؤثره مشاهده‌شده با رکورد کاتالوگ تفاوت دارد.']);

  const afterMaker = afterGeneric.filter((p) => manufacturerMatches(observed.manufacturer || '', p.manufacturerId) !== false);
  if (!afterMaker.length) return result('conflict', ['نام تولیدکننده با کاتالوگ این محصول همخوانی ندارد.']);

  if (afterMaker.length !== 1) {
    return result('ambiguous', ['چند محصول مشابه یافت شد؛ شکل دارویی، تولیدکننده و شناسه اصالت باید بررسی شوند.']);
  }
  const candidate = afterMaker[0];
  if (!observed.manufacturer?.trim() || !observed.dosageForm?.trim()) {
    return result('ambiguous', ['برای ارزیابی دقیق‌تر، نام شرکت و شکل دارویی روی جعبه باید دیده شوند.'], candidate);
  }
  return result('catalog-candidate', [
    'نام برند، قدرت، شکل دارویی و شرکت با یک نمونه کاتالوگ همخوانی دارد.',
    'این فقط تطبیق متن بسته‌بندی است؛ اصالت/مجوز IRC، عکس مرجع و درستی تشخیص هنوز تأیید نشده‌اند.',
  ], candidate);
}
