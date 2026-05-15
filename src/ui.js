/* ========================================
   UI — DOM rendering & interactions
   ======================================== */

import * as store from './store.js';

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

/* ===== CATEGORY PICKER (Add Expense form) ===== */
export function renderCategoryPicker(selectedId) {
    const cats = store.getCategories();
    const picker = document.getElementById('category-picker');

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

/* ===== TOAST ===== */
export function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2600);
}
