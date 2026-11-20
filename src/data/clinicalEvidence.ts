/**
 * Curated, concise source-derived pharmacist review notes.
 *
 * Important: these are NOT verified prescribing orders, a dosing engine,
 * or a replacement for the existing formulary. Each note is provisional.
 * References are bibliographic pointers, not reproduced textbook content.
 *
 * A pharmacist must verify against current product labeling, contemporary
 * guidelines, patient factors and Iranian market products before approval.
 */
export type EvidenceReferenceId =
  | 'nelson2019-fever'
  | 'nelson2019-otitis'
  | 'dipiro2023-diabetes'
  | 'dipiro2023-vte'
  | 'dipiro2023-ihd'
  | 'dipiro2023-insulin'
  | 'dipiro2023-thyroid'
  | 'dipiro2023-gerd'
  | 'dipiro2023-dyslipidemia'
  | 'dipiro2023-hypertension'
  | 'applied2024-diabetes'
  | 'applied2024-anticoagulation';

export interface EvidenceReference {
  id: EvidenceReferenceId;
  book: string;
  edition: string;
  year: number;
  location: string;
}

export interface ClinicalEvidenceNote {
  id: string;
  genericKey: string;
  topic: string;
  clinicalSummary: string;
  boundaries: string;
  references: EvidenceReferenceId[];
  reviewStatus: 'pending-pharmacist-review';
}

export const EVIDENCE_REFERENCES: Record<EvidenceReferenceId, EvidenceReference> = {
  'nelson2019-fever': {
    id: 'nelson2019-fever',
    book: 'Nelson Essentials of Pediatrics',
    edition: '8th',
    year: 2019,
    location: 'Chapter 96, Fever Without a Focus; printed pages 368–371',
  },
  'nelson2019-otitis': {
    id: 'nelson2019-otitis',
    book: 'Nelson Essentials of Pediatrics',
    edition: '8th',
    year: 2019,
    location: 'Chapter 105, Otitis Media; printed pages 395–397',
  },
  'dipiro2023-diabetes': {
    id: 'dipiro2023-diabetes',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 19, Diabetes Mellitus; printed pages 202–205',
  },
  'dipiro2023-vte': {
    id: 'dipiro2023-vte',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 14, Venous Thromboembolism; printed page 167',
  },
  'dipiro2023-ihd': {
    id: 'dipiro2023-ihd',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 11, Ischemic Heart Disease; printed page 134',
  },
  'dipiro2023-insulin': {
    id: 'dipiro2023-insulin',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 19, Diabetes Mellitus; printed pages 202–203',
  },
  'dipiro2023-thyroid': {
    id: 'dipiro2023-thyroid',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 20, Thyroid Disorders; printed pages 226–228',
  },
  'dipiro2023-gerd': {
    id: 'dipiro2023-gerd',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 24, Gastroesophageal Reflux Disease; printed pages 255–257',
  },
  'dipiro2023-dyslipidemia': {
    id: 'dipiro2023-dyslipidemia',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 8, Dyslipidemia; printed pages 87–88',
  },
  'dipiro2023-hypertension': {
    id: 'dipiro2023-hypertension',
    book: "DiPiro's Pharmacotherapy Handbook",
    edition: '12th',
    year: 2023,
    location: 'Chapter 10, Hypertension; printed pages 119–122',
  },
  'applied2024-diabetes': {
    id: 'applied2024-diabetes',
    book: 'Applied Therapeutics: The Clinical Use of Drugs',
    edition: '12th',
    year: 2024,
    location: 'Chapter 53, Type 2 Diabetes; Case 53-11, metformin counseling and monitoring',
  },
  'applied2024-anticoagulation': {
    id: 'applied2024-anticoagulation',
    book: 'Applied Therapeutics: The Clinical Use of Drugs',
    edition: '12th',
    year: 2024,
    location: 'Chapter 11, anticoagulation; INR follow-up and Case 11-7',
  },
};

