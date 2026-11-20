import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function createAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const PHARMACY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedSourceType: {
      type: Type.STRING,
      description: 'Detected source type: prescription, box, or manual.',
    },
    clinicalSummary: {
      type: Type.STRING,
      description: 'Concise clinical pharmacist summary in Persian (2-3 sentences).',
    },
    medications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          persianName: { type: Type.STRING, description: 'Common Persian drug name.' },
          genericName: { type: Type.STRING, description: 'Standard English generic INN name.' },
          brandName: { type: Type.STRING, description: 'Brand name if visible or common in Iran.' },
          strength: { type: Type.STRING, description: 'Strength with units e.g. 500 mg.' },
          dosageForm: { type: Type.STRING, description: 'Pharmaceutical form in Persian e.g. قرص روکش‌دار.' },
          therapeuticClass: { type: Type.STRING, description: 'Therapeutic class in Persian.' },
          sourceType: { type: Type.STRING, description: 'prescription, box, or manual.' },
          dosing: {
            type: Type.OBJECT,
            properties: {
              adultDose: { type: Type.STRING },
              pediatricDose: { type: Type.STRING },
              maxDailyDose: { type: Type.STRING },
              renalHepaticAdjustment: { type: Type.STRING },
              prescribedRegimen: { type: Type.STRING },
            },
            required: ['adultDose', 'pediatricDose', 'maxDailyDose', 'renalHepaticAdjustment'],
          },
          safety: {
            type: Type.OBJECT,
            properties: {
              criticalWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              pregnancyLactation: { type: Type.STRING },
              commonSideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
              monitoring: { type: Type.ARRAY, items: { type: Type.STRING } },
              highAlert: { type: Type.BOOLEAN },
            },
            required: ['criticalWarnings', 'pregnancyLactation', 'commonSideEffects', 'monitoring'],
          },
          usage: {
            type: Type.OBJECT,
            properties: {
              withFood: { type: Type.STRING },
              timing: { type: Type.STRING },
              dosageFormsAndVariations: { type: Type.ARRAY, items: { type: Type.STRING } },
              patientCounseling: { type: Type.ARRAY, items: { type: Type.STRING } },
              missedDose: { type: Type.STRING },
            },
            required: ['withFood', 'timing', 'dosageFormsAndVariations', 'patientCounseling', 'missedDose'],
          },
        },
        required: [
          'id',
          'persianName',
          'genericName',
          'strength',
          'dosageForm',
          'therapeuticClass',
          'sourceType',
          'dosing',
          'safety',
          'usage',
        ],
      },
    },
    interactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          drugA: { type: Type.STRING },
          drugB: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            description: 'Must be exactly one of: major, moderate, minor',
          },
          mechanism: { type: Type.STRING },
          clinicalEffect: { type: Type.STRING },
          management: { type: Type.STRING },
        },
        required: ['id', 'drugA', 'drugB', 'severity', 'mechanism', 'clinicalEffect', 'management'],
      },
    },
  },
  required: ['detectedSourceType', 'clinicalSummary', 'medications', 'interactions'],
};

const INTERACTIONS_ONLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clinicalSummary: { type: Type.STRING },
    interactions: PHARMACY_RESPONSE_SCHEMA.properties.interactions,
  },
  required: ['clinicalSummary', 'interactions'],
};

