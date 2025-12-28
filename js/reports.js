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
                            <button data-filter="year" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md hover:bg-white hover:shadow-sm transition text-slate-600">This Year</button>
                            <button data-filter="all" class="filter-btn px-3 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-red-600">All</button>
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
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Revenue</div>
                        <div class="text-3xl font-black text-slate-800" id="report-revenue">...</div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Net Profit</div>
                        <div class="text-3xl font-black text-red-600" id="report-profit">...</div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                         <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Orders</div>
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
                                    <th class="p-3 border-b border-stone-200 text-right">Items</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Total</th>
                                    <th class="p-3 border-b border-stone-200 text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody id="report-sales-list" class="divide-y divide-stone-100">
                                <!-- Sales Rows -->
                            </tbody>
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

                this.generateReport(e.target.dataset.filter);
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
        this.currentData = filteredSales; // Store for export

        // Calculate Totals
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);
        const totalOrders = filteredSales.length;

        // Apply to DOM
        document.getElementById('report-revenue').textContent = totalRevenue.toFixed(2);
        document.getElementById('report-profit').textContent = totalProfit.toFixed(2);
        document.getElementById('report-orders').textContent = totalOrders;

        // Render Table (Limit 100)
        const tbody = document.getElementById('report-sales-list');
        tbody.innerHTML = '';
        const sortedSales = filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);

        if (sortedSales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No sales found for this period.</td></tr>`;
            return;
        }

        sortedSales.forEach(sale => {
            const tr = document.createElement('tr');
            const date = new Date(sale.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric' });

            tr.innerHTML = `
                <td class="p-3 text-slate-600 whitespace-nowrap font-medium">${date}</td>
                <td class="p-3 text-slate-500">${sale.cashier || '-'}</td>
                <td class="p-3 text-right text-slate-500">${sale.items.reduce((acc, i) => acc + i.qty, 0)}</td>
                <td class="p-3 text-right font-bold text-slate-800">${this.currencySymbol}${sale.total.toFixed(2)}</td>
                <td class="p-3 text-right font-bold text-green-600">${this.currencySymbol}${(sale.netProfit || 0).toFixed(2)}</td>
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
        csvContent += "Date,Order ID,Cashier,Items Count,Total,Net Profit\n";

        // CSV Rows
        this.currentData.forEach(row => {
            const date = new Date(row.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric' }).replace(',', '');
            const items = row.items.reduce((acc, i) => acc + i.qty, 0);
            csvContent += `${date},${row.id || 'N/A'},${row.cashier},${items},${row.total},${row.netProfit}\n`;
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