export const CLINICAL_EVIDENCE_NOTES: ClinicalEvidenceNote[] = [
  {
    id: 'fever-acetaminophen',
    genericKey: 'acetaminophen',
    topic: 'تب و درمان علامتی کودک',
    clinicalSummary: 'استامینوفن برای کاهش ناراحتی ناشی از تب به کار می‌رود؛ پاسخ به تب‌بر، عفونت باکتریایی را از ویروسی افتراق نمی‌دهد.',
    boundaries: 'این یادداشت هیچ دوز اختصاصی تعیین نمی‌کند. سن، وزن، فراورده، غلظت شربت و دریافت هم‌زمان استامینوفن باید بررسی شود.',
    references: ['nelson2019-fever'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'fever-ibuprofen',
    genericKey: 'ibuprofen',
    topic: 'تب و درد کودک',
    clinicalSummary: 'ایبوپروفن یکی از گزینه‌های علامتی تب و درد در کودکان است؛ درمان علامتی جایگزین ارزیابی علت تب و علائم هشدار نیست.',
    boundaries: 'حداقل سن مصرف، دهیدراتاسیون، بیماری کلیوی و دوز وابسته به وزن باید طبق اطلاعات روز محصول و پروتکل بالینی بازبینی شود.',
    references: ['nelson2019-fever', 'nelson2019-otitis'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'fever-aspirin',
    genericKey: 'aspirin',
    topic: 'هشدار تب‌بر اطفال',
    clinicalSummary: 'آسپرین به دلیل ارتباط با سندرم ری، برای کاهش تب معمول کودکان توصیه نمی‌شود.',
    boundaries: 'این هشدار به معنی ممنوعیت همه اندیکاسیون‌های تخصصی آسپرین در اطفال نیست؛ موارد اختصاصی فقط با تجویز و پایش متخصص است.',
    references: ['nelson2019-fever'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'aom-amoxicillin',
    genericKey: 'amoxicillin',
    topic: 'اوتیت میانی حاد (AOM)',
    clinicalSummary: 'در کودکانی که بر اساس سن، قطعیت تشخیص و شدت بیماری به آنتی‌بیوتیک نیاز دارند، نلسون آموکسی‌سیلین را درمان خط اول رایج ذکر می‌کند؛ مشاهده همراه با پیگیری برای بعضی موارد خفیف مطرح است.',
    boundaries: 'رژیم درمانی مختص AOM است، نه همه عفونت‌ها. پیش از تجویز، تشخیص، حساسیت به بتالاکتام، وزن، سن و راهنماهای جدید بررسی شوند.',
    references: ['nelson2019-otitis'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'aom-amoxicillin-clavulanate',
    genericKey: 'amoxicillin-clavulanate',
    topic: 'AOM و عدم پاسخ درمانی',
    clinicalSummary: 'در عدم بهبود پس از درمان اولیه، نلسون بررسی مجدد تشخیص و استفاده از گزینه‌هایی مانند آموکسی‌سیلین/کلاوولانات را مطرح می‌کند.',
    boundaries: 'انتخاب فراورده و نسبت آموکسی‌سیلین به کلاوولانات باید جداگانه تأیید شود؛ نتیجه اسکن یا AI مبنای تغییر درمان نیست.',
    references: ['nelson2019-otitis'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'diabetes-metformin',
    genericKey: 'metformin',
    topic: 'دیابت نوع ۲؛ تحمل گوارشی و ایمنی کلیه',
    clinicalSummary: 'عوارض گوارشی متفورمین غالباً با مصرف همراه غذا و افزایش تدریجی دوز کمتر می‌شوند. پایش عملکرد کلیه و ارزیابی ویتامین B12 در مصرف طولانی‌مدت اهمیت دارد.',
    boundaries: 'در eGFR کمتر از ۳۰ mL/min/1.73m² مصرف متفورمین منع دارد. شروع درمان در eGFR ۳۰ تا ۴۵ باید با برچسب روز و شرایط بیمار ارزیابی شود؛ دستور قطع پیرامون ماده حاجب برای همه بیماران یکسان نیست.',
    references: ['dipiro2023-diabetes', 'applied2024-diabetes'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'anticoagulation-warfarin',
    genericKey: 'warfarin',
    topic: 'وارفارین؛ INR، خونریزی و تغییرات درمان',
    clinicalSummary: 'نیاز به پایش INR با شروع و تغییر دوز، تغییر داروهای هم‌زمان و تغییر قابل‌توجه مصرف غذاهای حاوی ویتامین K افزایش می‌یابد؛ خونریزی مهم‌ترین عارضه بالینی است.',
    boundaries: 'هدف INR وابسته به اندیکاسیون است. هرگونه قطع، تغییر دوز یا برگشت اثر ضدانعقادی باید با ارزیابی وضعیت خونریزی و نظر درمانگر انجام شود.',
    references: ['dipiro2023-vte', 'applied2024-anticoagulation'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'ihd-clopidogrel',
    genericKey: 'clopidogrel',
    topic: 'ضدپلاکت در بیماری ایسکمیک قلب',
    clinicalSummary: 'پاسخ به کلوپیدوگرل متغیر است؛ عدم پایبندی، وضعیت CYP2C19 و تداخل برخی داروهای هم‌زمان از جمله بعضی PPIها می‌تواند مهم باشد.',
    boundaries: 'قطع خودسرانه ضدپلاکت پس از استنت خطرناک است. تصمیم درباره تغییر P2Y12 یا PPI باید با اندیکاسیون و وضعیت قلبی بیمار تطبیق داده شود.',
    references: ['dipiro2023-ihd'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'hypothyroidism-levothyroxine',
    genericKey: 'levothyroxine',
    topic: 'جایگزینی هورمون تیروئید و تداخل جذب',
    clinicalSummary: 'لووتیروکسین درمان جایگزینی استاندارد کم‌کاری تیروئید است. کلسیم، آهن و برخی داروها و غذاها می‌توانند جذب آن را کاهش دهند؛ تنظیم درمان با شاخص‌های تیروئیدی پیگیری می‌شود.',
    boundaries: 'فاصله مصرف از مکمل‌ها و هدف TSH در بارداری، نوزادی یا اختلال هیپوفیز یکسان نیست و باید با شرایط بیمار و فراورده به‌روز تطبیق داده شود.',
    references: ['dipiro2023-thyroid'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'gerd-omeprazole',
    genericKey: 'omeprazole',
    topic: 'مهارکننده پمپ پروتون؛ GERD و تداخل دارویی',
    clinicalSummary: 'مهارکننده‌های پمپ پروتون در GERD با علائم قابل‌توجه استفاده می‌شوند. در مصرف طولانی‌مدت، ضرورت ادامه درمان و عوارض بالقوه باید بازبینی شود؛ امپرازول می‌تواند با فعال‌سازی کلوپیدوگرل تداخل داشته باشد.',
    boundaries: 'مدت درمان، انتخاب فراورده و نحوه مصرف بر اساس اندیکاسیون متفاوت است؛ تغییر داروی ضدپلاکت یا PPI بدون بازبینی درمانی انجام نشود.',
    references: ['dipiro2023-gerd', 'dipiro2023-ihd'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'dyslipidemia-atorvastatin',
    genericKey: 'atorvastatin',
    topic: 'استاتین‌ها؛ پایش عوارض عضلانی',
    clinicalSummary: 'آتورواستاتین از داروهای کاهش LDL است. در صورت درد یا ضعف عضلانی غیرمعمول باید عوارض عضلانی استاتین و عوامل مستعدکننده بررسی شوند؛ سنجش روتین CK در بیمار بی‌علامت توصیه عمومی نیست.',
    boundaries: 'شدت درمان، تداخل با مهارکننده‌های CYP و وضعیت بیماری کبدی باید فردمحور بازبینی شوند؛ درد عضلانی به‌تنهایی اثبات رابدومیولیز نیست.',
    references: ['dipiro2023-dyslipidemia'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'hypertension-losartan',
    genericKey: 'losartan',
    topic: 'ARB در کنترل فشارخون',
    clinicalSummary: 'لوزارتان از دسته مسدودکننده‌های گیرنده آنژیوتانسین است. ارزیابی پاسخ فشارخون، عملکرد کلیه، پتاسیم و داروهای هم‌زمان در انتخاب و پیگیری درمان اهمیت دارد.',
    boundaries: 'بارداری، کم‌آبی، تنگی شریان کلیوی، مکمل پتاسیم و ترکیبات مؤثر بر محور رنین-آنژیوتانسین باید جداگانه بررسی شوند.',
    references: ['dipiro2023-hypertension'],
    reviewStatus: 'pending-pharmacist-review',
  },
  {
    id: 'diabetes-basal-insulin',
    genericKey: 'insulin-glargine',
    topic: 'انسولین پایه؛ دیابت و ایمنی تزریق',
    clinicalSummary: 'انسولین‌های پایه بخشی از درمان فردمحور دیابت هستند. هیپوگلیسمی، تغییرات وزن و مشکلات محل تزریق باید ارزیابی شوند؛ چرخاندن محل تزریق اهمیت دارد.',
    boundaries: 'تعیین یا تغییر دوز انسولین تنها با توجه به نوع دیابت، قند خون، الگوی غذا، عوامل خطر هیپوگلیسمی و تأیید بالینی انجام شود.',
    references: ['dipiro2023-insulin'],
    reviewStatus: 'pending-pharmacist-review',
  },
];

export function normalizeEvidenceDrugKey(genericName: string): string | null {
  const name = genericName.toLowerCase().trim();
  if (name.includes('amoxicillin') && name.includes('clavulanate')) return 'amoxicillin-clavulanate';
  if (name.startsWith('amoxicillin')) return 'amoxicillin';
  if (name.startsWith('acetaminophen') || name.startsWith('paracetamol')) return 'acetaminophen';
  if (name.startsWith('ibuprofen')) return 'ibuprofen';
  if (name.startsWith('aspirin')) return 'aspirin';
  if (name.startsWith('metformin')) return 'metformin';
  if (name.startsWith('warfarin')) return 'warfarin';
  if (name.startsWith('clopidogrel')) return 'clopidogrel';
  if (name.startsWith('insulin glargine')) return 'insulin-glargine';
  if (name.startsWith('levothyroxine')) return 'levothyroxine';
  if (name.startsWith('omeprazole')) return 'omeprazole';
  if (name.startsWith('atorvastatin')) return 'atorvastatin';
  if (name.startsWith('losartan')) return 'losartan';
  return null;
}

export function getClinicalEvidenceForDrug(genericName: string): ClinicalEvidenceNote[] {
  const key = normalizeEvidenceDrugKey(genericName);
  return key ? CLINICAL_EVIDENCE_NOTES.filter((item) => item.genericKey === key) : [];
}
