import type { MedicationItem } from '../../types/pharmacy';

export type FormularyCategory =
  | 'all'
  | 'cardio'
  | 'antibiotic'
  | 'endocrine'
  | 'gi'
  | 'pain'
  | 'neuro_psych'
  | 'respiratory_allergy'
  | 'urology_derm_eye';

export interface FormularyDrugRecord extends MedicationItem {
  category: Exclude<FormularyCategory, 'all'>;
  keywords?: string[];
  cachedFromAi?: boolean;
}

export const FORMULARY_CATEGORIES: { id: FormularyCategory; label: string }[] = [
  { id: 'all', label: 'همه داروها' },
  { id: 'cardio', label: 'قلبی و ضدانعقاد' },
  { id: 'antibiotic', label: 'آنتی‌بیوتیک و ضدعفونت' },
  { id: 'endocrine', label: 'دیابت، غدد و کورتون' },
  { id: 'gi', label: 'گوارش' },
  { id: 'pain', label: 'مسکن، مفاصل و عضلانی' },
  { id: 'neuro_psych', label: 'اعصاب و روان' },
  { id: 'respiratory_allergy', label: 'تنفس و آلرژی' },
  { id: 'urology_derm_eye', label: 'اورولوژی، پوست و مکمل' },
];
