// VOE TODO APP
const $ = (s) => document.querySelector(s);
const taskInput = $('#taskInput');
const addBtn = $('#addBtn');
const taskListEl = $('#taskList');
const emptyState = $('#emptyState');
const priorityGroup = $('#priorityGroup');
const categoryInput = $('#categoryInput');
const dueDateInput = $('#dueDateInput');
const searchInput = $('#searchInput');
const filterTabs = $('#filterTabs');
const sortSelect = $('#sortSelect');
const clearCompletedBtn = $('#clearCompleted');
const themeToggle = $('#themeToggle');

// Stats
const totalTasksEl = $('#totalTasks');
const activeTasksEl = $('#activeTasks');
const completedTasksEl = $('#completedTasks');
const progressRing = $('#progressRing');
const progressPercent = $('#progressPercent');
const taskCounter = $('#taskCounter');
const toastEl = $('#toast');

let state = {
  tasks: [],
  filter: 'all',
  search: '',
  sort: 'newest',
  priority: 'low',
  theme: localStorage.getItem('voe-theme') || 'dark'
};

const STORAGE_KEY = 'voe-tasks-v2';

// Load
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.tasks = JSON.parse(raw);
  } catch {}
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('voe-theme', theme);
}

setTheme(state.theme);

// Helpers
function uid() { return Math.random().toString(36).slice(2,9) }
function todayStr() { return new Date().toISOString().split('T')[0] }
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), 2200);
}

// Create task
function createTask(text) {
  if (!text.trim()) return;
  const task = {
    id: uid(),
    text: text.trim(),
    completed: false,
    priority: state.priority,
    category: categoryInput.value,
    dueDate: dueDateInput.value || null,
    createdAt: Date.now(),
    order: Date.now()
  };
  state.tasks.unshift(task);
  save();
  render();
  taskInput.value = '';
  dueDateInput.value = '';
  showToast('Task added');
}

// Priority select
priorityGroup.addEventListener('click', (e)=>{
  if (!e.target.classList.contains('pill')) return;
  [...priorityGroup.children].forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  state.priority = e.target.dataset.priority;
});

// Add events
function handleAdd() { createTask(taskInput.value); }
addBtn.addEventListener('click', handleAdd);
taskInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') handleAdd();
});

function getFiltered() {
  let tasks = [...state.tasks];
  // search
  if (state.search) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t => t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }
  // filter
  if (state.filter === 'active') tasks = tasks.filter(t=>!t.completed);
  if (state.filter === 'completed') tasks = tasks.filter(t=>t.completed);

  // sort
  switch(state.sort) {
    case 'oldest': tasks.sort((a,b)=>a.createdAt-b.createdAt); break;
    case 'newest': tasks.sort((a,b)=>b.createdAt-a.createdAt); break;
    case 'priority': {
      const order = { high:3, medium:2, low:1 };
      tasks.sort((a,b)=>order[b.priority]-order[a.priority]);
      break;
    }
    case 'due': tasks.sort((a,b)=>{
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate)-new Date(b.dueDate);
    }); break;
    case 'alpha': tasks.sort((a,b)=>a.text.localeCompare(b.text)); break;
    default: tasks.sort((a,b)=>a.order-b.order);
  }
  return tasks;
}

function formatDue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const due = new Date(dateStr); due.setHours(0,0,0,0);
  if (due.getTime() === today.getTime()) return { label:'Today', cls:'today' };
  if (due < today) return { label:'Overdue', cls:'overdue' };
  if (due.getTime() === tomorrow.getTime()) return { label:'Tomorrow', cls:'' };
  return { label: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), cls:'' };
}

