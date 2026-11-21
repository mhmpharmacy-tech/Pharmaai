import { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  Check,
  ChevronDown,
  Database,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  FORMULARY_CATEGORIES,
  type FormularyCategory,
  type FormularyDrugRecord,
} from '../data/localDrugFormulary';
import { countFormularyByCategory, searchLocalFormulary } from '../utils/localDrugSearch';
import { getClinicalEvidenceForDrug } from '../data/clinicalEvidence';
import { IRAN_REFERENCE_INDEX, IRAN_INDEX_PROVENANCE } from '../data/iranReference';
import { IRAN_MANUFACTURERS, IRAN_MARKET_PRODUCT_EXEMPLARS, IRAN_REGULATOR_PORTALS } from '../data/iranManufacturerProducts';
import { normalizeSearchText } from '../utils/localDrugSearch';
import { formatPersianDigits, getMedicationKey } from '../utils/pharmacyLogic';
import type { MedicationItem } from '../types/pharmacy';

interface LocalFormularyViewProps {
  catalog: FormularyDrugRecord[];
  storageEngine: 'indexeddb' | 'memory';
  activeMedications: MedicationItem[];
  onAddDrugToPrescription: (drug: FormularyDrugRecord) => void;
  onInspectDrugMonograph: (drug: FormularyDrugRecord) => void;
}

const PAGE_SIZE = 24;

