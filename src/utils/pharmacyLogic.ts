import type {
  DrugInteraction,
  InteractionSeverity,
  MedicationItem,
  PrescriptionRiskSummary,
  ScanSession,
  SeverityFilter,
} from '../types/pharmacy';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

const SEVERITY_RANK: Record<InteractionSeverity, number> = {
  major: 3,
  moderate: 2,
  minor: 1,
};

export const QUICK_DOSING_SCHEDULE_PRESETS: string[] = [
  'هر ۸ ساعت ۱ عدد',
  'هر ۱۲ ساعت ۱ عدد',
  'روزی ۱ عدد صبح',
  'روزی ۱ عدد شب',
  'هر ۶ ساعت ۱ عدد',
  'در صورت نیاز',
];

interface LocalInteractionRule {
  id: string;
  groupA: string[];
  groupB: string[];
  severity: InteractionSeverity;
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

const LOCAL_INTERACTION_RULES: LocalInteractionRule[] = [
  {
    id: 'rule-warfarin-aspirin',
    groupA: ['warfarin', 'وارفارین'],
    groupB: ['aspirin', 'asa', 'آسپرین'],
    severity: 'major',
    mechanism: 'اثر هم‌افزایی ضدپلاکتی آسپرین با اثر ضدانعقادی وارفارین و افزایش آسیب مخاط گوارشی',
    clinicalEffect: 'افزایش شدید خطر خونریزی گوارشی و سیستمیک و بالا رفتن خطر خونریزی حتی در INR درمانی',
    management:
      'در صورت عدم اندیکاسیون قطعی قلبی برای آسپرین دوز پایین، از مصرف هم‌زمان خودداری شود. در صورت ضرورت، پنتوپرازول به عنوان محافظ معده بررسی و پایش دقیق INR و علائم خونریزی به بیمار گوشزد شود.',
  },
  {
    id: 'rule-warfarin-nsaid',
    groupA: ['warfarin', 'وارفارین'],
    groupB: [
      'ibuprofen',
      'ایبوپروفن',
      'naproxen',
      'ناپروکسن',
      'diclofenac',
      'دیکلوفناک',
      'mefenamic',
      'مفنامیک',
      'celecoxib',
      'سلکوکسیب',
    ],
    severity: 'major',
    mechanism: 'مهار عملکرد پلاکتی و فرسایش مخاط معده توسط NSAID همراه با جابه‌جایی وارفارین از پروتئین‌های پلاسما',
    clinicalEffect: 'افزایش شدید خطر زخم و خونریزی گوارشی تهدیدکننده حیات و افزایش غیرقابل‌پیش‌بینی INR',
    management:
      'از مصرف هم‌زمان مسکن‌های NSAID (مانند ایبوپروفن) با وارفارین خودداری شود. با هماهنگی پزشک، استامینوفن با دوز کنترل‌شده یا مسکن موضعی جایگزین ایمن‌تری است و پایش INR الزامی است.',
  },
  {
    id: 'rule-warfarin-omeprazole',
    groupA: ['warfarin', 'وارفارین'],
    groupB: ['omeprazole', 'امپرازول', 'esomeprazole', 'اس‌امپرازول'],
    severity: 'moderate',
    mechanism: 'مهار آنزیم CYP2C19 توسط امپرازول و کاهش پاکسازی ایزومر R-وارفارین',
    clinicalEffect: 'افزایش غلظت سرمی وارفارین و احتمال افزایش INR و خونریزی',
    management:
      'پنتوپرازول گزینه کم‌تداخل‌تر به جای امپرازول است. در صورت ادامه مصرف امپرازول، پایش INR طی ۱ تا ۲ هفته توصیه می‌شود.',
  },
  {
    id: 'rule-clopidogrel-omeprazole',
    groupA: ['clopidogrel', 'کلوپیدوگرل', 'پلاویکس', 'plavix'],
    groupB: ['omeprazole', 'امپرازول', 'esomeprazole', 'اس‌امپرازول'],
    severity: 'major',
    mechanism: 'مهار آنزیم CYP2C19 و جلوگیری از تبدیل پیش‌داروی کلوپیدوگرل به متابولیت فعال',
    clinicalEffect: 'کاهش اثربخشی ضدپلاکتی و افزایش خطر حوادث ترومبوتیک و سکته قلبی',
    management:
      'جایگزینی امپرازول با پنتوپرازول یا فاموتیدین با هماهنگی پزشک معالج شدیداً توصیه می‌شود.',
  },
  {
    id: 'rule-statin-macrolide',
    groupA: ['atorvastatin', 'آتورواستاتین', 'simvastatin', 'سیمواستاتین', 'lovastatin', 'لواستاتین'],
    groupB: ['azithromycin', 'آزیترومایسین', 'clarithromycin', 'کلاریترومایسین', 'erythromycin', 'اریترومایسین'],
    severity: 'moderate',
    mechanism: 'مهار متابولیسم کبدی CYP3A4 (به‌ویژه با کلاریترومایسین) و افزایش فراهمی زیستی استاتین در عضلات',
    clinicalEffect: 'افزایش خطر میوپاتی، دردهای عضلانی شدید و رابدومیولیز همراه با افزایش آنزیم CK',
    management:
      'با کلاریترومایسین قطع موقت استاتین طی دوره آنتی‌بیوتیک توصیه می‌شود. با آزیترومایسین ریسک کمتر است اما در صورت بروز درد یا ضعف عضلانی غیرمعمول و ادرار تیره، بیمار باید فوراً مراجعه کند.',
  },
  {
    id: 'rule-arb-acei-nsaid',
    groupA: [
      'losartan',
      'لوزارتان',
      'valsartan',
      'والزارتان',
      'enalapril',
      'انالاپریل',
      'captopril',
      'کاپتوپریل',
      'lisinopril',
      'لیزینوپریل',
    ],
    groupB: [
      'ibuprofen',
      'ایبوپروفن',
      'naproxen',
      'ناپروکسن',
      'diclofenac',
      'دیکلوفناک',
      'indomethacin',
      'ایندومتاسین',
      'meloxicam',
      'ملوکسیکام',
    ],
    severity: 'moderate',
    mechanism: 'مهار سنتز پروستاگلاندین‌های گشادکننده آرتریول آوران کلیه و کاهش جریان خون گلومرولی',
    clinicalEffect: 'کاهش اثر کاهنده فشار خون و افزایش خطر آسیب حاد کلیوی (AKI) و هایپرکالمی به‌ویژه در سالمندان',
    management:
      'در صورت نیاز به مسکن، استامینوفن جایگزین ایمن‌تری است. اگر NSAID ضروری باشد، کمترین دوز برای کوتاه‌ترین زمان و با پایش فشار خون و کراتینین مصرف شود.',
  },
  {
    id: 'rule-aspirin-ibuprofen',
    groupA: ['aspirin', 'asa', 'آسپرین'],
    groupB: ['ibuprofen', 'ایبوپروفن', 'naproxen', 'ناپروکسن'],
    severity: 'major',
    mechanism: 'رقابت برگشت‌پذیر ایبوپروفن بر سر جایگاه اتصال COX-1 پلاکتی و هم‌افزایی آسیب مخاط معده',
    clinicalEffect: 'خنثی‌سازی اثر محافظت قلبی آسپرین دوز پایین و افزایش چشمگیر ریسک زخم و خونریزی گوارشی',
    management:
      'در مصرف هم‌زمان اجباری، ایبوپروفن حداقل ۲ ساعت پس از آسپرین ساده (یا ۸ ساعت قبل) مصرف شود و محافظت گوارشی بررسی گردد.',
  },
  {
    id: 'rule-metformin-nsaid',
    groupA: ['metformin', 'متفورمین'],
    groupB: ['ibuprofen', 'ایبوپروفن', 'diclofenac', 'دیکلوفناک', 'naproxen', 'ناپروکسن'],
    severity: 'minor',
    mechanism: 'کاهش احتمالی فیلتراسیون گلومرولی توسط NSAID و کاهش پاکسازی کلیوی متفورمین',
    clinicalEffect: 'در بیماران دچار کم‌آبی یا نارسایی کلیه می‌تواند خطر تجمع متفورمین و اسیدوز لاکتیک را افزایش دهد',
    management:
      'مصرف کوتاه‌مدت در عملکرد کلیوی نرمال ایمن است؛ هیدراتاسیون کافی و پرهیز از مصرف طولانی‌مدت خودسرانه NSAID توصیه می‌شود.',
  },
  {
    id: 'rule-nitrate-sildenafil',
    groupA: ['nitroglycerin', 'نیتروگلیسیرین', 'isosorbide', 'ایزوسورباید'],
    groupB: ['sildenafil', 'سیلدنافیل', 'tadalafil', 'تادالافیل'],
    severity: 'major',
    mechanism: 'تجمع شدید cGMP در عضلات صاف عروقی و اتساع عروق کنترل‌نشده',
    clinicalEffect: 'افت فشار خون حاد و تهدیدکننده حیات، سنکوپ و ایسکمی میوکارد',
    management:
      'منع مصرف مطلق (Contraindicated). حداقل ۲۴ ساعت فاصله از سیلدنافیل و ۴۸ ساعت از تادالافیل الزامی است.',
  },
  {
    id: 'rule-tramadol-ssri',
    groupA: ['tramadol', 'ترامادول'],
    groupB: ['fluoxetine', 'فلوکستین', 'sertraline', 'سرترالین', 'citalopram', 'سیتالوپرام', 'escitalopram', 'اس‌سیتالوپرام'],
    severity: 'major',
    mechanism: 'افزایش تجمع سروتونین سیناپسی و کاهش آستانه تشنج، همراه با مهار CYP2D6 در برخی SSRIها',
    clinicalEffect: 'خطر سندرم سروتونین، تشنج و کاهش اثر ضددرد متابولیت فعال ترامادول',
    management:
      'از ترکیب هم‌زمان پرهیز و جایگزین ضددرد غیرسروتونرژیک با پزشک هماهنگ شود.',
  },
  {
    id: 'rule-spironolactone-arb-acei',
    groupA: ['spironolactone', 'اسپیرونولاکتون'],
    groupB: ['losartan', 'لوزارتان', 'valsartan', 'والزارتان', 'enalapril', 'انالاپریل', 'captopril', 'کاپتوپریل'],
    severity: 'major',
    mechanism: 'مهار هم‌زمان محور رنین-آنژیوتانسین-آلدوسترون و کاهش دفع کلیوی پتاسیم',
    clinicalEffect: 'افزایش خطر هایپرکالمی شدید و آریتمی قلبی، به‌ویژه در سالمندان و بیماران کلیوی یا دیابتی',
    management:
      'در نارسایی قلبی با دوز کنترل‌شده قابل استفاده است اما پایش دقیق پتاسیم و کراتینین سرم و پرهیز از مکمل پتاسیم و NSAID الزامی است.',
  },
  {
    id: 'rule-warfarin-antibiotics',
    groupA: ['warfarin', 'وارفارین'],
    groupB: ['metronidazole', 'مترونیدازول', 'ciprofloxacin', 'سیپروفلوکساسین', 'clarithromycin', 'کلاریترومایسین'],
    severity: 'major',
    mechanism: 'مهار آنزیم‌های CYP2C9/CYP3A4 کبدی و کاهش فلور روده‌ای تولیدکننده ویتامین K',
    clinicalEffect: 'افزایش شدید و سریع INR و خطر خونریزی بالینی مهم طی ۳ تا ۵ روز پس از شروع آنتی‌بیوتیک',
    management:
      'هماهنگی با پزشک برای بررسی آنتی‌بیوتیک جایگزین کم‌تداخل‌تر یا کاهش پیشگیرانه دوز وارفارین همراه با چک INR طی ۳ تا ۵ روز.',
  },
  {
    id: 'rule-clarithromycin-amlodipine',
    groupA: ['clarithromycin', 'کلاریترومایسین'],
    groupB: ['amlodipine', 'املودیپین'],
    severity: 'moderate',
    mechanism: 'مهار قوی متابولیسم CYP3A4 املودیپین توسط کلاریترومایسین',
    clinicalEffect: 'افزایش غلظت سرمی املودیپین و خطر افت فشار خون علامت‌دار، سرگیجه و آسیب حاد کلیوی',
    management:
      'در صورت امکان جایگزینی کلاریترومایسین با آزیترومایسین با نظر پزشک، یا پایش دقیق فشار خون و علائم سرگیجه.',
  },
  {
    id: 'rule-gabapentin-tramadol',
    groupA: ['gabapentin', 'گاباپنتین'],
    groupB: ['tramadol', 'ترامادول'],
    severity: 'major',
    mechanism: 'اثر هم‌افزایی تضعیف‌کننده سیستم عصبی مرکزی (CNS) و مرکز تنفس',
    clinicalEffect: 'افزایش خطر خواب‌آلودگی شدید، گیجی، سقوط در سالمندان و تضعیف تنفسی',
    management:
      'از مصرف هم‌زمان غیرضروری پرهیز شود؛ در صورت ضرورت، کمترین دوز ممکن با هشدار جدی درباره عدم رانندگی و پایش هوشیاری.',
  },
  {
    id: 'rule-ssri-nsaid',
    groupA: ['sertraline', 'سرترالین', 'fluoxetine', 'فلوکستین'],
    groupB: ['ibuprofen', 'ایبوپروفن', 'naproxen', 'ناپروکسن', 'diclofenac', 'دیکلوفناک', 'aspirin', 'آسپرین'],
    severity: 'moderate',
    mechanism: 'کاهش ذخیره سروتونین پلاکتی توسط SSRI و اختلال در تجمع پلاکتی همراه با آسیب مخاط گوارشی توسط NSAID',
    clinicalEffect: 'افزایش ۲ تا ۴ برابری ریسک خونریزی فوقانی گوارشی',
    management:
      'استامینوفن مسکن ایمن‌تری است؛ در صورت نیاز به NSAID یا آسپرین طولانی‌مدت، افزودن پنتوپرازول جهت محافظت معده بررسی شود.',
  },
  {
    id: 'rule-metformin-atorvastatin-check',
    groupA: ['atorvastatin', 'آتورواستاتین'],
    groupB: ['aspirin', 'آسپرین'],
    severity: 'minor',
    mechanism: 'فاقد تداخل فارماکوکینتیک بالینی قابل‌توجه؛ هر دو در پروتکل پیشگیری قلبی-عروقی هم‌زمان تجویز می‌شوند',
    clinicalEffect: 'تحمل‌پذیری مناسب؛ تنها توجه به علائم گوارشی آسپرین و درد عضلانی استاتین کافی است',
    management:
      'ادامه رژیم مطابق نسخه؛ آتورواستاتین می‌تواند هر ساعت شبانه‌روز (ترجیحاً عصر/شب) و آسپرین با غذا مصرف شود.',
  },
  {
    id: 'rule-doac-nsaid-antiplatelet',
    groupA: ['rivaroxaban', 'ریواروکسابان', 'apixaban', 'آپیکسابان'],
    groupB: [
      'ibuprofen',
      'ایبوپروفن',
      'naproxen',
      'ناپروکسن',
      'diclofenac',
      'دیکلوفناک',
      'ketorolac',
      'کتوورولاک',
      'meloxicam',
      'ملوکسیکام',
      'mefenamic',
      'مفنامیک',
      'aspirin',
      'آسپرین',
      'clopidogrel',
      'کلوپیدوگرل',
      'ticagrelor',
      'تیکاگرلور',
    ],
    severity: 'major',
    mechanism: 'اثر هم‌افزایی ضدانعقادی مهارکننده‌های فاکتور Xa با مهار پلاکتی و آسیب مخاط گوارشی',
    clinicalEffect: 'افزایش شدید خطر خونریزی گوارشی و خونریزی شدید سیستمیک',
    management:
      'از مصرف هم‌زمان NSAIDها (مانند ایبوپروفن و کتوورولاک) با ریواروکسابان یا آپیکسابان اکیداً پرهیز و استامینوفن جایگزین شود. ترکیب با آسپرین یا ضدپلاکت فقط با اندیکاسیون دقیق متخصص قلب و محافظ معده (پنتوپرازول).',
  },
  {
    id: 'rule-levothyroxine-iron-calcium-antacid',
    groupA: ['levothyroxine', 'لووتیروکسین'],
    groupB: [
      'ferrous',
      'فروس',
      'iron',
      'آهن',
      'calcium',
      'کلسیم',
      'aluminum',
      'آلومینیوم',
      'maalox',
    ],
    severity: 'moderate',
    mechanism: 'تشکیل کمپلکس نامحلول در دستگاه گوارش و کاهش چشمگیر جذب روده‌ای لووتیروکسین',
    clinicalEffect: 'کاهش اثربخشی درمان کم‌کاری تیروئید و بالا رفتن TSH بیمار',
    management:
      'حداقل ۴ ساعت فاصله بین مصرف لووتیروکسین (صبح ناشتا) و قرص آهن، کلسیم یا شربت معده رعایت شود.',
  },
  {
    id: 'rule-quinolone-doxy-minerals',
    groupA: ['ciprofloxacin', 'سیپروفلوکساسین', 'levofloxacin', 'لووفلوکساسین', 'doxycycline', 'داکسی‌سایکلین'],
    groupB: ['ferrous', 'فروس', 'آهن', 'calcium', 'کلسیم', 'aluminum', 'آلومینیوم'],
    severity: 'major',
    mechanism: 'شلاته‌شدن آنتی‌بیوتیک با یون‌های دوظرفیتی و سه‌ظرفیتی (آهن، کلسیم، آلومینیوم، منیزیم)',
    clinicalEffect: 'افت ۵۰ تا ۹۰ درصدی جذب آنتی‌بیوتیک و شکست کامل درمان عفونت',
    management:
      'آنتی‌بیوتیک حداقل ۲ ساعت قبل یا ۴ تا ۶ ساعت بعد از مکمل آهن، کلسیم، لبنیات یا شربت معده مصرف شود.',
  },
  {
    id: 'rule-digoxin-amiodarone-macrolide',
    groupA: ['digoxin', 'دیگوکسین'],
    groupB: ['amiodarone', 'آمیودارون', 'clarithromycin', 'کلاریترومایسین', 'erythromycin', 'اریترومایسین', 'spironolactone', 'اسپیرونولاکتون'],
    severity: 'major',
    mechanism: 'مهار P-glycoprotein و کاهش پاکسازی کلیوی/غیرکلیوی دیگوکسین',
    clinicalEffect: 'افزایش شدید سطح سرمی دیگوکسین و خطر مسمومیت قلبی (برادی‌کاردی، آریتمی، اختلال دید، تهوع)',
    management:
      'در مصرف هم‌زمان با آمیودارون دوز دیگوکسین معمولاً باید ۵۰٪ کاهش یابد و سطح سرمی، پتاسیم و نبض دقیقاً پایش شوند. به جای کلاریترومایسین آنتی‌بیوتیک جایگزین بررسی شود.',
  },
  {
    id: 'rule-colchicine-cyp3a4-statin',
    groupA: ['colchicine', 'کلشی‌سین'],
    groupB: ['clarithromycin', 'کلاریترومایسین', 'erythromycin', 'اریترومایسین', 'fluconazole', 'فلوکونازول', 'atorvastatin', 'آتورواستاتین', 'gemfibrozil', 'جم‌فیبروزیل'],
    severity: 'major',
    mechanism: 'مهار قوی CYP3A4 و P-gp (تجمع کشنده کلشی‌سین) یا هم‌افزایی میوتوکسیسیتی با استاتین‌ها/فیبرات‌ها',
    clinicalEffect: 'خطر مسمومیت شدید کلشی‌سین (سرکوب مغز استخوان، اسهال شدید) و رابدومیولیز عضلانی',
    management:
      'ترکیب کلشی‌سین با کلاریترومایسین به‌ویژه در بیماران کلیوی یا کبدی ممنوع است. با استاتین‌ها، پایش دقیق درد عضلانی و بررسی کاهش دوز لازم است.',
  },
  {
    id: 'rule-benzo-opioid-gabapentinoid',
    groupA: ['alprazolam', 'آلپرازولام', 'clonazepam', 'کلونازپام', 'zolpidem', 'زولپیدم'],
    groupB: ['tramadol', 'ترامادول', 'gabapentin', 'گاباپنتین', 'pregabalin', 'پرگابالین', 'baclofen', 'باکلوفن'],
    severity: 'major',
    mechanism: 'اثر هم‌افزایی تضعیف سیستم عصبی مرکزی (CNS) و مرکز تنفس در ساقه مغز',
    clinicalEffect: 'خطر خواب‌آلودگی شدید، کاهش سطح هوشیاری، سقوط در سالمندان و ایست تنفسی تهدیدکننده حیات',
    management:
      'از تجویز هم‌زمان بنزودیازپین‌ها/زولپیدم با ترامادول یا گاباپنتینوئیدها تا حد امکان خودداری شود؛ در صورت ضرورت بالینی، کمترین دوز، کوتاه‌ترین مدت و هشدار اکید عدم رانندگی.',
  },
  {
    id: 'rule-tizanidine-ciprofloxacin',
    groupA: ['tizanidine', 'تیزانیدین'],
    groupB: ['ciprofloxacin', 'سیپروفلوکساسین'],
    severity: 'major',
    mechanism: 'مهار بسیار قوی CYP1A2 توسط سیپروفلوکساسین و افزایش ۱۰ تا ۳۳ برابری غلظت پلاسمایی تیزانیدین',
    clinicalEffect: 'افت فشار خون شدید، برادی‌کاردی و خواب‌آلودگی عمیق و خطرناک',
    management:
      'منع مصرف مطلق (Contraindicated). یکی از دو دارو باید با نظر پزشک جایگزین شود (مثلاً متوکاربامول یا آنتی‌بیوتیک غیر از سیپروفلوکساسین).',
  },
  {
    id: 'rule-isotretinoin-doxycycline',
    groupA: ['isotretinoin', 'ایزوترتینوئین'],
    groupB: ['doxycycline', 'داکسی‌سایکلین'],
    severity: 'major',
    mechanism: 'اثر هم‌افزایی افزایش فشار مایع مغزی-نخاعی',
    clinicalEffect: 'خطر افزایش خوش‌خیم فشار داخل جمجمه (Pseudotumor Cerebri) همراه با سردرد شدید، تهوع و خطر آسیب بینایی',
    management:
      'منع مصرف مطلق هم‌زمان. پیش از شروع ایزوترتینوئین، مصرف داکسی‌سایکلین باید متوقف شده باشد.',
  },
  {
    id: 'rule-fluconazole-warfarin-statin-qt',
    groupA: ['fluconazole', 'فلوکونازول'],
    groupB: ['warfarin', 'وارفارین', 'atorvastatin', 'آتورواستاتین', 'citalopram', 'سیتالوپرام', 'domperidone', 'دومپریدون'],
    severity: 'major',
    mechanism: 'مهار قوی CYP2C9/CYP3A4 و اثر هم‌افزایی طولانی‌کردن فاصله QT قلبی',
    clinicalEffect: 'افزایش شدید INR (با وارفارین)، خطر میوپاتی (با استاتین) یا آریتمی قلبی Torsades de Pointes (با سیتالوپرام/دومپریدون)',
    management:
      'در صورت عفونت قارچی موضعی، کلوتریمازول موضعی جایگزین ایمن‌تر است؛ در مصرف هم‌زمان با وارفارین، پایش سریع INR و کاهش دوز الزامی است.',
  },
  {
    id: 'rule-carbamazepine-anticoagulants',
    groupA: ['carbamazepine', 'کاربامازپین'],
    groupB: ['warfarin', 'وارفارین', 'rivaroxaban', 'ریواروکسابان', 'apixaban', 'آپیکسابان', 'levonorgestrel', 'لوونورژسترل'],
    severity: 'major',
    mechanism: 'القای بسیار قوی آنزیم‌های CYP3A4/CYP2C9 و P-gp توسط کاربامازپین',
    clinicalEffect: 'افت شدید سطح سرمی ضدانعقادها یا قرص‌های هورمونی و خطر بالای شکست درمان (سکته، لخته یا بارداری ناخواسته)',
    management:
      'از ترکیب کاربامازپین با ریواروکسابان و آپیکسابان پرهیز شود؛ در مصرف با وارفارین پایش بسیار دقیق INR و در ضدتشنج‌ها بررسی لوتیراستام با متخصص مغز و اعصاب.',
  },
  {
    id: 'rule-gemfibrozil-statin',
    groupA: ['gemfibrozil', 'جم‌فیبروزیل'],
    groupB: ['atorvastatin', 'آتورواستاتین', 'rosuvastatin', 'روزوواستاتین'],
    severity: 'major',
    mechanism: 'مهار گلوکورونیداسیون و OATP1B1 توسط جم‌فیبروزیل و تجمع شدید استاتین در خون و عضلات',
    clinicalEffect: 'افزایش چشمگیر خطر میوپاتی شدید و رابدومیولیز همراه با آسیب کلیوی',
    management:
      'از ترکیب جم‌فیبروزیل با استاتین‌ها خودداری و در صورت نیاز هم‌زمان به فیبرات، فنوفیبرات جایگزین ایمن‌تری با نظر پزشک است.',
  },
  {
    id: 'rule-pde5-tamsulosin',
    groupA: ['sildenafil', 'سیلدنافیل', 'tadalafil', 'تادالافیل'],
    groupB: ['tamsulosin', 'تامسولوسین'],
    severity: 'moderate',
    mechanism: 'اثر هم‌افزایی گشادکنندگی عروق محیطی',
    clinicalEffect: 'افزایش خطر افت فشار خون وضعیتی، سرگیجه و سنکوپ هنگام ایستادن',
    management:
      'بیمار باید پیش از شروع روی دوز تامسولوسین پایدار باشد، سیلدنافیل/تادالافیل با کمترین دوز شروع شده و فاصله زمانی چند ساعته رعایت شود.',
  },
];

export function formatPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function normalizeDrugName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u200c\u064b-\u065f]/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMedicationKey(med: Pick<MedicationItem, 'genericName' | 'persianName' | 'strength'>): string {
  const base = normalizeDrugName(med.genericName || med.persianName);
  const strength = normalizeDrugName(med.strength || '');
  return `${base}::${strength}`;
}

