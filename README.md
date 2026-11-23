# River Monitoring

River Monitoring helps citizens in Ghana document changes at water bodies, compare dated observations, and share a reviewed record with people who can follow up. Photos and notes record visible conditions and the observer’s account. A turbidity reading is recorded only when someone supplies a measurement.

[Open the live app](https://river-monitoring-91a53.web.app/) · [Watch the demo](https://youtu.be/wpx3EbkCJtc) · [Image credits](IMAGE-CREDITS.txt)

## Try the workflow

1. Open the monitoring workspace and create a project for a river site.
2. Save observations on at least two dates. Each can include a photo, notes, and an optional turbidity reading.
3. Choose **Compare dates** and select two observations. Review the photos and notes alongside the generated comparison and suggested follow-up.
4. Confirm your review and choose **Download project report**. The printable HTML file includes the site history, photos, and the reviewed comparison from the current view.

The landing page includes an attributed comparison of two Sentinel-2 captures of the Pra River. The workspace starts empty. To rehearse with the same imagery, see [DEMO.md](DEMO.md).

## How it works

- **Storage** uses IndexedDB in the current browser. A service worker caches the production app for repeat offline visits.
- **On-device inference** uses Gemini Nano through the Firebase AI Logic Web SDK on supported desktop Chrome. The first model download needs a connection.
- **Cloud fallback** is opt-in. With permission and a connection, Firebase can use the Gemini Developer API when the local model is unavailable. App Check protects requests to the cloud service. Each successful draft shows the actual inference source.
- **Evidence review** keeps the input photos and notes visible, checks quoted excerpts against the original notes, and calculates changes in recorded turbidity from supplied readings. AI drafts remain editable. Manual comparison and project export also work without inference.

The app prepares a report for the user to share. It does not send reports to any agency.

## Run locally

Use Node.js 24.12 or newer and a supported browser.

```sh
npm ci
cp .env.example .env.local
npm run dev -- --host 127.0.0.1
```

Fill in the Firebase web app configuration in `.env.local`. In the Firebase console, enable the **Gemini Developer API** through **Firebase AI Logic** and configure **App Check**. For localhost cloud testing, register an App Check debug token and set `VITE_APP_CHECK_LOCAL_TOKEN` in `.env.development.local`. Keep that file private.

To test offline reopening, run `npm run build` and `npm run preview`, open the production preview once online, and wait for the service worker and device model to finish preparing before disconnecting.

## Firebase Hosting

Register the hosted domain with the score-based reCAPTCHA Enterprise App Check provider. Set its public site key as `VITE_APP_CHECK_SITE_KEY` in `.env.production.local`, then build and deploy.

```sh
npm run build
firebase deploy --only hosting --project <project-id>
```

Hosting serves `dist`. Keep local debug builds and debug tokens out of Hosting and source control. See the [Firebase hybrid inference guide](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) and [Web App Check guide](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## License

The code is MIT licensed. Third-party imagery retains the terms listed in [IMAGE-CREDITS.txt](IMAGE-CREDITS.txt).
