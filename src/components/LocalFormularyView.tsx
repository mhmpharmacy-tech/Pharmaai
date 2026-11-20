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
  const [category, setCategory] = useState<FormularyCategory>('all');
  const [highAlertOnly, setHighAlertOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category, highAlertOnly]);

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
