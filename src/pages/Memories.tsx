import { useMemo, useState } from 'react';
import {
  BookHeart,
  Check,
  Filter,
  Lock,
  PencilLine,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { EmptyState } from '@/components/shared/Feedback';
import { Modal } from '@/components/shared/Modal';
import { useFamily } from '@/state/FamilyContext';
import type { MemoryEntry } from '@/types';

const TYPES: { id: MemoryEntry['type']; label: string }[] = [
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'achievement', label: 'Achievement' },
  { id: 'kind-message', label: 'Kind message' },
  { id: 'tradition', label: 'Family tradition' },
  { id: 'weekly-win', label: 'Weekly win' },
  { id: 'story', label: 'Story' },
  { id: 'photo-memory', label: 'Photo memory' },
];

const VISIBILITY: { id: MemoryEntry['visibility']; label: string; detail: string }[] = [
  { id: 'private', label: 'Private to me', detail: 'Only visible on your profile.' },
  { id: 'selected', label: 'Selected members', detail: 'Shared with the members you tag.' },
  { id: 'household', label: 'Household', detail: 'Visible on the family dashboard.' },
];

const emptyDraft = (): Omit<MemoryEntry, 'id' | 'createdAt'> => ({
  type: 'gratitude',
  title: '',
  message: '',
  date: new Date().toISOString().slice(0, 10),
  memberTags: [],
  visibility: 'household',
});

