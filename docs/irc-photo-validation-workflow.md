# Iran IRC/TTAC registry and medicine packaging photo validation

**Status 2026-11-21: implementation for licensed data ingestion and independent photo evaluation. No official bulk registry data or permission-cleared image assets have been received.**

## Authority and provenance

The Iranian official medicine list is presented through the IFDA/IRC licensing portal at https://irc.fda.gov.ir/Home/HomePage, and TTAC at https://www.ttac.ir/ supports authenticity/traceability workflows. An official **generic formulary listing**, an **IRC registration for a specific product**, and a **package-specific authenticity UID** are different types of evidence. Neither a historical book nor a manufacturer catalogue replaces a regulator verification.

Public IRC/TTAC browser endpoints could not be accessed reliably from the review environment on 2026-11-21; a documented, licensed programmatic bulk API was **not** verified. Do not implement undocumented scraping, bypassing controls, or treating search snippets/secondary directories as official registration records.

## Delivered capabilities

1. `src/utils/iranRegistryImport.ts`: validate authorized regulator-data provenance, 16-digit IRC format, GTIN check digit, ingredient, brand, manufacturer, strength, route and dosage form; reject duplicate/conflicting IRC records, nonactive statuses and malformed sources.
2. `scripts/stageIranRegistry.ts`: read a user-provided UTF-8 CSV or JSON export, calculate SHA-256 of original bytes, produce `private-data/iran-irc-pending-review.json` only with `--write`. Does **not** import into the approved clinical formulary.
3. `src/utils/iranPhotoQA.ts`: photo manifest gate requiring controlled private asset, rights/consent proof, two different reviewers, checked IRC, package-revision metadata, absence of patient data, date and SHA-256, and matching front/back photographs.
4. `src/utils/iranRecognitionBenchmark.ts`: compare actual held-out model observations against separately established product identities and report precision for accepted matches, recall on known products, coverage, abstention, false-accepted incorrect strength/manufacturer and false-accepted unknown products. The test dataset bundled with source is **synthetic only**.
5. `scripts/evaluateIranImages.ts`: audit the supplied rights-cleared photo manifest before generating performance results; refuses unlabeled, unreviewed, unlicensed or missing images.
6. `private-data/` is ignored by Git. Never commit original photos, private authorization letters, patient labels or prescription images to a public repo.

The preexisting **143 clinical records**, **809 historical headings** and **54 manufacturer/product examples** remain distinct. None are upgraded to regulator-verified by these changes.

## Authorized registry-export workflow

1. For **manual review of publicly accessible official listings**, record the URL, date, and capture/evidence ID; no invented commercial contract is needed to stage manually transcribed facts. For **bulk export/API or redistribution**, document the provider's permitted access/terms or authorization as applicable. Retain the source, date and SHA-256.
2. If the source is XLS/XLSX, export a UTF-8 CSV with precisely named columns or generate an array of JSON objects. The importer intentionally does not parse proprietary Excel formatting or infer ambiguous Persian column headings.
3. Fields: `irc`, `gtin` (optional during staging), `genericName`, `brandName`, `manufacturerName`, `strength`, `dosageForm`, `route`, `regulatoryStatus` (active/suspended/cancelled/unknown). **Do not substitute a label UID or authentication code for IRC.**
4. Example invocation:

```bash
bun run registry:stage -- --input=/secure/data/official-export.csv \
  --source=https://irc.fda.gov.ir/Home/HomePage \
  --release=REPLACE_WITH_ACTUAL_RELEASE \
  --access=authorized-export \
  --permission=REPLACE_WITH_ACTUAL_EXPORT_PERMISSION \
  --write
```

5. For a manual public record use `--access=public-manual-review --evidence=ACTUAL_RECORD_CAPTURE_ID` instead of `--permission`. In both modes inspect rejected records and independently verify that the contents match their cited official pages and have not become stale.
6. Pharmacist and regulatory reviewer explicitly approve each product mapping before a separate controlled publish/deploy mechanism is implemented. **Current importer has no approval or promotion action**. It would be unsafe to auto-declare the import authoritative.

