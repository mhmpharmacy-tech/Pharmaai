/**
 * Manufacturer-linked Iranian product exemplars.
 * These are catalog references, NOT a complete IFDA registry, licensed photo dataset,
 * pricing feed, or independently approved clinical monographs.
 *
 * Source: Syndicate of Iranian Pharmaceutical Industries 2024 directory
 * (information submitted by manufacturers) and Farabi secondary catalogue.
 * Iranian IRC/GTIN and package images MUST be separately reviewed via TTAC.
 */
export type ProductSourceTier = 'manufacturer-submitted-2024' | 'secondary-product-catalogue';
export type PackagingForm =
  | 'tablet' | 'chewable-tablet' | 'capsule' | 'softgel'
  | 'oral-suspension' | 'injection-vial' | 'prefilled-syringe' | 'injection-pen';

export interface IranianManufacturer {
  id: string;
  nameFa: string;
  nameEn: string;
  officialSite?: string;
  productsSourceUrl: string;
  sourceTier: ProductSourceTier;
}

export interface IranianMarketProduct {
  id: string;
  manufacturerId: string;
  brand: string;
  genericName: string;
  strengthLabel: string;
  form: PackagingForm;
  sourceUrl: string;
  sourceTier: ProductSourceTier;
  sourceYear: number;
  registration: { status: 'not-verified'; irc?: never; gtin?: never };
  packageImage: { status: 'missing-authorized-image'; assetPath?: never; sha256?: never };
}

export const IRAN_MANUFACTURERS: IranianManufacturer[] = [
  {
    id: 'daana',
    nameFa: 'داروسازی دانا',
    nameEn: 'Daana Pharmaceutical',
    officialSite: 'https://www.daanapharma.com/',
    productsSourceUrl: 'https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf',
    sourceTier: 'manufacturer-submitted-2024',
  },
  {
    id: 'cinnagen',
    nameFa: 'سیناژن',
    nameEn: 'CinnaGen',
    officialSite: 'https://www.cinnagen.com/',
    productsSourceUrl: 'https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf',
    sourceTier: 'manufacturer-submitted-2024',
  },
  {
    id: 'farabi',
    nameFa: 'داروسازی فارابی',
    nameEn: 'Farabi Pharmaceutical',
    officialSite: 'https://www.farabipharma.com/',
    productsSourceUrl: 'https://medunited.ir/wiki/company/farabi-pharma/',
    sourceTier: 'secondary-product-catalogue',
  },
];

