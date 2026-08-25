# Privacy and compliance

MARK handles health data, so the bar is the higher one: special-category
personal data under GDPR article 9. This file records what the app already
does, and what still has to be arranged outside the code.

**Not legal advice.** Have the privacy statement and the processing record
reviewed by someone qualified before launch — especially the health-data
parts.

## What the app already does

| Requirement | Where |
|---|---|
| Right of access & portability (art. 15, 20) | More → your data → *Export my data*. One readable JSON file with everything, including the device-only cycle data. |
| Right to erasure (art. 17) | More → *Delete my account*. Also required by Apple (App Store guideline 5.1.1(v)). Runs `delete_own_account()`; every table cascades from `auth.users`. |
| Explicit consent for health data (art. 9) | Body → cycle asks before recording anything, states what is stored and where, and erases everything when consent is withdrawn. |
| Data minimisation | Cycle data never leaves the device — no Supabase tables exist for it by design. |
| Analytics consent | Off by default, opt-in under More → analytics. |
| No health data in analytics | `src/lib/analytics.ts` — the event names are a closed union and properties are counts and screen names only, so there is no field a symptom or a habit name could travel in. Body and cycle screens never call it. |

## What still has to be arranged

1. **EU region for the database.** Choose an EU region (e.g. `eu-central-1`
   Frankfurt or `eu-west-1` Ireland) when creating the Supabase project.
   This cannot be changed afterwards without migrating — pick it before
   there is real data. Verify under Project settings → General → Region.

2. **Data processing agreement with Supabase.** Supabase acts as processor.
   Request/sign the DPA (Supabase offers one for paid plans) and keep the
   signed copy. Note the sub-processors it names — AWS for hosting.

3. **Records of processing (art. 30).** A short register: what is processed
   (habits, marks, sleep, steps, knowledge, reflections), for what purpose
   (running the app for the user), the legal basis (contract for the core
   app, explicit consent for health data and analytics), retention (until
   the account is deleted), and recipients (Supabase as processor).

4. **Privacy statement.** A draft is below. It must be reachable from
   outside the app too — the App Store requires a public URL.

5. **Apple App Privacy questionnaire.** Declare health & fitness data as
   collected but *not* linked to identity for anything device-only, and be
   accurate about what is stored server-side. Health data may never be used
   for advertising or sold — MARK does neither.

6. **Breach procedure.** Know in advance who is notified and how: a
   notifiable breach must reach the supervisory authority within 72 hours.

## Draft privacy statement

> **What MARK stores**
> Your pillars, habits and daily marks; what you log about movement,
> nutrition, sleep and steps; your knowledge entries and mind-dump notes;
> and your weekly, monthly and quarterly reflections. If you create an
> account: your email address and, if you give one, your first name.
>
> **Where it is stored**
> In your own account on our database, hosted in the European Union by
> Supabase, who processes it only on our instructions under a data
> processing agreement. Without an account, everything stays on your device.
>
> **Cycle data is different**
> What you record in the cycle module stays in the app on your phone. It is
> never sent to our servers, never shared with anyone, and no analytics runs
> on those screens. Deleting it in the app deletes it completely.
>
> **Why we store it**
> Only to run MARK for you: to show your marks, your progress and your
> reflections. We do not sell data, we do not advertise, and we do not
> profile you.
>
> **Analytics**
> Off unless you turn it on. When on, we record which screens are used and
> which flows are completed, as counts. It never includes anything from the
> Body or cycle screens, and never your habit names or notes.
>
> **Your rights**
> Export everything at any time under More → your data. Delete your account
> and all of it under More → delete account. You can also ask us to correct
> data, object to processing, or complain to your national data protection
> authority.
>
> **How long**
> Until you delete your account. After deletion, data is removed from the
> live database immediately and disappears from backups within 30 days.
>
> **Contact** — <your support email>
