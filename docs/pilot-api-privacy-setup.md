# PharmaAI operator API + privacy pilot (2026-11-21)

> Scope: internal pharmacist pilot only. **Not a validated clinical system.** This change must not be taken as approval to deploy for patient care.

## 1. Production configuration

- Set `NODE_ENV=production` and `GEMINI_API_KEY` in the **server-side** secret manager.
- Generate a fresh operator token with at least 24 unpredictable characters, for example:
  ```bash
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  ```
- Store the result as the secret `PHARMAAI_ACCESS_TOKEN`. Never commit the token or put it in front-end environment variables, a URL, a README, or a screenshot.
- Never use the empty placeholder in `.env.example`. In production, unset/weak token **locks all model-backed API routes** (401).
- Serve the app only over **HTTPS**, preferably behind a trusted organization access gateway. The current shared operator token is not per-pharmacist identity, a true login session, or RBAC; do not use it for a multi-user clinical rollout.
- The page fetches `/api/access-status`, then verifies via `/api/access/verify`. The entered token is kept in React memory for the current page, sent only in `x-pharmaai-access-token` for requests, and is not stored in localStorage.

## 2. Request controls

- Authentication check runs before model API routes: `/api/analyze-image`, `/api/analyze-drugs` and `/api/check-interactions`.
- Token verification is limited to 10 attempts per 5 minutes **per remote socket IP**; AI calls to 30 per minute per socket IP. These are in-process best-effort limits, not distributed protection. A reverse proxy, API gateway, quotas and observability are required for public or scaled hosting.
- JSON input size limit: 15 MB; image validator applies its own stricter file checks. Drug-name arrays permit at most 40 entries and each name at most 140 characters. Manual lookup query maximum: 120 characters.
- API responses advertise `Cache-Control: no-store`. This does not prevent external processors from handling request contents.

## 3. Receipt OCR safety

- The server checks that OCR-reported name is present in the same legible printed line before presenting candidate information.
- Reported strength (including unit), dosage form and regimen are accepted only when text evidence from that line supports them; an unreadable/mismatched drug line clears all three.
- Numeric substring safeguards reject reported `1 mg` from a printed `11 mg`, and likewise prevent shorter number matches in dose directions.
- **A matched string is not a verified medicine, a safe dose, an official IRC, or a valid prescription.** Pharmacist confirmation remains mandatory. Real receipt OCR accuracy, precision, recall and error rates have not been measured.

## 4. Local history and cloud disclosure

- History persistence is **off by default**, except browsers that explicitly opted in using the new consent preference. Without opt-in, history is kept only in memory for the open page.
- Legacy history is not automatically restored without a new opt-in. The history screen lets the operator delete old local records. Opting in overwrites previous legacy data with the current session; opting out deletes the stored history.
- Opted-in browser history is **plaintext localStorage**, not encryption at rest. It is unsuitable for shared pharmacy computers or identifiable patient data. A secure database with roles, retention and audit policy must replace it before clinical production use.
- Before calling Gemini, the operator must acknowledge that a prescription image or drug names will be sent to the external provider. This checkbox is not proof of patient consent. Remove patient names, contact numbers, identifiers and other unnecessary information from uploaded images.
- Do not use actual identifiable patient records for the synthetic test suite.

## 5. Checks and acceptance criteria

```bash
bun install --frozen-lockfile
bun run lint
bun run test
bun run audit:formulary
bun run build
```

Review GitHub Actions for the exact PR head SHA. Then manually test:
1. Production with missing, weak and wrong tokens is denied; valid token works over HTTPS.
2. More than the permitted number of authentication and analysis requests returns HTTP 429.
3. Printed `11 mg` never validates model-reported `1 mg`; hallucinated directions/forms clear.
4. No local history key is written on a fresh browser until the user opts in.
5. Opt-out and explicit deletion remove stored history; locking the panel removes its in-memory access credential.
6. Cloud model calls require the operator to acknowledge the disclosure first.

**Not done:** penetration testing, real-device OCR evaluation, privacy-law assessment, independent pharmacist approval of monographs, user-specific access control, clinical deployment, or merging into `main`.
