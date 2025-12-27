import { db } from './db.js';

class ReportsModule {
    constructor() {
        this.container = document.getElementById('view-reports');
        this.init();
    }

    async init() {
        this.renderLayout();
        await this.generateReport();
        // Refresh functionality
        document.getElementById('refresh-reports')?.addEventListener('click', () => this.generateReport());
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="flex flex-col h-full space-y-6">
                <div class="flex justify-between items-center">
                     <h2 class="text-2xl font-bold text-slate-800">Financial Reports</h2>
                     <button id="refresh-reports" class="bg-white border border-stone-200 hover:bg-stone-50 px-3 py-1.5 rounded text-sm text-slate-600 font-medium transition shadow-sm">Refresh Data</button>
                </div>
                
                <!-- Stat Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</div>
                        <div class="text-3xl font-black text-slate-800" id="report-revenue">...</div>
                        <div class="text-xs text-green-600 font-bold mt-2 bg-green-50 inline-block px-2 py-1 rounded w-max">Gross Sales</div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                        <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Net Profit</div>
                        <div class="text-3xl font-black text-red-600" id="report-profit">...</div>
                        <div class="text-xs text-red-600 font-bold mt-2 bg-red-50 inline-block px-2 py-1 rounded w-max">After Cost of Goods</div>
                    </div>

                    <div class="bg-white p-6 rounded-xl border border-stone-200 flex flex-col justify-between shadow-sm">
                         <div class="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Total Orders</div>
                        <div class="text-3xl font-black text-slate-800" id="report-orders">...</div>
                        <div class="text-xs text-slate-500 mt-2 font-medium">Completed Transactions</div>
                    </div>
                </div>

                <!-- Recent Sales List -->
                <div class="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col shadow-sm">
                    <div class="p-4 border-b border-stone-200 font-bold text-slate-700 bg-stone-50/50">Recent Transactions</div>
                    <div class="overflow-y-auto flex-1 p-0">
                         <table class="w-full text-left text-sm">
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

    async generateReport() {
        // Fetch all sales
        const sales = await db.getAll('sales');

        // Calculate Totals
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);
        const totalOrders = sales.length;

        // Apply to DOM
        document.getElementById('report-revenue').textContent = totalRevenue.toFixed(2);
        document.getElementById('report-profit').textContent = totalProfit.toFixed(2);
        document.getElementById('report-orders').textContent = totalOrders;

        // Render Table (Last 50 sales)
        const tbody = document.getElementById('report-sales-list');
        tbody.innerHTML = '';

        // Sort by date desc
        const sortedSales = sales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

        if (sortedSales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No sales records found.</td></tr>`;
            return;
        }

        sortedSales.forEach(sale => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-red-50/30 transition";
            const date = new Date(sale.date).toLocaleDateString() + ' ' + new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            tr.innerHTML = `
                <td class="p-3 text-slate-600 whitespace-nowrap font-medium">${date}</td>
                <td class="p-3 text-slate-500">${sale.cashier || '-'}</td>
                <td class="p-3 text-right text-slate-500">${sale.items.reduce((acc, i) => acc + i.qty, 0)}</td>
                <td class="p-3 text-right font-bold text-slate-800">${sale.total.toFixed(2)}</td>
                <td class="p-3 text-right font-bold text-green-600">${(sale.netProfit || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

export const reports = new ReportsModule();
