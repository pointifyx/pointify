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
                     
                     <div class="flex flex-wrap gap-2 items-center">
                        <div class="relative">
                            <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" id="report-item-search" placeholder="Search Item..." class="w-40 md:w-56 bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-500 transition">
                        </div>

                        <div class="h-8 w-px bg-stone-200 mx-2"></div>

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

                <!-- Payment Method Breakdown (Admin/Manager) -->
                <div id="payment-summary-container" class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-8">
                     <div class="flex-1">
                        <h3 class="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Payment Summary</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                                <div class="text-xs font-bold text-green-700 uppercase mb-1">Total Cash</div>
                                <div class="text-xl font-black text-green-800" id="summary-cash">...</div>
                            </div>
                            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div class="text-xs font-bold text-blue-700 uppercase mb-1">Total Electronic</div>
                                <div class="text-xl font-black text-blue-800" id="summary-electronic">...</div>
                            </div>
                        </div>
                     </div>
                     <div class="flex-1 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-8">
                        <h3 class="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Detailed Breakdown</h3>
                        <div class="space-y-2" id="summary-list">
                            <!-- Injected JS -->
                        </div>
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
                                    <th class="p-3 border-b border-stone-200">Customer</th>
                                    <th class="p-3 border-b border-stone-200">Payment</th>
                                    <th class="p-3 border-b border-stone-200">Item</th>
                                    <th class="p-3 border-b border-stone-200 text-center">Qty</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Price</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Discount</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Total</th>
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

                // Apply filter
                const filter = e.target.dataset.filter;
                this.generateReport(filter);
            });
        });

        // Search Input Listener
        const searchInput = document.getElementById('report-item-search');
        let debounce;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                const currentFilter = document.querySelector('.filter-btn.text-red-600')?.dataset.filter || 'all';
                this.generateReport(currentFilter);
            }, 300);
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
        // Search Term
        const itemSearch = document.getElementById('report-item-search').value.trim().toLowerCase();

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

        // 2. Calculate Totals (With Item Filter)
        let totalRevenue = 0;
        let metric2Value = 0; // Net Profit or Items Sold
        let totalOrders = 0;

        // Stats placeholders if item filter is on
        let filteredStats = {};
        const matchedOrders = new Set();

        filteredSales.forEach(sale => {
            let saleRevenue = 0;
            let saleProfit = 0;
            let saleItemsCount = 0;
            let hasMatch = false;

            sale.items.forEach(item => {
                // SEARCH FILTER LOGIC
                if (itemSearch && !item.name.toLowerCase().includes(itemSearch)) {
                    return; // Skip this item line
                }

                hasMatch = true;

                // Calculations
                const itemTotal = (item.price * item.qty) - (item.discount || 0);
                const itemCost = (item.costPrice || 0) * item.qty;
                const itemProfit = itemTotal - itemCost;

                saleRevenue += itemTotal;
                saleProfit += itemProfit;
                saleItemsCount += item.qty;

                // Track Employee performance for THIS item
                const cashier = sale.cashier || 'Unknown';
                if (!filteredStats[cashier]) filteredStats[cashier] = { orders: 0, items: 0, revenue: 0 };

                filteredStats[cashier].items += item.qty;
                filteredStats[cashier].revenue += itemTotal;
            });

            if (hasMatch) {
                totalRevenue += saleRevenue;
                // Metric 2 Logic
                if (!isRestrictedView) {
                    metric2Value += saleProfit;
                } else {
                    metric2Value += saleItemsCount;
                }
                matchedOrders.add(sale.id);

                // For employee stats, we only increment order count once per valid sale
                if (filteredStats[sale.cashier]) {
                    filteredStats[sale.cashier].orders++;
                }
            }
        });

        totalOrders = matchedOrders.size;

        // Apply to DOM
        document.getElementById('report-revenue').textContent = `${this.currencySymbol}${totalRevenue.toFixed(2)}`;
        document.getElementById('report-orders').textContent = totalOrders;

        if (!isRestrictedView) {
            document.getElementById('report-second-metric').textContent = `${this.currencySymbol}${metric2Value.toFixed(2)}`;
        } else {
            document.getElementById('report-second-metric').textContent = metric2Value;
        }

        // 3. Payment Breakdown Calculation
        const paymentStats = {
            cash: 0,
            electronic: 0,
            methods: {}
        };

        filteredSales.forEach(sale => {
            const method = sale.paymentMethod || 'CASH';
            const amount = sale.total;

            if (!paymentStats.methods[method]) paymentStats.methods[method] = 0;
            paymentStats.methods[method] += amount;

            if (method === 'CASH') {
                paymentStats.cash += amount;
            } else {
                paymentStats.electronic += amount;
            }
        });

        // Render Summary
        const container = document.getElementById('payment-summary-container');
        // Hide Payment Breakdown if searching for specific item to avoid confusion
        if (itemSearch) {
            if (container) container.classList.add('hidden');
        } else if (container) {
            // Visibility: Only visible if NOT restricted, or if Manager wants to see it?
            // "i need the reports setion of manager and admin add the calcuter"
            if (isRestrictedView && !isManager) {
                container.classList.add('hidden');
            } else {
                container.classList.remove('hidden'); // Admin & Manager see it

                document.getElementById('summary-cash').textContent = `${this.currencySymbol}${paymentStats.cash.toFixed(2)}`;
                document.getElementById('summary-electronic').textContent = `${this.currencySymbol}${paymentStats.electronic.toFixed(2)}`;

                const list = document.getElementById('summary-list');
                list.innerHTML = '';

                Object.keys(paymentStats.methods).forEach(method => {
                    const amt = paymentStats.methods[method];
                    const percent = totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(1) : 0;

                    list.innerHTML += `
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-slate-600">${method}</span>
                            <div class="flex items-center gap-3">
                                <span class="text-xs text-slate-400 font-mono bg-slate-50 px-1 rounded">${percent}%</span>
                                <span class="font-bold text-slate-800">${this.currencySymbol}${amt.toFixed(2)}</span>
                            </div>
                        </div>
                    `;
                });
            }
        }

        // Render Table (Limit 100 recent entries logic needs adjustment for line items)
        const tbody = document.getElementById('report-sales-list');
        tbody.innerHTML = '';

        // Sort sales by date first
        const sortedSales = filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Flatten to Line Items for Table Display
        // We want 100 line items max to prevent lag, or maybe 50 sales worth? 
        // Let's grab first 50 sales and show all their items.
        const recentSales = sortedSales.slice(0, 50);

        if (recentSales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 italic">No sales found for this period.</td></tr>`;
        }

        // Hide Admin/Global Specifics
        const adminStatsContainer = document.getElementById('admin-stats-container');

        if (isRestrictedView) {
            if (adminStatsContainer) adminStatsContainer.classList.add('hidden');
        } else {
            // Employee Stats: Visible for Admin OR Manager-All-Sales
            if (adminStatsContainer) {
                adminStatsContainer.classList.remove('hidden');
                if (itemSearch) {
                    this.renderEmployeeStatsFromObj(filteredStats);
                } else {
                    this.renderEmployeeStats(filteredSales);
                }
            }
        }

        recentSales.forEach(sale => {
            const dateObj = new Date(sale.date);
            const date = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            sale.items.forEach(item => {
                // FILTER TABLE ROWS
                if (itemSearch && !item.name.toLowerCase().includes(itemSearch)) {
                    return;
                }
                const tr = document.createElement('tr');
                const unitPrice = item.price;
                // DISCOUNT FIX: Discount is now stored as TOTAL for the line, not per item.
                // Display it directly.
                const discount = item.discount || 0;
                const lineTotal = (unitPrice * item.qty) - discount;

                // User Requested Columns:
                // Date, Cashier, Customer, Payment, Item, Qty, Price, Discount, Total

                tr.innerHTML = `
                    <td class="p-3 text-slate-600 font-medium whitespace-nowrap align-middle">
                        <div>${date}</div>
                        <div class="text-xs text-slate-400">${time}</div>
                    </td>
                    <td class="p-3 text-slate-600 align-middle">${sale.cashier || '-'}</td>
                    <td class="p-3 text-slate-600 align-middle">${sale.customer || '-'}</td>
                    <td class="p-3 text-slate-600 font-bold text-xs align-middle uppercase">${sale.paymentMethod || 'CASH'}</td>
                    <td class="p-3 text-slate-700 font-bold align-middle">${item.name}</td>
                    <td class="p-3 text-center text-slate-600 align-middle">${item.qty}x</td>
                    <td class="p-3 text-right text-slate-600 font-mono align-middle">${this.currencySymbol}${unitPrice.toFixed(2)}</td>
                    <td class="p-3 text-right text-red-500 font-mono align-middle">${discount > 0 ? this.currencySymbol + discount.toFixed(2) : '-'}</td>
                    <td class="p-3 text-right text-slate-800 font-bold font-mono align-middle">${this.currencySymbol || '$'}${lineTotal.toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
            });
        });

    }

    renderEmployeeStatsFromObj(stats) {
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
