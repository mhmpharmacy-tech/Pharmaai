# PharmaAI clinical evidence library — pharmacist review queue

## Scope of this change

This is **an initial evidence-index and clinical-review layer**, not a complete validated
medication database or approval for live prescribing. The existing formulary dosing
text is intentionally **not overwritten** by book-derived prose or generative AI.

The app now displays short, independently paraphrased reference notes for thirteen
ingredient groups, with chapter/page or case identifiers and a mandatory
`pending-pharmacist-review` state. Other drugs explicitly have no curated note yet.

### User-provided references inspected

1. Karen J. Marcdante & Robert M. Kliegman, *Nelson Essentials of Pediatrics*,
   8th ed. Elsevier, 2019. Relevant chapters: 96 (Fever Without a Focus);
   105 (Otitis Media).
2. Terry L. Schwinghammer et al., *DiPiro's Pharmacotherapy Handbook*,
   12th ed. McGraw Hill, 2023. Relevant chapters: 11 (Ischemic Heart Disease);
   14 (Venous Thromboembolism); 19 (Diabetes Mellitus); 20 (Thyroid Disorders);
   24 (GERD); 8 (Dyslipidemia); 10 (Hypertension).
3. Caroline S. Zeind et al., *Applied Therapeutics: The Clinical Use of Drugs*,
   12th ed. Wolters Kluwer, **2024** (the uploaded PDF filename includes "2023",
   but its copyright page identifies 2024). Relevant cases: 53-11 (metformin);
   Chapter 11 anticoagulation monitoring, including Case 11-7.

References are stored as **bibliographic pointers**, not as copied book chapters.
The original copyrighted PDFs are not committed to the repository.

### Initial coverage

- Pediatrics: acetaminophen, ibuprofen, aspirin (Reye syndrome context),
  amoxicillin and amoxicillin/clavulanate (acute otitis media).
- Adult pharmacotherapy: metformin (GI tolerability, renal function, vitamin B12),
  warfarin (INR/bleeding), clopidogrel (CYP2C19 response), insulin glargine
  (basal insulin counseling and hypoglycemia), levothyroxine (absorption),
  omeprazole (GERD/PPI), atorvastatin (muscle symptoms), losartan (BP/renal monitoring).

The notes are **condition- and indication-specific**; none is proof that every
dose or presentation in the older static formulary has been validated.

## Pharmacist approval checklist for each ingredient

- [ ] Confirm generic INN and all Iranian-brand strength/form associations.
- [ ] Confirm indication, treatment goals, first-line/alternative status,
      evidence strength and any off-label classification.
- [ ] Check latest national/local guidelines, regulator/manufacturer label,
      and any relevant 2025–2026 changes; historical textbooks are not current labels.
- [ ] Validate adult dose, pediatric age bands, weight-based dose, max dose,
      administration route, duration and formulation concentration.
- [ ] Validate renal/hepatic adjustment, pregnancy/lactation, contraindications,
      interactions, adverse effects and monitoring.
- [ ] Flag high-alert/narrow-therapeutic-index situations and red flags.
- [ ] Test at least one negative/contraindication case and two edge cases.
- [ ] Record reviewer, review date, source version and decision in a future
      persisted approval/audit layer. Approval has NOT been implemented here.
- [ ] If a claim cannot be verified, display **unknown / unverified**, never
      implicitly "safe" or "approved".

## Implementation and architecture

- `src/data/clinicalEvidence.ts`: source registry, nine concise review notes,
  source relationships, review state and canonical ingredient resolution.
- `src/components/ClinicalMonographView.tsx`: shows these notes with references
  and unapproved status, adjacent to the existing dosing section.
- `src/components/LocalFormularyView.tsx`: distinguishes AI-cached entries from
  the separate source-backed pending review notes.
- `src/data/clinicalEvidence.test.ts`: matching, citation integrity and review-state tests.
- `npm test`: runs the existing formulary/logic tests plus evidence tests.

Do **not** assume `cachedFromAi` is equivalent to an independently verified
clinical record. The current app still has auto-caching logic that needs a
separate, careful migration to a quarantine/review workflow.

## High-priority next batches

1. Finish independent validation of the *existing* pediatric dosing dataset,
   especially concentration, age restrictions, mg/kg/dose versus mg/kg/day,
   maximum per dose/day, allergy and dehydration conditions.
2. High-alert and narrow-index medicines: insulin types, anticoagulants,
   antiepileptics, digoxin, methotrexate and lithium.
3. Antibiotics: separate treatment of organism, infection site, duration,
   renal adjustment and local resistance.
4. Respiratory, GI, cardiovascular, psychiatric and dermatologic groups.
5. Automated consistency checks, ingredient-formulation identifiers,
   versioned source metadata per claim, audit logging and pharmacist sign-off.

**Clinical release gate:** These notes are only educational/contextual until
individually reviewed against current sources and tested with clinical cases.
Do not deploy this draft as a validated medical decision-support system.

## Public-source enrichment and explicitly unlicensed portals (2026-11-21)

The review index now includes a product-specific 2026 U.S. DailyMed label for
metformin ER and a public Medscape Guideline Essentials summary of the October
2026 ADA/EASD type-2-diabetes consensus. Links are stored per cited source and
should be followed for checking updates. The U.S. label is **not** an Iranian
registration, and the ER-specific directions are **not** general rules for every
metformin formulation.

Daruyab (darooyab.ir) is an **Iran-market look-up portal**, not proof that any
particular imported brand, package, price or stock level in the existing catalog
has been confirmed. Likewise, Medscape Drug Reference is a professional review
portal; the project does not include a licensed Medscape data feed.

UpToDate/Lexidrug content cannot be mined or republished from a subscription
in this public repository. Its portal is an optional manual clinical review
link, **not** a claim that monographs were independently validated there.

## Safety and completeness changes

- All legacy and AI-generated monograph texts visibly require pharmacist review.
- The incomplete rule-based interaction screening returns `unverified`
  rather than `safe` when no alarm is found.
- Ingredient matching uses token boundaries rather than arbitrary substrings.
- Drug removal discards stale AI interaction findings.
- AI-generated drug records are not automatically saved to the trusted offline
  catalog. Legacy `cachedFromAi` records are also excluded when loading.
- Run `bun run audit:formulary` to quantify static records, ingredient names,
  provisional notes and structural issues. Its count of human-approved records
  is deliberately **zero**, pending a review and sign-off system.

**Clinical status:** no claim that all monographs, local products, pediatric
weight-based dosing, renal adjustments, interactions or drug availability have
been validated. This is an inspectable foundation for the remaining review.
