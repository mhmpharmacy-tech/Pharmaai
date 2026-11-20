import { BookOpen, Camera, FileText, History, Plus, ShieldAlert } from 'lucide-react';
import type { WorkspaceTab } from '../types/pharmacy';
import { formatPersianDigits } from '../utils/pharmacyLogic';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onStartNewPrescription: () => void;
  medicationCount: number;
  majorInteractionCount: number;
  historyCount: number;
  formularyCount: number;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string; shortLabel: string }[] = [
  { id: 'scanner', label: 'اسکنر سریع', shortLabel: 'اسکنر' },
  { id: 'formulary', label: 'بانک دارویی', shortLabel: 'دارونامه' },
  { id: 'monograph', label: 'مونوگراف دارو', shortLabel: 'جزئیات' },
  { id: 'interactions', label: 'تداخل‌ها', shortLabel: 'تداخل‌ها' },
  { id: 'history', label: 'تاریخچه', shortLabel: 'تاریخچه' },
];

export function TopBar({
  activeTab,
  onSelectTab,
  onStartNewPrescription,
  medicationCount,
  majorInteractionCount,
  historyCount,
  formularyCount,
}: TopBarProps) {
  const getCountHint = (id: WorkspaceTab): string | null => {
    if (id === 'formulary' && formularyCount > 0) {
      return formatPersianDigits(formularyCount);
    }
    if (id === 'monograph' && medicationCount > 0) {
      return formatPersianDigits(medicationCount);
    }
    if (id === 'interactions' && majorInteractionCount > 0) {
      return formatPersianDigits(majorInteractionCount);
    }
    if (id === 'history' && historyCount > 0) {
      return formatPersianDigits(historyCount);
    }
    return null;
  };

  return (
    <>
      <header className="no-print sticky top-0 z-30 h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1380px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <a
            href="#scanner"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('scanner');
            }}
            className="shrink-0 whitespace-nowrap text-xl font-extrabold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            دارویار
          </a>

          <nav
            aria-label="ناوبری اصلی"
            className="hidden items-center gap-6 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const countHint = getCountHint(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative shrink-0 whitespace-nowrap py-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                    isActive
                      ? 'text-teal-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {countHint && (
                    <span
                      className={`mr-1.5 text-xs tabular-nums ${
                        item.id === 'interactions' && majorInteractionCount > 0
                          ? 'font-bold text-red-700'
                          : 'text-slate-400'
                      }`}
                    >
                      ({countHint})
                    </span>
                  )}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-700"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onStartNewPrescription}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-teal-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>نسخه جدید</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="ناوبری پایین موبایل"
        className="no-print fixed inset-x-0 bottom-0 z-40 h-14 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden"
      >
        <div className="grid h-full grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon =
              item.id === 'scanner'
                ? Camera
                : item.id === 'formulary'
                  ? BookOpen
                  : item.id === 'monograph'
                    ? FileText
                    : item.id === 'interactions'
                      ? ShieldAlert
                      : History;
            const countHint =
              item.id === 'formulary' ? null : getCountHint(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {item.shortLabel}
                  {countHint ? ` (${countHint})` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
