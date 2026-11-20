# Iran manufacturer/product and packaging-recognition evidence (pilot)

**Date:** 2026-11-21  
**Status:** merged code may be deployed only after clinical/privacy/security review; **NOT a validated medication authentication service**.

## 1. Sources, authority and limitations

| Source | What can be taken from it | What it does NOT establish |
| --- | --- | --- |
| Iran Food and Drug Administration / TTAC: https://www.ttac.ir/ and https://irc.fda.gov.ir/ | Authoritative place to check Iranian authorization/IRC, traceability and price with a current lookup | This repository has **not** imported a live, authorized machine-readable TTAC feed; no current IRC/price/lot authenticity is validated automatically |
| 2024 *Iranian Pharmaceutical Companies Directory*, submitted by manufacturers to Syndicate of Iranian Pharmaceutical Industries, hosted by Turkish trade ministry | Manufacturer name, claimed 2024 product, dose form, strength; precise original source link stored per record | Current registered product status, market stock, image rights, or patient-level dosing |
| Farabi product list at medunited.ir/wiki/company/farabi-pharma/ | Secondary list of examples that can be cross-checked | Official manufacturer attestation, authorized price or regulatory status |
| Pillix product detail pages linked for selected items | External page where pharmacy package photos **may** appear for manual visual comparison | Redistribution rights, manufacturer confirmation of every photo, or permission to include the photos in model-training data |

Source directory: https://ticaret.gov.tr/data/620ccbd713b87642c457ec20/Iranain%20Pharmaceutical2024%20%20ompanies%20DIrectory_240308_082255.pdf

The older 2008 Iranian generic-drug book remains **historical index material only** and must not override contemporary official product registration or medical labeling.

## 2. Current implementation inventory

- **54 individual manufacturer/product/strength/form exemplars**, 3 manufacturers:
  - Daana Pharmaceutical: 16
  - CinnaGen: 19
  - Farabi Pharmaceutical: 19
- **8 links to external product-detail pages that may contain photos**.
- **0 image assets copied or claimed licensed**; **0 IRCS/GTINs verified**.
- **143 pre-existing clinical monographs** are separate and their clinical dosing is NOT validated by any of the above catalogues.
- The 809 extracted older book headings are separate historical entries and must not be counted as 809 registered/available products.
- In the 2024 directory, one row was internally inconsistent: **Zaxime®400** is listed twice, once with strength 400 mg and once 200 mg. We did **not** import the contradictory row. Product strength and manufacturing claims require verification against current TTAC.

## 3. How the packaging check works

1. The existing Gemini image scanner reads an uploaded box photo.
2. It is instructed to transcribe **only legible** brand, manufacturer, strength, formulation, generic and IRC/GTIN, with no guessing from colors/logos.
3. Server validates image MIME, signature and max size before sending it.
4. The server matches the *transcribed text* against the source-tagged catalog. Contradictory product numbers, substance, strength, form or company produce **conflict**.
5. Missing text produces **ambiguous/insufficient evidence**. Only a single concordant entry can be a **catalog-candidate**.
6. The interface explicitly says candidate is **not** regulatory verification, proof of authenticity, licensed photograph match, or approved dosing.
7. Current visual models are **not fine-tuned** by storing links to external product photos. This is an audit/trust layer on top of the model, not a model-training claim.

The model's transcription can itself be wrong, so even a concordant candidate remains unverified and must be checked against the actual product, authenticity barcode/IRC and clinical records.

## 4. Photography and photo-library acceptance checklist

Before an *actual* Iranian product image can enter the private reference-image set, capture:

- Front and back of each original box, clear Persian/Latin brand/generic, precise strength, concentration and dosage form.
- Manufacturer/registration-holder name, GTIN/IRC/TTAC authenticity label when available; do not store or expose patient names or prescriptions in the image dataset.
- A separate image of blister, bottle or ampoule where relevant.
- The exact product/version, packaging revision and photography date.
- Rights/permissions from image copyright holder or original photographer and conditions of reuse, plus asset SHA-256.
- Two-person pharmacist QA for high-alert drugs, concentration/form variants and pediatric preparations.
- Never reuse another manufacturer's image, guess a pack photo by visual similarity, or watermark third-party assets as if owned.

When rights are cleared, a separate controlled asset store/manifest and perceptual-image retrieval can be built. Photos should not be committed automatically to a public GitHub repository, and no images were committed here.

## 5. Release gates and quantifiable validation

Recommended pre-release test set: consented, de-identified real pharmacy images, including blurry/damaged packaging, different generations, multiple manufacturers of the same INN, combinations (e.g. 250/62.5 vs 500/125), neonatal liquid concentrations and unreadable IRC. Split by product/packaging revision so images of identical boxes do not appear in both train and evaluation.

Track: per-product top-1 identification precision, sensitivity/recall, **false-accepted wrong-strength** rate, false-accepted wrong-manufacturer rate, abstention/uncertainty rate, OCR/label transcription error, GTIN/IRC validation coverage, and performance on unknown products.

**No accuracy multiplier, clinical sensitivity or package authenticity metric is claimed** without prospective validation against ground truth. Preventing an unsupported exact match is more important than increasing the raw number of guesses.

## 6. Next integrations

- Obtain access/licensing to a current TTAC/IFDA product registration feed or approved export and reconcile to exact unique product identifiers.
- Verify a representative sample of brands, product strengths and manufacturers against live records before expanding beyond this pilot.
- Build authorized photo ingestion with rights tracking, versioning, QA and review queue; then evaluate actual visual reference retrieval.
- Require human pharmacist sign-off to promote a product to validated monograph/interaction dataset.
- Add explicit access controls, retention policy, consent and abuse prevention for patient-uploaded images. This work **does not** claim they have been completed.
