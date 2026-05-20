/* ========================================
   MAIN — App initialization & event wiring
   ======================================== */

import './style.css';
import { inject } from '@vercel/analytics';
import * as store from './store.js';

inject();
import * as ui from './ui.js';

let currentMonth = store.monthKey(new Date());
let selectedCategory = null;
let calendarOpen = false;
let calendarYear = new Date().getFullYear();
let selectedEmoji = '📌';
let emojiGridOpen = false;

/* ===== INIT ===== */
function init() {
    applyTheme();
    setupThemeToggle();
    applyRecurringExpenses();
    renderAll();
    setupNav();
    setupMonthNav();
    setupCalendar();
    setupAddTabs();
    setupExpenseForm();
    setupIncomeForm();
    setupBudgetForm();
    setupCategoryForm();
    setupRecurringForm();
    setupClearMonth();
    setupExport();
    setupReminder();
    setDefaultDate();
}

/* ===== THEME ===== */
function getStoredTheme() {
    return localStorage.getItem('spendly_theme');
}

function applyTheme() {
    const stored = getStoredTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;

    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#111413' : '#F7F3EC';
}

function setupThemeToggle() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const dark = document.documentElement.getAttribute('data-theme') !== 'dark';
        localStorage.setItem('spendly_theme', dark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        document.querySelector('meta[name="theme-color"]').content = dark ? '#111413' : '#F7F3EC';
    });
}

/* ===== RENDER ALL ===== */
function renderAll() {
    closeCalendar();
    document.getElementById('current-month-label').textContent = store.monthLabel(currentMonth);
    ui.renderBudget(currentMonth);
    ui.renderInsights(currentMonth);
    ui.renderIncome(currentMonth, handleDeleteIncome);
    ui.renderDonut(currentMonth);
    ui.renderBarChart(currentMonth);
    ui.renderExpenses(currentMonth, handleDeleteExpense);
    ui.renderCategoryPicker(selectedCategory);
    ui.renderCategoryManager(handleDeleteCategory);
    ui.renderRecurringList(handleDeleteRecurring);
    updateBudgetInput();
    updateExportVisibility();
}

/* ===== VIEW NAVIGATION ===== */
function setupNav() {
    const buttons = document.querySelectorAll('.nav-item');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
        // Re-render when switching views
        if (viewName === 'dashboard') {
            ui.renderBudget(currentMonth);
            ui.renderInsights(currentMonth);
            ui.renderIncome(currentMonth, handleDeleteIncome);
            ui.renderDonut(currentMonth);
            ui.renderBarChart(currentMonth);
            ui.renderExpenses(currentMonth, handleDeleteExpense);
        } else if (viewName === 'add') {
            ui.renderCategoryPicker(selectedCategory);
            setupCategoryChipListeners();
        } else if (viewName === 'settings') {
            ui.renderCategoryManager(handleDeleteCategory);
            ui.renderRecurringList(handleDeleteRecurring);
            updateBudgetInput();
            updateExportVisibility();
        }
    }
}

/* ===== MONTH NAVIGATION ===== */
function setupMonthNav() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth = store.prevMonth(currentMonth);
        renderAll();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth = store.nextMonth(currentMonth);
        renderAll();
    });
}

/* ===== MONTH PICKER ===== */
function setupCalendar() {
    const label = document.getElementById('current-month-label');
    const overlay = document.getElementById('calendar-overlay');

    label.addEventListener('click', () => {
        if (calendarOpen) {
            closeCalendar();
        } else {
            openCalendar();
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCalendar();
    });

    document.getElementById('cal-prev-year').addEventListener('click', () => {
        calendarYear--;
        ui.renderMonthPicker(calendarYear, currentMonth, handleMonthPick);
    });

    document.getElementById('cal-next-year').addEventListener('click', () => {
        calendarYear++;
        ui.renderMonthPicker(calendarYear, currentMonth, handleMonthPick);
    });
}

function openCalendar() {
    calendarOpen = true;
    calendarYear = parseInt(currentMonth.split('-')[0], 10);
    document.getElementById('calendar-overlay').style.display = 'flex';
    ui.renderMonthPicker(calendarYear, currentMonth, handleMonthPick);
}

function closeCalendar() {
    calendarOpen = false;
    document.getElementById('calendar-overlay').style.display = 'none';
}

function handleMonthPick(monthKey) {
    currentMonth = monthKey;
    closeCalendar();
    renderAll();
}

/* ===== ADD TABS (Expense / Income) ===== */
function setupAddTabs() {
    const tabs = document.querySelectorAll('#add-tabs .add-tab');
    const expenseCard = document.getElementById('expense-form-card');
    const incomeCard = document.getElementById('income-form-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'expense') {
                expenseCard.style.display = '';
                incomeCard.style.display = 'none';
            } else {
                expenseCard.style.display = 'none';
                incomeCard.style.display = '';
                setDefaultIncomeDate();
            }
        });
    });
}

