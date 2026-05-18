/* ========================================
   UI — DOM rendering & interactions
   ======================================== */

import * as store from './store.js';
import { generateInsights } from './insights.js';

/* ===== FORMAT HELPERS ===== */
function fmt(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ===== DONUT CHART ===== */
export function renderDonut(monthKey) {
    const data = store.getSpendingByCategory(monthKey);
    const svg = document.getElementById('donut-svg');
    const legend = document.getElementById('chart-legend');
    const center = document.getElementById('donut-center-text');
    const card = document.getElementById('chart-card');
    const total = data.reduce((s, d) => s + d.amount, 0);

    if (data.length === 0) {
        card.classList.add('empty');
        svg.innerHTML = '';
        legend.innerHTML = '';
        center.textContent = '';
        return;
    }

    card.classList.remove('empty');
    const radius = 15.915;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    let svgPaths = '';

    data.forEach(d => {
        const pct = (d.amount / total) * 100;
        const dashLen = (pct / 100) * circumference;
        const dashGap = circumference - dashLen;
        svgPaths += `<circle cx="18" cy="18" r="${radius}" fill="none"
      stroke="${d.color}" stroke-width="4"
      stroke-dasharray="${dashLen} ${dashGap}"
      stroke-dashoffset="-${offset}"
      style="transition: stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease;" />`;
        offset += dashLen;
    });

    svg.innerHTML = svgPaths;
    center.innerHTML = `<div style="font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-size:0.95rem;font-weight:500;letter-spacing:-0.01em;color:var(--ink-900)">${fmt(total)}</div><div>total</div>`;

    legend.innerHTML = data.map(d => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${d.color}"></span>
      <span class="legend-label">${d.emoji} ${d.name}</span>
      <span class="legend-value">${fmt(d.amount)}</span>
    </div>
  `).join('');
}

/* ===== MONTHLY BAR CHART ===== */
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function renderBarChart(currentMonthKey) {
    const data = store.getMonthlyTotals(currentMonthKey, 6);
    const container = document.getElementById('bar-chart');
    const card = document.getElementById('bar-chart-card');
    const max = Math.max(...data.map(d => d.spent), 1);
    const hasAny = data.some(d => d.spent > 0);

    if (!hasAny) {
        card.style.display = 'none';
        return;
    }
    card.style.display = '';

    container.innerHTML = data.map(d => {
        const pct = (d.spent / max) * 100;
        const [, m] = d.key.split('-').map(Number);
        const label = MONTH_SHORT[m - 1];
        const isCurrent = d.key === currentMonthKey;
        const overBudget = d.budget > 0 && d.spent > d.budget;
        return `
      <div class="bar-col ${isCurrent ? 'current' : ''}">
        <span class="bar-value">${fmt(d.spent)}</span>
        <div class="bar-track">
          <div class="bar-fill ${overBudget ? 'over' : ''}" style="height:${Math.max(pct, 2)}%"></div>
        </div>
        <span class="bar-label">${label}</span>
      </div>`;
    }).join('');
}

/* ===== BUDGET DISPLAY ===== */
export function renderBudget(monthKey) {
    const month = store.getMonth(monthKey);
    const budget = month.budget || 0;
    const spent = store.getTotalSpent(monthKey);
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

    const budgetEl = document.getElementById('budget-amount');
    budgetEl.textContent = budget > 0 ? fmt(budget) : 'Not set';
    budgetEl.style.color = budget > 0 ? 'var(--ink-900)' : 'var(--ink-400)';
    document.getElementById('spent-label').textContent = `Spent: ${fmt(spent)}`;
    document.getElementById('remaining-label').textContent = budget > 0 ? `Left: ${fmt(remaining)}` : 'Left: —';

    const fill = document.getElementById('progress-fill');
    fill.style.width = `${pct}%`;
    fill.classList.toggle('over-budget', spent > budget && budget > 0);
}

/* ===== EXPENSE LIST ===== */
export function renderExpenses(monthKey, onDelete) {
    const month = store.getMonth(monthKey);
    const cats = store.getCategories();
    const list = document.getElementById('expense-list');
    const section = document.getElementById('expenses-section');

    if (month.expenses.length === 0) {
        section.classList.add('empty');
        list.innerHTML = '';
        return;
    }

    section.classList.remove('empty');

    list.innerHTML = month.expenses.map(e => {
        const cat = cats.find(c => c.id === e.category) || { emoji: '📦', name: e.category, color: '#6b7280' };
        const dateStr = formatDate(e.date);
        const noteStr = e.note ? `${e.note} · ` : '';
        return `
      <li class="expense-item" data-id="${e.id}">
        <div class="expense-icon" style="background:${cat.color}18;color:${cat.color}">${cat.emoji}</div>
        <div class="expense-info">
          <div class="expense-category">${cat.name}</div>
          <div class="expense-note-date">${noteStr}${dateStr}</div>
        </div>
        <div class="expense-amount">${fmt(e.amount)}</div>
        <button class="expense-delete" data-id="${e.id}" title="Delete">✕</button>
      </li>
    `;
    }).join('');

    // Attach delete handlers
    list.querySelectorAll('.expense-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (onDelete) onDelete(id);
        });
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
}

/* ===== RECURRING LIST ===== */
export function renderRecurringList(onDelete) {
    const items = store.getRecurring();
    const cats = store.getCategories();
    const container = document.getElementById('recurring-list');

    if (!items.length) {
        container.innerHTML = '<div class="empty-state" style="padding:12px 0">No recurring expenses yet</div>';
        return;
    }

    container.innerHTML = items.map(r => {
        const cat = cats.find(c => c.id === r.category) || { emoji: '📦', name: r.category, color: '#6b7280' };
        const noteStr = r.note ? `${r.note} · ` : '';
        return `
      <div class="recurring-item" data-id="${r.id}">
        <div class="expense-icon" style="background:${cat.color}18;color:${cat.color}">${cat.emoji}</div>
        <div class="expense-info">
          <div class="expense-category">${cat.name}</div>
          <div class="expense-note-date">${noteStr}Monthly</div>
        </div>
        <div class="expense-amount">${fmt(r.amount)}</div>
        <button class="expense-delete recurring-delete" data-id="${r.id}" title="Remove">✕</button>
      </div>`;
    }).join('');

    container.querySelectorAll('.recurring-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onDelete) onDelete(btn.dataset.id);
        });
    });
}

/* ===== INCOME LIST ===== */
export function renderIncome(monthKey, onDelete) {
    const month = store.getMonth(monthKey);
    const incomeEntries = month.income || [];
    const card = document.getElementById('income-card');
    const list = document.getElementById('income-list');
    const totalEl = document.getElementById('income-total');

    if (incomeEntries.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = '';
    const total = incomeEntries.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    totalEl.textContent = fmt(total);

    list.innerHTML = incomeEntries.map(i => {
        const source = i.source || 'Income';
        const dateStr = formatDate(i.date);
        return `
      <li class="income-item" data-id="${i.id}">
        <div class="income-icon">💵</div>
        <div class="income-info">
          <div class="income-source">${source}</div>
          <div class="income-date">${dateStr}</div>
        </div>
        <div class="income-amount-text">${fmt(i.amount)}</div>
        <button class="income-delete" data-id="${i.id}" title="Delete">✕</button>
      </li>`;
    }).join('');

    list.querySelectorAll('.income-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onDelete) onDelete(btn.dataset.id);
        });
    });
}

/* ===== INSIGHTS ===== */
export function renderInsights(monthKey) {
    const insights = generateInsights(monthKey);
    const card = document.getElementById('insights-card');
    const list = document.getElementById('insights-list');

    if (insights.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = '';
    list.innerHTML = insights.map(i => `
    <div class="insight-item ${i.type}">
      <span class="insight-emoji">${i.emoji}</span>
      <span class="insight-text">${i.text}</span>
    </div>
  `).join('');
}

/* ===== CATEGORY PICKER ===== */
export function renderCategoryPicker(selectedId, containerId = 'category-picker') {
    const cats = store.getCategories();
    const picker = document.getElementById(containerId);

    picker.innerHTML = cats.map(c =>
        `<button type="button" class="cat-chip ${c.id === selectedId ? 'selected' : ''}" data-id="${c.id}">${c.emoji} ${c.name}</button>`
    ).join('');

    return picker;
}

/* ===== CATEGORY MANAGEMENT (Settings) ===== */
export function renderCategoryManager(onDelete) {
    const cats = store.getCategories();
    const container = document.getElementById('category-manage-list');

    container.innerHTML = cats.map(c => `
    <div class="cat-manage-item" data-id="${c.id}">
      <span class="cat-emoji">${c.emoji}</span>
      <span class="cat-name">${c.name}</span>
      <button class="cat-delete-btn" data-id="${c.id}" title="Delete category">✕</button>
    </div>
  `).join('');

    container.querySelectorAll('.cat-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onDelete) onDelete(btn.dataset.id);
        });
    });
}

/* ===== EMOJI PICKER ===== */
const EMOJI_SET = [
    '🍔', '🍕', '🍜', '🥗', '☕', '🍺', '🛒', '🍰',
    '🚗', '🚕', '🚌', '✈️', '⛽', '🚲', '🚇', '🛴',
    '🏠', '💡', '🔧', '🛋️', '🧹', '🪴', '🔑', '🏢',
    '🛍️', '👕', '👟', '📱', '💻', '🎧', '💍', '🎁',
    '💊', '🏥', '🦷', '💪', '🧘', '🩺', '🧴', '👶',
    '🎬', '🎮', '🎵', '📚', '🎨', '⚽', '🎭', '🐕',
    '💰', '💳', '📊', '🎓', '✏️', '💼', '📦', '📌',
];

export function renderEmojiGrid(onPick) {
    const grid = document.getElementById('emoji-grid');
    grid.innerHTML = EMOJI_SET.map(e =>
        `<button type="button" class="emoji-option" data-emoji="${e}">${e}</button>`
    ).join('');

    grid.querySelectorAll('.emoji-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (onPick) onPick(btn.dataset.emoji);
        });
    });
}

/* ===== MONTH PICKER ===== */
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function renderMonthPicker(year, currentMonthKey, onMonthClick) {
    const grid = document.getElementById('calendar-grid');
    const yearLabel = document.getElementById('cal-year-label');
    yearLabel.textContent = year;

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let html = '';
    for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`;
        const isSelected = key === currentMonthKey;
        const isNow = key === todayKey;
        const hasData = store.getMonth(key).expenses.length > 0 || store.getMonth(key).budget > 0;
        let cls = 'cal-month';
        if (isSelected) cls += ' selected';
        if (isNow) cls += ' today';
        if (hasData) cls += ' has-data';
        html += `<span class="${cls}" data-key="${key}">${MONTH_NAMES_SHORT[m - 1]}</span>`;
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.cal-month').forEach(el => {
        el.addEventListener('click', () => {
            if (onMonthClick) onMonthClick(el.dataset.key);
        });
    });
}

/* ===== TOAST ===== */
export function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
}
