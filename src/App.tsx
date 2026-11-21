import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { CameraScannerPanel } from './components/CameraScannerPanel';
import { ClinicalMonographView } from './components/ClinicalMonographView';
import { HistoryView } from './components/HistoryView';
import { InteractionMatrixView } from './components/InteractionMatrixView';
import { LocalFormularyView } from './components/LocalFormularyView';
import { PrescriptionBasket } from './components/PrescriptionBasket';
import { TopBar } from './components/TopBar';
import {
  LOCAL_DRUG_FORMULARY,
  type FormularyDrugRecord,
} from './data/localDrugFormulary';
import type { SampleCase } from './data/sampleCases';
import type {
  AnalyzeResponsePayload,
  DrugInteraction,
  MedicationItem,
  ScanMode,
  ScanSession,
  SourceType,
  WorkspaceTab,
} from './types/pharmacy';
import {
  initLocalDrugDb,
} from './utils/localDrugDb';
import { findBestLocalDrugMatch } from './utils/localDrugSearch';
import {
  evaluateLocalInteractions,
  mergeInteractions,
  mergeScannedMedications,
  parseScanHistory,
  serializeScanHistory,
  summarizePrescriptionRisk,
  updateMedicationDosingSchedule,
} from './utils/pharmacyLogic';