/* ===== INCOME FORM ===== */
function setupIncomeForm() {
    const form = document.getElementById('income-form');
    const amountInput = document.getElementById('income-amount');

    amountInput.addEventListener('input', () => {
        const raw = amountInput.value.replace(/[^0-9.]/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num) && raw !== '') {
            const cursor = amountInput.selectionStart;
            const prevLen = amountInput.value.length;
            amountInput.value = num.toLocaleString();
            const diff = amountInput.value.length - prevLen;
            amountInput.setSelectionRange(cursor + diff, cursor + diff);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, ''));
        const source = document.getElementById('income-source').value.trim();
        const date = document.getElementById('income-date').value;

        if (!amount || amount <= 0) {
            ui.toast('Please enter a valid amount', 'error');
            return;
        }
        if (!date) {
            ui.toast('Please select a date', 'error');
            return;
        }

        const incomeMonth = date.substring(0, 7);
        store.addIncome(incomeMonth, { amount, source, date });
        ui.toast('Income added! 💵');
        form.reset();
        setDefaultIncomeDate();

        if (incomeMonth === currentMonth) {
            ui.renderIncome(currentMonth, handleDeleteIncome);
            ui.renderInsights(currentMonth);
        }

        switchView('dashboard');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
    });
}

function setDefaultIncomeDate() {
    const dateInput = document.getElementById('income-date');
    const today = new Date();
    dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function handleDeleteIncome(incomeId) {
    store.deleteIncome(currentMonth, incomeId);
    ui.toast('Income deleted');
    ui.renderIncome(currentMonth, handleDeleteIncome);
    ui.renderInsights(currentMonth);
}

/* ===== EXPENSE FORM ===== */
function setupExpenseForm() {
    const form = document.getElementById('expense-form');
    const amountInput = document.getElementById('expense-amount');

    amountInput.addEventListener('input', () => {
        const raw = amountInput.value.replace(/[^0-9.]/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num) && raw !== '') {
            const cursor = amountInput.selectionStart;
            const prevLen = amountInput.value.length;
            amountInput.value = num.toLocaleString();
            const diff = amountInput.value.length - prevLen;
            amountInput.setSelectionRange(cursor + diff, cursor + diff);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, ''));
        const note = document.getElementById('expense-note').value.trim();
        const date = document.getElementById('expense-date').value;

        if (!amount || amount <= 0) {
            ui.toast('Please enter a valid amount', 'error');
            return;
        }
        if (!selectedCategory) {
            ui.toast('Please select a category', 'error');
            return;
        }
        if (!date) {
            ui.toast('Please select a date', 'error');
            return;
        }

        // Determine which month this expense belongs to
        const expenseMonth = date.substring(0, 7); // YYYY-MM

        store.addExpense(expenseMonth, {
            amount,
            category: selectedCategory,
            note,
            date,
        });

        ui.toast('Expense added! 🎉');
        form.reset();
        setDefaultDate();
        selectedCategory = null;
        ui.renderCategoryPicker(null);
        setupCategoryChipListeners();

        if (expenseMonth === currentMonth) {
            ui.renderBudget(currentMonth);
            ui.renderInsights(currentMonth);
            ui.renderIncome(currentMonth, handleDeleteIncome);
            ui.renderDonut(currentMonth);
            ui.renderBarChart(currentMonth);
            ui.renderExpenses(currentMonth, handleDeleteExpense);
            updateExportVisibility();
        }

        // Switch to dashboard after adding
        switchView('dashboard');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
    });

    // Initial category chip listeners
    setupCategoryChipListeners();
}