const SYSTEM_INSTRUCTION = `شما یک دستیار داروساز بالینی (Clinical Pharmacist Assistant) دقیق و حرفه‌ای برای داروخانه‌های فارسی‌زبان هستید.
وظیفه شما تشخیص سریع و دقیق داروها از روی تصویر نسخه/فیش دارویی، تصویر جلد/جعبه/بلیستر دارو، یا نام داروی واردشده است.
قوانین پاسخ‌دهی:
1. تمام توضیحات بالینی، دوزینگ، هشدارهای ایمنی، تداخل‌های دارویی، نحوه و تنوع مصرف (اشکال دارویی مختلف، جایگزین‌های رایج، زمان مصرف نسبت به غذا) باید به زبان فارسی روان، دقیق و حرفه‌ای داروسازی باشد.
2. نام ژنریک انگلیسی (genericName) و دوز عددی (strength مانند 500 mg) را به شکل استاندارد انگلیسی/بین‌المللی ثبت کنید تا تطبیق تداخل دقیق بماند.
3. برای هر دارو، بخش تنوع مصرف (dosageFormsAndVariations) را غنی بنویسید: اشکال دارویی مختلف موجود (قرص، کپسول، شربت، آهسته‌رهش، تزریقی، موضعی، ترکیبات ثابت) و نکات کلیدی مشاوره به بیمار.
4. اگر فهرست داروهای فعلی نسخه (existingDrugNames) ارسال شده است، تداخل‌های بین داروهای جدید و داروهای قبلی و همچنین بین خود داروهای جدید را کامل بررسی کنید.
5. مقدار severity در interactions باید دقیقاً یکی از سه مقدار "major" یا "moderate" یا "minor" باشد.
6. اگر تصویر ناخوانا است یا هیچ دارویی در آن دیده نمی‌شود، آرایه medications را خالی برگردانید و در clinicalSummary دلیل را به فارسی واضح توضیح دهید.`;

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const isRetryable = !status || status >= 500 || status === 429;
      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
    }
  }
  throw lastError;
}

function mapApiError(err: unknown): { status: number; message: string } {
  const errorObj = err as { status?: number; message?: string };
  const msg = errorObj?.message ?? '';

  if (msg === 'MISSING_GEMINI_API_KEY') {
    return {
      status: 503,
      message: 'کلید سرویس هوش مصنوعی (GEMINI_API_KEY) در تنظیمات سرور پیکربندی نشده است.',
    };
  }
  if (errorObj?.status === 403 || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'دسترسی به سرویس تشخیص هوش مصنوعی مجاز نیست. لطفاً کلید API را در بخش Settings > Secrets بررسی کنید.',
    };
  }
  if (errorObj?.status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'سقف درخواست‌های لحظه‌ای سرویس تکمیل شده است. لطفاً چند ثانیه دیگر مجدداً تلاش کنید.',
    };
  }
  return {
    status: 500,
    message: 'خطا در تحلیل تصویر یا دریافت اطلاعات دارویی از سرور. لطفاً دوباره تلاش کنید.',
  };
}

