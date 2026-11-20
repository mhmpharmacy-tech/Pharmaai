import type { FormularyCategory, FormularyDrugRecord } from '../data/localDrugFormulary';
import type { MedicationItem } from '../types/pharmacy';

const PERSIAN_TO_LATIN_DIGITS: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_TO_LATIN_DIGITS[ch] ?? ch)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u064b-\u065f]/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferCategoryFromClass(therapeuticClass: string): Exclude<FormularyCategory, 'all'> {
  const norm = normalizeSearchText(therapeuticClass);
  if (
    norm.includes('آنتی بیوتیک') ||
    norm.includes('ضدعفونت') ||
    norm.includes('ضدویروس') ||
    norm.includes('ضدقارچ') ||
    norm.includes('ضدانگل') ||
    norm.includes('ماکرولید') ||
    norm.includes('پنی سیلین') ||
    norm.includes('سفالوسپورین') ||
    norm.includes('کینولون') ||
    norm.includes('تتراسایکلین')
  ) {
    return 'antibiotic';
  }
  if (
    norm.includes('فشار') ||
    norm.includes('چربی') ||
    norm.includes('استاتین') ||
    norm.includes('فیبرات') ||
    norm.includes('ضدپلاکت') ||
    norm.includes('ضدانعقاد') ||
    norm.includes('قلب') ||
    norm.includes('آریتمی') ||
    norm.includes('بتابلوکر') ||
    norm.includes('دیورتیک') ||
    norm.includes('نیترات')
  ) {
    return 'cardio';
  }
  if (
    norm.includes('دیابت') ||
    norm.includes('انسولین') ||
    norm.includes('تیروئید') ||
    norm.includes('کورتیکواستروئید') ||
    norm.includes('کورتون') ||
    norm.includes('هورمون') ||
    norm.includes('قند') ||
    norm.includes('پوکی استخوان') ||
    norm.includes('پرولاکتین') ||
    norm.includes('پروژستین')
  ) {
    return 'endocrine';
  }
  if (
    norm.includes('پمپ پروتون') ||
    norm.includes('معده') ||
    norm.includes('هیستامین h2') ||
    norm.includes('گوارش') ||
    norm.includes('ضدتهوع') ||
    norm.includes('ضداسهال') ||
    norm.includes('ملین') ||
    norm.includes('ضداسپاسم') ||
    norm.includes('آنتی اسید') ||
    norm.includes('پروکینتیک')
  ) {
    return 'gi';
  }
  if (
    norm.includes('ضدالتهاب') ||
    norm.includes('ضددرد') ||
    norm.includes('تب بر') ||
    norm.includes('nsaid') ||
    norm.includes('شل کننده') ||
    norm.includes('نقرس') ||
    norm.includes('میگرن') ||
    norm.includes('اسید اوریک')
  ) {
    return 'pain';
  }
  if (
    norm.includes('آسم') ||
    norm.includes('برونش') ||
    norm.includes('آنتی هیستامین') ||
    norm.includes('آلرژی') ||
    norm.includes('سرفه') ||
    norm.includes('بینی') ||
    norm.includes('موکولیتیک') ||
    norm.includes('تنفس') ||
    norm.includes('لکوترین')
  ) {
    return 'respiratory_allergy';
  }
  if (
    norm.includes('پروستات') ||
    norm.includes('نعوظ') ||
    norm.includes('موضعی') ||
    norm.includes('پوست') ||
    norm.includes('چشم') ||
    norm.includes('ویتامین') ||
    norm.includes('مکمل') ||
    norm.includes('آهن') ||
    norm.includes('رتینوئید')
  ) {
    return 'urology_derm_eye';
  }
  return 'neuro_psych';
}

export function toFormularyRecord(med: MedicationItem, cachedFromAi = false): FormularyDrugRecord {
  return {
    ...med,
    category: inferCategoryFromClass(med.therapeuticClass),
    cachedFromAi,
  };
}

function scoreDrugMatch(drug: FormularyDrugRecord, normalizedQuery: string, tokens: string[]): number {
  const persian = normalizeSearchText(drug.persianName);
  const generic = normalizeSearchText(drug.genericName);
  const brand = normalizeSearchText(drug.brandName ?? '');
  const strength = normalizeSearchText(drug.strength);
  const cls = normalizeSearchText(drug.therapeuticClass);
  const keywords = (drug.keywords ?? []).map(normalizeSearchText).join(' ');

  const fullHaystack = `${persian} ${generic} ${brand} ${strength} ${cls} ${keywords}`;

  if (!tokens.every((t) => fullHaystack.includes(t))) {
    return 0;
  }

  let score = 10;

  if (persian === normalizedQuery || generic === normalizedQuery) {
    score += 100;
  } else if (persian.startsWith(normalizedQuery) || generic.startsWith(normalizedQuery)) {
    score += 70;
  } else if (brand.startsWith(normalizedQuery)) {
    score += 55;
  } else if (persian.includes(normalizedQuery) || generic.includes(normalizedQuery)) {
    score += 40;
  } else if (keywords.includes(normalizedQuery)) {
    score += 25;
  }

  for (const token of tokens) {
    if (token.length < 2) continue;
    if (persian === token || generic === token) {
      score += 55;
    } else if (persian.startsWith(token) || generic.startsWith(token)) {
      score += 35;
    } else if (brand.includes(token)) {
      score += 20;
    }
  }

  if (tokens.some((t) => strength.includes(t))) {
    score += 15;
  }

  return score;
}

export function countFormularyByCategory(
  catalog: FormularyDrugRecord[]
): Record<FormularyCategory, number> {
  const counts: Record<FormularyCategory, number> = {
    all: catalog.length,
    cardio: 0,
    antibiotic: 0,
    endocrine: 0,
    gi: 0,
    pain: 0,
    neuro_psych: 0,
    respiratory_allergy: 0,
    urology_derm_eye: 0,
  };

  for (const item of catalog) {
    if (item.category in counts) {
      counts[item.category]++;
    }
  }

  return counts;
}

export function searchLocalFormulary(
  catalog: FormularyDrugRecord[],
  query: string,
  category: FormularyCategory = 'all',
  limit?: number,
  highAlertOnly = false
): FormularyDrugRecord[] {
  const categoryFiltered = catalog.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (highAlertOnly && !item.safety.highAlert) return false;
    return true;
  });

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return limit ? categoryFiltered.slice(0, limit) : categoryFiltered;
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const scored: { item: FormularyDrugRecord; score: number }[] = [];

  for (const item of categoryFiltered) {
    const score = scoreDrugMatch(item, normalizedQuery, tokens);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.persianName.localeCompare(b.item.persianName, 'fa'));
  const results = scored.map((s) => s.item);
  return limit ? results.slice(0, limit) : results;
}

export function findBestLocalDrugMatch(
  catalog: FormularyDrugRecord[],
  query: string
): FormularyDrugRecord | null {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return null;

  const matches = searchLocalFormulary(catalog, query, 'all', 3);
  if (matches.length === 0) return null;

  const top = matches[0];
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const topScore = scoreDrugMatch(top, normalizedQuery, tokens);

  // Require solid confidence (direct name/prefix/keyword match)
  return topScore >= 35 ? top : null;
}