function setupCategoryChipListeners() {
    const picker = document.getElementById('category-picker');
    picker.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            selectedCategory = chip.dataset.id;
            picker.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
        });
    });
}

function setDefaultDate() {
    const dateInput = document.getElementById('expense-date');
    const today = new Date();
    dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/* ===== BUDGET FORM ===== */
function setupBudgetForm() {
    const form = document.getElementById('budget-form');
    const budgetInput = document.getElementById('budget-input');

    budgetInput.addEventListener('input', () => {
        const raw = budgetInput.value.replace(/[^0-9.]/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num) && raw !== '') {
            const cursor = budgetInput.selectionStart;
            const prevLen = budgetInput.value.length;
            budgetInput.value = num.toLocaleString();
            const diff = budgetInput.value.length - prevLen;
            budgetInput.setSelectionRange(cursor + diff, cursor + diff);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const now = store.monthKey(new Date());
        const existing = store.getMonth(currentMonth);
        if (currentMonth < now) {
            ui.toast('Past months can\'t be edited', 'error');
            return;
        }
        if (existing.budget > 0) {
            ui.toast('Budget already set for this month', 'error');
            return;
        }
        const amount = parseFloat(budgetInput.value.replace(/[^0-9.]/g, ''));
        if (!amount || amount <= 0) {
            ui.toast('Enter a valid budget amount', 'error');
            return;
        }
        store.setBudget(currentMonth, amount);
        ui.toast('Budget saved! 💰');
        ui.renderBudget(currentMonth);
        ui.renderInsights(currentMonth);
        updateBudgetInput();
    });

    document.getElementById('btn-set-budget').addEventListener('click', () => {
        switchView('settings');
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-item[data-view="settings"]').classList.add('active');
        setTimeout(() => document.getElementById('budget-input').focus(), 300);
    });
}

function updateBudgetInput() {
    const month = store.getMonth(currentMonth);
    const input = document.getElementById('budget-input');
    const form = document.getElementById('budget-form');
    const locked = document.getElementById('budget-locked');
    const hint = document.getElementById('budget-locked-hint');
    const editBtn = document.getElementById('btn-set-budget');

    const now = store.monthKey(new Date());
    const isPast = currentMonth < now;
    const hasBudget = month.budget > 0;
    const isLocked = hasBudget || isPast;

    if (isLocked) {
        form.style.display = 'none';
        locked.style.display = 'flex';
        if (isPast) {
            hint.textContent = `${store.monthLabel(currentMonth)} — past months can't be edited.`;
        } else {
            hint.textContent = `${store.monthLabel(currentMonth)} — ${Number(month.budget).toLocaleString()}. Clear month data to reset.`;
        }
        editBtn.style.display = 'none';
    } else {
        form.style.display = '';
        locked.style.display = 'none';
        editBtn.style.display = '';
        input.value = '';
    }
}

/* ===== CATEGORY FORM ===== */
function setupCategoryForm() {
    const form = document.getElementById('add-category-form');
    const emojiBtn = document.getElementById('emoji-pick-btn');
    const emojiGrid = document.getElementById('emoji-grid');

    emojiBtn.addEventListener('click', () => {
        emojiGridOpen = !emojiGridOpen;
        emojiGrid.style.display = emojiGridOpen ? 'grid' : 'none';
        if (emojiGridOpen) {
            ui.renderEmojiGrid((emoji) => {
                selectedEmoji = emoji;
                emojiBtn.textContent = emoji;
                emojiGridOpen = false;
                emojiGrid.style.display = 'none';
            });
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-category-name');
        const name = nameInput.value.trim();
        if (!name) return;

        store.addCategory(name, selectedEmoji);
        nameInput.value = '';
        selectedEmoji = '📌';
        emojiBtn.textContent = '📌';
        emojiGridOpen = false;
        emojiGrid.style.display = 'none';
        ui.toast(`Category "${name}" added!`);
        ui.renderCategoryManager(handleDeleteCategory);
        ui.renderCategoryPicker(selectedCategory);
        setupCategoryChipListeners();
    });
}

function handleDeleteCategory(catId) {
    const cats = store.getCategories();
    const cat = cats.find(c => c.id === catId);
    if (cat && confirm(`Delete "${cat.name}" category?`)) {
        store.deleteCategory(catId);
        ui.toast(`Category deleted`);
        ui.renderCategoryManager(handleDeleteCategory);
        ui.renderCategoryPicker(selectedCategory);
        setupCategoryChipListeners();
    }
}

/* ===== RECURRING EXPENSES ===== */
let selectedRecurringCategory = null;

function applyRecurringExpenses() {
    const now = store.monthKey(new Date());
    if (store.applyRecurring(now)) {
        ui.toast('Recurring expenses added for this month');
    }
}

function setupRecurringForm() {
    const form = document.getElementById('add-recurring-form');
    const amountInput = document.getElementById('recurring-amount');
    const picker = document.getElementById('recurring-category-picker');

    ui.renderCategoryPicker(null, 'recurring-category-picker');
    setupRecurringCategoryListeners();

    amountInput.addEventListener('input', () => {
        const raw = amountInput.value.replace(/[^0-9.]/g, '');
        const num = parseFloat(raw);
        if (!isNaN(num) && raw !== '') {
            const cursor = amountInput.selectionStart;
            const prevLen = amountInput.value.length;
            amountInput.value = num.toLocaleString();
            const diff = amountInput.value.length - prevLen;
            amountInput.setSelectionRange(cursor + diff, cursor + diff);
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(amountInput.value.replace(/[^0-9.]/g, ''));
        const note = document.getElementById('recurring-note').value.trim();

        if (!amount || amount <= 0) { ui.toast('Enter a valid amount', 'error'); return; }
        if (!selectedRecurringCategory) { ui.toast('Select a category', 'error'); return; }

        store.addRecurring({ amount, category: selectedRecurringCategory, note });
        form.reset();
        selectedRecurringCategory = null;
        ui.renderCategoryPicker(null, 'recurring-category-picker');
        setupRecurringCategoryListeners();
        ui.renderRecurringList(handleDeleteRecurring);
        ui.toast('Recurring expense added');
    });
}

function setupRecurringCategoryListeners() {
    const picker = document.getElementById('recurring-category-picker');
    picker.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            selectedRecurringCategory = chip.dataset.id;
            picker.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
        });
    });
}

