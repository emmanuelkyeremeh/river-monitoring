# River Monitoring demo

## Before recording

Use desktop Chrome with Gemini Nano already downloaded. Open the production preview or hosted build once while connected to cache the app. Keep the two Wassa Atobiase JPEGs and the credit text nearby as separate demo materials. Use a fresh browser profile to start with empty history. For the second browser, use the hosted build after configuring production App Check, or the localhost development build with a registered debug token.

## Video outline · under three minutes

- **0:00–0:25** — Introduce a community monitor who needs to decide what to verify on a return visit.
- **0:25–0:55** — In Projects, create or open Pra River near Wassa Atobiase and add the Wassa Atobiase JPEGs as two observations, dated 2024-12-01 and 2026-04-30. In the notes identify each as a Sentinel-2 satellite capture and label any added notes as simulated. Leave both turbidity fields empty. Cut repetitive data entry if needed.
- **0:55–1:35** — Disconnect Wi-Fi in desktop Chrome, open **Compare dates** and click **Compare observations** with cloud fallback off. Show **On device**, the notes underneath the images, and the original attributed excerpts.
- **1:35–2:10** — Review the suggested next step. If needed, edit it to “Measure turbidity at the same marked spot on the next visit.” Confirm review and choose **Download project report**. Open the HTML report to show the dated history, photos, reviewed comparison, and next step.
- **2:10–2:40** — Restore the connection. Use a second browser without a local model, with the same two public observations entered before filming. Opt in to cloud fallback and show **Cloud fallback**.
- **2:40–2:55** — Explain that IndexedDB stores observations locally and Firebase AI Logic routes inference. The source repository and live demo go in the submission.

Keep the Copernicus credit visible when showing the images. The satellite captures are real, and the accompanying notes are simulated. No water-quality measurements are supplied for the example.

## Submission description draft

River Monitoring helps community water monitors compare dated observations at a river site and decide what to verify next. It keeps site history on the device, presents the original images and notes beside the comparison, flags missing turbidity readings, and exports a reviewed handoff. The demo uses two verified Sentinel-2 captures of a Pra River bend in Ghana.

Firebase AI Logic uses Gemini Nano on supported desktop Chrome. If the user enables cloud fallback, the same workflow can use the Gemini Developer API when the device model is unavailable. The app identifies which path generated the draft. App Check protects cloud requests. Observations can also be reviewed and exported manually.