export default function Memories() {
  const { memories, profile, addMemory, updateMemory, deleteMemory, pushToast } = useFamily();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | MemoryEntry['type']>('all');
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; entry: MemoryEntry } | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<MemoryEntry | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return memories.filter((entry) => {
      const matchesFilter = filter === 'all' || entry.type === filter;
      const matchesQuery =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        entry.message.toLowerCase().includes(term) ||
        entry.memberTags.some((id) => profile.members.find((member) => member.id === id)?.name.toLowerCase().includes(term));
      return matchesFilter && matchesQuery;
    });
  }, [memories, query, filter, profile.members]);

  const openCreate = () => {
    setDraft(emptyDraft());
    setError('');
    setEditor({ mode: 'create', entry: { ...emptyDraft(), id: 'new', createdAt: new Date().toISOString() } });
  };

  const openEdit = (entry: MemoryEntry) => {
    setDraft({
      type: entry.type,
      title: entry.title,
      message: entry.message,
      date: entry.date,
      memberTags: [...entry.memberTags],
      visibility: entry.visibility,
    });
    setError('');
    setEditor({ mode: 'edit', entry });
  };

  const save = () => {
    if (draft.title.trim().length < 3) {
      setError('Give the memory a short title of at least three characters.');
      return;
    }
    if (draft.message.trim().length < 10) {
      setError('Add a sentence or two so the memory means something later.');
      return;
    }
    if (!draft.date) {
      setError('Choose a date for this memory.');
      return;
    }
    if (editor?.mode === 'edit') {
      updateMemory(editor.entry.id, { ...draft, title: draft.title.trim(), message: draft.message.trim() });
      pushToast('Memory updated.');
    } else {
      addMemory({ ...draft, title: draft.title.trim(), message: draft.message.trim() });
      pushToast('Memory added to the vault.');
    }
    setEditor(null);
  };

  return (
    <div className="mx-auto max-w-[1040px]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Family memory vault</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">
            A private place for the week’s wins
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted">
            Small achievements, kind messages, and stories worth keeping. This is not a social feed — nothing here
            is public, and visibility is chosen per entry.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="self-start">
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Add a memory
        </Button>
      </header>

      <div className="mt-4 flex flex-col gap-3 rounded-control border border-border bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="memory-search" className="sr-only">
            Search memories
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="memory-search"
            className="field pl-9"
            placeholder="Search titles, messages, or members"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')} className="chip !min-h-[32px] !px-2.5 !py-1 !text-[11.5px]">
            All
          </button>
          {TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              aria-pressed={filter === type.id}
              onClick={() => setFilter(type.id)}
              className="chip !min-h-[32px] !px-2.5 !py-1 !text-[11.5px]"
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={memories.length === 0 ? 'The vault is empty' : 'No memories match this search'}
            copy={
              memories.length === 0
                ? 'Add one small win from this week. A single sentence is enough to start.'
                : 'Try a different member name, or clear the filters to see everything.'
            }
            icon={<BookHeart aria-hidden="true" className="h-5 w-5" />}
            action={<Button size="sm" variant="ghost" onClick={openCreate}>Add the first memory</Button>}
          />
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {filtered.map((entry) => (
            <li key={entry.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {TYPES.find((type) => type.id === entry.type)?.label ?? entry.type}
                  </p>
                  <h2 className="mt-1 font-display text-[15px] font-semibold leading-snug text-ink">{entry.title}</h2>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-canvas px-2 py-1 text-[10.5px] font-semibold text-muted">
                  {entry.visibility === 'household' ? <Users aria-hidden="true" className="h-3 w-3" /> : <Lock aria-hidden="true" className="h-3 w-3" />}
                  {VISIBILITY.find((option) => option.id === entry.visibility)?.label}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{entry.message}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                <span>{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex flex-wrap gap-1">
                  {entry.memberTags.map((id) => (
                    <span key={id} className="rounded-full bg-canvas px-2 py-0.5">
                      {profile.members.find((member) => member.id === id)?.name.split(' ')[0] ?? 'Member'}
                    </span>
                  ))}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
                <button type="button" onClick={() => openEdit(entry)} className="btn-ghost btn-sm">
                  <PencilLine aria-hidden="true" className="h-3 w-3" />
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmDelete(entry)} className="btn-quiet btn-sm">
                  <Trash2 aria-hidden="true" className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 flex items-start gap-2 rounded-control border border-border bg-white px-4 py-3 text-[11.5px] leading-relaxed text-muted">
        <Lock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" />
        Memory Vault entries are stored locally on this device. There is no public sharing, no follower model, and no
        ranking of family members.
      </p>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'edit' ? 'Edit memory' : 'Add a memory'}
        description="Warm, specific, and short is usually enough."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              {editor?.mode === 'edit' ? 'Save changes' : 'Add memory'}
            </Button>
          </>
        }
      >
        {editor ? (
          <div className="space-y-3">
            {error ? (
              <p role="alert" className="rounded-control bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
                {error}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Type</span>
                <select
                  className="field"
                  value={draft.type}
                  onChange={(event) => setDraft({ ...draft, type: event.target.value as MemoryEntry['type'] })}
                >
                  {TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Date</span>
                <input
                  type="date"
                  className="field"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <span className="field-label">Title</span>
              <input
                className="field"
                maxLength={80}
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="For example: Latifa’s science presentation"
              />
            </label>
            <label className="block">
              <span className="field-label">What happened</span>
              <textarea
                className="field min-h-[96px]"
                maxLength={400}
                value={draft.message}
                onChange={(event) => setDraft({ ...draft, message: event.target.value })}
                placeholder="A sentence or two is enough to keep the moment."
              />
              <span className="mt-1 block text-right text-[11px] text-muted">{draft.message.length}/400</span>
            </label>
            <fieldset>
              <legend className="field-label">Members</legend>
              <div className="flex flex-wrap gap-1.5">
                {profile.members.map((member) => {
                  const active = draft.memberTags.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          memberTags: active
                            ? draft.memberTags.filter((id) => id !== member.id)
                            : [...draft.memberTags, member.id],
                        })
                      }
                      className="chip"
                    >
                      {active ? <Check aria-hidden="true" className="h-3 w-3" /> : null}
                      {member.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="field-label">Who can see this</legend>
              <div className="space-y-2">
                {VISIBILITY.map((option) => (
                  <label key={option.id} className="flex items-start gap-2.5 rounded-control border border-border px-3 py-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={draft.visibility === option.id}
                      onChange={() => setDraft({ ...draft, visibility: option.id })}
                      className="mt-0.5 h-4 w-4 border-border text-royal focus:ring-insight"
                    />
                    <span>
                      <span className="block text-[12.5px] font-medium text-ink">{option.label}</span>
                      <span className="block text-[11px] text-muted">{option.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this memory?"
        description="This cannot be undone, and the entry is removed from this device."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
              Keep memory
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (!confirmDelete) return;
                deleteMemory(confirmDelete.id);
                pushToast('Memory deleted.', 'info');
                setConfirmDelete(null);
              }}
            >
              Delete memory
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink">“{confirmDelete?.title}”</p>
      </Modal>
    </div>
  );
}
