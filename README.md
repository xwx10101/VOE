# VOE — To Do List App

A modern, fast, beautiful to-do list app built with vanilla JS.

### ✨ Features
- ➕ Add / ✏️ Edit (double-click) / 🗑️ Delete / ✅ Complete
- 🎯 Priority (Low/Med/High) with colors
- 🗂️ Categories: Personal, Work, Study, Shopping, Health
- 📅 Due dates with Today / Overdue detection
- 🔍 Live search + Filters (All/Active/Done) + Sort (Newest, Oldest, Priority, Due, A-Z)
- 📊 Stats: total/active/done + progress ring
- 🖱️ Drag & drop reordering
- 💾 LocalStorage persistence
- 🌓 Dark / Light theme
- ⌨️ Shortcuts: `/` to add, `Cmd+K` to search, `Enter` to save
- 📱 Fully responsive + animations + toast feedback
- 🎨 Glassmorphism + orbs + modern typography (Space Grotesk + Inter)

### 🚀 Run
Just open `index.html` in a browser. No build step.

Or serve:
```bash
python -m http.server 8000
# open http://localhost:8000
```

### 📁 Structure
```
VOE/
├── index.html
├── style.css
├── app.js
└── README.md
```

### 🔧 Customization
- Edit categories in `index.html` select
- Colors in `:root` CSS variables
- Storage key: `voe-tasks-v2`

Built for focus. Flow. Done.
