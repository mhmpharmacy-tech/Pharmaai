import { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Info,
  Layers,
  Pill,
  ShieldAlert,
  Utensils,
} from 'lucide-react';
import type { DrugInteraction, MedicationItem } from '../types/pharmacy';
import { EVIDENCE_REFERENCES, EXTERNAL_REFERENCE_PORTALS, getClinicalEvidenceForDrug } from '../data/clinicalEvidence';
import {
  formatPersianDigits,
  getInteractionsForMedication,
  QUICK_DOSING_SCHEDULE_PRESETS,
  validateCustomDosingSchedule,
} from '../utils/pharmacyLogic';

interface ClinicalMonographViewProps {
  medication: MedicationItem | null;
  allInteractions: DrugInteraction[];
  onUpdateDosingSchedule: (id: string, schedule: string) => void;
  onOpenInteractionsTab: () => void;
}

type DetailSection = 'all' | 'dosing' | 'interactions' | 'safety' | 'usage';

const SECTION_TABS: { id: DetailSection; label: string }[] = [
  { id: 'all', label: 'نمای کامل' },
  { id: 'dosing', label: 'دوزینگ' },
  { id: 'interactions', label: 'تداخل‌ها' },
  { id: 'safety', label: 'ایمنی و هشدارها' },
  { id: 'usage', label: 'تنوع و نحوه مصرف' },
];

