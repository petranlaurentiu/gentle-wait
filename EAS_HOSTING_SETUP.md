# EAS Hosting Setup For AI Companion

This app uses Expo Router API routes for the AI backend in [app/api/ai+api.ts](/Users/laurentiu.petran/Projects/gentle-wait/app/api/ai+api.ts).

For Android and iOS production builds, the native app must know the hosted server origin through `EXPO_PUBLIC_API_ORIGIN`.

## What Gets Stored Where

- `OPENROUTER_API_KEY`
  - Server-side only
  - Add this in Expo EAS environment variables
  - Do not put this in client code
- `EXPO_PUBLIC_API_ORIGIN`
  - Client-safe
  - Used by native builds to call your hosted `/api/ai`
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
  - Client-safe public SDK key

## Expo Dashboard Steps

1. Go to Expo dashboard for this project.
2. Open `EAS` -> `Environment Variables`.
3. Create these variables:
   - `OPENROUTER_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
4. For the first hosting deploy, you can leave `EXPO_PUBLIC_API_ORIGIN` unset.
5. Deploy the server.
6. Copy the hosted domain returned by EAS Hosting.
7. Add `EXPO_PUBLIC_API_ORIGIN` with that hosted domain for the `preview` and `production` environments.
8. Rebuild the native app after setting `EXPO_PUBLIC_API_ORIGIN`.

## First Deploy

Run:

```bash
npm run export:web
npm run deploy:hosting:prod
```

After deploy, EAS Hosting will return a URL similar to:

```text
https://gentle-wait--production.expo.app
```

Use that as:

```text
EXPO_PUBLIC_API_ORIGIN=https://gentle-wait--production.expo.app
```

## Production Android Build

After `EXPO_PUBLIC_API_ORIGIN` is saved in Expo:

```bash
eas env:pull --environment production
npm run build:prod:android
```

The production Android build will then call:

```text
https://your-host/api/ai
```

instead of a local `/api/ai` path.

## Important Notes

- This repo uses `app.config.js`, so use the manual `origin` flow.
- Do not rely on `EXPO_UNSTABLE_DEPLOY_SERVER=1` here.
- If you redeploy to a different host or domain, update `EXPO_PUBLIC_API_ORIGIN` and rebuild native apps.
- Web can use local `/api/ai`; native production builds cannot.

## Recommended Verification

After hosting deploy:

1. Open the hosted URL in a browser.
2. Confirm the app loads.
3. Confirm `POST /api/ai` works from the hosted app.
4. Build a preview Android app with the same `EXPO_PUBLIC_API_ORIGIN`.
5. Test AI Companion on device before the Play release.
