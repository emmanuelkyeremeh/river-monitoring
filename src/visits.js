const storeName = 'visits';
const projectStore = 'projects';
let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open('river-monitoring', 2);
    request.onupgradeneeded = ({ oldVersion }) => {
      if (oldVersion < 1) request.result.createObjectStore(storeName, { keyPath: 'id' });
      if (oldVersion < 2) request.result.createObjectStore(projectStore, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); database = undefined; };
      resolve(db);
    };
    request.onerror = () => { database = undefined; reject(request.error); };
  });
  return database;
}

async function listRecords(store) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listVisits() {
  return (await listRecords(storeName)).filter(visit => !visit.demo && visit.kind !== 'Archival field photo (demo)');
}

export async function listProjects() {
  const [projects, visits] = await Promise.all([listRecords(projectStore), listVisits()]);
  const records = new Map(projects.map(project => [project.id, { ...project, count: 0 }]));
  for (const visit of visits) {
    const id = visit.projectId ?? siteKey(visit.site);
    if (!records.has(id)) records.set(id, { id, name: visit.site, count: 0 });
    records.get(id).count++;
  }
  return [...records.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export async function createProject(name) {
  const project = { id: siteKey(name), name: name.trim() };
  if ((await listProjects()).some(existing => existing.id === project.id)) {
    throw new Error('A project with that name already exists.');
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(projectStore, 'readwrite');
    tx.objectStore(projectStore).add(project);
    tx.oncomplete = () => resolve(project);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveVisits(visits) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    visits.forEach(visit => tx.objectStore(storeName).put(visit));
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
}

export function siteKey(site) {
  return site.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function comparisonFacts(earlier, later) {
  const missing = [];
  for (const [label, visit] of [['Earlier observation', earlier], ['Later observation', later]]) {
    if (!visit.photo) missing.push(label + ' has no image.');
    if (visit.measurement == null) missing.push(label + ' has no turbidity reading.');
  }
  const change = [earlier, later].every(visit => visit.measurement != null)
    ? later.measurement - earlier.measurement : null;
  return { missing, change };
}

export function verifiedQuote(value, notes) {
  const quote = typeof value === 'string' ? value.trim() : '';
  return quote && notes.includes(quote) ? quote : '';
}

export function comparisonFollowUp(earlier, later, suggestion) {
  if (earlier.measurement == null && later.measurement == null) {
    return 'Measure turbidity at the same marked spot on the next safe visit.';
  }
  return suggestion;
}

export function comparisonSummary(summary, earlier, later) {
  if (!earlier.demo || !later.demo) return summary.trim();
  // The satellite demo supports a visual land comparison only.
  const waterInferences = /\b(?:sediment|turbidity|turbid|contaminat\w*|pollut\w*|mining|mudd\w*|silt\w*)\b/i;
  const sentences = summary.trim().split(/(?<=[.!?])\s+/);
  return sentences.filter(sentence => !waterInferences.test(sentence)).join(' ').trim()
    || 'Review the two satellite images for visible changes along the riverbank.';
}

export async function deleteVisit(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function deleteProject(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([projectStore, storeName], 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.objectStore(projectStore).delete(id);
    const request = tx.objectStore(storeName).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const visit = cursor.value;
      if ((visit.projectId ?? siteKey(visit.site)) === id) cursor.delete();
      cursor.continue();
    };
  });
}
