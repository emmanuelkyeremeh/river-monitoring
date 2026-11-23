import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { downloadFile, evidenceGaps, preparePhoto, reportText, sections } from './report.js';
import { cloudConfigured, generateReport } from './firebase.js';
import { Comparison } from './Comparison.jsx';
import { Projects } from './Projects.jsx';
import { Landing } from './Landing.jsx';
import { saveVisits } from './visits.js';
import './styles.css';

function App() {
  const [view, setView] = useState('landing');
  const [project, setProject] = useState(null);
  const site = project?.name ?? '';
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [photo, setPhoto] = useState(null);
  const [comparison, setComparison] = useState(false);
  const [measurement, setMeasurement] = useState('');
  const [allowCloud, setAllowCloud] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [context, setContext] = useState(null);
  const [reviewed, setReviewed] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const upload = useRef(null);
  const reportHeading = useRef(null);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  async function changePhoto(file) {
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      setPhoto(await preparePhoto(file));
      setOriginalPhoto(file);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function observationContext() {
    return {
      site: site.trim(), date, notes: notes.trim(), photo,
      missing: evidenceGaps({ photo, comparison, measurement: measurement !== '' }),
      measurement,
      comparison,
    };
  }

  function startManualReport() {
    setDraft({
      photoObservations: photo ? '' : 'No photo provided.',
      reportedObservations: notes.trim(),
      followUp: '',
      evidenceQuote: '',
    });
    setContext({ ...observationContext(), source: 'Manual report' });
    setReviewed(false);
    setStatus('Manual draft ready. Add observations and follow-up details.');
    reportHeading.current?.focus();
  }

  async function saveObservation() {
    const savedDate = upload.current.form.elements.namedItem('observationDate').value;
    if (!savedDate) {
      setStatus('Enter an observation date before saving.');
      return;
    }
    if (!notes.trim() && !photo) {
      setStatus('Add a photo or field notes before saving.');
      return;
    }
    const value = measurement === '' ? null : Number(measurement);
    if (value != null && (!Number.isFinite(value) || value < 0)) {
      setStatus('Enter a valid nonnegative turbidity reading.');
      return;
    }
    setBusy(true);
    try {
      await saveVisits([{ id: crypto.randomUUID(), projectId: project.id, site, date: savedDate, notes: notes.trim(), photo,
        measurement: value, kind: 'Field observation' }]);
      resetForm();
      setView('history');
    } catch {
      setStatus('Could not save the observation on this device.');
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setPhoto(null);
    setOriginalPhoto(null);
    setNotes('');
    setDate('');
    setComparison(false);
    setMeasurement('');
    setAllowCloud(false);
    setDraft(null);
    setContext(null);
    setReviewed(false);
    setStatus('');
  }

  async function generate(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('Drafting report…');
    const input = observationContext();
    try {
      const { draft: newDraft, source } = await generateReport({
        notes: input.notes, photo, cloudAllowed: allowCloud && online,
        onProgress: percent => setStatus(`Preparing Chrome’s model · ${percent}%`),
      });
      setDraft(newDraft);
      setContext({ ...input, source });
      setReviewed(false);
      setStatus('Draft ready. Check each section against the supplied evidence.');
      reportHeading.current?.focus();
    } catch (error) {
      console.warn('Report generation failed', error.code ?? error.name);
      setStatus(error.message.startsWith('Firebase configuration') || error.message.startsWith('Cloud fallback')
        ? error.message
        : allowCloud && online
          ? 'Could not generate a draft. Check the connection and Firebase setup, then retry.'
          : 'On-device generation failed. Try desktop Chrome with Gemini Nano available, or allow cloud fallback when online.');
    } finally {
      setBusy(false);
    }
  }

  function exportReport() {
    downloadFile(new Blob([reportText(draft, context)], { type: 'text/plain;charset=utf-8' }), 'river-field-report.txt');
  }

  return (
    <>
      <header className="masthead">
        <div className="wrap masthead-content">
          <button className="brand" type="button" disabled={busy} onClick={() => {
            resetForm(); setProject(null); setView('landing'); window.scrollTo(0, 0);
          }}><span className="mark" aria-hidden="true">≈</span> River Monitoring</button>
          <nav aria-label="Workspace"><button type="button" aria-current={view === 'projects' ? 'page' : undefined} disabled={busy} onClick={() => {
            resetForm(); setProject(null); setView('projects'); window.scrollTo(0, 0);
          }}>Projects</button></nav>
          <span className="connectivity"><span className={online ? 'dot' : 'dot offline'} />{online ? 'Connected' : 'Offline'}</span>
        </div>
      </header>
      <main className="wrap" key={view === 'landing' ? 'landing' : 'workspace'}>
        {view === 'landing' && <Landing onOpen={() => { setView('projects'); window.scrollTo(0, 0); }} />}
        {view === 'projects' && <Projects onOpen={selected => { setProject(selected); setView('history'); }} />}
        {view === 'history' && <Comparison online={online} project={project} onCapture={() => { resetForm(); setView('capture'); }} />}
        {view === 'capture' && <>
        <div className="intro">
          <div><p className="eyebrow">{site}</p><h1>New observation</h1><p>Save a dated photo and notes to this project.</p></div>
          <button type="button" className="secondary" disabled={busy} onClick={() => setView('history')}>Back to observations</button>
        </div>
        <div className="workspace">
          <form onSubmit={generate} className="panel">
            <h2>Observation</h2>
            <fieldset disabled={busy}>
              <div className="metadata">
                <label>Date<input type="date" name="observationDate" value={date} onChange={event => setDate(event.target.value)}/></label>
              </div>
              <div className="photo">
                {photo && <img src={photo} alt="River observation photo" />}
                <div className="photo-actions">
                  <input ref={upload} type="file" accept="image/jpeg,image/png" aria-label="Observation photo" hidden onChange={event => { void changePhoto(event.target.files[0]); event.target.value = ''; }} />
                  <button type="button" className="secondary" onClick={() => upload.current.click()}>{photo ? 'Replace photo' : 'Add a photo'}</button>
                  {originalPhoto && <button type="button" className="plain" onClick={() => downloadFile(originalPhoto, originalPhoto.name)}>Download original</button>}
                  {photo ? <button type="button" className="plain" onClick={() => { setPhoto(null); setOriginalPhoto(null); }}>Remove</button> : <small>JPEG or PNG · optional</small>}
                </div>
              </div>
              <label className="field-notes">
                Field notes
                <textarea value={notes} onChange={event => setNotes(event.target.value)}
                  placeholder="Describe what you saw at this site."
                  rows={5} maxLength={2400} aria-describedby="field-notes-help" />
                <span id="field-notes-help" className="field-help">
                  <span>Include any visible changes or comparisons.</span>
                  <span>{notes.length.toLocaleString()} / 2,400</span>
                </span>
              </label>
              <details className="measurements">
                <summary>Comparison and measurements</summary>
                <label className="consent"><input type="checkbox" checked={comparison} onChange={event => setComparison(event.target.checked)} />A dated comparison is recorded in the notes.</label>
                <label>Turbidity reading (NTU)<input type="number" min="0" step="any" value={measurement} onChange={event => setMeasurement(event.target.value)} placeholder="Optional measured value" /></label>
              </details>
              <label className="consent"><input type="checkbox" checked={allowCloud} disabled={!cloudConfigured} onChange={event => setAllowCloud(event.target.checked)} /><span>Allow cloud fallback<small>{cloudConfigured ? 'If the local model is unavailable, Firebase may send the photo and notes to Google’s servers. Site and date stay in the report form.' : 'Cloud fallback requires App Check configuration for this build.'}</small></span></label>
              <button className="primary" type="button" disabled={busy} onClick={saveObservation}>Save observation</button>
              <button className="secondary" disabled={busy || (!notes.trim() && !photo)}>Draft single-visit report</button>
              <button className="plain" type="button" disabled={busy || (!notes.trim() && !photo)} onClick={startManualReport}>Write manually</button>
            </fieldset>
            <p className="status" role="status">{status}</p>
          </form>
          <section className="panel report" aria-labelledby="report-title">
            <div className="report-header"><h2 id="report-title" ref={reportHeading} tabIndex={-1}>Review report</h2>{context && <span className="source">{context.source}</span>}</div>
            {!draft && <p className="empty">Generate a draft to review and export it here.</p>}
            {draft && (context.site || context.date) && <p className="report-context">{[context.site, context.date].filter(Boolean).join(' · ')}</p>}
            {sections.map(({ key, label, source }) => (
              <div className="report-section" key={key}>
                <label htmlFor={key}>{label}</label><span className="provenance">{source}</span>
                {draft && <textarea id={key} rows={3} value={draft[key]} onChange={event => {
                  setDraft({ ...draft, [key]: event.target.value, ...(key === 'reportedObservations' && { evidenceQuote: '' }) }); setReviewed(false);
                }} />}
              </div>
            ))}
            {draft && (
              <>
                <details className="evidence">
                  <summary>Review source material</summary>
                  {context.photo && <img src={context.photo} alt="Original observation used in this report" />}
                  {draft.evidenceQuote && <blockquote>{draft.evidenceQuote}</blockquote>}
                  <p className="source-notes">{context.notes || 'No field notes supplied.'}</p>
                </details>
                <div className="gaps">
                  <h3>Evidence gaps</h3>
                  {context.measurement !== '' && <p>Recorded turbidity · {context.measurement} NTU</p>}
                  {context.missing.length ? <ul>{context.missing.map(item => <li key={item}>{item}</li>)}</ul> : <p>Photo, dated comparison, and turbidity reading recorded.</p>}
                </div>
              </>
            )}
            {draft && (
              <div className="export">
                <label className="consent"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} />I reviewed this draft against the evidence.</label>
                <button className="primary" type="button" disabled={!reviewed || busy} onClick={exportReport}>Export report</button>
              </div>
            )}
          </section>
        </div>
        </>}
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
