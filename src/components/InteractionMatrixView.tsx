import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type {
  DrugInteraction,
  MedicationItem,
  SeverityFilter,
} from '../types/pharmacy';
import {
  filterInteractionsBySeverity,
  formatPersianDigits,
} from '../utils/pharmacyLogic';

interface InteractionMatrixViewProps {
  medications: MedicationItem[];
  interactions: DrugInteraction[];
  isChecking: boolean;
  onRecheckWithAi: () => Promise<void>;
}

const FILTER_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'همه تداخل‌ها' },
  { value: 'major', label: 'شدید (Major)' },
  { value: 'moderate', label: 'متوسط (Moderate)' },
  { value: 'minor', label: 'خفیف (Minor)' },
];

export function InteractionMatrixView({
  medications,
  interactions,
  isChecking,
  onRecheckWithAi,
}: InteractionMatrixViewProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const filtered = filterInteractionsBySeverity(interactions, severityFilter);
  const majorCount = interactions.filter((i) => i.severity === 'major').length;
  const moderateCount = interactions.filter((i) => i.severity === 'moderate').length;
  const minorCount = interactions.filter((i) => i.severity === 'minor').length;

  return (
    <section
      aria-label="ماتریس بررسی تداخل‌های دارویی"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            بررسی جامع تداخل‌های دارویی نسخه
          </h1>
          <p className="mt-1 text-sm text-slate-500 tabular-nums">
            {medications.length > 0
              ? `${formatPersianDigits(medications.length)} قلم دارو در نسخه فعال · ${formatPersianDigits(
                  majorCount
                )} شدید · ${formatPersianDigits(moderateCount)} متوسط · ${formatPersianDigits(minorCount)} خفیف`
              : 'حداقل دو دارو به نسخه اضافه کنید تا تداخل‌های متقابل بررسی شود.'}
          </p>
        </div>

        <button
          type="button"
          disabled={medications.length < 2 || isChecking}
          onClick={onRecheckWithAi}
          className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          <span>تحلیل مجدد تداخل‌ها با هوش مصنوعی</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="فیلتر شدت تداخل دارویی"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const active = severityFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSeverityFilter(opt.value)}
                className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 tabular-nums">
          نمایش {formatPersianDigits(filtered.length)} مورد از {formatPersianDigits(interactions.length)} تداخل
        </span>
      </div>

      {/* Results */}
      {medications.length < 2 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            برای بررسی تداخل حداقل ۲ قلم دارو نیاز است
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            به بخش «اسکنر سریع» بروید و فیش نسخه را اسکن کنید یا داروی دوم را به نسخه فعال اضافه نمایید.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
          <ShieldCheck className="h-9 w-9 text-emerald-700" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-emerald-950">
            {severityFilter === 'all'
              ? 'تداخل بالینی شناخته‌شده‌ای میان این داروها ثبت نشد'
              : 'موردی با این درجه شدت در نسخه فعلی وجود ندارد'}
          </p>
          <p className="mt-1 text-xs text-emerald-900/80">
            برای اطمینان بیشتر در داروهای تخصصی می‌توانید «تحلیل مجدد تداخل‌ها با هوش مصنوعی» را اجرا کنید.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4" data-testid="interaction-list">
          {filtered.map((item) => {
            const isMajor = item.severity === 'major';
            const isModerate = item.severity === 'moderate';

            return (
              <article
                key={item.id}
                className={`rounded-xl border p-5 ${
                  isMajor
                    ? 'border-red-200 bg-red-50/60'
                    : isModerate
                      ? 'border-amber-200 bg-amber-50/60'
                      : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                  <h2 className="text-base font-bold text-slate-900">
                    {item.drugA}
                    <span className="mx-2 text-slate-400">+</span>
                    {item.drugB}
                  </h2>

                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      isMajor
                        ? 'text-red-800'
                        : isModerate
                          ? 'text-amber-800'
                          : 'text-slate-700'
                    }`}
                  >
                    {isMajor ? (
                      <AlertOctagon className="h-4 w-4" aria-hidden="true" />
                    ) : isModerate ? (
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Info className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>
                      {isMajor
                        ? 'تداخل شدید — نیازمند مداخله'
                        : isModerate
                          ? 'تداخل متوسط — نیازمند پایش'
                          : 'تداخل خفیف — اطلاع‌رسانی'}
                    </span>
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">مکانیسم تداخل</dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-800">{item.mechanism}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">اثر بالینی محتمل</dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-800">{item.clinicalEffect}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">راهکار و اقدام داروساز</dt>
                    <dd className="mt-1 text-sm font-medium leading-6 text-slate-900">
                      {item.management}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
