export const sections = [
  { key: 'photoObservations', label: 'Visible in the photo', source: 'Photo' },
  { key: 'reportedObservations', label: 'Reported by the observer', source: 'Field notes' },
  { key: 'followUp', label: 'Needs verification', source: 'Follow-up' },
];


export function readReport(raw, hasPhoto, notes = '') {
  const report = JSON.parse(raw);
  if (!report || sections.some(({ key }) => typeof report[key] !== 'string')) {
    throw new Error('The model returned an incomplete draft. Try generating it again.');
  }
  const quote = typeof report.evidenceQuote === 'string' ? report.evidenceQuote.trim() : '';
  return {
    evidenceQuote: quote && notes.includes(quote) ? quote : '',
    ...Object.fromEntries(sections.map(({ key }) => [key, report[key].trim()])),
    ...(!hasPhoto && { photoObservations: 'No photo provided.' }),
  };
}

export function reportText(report, context) {
  return [
    'River Monitoring — Field report',
    context.site && 'Site: ' + context.site,
    context.date && 'Observation date: ' + context.date,
    'Inference: ' + context.source,
    context.measurement !== '' && context.measurement != null && 'Recorded turbidity: ' + context.measurement + ' NTU',
    context.credit,
    '',
    ...sections.flatMap(({ key, label }) => [label, report[key] || '—', '']),
    ...(report.evidenceQuote ? ['Verified excerpt from the original notes', report.evidenceQuote, ''] : []),
    ...(context.missing?.length ? ['Evidence gaps', ...context.missing, ''] : []),
    'Original field notes', context.notes,
  ].filter(value => value !== false && value != null).join('\n');
}

export function preparePhoto(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error('Choose a JPEG or PNG image under 20 MB.');
  }
  return createImageBitmap(file).then(bitmap => {
    try {
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      bitmap.close();
    }
  });
}

export function evidenceGaps({ photo, comparison, measurement }) {
  return [
    !photo && 'No observation photo attached.',
    !comparison && 'No dated comparison is recorded.',
    !measurement && 'No turbidity reading is recorded.',
  ].filter(Boolean);
}

export function downloadFile(file, name) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
