import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Database,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
} from 'lucide-react';
import type { ScanMode } from '../types/pharmacy';
import { SAMPLE_CASES, type SampleCase } from '../data/sampleCases';
import type { FormularyDrugRecord } from '../data/localDrugFormulary';
import { searchLocalFormulary } from '../utils/localDrugSearch';
import { formatPersianDigits, validateManualDrugInput } from '../utils/pharmacyLogic';

interface CameraScannerPanelProps {
  scanMode: ScanMode;
  onScanModeChange: (mode: ScanMode) => void;
  isAnalyzing: boolean;
  previewImageUrl: string | null;
  errorMessage: string | null;
  infoNotice?: string | null;
  localCatalog: FormularyDrugRecord[];
  onAnalyzeImageFile: (imageBase64: string, mimeType: string, previewUrl: string) => Promise<void>;
  onAddManualDrug: (query: string) => Promise<void>;
  onSelectLocalDrug: (drug: FormularyDrugRecord) => void;
  onOpenFormulary: () => void;
  onLoadSampleCase: (sample: SampleCase, mergeWithActive: boolean) => void;
  hasActiveMedications: boolean;
}

const MODE_OPTIONS: { value: ScanMode; label: string }[] = [
  { value: 'prescription', label: 'متن فیش / رسید' },
  { value: 'auto', label: 'تشخیص خودکار' },
  { value: 'box', label: 'عکس بسته (بعداً)' },
];

