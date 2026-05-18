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
    renderAll();
    setupNav();
    setupMonthNav();
    setupCalendar();
    setupExpenseForm();
    setupBudgetForm();
    setupCategoryForm();
    setupClearMonth();
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
    ui.renderDonut(currentMonth);
    ui.renderExpenses(currentMonth, handleDeleteExpense);
    ui.renderCategoryPicker(selectedCategory);
    ui.renderCategoryManager(handleDeleteCategory);
    updateBudgetInput();
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
            ui.renderDonut(currentMonth);
            ui.renderExpenses(currentMonth, handleDeleteExpense);
        } else if (viewName === 'add') {
            ui.renderCategoryPicker(selectedCategory);
            setupCategoryChipListeners();
        } else if (viewName === 'settings') {
            ui.renderCategoryManager(handleDeleteCategory);
            updateBudgetInput();
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

/* ===== EXPENSE FORM ===== */
function setupExpenseForm() {
    const form = document.getElementById('expense-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('expense-amount').value);
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
            ui.renderDonut(currentMonth);
            ui.renderExpenses(currentMonth, handleDeleteExpense);
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
    // Settings budget form
    const form = document.getElementById('budget-form');
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
        const amount = parseFloat(document.getElementById('budget-input').value);
        if (!amount || amount <= 0) {
            ui.toast('Enter a valid budget amount', 'error');
            return;
        }
        store.setBudget(currentMonth, amount);
        ui.toast('Budget saved! 💰');
        ui.renderBudget(currentMonth);
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

/* ===== DELETE EXPENSE ===== */
function handleDeleteExpense(expenseId) {
    store.deleteExpense(currentMonth, expenseId);
    ui.toast('Expense deleted');
    ui.renderBudget(currentMonth);
    ui.renderDonut(currentMonth);
    ui.renderExpenses(currentMonth, handleDeleteExpense);
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

/* ===== START ===== */
document.addEventListener('DOMContentLoaded', init);
