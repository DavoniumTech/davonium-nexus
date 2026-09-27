import '../css/styles.css';
import { getSession, signIn, signUp, signOut } from './services/auth.js';
import { createWorkspaceWithOwner, getMyWorkspaces } from './services/workspace.js';
import { isSupabaseConfigured, supabase } from './services/supabase.js';
import {
  getFinancialEntries,
  createFinancialEntry,
  deleteFinancialEntry
} from './services/finance.js';
import logo from '../assets/brand/davonium-d-icon.png';

const ACCENTS = [
  'violet','blue','cyan','teal','green','lime','amber','orange',
  'red','rose','pink','fuchsia','purple','indigo','sky','emerald',
  'yellow','slate','coral','aqua'
];

const ACCENT_LABELS = {
  violet:'Violet',
  blue:'Blue',
  cyan:'Cyan',
  teal:'Teal',
  green:'Green',
  lime:'Lime',
  amber:'Amber',
  orange:'Orange',
  red:'Red',
  rose:'Rose',
  pink:'Pink',
  fuchsia:'Fuchsia',
  purple:'Purple',
  indigo:'Indigo',
  sky:'Sky',
  emerald:'Emerald',
  yellow:'Yellow',
  slate:'Slate',
  coral:'Coral',
  aqua:'Aqua'
};

const DEFAULT_DATA = {
  content: [],
  ideas: [],
  tasks: [],
  goals: [],
  projects: [],
  clients: [],
  notes: [],
  transactions: [],
  expenses: [],
  links: [],
  activity: []
};

const state = {
  session: null,
  themeMode: localStorage.getItem('nexus-theme-mode') || 'light',
  accent: localStorage.getItem('nexus-accent') || 'violet',
  page: localStorage.getItem('nexus-page') || 'dashboard',
  workspaces: [],
  activeWorkspace: null,
  data: loadData()
};

function loadData() {
  try {
    return {
      ...DEFAULT_DATA,
      ...JSON.parse(localStorage.getItem('nexus-data') || '{}')
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData() {
  localStorage.setItem('nexus-data', JSON.stringify(state.data));
}

function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function esc(v = '') {
  return String(v).replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );
}

function money(n) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);
}

function initials(email = 'D') {
  return (
    email
      .split('@')[0]
      .replace(/[^a-z0-9]/gi, '')[0] || 'D'
  ).toUpperCase();
}

function log(type, detail) {
  state.data.activity.unshift({
    id: uid(),
    type,
    detail,
    at: new Date().toISOString()
  });

  state.data.activity = state.data.activity.slice(0, 80);
  saveData();
}

