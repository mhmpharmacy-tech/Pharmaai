# Iranian generic medicines — historical reference-name index

## Source and scope

Input: the user-uploaded Persian PDF titled «داروهای ژنریک ایران», 1007 PDF
pages. The PDF creation metadata is dated **2008**. This material is a
*historical book*, **not** a verified current National Drug List, Iranian
regulatory authorization database, or up-to-date pharmacopoeia.

Names were identified from the book's Persian/English entry headings and
the surrounding brand/category structure. The original book's dosage
instructions, medical claims and monograph paragraphs were **not copied**.

## Two non-interchangeable catalog levels

- **143 existing clinical-formulary records:** fields for strengths, doses,
  contraindications and counseling. These are **not necessarily clinically
  verified**, and their existing provenance remains as before.
- **807 deduplicated historical book headings:** searchable as Persian/
  English archival *index entries only*, with a PDF page reference.
  These do not contain any dosing or product approval data.

**Do not add the numbers together as distinct active substances.** Some
clinical records overlap with historical headings, and the archive may
list route-specific formulations, combinations, vaccines, excipients or
retired medicines. A record in the archive is not evidence that the drug
is currently marketed in Iran.

## Extraction details

- Scanned/parsed entries came from the main book section (PDF pages
  23–997). Source headings, including spelling variants, are preserved
  as found where possible.
- Duplicate page-boundary extracts are collapsed by heading and PDF page;
  extractions that were split over multiple lines were repaired for the
  source names of chorionic gonadotropin, co-amoxiclav, co-trimoxazole,
  DTP, FEIBA and quinidine bisulfate.
- Search compares normalized Latin/Persian text; it does not assert
  identity equivalence between different brands or trade names.
- Every index result is labeled historical/unverified. It cannot be
  added to a prescription or displayed as an approved drug monograph.

## Future steps toward a contemporary Iranian formulary

1. Obtain an authorized, current Iranian national medicines product dataset
   with generic names, national IDs, strengths, dosage forms and
   registration status; record its publication and update date.
2. Map historical headings to canonical INN / ATC / regulator product codes
   through reviewed aliases, including correction of older transliterations.
3. Reconcile duplicates across the 143 existing records and the historical
   headings by **ingredient plus route/formulation**, not textual similarity.
4. Check discontinued drugs, fixed-dose combinations, vaccines, biologicals,
   controlled medicines and medicines not currently marketed.
5. Enter dosing, max dose, pediatric weight bands, adjustments, interactions,
   contraindications and monitoring **only after independent source
   verification** and pharmacist sign-off.
6. Keep an immutable audit log identifying reviewer, date, evidence source,
   market authorization version and reasons for approval/rejection.

No portion of this work should be represented as an approved 2026 Iranian
pharmacopoeia or used as direct prescribing guidance.
