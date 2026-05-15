/* ========================================
   STORE — localStorage data layer
   ======================================== */

const STORAGE_KEY = 'expense_tracker_data';

const DEFAULT_CATEGORIES = [
    { id: 'food', name: 'Food', emoji: '🍔', color: '#D77B4D' },
    { id: 'transport', name: 'Transit', emoji: '🚗', color: '#2D5DA1' },
    { id: 'bills', name: 'Bills', emoji: '🏠', color: '#5C6A45' },
    { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#C9442E' },
    { id: 'health', name: 'Health', emoji: '💊', color: '#1FA38A' },
    { id: 'entertainment', name: 'Fun', emoji: '🎬', color: '#C18121' },
    { id: 'other', name: 'Other', emoji: '📦', color: '#6E7B75' },
];

// Rotating colors for custom categories
const CUSTOM_COLORS = ['#6E5BA8', '#D77B4D', '#2D5DA1', '#C18121', '#1FA38A', '#C9442E', '#5C6A45', '#6E7B75'];
let colorIndex = 0;

function getNextColor() {
    const c = CUSTOM_COLORS[colorIndex % CUSTOM_COLORS.length];
    colorIndex++;
    return c;
}

function loadAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Get or create a month record */
export function getMonth(monthKey) {
    const all = loadAll();
    if (!all[monthKey]) {
        all[monthKey] = {
            budget: 0,
            expenses: [],
        };
        saveAll(all);
    }
    return all[monthKey];
}

/** Get categories (global, not per-month) */
export function getCategories() {
    const all = loadAll();
    if (!all._categories) {
        all._categories = [...DEFAULT_CATEGORIES];
        saveAll(all);
    }
    return all._categories;
}

/** Add a custom category */
export function addCategory(name) {
    const all = loadAll();
    const cats = all._categories || [...DEFAULT_CATEGORIES];
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newCat = { id, name, emoji: '📌', color: getNextColor() };
    cats.push(newCat);
    all._categories = cats;
    saveAll(all);
    return newCat;
}

/** Delete a category */
export function deleteCategory(catId) {
    const all = loadAll();
    const cats = all._categories || [];
    all._categories = cats.filter(c => c.id !== catId);
    saveAll(all);
}

/** Set budget for a month */
export function setBudget(monthKey, amount) {
    const all = loadAll();
    if (!all[monthKey]) all[monthKey] = { budget: 0, expenses: [] };
    all[monthKey].budget = amount;
    saveAll(all);
}

/** Add an expense */
export function addExpense(monthKey, expense) {
    const all = loadAll();
    if (!all[monthKey]) all[monthKey] = { budget: 0, expenses: [] };
    expense.id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    all[monthKey].expenses.unshift(expense);
    saveAll(all);
    return expense;
}

/** Delete an expense */
export function deleteExpense(monthKey, expenseId) {
    const all = loadAll();
    if (!all[monthKey]) return;
    all[monthKey].expenses = all[monthKey].expenses.filter(e => e.id !== expenseId);
    saveAll(all);
}

/** Get total spent for a month */
export function getTotalSpent(monthKey) {
    const month = getMonth(monthKey);
    return month.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
}

/** Get spending grouped by category for a month */
export function getSpendingByCategory(monthKey) {
    const month = getMonth(monthKey);
    const cats = getCategories();
    const map = {};
    month.expenses.forEach(e => {
        if (!map[e.category]) map[e.category] = 0;
        map[e.category] += parseFloat(e.amount) || 0;
    });
    return Object.entries(map)
        .map(([catId, amount]) => {
            const cat = cats.find(c => c.id === catId) || { name: catId, emoji: '📦', color: '#6b7280' };
            return { ...cat, amount };
        })
        .sort((a, b) => b.amount - a.amount);
}

/** Clear all data for a month */
export function clearMonth(monthKey) {
    const all = loadAll();
    delete all[monthKey];
    saveAll(all);
}

/** Helper: format month key (YYYY-MM) */
export function monthKey(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Helper: format month label */
export function monthLabel(key) {
    const [y, m] = key.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(m) - 1]} ${y}`;
}

/** Navigate months */
export function prevMonth(key) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return monthKey(d);
}

export function nextMonth(key) {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m, 1);
    return monthKey(d);
}