function effectiveTheme() {
  if (state.themeMode === 'system') {
    return matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  return state.themeMode;
}

function applyTheme() {
  document.documentElement.dataset.theme = effectiveTheme();
  document.documentElement.dataset.accent = state.accent;

  document
    .querySelector('#theme-toggle')
    ?.setAttribute(
      'title',
      `Theme: ${state.themeMode}`
    );
}

applyTheme();

const app = document.querySelector('#app');

app.innerHTML = `
<div class="shell">

  <aside class="sidebar" id="sidebar">

    <div class="brand">
      <img src="${logo}" alt="Davonium"/>
      <div>
        <strong>DAVONIUM</strong>
        <span>NEXUS CONTROL</span>
      </div>
    </div>

    <div class="workspace-switch">
      <span class="status-dot"></span>

      <div>
        <small>PRIVATE CONTROL CENTER</small>
        <strong id="workspace-name">Personal Nexus</strong>
      </div>

      <button
        class="workspace-more"
        data-action="new-workspace"
      >•••</button>
    </div>

    <nav class="nav" id="nav">

      <div class="nav-label">CONTROL</div>

      <button data-page="dashboard" class="nav-item">
        ⌂<span>Overview</span>
      </button>

      <button data-page="command" class="nav-item">
        ✦<span>Command Center</span>
      </button>

      <button data-page="search" class="nav-item">
        ⌕<span>Global Search</span>
      </button>

      <div class="nav-label">CONTENT</div>

      <button data-page="content" class="nav-item">
        ▤<span>All Content</span>
      </button>

      <button data-page="ideas" class="nav-item">
        ✧<span>Ideas</span>
      </button>

      <button data-page="drafts" class="nav-item">
        ◌<span>Drafts</span>
      </button>

      <button data-page="published" class="nav-item">
        ✓<span>Published</span>
      </button>

      <button data-page="calendar" class="nav-item">
        ▦<span>Content Calendar</span>
      </button>

      <div class="nav-label">PLANNING</div>

      <button data-page="planner" class="nav-item">
        ◷<span>Planner</span>
      </button>

      <button data-page="tasks" class="nav-item">
        ☑<span>Tasks</span>
      </button>

      <button data-page="goals" class="nav-item">
        ◎<span>Goals</span>
      </button>

      <button data-page="schedule" class="nav-item">
        ◫<span>Schedule</span>
      </button>

      <div class="nav-label">PROJECTS</div>

      <button data-page="projects" class="nav-item">
        ▦<span>Projects</span>
      </button>

      <button data-page="clients" class="nav-item">
        ◇<span>Clients</span>
      </button>

      <div class="nav-label">FINANCE</div>

      <button data-page="revenue" class="nav-item">
        ◈<span>Revenue</span>
      </button>

      <button data-page="transactions" class="nav-item">
        ₦<span>Transactions</span>
      </button>

      <button data-page="expenses" class="nav-item">
        −<span>Expenses</span>
      </button>

      <button data-page="reports" class="nav-item">
        ▥<span>Financial Reports</span>
      </button>

      <div class="nav-label">PERSONAL</div>

      <button data-page="notes" class="nav-item">
        ▤<span>Notes</span>
      </button>

      <button data-page="links" class="nav-item">
        ↗<span>Links & Contact</span>
      </button>

      <button data-page="files" class="nav-item">
        □<span>Resources</span>
      </button>

      <button data-page="activity" class="nav-item">
        ⌁<span>Activity</span>
      </button>

      <div class="nav-label">SYSTEM</div>

      <button data-page="profile" class="nav-item">
        ◉<span>My Profile</span>
      </button>

      <button data-page="notifications" class="nav-item">
        ◍<span>Notifications</span>
      </button>

      <button data-page="settings" class="nav-item">
        ⚙<span>Settings</span>
      </button>

    </nav>

    <div class="sidebar-bottom">

      <div class="security-note">
        ⌁
        <span>
          ${isSupabaseConfigured ? 'Supabase connected' : 'Local mode'}
        </span>
      </div>

      <button id="signout" class="text-button">
        Sign out
      </button>

    </div>

  </aside>

  <main class="main">

    <header class="topbar">

      <button class="icon-button" id="mobile-menu">
        ☰
      </button>

      <div>
        <small class="eyebrow">
          DAVONIUM / NEXUS CONTROL
        </small>

        <h1 id="page-title">
          Overview
        </h1>
      </div>

      <div class="top-actions">

        <button class="icon-button" id="theme-toggle">
          ☼
        </button>

        <button class="avatar" id="avatar">
          D
        </button>

      </div>

    </header>

    <div id="notice" class="notice hidden"></div>

    <section id="view" class="view"></section>

  </main>

</div>

<div id="modal-layer" class="modal-layer hidden"></div>
`;

const view = document.querySelector('#view');
const notice = document.querySelector('#notice');
const modal = document.querySelector('#modal-layer');

function noticeMsg(msg, type = 'info') {
  notice.textContent = msg;
  notice.className = `notice ${type}`;

  setTimeout(() => {
    notice.classList.add('hidden');
  }, 3500);
}

function setThemeMode(mode) {
  state.themeMode = mode;
  localStorage.setItem('nexus-theme-mode', mode);
  applyTheme();
  render();
}

function setAccent(accent) {
  state.accent = accent;
  localStorage.setItem('nexus-accent', accent);
  applyTheme();
  render();
}

function setWorkspace(w) {
  state.activeWorkspace = w || null;

  document.querySelector('#workspace-name').textContent =
    w?.name || 'Personal Nexus';
}

async function loadWorkspaces() {
  if (!state.session?.user?.id || !isSupabaseConfigured) {
    setWorkspace(null);
    return;
  }

  state.workspaces = await getMyWorkspaces(
    state.session.user.id
  );

  const saved = localStorage.getItem(
    'nexus-active-workspace-id'
  );

  const selected =
    state.workspaces.find(w => w.id === saved) ||
    state.workspaces[0] ||
    null;

  if (selected) {
    localStorage.setItem(
      'nexus-active-workspace-id',
      selected.id
    );
  }

  setWorkspace(selected);
}

/* ============================================================
   SUPABASE FINANCE
   ============================================================ */






function localFinanceEntries() {
  return [
    ...state.data.transactions.map(item => ({
      ...item,
      entry_type: 'revenue'
    })),
    ...state.data.expenses.map(item => ({
      ...item,
      entry_type: 'expense'
    }))
  ];
}

async function migrateLocalFinanceIfNeeded() {
  if (!state.session?.user?.id || !isSupabaseConfigured) {
    return;
  }

  const existingServerRows =
    await getFinancialEntries(state.session.user.id);

  /*
   * If Supabase already has financial records,
   * Supabase remains the source of truth.
   */
  if (existingServerRows.length > 0) {
    return;
  }

  const localEntries = localFinanceEntries();

  if (!localEntries.length) {
    return;
  }

  /*
   * Preserve existing browser finance records by moving them
   * into Supabase when the server table is completely empty.
   */
  for (const item of localEntries) {
    await supabase
      .from('nexus_financial_entries')
      .insert({
        user_id: state.session.user.id,
        entry_type: item.entry_type,
        title: item.title || 'Untitled',
        amount: Number(item.amount) || 0,
        body: item.body || '',
        entry_date: item.date || null
      });
  }
}

async function loadFinanceData() {
  if (!state.session?.user?.id || !isSupabaseConfigured) {
    return;
  }

  await migrateLocalFinanceIfNeeded();

  const rows =
    await getFinancialEntries(state.session.user.id);

  state.data.transactions = rows
    .filter(row => row.entry_type === 'revenue')
    .map(row => ({
      id: row.id,
      title: row.title,
      body: row.body || '',
      amount: Number(row.amount) || 0,
      date: row.entry_date || '',
      createdAt: row.created_at,
      status: 'open'
    }));

  state.data.expenses = rows
    .filter(row => row.entry_type === 'expense')
    .map(row => ({
      id: row.id,
      title: row.title,
      body: row.body || '',
      amount: Number(row.amount) || 0,
      date: row.entry_date || '',
      createdAt: row.created_at,
      status: 'open'
    }));

  saveData();
}

/* ============================================================
   PAGE DEFINITIONS
   ============================================================ */

const titles = {
  dashboard:'Overview',
  command:'Command Center',
  search:'Global Search',
  content:'All Content',
  ideas:'Ideas',
  drafts:'Drafts',
  published:'Published',
  calendar:'Content Calendar',
  planner:'Planner',
  tasks:'Tasks',
  goals:'Goals',
  schedule:'Schedule',
  projects:'Projects',
  clients:'Clients',
  revenue:'Revenue',
  transactions:'Transactions',
  expenses:'Expenses',
  reports:'Financial Reports',
  notes:'Notes',
  links:'Links & Contact',
  files:'Resources',
  activity:'Activity',
  profile:'My Profile',
  notifications:'Notifications',
  settings:'Settings'
};

const icons = {
  content:'▤',
  ideas:'✧',
  drafts:'◌',
  published:'✓',
  tasks:'☑',
  goals:'◎',
  projects:'▦',
  clients:'◇',
  notes:'▤',
  transactions:'₦',
  expenses:'−',
  links:'↗'
};

function emptyState(
  title,
  desc,
  action,
  label
) {
  return `
    <div class="empty-state panel">

      <div class="empty-icon">
        ${icons[action] || '✦'}
      </div>

      <h3>${title}</h3>

      <p>${desc}</p>

      ${
        action
          ? `
            <button
              class="primary"
              data-action="add"
              data-kind="${action}"
            >
              ${label || 'Create new'}
            </button>
          `
          : ''
      }

    </div>
  `;
}

/* ============================================================
   FORM MODAL
   ============================================================ */

function formModal(kind) {

  const labels = {
    content:['Content','Title','Body'],
    idea:['Idea','Idea title','What are you thinking?'],
    task:['Task','Task','What needs to be done?'],
    goal:['Goal','Goal','Target or outcome'],
    project:['Project','Project name','Describe the project'],
    client:['Client','Client name','Email, phone or notes'],
    note:['Note','Note title','Write your note'],
    transaction:['Transaction','Description','Amount'],
    expense:['Expense','Description','Amount'],
    link:['Link','Link title','https://example.com']
  };

  const x = labels[kind] || labels.note;

  const isFinance =
    kind === 'transaction' ||
    kind === 'expense';

  modal.classList.remove('hidden');

  modal.innerHTML = `
    <div class="modal">

      <button
        class="modal-close"
        data-close
      >
        ×
      </button>

      <span class="pill">
        NEW ${x[0].toUpperCase()}
      </span>

      <h2>
        Create ${x[0]}
      </h2>

      <form id="data-form">

        <label>
          ${x[1]}

          <input
            name="title"
            required
            placeholder="${x[1]}"
          />
        </label>

        ${
          isFinance
            ? `
              <label>
                Amount (₦)

                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="5000"
                />
              </label>

              <label>
                Details

                <textarea
                  name="body"
                  rows="3"
                  placeholder="Optional details"
                ></textarea>
              </label>

              <label>
                Date

                <input
                  name="date"
                  type="date"
                />
              </label>
            `
            : `
              <label>
                Details

                <textarea
                  name="body"
                  rows="5"
                  placeholder="${x[2]}"
                ></textarea>
              </label>
            `
        }

        ${
          !isFinance &&
          ['content','task','goal','project'].includes(kind)
            ? `
              <label>
                Date

                <input
                  name="date"
                  type="date"
                />
              </label>
            `
            : ''
        }

        ${
          kind === 'link'
            ? `
              <label>
                URL

                <input
                  name="url"
                  type="url"
                  placeholder="https://example.com"
                />
              </label>
            `
            : ''
        }

        <button
          class="primary"
          type="submit"
        >
          Save ${x[0]}
        </button>

        <div
          id="modal-status"
          class="form-status"
        ></div>

      </form>

    </div>
  `;

  document
    .querySelector('#data-form')
    .addEventListener('submit', async e => {

      e.preventDefault();

      const f = new FormData(e.target);

      const status =
        document.querySelector('#modal-status');

      const title =
        String(f.get('title') || '').trim();

      const body =
        String(f.get('body') || '').trim();

      const date =
        f.get('date') || '';

      const url =
        String(f.get('url') || '').trim();

      /* --------------------------------------------------------
         FINANCE
         -------------------------------------------------------- */

      if (isFinance) {

        if (!state.session?.user?.id) {
          status.textContent =
            'Please sign in before saving financial records.';
          return;
        }

        if (!isSupabaseConfigured) {
          status.textContent =
            'Supabase is not configured.';
          return;
        }

        const amount =
          Number(f.get('amount')) || 0;

        if (amount <= 0) {
          status.textContent =
            'Enter an amount greater than zero.';
          return;
        }

        status.textContent =
          'Saving to Supabase…';

        try {

          const saved =
            await createFinancialEntry(
              state.session.user.id,
              {
                entry_type:
                  kind === 'transaction'
                    ? 'revenue'
                    : 'expense',

                title,

                amount,

                body,

                entry_date:
                  date || null
              }
            );

          const item = {
            id: saved.id,
            title: saved.title,
            body: saved.body || '',
            amount: Number(saved.amount) || 0,
            date: saved.entry_date || '',
            createdAt: saved.created_at,
            status: 'open'
          };

          if (kind === 'transaction') {
            state.data.transactions.unshift(item);
          } else {
            state.data.expenses.unshift(item);
          }

          saveData();

          log(
            kind === 'transaction'
              ? 'Created Revenue'
              : 'Created Expense',
            title
          );

          modal.classList.add('hidden');

          noticeMsg(
            kind === 'transaction'
              ? 'Revenue saved to Supabase.'
              : 'Expense saved to Supabase.',
            'success'
          );

          render();

        } catch (err) {

          console.error(
            'Finance save error:',
            err
          );

          status.textContent =
            err.message ||
            'Unable to save financial record.';
        }

        return;
      }

      /* --------------------------------------------------------
         NORMAL LOCAL NEXUS DATA
         -------------------------------------------------------- */

      const item = {
        id: uid(),
        title,
        body,
        date,
        createdAt: new Date().toISOString(),
        amount: 0,
        status:
          kind === 'content'
            ? 'draft'
            : 'open',
        url
      };

      const target = {
        content:'content',
        idea:'ideas',
        task:'tasks',
        goal:'goals',
        project:'projects',
        client:'clients',
        note:'notes',
        link:'links'
      }[kind];

      state.data[target].unshift(item);

      saveData();

      log(
        `Created ${x[0]}`,
        item.title
      );

      modal.classList.add('hidden');

      noticeMsg(
        `${x[0]} created successfully.`,
        'success'
      );

      render();
    });
}

function closeModal() {
  modal.classList.add('hidden');
}

function renderList(
  kind,
  title,
  desc,
  overrideItems = null
) {

  const items =
    overrideItems || state.data[kind];

  const label =
    kind === 'content'
      ? 'content'
      : kind.slice(0, -1);

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          NEXUS MODULE
        </span>

        <h2>${title}</h2>

        <p>${desc}</p>

      </div>

      <button
        class="primary"
        data-action="add"
        data-kind="${label}"
      >
        + Add ${label}
      </button>

    </div>

    ${
      items.length
        ? `
          <div class="card-list">

            ${items.map(i => `
              <article class="panel list-card">

                <div class="list-icon">
                  ${icons[kind] || '✦'}
                </div>

                <div class="list-main">

                  <div class="list-top">

                    <h3>
                      ${esc(i.title || 'Untitled')}
                    </h3>

                    <span>
                      ${
                        i.date ||
                        new Date(
                          i.createdAt
                        ).toLocaleDateString()
                      }
                    </span>

                  </div>

                  <p>
                    ${esc(
                      i.body ||
                      i.url ||
                      'No details yet.'
                    )}
                  </p>

                  ${
                    i.url
                      ? `
                        <a
                          href="${esc(i.url)}"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open link ↗
                        </a>
                      `
                      : ''
                  }

                </div>

                <button
                  class="delete-btn"
                  data-delete="${kind}"
                  data-id="${i.id}"
                >
                  ×
                </button>

              </article>
            `).join('')}

          </div>
        `
        : emptyState(
            `No ${title.toLowerCase()} yet`,
            desc,
            label,
            `Add ${label}`
          )
    }
  `;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function dashboard() {

  const rev =
    state.data.transactions.reduce(
      (a, x) =>
        a + (Number(x.amount) || 0),
      0
    );

  const exp =
    state.data.expenses.reduce(
      (a, x) =>
        a + (Number(x.amount) || 0),
      0
    );

  return `
    <div class="hero-card">

      <div>

        <span class="pill">
          PRIVATE DAVONIUM CONTROL CENTER
        </span>

        <h2>
          Build clearly.<br/>
          <em>Operate confidently.</em>
        </h2>

        <p>
          A private command center for your ideas,
          content, projects, plans and financial visibility.
        </p>

        <div class="hero-actions">

          <button
            class="primary"
            data-action="add"
            data-kind="content"
          >
            + New content
          </button>

          <button
            class="secondary"
            data-page-jump="command"
          >
            Open command center
          </button>

        </div>

      </div>

      <div class="orbital">

        <div class="orbit orbit-a"></div>
        <div class="orbit orbit-b"></div>

        <img
          src="${logo}"
          alt="Davonium icon"
        />

      </div>

    </div>

    <div class="metrics">

      <article>
        <span>CONTENT</span>
        <strong>${state.data.content.length}</strong>
        <small>
          Ideas, drafts and published work
        </small>
      </article>

      <article>
        <span>PROJECTS</span>
        <strong>${state.data.projects.length}</strong>
        <small>
          Your active initiatives
        </small>
      </article>

      <article>
        <span>NET REVENUE</span>
        <strong>${money(rev - exp)}</strong>
        <small>
          Supabase financial records
        </small>
      </article>

      <article>
        <span>TASKS</span>
        <strong>
          ${
            state.data.tasks.filter(
              x => x.status !== 'done'
            ).length
          }
        </strong>
        <small>
          Open actions
        </small>
      </article>

    </div>

    <div class="dashboard-grid">

      <article class="panel">

        <div class="panel-heading">

          <div>
            <span class="kicker">
              QUICK ACTIONS
            </span>

            <h3>Move faster</h3>
          </div>

        </div>

        <div class="quick-grid">

          <button
            data-action="add"
            data-kind="idea"
          >
            ✧ Idea
          </button>

          <button
            data-action="add"
            data-kind="task"
          >
            ☑ Task
          </button>

          <button
            data-action="add"
            data-kind="note"
          >
            ▤ Note
          </button>

          <button
            data-action="add"
            data-kind="project"
          >
            ▦ Project
          </button>

        </div>

      </article>

      <article class="panel">

        <div class="panel-heading">

          <div>
            <span class="kicker">
              SYSTEM
            </span>

            <h3>Connection health</h3>
          </div>

          <span class="status-badge good">
            READY
          </span>

        </div>

        <ul class="status-list">

          <li>
            <span>Supabase</span>
            <b>
              ${
                isSupabaseConfigured
                  ? 'Connected'
                  : 'Not configured'
              }
            </b>
          </li>

          <li>
            <span>Authentication</span>
            <b>
              ${
                state.session
                  ? 'Signed in'
                  : 'Signed out'
              }
            </b>
          </li>

          <li>
            <span>Private workspace</span>
            <b>
              ${
                state.activeWorkspace
                  ? 'Connected'
                  : 'Local profile'
              }
            </b>
          </li>

          <li>
            <span>Theme</span>
            <b>${state.themeMode}</b>
          </li>

        </ul>

      </article>

    </div>
  `;
}

/* ============================================================
   COMMAND CENTER
   ============================================================ */

function command() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          COMMAND CENTER
        </span>

        <h2>
          Everything at a glance.
        </h2>

        <p>
          One private place to create, plan,
          review and move your work forward.
        </p>

      </div>

    </div>

    <div class="command-grid">

      ${
        [
          ['content','Content','Create and manage your work.'],
          ['planner','Planner','Organize dates and priorities.'],
          ['projects','Projects','Track your products and client work.'],
          ['revenue','Revenue','See money in, out and net position.'],
          ['notes','Notes','Capture useful information.'],
          ['settings','Settings','Control appearance and account.']
        ]
        .map(
          ([p,t,d]) => `
            <button
              class="command-card"
              data-page-jump="${p}"
            >

              <span>
                ${icons[p] || '✦'}
              </span>

              <h3>${t}</h3>

              <p>${d}</p>

              <b>Open →</b>

            </button>
          `
        )
        .join('')
      }

    </div>
  `;
}

/* ============================================================
   SEARCH
   ============================================================ */

function searchPage() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          GLOBAL SEARCH
        </span>

        <h2>
          Find anything.
        </h2>

        <p>
          Search your private Nexus data stored on this device.
        </p>

      </div>

    </div>

    <div class="search-box">

      <input
        id="global-search"
        placeholder="Search content, projects, notes, tasks…"
        
      />

    </div>

    <div
      id="search-results"
      class="card-list"
    ></div>
  `;
}

function renderSearch() {

  const q =
    (
      document.querySelector(
        '#global-search'
      )?.value || ''
    ).toLowerCase();

  const groups =
    Object.entries(state.data)
      .filter(([k]) => k !== 'activity');

  const results =
    groups
      .flatMap(
        ([k, arr]) =>
          arr
            .filter(x =>
              `${x.title} ${x.body} ${x.url}`
                .toLowerCase()
                .includes(q)
            )
            .map(x => ({
              ...x,
              kind: k
            }))
      )
      .slice(0, 50);

  document.querySelector(
    '#search-results'
  ).innerHTML =
    results.length
      ? results
          .map(
            x => `
              <article class="panel list-card">

                <div class="list-icon">
                  ✦
                </div>

                <div class="list-main">

                  <div class="list-top">

                    <h3>
                      ${esc(
                        x.title ||
                        'Untitled'
                      )}
                    </h3>

                    <span>
                      ${x.kind}
                    </span>

                  </div>

                  <p>
                    ${esc(
                      x.body ||
                      x.url ||
                      ''
                    )}
                  </p>

                </div>

              </article>
            `
          )
          .join('')
      : `
        <div class="panel empty-state">

          <h3>No matches</h3>

          <p>
            Try another search term.
          </p>

        </div>
      `;
}

/* ============================================================
   SETTINGS
   ============================================================ */

function settings() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          PREFERENCES
        </span>

        <h2>
          Make Nexus yours.
        </h2>

        <p>
          Light mode is the default.
          System mode follows your operating system.
          Choose an accent and it will be applied across
          text, buttons, cards, controls and highlights.
        </p>

      </div>

    </div>

    <div class="settings-grid">

      <article class="panel">

        <h3>
          Theme mode
        </h3>

        <p>
          Choose how the entire interface should behave.
        </p>

        <div class="theme-options">

          ${
            ['light','dark','system']
              .map(
                x => `
                  <button
                    data-theme-mode="${x}"
                    class="theme-option ${
                      state.themeMode === x
                        ? 'selected'
                        : ''
                    }"
                  >

                    <b>
                      ${
                        x === 'light'
                          ? '☀'
                          : x === 'dark'
                            ? '☾'
                            : '◐'
                      }

                      ${
                        x[0].toUpperCase() +
                        x.slice(1)
                      }
                    </b>

                    <span>
                      ${
                        x === 'light'
                          ? 'Always light'
                          : x === 'dark'
                            ? 'Always dark'
                            : 'Follow Windows/browser'
                      }
                    </span>

                  </button>
                `
              )
              .join('')
          }

        </div>

      </article>

      <article class="panel">

        <h3>
          Accent palette
        </h3>

        <p>
          Twenty accents. The selected color applies throughout Nexus.
        </p>

        <div class="accent-grid">

          ${
            ACCENTS
              .map(
                a => `
                  <button
                    title="${ACCENT_LABELS[a]}"
                    data-accent="${a}"
                    class="accent-dot ${
                      state.accent === a
                        ? 'selected'
                        : ''
                    }"
                    data-color="${a}"
                  ></button>
                `
              )
              .join('')
          }

        </div>

      </article>

      <article class="panel">

        <h3>
          Account
        </h3>

        <p>
          ${esc(
            state.session?.user?.email ||
            'Not signed in'
          )}
        </p>

        <button
          class="secondary"
          id="settings-signout"
        >
          Sign out
        </button>

      </article>

      <article class="panel">

        <h3>
          Cloud connection
        </h3>

        <p>
          ${
            isSupabaseConfigured
              ? 'Supabase client is configured for authentication and your private workspace.'
              : 'Add your Supabase URL and publishable/anon key to .env.local.'
          }
        </p>

        <span
          class="status-badge ${
            isSupabaseConfigured
              ? 'good'
              : 'warn'
          }"
        >
          ${
            isSupabaseConfigured
              ? 'CONNECTED'
              : 'SETUP NEEDED'
          }
        </span>

      </article>

      <article class="panel">

        <h3>
          Data
        </h3>

        <p>
          Revenue and expenses are now stored in Supabase.
          Other content modules remain stored locally until
          their matching Supabase tables are added.
        </p>

        <button
          class="secondary"
          data-action="clear-data"
        >
          Clear local content
        </button>

      </article>

      <article class="panel">

        <h3>
          PWA & links
        </h3>

        <p>
          Nexus is prepared as a web app.
          Use the browser install option when available.
        </p>

        <div class="link-row">

          <a
            href="mailto:${esc(
              state.session?.user?.email || ''
            )}"
          >
            Open email ↗
          </a>

          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>

        </div>

      </article>

    </div>
  `;
}

