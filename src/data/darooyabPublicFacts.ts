/** Publicly observed *factual identity fields only* from individually inspected Darooyab pages.
 * Not a copy of Darooyab's narrative content, design, product images or database.
 * Source site asserts content copyright. For links, redirect to original page.
 * Every row remains independently unverified against IFDA/TTAC.
 */
export interface DarooyabProductFact {
  id:string; brand:string; ingredient:string|null; strength:string|null;
  dosageForm:string|null; packageSize:string|null; manufacturer:string|null; importer:string|null;
  sourceUrl:string; observedAt:'2026-11-21'; sourceStatus:'public-page-fact-unverified';
  /** Missing data stays null, NEVER copied from adjacent formulation. */
  irc:null; gtin:null; currentRegistration:null; officialPriceRial:null; authorizedImagePath:null;
  integrityWarning?:string;
}
export interface DarooyabGenericLink {
  genericName:string; persianName:string; sourceUrl:string;
}
export const DAROOYAB_GENERIC_REFERENCE_LINKS: readonly DarooyabGenericLink[] = [
  {
    "genericName": "Acetaminophen",
    "persianName": "استامینوفن",
    "sourceUrl": "https://www.darooyab.ir/G-153/Acetaminophen"
  },
  {
    "genericName": "Ibuprofen",
    "persianName": "ایبوپروفن",
    "sourceUrl": "https://www.darooyab.ir/G-101/Ibuprofen"
  },
  {
    "genericName": "Aspirin",
    "persianName": "آسپرین",
    "sourceUrl": "https://www.darooyab.ir/G-18/Aspirin"
  },
  {
    "genericName": "Amoxicillin",
    "persianName": "آموکسی سیلین",
    "sourceUrl": "https://www.darooyab.ir/G-275/Amoxicillin"
  },
  {
    "genericName": "Azithromycin",
    "persianName": "آزیترومایسین",
    "sourceUrl": "https://www.darooyab.ir/G-286/Azithromycin"
  },
  {
    "genericName": "Cefixime",
    "persianName": "سفیکسیم",
    "sourceUrl": "https://www.darooyab.ir/G-325/Cefixime"
  },
  {
    "genericName": "Metformin",
    "persianName": "متفورمین",
    "sourceUrl": "https://www.darooyab.ir/G-640/Metformin"
  },
  {
    "genericName": "Glibenclamide",
    "persianName": "گلی بنکلامید",
    "sourceUrl": "https://www.darooyab.ir/G-625/Glibenclamide"
  },
  {
    "genericName": "Gabapentin",
    "persianName": "گاباپنتین",
    "sourceUrl": "https://www.darooyab.ir/G-667/Gabapentin"
  },
  {
    "genericName": "Cetirizine",
    "persianName": "سیتریزین",
    "sourceUrl": "https://www.darooyab.ir/G-776/Cetirizine"
  },
  {
    "genericName": "Fexofenadine",
    "persianName": "فکسوفنادین",
    "sourceUrl": "https://www.darooyab.ir/G-799/Fexofenadine"
  },
  {
    "genericName": "Metronidazole",
    "persianName": "مترونیدازول",
    "sourceUrl": "https://www.darooyab.ir/G-1131/Metronidazole"
  },
  {
    "genericName": "Chlordiazepoxide",
    "persianName": "کلردیازپوکساید",
    "sourceUrl": "https://www.darooyab.ir/G-1246/Chlordiazepoxide"
  },
  {
    "genericName": "Montelukast",
    "persianName": "مونته لوکاست",
    "sourceUrl": "https://www.darooyab.ir/G-1474/Montelukast"
  },
  {
    "genericName": "Atorvastatin",
    "persianName": "آتورواستاتین",
    "sourceUrl": "https://www.darooyab.ir/G-1537/Atorvastatin"
  },
  {
    "genericName": "Losartan",
    "persianName": "لوزارتان",
    "sourceUrl": "https://www.darooyab.ir/G-1743/Losartan"
  },
  {
    "genericName": "Metoprolol",
    "persianName": "متوپرولول",
    "sourceUrl": "https://www.darooyab.ir/G-1767/Metoprolol"
  },
  {
    "genericName": "Rosuvastatin",
    "persianName": "رزوواستاتین",
    "sourceUrl": "https://www.darooyab.ir/G-1876/Rosuvastatin"
  },
  {
    "genericName": "Prednisolone",
    "persianName": "پردنیزولون",
    "sourceUrl": "https://www.darooyab.ir/G-2123/Prednisolone"
  },
  {
    "genericName": "Acetylcysteine",
    "persianName": "استیل سیستئین",
    "sourceUrl": "https://www.darooyab.ir/G-2132/Acetylcysteine"
  },
  {
    "genericName": "Loperamide",
    "persianName": "لوپرامید",
    "sourceUrl": "https://www.darooyab.ir/G-2603/Loperamide"
  },
  {
    "genericName": "Omeprazole",
    "persianName": "امپرازول",
    "sourceUrl": "https://www.darooyab.ir/G-2621/Omeprazole"
  },
  {
    "genericName": "Famotidine",
    "persianName": "فاموتیدین",
    "sourceUrl": "https://www.darooyab.ir/G-2584/Famotidine"
  },
  {
    "genericName": "Levothyroxine Sodium",
    "persianName": "لووتیروکسین سدیم",
    "sourceUrl": "https://www.darooyab.ir/G-3412/Levothyroxine-Sodium"
  },
  {
    "genericName": "Pirfenidone",
    "persianName": "پیرفنیدون",
    "sourceUrl": "https://www.darooyab.ir/G-4122/Pirfenidone"
  }
];
export const DAROOYAB_PUBLIC_PRODUCT_FACTS: readonly DarooyabProductFact[] = [
  {
    "id": "iripro-150",
    "brand": "Iripro",
    "ingredient": "Irbesartan",
    "strength": "150 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "داروسازی تدبیر کالای جم",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-4713119212721103/IRIPRO-150-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "iripro-300",
    "brand": "Iripro",
    "ingredient": "Irbesartan",
    "strength": "300 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "داروسازی تدبیر کالای جم",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-1750511525900409/IRIPRO-300-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "kepatemp-125",
    "brand": "Kepatemp",
    "ingredient": "Acetaminophen",
    "strength": "125 mg/5 mL",
    "dosageForm": "oral-suspension",
    "packageSize": "120 mL",
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-5608935560203356/KEPATEMP-125-mg-5-ml-120-ml-Suspension",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "kepatemp-drops-100",
    "brand": "Kepatemp",
    "ingredient": "Acetaminophen",
    "strength": "100 mg/mL",
    "dosageForm": "oral-drops",
    "packageSize": "15 mL",
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-8991937812280368/KEPATEMP-100-mg-ml-15-ml-Suspension-Drop",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "acetaminophen-kim-500",
    "brand": "Acetaminophen Kimyagaran Emrooz",
    "ingredient": "Acetaminophen",
    "strength": "500 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-3553153126903323/ACETAMINOPHEN-KIMYAGARAN-EMROOZ-500-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "acetaminophen-kim-325",
    "brand": "Acetaminophen Kimyagaran Emrooz",
    "ingredient": "Acetaminophen",
    "strength": "325 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-6507321750867390/ACETAMINOPHEN-KIMYAGARAN-EMROOZ-325-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "prisin-care",
    "brand": "PrisinCare",
    "ingredient": "Primidone",
    "strength": "125 mg/5 mL",
    "dosageForm": "oral-suspension",
    "packageSize": "250 mL",
    "manufacturer": "سینا پیشگام دارو نوین",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-5166449871544511/PRISINCARE-125-mg-5-ml-250-ml-Suspension",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "ipranext",
    "brand": "Ipranext",
    "ingredient": "Ipratropium bromide + Salbutamol",
    "strength": "20 mcg/100 mcg/puff",
    "dosageForm": "inhaler",
    "packageSize": "200 doses",
    "manufacturer": "Neutec Ilac",
    "importer": "داروسازی رویان دارو",
    "sourceUrl": "https://www.darooyab.ir/B-3916995392661343/IPRANEXT-20-mcg-100mcg-puff-200-dose-Inhaler-Spray",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "globucel",
    "brand": "Globucel",
    "ingredient": "Human immunoglobulin (IVIG)",
    "strength": "5000 mg/100 mL",
    "dosageForm": "intravenous-injection",
    "packageSize": "100 mL",
    "manufacturer": "INTAS",
    "importer": "کاوش گستر دارو",
    "sourceUrl": "https://www.darooyab.ir/B-5316736675486419/GLOBUCEL-5000-mg-100-ml-Intravenous-Injection",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "papidele",
    "brand": "Papidele",
    "ingredient": "Imiquimod",
    "strength": "5%",
    "dosageForm": "topical-cream",
    "packageSize": null,
    "manufacturer": "نکسوس",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-2268017587398084/PAPIDELE-5-Topical-Cream",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "buto-asma",
    "brand": "Buto-Asma",
    "ingredient": "Salbutamol",
    "strength": "100 mcg/puff",
    "dosageForm": "inhaler",
    "packageSize": "200 doses",
    "manufacturer": "Aldo Union",
    "importer": "کاوش گستر دارو",
    "sourceUrl": "https://www.darooyab.ir/B-5999623380910645/BUTO-ASMA-100-mcg-puff-200-dose-SPRAY",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "mefenamic-500",
    "brand": "Mefenamic Acid Kimyagaran Emrooz",
    "ingredient": "Mefenamic acid",
    "strength": "500 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-6214120310654290/MEFENAMIC-ACID-KIMYAGARAN-EMROOZ-500-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "tirzacto-2-5",
    "brand": "Tirzacto",
    "ingredient": "Tirzepatide",
    "strength": "2.5 mg/0.5 mL",
    "dosageForm": "prefilled-syringe",
    "packageSize": null,
    "manufacturer": "داروسازی اکتوورکو",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-1236765494787288/TIRZACTO-2-5-mg-0-5-ml-Prefilled-Syringe",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "tirzacto-5",
    "brand": "Tirzacto",
    "ingredient": "Tirzepatide",
    "strength": "5 mg/0.5 mL",
    "dosageForm": "prefilled-syringe",
    "packageSize": null,
    "manufacturer": "داروسازی اکتوورکو",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-2051493454335839/TIRZACTO-5-mg-0-5-ml-Prefilled-Syringe",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "tirzacto-15",
    "brand": "Tirzacto",
    "ingredient": "Tirzepatide",
    "strength": "15 mg/0.5 mL",
    "dosageForm": "prefilled-syringe",
    "packageSize": null,
    "manufacturer": "داروسازی اکتوورکو",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-4489674568028079/TIRZACTO-15-mg-0-5-ml-Prefilled-Syringe",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "keptalax-10",
    "brand": "Keptalax 4000",
    "ingredient": "Polyethylene glycol 4000",
    "strength": null,
    "dosageForm": "sachet",
    "packageSize": "10 g",
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-768825377521213/Keptalax-4000-Sachet-10-gr",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "keptalax-70",
    "brand": "Keptalax 4000",
    "ingredient": "Polyethylene glycol 4000",
    "strength": null,
    "dosageForm": "sachet",
    "packageSize": "70 g",
    "manufacturer": "کیمیاگران امروز",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-548305683908123/Keptalax-4000-Sachet-70-gr",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "evening-primrose-takin",
    "brand": "Evening Primrose Oil + Vitamin E",
    "ingredient": "Evening primrose oil + Vitamin E",
    "strength": "1000 mg + 15 IU",
    "dosageForm": "softgel",
    "packageSize": null,
    "manufacturer": "تکین پارس فارمد",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-548085222044511/Evening-Primrose-Oil-1000-mg---Vitamin-E-15-IU-Takin-Pars-Softgel",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "novothirteen",
    "brand": "Novothirteen",
    "ingredient": null,
    "strength": "2500 IU",
    "dosageForm": "powder-for-injection",
    "packageSize": null,
    "manufacturer": "Novo Nordisk",
    "importer": "نوونورد دیسک پارس",
    "sourceUrl": "https://www.darooyab.ir/B-6708447152958054/NOVOTHIRTEEN-2500-IU(tu-ml)-Powder-For-Injection",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null,
    "integrityWarning": "در صفحه دارویاب ماده مؤثره «تارولیدین» درج شده که با هویت فرآورده Novothirteen ناسازگار به نظر می‌رسد؛ تا بررسی مستقل، ماده مؤثره عمداً خالی است."
  },
  {
    "id": "ferrokid",
    "brand": "Ferrokid Bio Formula",
    "ingredient": "Multivitamin + iron",
    "strength": null,
    "dosageForm": "syrup",
    "packageSize": "200 mL",
    "manufacturer": "افق تولید دارو پارس",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-9583938195313321/Ferrokid-Bio-Formula-200-ml-Syrup",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "liv-o-health-70",
    "brand": "Liv O Health",
    "ingredient": "Milk thistle extract",
    "strength": "70 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "تکین پارس فارمد",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-659755533731213/Liv-O-Health-70-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "liv-o-health-140",
    "brand": "Liv O Health",
    "ingredient": "Milk thistle extract",
    "strength": "140 mg",
    "dosageForm": "tablet",
    "packageSize": null,
    "manufacturer": "تکین پارس فارمد",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-430553371216640/Liv-O-Health-140-mg-Tablet",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "eslimtak",
    "brand": "Eslimtak",
    "ingredient": null,
    "strength": null,
    "dosageForm": "capsule",
    "packageSize": null,
    "manufacturer": "تکین پارس فارمد",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-6594004734121315/Eslimtak-Capsule",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "lipoton",
    "brand": "Lipoton My Nutrition",
    "ingredient": "Omega-3 triglycerides",
    "strength": null,
    "dosageForm": "syrup",
    "packageSize": "200 mL",
    "manufacturer": "افق تولید دارو پارس",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-4368332034786804/Lipoton-My-Nutrition-200-ml-Syrup",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  },
  {
    "id": "revitomix",
    "brand": "Revitomix",
    "ingredient": "Multivitamin (injectable)",
    "strength": null,
    "dosageForm": "powder-for-injection",
    "packageSize": null,
    "manufacturer": "فناوران دارویی باراد فارمد",
    "importer": null,
    "sourceUrl": "https://www.darooyab.ir/B-6310395795639629/Revitomix-powder-For-Injection",
    "observedAt": "2026-11-21",
    "sourceStatus": "public-page-fact-unverified",
    "irc": null,
    "gtin": null,
    "currentRegistration": null,
    "officialPriceRial": null,
    "authorizedImagePath": null
  }
];
