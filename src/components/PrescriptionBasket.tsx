import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Printer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type {
  DrugInteraction,
  MedicationItem,
  PrescriptionRiskSummary,
} from '../types/pharmacy';
import {
  buildCounselingText,
  formatPersianDigits,
  getInteractionsForMedication,
  QUICK_DOSING_SCHEDULE_PRESETS,
  validateCustomDosingSchedule,
} from '../utils/pharmacyLogic';

interface PrescriptionBasketProps {
  medications: MedicationItem[];
  interactions: DrugInteraction[];
  riskSummary: PrescriptionRiskSummary;
  selectedMedicationId: string | null;
  clinicalSummary: string;
  onSelectMedication: (id: string) => void;
  onRemoveMedication: (id: string) => void;
  onUpdateDosingSchedule: (id: string, schedule: string) => void;
  onOpenInteractionsTab: () => void;
}

const SOURCE_LABELS = {
  prescription: 'فیش نسخه',
  box: 'جلد دارو',
  manual: 'ثبت دستی',
} as const;

export function PrescriptionBasket({
  medications,
  interactions,
  riskSummary,
  selectedMedicationId,
  clinicalSummary,
  onSelectMedication,
  onRemoveMedication,
  onUpdateDosingSchedule,
  onOpenInteractionsTab,
}: PrescriptionBasketProps) {
  const [copied, setCopied] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [draftSchedule, setDraftSchedule] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const openScheduleEditor = (med: MedicationItem) => {
    if (editingMedId === med.id) {
      setEditingMedId(null);
      setScheduleError(null);
      return;
    }
    setEditingMedId(med.id);
    setDraftSchedule(med.customDosingSchedule ?? '');
    setScheduleError(null);
  };

  const handleSaveSchedule = (medId: string, value: string) => {
    const check = validateCustomDosingSchedule(value);
    if (!check.valid) {
      setScheduleError(check.error ?? 'مقدار نامعتبر است.');
      return;
    }
    onUpdateDosingSchedule(medId, check.normalized);
    setEditingMedId(null);
    setDraftSchedule('');
    setScheduleError(null);
  };

  const handleCopyCounseling = async () => {
    const text = buildCounselingText(medications, interactions);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section
      aria-label="فهرست داروهای نسخه فعال"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            اقلام تشخیص‌داده‌شده در نسخه فعال
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {medications.length > 0
              ? `${formatPersianDigits(medications.length)} قلم دارو · ${formatPersianDigits(
                  riskSummary.majorCount
                )} تداخل شدید · ${formatPersianDigits(riskSummary.moderateCount)} تداخل متوسط`
              : 'هنوز دارویی ثبت نشده است'}
          </p>
        </div>

        {medications.length > 0 && (
          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCounseling}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              )}
              <span>{copied ? 'برگه مشاوره کپی شد' : 'کپی مشاوره بیمار'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              aria-label="چاپ خلاصه مشاوره دارویی"
              className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Clinical Interaction Risk Banner */}
      {medications.length > 0 && (
        <div
          className={`mt-4 flex flex-col gap-2.5 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
            riskSummary.overallLevel === 'critical'
              ? 'border-red-200 bg-red-50/80 text-red-900'
              : riskSummary.overallLevel === 'caution'
                ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {riskSummary.overallLevel === 'safe' ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <AlertTriangle
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  riskSummary.overallLevel === 'critical' ? 'text-red-700' : 'text-amber-700'
                }`}
                aria-hidden="true"
              />
            )}
            <div className="text-xs leading-6">
              <p className="font-bold">
                {riskSummary.overallLevel === 'critical'
                  ? `هشدار تداخل شدید: ${formatPersianDigits(riskSummary.majorCount)} تداخل پرخطر نیازمند مداخله داروساز`
                  : riskSummary.overallLevel === 'caution'
                    ? `نیازمند احتیاط بالینی: ${formatPersianDigits(riskSummary.moderateCount)} تداخل متوسط یا داروی پرخطر`
                    : 'تداخل شدید یا متوسطی میان داروهای این نسخه مشاهده نشد'}
              </p>
              {clinicalSummary && (
                <p className="mt-0.5 opacity-90">{clinicalSummary}</p>
              )}
            </div>
          </div>

          {interactions.length > 0 && (
            <button
              type="button"
              onClick={onOpenInteractionsTab}
              className="no-print shrink-0 self-start whitespace-nowrap rounded-lg border border-current/20 bg-white/80 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white sm:self-center"
            >
              مشاهده ماتریس تداخل ({formatPersianDigits(interactions.length)})
            </button>
          )}
        </div>
      )}

      {/* Medication Rows */}
      {medications.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            نسخه فعال خالی است
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            با دوربین از فیش نسخه یا جلد دارو عکس بگیرید، نام دارو را وارد کنید یا یکی از نمونه‌های آماده را انتخاب نمایید.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100" data-testid="medication-list">
          {medications.map((med) => {
            const isSelected = med.id === selectedMedicationId;
            const isEditing = editingMedId === med.id;
            const relatedInteractions = getInteractionsForMedication(med, interactions);
            const hasMajor = relatedInteractions.some((i) => i.severity === 'major');
            const hasModerate = relatedInteractions.some((i) => i.severity === 'moderate');

            return (
              <li key={med.id} className="py-2.5">
                <div className="flex items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectMedication(med.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`flex min-h-[56px] flex-1 flex-col items-start rounded-xl px-3.5 py-2.5 text-right transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                      isSelected
                        ? 'bg-teal-50/80 ring-1 ring-teal-700/30'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex w-full flex-wrap items-baseline justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {med.persianName}
                        </span>
                        <span className="font-latin text-xs font-medium text-slate-500">
                          {med.genericName}
                        </span>
                      </div>
                      <span className="font-clinical-mono text-xs font-semibold text-teal-800">
                        {med.strength}
                      </span>
                    </div>

                    {/* Clean unboxed inline metadata */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span>{med.dosageForm}</span>
                      <span aria-hidden="true">·</span>
                      <span>{med.therapeuticClass}</span>
                      <span aria-hidden="true">·</span>
                      <span>{SOURCE_LABELS[med.sourceType]}</span>
                      {med.safety.highAlert && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-red-700">داروی پرخطر</span>
                        </>
                      )}
                      {hasMajor && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-red-700">تداخل شدید</span>
                        </>
                      )}
                      {!hasMajor && hasModerate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-700">تداخل متوسط</span>
                        </>
                      )}
                    </div>

                    {med.customDosingSchedule && (
                      <p
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-teal-800"
                        data-testid="custom-dosing-schedule"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                        <span>برنامه مصرف روزانه: {med.customDosingSchedule}</span>
                      </p>
                    )}

                    {med.dosing.prescribedRegimen && (
                      <p className="mt-1 text-xs text-slate-600">
                        دستور نسخه: {med.dosing.prescribedRegimen}
                      </p>
                    )}
                  </button>

                  <div className="no-print flex shrink-0 flex-col gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => openScheduleEditor(med)}
                      aria-expanded={isEditing}
                      aria-label={`تنظیم برنامه مصرف برای ${med.persianName}`}
                      title="تنظیم برنامه مصرف روزانه"
                      className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-teal-700 ${
                        isEditing || med.customDosingSchedule
                          ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <Clock className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (editingMedId === med.id) setEditingMedId(null);
                        onRemoveMedication(med.id);
                      }}
                      aria-label={`حذف ${med.persianName} از نسخه`}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Inline Custom Daily Dosing Schedule Editor */}
                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveSchedule(med.id, draftSchedule);
                    }}
                    className="no-print mt-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5"
                    data-testid="dosing-schedule-editor"
                  >
                    <label
                      htmlFor={`schedule-input-${med.id}`}
                      className="block text-xs font-bold text-slate-800"
                    >
                      برنامه مصرف روزانه برای {med.persianName}
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        id={`schedule-input-${med.id}`}
                        type="text"
                        value={draftSchedule}
                        onChange={(e) => {
                          setDraftSchedule(e.target.value);
                          if (scheduleError) setScheduleError(null);
                        }}
                        placeholder="مثلاً: هر ۸ ساعت ۱ عدد یا روزی ۲ بار همراه غذا"
                        className="min-h-[40px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                      />
                      <button
                        type="submit"
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
                      >
                        ذخیره برنامه
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
                          onClick={() => handleSaveSchedule(med.id, preset)}
                          className="min-h-[32px] whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-teal-600/50 hover:bg-teal-50/50 hover:text-teal-800"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/70 pt-2">
                      {med.customDosingSchedule ? (
                        <button
                          type="button"
                          onClick={() => handleSaveSchedule(med.id, '')}
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
                          حذف برنامه مصرف
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          در برگه مشاوره بیمار نیز ثبت می‌شود
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMedId(null);
                          setScheduleError(null);
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
