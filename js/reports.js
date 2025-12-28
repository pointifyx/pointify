import { db } from './db.js';

class ReportsModule {
    constructor() {
        this.container = document.getElementById('view-reports');
        this.init();
    }

    async init() {
        this.renderLayout();
        await this.loadSettings();
        await this.generateReport(); // Load all by default
        this.bindEvents();
    }

    async loadSettings() {
        this.currencySymbol = '$';
        const storedSettings = await db.getAll('settings');
        const sym = storedSettings.find(s => s.key === 'currencySymbol');
        if (sym) this.currencySymbol = sym.value;
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="flex flex-col h-full space-y-6">
                <!-- Header & Controls -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                     <div class="flex flex-col">
                        <h2 class="text-2xl font-bold text-slate-800">Financial Reports</h2>
                        <span class="text-xs text-slate-500 font-medium" id="report-period-label">All Time</span>
                     </div>
                     
                     <div class="flex flex-wrap gap-2">
                        <div class="flex bg-stone-100 rounded-lg p-1">
                            <button data-filter="today" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition text-slate-600">Today</button>
                            <button data-filter="week" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition text-slate-600">This Week</button>
                            <button data-filter="month" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition text-slate-600">This Month</button>
                            <button id="btn-filter-year" data-filter="year" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition text-slate-600">This Year</button>
                            <button id="btn-filter-all" data-filter="all" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-red-600">All</button>
                        </div>
                        
                        <!-- Manager Scope Toggle -->
                        <div id="manager-scope-toggle" class="hidden flex bg-stone-100 rounded-lg p-1 ml-2">
                             <button data-scope="mine" class="scope-btn px-3 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-red-600 transition">My Sales</button>
                             <button data-scope="all" class="scope-btn px-3 py-1.5 text-xs font-bold rounded-md text-slate-600 hover:bg-white hover:shadow-sm transition">All Sales</button>
                        </div>
                        
                        <div class="h-8 w-px bg-stone-200 mx-2"></div>

                        <button id="btn-export-csv" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            CSV
                        </button>
                        <button id="btn-print-report" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Print/PDF
                        </button>
                     </div>
                </div>
                
                <!-- Stat Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 remove-print-margin"> <!-- Added class for print styling -->
                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1" id="label-revenue">Revenue</div>
                        <div class="text-3xl font-black text-slate-800" id="report-revenue">...</div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1" id="label-profit">Net Profit</div>
                        <div class="text-3xl font-black text-red-600" id="report-second-metric">...</div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                         <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1" id="label-orders">Orders</div>
                        <div class="text-3xl font-black text-slate-800" id="report-orders">...</div>
                    </div>
                </div>

                <!-- Recent Sales List -->
                <div class="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col shadow-sm print:border-0">
                    <div class="p-4 border-b border-stone-200 font-bold text-slate-700 bg-stone-50/50 flex justify-between">
                        <span>Transactions Log</span>
                        <span class="text-xs text-slate-400 font-normal">Shows up to 100 recent records</span>
                    </div>
                    <div class="overflow-y-auto flex-1 p-0">
                         <table class="w-full text-left text-sm" id="report-table">
                            <thead class="bg-stone-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                                <tr>
                                    <th class="p-3 border-b border-stone-200">Date</th>
                                    <th class="p-3 border-b border-stone-200">Cashier</th>
                                    <th class="p-3 border-b border-stone-200">Payment</th>
                                    <th class="p-3 border-b border-stone-200 text-left pl-4">Items</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Total</th>
                                    <th class="p-3 border-b border-stone-200 text-right profit-col">Profit</th>
                                </tr>
                            </thead>
                            <tbody id="report-sales-list" class="divide-y divide-stone-100">
                                <!-- Sales Rows -->
                            </tbody>
                        </table>
                    </div>
                </div>

                 <!-- Employee Performance (Admin Only) -->
                <div id="admin-stats-container" class="hidden bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm mt-4">
                    <div class="p-4 border-b border-stone-200 font-bold text-slate-700 bg-stone-50/50">
                        Employee Performance
                    </div>
                    <div class="p-0 overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-stone-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th class="p-3 border-b border-stone-200">Employee</th>
                                    <th class="p-3 border-b border-stone-200 text-center">Orders</th>
                                    <th class="p-3 border-b border-stone-200 text-center">Items Sold</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody id="employee-stats-list" class="divide-y divide-stone-100"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI Toggle
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-white', 'shadow-sm', 'text-red-600');
                    b.classList.add('text-slate-600');
                });
                e.target.classList.add('bg-white', 'shadow-sm', 'text-red-600');
                e.target.classList.remove('text-slate-600');

            });
        });

        // Scope Toggle Listeners (Manager)
        document.querySelectorAll('.scope-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.scope-btn').forEach(b => {
                    b.classList.remove('bg-white', 'shadow-sm', 'text-red-600');
                    b.classList.add('text-slate-600');
                });
                e.target.classList.add('bg-white', 'shadow-sm', 'text-red-600');
                e.target.classList.remove('text-slate-600');

                // Re-run report with current time filter but new scope
                const currentFilter = document.querySelector('.filter-btn.text-red-600')?.dataset.filter || 'all';
                this.generateReport(currentFilter);
            });
        });

        document.getElementById('btn-export-csv').addEventListener('click', () => this.exportCSV());
        document.getElementById('btn-print-report').addEventListener('click', () => {
            window.print();
        });
    }

    async generateReport(filter = 'all') {
        const sales = await db.getAll('sales');
        let filteredSales = sales;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let label = "All Time";

        if (filter === 'today') {
            filteredSales = sales.filter(s => new Date(s.date).getTime() >= startOfDay);
            label = "Today";
        } else if (filter === 'week') {
            const startOfWeek = startOfDay - (6 * 24 * 60 * 60 * 1000); // 7 days ago
            filteredSales = sales.filter(s => new Date(s.date).getTime() >= startOfWeek);
            label = "Last 7 Days";
        } else if (filter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            filteredSales = sales.filter(s => new Date(s.date).getTime() >= startOfMonth);
            label = "This Month";
        } else if (filter === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
            filteredSales = sales.filter(s => new Date(s.date).getTime() >= startOfYear);
            label = "This Year";
        }

        document.getElementById('report-period-label').textContent = label;
        const user = JSON.parse(sessionStorage.getItem('pointify_user'));
        const isAdmin = user && user.role === 'admin';
        const isManager = user && user.role === 'manager';

        let managerScope = 'mine'; // Default for manager
        if (isManager) {
            document.getElementById('manager-scope-toggle').classList.remove('hidden');
            const activeScopeBtn = document.querySelector('.scope-btn.text-red-600');
            if (activeScopeBtn) managerScope = activeScopeBtn.dataset.scope;
        } else {
            document.getElementById('manager-scope-toggle').classList.add('hidden');
        }

        // 1. Filter Logic & Role Based UI Adjustments
        // Cashier OR (Manager AND Scope is 'mine')
        const isRestrictedView = (!isAdmin && !isManager) || (isManager && managerScope === 'mine');

        if (isRestrictedView && user) {
            // Restricted Logic (Cashier or Manager-My-Sales)
            filteredSales = filteredSales.filter(s => s.cashier === user.username);

            // Hide Restricted Time Filters (Only for Cashier, Manager can see all times? User said "my sales and trcstionlogs and all sales...". Let's assume Manager CAN see all times if they want, OR restrict times for consistency in "My Sales" mode. 
            // Request said: "manager reports section... give him features he can filter my sales... and all sales"
            // Usually "My Sales" acts like a cashier view. Let's keep filters unrestricted for Manager to be safe, or start restricted.
            // Let's Keep Time filters OPEN for Manager even in My Sales, unless user complains. Cashier gets them hidden.

            const btnYear = document.getElementById('btn-filter-year');
            const btnAll = document.getElementById('btn-filter-all');

            if (!isManager) {
                // Strict restrictions for Cashier
                if (btnYear) btnYear.classList.add('hidden');
                if (btnAll) btnAll.classList.add('hidden');
            } else {
                // Manager can see years/all even for "My Sales"
                if (btnYear) btnYear.classList.remove('hidden');
                if (btnAll) btnAll.classList.remove('hidden');
            }

            // Adjust Cards Metadata
            document.getElementById('label-revenue').textContent = "My Sales";
            document.getElementById('label-profit').textContent = "Items Sold";
            document.getElementById('label-orders').textContent = "My Orders";

            // Change color of second metric
            const metric2 = document.getElementById('report-second-metric');
            metric2.classList.remove('text-red-600');
            metric2.classList.add('text-blue-600');

        } else {
            // Admin Logic OR Manager-All-Sales
            const btnYear = document.getElementById('btn-filter-year');
            const btnAll = document.getElementById('btn-filter-all');
            if (btnYear) btnYear.classList.remove('hidden');
            if (btnAll) btnAll.classList.remove('hidden');

            document.getElementById('label-revenue').textContent = "Revenue";
            document.getElementById('label-profit').textContent = "Net Profit";
            document.getElementById('label-orders').textContent = "Orders";

            const metric2 = document.getElementById('report-second-metric');
            metric2.classList.add('text-red-600');
            metric2.classList.remove('text-blue-600');
        }

        this.currentData = filteredSales;

        // 2. Calculate Totals
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalOrders = filteredSales.length;

        // Metric 2 depends on view
        let metric2Value = 0;
        if (!isRestrictedView) {
            metric2Value = filteredSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);
            document.getElementById('report-second-metric').textContent = `${this.currencySymbol}${metric2Value.toFixed(2)}`;
        } else {
            // Calculate Total Items Sold
            metric2Value = filteredSales.reduce((sum, sale) => sum + sale.items.reduce((isum, i) => isum + i.qty, 0), 0);
            document.getElementById('report-second-metric').textContent = metric2Value;
        }

        // Apply to DOM
        document.getElementById('report-revenue').textContent = `${this.currencySymbol}${totalRevenue.toFixed(2)}`;
        document.getElementById('report-orders').textContent = totalOrders;

        // Render Table (Limit 100)
        const tbody = document.getElementById('report-sales-list');
        tbody.innerHTML = '';
        const sortedSales = filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);

        if (sortedSales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No sales found for this period.</td></tr>`;
        }

        // Hide Admin/Global Specifics
        const adminStatsContainer = document.getElementById('admin-stats-container');

        if (isRestrictedView) {
            const revCard = document.getElementById('report-revenue').parentElement;
            const profCard = document.getElementById('report-second-metric').parentElement;
            if (revCard) revCard.classList.remove('hidden');
            if (profCard) profCard.classList.remove('hidden');

            // Hide profit column in header
            document.querySelectorAll('.profit-col').forEach(el => el.classList.add('hidden'));

            if (adminStatsContainer) adminStatsContainer.classList.add('hidden');

        } else {
            const revCard = document.getElementById('report-revenue').parentElement;
            const profCard = document.getElementById('report-second-metric').parentElement;
            if (revCard) revCard.classList.remove('hidden');
            if (profCard) profCard.classList.remove('hidden');

            document.querySelectorAll('.profit-col').forEach(el => el.classList.remove('hidden'));

            // Employee Stats: Visible for Admin OR Manager-All-Sales
            if (adminStatsContainer) {
                adminStatsContainer.classList.remove('hidden');
                this.renderEmployeeStats(filteredSales);
            }
        }

        // Helper to format rows handles the Profit cell visibility based on isRestrictedView internally if we pass it, or we rely on the logic below.
        // Actually, the loop below uses 'isAdmin' for profit cell. We need to update that to 'isRestrictedView'.
        const showProfit = !isRestrictedView;

        sortedSales.forEach(sale => {
            const tr = document.createElement('tr');
            const date = new Date(sale.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric' });

            // Format Items List
            const itemsList = sale.items.map(i => {
                const itemPrice = (i.price - (i.discount || 0)).toFixed(2);
                return `
                <div class="flex justify-between gap-4 border-b border-stone-50 last:border-0 pb-1 mb-1 last:pb-0 last:mb-0">
                    <span class="font-medium text-slate-700">${i.name}</span>
                    <div class="text-right">
                        <span class="text-slate-500 text-xs">x${i.qty}</span>
                        <span class="text-slate-600 text-xs font-mono ml-1">@ ${this.currencySymbol}${itemPrice}</span>
                    </div>
                </div>
            `}).join('');

            const profitCell = showProfit
                ? `<td class="p-3 text-right font-bold text-green-600 align-top profit-col">${this.currencySymbol}${(sale.netProfit || 0).toFixed(2)}</td>`
                : `<td class="hidden profit-col"></td>`;

            tr.innerHTML = `
                <td class="p-3 text-slate-600 font-medium align-top whitespace-nowrap">${date}</td>
                <td class="p-3 text-slate-500 align-top">
                    ${sale.customer ? `<div class="font-bold text-slate-700 mb-1">${sale.customer}</div>` : ''}
                    <div class="text-xs">Cashier: ${sale.cashier || '-'}</div>
                </td>
                <td class="p-3 text-slate-600 font-bold text-xs align-top uppercase">
                    ${sale.paymentMethod || 'CASH'}
                </td>
                <td class="p-3 text-slate-500 text-xs align-top bg-slate-50 rounded p-2 border border-slate-100 min-w-[200px]">
                    ${itemsList}
                </td>
                <td class="p-3 text-right font-bold text-slate-800 align-top">${this.currencySymbol}${sale.total.toFixed(2)}</td>
                ${profitCell}
            `;
            tbody.appendChild(tr);
        });

    }

    renderEmployeeStats(sales) {
        const stats = {};

        sales.forEach(sale => {
            const cashier = sale.cashier || 'Unknown';
            if (!stats[cashier]) {
                stats[cashier] = { orders: 0, items: 0, revenue: 0 };
            }
            stats[cashier].orders++;
            stats[cashier].revenue += sale.total;
            stats[cashier].items += sale.items.reduce((sum, i) => sum + i.qty, 0);
        });

        const tbody = document.getElementById('employee-stats-list');
        tbody.innerHTML = '';

        Object.keys(stats).forEach(cashier => {
            const row = stats[cashier];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-medium text-slate-700">${cashier}</td>
                <td class="p-3 text-center text-slate-600">${row.orders}</td>
                <td class="p-3 text-center text-slate-600">${row.items}</td>
                <td class="p-3 text-right font-bold text-slate-800">${this.currencySymbol}${row.revenue.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    exportCSV() {
        if (!this.currentData || this.currentData.length === 0) {
            window.showToast('No data to export', 'error');
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Order ID,Cashier,Payment Method,Items Count,Total,Net Profit\n";

        // CSV Rows
        this.currentData.forEach(row => {
            const d = new Date(row.date);
            const dateStr = d.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');

            const items = row.items.reduce((acc, i) => acc + i.qty, 0);
            const payment = row.paymentMethod || 'CASH';
            csvContent += `${dateStr},${row.id || 'N/A'},${row.cashier},${payment},${items},${row.total.toFixed(2)},${(row.netProfit || 0).toFixed(2)}\n`;
        });

        // Download Trigger
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const reports = new ReportsModule();
window.reports = reports;
