import React, { useEffect, useRef, useState } from 'react';
import { createProject, deleteProject, listProjects } from './visits.js';

export function Projects({ onOpen }) {
  const dialog = useRef(null);
  const deleteDialog = useRef(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [projects, setProjects] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    listProjects().then(items => {
      if (active) setProjects(items);
    }).catch(() => {
      if (active) setMessage('Could not open projects saved in this browser.');
    });
    return () => { active = false; };
  }, []);

  function openDialog() {
    setName('');
    setError('');
    dialog.current.showModal();
  }

  async function submit(event) {
    event.preventDefault();
    const value = name.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      const project = await createProject(value);
      setProjects(previous => [...(previous ?? []), { ...project, count: 0 }]
        .sort((left, right) => left.name.localeCompare(right.name)));
      dialog.current.close();
    } catch (issue) {
      setError(issue.name === 'ConstraintError' ? 'A project with that name already exists.' : issue.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(event) {
    event.preventDefault();
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteProject(pendingDelete.id);
      setProjects(previous => previous.filter(project => project.id !== pendingDelete.id));
      deleteDialog.current.close();
    } catch {
      setDeleteError('Could not delete the project. Try again.');
    } finally {
      setDeleting(false);
    }
  }

  return <>
    <div className="intro">
      <div><h1>Projects</h1><p>Open a river site to review its history, compare dates, or export a report.</p></div>
      {Boolean(projects?.length) && <button className="primary" type="button" onClick={openDialog}>+ New project</button>}
    </div>
    {message && <p role="alert">{message}</p>}
    {projects?.length === 0 && <section className="panel project-empty">
      <div className="project-symbol" aria-hidden="true">≈</div>
      <h2>No projects yet</h2>
      <p>Create a project for the first site you want to monitor.</p>
      <button className="primary" type="button" onClick={openDialog}>+ New project</button>
    </section>}
    {Boolean(projects?.length) && <ul className="project-grid">
      {projects.map(project => <li className="project-tile" key={project.id}>
        <button className="project-card" type="button" onClick={() => onOpen(project)}>
          <span className="mark" aria-hidden="true">≈</span>
          <strong>{project.name}</strong>
          <small>{project.count} {project.count === 1 ? 'observation' : 'observations'}</small>
        </button>
        <button className="danger-link project-delete" type="button"
          aria-label={'Delete project ' + project.name} onClick={() => {
            setPendingDelete(project); setDeleteError(''); deleteDialog.current.showModal();
          }}>Delete</button>
      </li>)}
    </ul>}
    <dialog ref={deleteDialog} aria-labelledby="delete-project-title" onCancel={event => {
      if (deleting) event.preventDefault();
    }}>
      <form onSubmit={removeProject}>
        <h2 id="delete-project-title">Delete this project?</h2>
        {pendingDelete && <p><strong>{pendingDelete.name}</strong> and its {pendingDelete.count} saved {pendingDelete.count === 1 ? 'observation' : 'observations'} will be permanently removed from this browser.</p>}
        {deleteError && <p role="alert">{deleteError}</p>}
        <div className="project-actions">
          <button type="button" className="secondary" autoFocus disabled={deleting} onClick={() => deleteDialog.current.close()}>Cancel</button>
          <button className="danger" disabled={deleting}>{deleting ? 'Deleting…' : 'Delete project'}</button>
        </div>
      </form>
    </dialog>
    <dialog ref={dialog} aria-labelledby="new-project-title">
      <form onSubmit={submit}>
        <h2 id="new-project-title">New project</h2>
        <label>Project name
          <input autoFocus value={name} onChange={event => setName(event.target.value)}
            required maxLength={100} placeholder="e.g. River Pra" disabled={saving} />
        </label>
        {error && <p role="alert">{error}</p>}
        <div className="project-actions">
          <button className="secondary" type="button" disabled={saving} onClick={() => dialog.current.close()}>Cancel</button>
          <button className="primary" disabled={saving || !name.trim()}>Create project</button>
        </div>
      </form>
    </dialog>
  </>;
}