/* ============================================================
   REVENUE
   ============================================================ */

function revenue() {

  const rev =
    state.data.transactions.reduce(
      (a,x) =>
        a + (Number(x.amount) || 0),
      0
    );

  const exp =
    state.data.expenses.reduce(
      (a,x) =>
        a + (Number(x.amount) || 0),
      0
    );

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          FINANCE
        </span>

        <h2>
          Revenue
        </h2>

        <p>
          Track money received and your net position.
          Financial records are stored securely in Supabase.
        </p>

      </div>

      <button
        class="primary"
        data-action="add"
        data-kind="transaction"
      >
        + Add revenue
      </button>

    </div>

    <div class="finance-cards">

      <article class="panel">
        <span>Total received</span>
        <strong>${money(rev)}</strong>
      </article>

      <article class="panel">
        <span>Total expenses</span>
        <strong>${money(exp)}</strong>
      </article>

      <article class="panel">
        <span>Net</span>
        <strong>${money(rev - exp)}</strong>
      </article>

    </div>

    ${
      renderList(
        'transactions',
        'Transactions',
        'Individual money-in records.'
      )
      .replace(
        'NEXUS MODULE',
        'REVENUE'
      )
    }
  `;
}

/* ============================================================
   REPORTS
   ============================================================ */

function reports() {

  const rev =
    state.data.transactions.reduce(
      (a,x) =>
        a + (Number(x.amount) || 0),
      0
    );

  const exp =
    state.data.expenses.reduce(
      (a,x) =>
        a + (Number(x.amount) || 0),
      0
    );

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          REPORTS
        </span>

        <h2>
          Financial reports
        </h2>

        <p>
          A current snapshot from your Supabase
          transaction and expense records.
        </p>

      </div>

    </div>

    <div class="report-panel panel">

      <div class="report-row">
        <span>Revenue</span>
        <b>${money(rev)}</b>
      </div>

      <div class="report-row">
        <span>Expenses</span>
        <b>${money(exp)}</b>
      </div>

      <div class="report-row total">
        <span>Net position</span>
        <b>${money(rev - exp)}</b>
      </div>

    </div>
  `;
}