export function ClinicalMonographView({
  medication,
  allInteractions,
  onUpdateDosingSchedule,
  onOpenInteractionsTab,
}: ClinicalMonographViewProps) {
  const [section, setSection] = useState<DetailSection>('all');
  const [scheduleDraft, setScheduleDraft] = useState(medication?.customDosingSchedule ?? '');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  useEffect(() => {
    setScheduleDraft(medication?.customDosingSchedule ?? '');
    setScheduleError(null);
    setScheduleSaved(false);
  }, [medication?.id, medication?.customDosingSchedule]);

  const handleSaveMonographSchedule = (value: string) => {
    if (!medication) return;
    const check = validateCustomDosingSchedule(value);
    if (!check.valid) {
      setScheduleError(check.error ?? 'مقدار نامعتبر است.');
      return;
    }
    onUpdateDosingSchedule(medication.id, check.normalized);
    setScheduleDraft(check.normalized);
    setScheduleError(null);
    setScheduleSaved(true);
    window.setTimeout(() => setScheduleSaved(false), 2000);
  };

  if (!medication) {
    return (
      <section
        aria-label="جزئیات بالینی دارو"
        className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-8 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
          <Pill className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          مونوگراف بالینی و راهنمای داروساز
        </h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
          پس از اسکن نسخه یا جلد دارو، یکی از اقلام دارویی را انتخاب کنید تا دوزینگ بزرگسالان و کودکان، تداخل‌های دارویی، هشدارهای ایمنی و تنوع اشکال مصرفی آن نمایش داده شود.
        </p>
      </section>
    );
  }

  const relatedInteractions = getInteractionsForMedication(medication, allInteractions);
  const evidenceNotes = getClinicalEvidenceForDrug(medication.genericName);
  const showDosing = section === 'all' || section === 'dosing';
  const showInteractions = section === 'all' || section === 'interactions';
  const showSafety = section === 'all' || section === 'safety';
  const showUsage = section === 'all' || section === 'usage';

  return (
    <article
      aria-label={`جزئیات بالینی ${medication.persianName}`}
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7"
    >
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {medication.persianName}
              </h2>
              <span className="font-latin text-sm font-semibold text-slate-500">
                {medication.genericName}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
              <span className="font-clinical-mono font-semibold text-teal-800">
                {medication.strength}
              </span>
              <span aria-hidden="true">·</span>
              <span>{medication.dosageForm}</span>
              <span aria-hidden="true">·</span>
              <span>{medication.therapeuticClass}</span>
              {medication.brandName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>برند رایج: {medication.brandName}</span>
                </>
              )}
            </div>
          </div>

          {medication.safety.highAlert && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700">
              <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>داروی پرخطر (High-Alert)</span>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950" role="note">
          اطلاعات درمانی و دوزهای این رکورد هنوز به‌طور مستقل توسط داروساز تأیید نشده‌اند.
          {medication.verificationStatus === 'unverified-ai'
            ? ' بخشی از محتوا توسط مدل هوش مصنوعی تولید شده است.'
            : ' متن قدیمی کتابخانه نیز نیاز به تطبیق با برچسب روز و اندیکاسیون دارد.'}
          <strong className="mr-1">صرف مشاهده یادداشت‌های منبع‌دار به معنی تأیید دوز نیست.</strong>
        </div>

        {/* Section Filter Bar */}
        <div
          role="tablist"
          aria-label="بخش‌های اطلاعات بالینی دارو"
          className="no-print mt-4 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {SECTION_TABS.map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSection(tab.id)}
                className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {tab.id === 'interactions' && relatedInteractions.length > 0
                  ? ` (${formatPersianDigits(relatedInteractions.length)})`
                  : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* 1. Dosing */}
        {showDosing && (
          <section aria-labelledby="heading-dosing">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <h3 id="heading-dosing" className="text-base font-bold text-slate-900">
                دوزینگ و رژیم درمانی
              </h3>
            </div>

            {medication.dosing.prescribedRegimen && (
              <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-950">
                <span className="font-bold">دستور ثبت‌شده در نسخه / جلد: </span>
                <span>{medication.dosing.prescribedRegimen}</span>
              </div>
            )}

            {/* Pharmacist Custom Daily Dosing Schedule */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMonographSchedule(scheduleDraft);
              }}
              className="no-print mt-3 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="monograph-custom-schedule"
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
                >
                  <Clock className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span>برنامه مصرف روزانه اختصاصی داروساز</span>
                </label>
                {scheduleSaved && (
                  <span className="text-xs font-semibold text-teal-700">
                    در سبد نسخه ذخیره شد
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="monograph-custom-schedule"
                  type="text"
                  value={scheduleDraft}
                  onChange={(e) => {
                    setScheduleDraft(e.target.value);
                    if (scheduleError) setScheduleError(null);
                  }}
                  placeholder="مثلاً: هر ۸ ساعت ۱ عدد یا روزی ۲ بار همراه غذا"
                  className="min-h-[40px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
                >
                  ثبت برنامه مصرف
                </button>
              </div>

              {scheduleError && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  {scheduleError}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {QUICK_DOSING_SCHEDULE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSaveMonographSchedule(preset)}
                    className="min-h-[32px] whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-teal-600/50 hover:bg-teal-50/50 hover:text-teal-800"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>

            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-500">دوز معمول بزرگسالان</dt>
                <dd className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.dosing.adultDose}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-500">دوز کودکان</dt>
                <dd className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.dosing.pediatricDose}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-500">حداکثر دوز مجاز روزانه</dt>
                <dd className="mt-1.5 text-sm font-semibold leading-7 text-slate-900">
                  {medication.dosing.maxDailyDose}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <dt className="text-xs font-semibold text-slate-500">تنظیم دوز کلیوی و کبدی</dt>
                <dd className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.dosing.renalHepaticAdjustment}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* Pharmacist-reviewed citation queue: never silently rewrite dosing fields. */}
        {showDosing && (
          <section aria-labelledby="heading-evidence" className="border-t border-slate-100 pt-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="heading-evidence" className="text-base font-bold text-slate-900">
                نکات مرجع و بررسی علمی
              </h3>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                در انتظار تأیید داروساز
              </span>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              نکات زیر خلاصه‌های مستقل و ارجاع‌دار از منابع آموزشی هستند؛ تأیید اعتبار دوزهای بالای صفحه محسوب نمی‌شوند.
              قبل از تصمیم درمانی، برچسب به‌روز دارو، وضعیت بیمار و راهنمای معتبر بررسی شود.
            </p>
            {evidenceNotes.length > 0 ? (
              <div className="mt-4 space-y-3">
                {evidenceNotes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
                    <h4 className="text-sm font-bold text-slate-900">{note.topic}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-800">{note.clinicalSummary}</p>
                    <p className="mt-2 text-xs leading-6 text-amber-950">
                      <strong>محدودیت بالینی: </strong>{note.boundaries}
                    </p>
                    <ul className="mt-3 space-y-1 border-t border-amber-200/70 pt-2 text-xs leading-6 text-slate-600">
                      {note.references.map((sourceId) => {
                        const source = EVIDENCE_REFERENCES[sourceId];
                        return (
                          <li key={sourceId}>
                            {source.url ? (
                              <a href={source.url} target="_blank" rel="noopener noreferrer"
                                className="font-semibold text-teal-800 underline underline-offset-2">
                                {source.book}
                              </a>
                            ) : source.book}
                            ، ویرایش {source.edition} ({source.year}) — {source.location}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-6 text-slate-600">
                برای این دارو هنوز یادداشت منبع‌دار در مجموعه بازبینی جدید ثبت نشده است؛ نبود یادداشت به معنی تأیید اطلاعات فعلی نیست.
              </p>
            )}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">مسیرهای بازبینی مستقل داروساز</p>
              <p className="mt-1 text-xs leading-6 text-slate-600">
                پیوندهای زیر فقط برای بررسی دستی هستند؛ وجود آن‌ها به معنای تطبیق یا تأیید محتوای این دارو با منبع نیست.
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                {EXTERNAL_REFERENCE_PORTALS.map((portal) => (
                  <li key={portal.name}>
                    <a href={portal.url} target="_blank" rel="noopener noreferrer"
                      title={portal.purpose}
                      className="text-xs font-semibold text-teal-800 underline underline-offset-2">
                      {portal.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 2. Related Interactions */}
        {showInteractions && (
          <section aria-labelledby="heading-interactions" className="border-t border-slate-100 pt-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <h3 id="heading-interactions" className="text-base font-bold text-slate-900">
                  تداخل‌های این دارو در نسخه فعال
                </h3>
              </div>
              {allInteractions.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenInteractionsTab}
                  className="no-print text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                >
                  مشاهده کل ماتریس تداخل‌ها
                </button>
              )}
            </div>

            {relatedInteractions.length === 0 ? (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                تداخل بالینی قابل‌توجهی برای {medication.persianName} با سایر اقلام نسخه فعال شناسایی نشد.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {relatedInteractions.map((item) => {
                  const isMajor = item.severity === 'major';
                  const isModerate = item.severity === 'moderate';
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 ${
                        isMajor
                          ? 'border-red-200 bg-red-50/70'
                          : isModerate
                            ? 'border-amber-200 bg-amber-50/70'
                            : 'border-slate-200 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          {item.drugA} + {item.drugB}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            isMajor
                              ? 'text-red-800'
                              : isModerate
                                ? 'text-amber-800'
                                : 'text-slate-700'
                          }`}
                        >
                          {isMajor ? (
                            <AlertOctagon className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : isModerate ? (
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {isMajor ? 'تداخل شدید (Major)' : isModerate ? 'تداخل متوسط (Moderate)' : 'تداخل خفیف (Minor)'}
                          </span>
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slate-700">
                        <strong className="text-slate-900">اثر بالینی: </strong>
                        {item.clinicalEffect}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-slate-800">
                        <strong className="text-slate-900">مدیریت داروساز: </strong>
                        {item.management}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. Safety & Important Warnings */}
        {showSafety && (
          <section aria-labelledby="heading-safety" className="border-t border-slate-100 pt-7">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
              <h3 id="heading-safety" className="text-base font-bold text-slate-900">
                نکات ایمنی و هشدارهای مهم
              </h3>
            </div>

            {medication.safety.criticalWarnings.length > 0 && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
                <p className="text-xs font-bold text-red-900">هشدارهای بحرانی و موارد منع مصرف</p>
                <ul className="mt-2 list-disc space-y-1.5 pr-5 text-sm leading-7 text-red-950">
                  {medication.safety.criticalWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-xs font-semibold text-slate-500">بارداری و شیردهی</p>
                <p className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.safety.pregnancyLactation}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-xs font-semibold text-slate-500">پایش‌های آزمایشگاهی و بالینی</p>
                <ul className="mt-1.5 list-disc space-y-1 pr-4 text-sm leading-6 text-slate-800">
                  {medication.safety.monitoring.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500">عوارض شایع و قابل‌توجه</p>
              <p className="mt-1.5 text-sm leading-7 text-slate-700">
                {medication.safety.commonSideEffects.join('  ·  ')}
              </p>
            </div>
          </section>
        )}

        {/* 4. Usage Variations & Patient Counseling */}
        {showUsage && (
          <section aria-labelledby="heading-usage" className="border-t border-slate-100 pt-7">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <h3 id="heading-usage" className="text-base font-bold text-slate-900">
                تنوع مصرف، اشکال دارویی و مشاوره بیمار
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Utensils className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span>نسبت به وعده غذایی</span>
                </div>
                <p className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.usage.withFood}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                  <span>بهترین زمان مصرف</span>
                </div>
                <p className="mt-1.5 text-sm leading-7 text-slate-800">
                  {medication.usage.timing}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4">
              <p className="text-xs font-bold text-slate-700">
                تنوع مصرف و اشکال دارویی جایگزین
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pr-5 text-sm leading-7 text-slate-800">
                {medication.usage.dosageFormsAndVariations.map((form, i) => (
                  <li key={i}>{form}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-xl border border-teal-200/80 bg-teal-50/40 p-4">
              <p className="text-xs font-bold text-teal-900">
                نکات کلیدی مشاوره به بیمار هنگام تحویل دارو
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pr-5 text-sm leading-7 text-slate-800">
                {medication.usage.patientCounseling.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
              <p className="mt-3 border-t border-teal-200/60 pt-2.5 text-xs leading-6 text-slate-700">
                <strong className="text-slate-900">در صورت فراموشی دوز: </strong>
                {medication.usage.missedDose}
              </p>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
