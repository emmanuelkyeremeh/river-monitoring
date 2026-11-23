import React, { useEffect, useState } from 'react';
import { cloudConfigured, generateComparison } from './firebase.js';
import { downloadFile } from './report.js';
import { projectReport } from './projectReport.js';
import { comparisonFacts, comparisonFollowUp, deleteVisit, listVisits, siteKey } from './visits.js';

function VisitCard({ visit, label, quote }) {
  return <article className="visit-card">
    <p className="eyebrow">{label}</p>
    <h3><time dateTime={visit.date}>{visit.date}</time></h3>
    <p>{visit.kind}</p>
    {visit.photo ? <img src={visit.photo} alt={visit.kind + ' on ' + visit.date} /> : <p className="image-empty">No image attached</p>}
    <p><strong>Turbidity:</strong> {visit.measurement == null ? 'No reading recorded' : visit.measurement + ' NTU'}</p>
    {quote && <blockquote>{quote}</blockquote>}
    <p className="source-notes">{visit.notes || 'No notes supplied.'}</p>
  </article>;
}

export function Comparison({ online, onCapture, project }) {
  const [visits, setVisits] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [allowCloud, setAllowCloud] = useState(false);
  const [busy, setBusy] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [modelProgress, setModelProgress] = useState(null);
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let active = true;
    listVisits().then(records => {
      if (active) setVisits(records.filter(visit => (visit.projectId ?? siteKey(visit.site)) === project.id));
    }).catch(() => {
      if (active) setStatus('This browser could not open local observation storage.');
    });
    return () => { active = false; };
  }, [project.id]);

  const records = (visits ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const canCompare = records.length > 1 && records[0].date !== records.at(-1).date;
  const earlier = records.find(visit => visit.id === first) ?? records[0];
  const later = records.find(visit => visit.id === second) ?? records.at(-1);
  const comparable = Boolean(earlier && later && earlier.date < later.date);
  const facts = comparable ? comparisonFacts(earlier, later) : null;

  function clearDraft() {
    setDraft(null);
    setReviewed(false);
    setStatus('');
  }

  async function deleteLaterObservation() {
    if (!window.confirm('Delete the saved observation dated ' + later.date + ' from this browser?')) return;
    setBusy(true);
    try {
      await deleteVisit(later.id);
      setVisits(previous => previous.filter(visit => visit.id !== later.id));
      setSecond('');
      setShowComparison(false);
      clearDraft();
      setStatus('Later observation deleted from this browser. Downloaded photos stay in Downloads.');
    } catch {
      setStatus('Could not delete the observation. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function compare() {
    setBusy(true);
    setComparing(true);
    setModelProgress(null);
    setStatus('');
    setReviewed(false);
    setDraft(null);
    try {
      setDraft(await generateComparison({ earlier, later, facts, cloudAllowed: allowCloud && online,
        onProgress: setModelProgress,
      }));
      setStatus('Comparison ready. Review it against the original observations.');
    } catch (error) {
      console.warn('Comparison failed', error.code ?? error.name);
      const reason = error.code ?? '';
      if (allowCloud && online && /fetch|app.check/i.test(reason + ' ' + error.message)) {
        setStatus('Firebase could not complete cloud fallback. Check your connection and App Check setup, then retry.');
      } else {
        setStatus('Could not generate a comparison. Use desktop Chrome with Gemini Nano available, or write the handoff manually.');
      }
    } finally {
      setComparing(false);
      setBusy(false);
    }
  }

  function writeManually() {
    setDraft({ summary: '', followUp: comparisonFollowUp(earlier, later, ''), source: 'Manual comparison' });
    setReviewed(false);
    setStatus('Add a summary and the next verification step.');
  }

  function exportProject() {
    const included = comparable && reviewed && draft?.summary.trim() && draft.followUp.trim()
      ? { ...draft, earlierDate: earlier.date, laterDate: later.date } : null;
    const html = projectReport(project, records, included);
    const filename = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'river';
    downloadFile(new Blob([html], { type: 'text/html;charset=utf-8' }), filename + '-project-report.html');
  }

  function exportComparison() {
    const details = [earlier, later].flatMap((visit, index) => [
      (index ? 'Later' : 'Earlier') + ' observation — ' + visit.date,
      visit.kind,
      'Turbidity: ' + (visit.measurement == null ? 'No reading recorded' : visit.measurement + ' NTU'),
      visit.notes, '',
    ]);
    const content = [
      'River Monitoring — Comparison handoff', earlier.site, 'Draft source: ' + draft.source, '',
      ...details,
      'Observed change', draft.summary, '',
      'Evidence gaps', ...(facts.missing.length ? facts.missing : ['Both images and readings supplied.']),
      ...(facts.change == null ? [] : ['Change in recorded turbidity: ' + facts.change + ' NTU']), '',
      ...(draft.earlierQuote ? ['Earlier excerpt: ' + draft.earlierQuote] : []),
      ...(draft.laterQuote ? ['Later excerpt: ' + draft.laterQuote] : []),
      'Next verification step', draft.followUp, '',
    ].join('\n');
    downloadFile(new Blob([content], { type: 'text/plain;charset=utf-8' }), 'river-comparison-handoff.txt');
  }

  return <>
    <div className="intro">
      <div><p className="eyebrow">Project</p><h1>{project.name}</h1><p>{records.length} saved {records.length === 1 ? 'observation' : 'observations'}</p></div>
      <div className="project-actions">
        {canCompare && <button className="secondary" type="button" disabled={busy} onClick={() => {
          setShowComparison(!showComparison); clearDraft();
        }}>{showComparison ? 'Back to history' : 'Compare dates'}</button>}
        {records.length > 0 && <button className="secondary" type="button" disabled={busy} onClick={exportProject}>Download project report</button>}
        <button className="primary" type="button" disabled={busy} onClick={onCapture}>+ New observation</button>
      </div>
    </div>
    {visits?.length === 0 && <section className="panel project-empty">
      <div className="project-symbol" aria-hidden="true">≈</div>
      <h2>No observations yet</h2>
      <p>Add a dated record for this site to start its history.</p>
    </section>}
    {records.length > 0 && !showComparison && <section className="panel">
      <h2>Observation history</h2>
      <ul className="observation-history">{records.slice().reverse().map(visit => <li key={visit.id}>
        <details><summary><time dateTime={visit.date}>{visit.date}</time>
          <span>{visit.photo ? 'Photo attached' : 'No photo'} · {visit.measurement == null ? 'No turbidity reading' : visit.measurement + ' NTU'}</span>
        </summary><VisitCard visit={visit} label="Saved observation" /></details>
      </li>)}</ul>
    </section>}
    {showComparison && <section className="panel comparison-panel">
      <h2>Compare observations</h2>
      <div className="visit-selectors">
        <label>Earlier observation<select disabled={busy} value={earlier?.id ?? ''} onChange={event => { setFirst(event.target.value); clearDraft(); }}>
          {records.map(visit => <option key={visit.id} value={visit.id}>{visit.date} · {visit.kind}</option>)}
        </select></label>
        <label>Later observation<select disabled={busy} value={later?.id ?? ''} onChange={event => { setSecond(event.target.value); clearDraft(); }}>
          {records.map(visit => <option key={visit.id} value={visit.id}>{visit.date} · {visit.kind}</option>)}
        </select></label>
      </div>
      <p className="report-context">{records.length} saved {records.length === 1 ? 'observation' : 'observations'} at this site. Choose two dates to compare.</p>
      {comparable ? <>
        <div className="visit-pair">
          <VisitCard visit={earlier} label="Earlier observation" quote={draft?.earlierQuote} />
          <VisitCard visit={later} label="Later observation" quote={draft?.laterQuote} />
        </div>
        <div className="gaps">
          <h3>Evidence check</h3>
          {facts.change != null && <p>Change in recorded turbidity · {facts.change > 0 ? '+' : ''}{facts.change} NTU</p>}
          {facts.missing.length ? <ul>{facts.missing.map(gap => <li key={gap}>{gap}</li>)}</ul> : <p>Both images and readings supplied.</p>}
        </div>
        <label className="consent"><input type="checkbox" checked={allowCloud} disabled={busy || !cloudConfigured} onChange={event => setAllowCloud(event.target.checked)} /><span>Allow cloud fallback<small>{cloudConfigured ? 'Try the on-device model first. If it isn’t available for this request, Firebase can send both images and notes to Google’s servers.' : 'Cloud fallback requires App Check configuration for this build.'}</small></span></label>
        <button className="primary" type="button" disabled={busy} onClick={compare}>{comparing ? 'Comparing…' : 'Compare observations'}</button>
        <button className="plain" type="button" disabled={busy} onClick={writeManually}>Write manually</button>
        <button className="plain" type="button" disabled={busy} onClick={deleteLaterObservation}>Delete later observation</button>
        {comparing && <div className="comparison-loading" role="status" aria-live="polite">
          <span className="comparison-spinner" aria-hidden="true" />
          <div>
            <strong>{modelProgress !== null && modelProgress < 100 ? 'Preparing Chrome’s model' : 'Comparing observations'}</strong>
            {modelProgress !== null && modelProgress < 100
              ? <span>{modelProgress}% downloaded</span>
              : <span>Reviewing the selected evidence and drafting a follow-up.</span>}
          </div>
        </div>}
      </> : <p>A comparison needs two different dates at this site. You can keep recording visits as often as needed.</p>}
    </section>}
    <p className="status" role="status">{status}</p>
    {showComparison && draft && comparable && <section className="panel handoff">
      <div className="report-header"><h2>Review handoff</h2><span className="source">{draft.source}</span></div>
      <label>Observed change<textarea disabled={busy} rows={3} value={draft.summary} onChange={event => {
        setDraft({ ...draft, summary: event.target.value, earlierQuote: '', laterQuote: '' }); setReviewed(false);
      }} /></label>
      <label>Next verification step<textarea disabled={busy} rows={2} value={draft.followUp} onChange={event => {
        setDraft({ ...draft, followUp: event.target.value }); setReviewed(false);
      }} /></label>
      <label className="consent"><input type="checkbox" disabled={busy} checked={reviewed} onChange={event => setReviewed(event.target.checked)} />I reviewed this comparison against the evidence.</label>
      <button className="primary" type="button" disabled={!reviewed || busy || !draft.summary.trim() || !draft.followUp.trim()} onClick={exportComparison}>Export comparison</button>
    </section>}
  </>;
}
