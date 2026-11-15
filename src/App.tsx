import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Issue, IssuePriority, IssueStatus } from "./types/issue";

const STORAGE_KEY = "collaborative-workspace:issues:v1";
const CHANNEL_NAME = "collaborative-workspace:sync:v1";

const initialIssues: Issue[] = [
  { id: "ISS-1042", title: "Resolve stale data after rapid status changes", description: "A late response can overwrite a more recent optimistic update. Define the expected ordering and add a regression case.", status: "in-progress", priority: "high", assignee: "Maya Chen", labels: ["reliability", "data"], updatedAt: Date.now() - 1000 * 60 * 18 },
  { id: "ISS-1041", title: "Add keyboard navigation to the issue list", description: "Support arrow-key navigation, a visible focus state, and predictable focus restoration after closing the detail panel.", status: "todo", priority: "medium", assignee: "Jordan Lee", labels: ["accessibility"], updatedAt: Date.now() - 1000 * 60 * 60 * 3 },
  { id: "ISS-1040", title: "Document the workspace event contract", description: "Describe event names, payload versions, idempotency expectations, and how clients recover after reconnecting.", status: "todo", priority: "low", assignee: "Alex Morgan", labels: ["documentation"], updatedAt: Date.now() - 1000 * 60 * 60 * 7 },
  { id: "ISS-1039", title: "Reduce unnecessary list re-renders", description: "Profile the list with a larger fixture and isolate row subscriptions from selection state.", status: "done", priority: "medium", assignee: "Maya Chen", labels: ["performance"], updatedAt: Date.now() - 1000 * 60 * 60 * 12 },
  { id: "ISS-1038", title: "Define offline mutation behavior", description: "Queue mutations while offline, expose pending state, and reconcile queued operations when connectivity returns.", status: "in-progress", priority: "high", assignee: "Sam Rivera", labels: ["offline", "architecture"], updatedAt: Date.now() - 1000 * 60 * 60 * 24 },
];

function readIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialIssues;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as Issue[] : initialIssues;
  } catch {
    return initialIssues;
  }
}