function handleDeleteRecurring(id) {
    if (confirm('Remove this recurring expense?')) {
        store.deleteRecurring(id);
        ui.renderRecurringList(handleDeleteRecurring);
        ui.toast('Recurring expense removed');
    }
}

/* ===== DAILY REMINDER ===== */
let lastReminderDate = localStorage.getItem('spendly_reminder_last') || '';

function setupReminder() {
    const checkbox = document.getElementById('reminder-checkbox');
    const hint = document.getElementById('reminder-hint');
    const enabled = localStorage.getItem('spendly_reminder') === 'on';
    checkbox.checked = enabled;
    hint.textContent = enabled ? "Enabled — you'll be notified at 10 PM" : 'Get a notification at 10 PM to log expenses';

    checkbox.addEventListener('change', async () => {
        if (checkbox.checked) {
            if (!('Notification' in window)) {
                ui.toast('Notifications not supported in this browser', 'error');
                checkbox.checked = false;
                return;
            }
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                ui.toast('Notification permission denied', 'error');
                checkbox.checked = false;
                return;
            }
            localStorage.setItem('spendly_reminder', 'on');
            hint.textContent = "Enabled — you'll be notified at 10 PM";
            ui.toast('Reminder enabled for 10 PM');
        } else {
            localStorage.setItem('spendly_reminder', 'off');
            hint.textContent = 'Get a notification at 10 PM to log expenses';
        }
    });

    checkReminder();
    setInterval(checkReminder, 60000);
}

