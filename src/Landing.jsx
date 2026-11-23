import React from 'react';

const praPhoto = 'https://commons.wikimedia.org/wiki/File:River_Pra_of_Ghana.jpg';
const satelliteSource = 'https://galamseytracker.org/rivers/pra/';
const baseline = 'https://glrssmp.epa.gov.gh/wp-content/uploads/2025/07/ESMF-Updated_GLRSSMP_July-2025.pdf';
const reporting = 'https://aqdatahub.epa.gov.gh/report-pollution';

export function Landing({ onOpen }) {
  return <div className="landing">
    <section className="landing-hero">
      <div className="hero-copy">
        <h1>Keep a record of what happens to your river.</h1>
        <p>For citizens monitoring Ghana’s waterways. Save dated observations, compare how a site changes, and prepare a report for an environmental reviewer.</p>
        <div className="hero-actions">
          <button className="primary" type="button" onClick={onOpen}>Open monitoring workspace <span aria-hidden="true">→</span></button>
          <a href="#how-it-works">See how it works</a>
        </div>
      </div>
      <figure className="hero-photo">
        <img src="/pra-river.webp" alt="The Pra River in Ghana, framed by trees along the bank" fetchPriority="high" />
        <figcaption><strong>Pra River, Ghana</strong><a href={praPhoto}>Efo Komla</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · resized and converted</figcaption>
      </figure>
    </section>

    <section className="landing-compare" id="how-it-works">
      <div className="comparison-story">
        <h2>Same bend.<br />Two different dates.</h2>
        <p>Pick two observations from a project and review the original evidence side by side. AI drafts what changed and suggests what to verify next. You review the wording before sharing.</p>
        <p className="comparison-note"><strong>What can we see here?</strong> More exposed ground beside the bend. A water sample would help assess the river’s condition.</p>
      </div>
      <figure className="landing-proof">
        <img src="/pra-comparison.jpg" alt="Two satellite captures of the same Pra River bend, with more exposed ground beside it in the later capture" width="960" height="480" loading="lazy" />
        <div className="proof-dates"><span>1 Dec 2024</span><span>30 Apr 2026</span></div>
        <figcaption>Pra River near Wassa Atobiase · Contains modified Copernicus Sentinel data 2024, 2026 · <a href={satelliteSource}>Galamsey Tracker</a></figcaption>
      </figure>
    </section>

    <section className="landing-workflow">
      <h2>From field notes to a report</h2>
      <ol>
        <li><strong>Record observations.</strong><span>Keep a project for each site. Add dates, photos, notes, and readings as you revisit.</span></li>
        <li><strong>Compare selected dates.</strong><span>Check the AI draft against the photos and notes. Supported Chrome devices can compare offline after the model download.</span></li>
        <li><strong>Share the project record.</strong><span>Download the dated history with its photos and any reviewed comparison. Share it with the people who can investigate further.</span></li>
      </ol>
      <div className="landing-context">
        <p>Illegal small-scale mining has affected waterways in Ghana, including the Pra basin. Dated records can help reviewers decide where follow-up observations or measurements are needed. <a href={baseline}>Read the Pra Basin baseline</a>.</p>
        <p>You choose when and where to share an exported report. <a href={reporting}>Ghana EPA pollution reporting</a>.</p>
      </div>
      <button className="primary" type="button" onClick={onOpen}>Open monitoring workspace <span aria-hidden="true">→</span></button>
    </section>
  </div>;
}