export function mergeScannedMedications(
  existing: MedicationItem[],
  incoming: MedicationItem[]
): MedicationItem[] {
  const map = new Map<string, MedicationItem>();

  for (const med of existing) {
    map.set(getMedicationKey(med), med);
  }

  for (const med of incoming) {
    const key = getMedicationKey(med);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, med);
    } else {
      map.set(key, {
        ...prev,
        ...med,
        id: prev.id,
        customDosingSchedule: med.customDosingSchedule ?? prev.customDosingSchedule,
        dosing: {
          ...prev.dosing,
          ...med.dosing,
          prescribedRegimen: med.dosing.prescribedRegimen || prev.dosing.prescribedRegimen,
        },
      });
    }
  }

  return Array.from(map.values());
}

function medicationMatchesKeywords(med: MedicationItem, keywords: string[]): boolean {
  const haystack = normalizeDrugName(`${med.genericName} ${med.persianName} ${med.brandName ?? ''}`);
  return keywords.some((kw) => haystack.includes(normalizeDrugName(kw)));
}

export function evaluateLocalInteractions(medications: MedicationItem[]): DrugInteraction[] {
  const found: DrugInteraction[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];

      for (const rule of LOCAL_INTERACTION_RULES) {
        const directMatch =
          medicationMatchesKeywords(med1, rule.groupA) && medicationMatchesKeywords(med2, rule.groupB);
        const reverseMatch =
          medicationMatchesKeywords(med1, rule.groupB) && medicationMatchesKeywords(med2, rule.groupA);

        if (directMatch || reverseMatch) {
          const pairKey = [normalizeDrugName(med1.genericName), normalizeDrugName(med2.genericName)]
            .sort()
            .join('::');

          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            found.push({
              id: `${rule.id}-${pairKey}`,
              drugA: `${med1.persianName} (${med1.genericName})`,
              drugB: `${med2.persianName} (${med2.genericName})`,
              severity: rule.severity,
              mechanism: rule.mechanism,
              clinicalEffect: rule.clinicalEffect,
              management: rule.management,
              source: 'clinical-rule',
            });
          }
        }
      }
    }
  }

  return sortInteractionsBySeverity(found);
}