## Rights-cleared photo ingestion

For each *real* product obtain photos of the actual front and back, and optionally blister/vial/bottle/TTAC authenticity label. Keep the raw images in a secured, access-controlled asset store, outside Git. The manifest must identify:

- Registry-confirmed product IRC, source product ID, form/strength/manufacturer, exact package revision.
- Captured date, asset path, SHA-256, each view (front/back/etc.).
- For your **own photos**, use `pharmacist-original-photo`, identify yourself as the photographer and keep a simple authorship/use-attestation record ID. A separate fictitious manufacturer license is not required for first-party photo staging. For third-party images, record the actual rightsholder and permitted reuse.
- Independent reviewers A and B and whether the image is free from names, prescriptions, patient labels, background patient records or other private information.
- Verify that image and product belong to the same package revision; a different generic of the same strength must **not** be used as a substitute reference.

**No images have been copied, used to fine-tune Gemini, or claimed licensed during this work.** External product-image page links do not establish permission.

## Evaluation workflow

Prepare a private JSON with:

```json
{
  "sourceEvidenceId": "ACTUAL-REVIEW-AUDIT-REFERENCE",
  "officialRegistryIrcs": ["16_DIGIT_VERIFIED_IRC"],
  "photos": [],
  "cases": []
}
```

The placeholders above are illustrative, not real data. Each photo must satisfy `IranDrugPhotoManifest` in `src/utils/iranPhotoQA.ts`; each case must supply an independently checked image ID, product ID or null for **unknown/out-of-catalog**, packaging revision and the model's actual saved visible-label observation. Then run:

```bash
bun run vision:evaluate -- --input=private-data/iran-photo-eval.json
```

This tests the **model-text-to-catalog reconciliation pipeline** given *saved real image inference results*. It is not a standalone measure of image-model OCR accuracy unless an appropriately captured real, held-out image and inference workflow provided those results. Report sample counts, Wilson confidence intervals for key rates when appropriate, and stratify by high-alert, pediatric liquid, manufacturer, lighting, damage and unknown classes before making clinical release decisions.

**Never claim a numeric performance improvement, photo-driven model training, live IRC verification or regulatory approval without the relevant independent evidence.**

## What remains external

- Enter verified facts manually from public official listings now, retaining the page URL/date and evidence ID. A separate bulk export or API remains subject to its own access conditions; the importer does not automatically provide it.
- Start with original photographs taken in the pharmacy and a documented photographer attestation. For externally sourced photos, verify rights and define data custody.
- Run independently supervised real-world labeling and scanner evaluation; current fixtures verify *software behavior*, not sensitivity/specificity on pharmacy photos.
- Verify patient image retention, authentication, encryption, audit, server abuse protection, and clinical pharmacist approval prior to clinical production use.

## Operational fast path for a pharmacist

The two routes below are distinct and intentionally avoid holding up first-party work:

**Manual registration from the public Iranian official listing**: transcribe a record you personally checked; save the actual page/capture reference and date in a private local evidence log. Use `--access=public-manual-review --evidence=CAPTURE_REFERENCE`. This stages an *unapproved candidate*, not a live authorization claim and not a license to scrape a whole database.

**Original box photos from pharmacy inventory**: photograph front/back under neutral lighting with no patients, prescriptions, personal details or exposed private stock/account information. Use `pharmacist-original-photo` in the photo manifest and record your own first-party authorship attestation. A second independent reviewer is still recommended and currently required for promoting the item into an evaluation-ready dataset, to prevent incorrect strength or brand labels. Third-party image rights differ from rights in your own photography.

### Examples
```bash
bun run registry:stage -- \
  --input=private-data/observed-official-records.csv \
  --source=https://irc.fda.gov.ir/Home/HomePage \
  --release=record-checked-2026-11-21 \
  --access=public-manual-review \
  --evidence=private-capture-log-2026-11-21 \
  --write
```

This is for records genuinely checked on the public official source; entering an official URL does not itself prove that a record was verified. Never put the internal capture log, photo originals, patient data, or manufacturer contracts in a public repository.