function formatRelativeTime(timestamp: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function App() {
  const [issues, setIssues] = useState<Issue[]>(readIssues);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [draft, setDraft] = useState({ title: "", description: "", priority: "medium" as IssuePriority, assignee: "" });

  const persist = useCallback((next: Issue[], broadcast = true) => {
    setIssues(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (broadcast && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage({ type: "issues:updated", issues: next });
        channel.close();
      }
    } catch {
      setNotice("Changes are in this tab only. Browser storage is unavailable.");
    }
  }, []);

  useEffect(() => {
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try { setIssues(JSON.parse(event.newValue) as Issue[]); } catch { /* Ignore malformed external state. */ }
      }
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "issues:updated" && Array.isArray(event.data.issues)) setIssues(event.data.issues as Issue[]);
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    channel?.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    const next = params.toString();
    history.replaceState(null, "", next ? `${location.pathname}?${next}` : location.pathname);
  }, [query]);

  useEffect(() => {
    const timer = notice ? window.setTimeout(() => setNotice(""), 2600) : undefined;
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleIssues = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return issues
      .filter((issue) => statusFilter === "all" || issue.status === statusFilter)
      .filter((issue) => priorityFilter === "all" || issue.priority === priorityFilter)
      .filter((issue) => !normalized || [issue.title, issue.description, issue.id, issue.assignee, ...(issue.labels ?? [])].join(" ").toLowerCase().includes(normalized))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [issues, query, statusFilter, priorityFilter]);

  const selected = issues.find((issue) => issue.id === selectedId) ?? null;
  const counts = useMemo(() => ({
    all: issues.length,
    todo: issues.filter((issue) => issue.status === "todo").length,
    inProgress: issues.filter((issue) => issue.status === "in-progress").length,
    done: issues.filter((issue) => issue.status === "done").length,
  }), [issues]);

  function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const nextIssue: Issue = {
      id: `ISS-${Math.max(1042, ...issues.map((issue) => Number(issue.id.split("-")[1]) || 0)) + 1}`,
      title,
      description: draft.description.trim(),
      status: "todo",
      priority: draft.priority,
      assignee: draft.assignee.trim() || "Unassigned",
      labels: [],
      updatedAt: Date.now(),
    };
    persist([nextIssue, ...issues]);
    setSelectedId(nextIssue.id);
    setDraft({ title: "", description: "", priority: "medium", assignee: "" });
    setIsCreating(false);
    setNotice("Issue created");
  }

  function updateIssue(patch: Partial<Issue>) {
    if (!selected) return;
    const next = issues.map((issue) => issue.id === selected.id ? { ...issue, ...patch, updatedAt: Date.now() } : issue);
    persist(next);
    setEditing(false);
    setNotice("Changes saved");
  }

  function deleteIssue() {
    if (!selected || !window.confirm(`Delete “${selected.title}”?`)) return;
    persist(issues.filter((issue) => issue.id !== selected.id));
    setSelectedId(null);
    setNotice("Issue deleted");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">N</div><span>northstar<span className="brand-muted"> / workspace</span></span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">N</div><div><strong>Northstar Studio</strong><small>Engineering workspace</small></div><span className="chevron">⌄</span></div>
        <div className="nav-label">WORKSPACE</div>
        <button className="nav-item active"><span>▦</span> Issues <span className="nav-count">{counts.all}</span></button>
        <button className="nav-item" onClick={() => { setStatusFilter("in-progress"); setSelectedId(null); }}><span>◷</span> My activity</button>
        <button className="nav-item" onClick={() => { setStatusFilter("done"); setSelectedId(null); }}><span>✓</span> Completed</button>
        <div className="sidebar-bottom"><div className="avatar-stack"><span>MC</span><span>JL</span><span>SR</span><b>+4</b></div><div className="team-copy"><strong>Engineering team</strong><small>7 members</small></div><button className="icon-button" aria-label="Team settings">···</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> Issues</div><div className="topbar-actions"><span className={online ? "connection online" : "connection offline"}><i />{online ? "Local session" : "Offline"}</span><button className="help-button" aria-label="Help">?</button><div className="profile-avatar">AP</div></div></header>
        <section className="page-heading"><div><div className="eyebrow">ENGINEERING / TRACKER</div><h1>Issues</h1><p className="subtitle">A shared view of what the team is working on.</p></div><button className="primary-button" onClick={() => { setIsCreating(true); setSelectedId(null); }}><span>＋</span> Create issue</button></section>
        <section className="stats-row">
          <div className="stat-card"><span className="stat-label">Total issues</span><strong>{counts.all}</strong><span className="stat-foot">Across this workspace</span></div>
          <div className="stat-card"><span className="stat-label"><i className="dot dot-gray" /> Backlog</span><strong>{counts.todo}</strong><span className="stat-foot">Ready to be picked up</span></div>
          <div className="stat-card"><span className="stat-label"><i className="dot dot-blue" /> In progress</span><strong>{counts.inProgress}</strong><span className="stat-foot">Currently being worked on</span></div>
          <div className="stat-card"><span className="stat-label"><i className="dot dot-green" /> Completed</span><strong>{counts.done}</strong><span className="stat-foot">Finished work</span></div>
        </section>

        <section className="board">
          <div className="board-toolbar"><div className="view-tabs"><button className="view-tab active">All issues <span>{counts.all}</span></button><button className="view-tab" onClick={() => setStatusFilter("todo")}>Backlog</button><button className="view-tab" onClick={() => setStatusFilter("in-progress")}>In progress</button></div><div className="filters"><label className="search-box"><span>⌕</span><input aria-label="Search issues" placeholder="Search issues..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></label><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All status</option><option value="todo">Backlog</option><option value="in-progress">In progress</option><option value="done">Done</option></select><select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div></div>

          <div className="issue-layout">
            <div className="issue-table-wrap"><table className="issue-table"><thead><tr><th>ISSUE</th><th>STATUS</th><th>PRIORITY</th><th>ASSIGNEE</th><th>UPDATED</th></tr></thead><tbody>
              {visibleIssues.map((issue) => <tr key={issue.id} className={selectedId === issue.id ? "selected-row" : ""} onClick={() => { setSelectedId(issue.id); setIsCreating(false); setEditing(false); }} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedId(issue.id); }}>
                <td><div className="issue-title-cell"><span className="issue-id">{issue.id}</span><strong>{issue.title}</strong><div className="issue-labels">{(issue.labels ?? []).map((label) => <span key={label}>{label}</span>)}</div></div></td>
                <td><span className={`status-pill status-${issue.status}`}><i />{issue.status === "todo" ? "Backlog" : issue.status === "done" ? "Done" : "In progress"}</span></td>
                <td><span className={`priority priority-${issue.priority ?? "medium"}`}>{issue.priority ?? "medium"}</span></td>
                <td><span className="assignee"><span className="assignee-avatar">{(issue.assignee ?? "U").split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>{issue.assignee ?? "Unassigned"}</span></td>
                <td className="updated-cell">{formatRelativeTime(issue.updatedAt)}</td>
              </tr>)}
            </tbody></table>
            {visibleIssues.length === 0 && <div className="empty-state"><strong>No issues match your filters</strong><span>Try another search or clear the filters.</span><button onClick={() => { setQuery(""); setStatusFilter("all"); setPriorityFilter("all"); }}>Clear filters</button></div>}
            </div>

            {(selected || isCreating) && <aside className="detail-panel">
              {isCreating ? <form onSubmit={createIssue}><div className="panel-header"><span className="panel-kicker">NEW ISSUE</span><button type="button" className="icon-button" onClick={() => setIsCreating(false)}>×</button></div><h2>Create an issue</h2><label className="form-label">Title<input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="What needs to be done?" /></label><label className="form-label">Description<textarea rows={5} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Add context, acceptance criteria, or links..." /></label><label className="form-label">Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as IssuePriority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="form-label">Assignee<input value={draft.assignee} onChange={(event) => setDraft({ ...draft, assignee: event.target.value })} placeholder="Unassigned" /></label><div className="panel-actions"><button type="button" className="secondary-button" onClick={() => setIsCreating(false)}>Cancel</button><button className="primary-button" type="submit">Create issue</button></div></form> :
              <><div className="panel-header"><span className="panel-kicker">{selected?.id}</span><div><button className="icon-button" aria-label="Edit issue" onClick={() => setEditing(!editing)}>✎</button><button className="icon-button" aria-label="Close details" onClick={() => setSelectedId(null)}>×</button></div></div>
                {editing && selected ? <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateIssue({ title: String(data.get("title")).trim(), description: String(data.get("description")).trim(), assignee: String(data.get("assignee")).trim() || "Unassigned" }); }}><label className="form-label">Title<input name="title" defaultValue={selected.title} required /></label><label className="form-label">Description<textarea name="description" rows={5} defaultValue={selected.description} /></label><label className="form-label">Assignee<input name="assignee" defaultValue={selected.assignee ?? ""} /></label><div className="panel-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button">Save changes</button></div></form> :
                selected && <><div className="detail-title"><h2>{selected.title}</h2><p>{selected.description}</p></div><div className="detail-fields"><label>STATUS<select value={selected.status} onChange={(event) => updateIssue({ status: event.target.value as IssueStatus })}><option value="todo">Backlog</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label><label>PRIORITY<select value={selected.priority ?? "medium"} onChange={(event) => updateIssue({ priority: event.target.value as IssuePriority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>ASSIGNEE<div className="detail-assignee">{selected.assignee ?? "Unassigned"}</div></label><label>LAST UPDATED<div className="detail-assignee">{formatRelativeTime(selected.updatedAt)}</div></label></div><div className="activity-section"><h3>Activity</h3><div className="activity-item"><span className="activity-avatar">AP</span><div><strong>Workspace activity</strong><p>Issue is available in the local workspace.</p><small>{formatRelativeTime(selected.updatedAt)}</small></div></div></div><button className="danger-button" onClick={deleteIssue}>Delete issue</button></>}
              </>}
            </aside>}
          </div>
        </section>
        <footer className="page-footer"><span>Northstar Workspace <span>·</span> Local prototype</span><span>Changes save in this browser and sync across open tabs.</span></footer>
      </main>
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

export default App;
