const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => entities[character]);

function counts(count, noun) {
  return count + ' ' + noun + (count === 1 ? '' : 's');
}

export function projectReport(project, observations, comparison) {
  const timeline = observations.slice().sort((left, right) => left.date.localeCompare(right.date));
  const photos = timeline.filter(visit => visit.photo).length;
  const readings = timeline.filter(visit => visit.measurement != null).length;
  const range = timeline.length > 1 ? timeline[0].date + ' to ' + timeline.at(-1).date : timeline[0]?.date;
  const evidence = timeline.map(visit => {
    const picture = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(visit.photo ?? '')
      ? '<img alt="Photo for observation dated ' + escape(visit.date) + '" src="' + visit.photo + '">' : '';
    return `<article><h3>${escape(visit.date)}</h3>
      ${picture}
      <p><strong>Turbidity</strong> ${visit.measurement == null ? 'No reading recorded' : escape(visit.measurement) + ' NTU'}</p>
      <p class="notes">${escape(visit.notes || 'No field notes supplied.')}</p></article>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
    <title>${escape(project.name)} | River Monitoring</title>
    <style>
      body{max-width:780px;margin:40px auto;padding:0 20px;font:16px/1.55 system-ui;color:#17362e}
      h1,h2,h3{line-height:1.2} h1{font-size:2.5rem} header{border-bottom:2px solid #174b3b}
      article{border-top:1px solid #b9c9c1;padding-bottom:14px} img{display:block;max-width:100%;max-height:370px}
      .notes{white-space:pre-wrap;overflow-wrap:anywhere} footer{border-top:1px solid #b9c9c1;margin-top:30px;padding-top:14px}
      @media print{body{margin:0;max-width:none}article{break-inside:avoid}}
    </style></head><body>
    <header><p>River Monitoring · Project report</p><h1>${escape(project.name)}</h1>
      <p>${escape(range)} · ${counts(timeline.length, 'observation')} · ${counts(photos, 'photo')} · ${counts(readings, 'reading')}</p></header>
    ${comparison ? `<section><h2>Reviewed comparison</h2><p>${escape(comparison.earlierDate)} to ${escape(comparison.laterDate)} · ${escape(comparison.source)}</p>
      <p class="notes">${escape(comparison.summary)}</p><h3>Next verification step</h3><p class="notes">${escape(comparison.followUp)}</p></section>` : ''}
    <section><h2>Observation history</h2>${evidence}</section>
    <footer>Prepared from citizen observations. Photos and notes document visible conditions and provide context for follow-up.</footer></body></html>`;
}