/* ============================================================
   CALENDAR
   ============================================================ */

function calendar() {

  const items =
    [
      ...state.data.content,
      ...state.data.tasks,
      ...state.data.goals
    ]
      .filter(x => x.date)
      .sort(
        (a,b) =>
          a.date.localeCompare(b.date)
      );

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          CALENDAR
        </span>

        <h2>
          Content calendar
        </h2>

        <p>
          Dates from your content, tasks and goals.
        </p>

      </div>

    </div>

    ${
      items.length
        ? `
          <div class="timeline">

            ${
              items
                .map(
                  x => `
                    <article class="panel timeline-item">

                      <time>
                        ${esc(x.date)}
                      </time>

                      <div>

                        <h3>
                          ${esc(x.title)}
                        </h3>

                        <p>
                          ${esc(x.body || '')}
                        </p>

                      </div>

                    </article>
                  `
                )
                .join('')
            }

          </div>
        `
        : emptyState(
            'Your calendar is clear',
            'Add dates to content, tasks or goals to see them here.',
            'content',
            'Add content'
          )
    }
  `;
}

/* ============================================================
   PROFILE
   ============================================================ */

function profile() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          PROFILE
        </span>

        <h2>
          My Profile
        </h2>

        <p>
          Your private Davonium identity and
          control-center information.
        </p>

      </div>

    </div>

    <div class="profile-card panel">

      <div class="big-avatar">
        ${initials(
          state.session?.user?.email
        )}
      </div>

      <div>

        <h3>
          ${
            esc(
              state.session?.user
                ?.user_metadata
                ?.full_name ||
              'Davonium User'
            )
          }
        </h3>

        <p>
          ${esc(
            state.session?.user?.email ||
            'Not signed in'
          )}
        </p>

        <p>
          Workspace:
          <strong>
            ${esc(
              state.activeWorkspace?.name ||
              'Personal Nexus'
            )}
          </strong>
        </p>

      </div>

    </div>
  `;
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

function notifications() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          NOTIFICATIONS
        </span>

        <h2>
          Notifications
        </h2>

        <p>
          Recent events from your private control center.
        </p>

      </div>

    </div>

    ${
      state.data.activity.length
        ? `
          <div class="card-list">

            ${
              state.data.activity
                .slice(0,20)
                .map(
                  x => `
                    <article class="panel list-card">

                      <div class="list-icon">
                        ◍
                      </div>

                      <div class="list-main">

                        <h3>
                          ${esc(x.type)}
                        </h3>

                        <p>
                          ${esc(x.detail)}
                        </p>

                        <span>
                          ${new Date(
                            x.at
                          ).toLocaleString()}
                        </span>

                      </div>

                    </article>
                  `
                )
                .join('')
            }

          </div>
        `
        : emptyState(
            'Nothing new',
            'Your activity notifications will appear here.'
          )
    }
  `;
}

/* ============================================================
   LINKS
   ============================================================ */

function links() {

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          LINKS & CONTACT
        </span>

        <h2>
          Links & Contact
        </h2>

        <p>
          Keep useful URLs and direct email access
          in one private place.
        </p>

      </div>

      <button
        class="primary"
        data-action="add"
        data-kind="link"
      >
        + Add link
      </button>

    </div>

    <div class="contact-panel panel">

      <h3>
        Direct email
      </h3>

      <p>
        ${esc(
          state.session?.user?.email ||
          'Sign in to show your account email.'
        )}
      </p>

      ${
        state.session?.user?.email
          ? `
            <a
              class="primary"
              href="mailto:${esc(
                state.session.user.email
              )}"
            >
              Compose email ↗
            </a>
          `
          : ''
      }

    </div>

    ${
      renderList(
        'links',
        'Saved links',
        'Your private collection of useful URLs.'
      )
      .replace(
        'NEXUS MODULE',
        'LINKS'
      )
    }
  `;
}