export function LocalFormularyView({
  catalog,
  storageEngine,
  activeMedications,
  onAddDrugToPrescription,
  onInspectDrugMonograph,
}: LocalFormularyViewProps) {
  const [query, setQuery] = useState('');
  const [libraryView, setLibraryView] = useState<'clinical' | 'iran-index' | 'iran-products'>('clinical');
  const [iranQuery, setIranQuery] = useState('');
  const [iranVisible, setIranVisible] = useState(PAGE_SIZE);
  const [manufacturerQuery, setManufacturerQuery] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [manufacturerVisible, setManufacturerVisible] = useState(PAGE_SIZE);
  const [category, setCategory] = useState<FormularyCategory>('all');
  const [highAlertOnly, setHighAlertOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, highAlertOnly]);

  useEffect(() => setIranVisible(PAGE_SIZE), [iranQuery]);

  const indexedMatches = useMemo(() => {
    const words = normalizeSearchText(iranQuery).split(' ').filter(Boolean);
    if (!words.length) return IRAN_REFERENCE_INDEX;
    return IRAN_REFERENCE_INDEX.filter((entry) => {
      const normalizedHeading = normalizeSearchText(entry.heading);
      return words.every((word) => normalizedHeading.includes(word));
    });
  }, [iranQuery]);
  const indexedShown = indexedMatches.slice(0, iranVisible);

  useEffect(() => setManufacturerVisible(PAGE_SIZE), [manufacturerFilter, manufacturerQuery]);

  const matchedManufacturerProducts = useMemo(() => {
    const tokens = normalizeSearchText(manufacturerQuery).split(' ').filter(Boolean);
    return IRAN_MARKET_PRODUCT_EXEMPLARS.filter((product) => {
      if (manufacturerFilter !== 'all' && product.manufacturerId !== manufacturerFilter) return false;
      const maker = IRAN_MANUFACTURERS.find((m) => m.id === product.manufacturerId);
      const searchable = normalizeSearchText(
        [product.brand, product.genericName, product.strengthLabel, product.form, maker?.nameFa, maker?.nameEn].join(' ')
      );
      return tokens.every((token) => searchable.includes(token));
    });
  }, [manufacturerQuery, manufacturerFilter]);
  const manufacturerShown = matchedManufacturerProducts.slice(0, manufacturerVisible);

  const activeKeys = useMemo(
    () => new Set(activeMedications.map((m) => getMedicationKey(m))),
    [activeMedications]
  );

  const categoryCounts = useMemo(
    () => countFormularyByCategory(catalog),
    [catalog]
  );

  const highAlertTotal = useMemo(
    () => catalog.filter((item) => item.safety.highAlert).length,
    [catalog]
  );

  const filteredDrugs = useMemo(
    () => searchLocalFormulary(catalog, query, category, undefined, highAlertOnly),
    [catalog, query, category, highAlertOnly]
  );

  const displayedDrugs = useMemo(
    () => filteredDrugs.slice(0, visibleCount),
    [filteredDrugs, visibleCount]
  );

  const remainingCount = Math.max(0, filteredDrugs.length - displayedDrugs.length);

  const cachedCount = useMemo(
    () => catalog.filter((item) => item.cachedFromAi).length,
    [catalog]
  );

  if (libraryView === 'iran-products') {
    return (
      <section aria-label="نمونه محصولات و شرکت‌های داروسازی ایران"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">محصولات و تولیدکنندگان ایرانی</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {formatPersianDigits(IRAN_MARKET_PRODUCT_EXEMPLARS.length)} نمونه فرآورده از
              {formatPersianDigits(IRAN_MANUFACTURERS.length)} شرکت با منبع مشخص
            </p>
          </div>
          <button type="button" onClick={() => setLibraryView('clinical')}
            className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-teal-800">
            بازگشت به مونوگراف‌ها
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950" role="note">
          این نمونه‌ها صرفاً اطلاعات شرکت/برند/قدرت/فرم دارویی از کاتالوگ ۲۰۲۴ یا فهرست ثانویه‌اند.
          ثبت IRC و وضعیت فعلی تولید/عرضه، تصویر بسته و قیمت هنوز از TTAC به‌طور مستقل تأیید نشده‌اند.
          مدل هوش مصنوعی از تصاویر وب «آموزش مجدد» ندیده و تطبیق عکس فقط یک پیشنهاد برای بررسی است.
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input type="search" value={manufacturerQuery} onChange={(e) => setManufacturerQuery(e.target.value)}
            placeholder="جست‌وجوی برند، ماده مؤثره، قدرت یا تولیدکننده"
            aria-label="جست‌وجوی محصولات دارویی ایرانی"
            className="min-h-[44px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-700 focus:outline-none"
          />
          <select value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)}
            aria-label="فیلتر شرکت سازنده"
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-sm">
            <option value="all">همه تولیدکنندگان</option>
            {IRAN_MANUFACTURERS.map((maker) => (
              <option key={maker.id} value={maker.id}>{maker.nameFa}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-500" data-testid="iran-manufacturer-result-count">
          {formatPersianDigits(matchedManufacturerProducts.length)} نتیجه
        </p>
        {manufacturerShown.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">محصولی مطابق این جست‌وجو ثبت نشده است.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="iran-manufacturer-products">
            {manufacturerShown.map((product) => {
              const maker = IRAN_MANUFACTURERS.find((m) => m.id === product.manufacturerId);
              return (
                <li key={product.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-bold text-slate-900">{product.brand}</p>
                  <p className="mt-1 text-xs text-slate-700">{product.genericName}</p>
                  <p className="mt-1 text-xs text-slate-600" dir="ltr">
                    {product.strengthLabel} · {product.form}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-800">{maker?.nameFa}</p>
                  <p className="mt-2 text-[11px] text-amber-800">
                    IRC استعلام نشده · عکس مرجعِ مجاز ثبت نشده
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <a target="_blank" rel="noopener noreferrer" href={product.sourceUrl}
                      className="font-semibold text-teal-700 underline underline-offset-2">منبع ثبت محصول</a>
                    {product.externalPhotoPageUrl && (
                      <a target="_blank" rel="noopener noreferrer" href={product.externalPhotoPageUrl}
                        className="font-semibold text-teal-700 underline underline-offset-2">مشاهده صفحه حاوی عکس محصول</a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {matchedManufacturerProducts.length > manufacturerShown.length && (
          <button type="button" onClick={() => setManufacturerVisible((n) => n + PAGE_SIZE)}
            className="mt-5 min-h-[42px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-teal-800">
            نمایش موارد بیشتر ({formatPersianDigits(matchedManufacturerProducts.length - manufacturerShown.length)} باقی‌مانده)
          </button>
        )}
        <p className="mt-6 text-xs text-slate-600">
          بررسی شناسه اصالت و اطلاعات رسمی: <a href={IRAN_REGULATOR_PORTALS.ttac} target="_blank"
          rel="noopener noreferrer" className="font-semibold text-teal-700 underline">TTAC</a>
        </p>
      </section>
    );
  }

  if (libraryView === 'iran-index') {
    return (
      <section aria-label="نمایه آرشیوی داروهای ژنریک ایران"
        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">نمایه داروهای ژنریک ایران</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {formatPersianDigits(IRAN_REFERENCE_INDEX.length)} عنوان استخراج‌شده از کتاب آرشیوی
              ({formatPersianDigits(IRAN_INDEX_PROVENANCE.archiveYear)} میلادی)
            </p>
          </div>
          <button type="button" onClick={() => setLibraryView('clinical')}
            className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50">
            بازگشت به مونوگراف‌های دارویی ({formatPersianDigits(catalog.length)})
          </button>
        </div>
        <div role="note" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
          این بخش فقط فهرست نام‌های موجود در یک کتاب قدیمی است؛ دوز، شکل دارویی، مجوز فروش فعلی،
          موجودی و ایمنی هیچ‌یک از این مدخل‌ها تأیید نشده‌اند. از این نمایه نباید برای تجویز، محاسبه دوز
          یا بررسی تداخل استفاده شود. برای اطلاعات بالینی از بخش مونوگراف‌های بازبینی‌شونده استفاده کنید.
        </div>
        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"/>
          <input type="search" value={iranQuery} onChange={(event) => setIranQuery(event.target.value)}
            aria-label="جست‌وجوی نام فارسی یا انگلیسی در نمایه تاریخی ایران"
            placeholder="جست‌وجوی فارسی یا انگلیسی؛ مانند ایبوپروفن، Ibuprofen، متفورمین"
            className="min-h-[46px] w-full rounded-lg border border-slate-300 bg-white py-2 pr-10 pl-4 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>
        <p className="mt-3 text-xs text-slate-600" data-testid="iran-index-result-count">
          {formatPersianDigits(indexedMatches.length)} نتیجه از {formatPersianDigits(IRAN_REFERENCE_INDEX.length)} عنوان
        </p>
        {indexedShown.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-600">
            عنوانی مطابق عبارت جست‌وجو یافت نشد. املای فارسی یا انگلیسی را تغییر دهید.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="iran-index-list">
            {indexedShown.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold leading-7 text-slate-900">{entry.heading}</p>
                <p className="mt-2 text-xs text-slate-600">
                  صفحه PDF: {formatPersianDigits(entry.sourcePdfPage)} · فقط نمایه تاریخی · فاقد تأیید بالینی
                </p>
              </li>
            ))}
          </ul>
        )}
        {indexedMatches.length > indexedShown.length && (
          <button type="button" onClick={() => setIranVisible((count) => count + PAGE_SIZE)}
            className="mt-5 min-h-[42px] rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-100">
            نمایش موارد بیشتر ({formatPersianDigits(indexedMatches.length - indexedShown.length)} باقی‌مانده)
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      aria-label="بانک دارویی آفلاین و استعلام سریع ژنریک"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7"
    >
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              بانک دارویی آفلاین جامع (استعلام سریع ژنریک)
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              جستجوی آنی نام ژنریک انگلیسی، نام فارسی، برندهای رایج یا اندیکاسیون بدون نیاز به اینترنت برای مشاهده دوزینگ، هشدارهای ایمنی و افزودن مستقیم به نسخه.
            </p>
          </div>

          <div
            data-testid="formulary-total-badge"
            className="flex shrink-0 items-center gap-2 text-xs text-slate-500 tabular-nums"
          >
            <Database className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>
              {formatPersianDigits(catalog.length)} قلم دارو در{' '}
              {storageEngine === 'indexeddb' ? 'IndexedDB محلی' : 'حافظه محلی'}
              {cachedCount > 0 ? ` · ${formatPersianDigits(cachedCount)} ذخیره خودکار` : ''}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <p className="flex-1 text-xs leading-6 text-slate-700">
            <strong>{formatPersianDigits(catalog.length)} مونوگراف</strong> با فیلدهای بالینی (در انتظار بازبینی مستقل)
            <span className="mx-2">·</span>
            <strong>{formatPersianDigits(IRAN_REFERENCE_INDEX.length)} مدخل تاریخی</strong> صرفاً برای جست‌وجوی نام
            <span className="mx-2">·</span>
            <strong>{formatPersianDigits(IRAN_MARKET_PRODUCT_EXEMPLARS.length)} نمونه محصول ایرانی</strong> با هویت شرکت
          </p>
          <button type="button" onClick={() => setLibraryView('iran-index')}
            className="min-h-[38px] rounded-lg border border-teal-700 bg-white px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-50">
            نمایه ژنریک ایران
          </button>
          <button type="button" onClick={() => setLibraryView('iran-products')}
            className="min-h-[38px] rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800">
            تولیدکنندگان و محصولات
          </button>
        </div>

        <details className="mt-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-bold text-teal-800">برچسب‌های دارویی آمریکا · openFDA</summary>
          <p className="my-2 text-xs leading-6 text-slate-600">
            نمایهٔ اکسل برای هر ژنریک، تعداد رکوردهای هم‌نام و یک نمونه برچسب آمریکایی را نشان می‌دهد.
            پیش از استفادهٔ بالینی، ترکیب، شکل، قدرت و راه مصرف فرآورده را بررسی کنید.
          </p>
          <div className="flex flex-wrap gap-4 text-teal-800 underline">
            <a href={import.meta.env.BASE_URL + 'openfda/formulary-labels.csv'} download>دریافت نمایهٔ اکسل (CSV)</a>
            <a href={import.meta.env.BASE_URL + 'openfda/example-labels.zip'} download>متن کامل ۵ برچسب نمونه (JSON)</a>
            <a href={import.meta.env.BASE_URL + 'openfda/manifest.json'} download>مشخصات فایل‌ها و SHA-256</a>
            <a href="https://open.fda.gov/apis/drug/label/download/" target="_blank" rel="noreferrer">دانلود آرشیو از FDA</a>
          </div>
        </details>

        {/* Search Input + High-Alert Toggle */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="جستجوی نام ژنریک یا فارسی دارو در بانک آفلاین"
              placeholder="جستجوی سریع: ریواروکسابان، لانتوس، سیمبیکورت، روآکوتان، تامسولوسین، Clopidogrel..."
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="پاک کردن عبارت جستجو"
                className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
            <button
              type="button"
              aria-pressed={highAlertOnly}
              onClick={() => setHighAlertOnly((prev) => !prev)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                highAlertOnly
                  ? 'border-red-300 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>فقط داروهای پرخطر ({formatPersianDigits(highAlertTotal)})</span>
            </button>

            <span
              data-testid="formulary-result-count"
              className="shrink-0 text-xs text-slate-500 tabular-nums"
            >
              {formatPersianDigits(filteredDrugs.length)} نتیجه از {formatPersianDigits(catalog.length)} دارو
            </span>
          </div>
        </div>

        {/* Category Filter Tabs with Per-Category Counts */}
        <div
          role="group"
          aria-label="فیلتر رده درمانی داروها"
          className="mt-4 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {FORMULARY_CATEGORIES.map((tab) => {
            const active = category === tab.id;
            const count = categoryCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(tab.id)}
                className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    active ? 'text-teal-700 font-semibold' : 'text-slate-400'
                  }`}
                >
                  ({formatPersianDigits(count)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      {filteredDrugs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {query
              ? `دارویی با عبارت «${query}» در این فیلتر یافت نشد`
              : 'دارویی با فیلتر انتخاب‌شده یافت نشد'}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            می‌توانید فیلتر رده درمانی یا داروهای پرخطر را تغییر دهید، املای نام ژنریک را بررسی کنید یا در بخش «اسکنر سریع» استعلام آنلاین بگیرید تا به‌صورت خودکار در حافظه آفلاین ذخیره شود.
          </p>
          {(category !== 'all' || highAlertOnly || query) && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setHighAlertOnly(false);
              }}
              className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              نمایش همه {formatPersianDigits(catalog.length)} دارو
            </button>
          )}
        </div>
      ) : (
        <>
          <ul
            className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2"
            data-testid="formulary-list"
          >
            {displayedDrugs.map((drug) => {
              const isInActivePrescription = activeKeys.has(getMedicationKey(drug));
              const hasPendingReferenceNotes = getClinicalEvidenceForDrug(drug.genericName).length > 0;

              return (
                <li
                  key={drug.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 transition-colors duration-150 hover:border-slate-300"
                >
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="text-base font-bold text-slate-900">
                          {drug.persianName}
                        </h2>
                        <span className="font-latin text-xs font-semibold text-slate-500">
                          {drug.genericName}
                        </span>
                      </div>
                      <span className="font-clinical-mono text-xs font-semibold text-teal-800">
                        {drug.strength}
                      </span>
                    </div>

                    {/* Clean unboxed inline metadata */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span>{drug.dosageForm}</span>
                      <span aria-hidden="true">·</span>
                      <span>{drug.therapeuticClass}</span>
                      {drug.safety.highAlert && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                            <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>پرخطر</span>
                          </span>
                        </>
                      )}
                      {hasPendingReferenceNotes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-800">یادداشت علمی منبع‌دار؛ در انتظار بازبینی</span>
                        </>
                      )}
                      {drug.cachedFromAi && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-800">تولیدشده با AI؛ تأییدنشده</span>
                        </>
                      )}
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-6 text-slate-700">
                      <strong className="font-semibold text-slate-900">دوز بزرگسالان: </strong>
                      {drug.dosing.adultDose}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-500">
                      <strong className="font-medium text-slate-700">مصرف: </strong>
                      {drug.usage.withFood}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => onInspectDrugMonograph(drug)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      <span>مشاهده جزئیات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddDrugToPrescription(drug)}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        isInActivePrescription
                          ? 'border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                      }`}
                    >
                      {isInActivePrescription ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>در نسخه فعال</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>افزودن به نسخه</span>
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {remainingCount > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>
                  نمایش {formatPersianDigits(Math.min(PAGE_SIZE, remainingCount))} داروی بعدی (
                  {formatPersianDigits(remainingCount)} مورد باقیمانده)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredDrugs.length)}
                className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
              >
                نمایش همه {formatPersianDigits(filteredDrugs.length)} مورد
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