const HISTORY_STORAGE_KEY = 'daruyar_scan_history_v1';
const HISTORY_CONSENT_KEY = 'pharmaai_history_optin_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('scanner');
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessRequired, setAccessRequired] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessEntry, setAccessEntry] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const [aiDisclosureAccepted, setAiDisclosureAccepted] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/access-status', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('وضعیت امنیتی سرور قابل بررسی نیست.');
        const data = await response.json();
        if (active) setAccessRequired(data.required !== false);
      })
      .catch(() => { if (active) setAccessError('اتصال به درگاه دسترسی برقرار نیست.'); })
      .finally(() => { if (active) setAccessChecking(false); });
    return () => { active = false; };
  }, []);
  const handleAccessVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccessError('');
    setAccessBusy(true);
    try {
      const response = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'x-pharmaai-access-token': accessEntry },
        cache: 'no-store',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'اعتبارسنجی رمز دسترسی ناموفق بود.');
      }
      setAccessToken(accessEntry);
      setAccessGranted(true);
      setAccessEntry('');
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'خطای اتصال به سرور');
    } finally { setAccessBusy(false); }
  };
  const [scanMode, setScanMode] = useState<ScanMode>('prescription');

  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [aiInteractions, setAiInteractions] = useState<DrugInteraction[]>([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [clinicalSummary, setClinicalSummary] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const [localCatalog, setLocalCatalog] = useState<FormularyDrugRecord[]>(LOCAL_DRUG_FORMULARY);
  const [storageEngine, setStorageEngine] = useState<'indexeddb' | 'memory'>('memory');

  // Existing data is not read without explicit browser opt-in.
  const [persistHistory, setPersistHistory] = useState(() => {
    try { return window.localStorage.getItem(HISTORY_CONSENT_KEY) === 'yes'; }
    catch { return false; }
  });
  const [hasStoredHistory, setHasStoredHistory] = useState(() => {
    try { return Boolean(window.localStorage.getItem(HISTORY_STORAGE_KEY)); }
    catch { return false; }
  });
  const [history, setHistory] = useState<ScanSession[]>(() => {
    try {
      if (window.localStorage.getItem(HISTORY_CONSENT_KEY) !== 'yes') return [];
      return parseScanHistory(window.localStorage.getItem(HISTORY_STORAGE_KEY));
    } catch { return []; }
  });

  useEffect(() => {
    let active = true;
    initLocalDrugDb().then((result) => {
      if (!active) return;
      setLocalCatalog(result.catalog);
      setStorageEngine(result.storageEngine);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!persistHistory) return;
    try {
      if (history.length > 0) {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeScanHistory(history));
        setHasStoredHistory(true);
      } else {
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
        setHasStoredHistory(false);
      }
    } catch { /* Browser storage may be unavailable */ }
  }, [history, persistHistory]);
  const handlePersistHistoryChange = (enabled: boolean) => {
    try {
      if (enabled) {
        window.localStorage.setItem(HISTORY_CONSENT_KEY, 'yes');
        if (history.length > 0) {
          window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeScanHistory(history));
        } else {
          window.localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
        setHasStoredHistory(history.length > 0);
      } else {
        window.localStorage.removeItem(HISTORY_CONSENT_KEY);
        window.localStorage.removeItem(HISTORY_STORAGE_KEY);
        setHasStoredHistory(false);
      }
      setPersistHistory(enabled);
    } catch { setErrorMessage('ذخیره‌سازی مرورگر در این دستگاه قابل استفاده نیست.'); }
  };

  // Always combine AI-returned interactions with deterministic local clinical interaction rules
  const interactions = useMemo(() => {
    const localRules = evaluateLocalInteractions(medications);
    return mergeInteractions(aiInteractions, localRules);
  }, [medications, aiInteractions]);

  const riskSummary = useMemo(
    () => summarizePrescriptionRisk(medications, interactions),
    [medications, interactions]
  );

  const selectedMedication = useMemo(
    () => medications.find((m) => m.id === selectedMedicationId) ?? medications[0] ?? null,
    [medications, selectedMedicationId]
  );

  const saveSessionToHistory = (
    meds: MedicationItem[],
    combinedInteractions: DrugInteraction[],
    sourceType: SourceType,
    summary: string,
    previewUrl?: string | null
  ) => {
    if (meds.length === 0) return;
    const title = meds
      .slice(0, 3)
      .map((m) => `${m.persianName} ${m.strength}`)
      .join(' · ');

    const newSession: ScanSession = {
      id: `session-${Date.now()}`,
      title: meds.length > 3 ? `${title} و ...` : title,
      timestamp: new Date().toISOString(),
      sourceType,
      previewImageUrl: previewUrl && !previewUrl.startsWith('data:') ? previewUrl : undefined,
      medications: meds,
      interactions: combinedInteractions,
      clinicalSummary: summary,
    };

    setHistory((prev) => [newSession, ...prev].slice(0, 15));
  };

  const applyAnalyzedResult = (
    payload: AnalyzeResponsePayload,
    mergeWithExisting: boolean,
    previewUrl?: string | null
  ) => {
    const incomingMeds = payload.medications ?? [];
    if (incomingMeds.length === 0) {
      setErrorMessage(
        payload.clinicalSummary ||
          'هیچ داروی قابل‌خوانشی در تصویر یا ورودی شناسایی نشد. لطفاً با نور مناسب‌تر و تمرکز واضح‌تر مجدداً تلاش کنید.'
      );
      return;
    }

    const nextMeds = mergeWithExisting
      ? mergeScannedMedications(medications, incomingMeds)
      : incomingMeds;

    const nextAiInteractions = mergeWithExisting
      ? mergeInteractions(payload.interactions ?? [], aiInteractions)
      : payload.interactions ?? [];

    const combined = mergeInteractions(nextAiInteractions, evaluateLocalInteractions(nextMeds));

    setMedications(nextMeds);
    setAiInteractions(nextAiInteractions);
    setClinicalSummary(payload.clinicalSummary || '');
    setSelectedMedicationId(incomingMeds[0].id);
    if (previewUrl !== undefined) {
      setPreviewImageUrl(previewUrl);
    }
    setErrorMessage(null);
    setInfoNotice(null);

    // Never make unverified AI output part of the offline clinical formulary.
    // Pending pharmacist review must be explicit and backed by provenance.

    saveSessionToHistory(
      nextMeds,
      combined,
      payload.detectedSourceType,
      payload.clinicalSummary || '',
      previewUrl
    );
  };

  const handleSelectLocalDrug = (
    drug: FormularyDrugRecord,
    options?: { openMonograph?: boolean; noticeText?: string }
  ) => {
    setErrorMessage(null);
    const asMed: MedicationItem = {
      ...drug,
      sourceType: 'manual',
      verificationStatus: 'unverified-legacy',
    };
    const nextMeds = mergeScannedMedications(medications, [asMed]);
    const matchedInNext =
      nextMeds.find(
        (m) =>
          m.genericName.toLowerCase() === drug.genericName.toLowerCase() &&
          m.strength.toLowerCase() === drug.strength.toLowerCase()
      ) ?? asMed;

    const combined = mergeInteractions(aiInteractions, evaluateLocalInteractions(nextMeds));
    setMedications(nextMeds);
    setSelectedMedicationId(matchedInNext.id);
    setInfoNotice(
      options?.noticeText ??
        `اطلاعات «${drug.persianName} (${drug.genericName})» از دیتابیس محلی آفلاین بارگذاری شد.`
    );
    setClinicalSummary(
      `نسخه فعال شامل ${nextMeds.length} قلم دارو است و تداخل‌های دارویی به‌صورت آفلاین بررسی شدند.`
    );

    if (options?.openMonograph) {
      setActiveTab('monograph');
    }

    saveSessionToHistory(
      nextMeds,
      combined,
      'manual',
      `استعلام آفلاین: ${drug.persianName} ${drug.strength}`
    );
  };

  const handleAnalyzeImageFile = async (
    imageBase64: string,
    mimeType: string,
    previewUrl: string
  ) => {
    if (!aiDisclosureAccepted) {
      setErrorMessage('پیش از ارسال نسخه یا تصویر به سرویس هوش مصنوعی، اطلاع‌رسانی پردازش ابری را تأیید کنید.');
      return;
    }
    setErrorMessage(null);
    setInfoNotice(null);
    setPreviewImageUrl(previewUrl);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmaai-access-token': accessToken },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          scanMode,
          existingDrugNames: medications.map((m) => `${m.genericName} ${m.strength}`),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'خطا در تحلیل تصویر نسخه یا جلد دارو.');
      }

      const shouldMerge = scanMode === 'box' && medications.length > 0;
      applyAnalyzedResult(data as AnalyzeResponsePayload, shouldMerge, previewUrl);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'ارتباط با سرور تحلیل تصویر برقرار نشد.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddManualDrug = async (query: string) => {
    setErrorMessage(null);
    setInfoNotice(null);

    const localMatch = findBestLocalDrugMatch(localCatalog, query);

    // Offline-first resolution when browser has no network connection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (localMatch) {
        handleSelectLocalDrug(localMatch, {
          noticeText: `حالت آفلاین: «${localMatch.persianName}» از دیتابیس محلی IndexedDB بازیابی شد.`,
        });
      } else {
        setErrorMessage(
          `اتصال اینترنت برقرار نیست و داروی «${query}» در بانک محلی آفلاین یافت نشد. می‌توانید فهرست بانک دارویی آفلاین را جستجو کنید.`
        );
      }
      return;
    }

    if (!aiDisclosureAccepted) {
      if (localMatch) {
        handleSelectLocalDrug(localMatch, { noticeText: 'بدون ارسال به سرویس ابری؛ نمایش داده محلی و تأییدنشده.' });
      } else {
        setErrorMessage('برای استعلام از هوش مصنوعی، ابتدا اطلاع‌رسانی پردازش ابری را تأیید کنید.');
      }
      return;
    }
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-drugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmaai-access-token': accessToken },
        body: JSON.stringify({
          query,
          existingDrugNames: medications.map((m) => `${m.genericName} ${m.strength}`),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'خطا در دریافت اطلاعات دارو.');
      }

      applyAnalyzedResult(data as AnalyzeResponsePayload, medications.length > 0);
    } catch (err) {
      if (localMatch) {
        handleSelectLocalDrug(localMatch, {
          noticeText: `عدم دسترسی به سرویس آنلاین؛ اطلاعات «${localMatch.persianName}» از دیتابیس محلی آفلاین بارگذاری شد.`,
        });
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'خطا در استعلام اطلاعات دارو از سرور.'
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSampleCase = (sample: SampleCase, mergeWithActive: boolean) => {
    setErrorMessage(null);
    const nextMeds = mergeWithActive
      ? mergeScannedMedications(medications, sample.medications)
      : sample.medications;

    const nextLocalInteractions = evaluateLocalInteractions(nextMeds);
    const nextAi = mergeWithActive
      ? mergeInteractions(sample.interactions, aiInteractions)
      : sample.interactions;
    const combined = mergeInteractions(nextAi, nextLocalInteractions);

    setMedications(nextMeds);
    setAiInteractions(nextAi);
    setPreviewImageUrl(sample.previewImageUrl);
    setClinicalSummary(
      mergeWithActive
        ? `اقلام جدید با نسخه فعال ادغام شدند. تعداد کل ${nextMeds.length} قلم دارو از نظر تداخل‌های دارویی بررسی شد.`
        : sample.clinicalSummary
    );
    setSelectedMedicationId(sample.medications[0]?.id ?? nextMeds[0]?.id ?? null);

    saveSessionToHistory(
      nextMeds,
      combined,
      sample.sourceType,
      sample.clinicalSummary,
      sample.previewImageUrl
    );
  };

  const handleRemoveMedication = (id: string) => {
    const remaining = medications.filter((m) => m.id !== id);
    setMedications(remaining);
    if (selectedMedicationId === id) {
      setSelectedMedicationId(remaining[0]?.id ?? null);
    }
    // AI interactions reference the previous prescription snapshot.
    // They must be invalidated whenever any medication is removed.
    setAiInteractions([]);
    setClinicalSummary('فهرست داروها تغییر کرد؛ تحلیل قبلی AI باطل شد. تداخل‌ها باید دوباره بررسی شوند.');
  };

  const handleUpdateDosingSchedule = (id: string, schedule: string) => {
    const updatedMeds = updateMedicationDosingSchedule(medications, id, schedule);
    setMedications(updatedMeds);
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const latest = prev[0];
      const matchesLatest = latest.medications.some((m) => m.id === id);
      if (!matchesLatest) return prev;
      return [
        {
          ...latest,
          medications: updateMedicationDosingSchedule(latest.medications, id, schedule),
        },
        ...prev.slice(1),
      ];
    });
  };

  const handleStartNewPrescription = () => {
    setMedications([]);
    setAiInteractions([]);
    setSelectedMedicationId(null);
    setPreviewImageUrl(null);
    setClinicalSummary('');
    setErrorMessage(null);
    setInfoNotice(null);
    setActiveTab('scanner');
  };

  const handleRecheckInteractionsWithAi = async () => {
    if (medications.length < 2) return;
    if (!aiDisclosureAccepted) {
      setErrorMessage('برای ارسال نام داروها به سرویس بررسی تداخلات ابری، ابتدا اطلاع‌رسانی را تأیید کنید.');
      return;
    }
    setErrorMessage(null);
    setIsCheckingInteractions(true);

    try {
      const response = await fetch('/api/check-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmaai-access-token': accessToken },
        body: JSON.stringify({
          drugNames: medications.map((m) => `${m.genericName} ${m.strength} (${m.persianName})`),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'خطا در تحلیل تداخل‌های دارویی.');
      }
      if (Array.isArray(data.interactions)) {
        setAiInteractions(data.interactions);
      }
      if (typeof data.clinicalSummary === 'string' && data.clinicalSummary.trim()) {
        setClinicalSummary(data.clinicalSummary);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'خطا در ارتباط با سرویس بررسی تداخل‌ها.'
      );
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleReopenSession = (session: ScanSession) => {
    setMedications(session.medications);
    setAiInteractions(session.interactions);
    setSelectedMedicationId(session.medications[0]?.id ?? null);
    setPreviewImageUrl(session.previewImageUrl ?? null);
    setClinicalSummary(session.clinicalSummary ?? '');
    setErrorMessage(null);
    setActiveTab('scanner');
  };

  const handleDeleteSession = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      setHasStoredHistory(false);
    } catch { /* Browser storage may be blocked */ }
  };

  if (accessChecking || (accessRequired && !accessGranted)) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">دسترسی داروساز به PharmaAI</h1>
          {accessChecking ? (
            <p className="mt-5 text-sm text-slate-600">در حال بررسی وضعیت اتصال امن...</p>
          ) : (
            <form onSubmit={handleAccessVerify} className="mt-5 space-y-4">
              <p className="text-sm text-slate-600">رمز دسترسی تعریف‌شده در تنظیمات سرور را وارد کنید. رمز فقط در حافظه این صفحه نگهداری می‌شود.</p>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="operator-token">رمز دسترسی داروخانه</label>
              <input id="operator-token" type="password" autoComplete="off" required
                value={accessEntry} onChange={(event) => setAccessEntry(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left" dir="ltr" />
              {accessError && <p role="alert" className="text-sm text-red-700">{accessError}</p>}
              <button type="submit" disabled={accessBusy} className="w-full rounded-xl bg-teal-700 px-4 py-3 font-bold text-white disabled:opacity-50">
                {accessBusy ? 'در حال بررسی...' : 'ورود به پنل'}
              </button>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 md:pb-10">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onStartNewPrescription={handleStartNewPrescription}
        medicationCount={medications.length}
        majorInteractionCount={riskSummary.majorCount}
        historyCount={history.length}
        formularyCount={localCatalog.length}
      />

      {accessRequired && (
        <div className="mx-auto max-w-[1380px] px-4 pt-3" dir="rtl">
          <button type="button" onClick={() => {
            setAccessGranted(false);
            setAccessToken('');
            handleStartNewPrescription();
          }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            قفل‌کردن پنل
          </button>
        </div>
      )}
      <section dir="rtl" className="mx-auto max-w-[1380px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={aiDisclosureAccepted}
              onChange={(event) => setAiDisclosureAccepted(event.target.checked)}
              className="h-4 w-4 accent-teal-700" />
            اطلاع‌رسانی پردازش ابری را خوانده‌ام
          </label>
          <p className="mt-1 text-xs leading-6">
            هنگام استفاده از تحلیل هوش مصنوعی، تصویر نسخه یا نام داروها به سرویس Gemini ارسال می‌شود.
            پیش از اسکن، نام، شماره تماس و سایر مشخصات هویتی بیمار را حذف کنید.
            این گزینه فقط برای نشست جاری است و تأیید رضایت بیمار یا مجوز حقوقی محسوب نمی‌شود.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-[1380px] px-4 pt-6 sm:px-6 lg:px-8">
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              {medications.length > 0 && (
                <PrescriptionBasket
                  medications={medications}
                  interactions={interactions}
                  riskSummary={riskSummary}
                  selectedMedicationId={selectedMedication?.id ?? null}
                  clinicalSummary={clinicalSummary}
                  onSelectMedication={setSelectedMedicationId}
                  onRemoveMedication={handleRemoveMedication}
                  onUpdateDosingSchedule={handleUpdateDosingSchedule}
                  onOpenInteractionsTab={() => setActiveTab('interactions')}
                />
              )}

              <CameraScannerPanel
                scanMode={scanMode}
                onScanModeChange={setScanMode}
                isAnalyzing={isAnalyzing}
                previewImageUrl={previewImageUrl}
                errorMessage={errorMessage}
                infoNotice={infoNotice}
                localCatalog={localCatalog}
                onAnalyzeImageFile={handleAnalyzeImageFile}
                onAddManualDrug={handleAddManualDrug}
                onSelectLocalDrug={(drug) => handleSelectLocalDrug(drug)}
                onOpenFormulary={() => setActiveTab('formulary')}
                onLoadSampleCase={handleLoadSampleCase}
                hasActiveMedications={medications.length > 0}
              />

              {medications.length === 0 && (
                <PrescriptionBasket
                  medications={medications}
                  interactions={interactions}
                  riskSummary={riskSummary}
                  selectedMedicationId={selectedMedication?.id ?? null}
                  clinicalSummary={clinicalSummary}
                  onSelectMedication={setSelectedMedicationId}
                  onRemoveMedication={handleRemoveMedication}
                  onUpdateDosingSchedule={handleUpdateDosingSchedule}
                  onOpenInteractionsTab={() => setActiveTab('interactions')}
                />
              )}
            </div>

            <div className="lg:col-span-7">
              <ClinicalMonographView
                medication={selectedMedication}
                allInteractions={interactions}
                onUpdateDosingSchedule={handleUpdateDosingSchedule}
                onOpenInteractionsTab={() => setActiveTab('interactions')}
              />
            </div>
          </div>
        )}

        {activeTab === 'formulary' && (
          <LocalFormularyView
            catalog={localCatalog}
            storageEngine={storageEngine}
            activeMedications={medications}
            onAddDrugToPrescription={(drug) => handleSelectLocalDrug(drug)}
            onInspectDrugMonograph={(drug) =>
              handleSelectLocalDrug(drug, { openMonograph: true })
            }
          />
        )}

        {activeTab === 'monograph' && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <PrescriptionBasket
                medications={medications}
                interactions={interactions}
                riskSummary={riskSummary}
                selectedMedicationId={selectedMedication?.id ?? null}
                clinicalSummary={clinicalSummary}
                onSelectMedication={setSelectedMedicationId}
                onRemoveMedication={handleRemoveMedication}
                onUpdateDosingSchedule={handleUpdateDosingSchedule}
                onOpenInteractionsTab={() => setActiveTab('interactions')}
              />
            </div>
            <div className="lg:col-span-8">
              <ClinicalMonographView
                medication={selectedMedication}
                allInteractions={interactions}
                onUpdateDosingSchedule={handleUpdateDosingSchedule}
                onOpenInteractionsTab={() => setActiveTab('interactions')}
              />
            </div>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-6">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {errorMessage}
              </div>
            )}
            <InteractionMatrixView
              medications={medications}
              interactions={interactions}
              isChecking={isCheckingInteractions}
              onRecheckWithAi={handleRecheckInteractionsWithAi}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            sessions={history}
            onReopenSession={handleReopenSession}
            onDeleteSession={handleDeleteSession}
            onClearHistory={handleClearHistory}
            persistHistory={persistHistory}
            hasStoredHistory={hasStoredHistory}
            onPersistHistoryChange={handlePersistHistoryChange}
          />
        )}
      </main>

      <footer className="no-print mx-auto mt-10 max-w-[1380px] border-t border-slate-200/70 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>
          دارویار ابزار کمک‌تصمیم بالینی برای داروسازان است و جایگزین قضاوت حرفه‌ای داروساز، بررسی نهایی نسخه و رفرنس‌های رسمی دارویی نمی‌باشد.
        </p>
      </footer>
    </div>
  );
}