function sanitizeNormalizedPayload(raw: Record<string, unknown>, fallbackSource: 'prescription' | 'box' | 'manual') {
  const medications = Array.isArray(raw.medications)
    ? raw.medications.map((m: Record<string, unknown>, idx: number) => ({
        ...m,
        id: typeof m.id === 'string' && m.id.trim() ? m.id : `ai-med-${Date.now()}-${idx}`,
        sourceType:
          m.sourceType === 'prescription' || m.sourceType === 'box' || m.sourceType === 'manual'
            ? m.sourceType
            : fallbackSource,
      }))
    : [];

  const interactions = Array.isArray(raw.interactions)
    ? raw.interactions.map((item: Record<string, unknown>, idx: number) => {
        const sev = String(item.severity ?? 'moderate').toLowerCase();
        const normalizedSeverity = sev === 'major' || sev === 'moderate' || sev === 'minor' ? sev : 'moderate';
        return {
          ...item,
          id: typeof item.id === 'string' && item.id.trim() ? item.id : `ai-int-${Date.now()}-${idx}`,
          severity: normalizedSeverity,
          source: 'ai',
        };
      })
    : [];

  const detectedSource =
    raw.detectedSourceType === 'prescription' ||
    raw.detectedSourceType === 'box' ||
    raw.detectedSourceType === 'manual'
      ? raw.detectedSourceType
      : fallbackSource;

  return {
    detectedSourceType: detectedSource,
    clinicalSummary:
      typeof raw.clinicalSummary === 'string'
        ? raw.clinicalSummary
        : 'تحلیل دارویی با موفقیت انجام شد.',
    medications,
    interactions,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-image', async (req, res) => {
    try {
      const { imageBase64, mimeType, scanMode = 'auto', existingDrugNames = [] } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'تصویر معتبری برای تحلیل ارسال نشده است.' });
        return;
      }

      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const resolvedMime = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

      const modeHint =
        scanMode === 'prescription'
          ? 'کاربر حالت «فیش / نسخه دارویی» را انتخاب کرده است. تمام اقلام دارویی نوشته‌شده در نسخه و دستور مصرف (Sig) هر قلم را استخراج کن.'
          : scanMode === 'box'
            ? 'کاربر حالت «جلد و بسته دارو» را انتخاب کرده است. نام برند، نام ژنریک، دوز و شکل دارویی روی جعبه یا بلیستر را استخراج کن.'
            : 'ابتدا تشخیص بده تصویر مربوط به «فیش/نسخه» است یا «جلد/جعبه دارو»، سپس تمام داروها را استخراج کن.';

      const existingList =
        Array.isArray(existingDrugNames) && existingDrugNames.length > 0
          ? `داروهای از پیش موجود در نسخه فعال بیمار (جهت بررسی تداخل با داروهای جدید): ${existingDrugNames.join(', ')}`
          : 'در حال حاضر داروی قبلی در لیست نیست؛ تداخل بین خود داروهای موجود در تصویر را بررسی کن.';

      const ai = createAiClient();
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: cleanBase64,
                },
              },
              {
                text: `${modeHint}\n${existingList}\nاطلاعات کامل دوزینگ، تداخل‌ها، هشدارهای ایمنی و تنوع مصرف را در قالب JSON برگردان.`,
              },
            ],
          },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: PHARMACY_RESPONSE_SCHEMA,
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const fallbackSource = scanMode === 'box' ? 'box' : 'prescription';
      res.json(sanitizeNormalizedPayload(parsed, fallbackSource));
    } catch (err) {
      const mapped = mapApiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/analyze-drugs', async (req, res) => {
    try {
      const { query, existingDrugNames = [] } = req.body ?? {};
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'لطفاً نام معتبر دارو را وارد کنید.' });
        return;
      }

      const existingList =
        Array.isArray(existingDrugNames) && existingDrugNames.length > 0
          ? `داروهای فعلی نسخه بیمار جهت بررسی تداخل: ${existingDrugNames.join(', ')}`
          : 'تداخل‌های داخلی بین داروهای ورودی (اگر بیش از یک دارو وارد شده) را بررسی کن.';

      const ai = createAiClient();
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `داروی درخواستی داروساز: "${query.trim()}"\n${existingList}\nمونوگراف کامل دوزینگ، نکات ایمنی و هشدارهای مهم، تنوع مصرف (اشکال دارویی و نحوه مصرف) و تداخل‌های دارویی را به فارسی برگردان.`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: PHARMACY_RESPONSE_SCHEMA,
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(sanitizeNormalizedPayload(parsed, 'manual'));
    } catch (err) {
      const mapped = mapApiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/check-interactions', async (req, res) => {
    try {
      const { drugNames = [] } = req.body ?? {};
      if (!Array.isArray(drugNames) || drugNames.length < 2) {
        res.status(400).json({ error: 'برای بررسی تداخل حداقل دو دارو لازم است.' });
        return;
      }

      const ai = createAiClient();
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: `فهرست داروهای نسخه بیمار: ${drugNames.join('، ')}\nتمام تداخل‌های دارویی مهم (شدید، متوسط، خفیف) بین این داروها را به همراه مکانیسم، اثر بالینی و راهکار مدیریت برای داروساز به فارسی برگردان.`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: INTERACTIONS_ONLY_SCHEMA,
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const interactions = Array.isArray(parsed.interactions)
        ? parsed.interactions.map((item: Record<string, unknown>, idx: number) => {
            const sev = String(item.severity ?? 'moderate').toLowerCase();
            return {
              ...item,
              id: typeof item.id === 'string' && item.id.trim() ? item.id : `ai-check-${Date.now()}-${idx}`,
              severity: sev === 'major' || sev === 'moderate' || sev === 'minor' ? sev : 'moderate',
              source: 'ai',
            };
          })
        : [];

      res.json({
        clinicalSummary: typeof parsed.clinicalSummary === 'string' ? parsed.clinicalSummary : '',
        interactions,
      });
    } catch (err) {
      const mapped = mapApiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DaruYar server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
