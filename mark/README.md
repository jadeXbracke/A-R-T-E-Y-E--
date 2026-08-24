# MARK

Consistentie- en identiteitstracker. Elke check-in is een *mark*: een klein
bewijs van wie je aan het worden bent. Zie `PROJECTPLAN.md` voor het volledige
plan (datamodel, schermen, circle-concept).

## Draaien

```bash
cd mark
npm install
npm run web      # of: npm start (Expo Go)
```

Zonder configuratie draait de app in **demo mode**: alle data blijft in lokale
opslag op het toestel/de browser.

## Live mode (Supabase)

1. Maak een Supabase-project en draai `supabase/setup_1_schema.sql` in de SQL
   editor.
2. Zet in `mark/.env` (gitignored):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
   ```

3. Herstart Expo. De mode wordt tijdens de build gekozen
   (`DEMO_MODE = !EXPO_PUBLIC_SUPABASE_URL`), net als bij ART EYE.

Cyclusdata wordt óók in live mode nooit naar Supabase geschreven — die blijft
op het toestel (zie PROJECTPLAN.md, Privacy).

## Typecheck

```bash
npm run typecheck
```
