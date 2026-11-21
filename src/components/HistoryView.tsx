import { ArrowUpLeft, Clock, Trash2 } from 'lucide-react';
import type { ScanSession } from '../types/pharmacy';
import { formatPersianDigits, summarizePrescriptionRisk } from '../utils/pharmacyLogic';

interface HistoryViewProps {
  sessions: ScanSession[];
  onReopenSession: (session: ScanSession) => void;
  onDeleteSession: (id: string) => void;
  onClearHistory: () => void;
  persistHistory: boolean;
  hasStoredHistory: boolean;
  onPersistHistoryChange: (enabled: boolean) => void;
}

const SOURCE_LABELS = {
  prescription: 'فیش نسخه',
  box: 'جلد دارو',
  manual: 'استعلام دستی',
} as const;

export function HistoryView({
  sessions,
  onReopenSession,
  onDeleteSession,
  onClearHistory,
  persistHistory,
  hasStoredHistory,
  onPersistHistoryChange,
}: HistoryViewProps) {
  return (
    <section
      aria-label="تاریخچه اسکن‌ها و نسخه‌های بررسی‌شده"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            تاریخچه نسخه‌ها و اسکن‌های اخیر
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            به‌صورت پیش‌فرض سوابق فقط تا بسته‌شدن صفحه در حافظه می‌مانند؛ ذخیره در مرورگر اختیاری است.
          </p>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>پاک‌سازی تاریخچه</span>
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={persistHistory}
            onChange={(event) => onPersistHistoryChange(event.target.checked)}
            className="h-4 w-4 accent-teal-700" />
          ذخیره سوابق در مرورگر همین دستگاه (فقط دستگاه شخصی)
        </label>
        <p className="mt-2 text-xs leading-6 text-slate-700">
          در حالت فعال، نام داروها و نتایج تحلیل به شکل متن عادی و بدون رمزنگاری در مرورگر باقی می‌مانند.
          در رایانه مشترک داروخانه این گزینه را فعال نکنید. غیرفعال‌سازی، سوابق ذخیره‌شده را حذف می‌کند.
        </p>
        {hasStoredHistory && !persistHistory && (
          <button type="button" onClick={onClearHistory}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700">
            حذف سوابق ذخیره‌شده قدیمی
          </button>
        )}
      </div>
      {sessions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
          <Clock className="h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            هنوز سابقه‌ای ثبت نشده است
          </p>
          <p className="mt-1 text-xs text-slate-500">
            پس از اسکن، سوابق در همین نشست نمایش داده می‌شوند؛ ذخیره دائمی تنها با انتخاب شما فعال خواهد شد.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100" data-testid="history-list">
          {sessions.map((session) => {
            const risk = summarizePrescriptionRisk(session.medications, session.interactions);
            const formattedTime = (() => {
              try {
                return new Intl.DateTimeFormat('fa-IR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(session.timestamp));
              } catch {
                return session.timestamp;
              }
            })();

            return (
              <li
                key={session.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {session.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 tabular-nums">
                    <span>{SOURCE_LABELS[session.sourceType]}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatPersianDigits(session.medications.length)} قلم دارو</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        risk.majorCount > 0
                          ? 'font-semibold text-red-700'
                          : risk.moderateCount > 0
                            ? 'font-semibold text-amber-700'
                            : 'text-emerald-700'
                      }
                    >
                      {risk.majorCount > 0
                        ? `${formatPersianDigits(risk.majorCount)} تداخل شدید`
                        : risk.moderateCount > 0
                          ? `${formatPersianDigits(risk.moderateCount)} تداخل متوسط`
                          : 'بدون تداخل مهم'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onReopenSession(session)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-teal-600/40 hover:bg-teal-50/40 hover:text-teal-800"
                  >
                    <span>باز کردن نسخه</span>
                    <ArrowUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    aria-label={`حذف سابقه ${session.title}`}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