export function sortInteractionsBySeverity(interactions: DrugInteraction[]): DrugInteraction[] {
  return [...interactions].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

function interactionPairSignature(item: Pick<DrugInteraction, 'drugA' | 'drugB'>): string {
  const a = normalizeDrugName(item.drugA.split('(')[0] || item.drugA);
  const b = normalizeDrugName(item.drugB.split('(')[0] || item.drugB);
  return [a, b].sort().join('<>');
}

export function mergeInteractions(
  aiInteractions: DrugInteraction[],
  localInteractions: DrugInteraction[]
): DrugInteraction[] {
  const byPair = new Map<string, DrugInteraction>();

  for (const item of [...localInteractions, ...aiInteractions]) {
    const sig = interactionPairSignature(item);
    const prev = byPair.get(sig);
    if (!prev || SEVERITY_RANK[item.severity] > SEVERITY_RANK[prev.severity]) {
      byPair.set(sig, item);
    }
  }

  return sortInteractionsBySeverity(Array.from(byPair.values()));
}

export function filterInteractionsBySeverity(
  interactions: DrugInteraction[],
  filter: SeverityFilter
): DrugInteraction[] {
  if (filter === 'all') {
    return sortInteractionsBySeverity(interactions);
  }
  return sortInteractionsBySeverity(interactions.filter((item) => item.severity === filter));
}

export function getInteractionsForMedication(
  medication: MedicationItem,
  interactions: DrugInteraction[]
): DrugInteraction[] {
  const genericNorm = normalizeDrugName(medication.genericName);
  const persianNorm = normalizeDrugName(medication.persianName);

  return sortInteractionsBySeverity(
    interactions.filter((item) => {
      const a = normalizeDrugName(item.drugA);
      const b = normalizeDrugName(item.drugB);
      return (
        (genericNorm.length > 2 && (a.includes(genericNorm) || b.includes(genericNorm))) ||
        (persianNorm.length > 2 && (a.includes(persianNorm) || b.includes(persianNorm)))
      );
    })
  );
}

export function summarizePrescriptionRisk(
  medications: MedicationItem[],
  interactions: DrugInteraction[]
): PrescriptionRiskSummary {
  if (medications.length === 0) {
    return {
      totalMedications: 0,
      majorCount: 0,
      moderateCount: 0,
      minorCount: 0,
      highAlertCount: 0,
      overallLevel: 'empty',
    };
  }

  let majorCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  for (const interaction of interactions) {
    if (interaction.severity === 'major') majorCount++;
    else if (interaction.severity === 'moderate') moderateCount++;
    else minorCount++;
  }

  const highAlertCount = medications.filter((m) => m.safety.highAlert).length;

  let overallLevel: PrescriptionRiskSummary['overallLevel'] = 'safe';
  if (majorCount > 0) {
    overallLevel = 'critical';
  } else if (moderateCount > 0 || highAlertCount > 0) {
    overallLevel = 'caution';
  }

  return {
    totalMedications: medications.length,
    majorCount,
    moderateCount,
    minorCount,
    highAlertCount,
    overallLevel,
  };
}

export function validateManualDrugInput(query: string): { valid: boolean; error?: string } {
  const trimmed = query.trim();
  if (!trimmed) {
    return { valid: false, error: 'لطفاً نام دارو یا دوز مورد نظر را وارد کنید.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'حداقل ۲ کاراکتر برای جستجو یا ثبت دارو وارد کنید.' };
  }
  if (trimmed.length > 120) {
    return { valid: false, error: 'نام دارو نمی‌تواند بیش از ۱۲۰ کاراکتر باشد.' };
  }
  return { valid: true };
}

export function validateCustomDosingSchedule(schedule: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = schedule.replace(/\s+/g, ' ').trim();
  if (normalized.length > 120) {
    return {
      valid: false,
      normalized,
      error: 'برنامه مصرف روزانه نمی‌تواند بیش از ۱۲۰ کاراکتر باشد.',
    };
  }
  return { valid: true, normalized };
}

export function updateMedicationDosingSchedule(
  medications: MedicationItem[],
  medicationId: string,
  schedule: string
): MedicationItem[] {
  const { normalized } = validateCustomDosingSchedule(schedule);
  return medications.map((med) => {
    if (med.id !== medicationId) return med;
    return {
      ...med,
      customDosingSchedule: normalized || undefined,
    };
  });
}

export function buildCounselingText(
  medications: MedicationItem[],
  interactions: DrugInteraction[]
): string {
  if (medications.length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push('برگه راهنمای مصرف و مشاوره داروساز (دارویار)');
  lines.push('══════════════════════════════════════');
  lines.push('');

  medications.forEach((med, idx) => {
    lines.push(`${formatPersianDigits(idx + 1)}. ${med.persianName} (${med.genericName}) — ${med.strength} | ${med.dosageForm}`);
    if (med.customDosingSchedule) {
      lines.push(`   • برنامه مصرف روزانه (تعیین‌شده توسط داروساز): ${med.customDosingSchedule}`);
    }
    if (med.dosing.prescribedRegimen) {
      lines.push(`   • دستور نسخه: ${med.dosing.prescribedRegimen}`);
    }
    lines.push(`   • نحوه مصرف و زمان‌بندی: ${med.usage.withFood} — ${med.usage.timing}`);
    if (med.usage.patientCounseling.length > 0) {
      lines.push(`   • نکته مهم مشاوره: ${med.usage.patientCounseling[0]}`);
    }
    if (med.safety.criticalWarnings.length > 0) {
      lines.push(`   • هشدار ایمنی: ${med.safety.criticalWarnings[0]}`);
    }
    lines.push('');
  });

  const importantInteractions = interactions.filter((i) => i.severity !== 'minor');
  if (importantInteractions.length > 0) {
    lines.push('هشدارهای تداخل دارویی نسخه:');
    importantInteractions.forEach((item) => {
      const label = item.severity === 'major' ? 'تداخل شدید' : 'تداخل متوسط';
      lines.push(`- [${label}] ${item.drugA} + ${item.drugB}: ${item.management}`);
    });
  } else {
    lines.push('وضعیت تداخل‌ها: تداخل بالینی شدید یا متوسط بین اقلام این نسخه شناسایی نشد.');
  }

  return lines.join('\n');
}

export function parseScanHistory(raw: string | null): ScanSession[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ScanSession =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.medications) &&
        Array.isArray(item.interactions)
    );
  } catch {
    return [];
  }
}

export function serializeScanHistory(sessions: ScanSession[], maxItems = 15): string {
  return JSON.stringify(sessions.slice(0, maxItems));
}
