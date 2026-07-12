# Task Checklist — Beteseb Auth & Verification Fixes

- [x] Next.js Routing & Config Layer
  - [x] Rename `src/proxy.ts` to `src/middleware.ts`
  - [x] Modify `src/middleware.ts` to rename `proxy` function to `middleware`, and exclude `__` in matcher config
  - [x] Add Firebase Auth custom domain rewrites in `next.config.ts`
- [x] Authentication Layer (Social Logins)
  - [x] Enable Apple ID Social Login in `src/app/[locale]/login/page.tsx`
  - [x] Enable Apple ID Social Sign-up in `src/app/[locale]/signup/page.tsx`
- [x] Verification Layer (Bypass Security Fixes)
  - [x] Modify `src/lib/verification.ts` to accept `userId` and pass it to `/api/ai/verify`
  - [x] Update `/api/ai/verify/route.ts` to fetch authentic credentials from database and perform fuzzy name & date match validation
  - [x] Update `src/app/[locale]/onboarding/page.tsx` to handle failures, display a glassmorphic block modal overlay, and direct users back to Step 4 or Step 1
- [x] Verification & Build
  - [x] Run `npm run build` to verify there are no compilation or TypeScript errors