/* ============================================================
   PLANNER
   ============================================================ */

function planner() {

  const tasks =
    state.data.tasks.filter(
      x => x.status !== 'done'
    );

  return `
    <div class="page-head">

      <div>

        <span class="pill">
          PLANNING
        </span>

        <h2>
          Planner
        </h2>

        <p>
          Prioritize your next actions and dated work.
        </p>

      </div>

      <button
        class="primary"
        data-action="add"
        data-kind="task"
      >
        + Add task
      </button>

    </div>

    <div class="planner-grid">

      <article class="panel">

        <span class="kicker">
          OPEN TASKS
        </span>

        <strong class="big-number">
          ${tasks.length}
        </strong>

        <p>
          Actions waiting for you.
        </p>

      </article>

      <article class="panel">

        <span class="kicker">
          DATED ITEMS
        </span>

        <strong class="big-number">
          ${
            [
              ...state.data.content,
              ...state.data.goals,
              ...state.data.tasks
            ]
            .filter(x => x.date)
            .length
          }
        </strong>

        <p>
          Items with a planned date.
        </p>

      </article>

    </div>

    ${
      renderList(
        'tasks',
        'Tasks',
        'Your personal action list.'
      )
      .replace(
        'NEXUS MODULE',
        'PLANNER'
      )
    }
  `;
}