const products = [
  { id:"daana-amorax-125", manufacturerId:"daana", brand:"Amorax", genericName:"Amoxicillin", strengthLabel:"125 mg/5 mL", form:"oral-suspension", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-amorax-250", manufacturerId:"daana", brand:"Amorax", genericName:"Amoxicillin", strengthLabel:"250 mg/5 mL", form:"oral-suspension", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-amorax-500", manufacturerId:"daana", brand:"Amorax", genericName:"Amoxicillin", strengthLabel:"500 mg", form:"capsule", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-cefalx-250", manufacturerId:"daana", brand:"Cefal-X", genericName:"Cephalexin", strengthLabel:"250 mg/5 mL", form:"oral-suspension", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-cefalx-500", manufacturerId:"daana", brand:"Cefal-X", genericName:"Cephalexin", strengthLabel:"500 mg", form:"capsule", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-zaxime-200", manufacturerId:"daana", brand:"Zaxime", genericName:"Cefixime", strengthLabel:"200 mg", form:"tablet", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-zaxime-400", manufacturerId:"daana", brand:"Zaxime", genericName:"Cefixime", strengthLabel:"400 mg", form:"tablet", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-zaxime-100-susp", manufacturerId:"daana", brand:"Zaxime", genericName:"Cefixime", strengthLabel:"100 mg/5 mL", form:"oral-suspension", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-ceftriana-500", manufacturerId:"daana", brand:"Ceftriana", genericName:"Ceftriaxone", strengthLabel:"500 mg", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-ceftriana-1000", manufacturerId:"daana", brand:"Ceftriana", genericName:"Ceftriaxone", strengthLabel:"1000 mg", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-clamox-625", manufacturerId:"daana", brand:"Clamox", genericName:"Amoxicillin + Clavulanic acid", strengthLabel:"625 mg (500/125 mg)", form:"tablet", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-clamox-375", manufacturerId:"daana", brand:"Clamox", genericName:"Amoxicillin + Clavulanic acid", strengthLabel:"375 mg (250/125 mg)", form:"tablet", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-dvigel-50000", manufacturerId:"daana", brand:"D-Vigel", genericName:"Cholecalciferol", strengthLabel:"50000 IU", form:"softgel", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-atorvastatin-40-daana", manufacturerId:"daana", brand:"Atorvastatin", genericName:"Atorvastatin", strengthLabel:"40 mg", form:"tablet", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-meroxan-1000", manufacturerId:"daana", brand:"Meroxan", genericName:"Meropenem", strengthLabel:"1000 mg", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"daana-meroxan-500", manufacturerId:"daana", brand:"Meroxan", genericName:"Meropenem", strengthLabel:"500 mg", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnovex-30-pfs", manufacturerId:"cinnagen", brand:"CinnoVex", genericName:"Interferon beta-1a", strengthLabel:"30 mcg/0.5 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnovex-30-vial", manufacturerId:"cinnagen", brand:"CinnoVex", genericName:"Interferon beta-1a", strengthLabel:"30 mcg", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-recigen-22-pfs", manufacturerId:"cinnagen", brand:"ReciGen", genericName:"Interferon beta-1a", strengthLabel:"22 mcg/0.5 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-recigen-44-pfs", manufacturerId:"cinnagen", brand:"ReciGen", genericName:"Interferon beta-1a", strengthLabel:"44 mcg/0.5 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-recigen-132-pen", manufacturerId:"cinnagen", brand:"ReciGen", genericName:"Interferon beta-1a", strengthLabel:"132 mcg/1.5 mL", form:"injection-pen", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnomer-20", manufacturerId:"cinnagen", brand:"Cinnomer", genericName:"Glatiramer acetate", strengthLabel:"20 mg/mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnomer-40", manufacturerId:"cinnagen", brand:"Cinnomer", genericName:"Glatiramer acetate", strengthLabel:"40 mg/mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnotec-120", manufacturerId:"cinnagen", brand:"CinnoTec", genericName:"Dimethyl fumarate", strengthLabel:"120 mg", form:"capsule", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnotec-240", manufacturerId:"cinnagen", brand:"CinnoTec", genericName:"Dimethyl fumarate", strengthLabel:"240 mg", form:"capsule", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnalf-75", manufacturerId:"cinnagen", brand:"CinnaLf", genericName:"Follitropin alfa", strengthLabel:"75 IU", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnalf-300", manufacturerId:"cinnagen", brand:"CinnaLf", genericName:"Follitropin alfa", strengthLabel:"300 IU/0.5 mL", form:"injection-pen", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnalf-450", manufacturerId:"cinnagen", brand:"CinnaLf", genericName:"Follitropin alfa", strengthLabel:"450 IU/0.75 mL", form:"injection-pen", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnalf-900", manufacturerId:"cinnagen", brand:"CinnaLf", genericName:"Follitropin alfa", strengthLabel:"900 IU/1.5 mL", form:"injection-pen", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnapoietin-2000", manufacturerId:"cinnagen", brand:"Cinnapoietin", genericName:"Erythropoietin", strengthLabel:"2000 IU/0.3 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnapoietin-4000", manufacturerId:"cinnagen", brand:"Cinnapoietin", genericName:"Erythropoietin", strengthLabel:"4000 IU/0.3 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnapoietin-10000", manufacturerId:"cinnagen", brand:"Cinnapoietin", genericName:"Erythropoietin", strengthLabel:"10000 IU/0.6 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnapoietin-20000", manufacturerId:"cinnagen", brand:"Cinnapoietin", genericName:"Erythropoietin", strengthLabel:"20000 IU/0.6 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnapoietin-40000", manufacturerId:"cinnagen", brand:"Cinnapoietin", genericName:"Erythropoietin", strengthLabel:"40000 IU/0.6 mL", form:"prefilled-syringe", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"cinnagen-cinnafact-1", manufacturerId:"cinnagen", brand:"CinnaFact", genericName:"Buserelin acetate", strengthLabel:"1 mg/mL", form:"injection-vial", sourceUrl:"https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf", sourceTier:"manufacturer-submitted-2024", sourceYear:2024, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-faramox-500", manufacturerId:"farabi", brand:"Faramox", genericName:"Amoxicillin", strengthLabel:"500 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-faramox-250-chew", manufacturerId:"farabi", brand:"Faramox", genericName:"Amoxicillin", strengthLabel:"250 mg", form:"chewable-tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-faramox-bd-200", manufacturerId:"farabi", brand:"Faramox BD", genericName:"Amoxicillin", strengthLabel:"200 mg/5 mL", form:"oral-suspension", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-faramox-bd-400", manufacturerId:"farabi", brand:"Faramox BD", genericName:"Amoxicillin", strengthLabel:"400 mg/5 mL", form:"oral-suspension", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-amoxicillin-500-farabi", manufacturerId:"farabi", brand:"Amoxicillin Farabi", genericName:"Amoxicillin", strengthLabel:"500 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-amoxicillin-250-farabi", manufacturerId:"farabi", brand:"Amoxicillin Farabi", genericName:"Amoxicillin", strengthLabel:"250 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-cloxacillin-500-farabi", manufacturerId:"farabi", brand:"Cloxacillin Farabi", genericName:"Cloxacillin", strengthLabel:"500 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-cloxacillin-250-farabi", manufacturerId:"farabi", brand:"Cloxacillin Farabi", genericName:"Cloxacillin", strengthLabel:"250 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-cefixime-200-farabi", manufacturerId:"farabi", brand:"Cefixime Farabi", genericName:"Cefixime", strengthLabel:"200 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-cefixime-400-farabi", manufacturerId:"farabi", brand:"Cefixime Farabi", genericName:"Cefixime", strengthLabel:"400 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-far-cephalexin-250", manufacturerId:"farabi", brand:"Far-Cephalexin", genericName:"Cephalexin", strengthLabel:"250 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-far-cephalexin-500", manufacturerId:"farabi", brand:"Cephalexin Farabi", genericName:"Cephalexin", strengthLabel:"500 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-farinat-250", manufacturerId:"farabi", brand:"Farinat", genericName:"Cefuroxime", strengthLabel:"250 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-farinat-500", manufacturerId:"farabi", brand:"Farinat", genericName:"Cefuroxime", strengthLabel:"500 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-clarithro-250-farabi", manufacturerId:"farabi", brand:"Clarithromycin Farabi", genericName:"Clarithromycin", strengthLabel:"250 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-clarithro-500-farabi", manufacturerId:"farabi", brand:"Clarithromycin Farabi", genericName:"Clarithromycin", strengthLabel:"500 mg", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-azithro-250-farabi", manufacturerId:"farabi", brand:"Azithromycin Farabi", genericName:"Azithromycin", strengthLabel:"250 mg", form:"capsule", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-coamox-375-farabi", manufacturerId:"farabi", brand:"Co-Amoxiclav Farabi", genericName:"Amoxicillin + Clavulanic acid", strengthLabel:"375 mg (250/125 mg)", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
  { id:"farabi-coamox-625-farabi", manufacturerId:"farabi", brand:"Co-Amoxiclav Farabi", genericName:"Amoxicillin + Clavulanic acid", strengthLabel:"625 mg (500/125 mg)", form:"tablet", sourceUrl:"https://medunited.ir/wiki/company/farabi-pharma/", sourceTier:"secondary-product-catalogue", sourceYear:2026, registration: {status:'not-verified'}, packageImage: {status:'missing-authorized-image'} },
] satisfies IranianMarketProduct[];

export const IRAN_MARKET_PRODUCT_EXEMPLARS: readonly IranianMarketProduct[] = products;

export const IRAN_REGULATOR_PORTALS = {
  ttac: 'https://www.ttac.ir/',
  ifda: 'https://www.fda.gov.ir/',
  officialCountryDrugList: 'https://irc.fda.gov.ir/',
} as const;

/**
 * A manufacturer's claimed "in production" status from 2024 is not the
 * same as current IFDA/TTAC authorization or current market availability.
 * Price is deliberately absent, to prevent stale or manufactured prices.
 */