function checkReminder() {
    if (localStorage.getItem('spendly_reminder') !== 'on') return;
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    if (now.getHours() !== 22 || now.getMinutes() !== 0) return;

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (lastReminderDate === todayStr) return;
    lastReminderDate = todayStr;
    localStorage.setItem('spendly_reminder_last', todayStr);

    const mk = store.monthKey(now);
    const todayExpenses = store.getExpensesByDate(mk, todayStr);
    const body = todayExpenses.length === 0
        ? "You haven't logged any expenses today. Tap to add one!"
        : `You logged ${todayExpenses.length} expense${todayExpenses.length > 1 ? 's' : ''} today. Anything else?`;

    new Notification('Spendly Reminder', { body, icon: '/icon-192.png' });
}

/* ===== DELETE EXPENSE ===== */
function handleDeleteExpense(expenseId) {
    store.deleteExpense(currentMonth, expenseId);
    ui.toast('Expense deleted');
    ui.renderBudget(currentMonth);
    ui.renderInsights(currentMonth);
    ui.renderDonut(currentMonth);
    ui.renderBarChart(currentMonth);
    ui.renderExpenses(currentMonth, handleDeleteExpense);
    updateExportVisibility();
}

/* ===== CLEAR MONTH ===== */
function setupClearMonth() {
    document.getElementById('btn-clear-month').addEventListener('click', () => {
        const label = store.monthLabel(currentMonth);
        if (confirm(`Clear all data for ${label}? This cannot be undone.`)) {
            store.clearMonth(currentMonth);
            ui.toast('Month data cleared');
            renderAll();
        }
    });
}

/* ===== EXPORT ===== */
function setupExport() {
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
}

function updateExportVisibility() {
    const month = store.getMonth(currentMonth);
    const hasData = month.expenses.length > 0;
    document.getElementById('export-section').style.display = hasData ? '' : 'none';
}

function getExportData() {
    const month = store.getMonth(currentMonth);
    const cats = store.getCategories();
    return month.expenses.map(e => {
        const cat = cats.find(c => c.id === e.category) || { name: e.category, emoji: '' };
        return { date: e.date, category: cat.name, note: e.note || '', amount: e.amount };
    });
}

function exportCSV() {
    const rows = getExportData();
    if (!rows.length) { ui.toast('No expenses to export', 'error'); return; }

    const header = 'Date,Category,Note,Amount';
    const csv = [header, ...rows.map(r =>
        `${r.date},"${r.category}","${r.note.replace(/"/g, '""')}",${r.amount}`
    )].join('\n');

    downloadFile(`spendly-${currentMonth}.csv`, csv, 'text/csv');
    ui.toast('CSV exported');
}

function exportPDF() {
    const rows = getExportData();
    const month = store.getMonth(currentMonth);
    if (!rows.length) { ui.toast('No expenses to export', 'error'); return; }

    const budget = month.budget || 0;
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const label = store.monthLabel(currentMonth);
    const fmt = n => Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const tableRows = rows.map(r =>
        `<tr><td>${r.date}</td><td>${r.category}</td><td>${r.note}</td><td style="text-align:right">${fmt(r.amount)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Spendly — ${label}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:40px;color:#14201C;max-width:700px;margin:0 auto}
  h1{font-size:20px;margin-bottom:4px} .sub{color:#6E7B75;font-size:13px;margin-bottom:24px}
  .summary{display:flex;gap:32px;margin-bottom:24px}
  .summary div{font-size:13px;color:#6E7B75} .summary strong{display:block;font-size:18px;color:#14201C}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 10px;border-bottom:2px solid #E6E4DD;color:#6E7B75;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em}
  td{padding:8px 10px;border-bottom:1px solid #EFEDE6}
  tr:last-child td{border-bottom:none}
  .total-row td{border-top:2px solid #E6E4DD;font-weight:600}
</style></head><body>
<h1>Spendly — ${label}</h1>
<p class="sub">Expense report</p>
<div class="summary">
  <div>Budget<strong>${budget > 0 ? fmt(budget) : '—'}</strong></div>
  <div>Spent<strong>${fmt(total)}</strong></div>
  <div>Remaining<strong>${budget > 0 ? fmt(budget - total) : '—'}</strong></div>
</div>
<table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${tableRows}
<tr class="total-row"><td colspan="3">Total</td><td style="text-align:right">${fmt(total)}</td></tr>
</tbody></table></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.print(); };
}

function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

/* ===== START ===== */
document.addEventListener('DOMContentLoaded', init);