/* ============================================================
   GENERIC PAGES
   ============================================================ */

function generic() {

  const map = {

    content:[
      'All Content',
      'Create and manage your content in one place.',
      'content',
      'New content'
    ],

    ideas:[
      'Ideas',
      'Capture ideas before they become work.',
      'idea',
      'New idea'
    ],

    drafts:[
      'Drafts',
      'Content still being shaped.',
      'content',
      'New draft'
    ],

    published:[
      'Published',
      'Content you marked as published.',
      'content',
      'New content'
    ],

    tasks:[
      'Tasks',
      'Personal actions and next steps.',
      'task',
      'New task'
    ],

    goals:[
      'Goals',
      'Longer-term outcomes you want to reach.',
      'goal',
      'New goal'
    ],

    schedule:[
      'Schedule',
      'See dated work in one focused list.',
      'task',
      'New scheduled task'
    ],

    projects:[
      'Projects',
      'Products, client work and internal initiatives.',
      'project',
      'New project'
    ],

    clients:[
      'Clients',
      'Keep relationship details and notes.',
      'client',
      'New client'
    ],

    transactions:[
      'Transactions',
      'Money received records.',
      'transaction',
      'Add revenue'
    ],

    expenses:[
      'Expenses',
      'Money spent on work and operations.',
      'expense',
      'Add expense'
    ],

    notes:[
      'Notes',
      'General private notes and references.',
      'note',
      'New note'
    ],

    files:[
      'Resources',
      'A simple home for your resource links and references.',
      'link',
      'Add resource'
    ],

    activity:[
      'Activity',
      'A private history of actions taken in Nexus.',
      'activity',
      ''
    ]

  };

  const [
    t,
    d,
    k,
    l
  ] = map[state.page];

  let items =
    state.data[
      {
        idea:'ideas',
        task:'tasks',
        goal:'goals',
        project:'projects',
        client:'clients',
        transaction:'transactions',
        expense:'expenses',
        note:'notes',
        link:'links',
        content:'content'
      }[k] || k
    ] || [];

  if (state.page === 'drafts') {
    items =
      state.data.content.filter(
        x => x.status === 'draft'
      );
  }

  if (state.page === 'published') {
    items =
      state.data.content.filter(
        x => x.status === 'published'
      );
  }

  if (state.page === 'schedule') {
    items =
      [
        ...state.data.tasks,
        ...state.data.goals,
        ...state.data.content
      ]
      .filter(x => x.date)
      .sort(
        (a,b) =>
          a.date.localeCompare(b.date)
      );
  }

  if (state.page === 'activity') {
    return notifications();
  }

  return renderList(
    {
      content:'content',
      idea:'ideas',
      task:'tasks',
      goal:'goals',
      project:'projects',
      client:'clients',
      transaction:'transactions',
      expense:'expenses',
      note:'notes',
      link:'links'
    }[k] || k,
    t,
    d,
    items
  )
  .replace(
    `+ Add ${k}`,
    `+ ${l}`
  )
  .replace(
    'NEXUS MODULE',
    'NEXUS MODULE'
  );
}

