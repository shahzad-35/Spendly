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

/* ===== INIT ===== */
function init() {
    renderAll();
    setupNav();
    setupMonthNav();
    setupExpenseForm();
    setupBudgetForm();
    setupCategoryForm();
    setupClearMonth();
    setDefaultDate();
}

/* ===== RENDER ALL ===== */
function renderAll() {
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

        // If the expense is in the current month, update dashboard
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
        const amount = parseFloat(document.getElementById('budget-input').value);
        if (!amount || amount <= 0) {
            ui.toast('Enter a valid budget amount', 'error');
            return;
        }
        store.setBudget(currentMonth, amount);
        ui.toast('Budget saved! 💰');
        ui.renderBudget(currentMonth);
    });

    // Quick edit from dashboard
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
    if (month.budget > 0) {
        input.value = month.budget;
    } else {
        input.value = '';
    }
}

/* ===== CATEGORY FORM ===== */
function setupCategoryForm() {
    const form = document.getElementById('add-category-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-category-name');
        const name = nameInput.value.trim();
        if (!name) return;

        store.addCategory(name);
        nameInput.value = '';
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
