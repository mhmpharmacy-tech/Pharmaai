# Iran drug-product review workbench: public factual references and manual completion

**Reviewed 2026-11-21.** This feature deliberately distinguishes individual factual fields from copyrighted or licensed clinical narratives, site designs and photographs.

## Sources and explicit Darooyab notice

Darooyab: https://www.darooyab.ir/
Public product pages: /B-...; public generic pages: /G-....

The **Darooyab website footer explicitly asserts copyright over website/app content and design and warns against copying**. Public browsing does not mean the entire proprietary database, page text, product photography or interface is public domain. This module stores a limited selection of independently observable **product identity facts** with direct attribution links, and does NOT mirror the site, its detailed medical text, database, artwork or screenshots. A full bulk content/image mirror would require resolving that restriction with the rightsholder. Also observe platform technical limits/robots rules.

### What was actually inspected

- **25 separate public Darooyab product pages** including Kepatemp, Iripro, PrisinCare, Ipranext, Globucel, Papidele, Buto-Asma, Tirzacto, Keptalax, selected herbal/supplement products and others.
- **25 separate generic-product reference links** appearing in the site's commonly searched medication list.
- Combined into the pre-existing **54 distinct catalogue product examples**, for **79 editable source-linked product examples**.
- The prior **143 clinical records** and **809 historical book headings** are separate data layers; these numbers must not be added as unique registered pharmaceuticals.
- All 79 source-linked records remain unverified against official IRC and not automatically published as medical monographs.
- **0 product photographs copied from Darooyab**; **0 official prices imported**; **0 IRC numbers guessed**; no AI model training using those images.

## Corrected source ambiguity

**Novothirteen** product page currently displays a suspect ingredient classification, associating its injection with a different ingredient. We intentionally left the `ingredient` field **null**, with an explicit data discrepancy warning. This demonstrates the rule: source details can be wrong and should not be promoted to confirmed medical identity without cross-checking official product labeling.

**Keptalax 4000**: the number 4000 relates to the polyethylene glycol grade, not a verified patient dose. Package size **10 g/70 g** is stored separately; `strength` is left null rather than fabricating a dose.

**Ipranext, Globucel and Buto-Asma**: where the page identifies a foreign manufacturer and separate local importing company, they are saved as **separate fields** rather than incorrectly describing the importer as the domestic factory.

**Tirzacto**: numeric price information may be displayed on the Darooyab page as a pharmacy-set figure; it is **not** the regulator's validated consumer price. The official price field remains blank.

## Review workbench

Open PharmaAI > بانک دارویی > **تکمیل و اصلاح اطلاعات ایران**.

- Browse 79 source-linked products; filter directly observed Darooyab pages, 2024 manufacturer directory and secondary product catalogue.
- Search by ingredient, company, brand or strength and open the original source page to resolve discrepancies.
- Edit known fields as corrections (without overwriting source values) or fill blank fields: ingredient, concentration, form, package size, manufacturer, importer, IRC, GTIN, checked price and date, pharmacist note.
- Validate IRC syntax and GTIN check digit; a syntactically correct identifier is **not** automatic live authenticity verification.
- Save front/back self-photographed box images to **device IndexedDB** after MIME/file signature, hash and size checks; files are not uploaded, included in Git, or fed to AI.
- Save the edits as local browser metadata. Download a versioned **JSON snapshot** with all seed values, editable overrides and outstanding blank fields. **Photos are not included in JSON export**; keep separate secure backups.
- Optional *pharmacist identity reviewed* status checks key identity fields. It is NOT clinical, legal, product-authenticity or official IRC approval.

Important limits:
- Browser local storage is device/browser-specific and can be cleared. Export JSON regularly.
- The workflow does not sync records/photos back to the GitHub repository or central application database.
- No automatic external source scraping, copyright-protected page text reuse, or licensed image ingestion is added.
- The visual AI model has **not** been fine-tuned or measured on these photos. Its preexisting server recognition and evidence controls remain separate.
- Clinical dosing, age, renal/hepatic adjustments and drug interactions require independent medical reference review, not Darooyab narrative import.

## Next improvements

1. Expand curated product identity facts via permitted sources or user first-party photography.
2. Connect actual official IRC/TTAC verification with proof, batch dates and manual reviewer decisions.
3. Build a secure authenticated central pharmacist review platform when local drafts are ready.
4. Only then curate a rights-cleared photo dataset, cross-check ingredient/strength/route and measure false-positive acceptance rate on unseen real images.

The files `src/data/darooyabPublicFacts.ts`, `src/utils/iranProductReview.ts` and `src/components/IranProductReviewPanel.tsx` implement this feature; `src/utils/iranProductPhotoStore.ts` stores only original local photos on the user's device.
