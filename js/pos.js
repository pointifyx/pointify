import { db } from './db.js';

class POSModule {
    constructor() {
        this.container = document.getElementById('view-pos');
        this.cart = [];
        this.products = [];
        this.settings = { currencySymbol: '$', storeName: 'Pointify' };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.renderLayout();
        await this.loadProducts();
        this.bindEvents();
    }

    async loadSettings() {
        const storedSettings = await db.getAll('settings');
        storedSettings.forEach(s => this.settings[s.key] = s.value);
    }

    async loadProducts() {
        this.products = await db.getAll('products');
        this.renderProductGrid();
    }

    renderLayout() {
        this.container.innerHTML = `
            <div class="flex flex-col md:flex-row h-screen max-h-[calc(100vh-6rem)] gap-4">
                <!-- Left: Product Grid -->
                <div class="flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                    <!-- Search Bar -->
                    <div class="p-4 border-b border-stone-200 bg-stone-50/50">
                        <div class="relative">
                            <svg class="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" id="pos-search" placeholder="Scan Barcode or Search Product..." class="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none">
                        </div>
                    </div>
                    
                    <!-- Products Grid -->
                    <div id="pos-grid" class="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start bg-[#FDFBF7]">
                        <!-- Products injected here -->
                    </div>
                </div>

                <!-- Right: Cart -->
                <div class="w-full md:w-96 bg-white rounded-xl border border-stone-200 flex flex-col h-full shadow-sm">
                    <div class="p-4 border-b border-stone-200 font-bold text-lg flex justify-between items-center text-slate-800">
                        <span>Current Order</span>
                        <button id="clear-cart" class="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                    </div>

                    <!-- Cart Items -->
                    <div id="cart-items" class="flex-1 overflow-y-auto p-2 space-y-2 bg-[#FDFBF7]">
                        <!-- Cart items here -->
                    </div>

                    <!-- Totals & Checkout -->
                    <div class="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
                         <div class="flex justify-between text-slate-500 text-sm">
                            <span>Subtotal</span>
                            <span id="cart-subtotal" class="font-mono text-slate-800">0.00</span>
                        </div>
                         <div class="flex justify-between text-slate-900 font-bold text-xl">
                            <span>Total</span>
                            <span id="cart-total" class="font-mono text-red-600">0.00</span>
                        </div>
                        <button id="btn-checkout" class="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-lg transition shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            Charge <span id="btn-charge-amount">0.00</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Receipt Modal -->
            <div id="receipt-modal" class="fixed inset-0 z-50 bg-black/50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
                <div class="bg-white text-black p-0 rounded w-80 max-h-[90vh] overflow-y-auto font-mono text-sm relative shadow-2xl">
                     <button id="close-receipt" class="absolute top-2 right-2 text-gray-500 hover:text-black">✖</button>
                    <div id="receipt-content" class="p-4"></div>
                    <div class="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 no-print">
                        <button onclick="window.print()" class="flex-1 bg-black text-white py-2 rounded font-bold hover:bg-gray-800">Print</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductGrid(searchTerm = '') {
        const grid = document.getElementById('pos-grid');
        grid.innerHTML = '';

        const filtered = this.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 italic">No products found</div>`;
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white hover:shadow-lg p-3 rounded-lg cursor-pointer transition flex flex-col gap-2 group border border-stone-200 hover:border-red-400";

            const imgHtml = p.image
                ? `<div class="h-24 w-full bg-cover bg-center rounded bg-stone-100" style="background-image: url('${p.image}')"></div>`
                : `<div class="h-24 w-full bg-stone-100 rounded flex items-center justify-center text-slate-400 text-xs font-bold">NO IMG</div>`;

            card.innerHTML = `
                ${imgHtml}
                <div class="flex-1">
                    <div class="font-medium text-sm truncate text-slate-700 group-hover:text-red-700 transition">${p.name}</div>
                    <div class="text-red-600 font-bold mt-1 text-sm">${this.settings.currencySymbol}${parseFloat(p.price).toFixed(2)}</div>
                </div>
                <!-- Stock Indicator -->
                <div class="text-[10px] text-slate-400 font-medium">Stock: ${p.stock}</div>
             `;

            card.addEventListener('click', () => this.addToCart(p));
            grid.appendChild(card);
        });
    }

    addToCart(product) {
        if (product.stock <= 0) {
            window.showToast('Out of Stock!', 'error');
            return;
        }

        const existing = this.cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.qty >= product.stock) {
                window.showToast('Max stock reached', 'error');
                return;
            }
            existing.qty++;
        } else {
            this.cart.push({ ...product, qty: 1 });
        }
        this.renderCart();
    }

    removeFromCart(id) {
        this.cart = this.cart.filter(item => item.id !== id);
        this.renderCart();
    }

    updateQty(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (!item) return;

        const newQty = item.qty + delta;

        if (newQty <= 0) {
            this.removeFromCart(id);
        } else if (newQty > item.stock) {
            window.showToast('Max stock reached', 'error');
        } else {
            item.qty = newQty;
            this.renderCart();
        }
    }

    renderCart() {
        const container = document.getElementById('cart-items');
        container.innerHTML = '';

        let subtotal = 0;

        this.cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;

            const div = document.createElement('div');
            div.className = "flex items-center gap-2 bg-white p-2.5 rounded border border-stone-100 hover:border-red-200 shadow-sm transition group";
            div.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-700 truncate">${item.name}</div>
                    <div class="text-xs text-slate-500 font-mono">${this.settings.currencySymbol}${item.price} x ${item.qty}</div>
                </div>
                <div class="font-bold text-sm text-red-600 w-16 text-right font-mono">${this.settings.currencySymbol}${itemTotal.toFixed(2)}</div>
                
                <div class="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition">
                     <button class="w-6 h-6 rounded bg-stone-200 hover:bg-stone-300 text-slate-600 flex items-center justify-center text-xs btn-minus font-bold">-</button>
                     <button class="w-6 h-6 rounded bg-stone-200 hover:bg-stone-300 text-slate-600 flex items-center justify-center text-xs btn-plus font-bold">+</button>
                </div>
            `;

            div.querySelector('.btn-minus').onclick = () => this.updateQty(item.id, -1);
            div.querySelector('.btn-plus').onclick = () => this.updateQty(item.id, 1);
            container.appendChild(div);
        });

        document.getElementById('cart-subtotal').textContent = `${this.settings.currencySymbol}${subtotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `${this.settings.currencySymbol}${subtotal.toFixed(2)}`;
        document.getElementById('btn-charge-amount').textContent = `${this.settings.currencySymbol}${subtotal.toFixed(2)}`;

        const checkoutBtn = document.getElementById('btn-checkout');
        if (this.cart.length === 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    cleanPrice(val) {
        return parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
    }

    bindEvents() {
        // Search Listener
        const searchInput = document.getElementById('pos-search');
        let debounce;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                // Check if exact match exists (Barcode scanner usually sends CR at end, acting like enter or fast input)
                const val = e.target.value.trim();
                const exactMatch = this.products.find(p => p.barcode === val);

                if (exactMatch) {
                    this.addToCart(exactMatch);
                    e.target.value = ''; // Clear after scan
                    this.renderProductGrid('');
                } else {
                    this.renderProductGrid(val);
                }
            }, 300);
        });

        document.getElementById('clear-cart').addEventListener('click', () => {
            if (confirm("Clear cart?")) {
                this.cart = [];
                this.renderCart();
            }
        });

        document.getElementById('btn-checkout').addEventListener('click', async () => {
            if (this.cart.length === 0) return;
            await this.processCheckout();
        });

        document.getElementById('close-receipt').addEventListener('click', () => {
            document.getElementById('receipt-modal').classList.add('hidden');
        });
    }

    async processCheckout() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        const saleData = {
            date: new Date(),
            items: this.cart,
            total: total,
            cashier: JSON.parse(sessionStorage.getItem('pointify_user'))?.username || 'Unknown',
            paymentMethod: 'CASH' // Simplified for MVP
        };

        try {
            await db.processSale(saleData, this.cart);
            window.showToast('Sale Completed Successfully!');
            this.generateReceipt(saleData);
            this.cart = [];
            this.renderCart();
            await this.loadProducts(); // Reload stock
        } catch (error) {
            console.error(error);
            window.showToast('Transaction Failed', 'error');
        }
    }

    generateReceipt(sale) {
        const modal = document.getElementById('receipt-modal');
        const content = document.getElementById('receipt-content');
        const date = new Date(sale.date).toLocaleString();

        const logoHtml = this.settings.storeLogo
            ? `<div class="text-center mb-4"><img src="${this.settings.storeLogo}" class="max-h-16 mx-auto"></div>`
            : '';

        const itemsHtml = sale.items.map(item => `
            <div class="flex justify-between mb-1">
                <span>${item.name} <span class="text-gray-500">x${item.qty}</span></span>
                <span>${this.settings.currencySymbol}${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        content.innerHTML = `
            ${logoHtml}
            <div class="text-center font-bold text-lg mb-1 uppercase">${this.settings.storeName}</div>
            <div class="text-center text-xs text-gray-500 mb-4">${date}<br>Order #${sale.id || 'NEW'}</div>
            
            <div class="border-t border-b border-dashed border-gray-300 py-2 my-2 space-y-1">
                ${itemsHtml}
            </div>
            
            <div class="flex justify-between font-bold text-base mt-2">
                <span>TOTAL</span>
                <span>${this.settings.currencySymbol}${sale.total.toFixed(2)}</span>
            </div>
            <div class="text-center text-xs text-gray-400 mt-4">Thank you for your business!</div>
        `;

        modal.classList.remove('hidden');
    }
}

export const pos = new POSModule();