export function CameraScannerPanel({
  scanMode,
  onScanModeChange,
  isAnalyzing,
  previewImageUrl,
  errorMessage,
  infoNotice,
  localCatalog,
  onAnalyzeImageFile,
  onAddManualDrug,
  onSelectLocalDrug,
  onOpenFormulary,
  onLoadSampleCase,
  hasActiveMedications,
}: CameraScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [manualQuery, setManualQuery] = useState('');
  const [manualValidationError, setManualValidationError] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState(false);

  const offlineSuggestions = useMemo(() => {
    if (manualQuery.trim().length < 2) return [];
    return searchLocalFormulary(localCatalog, manualQuery, 'all', 5);
  }, [localCatalog, manualQuery]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async (requestedFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'دسترسی مستقیم به دوربین در این مرورگر در دسترس نیست. می‌توانید از دکمه «انتخاب یا عکاسی تصویر» استفاده کنید.'
      );
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            // Autoplay fallback handled by user interaction
          });
        }
      });
    } catch {
      setCameraError(
        'اجازه دسترسی به دوربین داده نشد یا دوربینی متصل نیست. لطفاً تصویر نسخه یا جلد دارو را از دستگاه بارگذاری کنید.'
      );
      setCameraActive(false);
    }
  };

  const handleToggleFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  const handleCaptureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    await onAnalyzeImageFile(dataUrl, 'image/jpeg', dataUrl);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        stopCamera();
        await onAnalyzeImageFile(result, file.type || 'image/jpeg', result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateManualDrugInput(manualQuery);
    if (!validation.valid) {
      setManualValidationError(validation.error ?? 'ورودی نامعتبر است.');
      return;
    }
    setManualValidationError(null);
    const queryToSend = manualQuery.trim();
    setManualQuery('');
    await onAddManualDrug(queryToSend);
  };

  return (
    <section
      aria-label="اسکن دوربین و تشخیص سریع دارو"
      className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6"
    >
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
            تشخیص نام دارو از متن فیش / رسید
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            برای MVP، از فیش داروخانه یا نسخه چاپی عکس بگیرید: نام‌های خوانا مثل «قرص دومپریدون» به ژنریک پیشنهادی تبدیل می‌شوند. اگر قدرت، تعداد یا دستور مصرف روی فیش نیست، حدس نمی‌زنیم. تصویر جعبه در این مرحله ضروری نیست؛ نتیجه باید توسط داروساز بازبینی شود.
          </p>
        </div>

        <div
          role="group"
          aria-label="حالت تشخیص تصویر"
          className="grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
        >
          {MODE_OPTIONS.map((option) => {
            const active = scanMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onScanModeChange(option.value)}
                aria-pressed={active}
                className={`min-h-[38px] whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera / Preview Viewport */}
      <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        <canvas ref={canvasRef} className="hidden" />

        {cameraActive ? (
          <div className="relative aspect-[16/10] w-full bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Minimal clinical viewfinder corners */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 sm:inset-8"
            >
              <div className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-teal-400" />
              <div className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-teal-400" />
              <div className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-teal-400" />
              <div className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-teal-400" />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent p-4">
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <CameraOff className="h-4 w-4" aria-hidden="true" />
                <span>بستن دوربین</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isAnalyzing}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 active:scale-[0.98] disabled:opacity-60"
              >
                <ScanLine className="h-5 w-5" aria-hidden="true" />
                <span>ثبت و تشخیص سریع</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFacing}
                aria-label="تغییر دوربین جلو و عقب"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : previewImageUrl ? (
          <div className="relative aspect-[16/10] w-full bg-slate-100">
            <img
              src={previewImageUrl}
              alt="پیش‌نمایش تصویر اسکن‌شده نسخه یا جلد دارو"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/65 text-white backdrop-blur-[2px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-300" aria-hidden="true" />
                <p className="text-sm font-semibold">در حال خوانش اقلام دارویی و تحلیل تداخل‌ها...</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent p-3.5 pt-10">
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isAnalyzing}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>اسکن مجدد</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/20 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span>تصویر دیگر</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center bg-slate-50 px-6 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-teal-700">
              <Camera className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">
              آماده تشخیص فیش نسخه یا جلد دارو
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              دوربین را روی برگه نسخه، فیش نسخه الکترونیک یا جعبه دارو بگیرید یا عکس آماده را بارگذاری کنید.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isAnalyzing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 active:scale-[0.98] disabled:opacity-60"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                <span>باز کردن دوربین</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span>انتخاب یا عکاسی تصویر</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileChange}
          aria-label="انتخاب فایل تصویر نسخه یا جلد دارو"
          className="hidden"
        />
      </div>

      {/* Camera or API Errors */}
      {(cameraError || errorMessage) && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {cameraError ?? errorMessage}
        </div>
      )}

      {infoNotice && !errorMessage && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2.5 text-xs font-medium text-teal-900"
        >
          <Database className="h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
          <span>{infoNotice}</span>
        </div>
      )}

      {scanMode === 'box' && (
        <p role="note" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700">
          برای دقت بیشتر، عکس مستقیم از جلوی جعبه (نام و قدرت)، پشت بسته (سازنده، IRC/GTIN)
          و بسته‌بندی واقعی بگیرید. نور کافی و فوکوس واضح مهم است؛ رنگ یا لوگو به‌تنهایی تأیید دارو نیست.
          عکس‌های راهنمای شرکت‌ها در سامانه کپی یا برای آموزش مدل استفاده نشده‌اند.
        </p>
      )}

      {/* Quick Manual Drug Lookup / Add (with Instant Offline Suggestions) */}
      <form onSubmit={handleManualSubmit} className="mt-5 border-t border-slate-100 pt-5" noValidate>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="manual-drug-input"
            className="text-sm font-semibold text-slate-800"
          >
            استعلام سریع دارو (آفلاین و آنلاین)
          </label>
          <button
            type="button"
            onClick={onOpenFormulary}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
          >
            بانک آفلاین ({formatPersianDigits(localCatalog.length)} دارو)
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="manual-drug-input"
              type="text"
              autoComplete="off"
              value={manualQuery}
              onChange={(e) => {
                setManualQuery(e.target.value);
                if (manualValidationError) setManualValidationError(null);
              }}
              placeholder="مثلاً: کلاریترومایسین ۵۰۰ یا Clopidogrel"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span>افزودن به نسخه</span>
          </button>
        </div>

        {/* Instant Offline Autocomplete Results */}
        {offlineSuggestions.length > 0 && (
          <div
            className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white"
            data-testid="offline-suggestions"
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-3.5 py-1.5 text-[11px] font-medium text-slate-500">
              نتایج فوری از دیتابیس محلی (بدون نیاز به اینترنت)
            </div>
            <ul className="divide-y divide-slate-100">
              {offlineSuggestions.map((drug) => (
                <li key={drug.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocalDrug(drug);
                      setManualQuery('');
                      setManualValidationError(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-right transition-colors hover:bg-teal-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {drug.persianName}
                        </span>
                        <span className="font-latin text-[11px] font-medium text-slate-500">
                          {drug.genericName}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {drug.strength} · {drug.dosageForm} · {drug.therapeuticClass}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700">
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>افزودن</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {manualValidationError && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-700">
            {manualValidationError}
          </p>
        )}
      </form>

      {/* Instant Realistic Clinical Sample Cases */}
      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-600">
            آزمایش سریع با نمونه‌های واقعی داروخانه
          </p>

          {hasActiveMedications && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={mergeMode}
                onChange={(e) => setMergeMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
              />
              <span>ادغام با نسخه فعال جهت بررسی تداخل</span>
            </label>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {SAMPLE_CASES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isAnalyzing}
              onClick={() => onLoadSampleCase(sample, hasActiveMedications && mergeMode)}
              className="group flex w-full flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-right transition-colors duration-150 hover:border-teal-600/50 hover:bg-teal-50/40 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-60"
            >
              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-800">
                {sample.label}
              </span>
              <span className="mt-0.5 text-[11px] leading-5 text-slate-500">
                {sample.shortSubtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
