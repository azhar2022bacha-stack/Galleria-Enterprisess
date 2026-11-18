'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Clock3, RotateCw, Search, Trash2, UserRound } from 'lucide-react';

type HandoverStatus = 'open' | 'in_progress' | 'completed';
type HandoverPriority = 'low' | 'normal' | 'high' | 'urgent';

interface HandoverTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: HandoverPriority;
  status: HandoverStatus;
  dueAt: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface AdminHandoverViewProps {
  notify?: (msg: string) => void;
}

interface TaskDraft {
  title: string;
  description: string;
  assignedTo: string;
  priority: HandoverPriority;
  dueAt: string;
}

interface AdminDirectoryEntry {
  id: string;
  name: string;
  email: string;
  isRoot: boolean;
}

const LEGACY_STORAGE_KEY = 'buyxoco_admin_handover_tasks';
const LEGACY_MIGRATION_KEY = 'buyxoco_admin_handover_migrated_v1';
const EMPTY_DRAFT: TaskDraft = { title: '', description: '', assignedTo: '', priority: 'normal', dueAt: '' };

const STATUS_LABELS: Record<HandoverStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
};

const PRIORITY_LABELS: Record<HandoverPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

async function requestHandoverApi(method: string, body?: unknown) {
  const response = await fetch('/api/admin/handover', {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to update the handover list.');
  return data as { tasks?: HandoverTask[]; admins?: AdminDirectoryEntry[]; task?: HandoverTask; deleted?: number };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function toDateTimeInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isOverdue(task: HandoverTask): boolean {
  return task.status !== 'completed' && Boolean(task.dueAt) && new Date(task.dueAt!).getTime() < Date.now();
}

export function AdminHandoverView({ notify }: AdminHandoverViewProps) {
  const [tasks, setTasks] = useState<HandoverTask[]>([]);
  const [admins, setAdmins] = useState<AdminDirectoryEntry[]>([]);
  const [draft, setDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaskDraft>(EMPTY_DRAFT);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | HandoverStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | HandoverPriority>('all');
  const [search, setSearch] = useState('');
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTasks = async (showRefreshMessage = false) => {
    setError('');
    try {
      let data = await requestHandoverApi('GET');
      let loadedTasks = data.tasks || [];
      setAdmins(data.admins || []);

      // Bring forward tasks from the previous browser-only version once.
      if (!localStorage.getItem(LEGACY_MIGRATION_KEY)) {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        let migrationSucceeded = true;
        if (!loadedTasks.length && legacyRaw) {
          try {
            const legacyTasks = JSON.parse(legacyRaw);
            if (Array.isArray(legacyTasks) && legacyTasks.length) {
              data = await requestHandoverApi('POST', { legacyTasks });
              loadedTasks = data.tasks || loadedTasks;
            }
          } catch (migrationError) {
            migrationSucceeded = false;
            console.warn('Unable to migrate browser handover tasks:', migrationError);
          }
        }
        if (migrationSucceeded) localStorage.setItem(LEGACY_MIGRATION_KEY, '1');
      }

      setTasks(loadedTasks);
      setSelectedIds((current) => current.filter((id) => loadedTasks.some((task) => task.id === id)));
      if (showRefreshMessage) notify?.('Handover list refreshed');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load handover tasks.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadTasks();
    // Load the shared list once when this admin section opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (!query) return true;
      return [task.title, task.description, task.assignedTo, task.createdBy]
        .some((value) => value.toLocaleLowerCase().includes(query));
    });
  }, [tasks, statusFilter, priorityFilter, search]);

  const counts = useMemo(() => ({
    open: tasks.filter((task) => task.status === 'open').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'completed').length,
  }), [tasks]);

  const adminsByEmail = useMemo(() => new Map(admins.map((admin) => [admin.email.toLowerCase(), admin])), [admins]);
  const getAssignedOwnerLabel = (assignedTo: string) => {
    if (!assignedTo) return 'Unassigned';
    const admin = adminsByEmail.get(assignedTo.toLowerCase());
    return admin ? `${admin.name} (${admin.email})` : assignedTo;
  };

  const allVisibleSelected = filteredTasks.length > 0 && filteredTasks.every((task) => selectedIds.includes(task.id));

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const data = await requestHandoverApi('POST', {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
        assignedTo: draft.assignedTo.trim(),
        dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
      });
      if (data.task) setTasks((current) => [data.task!, ...current]);
      setDraft(EMPTY_DRAFT);
      notify?.('Handover task added');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add the task.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTaskStatus = async (task: HandoverTask, status: HandoverStatus) => {
    setBusyIds((current) => [...current, task.id]);
    setError('');
    try {
      const data = await requestHandoverApi('PATCH', { id: task.id, status });
      if (data.task) setTasks((current) => current.map((item) => item.id === task.id ? data.task! : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the task.');
    } finally {
      setBusyIds((current) => current.filter((id) => id !== task.id));
    }
  };

  const startEditing = (task: HandoverTask) => {
    setEditingId(task.id);
    setEditDraft({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      dueAt: toDateTimeInput(task.dueAt),
    });
  };

  const saveTaskDetails = async (event: FormEvent, id: string) => {
    event.preventDefault();
    if (!editDraft.title.trim()) return;
    setBusyIds((current) => [...current, id]);
    setError('');
    try {
      const data = await requestHandoverApi('PATCH', {
        id,
        title: editDraft.title.trim(),
        description: editDraft.description.trim(),
        assignedTo: editDraft.assignedTo.trim(),
        priority: editDraft.priority,
        dueAt: editDraft.dueAt ? new Date(editDraft.dueAt).toISOString() : null,
      });
      if (data.task) setTasks((current) => current.map((task) => task.id === id ? data.task! : task));
      setEditingId(null);
      notify?.('Handover task updated');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the task.');
    } finally {
      setBusyIds((current) => current.filter((busyId) => busyId !== id));
    }
  };

  const deleteIds = async (ids: string[]) => {
    const data = await requestHandoverApi('DELETE', { ids });
    const remaining = data.tasks || tasks.filter((task) => !ids.includes(task.id));
    setTasks(remaining);
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    return data.deleted ?? ids.length;
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    if (!window.confirm(`Delete ${count} selected handover task${count === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setError('');
    try {
      const deleted = await deleteIds(selectedIds);
      notify?.(`Deleted ${deleted} task${deleted === 1 ? '' : 's'}`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete selected tasks.');
    }
  };

  const handleDeleteOne = async (task: HandoverTask) => {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteIds([task.id]);
      notify?.('Task deleted');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the task.');
    }
  };

  const handleClearCompleted = async () => {
    if (!counts.completed) {
      notify?.('No completed tasks to clear');
      return;
    }
    if (!window.confirm(`Clear ${counts.completed} completed task${counts.completed === 1 ? '' : 's'} from the handover history? This cannot be undone.`)) return;
    setError('');
    try {
      const data = await requestHandoverApi('DELETE', { clearCompleted: true });
      const remaining = data.tasks || tasks.filter((task) => task.status !== 'completed');
      setTasks(remaining);
      setSelectedIds((current) => current.filter((id) => remaining.some((task) => task.id === id)));
      notify?.(`Cleared ${data.deleted ?? counts.completed} completed task${(data.deleted ?? counts.completed) === 1 ? '' : 's'}`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to clear completed tasks.');
    }
  };

  const toggleSelectVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredTasks.map((task) => task.id));
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...filteredTasks.map((task) => task.id)])));
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto animate-fadeIn pb-12">
      <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 pt-6 sm:px-8 sm:pt-7">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Shift Handover</h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 sm:text-sm">
              Keep unfinished work visible to the next shift. Tasks are shared across admins and stay here until completed or deleted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setIsRefreshing(true); void loadTasks(true); }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <RotateCw className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-y border-gray-100 bg-gray-50/60 px-6 py-4 sm:grid-cols-3 sm:px-8">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Open</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{counts.open}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">In progress</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{counts.inProgress}</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Completed history</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{counts.completed}</p>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold text-gray-700 md:col-span-2">
                Task title
                <input
                  required
                  maxLength={200}
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Confirm the delayed shipment with the carrier"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-700 md:col-span-2">
                Notes
                <textarea
                  maxLength={4000}
                  rows={2}
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Add context, order number, or what the next shift should know"
                  className="mt-1.5 w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-normal leading-relaxed text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-700">
                Owner
                <select
                  value={draft.assignedTo}
                  onChange={(event) => setDraft((current) => ({ ...current, assignedTo: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => <option key={admin.id} value={admin.email}>{admin.name} — {admin.email}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Priority
                  <select
                    value={draft.priority}
                    onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as HandoverPriority }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-gray-700">
                  Due date
                  <input
                    type="datetime-local"
                    value={draft.dueAt}
                    onChange={(event) => setDraft((current) => ({ ...current, dueAt: event.target.value }))}
                    className="mt-1.5 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-xs font-normal text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !draft.title.trim()}
                className="rounded-lg bg-[#18181b] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? 'Adding…' : 'Add handover task'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div role="alert" className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 sm:mx-8">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-4 sm:px-8">
          <div className="relative min-w-[190px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks, notes, or owner"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-xs text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              aria-label="Search handover tasks"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-gray-400" aria-label="Filter by status">
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-gray-400" aria-label="Filter by priority">
            <option value="all">All priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label} priority</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3 sm:px-8">
          <label className="mr-1 flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} disabled={!filteredTasks.length} className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400" />
            Select visible ({selectedIds.length} selected)
          </label>
          <button type="button" disabled={!selectedIds.length} onClick={() => void handleDeleteSelected()} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40">
            Delete selected
          </button>
          <button type="button" disabled={!counts.completed} onClick={() => void handleClearCompleted()} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
            Clear completed history
          </button>
          <span className="ml-auto text-[11px] text-gray-400">{filteredTasks.length} of {tasks.length} tasks</span>
        </div>

        <div className="px-6 py-2 sm:px-8">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading shared handover tasks…</div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-10 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-700">{tasks.length ? 'No tasks match these filters.' : 'No handover tasks yet.'}</p>
              <p className="mt-1 text-xs text-gray-500">Open items will remain here for the next shift.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <article key={task.id} className={`group flex gap-3 py-4 ${task.status === 'completed' ? 'opacity-75' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(task.id)}
                      onChange={() => setSelectedIds((current) => current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id])}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      aria-label={`Select ${task.title}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className={`break-words text-sm font-semibold leading-relaxed text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h2>
                          {task.description && <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600">{task.description}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${task.priority === 'urgent' ? 'bg-rose-100 text-rose-700' : task.priority === 'high' ? 'bg-amber-100 text-amber-700' : task.priority === 'low' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                            {PRIORITY_LABELS[task.priority]} priority
                          </span>
                          <button type="button" onClick={() => editingId === task.id ? setEditingId(null) : startEditing(task)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100" aria-label={`Edit ${task.title}`}>
                            {editingId === task.id ? 'Cancel edit' : 'Edit'}
                          </button>
                          <button type="button" onClick={() => void handleDeleteOne(task)} className="rounded p-1 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600" title="Delete task" aria-label={`Delete ${task.title}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500">
                        <span className={`inline-flex items-center gap-1 ${overdue ? 'font-semibold text-rose-600' : ''}`}>
                          <Clock3 className="h-3.5 w-3.5" />
                          {task.dueAt ? `Due ${formatDate(task.dueAt)}${overdue ? ' · overdue' : ''}` : 'No due date'}
                        </span>
                        <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{getAssignedOwnerLabel(task.assignedTo)}</span>
                        <span>Added by {task.createdBy || 'Admin'} · {formatDate(task.createdAt)}</span>
                        {task.status === 'completed' && task.completedAt && <span>Completed {formatDate(task.completedAt)}</span>}
                      </div>

                      {editingId === task.id && (
                        <form onSubmit={(event) => void saveTaskDetails(event, task.id)} className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                          <input required maxLength={200} value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} aria-label="Task title" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 md:col-span-2" />
                          <textarea maxLength={4000} rows={2} value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Notes" aria-label="Task notes" className="resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400 md:col-span-2" />
                          <select value={editDraft.assignedTo} onChange={(event) => setEditDraft((current) => ({ ...current, assignedTo: event.target.value }))} aria-label="Task owner" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-400">
                            <option value="">Unassigned</option>
                            {editDraft.assignedTo && !adminsByEmail.has(editDraft.assignedTo.toLowerCase()) && <option value={editDraft.assignedTo}>{editDraft.assignedTo} (current owner)</option>}
                            {admins.map((admin) => <option key={admin.id} value={admin.email}>{admin.name} — {admin.email}</option>)}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <select value={editDraft.priority} onChange={(event) => setEditDraft((current) => ({ ...current, priority: event.target.value as HandoverPriority }))} aria-label="Task priority" className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 outline-none focus:border-gray-400">
                              {Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label} priority</option>)}
                            </select>
                            <input type="datetime-local" value={editDraft.dueAt} onChange={(event) => setEditDraft((current) => ({ ...current, dueAt: event.target.value }))} aria-label="Task due date" className="min-w-0 rounded-lg border border-gray-200 bg-white px-2 py-2 text-[10px] text-gray-900 outline-none focus:border-gray-400" />
                          </div>
                          <div className="flex justify-end gap-2 md:col-span-2">
                            <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                            <button type="submit" disabled={busyIds.includes(task.id) || !editDraft.title.trim()} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50">{busyIds.includes(task.id) ? 'Saving…' : 'Save changes'}</button>
                          </div>
                        </form>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`status-${task.id}`}>Status for {task.title}</label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          disabled={busyIds.includes(task.id)}
                          onChange={(event) => void updateTaskStatus(task, event.target.value as HandoverStatus)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-gray-100 disabled:opacity-60 ${task.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : task.status === 'in_progress' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700'}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        {task.status === 'open' && <button type="button" disabled={busyIds.includes(task.id)} onClick={() => void updateTaskStatus(task, 'in_progress')} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-50">Start task</button>}
                        {task.status !== 'completed' && <button type="button" disabled={busyIds.includes(task.id)} onClick={() => void updateTaskStatus(task, 'completed')} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"><Check className="h-3.5 w-3.5" />Mark done</button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