/* ============================================================
   PAGE ROUTING
   ============================================================ */

function pageHtml() {

  switch (state.page) {

    case 'dashboard':
      return dashboard();

    case 'command':
      return command();

    case 'search':
      return searchPage();

    case 'calendar':
      return calendar();

    case 'planner':
      return planner();

    case 'revenue':
      return revenue();

    case 'reports':
      return reports();

    case 'settings':
      return settings();

    case 'profile':
      return profile();

    case 'notifications':
      return notifications();

    case 'links':
      return links();

    default:
      return generic();
  }
}

/* ============================================================
   RENDER
   ============================================================ */

function render(page = state.page) {

  state.page = page;

  localStorage.setItem(
    'nexus-page',
    page
  );

  document
    .querySelectorAll('.nav-item')
    .forEach(
      b =>
        b.classList.toggle(
          'active',
          b.dataset.page === page
        )
    );

  document.querySelector(
    '#page-title'
  ).textContent =
    titles[page] || 'Overview';

  document.querySelector(
    '#avatar'
  ).textContent =
    initials(
      state.session?.user?.email
    );

  view.innerHTML = pageHtml();

  bind();

  applyTheme();
}

/* ============================================================
   EVENT BINDING
   ============================================================ */

function bind() {

  document
    .querySelectorAll('[data-page-jump]')
    .forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            render(
              b.dataset.pageJump
            )
        )
    );

  document
    .querySelectorAll('[data-action="add"]')
    .forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            formModal(
              b.dataset.kind
            )
        )
    );

  /* ----------------------------------------------------------
     DELETE
     ---------------------------------------------------------- */

  document
    .querySelectorAll('[data-delete]')
    .forEach(
      b =>
        b.addEventListener(
          'click',
          async () => {

            const kind =
              b.dataset.delete;

            const id =
              b.dataset.id;

            /* Finance records live in Supabase */
            if (
              kind === 'transactions' ||
              kind === 'expenses'
            ) {

              if (!state.session?.user?.id) {
                noticeMsg(
                  'Please sign in to delete financial records.',
                  'error'
                );
                return;
              }

              try {

                await deleteFinancialEntry(
                  state.session.user.id,
                  id
                );

                state.data[kind] =
                  state.data[kind].filter(
                    x => x.id !== id
                  );

                saveData();

                log(
                  kind === 'transactions'
                    ? 'Deleted Revenue'
                    : 'Deleted Expense',
                  'Financial record removed'
                );

                noticeMsg(
                  'Financial record deleted.',
                  'success'
                );

                render();

              } catch (err) {

                console.error(
                  'Finance delete error:',
                  err
                );

                noticeMsg(
                  err.message ||
                  'Unable to delete financial record.',
                  'error'
                );
              }

              return;
            }

            /* Normal local records */
            const arr =
              state.data[kind];

            state.data[kind] =
              arr.filter(
                x => x.id !== id
              );

            saveData();

            log(
              'Deleted item',
              'A local record was removed'
            );

            render();
          }
        )
    );

  /* ----------------------------------------------------------
     THEMES
     ---------------------------------------------------------- */

  document
    .querySelectorAll('[data-theme-mode]')
    .forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            setThemeMode(
              b.dataset.themeMode
            )
        )
    );

  document
    .querySelectorAll('[data-accent]')
    .forEach(
      b =>
        b.addEventListener(
          'click',
          () =>
            setAccent(
              b.dataset.accent
            )
        )
    );

  /* ----------------------------------------------------------
     ACCOUNT
     ---------------------------------------------------------- */

  document
    .querySelector(
      '#settings-signout'
    )
    ?.addEventListener(
      'click',
      doSignOut
    );

  /* ----------------------------------------------------------
     SEARCH
     ---------------------------------------------------------- */

  document
    .querySelector(
      '#global-search'
    )
    ?.addEventListener(
      'input',
      renderSearch
    );

  /* ----------------------------------------------------------
     CLEAR LOCAL DATA
     ---------------------------------------------------------- */

  document
    .querySelector(
      '[data-action="clear-data"]'
    )
    ?.addEventListener(
      'click',
      () => {

        if (
          confirm(
            'Clear all local Nexus content?'
          )
        ) {

          /*
           * This intentionally only clears local
           * non-finance data.
           *
           * Supabase financial records are not
           * deleted by this button.
           */
          state.data.content = [];
          state.data.ideas = [];
          state.data.tasks = [];
          state.data.goals = [];
          state.data.projects = [];
          state.data.clients = [];
          state.data.notes = [];
          state.data.links = [];
          state.data.activity = [];

          saveData();

          log(
            'Cleared local content',
            'Local non-finance content was cleared'
          );

          render();
        }
      }
    );
}

/* ============================================================
   WORKSPACE MODAL
   ============================================================ */

