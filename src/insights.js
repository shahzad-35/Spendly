/* ========================================
   INSIGHTS — Rule-based spending tips
   ======================================== */

import * as store from './store.js';

function fmt(n) {
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function generateInsights(monthKey) {
    const insights = [];
    const month = store.getMonth(monthKey);
    const budget = month.budget || 0;
    const spent = store.getTotalSpent(monthKey);
    const income = store.getTotalIncome(monthKey);
    const categories = store.getSpendingByCategory(monthKey);
    const prevKey = store.prevMonth(monthKey);
    const prevSpent = store.getTotalSpent(prevKey);

    const [y, m] = monthKey.split('-').map(Number);
    const today = new Date();
    const isCurrentMonth = monthKey === store.monthKey(today);
    const dayOfMonth = isCurrentMonth ? today.getDate() : new Date(y, m, 0).getDate();
    const daysInMonth = new Date(y, m, 0).getDate();

    if (budget > 0 && spent > budget) {
        insights.push({
            emoji: '🚨',
            text: `Over budget by ${fmt(spent - budget)}`,
            type: 'bad',
        });
    }

    if (budget > 0 && spent <= budget && isCurrentMonth && dayOfMonth < daysInMonth - 2) {
        const pace = (spent / dayOfMonth) * daysInMonth;
        if (pace > budget) {
            const overPct = Math.round(((pace - budget) / budget) * 100);
            insights.push({
                emoji: '⚡',
                text: `At this pace you'll spend ~${fmt(Math.round(pace))} — ${overPct}% over budget`,
                type: 'warn',
            });
        }
    }

    if (budget > 0 && spent <= budget && (!isCurrentMonth || dayOfMonth >= 25)) {
        const saved = budget - spent;
        const pct = Math.round((saved / budget) * 100);
        if (pct >= 10) {
            insights.push({
                emoji: '🎯',
                text: `${pct}% under budget — saved ${fmt(saved)}`,
                type: 'good',
            });
        }
    }

    let showedConcentration = false;
    if (categories.length > 1 && spent > 0) {
        const top = categories[0];
        const pct = Math.round((top.amount / spent) * 100);
        if (pct >= 50) {
            showedConcentration = true;
            insights.push({
                emoji: top.emoji || '📊',
                text: `${top.name} is ${pct}% of spending — ${fmt(top.amount)}`,
                type: 'neutral',
            });
        }
    }

    if (!showedConcentration && categories.length >= 1 && spent > 0) {
        const top = categories[0];
        insights.push({
            emoji: top.emoji || '📊',
            text: `Top category: ${top.name} at ${fmt(top.amount)}`,
            type: 'neutral',
        });
    }

    if (prevSpent > 0 && spent > 0) {
        const diff = spent - prevSpent;
        const pct = Math.round(Math.abs(diff / prevSpent) * 100);
        if (diff > 0 && pct >= 10) {
            insights.push({ emoji: '📈', text: `Spending up ${pct}% vs last month`, type: 'warn' });
        } else if (diff < 0 && pct >= 10) {
            insights.push({ emoji: '📉', text: `Spending down ${pct}% vs last month`, type: 'good' });
        }
    }

    if (income > 0 && spent > 0) {
        const rate = Math.round(((income - spent) / income) * 100);
        if (rate > 0) {
            insights.push({
                emoji: '💰',
                text: `Savings rate: ${rate}% (${fmt(income - spent)} saved)`,
                type: rate >= 20 ? 'good' : 'neutral',
            });
        } else {
            insights.push({
                emoji: '⚠️',
                text: `Spending exceeds income by ${fmt(spent - income)}`,
                type: 'bad',
            });
        }
    }

    const recurringTotal = month.expenses
        .filter(e => e.recurring)
        .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    if (recurringTotal > 0 && spent > 0) {
        const pct = Math.round((recurringTotal / spent) * 100);
        if (pct >= 30) {
            insights.push({
                emoji: '🔄',
                text: `${pct}% of spending is recurring (${fmt(recurringTotal)})`,
                type: 'neutral',
            });
        }
    }

    if (budget === 0 && spent > 0) {
        insights.push({ emoji: '💡', text: 'Set a budget to track your progress', type: 'neutral' });
    }

    if (income === 0 && (budget > 0 || spent > 0)) {
        insights.push({ emoji: '💡', text: 'Log your income to see savings rate', type: 'neutral' });
    }

    return insights;
}
