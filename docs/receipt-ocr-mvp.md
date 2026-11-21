# Receipt name-first MVP — PharmaAI

**Scope:** recognize the name printed on a receipt / pharmacy slip / typed prescription line. No product-box image classification required.

## Why this approach

The existing catalog contains 143 code-supplied clinical drug exemplars, 25 manually observed Darooyab product pages, and 809 archived generic headings. Package photos are scarce and not needed for recognizing obvious written names on a pharmacy invoice. Name extraction is **distinct** from recognition of a registered package or medical dosing.

## User experience

1. Default image scan mode is **متن فیش / رسید**.
2. The AI must return each *legibly read* source line (receiptEvidence.visibleLine) and the visible drug name (receiptEvidence.visibleDrugName); the server checks that the name occurs on the same line.
3. Persian / Arabic yeh/kaf, digits and zero-width joiner differences are normalized; printed form prefixes such as «قرص»، «شربت» and «کپسول» do not change the generic name.
4. Exact normalized name matching is attempted against the 143 local exemplars and 25 source-linked market product names. **A historical generic index-only match is flagged for pharmacist review, not automatically canonicalized.** Unknown or ambiguous names remain unnamed. Brand names and strengths are never inferred from packaging color or previous catalog strength.
5. Strength stays **empty** unless a numeric value plus a unit is explicitly transcribed *and appears on the same actual receipt line*. «۱۰ عدد» is not 10 mg. Administration schedule stays empty unless explicitly printed.
6. Clinical AI-generated dose advice, interaction narratives and therapeutic suggestions are intentionally cleared in receipt-only mode. Clinical verification remains a **separate** feature, not part of OCR MVP.
7. The prescription basket displays the captured text, match quality and whether strength is observed or unknown.
8. Other modes (auto / package image) remain in the UI but are not the MVP priority.

## Examples

| Real receipt line | Result | Strength |
|---|---|---|
| قرص دومپریدون | Domperidone — candidate | unknown |
| قرص دومپريدون | Domperidone — candidate | unknown |
| دومپریدون ۱۰ عدد | Domperidone — candidate | unknown (quantity, not strength) |
| قرص دومپریدون ۱۰ میلی گرم | Domperidone — candidate | ۱۰ میلی گرم, visible only |
| «فاکتور: ژنریک نامعلوم» | unresolved | unknown |

**No claim of measured OCR accuracy.** The workbook `PharmaAI_MVP_Receipt_OCR_Deduplicated_2026-11-21.xlsx` adds 1,852 unique canonicalized aliases, flags 28 ambiguous aliases, and contains 20 synthetic name recognition test cases. The Excel is a **separate curation artifact**, not automatically imported into the deployed application.

## Evaluation before public use

- Collect at least a representative sample of **actual, consented/appropriately de-identified pharmacy receipts**, with the full line and pharmacist-labeled truth.
- Stratify receipts by thermal paper fading, printer quality, Persian/Latin names, strengths, combination preparations, form words, names absent from the current lexicon, OCR noise, and handwritten marks.
- Measure per-name exact precision, recall, abstention, false-positive identity, and missed/wrong strength claims.
- Human review remains required in this MVP. Never infer patient dose, indication or product registration from a slip's drug name alone.
- Avoid storing personal identifiers, patient codes or original unredacted prescription images in public assets.

## Working files

- `src/utils/receiptDrugNames.ts` — deterministic line/name reconciliation.
- `src/utils/receiptDrugNames.test.ts` — regression checks for Domperidone, Arabic text, missing strength, quantity confusion, unrelated line.
- `server.ts` — receiptEvidence schema, read-text-first Gemini prompt, server sanitization, blank dose fields.
- `src/components/CameraScannerPanel.tsx` and `PrescriptionBasket.tsx` — default text receipt mode and review state.

**Production limitations:** exact name matching cannot yet reliably resolve arbitrary spelling errors or multi-line receipts; the current source list is not a complete up-to-date Iranian market registry. No live production scanner validation or device QA has yet been conducted.