function render() {
  const tasks = getFiltered();
  taskListEl.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.add('show');
  } else {
    emptyState.classList.remove('show');
    tasks.forEach(task => {
      const el = document.createElement('div');
      el.className = `task ${task.completed?'completed':''}`;
      el.draggable = true;
      el.dataset.id = task.id;

      const due = formatDue(task.dueDate);

      el.innerHTML = `
        <button class="task-check" aria-label="Toggle complete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>
        </button>
        <div class="task-main">
          <div class="task-text">${escapeHtml(task.text)}</div>
          <div class="task-meta">
            <span class="badge badge-priority ${task.priority}">${task.priority}</span>
            <span class="badge badge-cat">${task.category}</span>
            ${due ? `<span class="badge badge-date ${due.cls}">${due.label} ${task.dueDate ? '• '+task.dueDate : ''}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="action-btn edit" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="action-btn delete" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      `;

      // Toggle
      el.querySelector('.task-check').addEventListener('click', ()=>{
        task.completed = !task.completed;
        save(); render(); updateStats();
        showToast(task.completed ? 'Completed ✓' : 'Marked active');
      });

      // Delete
      el.querySelector('.delete').addEventListener('click', ()=>{
        el.style.transform = 'translateX(40px) scale(.96)'; el.style.opacity='0';
        setTimeout(()=>{
          state.tasks = state.tasks.filter(t=>t.id!==task.id);
          save(); render(); updateStats();
          showToast('Task deleted');
        },200);
      });

      // Edit
      const textEl = el.querySelector('.task-text');
      const editFn = () => {
        if (textEl.classList.contains('editing')) return;
        textEl.classList.add('editing');
        textEl.contentEditable = true;
        textEl.focus();
        // place cursor at end
        const range = document.createRange(); const sel = window.getSelection();
        range.selectNodeContents(textEl); range.collapse(false); sel.removeAllRanges(); sel.addRange(range);

        const saveEdit = () => {
          const newText = textEl.textContent.trim();
          if (newText && newText !== task.text) {
            task.text = newText;
            save();
            showToast('Task updated');
          } else if (!newText) {
            textEl.textContent = task.text;
          }
          textEl.contentEditable = false;
          textEl.classList.remove('editing');
          render();
        };
        textEl.addEventListener('blur', saveEdit, {once:true});
        textEl.addEventListener('keydown', (e)=>{
          if (e.key==='Enter') { e.preventDefault(); textEl.blur(); }
          if (e.key==='Escape') { textEl.textContent=task.text; textEl.blur(); }
        });
      };
      el.querySelector('.edit').addEventListener('click', editFn);
      textEl.addEventListener('dblclick', editFn);

      // drag
      el.addEventListener('dragstart', (e)=>{
        el.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
      });
      el.addEventListener('dragend', ()=> el.classList.remove('dragging'));

      taskListEl.appendChild(el);
    });
  }
  updateStats();
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function updateStats(){
  const total = state.tasks.length;
  const completed = state.tasks.filter(t=>t.completed).length;
  const active = total-completed;
  totalTasksEl.textContent = total;
  activeTasksEl.textContent = active;
  completedTasksEl.textContent = completed;
  taskCounter.textContent = `${active} task${active!==1?'s':''} left`;

  const pct = total ? Math.round(completed/total*100) : 0;
  progressPercent.textContent = pct+'%';
  const circ = 2*Math.PI*18;
  const offset = circ - (pct/100)*circ;
  progressRing.style.strokeDashoffset = offset;
}

// drag & drop reorder
taskListEl.addEventListener('dragover', (e)=>{
  e.preventDefault();
  const dragging = $('.task.dragging');
  if (!dragging) return;
  const after = getDragAfterElement(e.clientY);
  if (!after) taskListEl.appendChild(dragging);
  else taskListEl.insertBefore(dragging, after);
});

function getDragAfterElement(y){
  const els = [...taskListEl.querySelectorAll('.task:not(.dragging)')];
  return els.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

taskListEl.addEventListener('drop', (e)=>{
  e.preventDefault();
  const ids = [...taskListEl.children].map(el=>el.dataset.id);
  // reorder state.tasks to match DOM order + preserve unordered others? Simple: assign order
  ids.forEach((id,i)=>{
    const t = state.tasks.find(x=>x.id===id);
    if (t) t.order = i;
  });
  state.tasks.sort((a,b)=>a.order-b.order);
  save();
  // Re-render to re-apply sort? But for newest sort drag shouldn't apply; still keep order as custom
  if (state.sort === 'newest' || state.sort === 'oldest') {
    state.sort = 'custom';
    sortSelect.value = 'newest'; // keep UI but internal
  }
});

// search
let searchTimeout;
searchInput.addEventListener('input', (e)=>{
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(()=>{
    state.search = e.target.value;
    render();
  },150);
});

// filter tabs
filterTabs.addEventListener('click', (e)=>{
  if (!e.target.classList.contains('tab')) return;
  [...filterTabs.children].forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  state.filter = e.target.dataset.filter;
  render();
});

// sort
sortSelect.addEventListener('change', (e)=>{
  state.sort = e.target.value;
  render();
});

// clear completed
clearCompletedBtn.addEventListener('click', ()=>{
  const hasCompleted = state.tasks.some(t=>t.completed);
  if (!hasCompleted) { showToast('Nothing to clear'); return; }
  state.tasks = state.tasks.filter(t=>!t.completed);
  save(); render();
  showToast('Completed cleared');
});

// theme
themeToggle.addEventListener('click', ()=>{
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
});

// keyboard shortcuts
document.addEventListener('keydown', (e)=>{
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k') {
    e.preventDefault(); searchInput.focus();
  }
  if (e.key === '/' && document.activeElement !== taskInput && document.activeElement !== searchInput) {
    e.preventDefault(); taskInput.focus();
  }
});

// Init
dueDateInput.min = todayStr();
load();
// Migrate old storage if exists, seed demo if empty
if (state.tasks.length===0) {
  const demo = [
    { id: uid(), text: 'Design VOE landing page', completed:false, priority:'high', category:'work', dueDate: todayStr(), createdAt: Date.now()-100000, order:0 },
    { id: uid(), text: 'Buy groceries & plan meals', completed:false, priority:'medium', category:'shopping', dueDate:null, createdAt: Date.now()-200000, order:1 },
    { id: uid(), text: 'Read 20 pages - Deep Work', completed:true, priority:'low', category:'study', dueDate:null, createdAt: Date.now()-300000, order:2 },
  ];
  state.tasks = demo; save();
}
render();
updateStats();

// PWA-ish: register focus state
taskInput.focus();