function openWorkspaceModal() {

  modal.classList.remove('hidden');

  modal.innerHTML = `
    <div class="modal">

      <button
        class="modal-close"
        data-close
      >
        ×
      </button>

      <span class="pill">
        PRIVATE CONTROL CENTER
      </span>

      <h2>
        Connect your Nexus.
      </h2>

      <p>
        Create the workspace record in your existing
        Supabase project. It does not create a
        team-management system.
      </p>

      <form id="workspace-form">

        <label>
          Name

          <input
            name="name"
            required
            minlength="2"
            maxlength="120"
            value="${esc(
              state.activeWorkspace?.name ||
              'Davonium Technologies'
            )}"
          />
        </label>

        <button
          class="primary"
          type="submit"
        >
          Create workspace
        </button>

        <div
          id="modal-status"
          class="form-status"
        ></div>

      </form>

    </div>
  `;

  document.querySelector(
    '[data-close]'
  ).onclick = closeModal;

  document.querySelector(
    '#workspace-form'
  ).onsubmit = async e => {

    e.preventDefault();

    const s =
      document.querySelector(
        '#modal-status'
      );

    s.textContent =
      'Creating…';

    try {

      const name =
        new FormData(e.target)
          .get('name');

      const id =
        await createWorkspaceWithOwner(
          name
        );

      await loadWorkspaces();

      const w =
        state.workspaces.find(
          x => x.id === id
        ) ||
        state.workspaces.find(
          x =>
            x.name ===
            String(name).trim()
        );

      setWorkspace(w);

      log(
        'Workspace connected',
        w?.name || String(name)
      );

      s.textContent =
        'Workspace created successfully.';

      noticeMsg(
        'Workspace created successfully.',
        'success'
      );

      setTimeout(
        closeModal,
        700
      );

      render();

    } catch (err) {

      s.textContent =
        err.message ||
        'Unable to create workspace.';
    }
  };
}

/* ============================================================
   AUTH
   ============================================================ */

function openAuth() {

  modal.classList.remove('hidden');

  modal.innerHTML = `
    <div class="modal auth-modal">

      <span class="pill">
        DAVONIUM ID
      </span>

      <h2>
        Welcome to Nexus.
      </h2>

      <p>
        Sign in to your private control center.
      </p>

      <div class="auth-tabs">

        <button
          class="secondary active"
          data-auth="signin"
        >
          Sign in
        </button>

        <button
          class="secondary"
          data-auth="signup"
        >
          Create account
        </button>

      </div>

      <form id="auth-form">

        <label
          id="name-wrap"
          class="hidden"
        >
          Full name

          <input name="name"/>
        </label>

        <label>
          Email

          <input
            name="email"
            type="email"
            required
          />
        </label>

        <label>
          Password

          <input
            name="password"
            type="password"
            required
            minlength="12"
            placeholder="At least 12 characters"
          />
        </label>

        <button
          class="primary"
          type="submit"
          id="auth-submit"
        >
          Sign in
        </button>

        <div
          id="auth-status"
          class="form-status"
        ></div>

      </form>

    </div>
  `;

  let mode = 'signin';

  document
    .querySelectorAll('[data-auth]')
    .forEach(
      b =>
        b.onclick = () => {

          mode =
            b.dataset.auth;

          document
            .querySelectorAll(
              '[data-auth]'
            )
            .forEach(
              x =>
                x.classList.toggle(
                  'active',
                  x === b
                )
            );

          document
            .querySelector(
              '#name-wrap'
            )
            .classList.toggle(
              'hidden',
              mode !== 'signup'
            );

          document.querySelector(
            '#auth-submit'
          ).textContent =
            mode === 'signin'
              ? 'Sign in'
              : 'Create account';
        }
    );

  document.querySelector(
    '#auth-form'
  ).onsubmit = async e => {

    e.preventDefault();

    const f =
      new FormData(e.target);

    const s =
      document.querySelector(
        '#auth-status'
      );

    s.textContent =
      'Working…';

    try {

      const r =
        mode === 'signin'
          ? await signIn(
              f.get('email'),
              f.get('password')
            )
          : await signUp(
              f.get('email'),
              f.get('password'),
              f.get('name')
            );

      state.session =
        r.session;

      if (state.session) {

        await loadWorkspaces();

        await loadFinanceData();
      }

      closeModal();

      noticeMsg(
        mode === 'signin'
          ? 'Welcome back.'
          : 'Account created.',
        'success'
      );

      render();

    } catch (err) {

      s.textContent =
        err.message ||
        'Authentication failed.';
    }
  };
}

async function doSignOut() {

  await signOut();

  state.session = null;

  state.workspaces = [];

  setWorkspace(null);

  openAuth();
}

/* ============================================================
   GLOBAL EVENTS
   ============================================================ */

document
  .querySelector('#nav')
  .addEventListener(
    'click',
    e => {

      const b =
        e.target.closest(
          '[data-page]'
        );

      if (b) {

        render(
          b.dataset.page
        );

        document
          .querySelector('#sidebar')
          .classList.remove('open');
      }
    }
  );

document
  .querySelector('#theme-toggle')
  .onclick = () =>
    setThemeMode(
      state.themeMode === 'light'
        ? 'dark'
        : state.themeMode === 'dark'
          ? 'system'
          : 'light'
    );

document
  .querySelector('#mobile-menu')
  .onclick = () =>
    document
      .querySelector('#sidebar')
      .classList.toggle('open');

document
  .querySelector('#signout')
  .onclick = doSignOut;

document
  .querySelector('#modal-layer')
  .addEventListener(
    'click',
    e => {

      if (
        e.target === modal ||
        e.target.hasAttribute('data-close')
      ) {
        closeModal();
      }
    }
  );

document
  .querySelector(
    '[data-action="new-workspace"]'
  )
  ?.addEventListener(
    'click',
    openWorkspaceModal
  );

window
  .matchMedia(
    '(prefers-color-scheme: dark)'
  )
  .addEventListener?.(
    'change',
    () => {

      if (
        state.themeMode === 'system'
      ) {
        applyTheme();
      }
    }
  );

/* ============================================================
   BOOTSTRAP
   ============================================================ */

async function bootstrap() {

  applyTheme();

  const r =
    await getSession();

  state.session =
    r.session;

  if (
    state.session &&
    isSupabaseConfigured
  ) {

    try {

      await loadWorkspaces();

      await loadFinanceData();

    } catch (err) {

      console.error(
        'Supabase data load error:',
        err
      );

      noticeMsg(
        err.message ||
        'Supabase data load failed.',
        'error'
      );
    }
  }

  render();

  if (!state.session) {
    openAuth();
  }

  if (isSupabaseConfigured) {

    supabase.auth.onAuthStateChange(
      (_event, session) => {

        state.session =
          session;

        if (session) {

          loadWorkspaces()
            .then(
              () =>
                loadFinanceData()
            )
            .then(
              () => render()
            )
            .catch(
              err =>
                noticeMsg(
                  err.message ||
                  'Supabase data load failed.',
                  'error'
                )
            );

          closeModal();

        } else {

          state.workspaces = [];

          setWorkspace(null);

          render();

          openAuth();
        }
      }
    );
  }
}

bootstrap();
