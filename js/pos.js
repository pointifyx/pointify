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
            <div class="flex flex-col md:flex-row h-full md:h-[calc(100vh-6rem)] gap-4 relative">
                <!-- Left: Product Grid (Shown by default on Mobile) -->
                <div id="pos-panel-products" class="w-full md:flex-1 flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm h-[calc(100vh-9rem)] md:h-full relative">
                    <!-- Search Bar -->
                    <div class="p-4 border-b border-stone-200 bg-stone-50/50">
                        <div class="relative">
                            <svg class="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input type="text" id="pos-search" placeholder="Scan Barcode or Search..." class="w-full bg-white border border-stone-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none">
                        </div>
                    </div>
                    
                    <!-- Products Grid -->
                    <div id="pos-grid" class="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 content-start bg-[#FDFBF7] pb-24 md:pb-4">
                        <!-- Products injected here -->
                    </div>

                    <!-- Mobile Floating Cart Button -->
                    <div class="md:hidden absolute bottom-4 left-4 right-4">
                        <button id="mobile-cart-toggle" class="w-full bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center transform hover:scale-[1.02] transition">
                            <div class="flex items-center gap-2">
                                <div class="bg-red-600 text-xs font-bold px-2 py-0.5 rounded-full" id="mobile-cart-count">0</div>
                                <span class="font-bold text-sm">View Current Order</span>
                            </div>
                            <span class="font-mono font-bold text-lg" id="mobile-cart-total-btn">0.00</span>
                        </button>
                    </div>
                </div>

                <!-- Right: Cart (Hidden on Mobile initially) -->
                <div id="pos-panel-cart" class="hidden md:flex w-full md:w-96 bg-white md:rounded-xl border border-stone-200 flex-col h-full shadow-sm fixed inset-0 z-50 md:static md:inset-auto">
                    
                     <!-- Mobile Cart Header -->
                     <div class="md:hidden p-4 border-b border-stone-200 flex items-center gap-4 bg-white">
                        <button id="mobile-back-products" class="p-2 -ml-2 text-slate-600 hover:text-red-600">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <span class="font-bold text-lg text-slate-900">Current Order</span>
                     </div>

                    <div class="hidden md:flex p-4 border-b border-stone-200 font-bold text-lg justify-between items-center text-slate-800">
                        <span>Current Order</span>
                        <button id="clear-cart" class="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
                    </div>
                    
                    <!-- Mobile Clear Button (Injected in header for mobile really, but lets keep simple) -->
                     <div class="md:hidden px-4 pt-2 flex justify-end">
                        <button id="clear-cart-mobile" class="text-xs text-red-500 font-bold uppercase tracking-wider">Clear All</button>
                     </div>

                    <!-- Cart Items -->
                    <div id="cart-items" class="flex-1 overflow-y-auto p-2 space-y-2 bg-[#FDFBF7]">
                        <!-- Cart items here -->
                    </div>

                    <!-- Totals & Checkout -->
                    <div class="p-4 bg-stone-50 border-t border-stone-200 space-y-3">
                         <input type="text" id="customer-name" placeholder="Customer Name (Optional)" class="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 outline-none mb-2">
                         
                         <!-- Payment Method Selector -->
                         <div class="mb-2">
                             <label class="block text-xs font-bold text-slate-500 mb-1 uppercase">Payment Method</label>
                             <div class="flex flex-wrap gap-2" id="payment-methods-container">
                                 <!-- Dynamic Payment Buttons -->
                             </div>
                         </div>
                         
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
        `;

        this.renderPaymentButtons();

        // Bind Mobile Toggles
        document.getElementById('mobile-cart-toggle').addEventListener('click', () => {
            document.getElementById('pos-panel-products').classList.add('hidden');
            document.getElementById('pos-panel-cart').classList.remove('hidden', 'hidden');
            document.getElementById('pos-panel-cart').classList.add('flex');
        });

        document.getElementById('mobile-back-products').addEventListener('click', () => {
            document.getElementById('pos-panel-cart').classList.add('hidden');
            document.getElementById('pos-panel-cart').classList.remove('flex');
            document.getElementById('pos-panel-products').classList.remove('hidden');
        });

        const clearMobile = document.getElementById('clear-cart-mobile');
        if (clearMobile) {
            clearMobile.addEventListener('click', () => {
                if (confirm("Clear cart?")) {
                    this.cart = [];
                    this.renderCart();
                }
            });
        }
    }

    renderPaymentButtons() {
        const container = document.getElementById('payment-methods-container');
        if (!container) return;

        const containerParent = container.parentElement;
        // Ensure the parent label is visible if we have methods, or handled gracefully

        const country = this.settings.storeCountry || 'Kenya';
        const s = this.settings;
        let methods = [];

        // Always add CASH
        methods.push({ id: 'CASH', label: 'CASH', color: 'green' });

        if (country === 'Kenya') {
            if (s.mpesaPaybill || s.mpesaBuyGoods || s.mpesaAgent) {
                methods.push({ id: 'MPESA', label: 'M-PESA', color: 'blue' });
            }
        } else if (country === 'Somalia') {
            if (s.somaliaEVC) methods.push({ id: 'EVC Plus', label: 'EVC+', color: 'blue' });
            if (s.somaliaJeeb) methods.push({ id: 'Jeeb', label: 'Jeeb', color: 'purple' });
            if (s.somaliaEdahab) methods.push({ id: 'e-Dahab', label: 'e-Dahab', color: 'yellow' });
            if (s.somaliaSalaam) methods.push({ id: 'Salaam', label: 'Salaam', color: 'slate' });
            if (s.somaliaMerchant) methods.push({ id: 'Merchant', label: 'Merchant', color: 'red' });
        } else if (country === 'Uganda') {
            if (s.ugandaAirtel) methods.push({ id: 'Airtel Money', label: 'Airtel', color: 'red' });
            if (s.ugandaMTN) methods.push({ id: 'MTN MoMo', label: 'MTN', color: 'yellow' });
            if (s.ugandaOther) methods.push({ id: 'Other', label: 'Other', color: 'slate' });
        } else {
            // Others/Default
            methods.push({ id: 'Card', label: 'Card', color: 'blue' });
            methods.push({ id: 'Other', label: 'Other', color: 'slate' });
        }

        container.innerHTML = methods.map((m, index) => `
             <label class="cursor-pointer flex-1 min-w-[30%]">
                 <input type="radio" name="payment-method" value="${m.id}" ${index === 0 ? 'checked' : ''} class="peer sr-only">
                 <div class="text-center py-2 border border-stone-200 rounded text-xs font-bold text-slate-600 peer-checked:bg-${m.color}-50 peer-checked:text-${m.color}-700 peer-checked:border-${m.color}-200 transition hover:bg-stone-50">
                     ${m.label}
                 </div>
             </label>
        `).join('');
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

            // Integrity Check: Ensure discount doesn't exceed profit margin (Selling below cost)
            const costPerItem = item.costPrice || 0;
            const totalLinePrice = item.price * item.qty;
            const totalLineCost = costPerItem * item.qty;

            if (item.discount && (totalLinePrice - item.discount) <= totalLineCost) {
                const maxDiscount = Math.max(0, totalLinePrice - totalLineCost - 1); // Ensure at least 1 unit profit
                item.discount = maxDiscount;
                window.showToast(`Discount adjusted to protection limit`, 'info');
            }

            this.renderCart();
        }
    }

    renderCart() {
        const container = document.getElementById('cart-items');
        container.innerHTML = '';

        let subtotal = 0;
        let itemCount = 0;

        this.cart.forEach(item => {
            // New Logic: Discount is TOTAL off the line item
            const totalLinePrice = (item.price * item.qty);
            const discount = item.discount || 0;
            const itemTotal = totalLinePrice - discount;

            subtotal += itemTotal;
            itemCount += item.qty;

            const div = document.createElement('div');
            div.className = "flex items-center gap-3 bg-white p-3 rounded-lg border border-stone-200 hover:border-red-300 shadow-sm transition group";
            div.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="text-base font-bold text-slate-800 truncate mb-0.5">${item.name}</div>
                    <div class="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <span class="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600 font-bold">${item.qty} x ${this.settings.currencySymbol}${item.price}</span>
                        ${item.discount ? `<span class="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">-${this.settings.currencySymbol}${item.discount.toFixed(2)} Off</span>` : ''}
                    </div>
                </div>
                <div class="font-bold text-base text-slate-900 w-20 text-right font-mono">${this.settings.currencySymbol}${itemTotal.toFixed(2)}</div>
                
                <div class="flex items-center gap-2 ml-2">
                     <button class="w-9 h-9 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-sm font-bold btn-discount transition transform active:scale-95" title="Add Discount">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                     </button>
                     <div class="flex items-center bg-stone-100 rounded-lg p-1 gap-1 border border-stone-200">
                        <button class="w-8 h-8 rounded-md bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-stone-200 hover:border-red-200 flex items-center justify-center text-lg btn-minus font-bold transition shadow-sm active:scale-95">-</button>
                        <button class="w-8 h-8 rounded-md bg-white hover:bg-green-50 text-slate-600 hover:text-green-600 border border-stone-200 hover:border-green-200 flex items-center justify-center text-lg btn-plus font-bold transition shadow-sm active:scale-95">+</button>
                     </div>
                </div>
            `;

            div.querySelector('.btn-discount').onclick = () => this.promptDiscount(item);

            div.querySelector('.btn-minus').onclick = () => this.updateQty(item.id, -1);
            div.querySelector('.btn-plus').onclick = () => this.updateQty(item.id, 1);
            container.appendChild(div);
        });

        const formattedTotal = `${this.settings.currencySymbol}${subtotal.toFixed(2)}`;

        document.getElementById('cart-subtotal').textContent = formattedTotal;
        document.getElementById('cart-total').textContent = formattedTotal;
        document.getElementById('btn-charge-amount').textContent = formattedTotal;

        // Update Mobile Floating Button Stats
        const mobileCount = document.getElementById('mobile-cart-count');
        const mobileTotal = document.getElementById('mobile-cart-total-btn');
        if (mobileCount) mobileCount.textContent = itemCount;
        if (mobileTotal) mobileTotal.textContent = formattedTotal;

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

    promptDiscount(item) {
        const costPerItem = item.costPrice || 0;
        const totalLinePrice = item.price * item.qty;
        const totalLineCost = costPerItem * item.qty;
        const maxDiscount = totalLinePrice - totalLineCost - 1; // Leave 1 unit profit buffer? or just > cost

        const discountStr = prompt(`Enter TOTAL discount for ${item.qty}x ${item.name} (Max: ${maxDiscount.toFixed(2)}):`, item.discount || 0);
        if (discountStr === null) return;

        const discount = parseFloat(discountStr);
        if (isNaN(discount) || discount < 0) {
            window.showToast('Invalid discount amount', 'error');
            return;
        }

        // Validate: (Price * Qty) - Discount > (Cost * Qty)
        // User Requirement: "cant make discount of lessthan or equal the cost of item" (applied to total now)
        // Validate: (Price * Qty) - Discount > (Cost * Qty)
        // User Requirement: "cant make discount of lessthan or equal the cost of item" (applied to total now)

        if ((totalLinePrice - discount) <= totalLineCost) {
            window.showToast(`Discount too high! Selling price must be greater than Cost (${this.settings.currencySymbol}${totalLineCost.toFixed(2)})`, 'error');
            return;
        }

        item.discount = discount;
        this.renderCart();
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

        // Barcode Scanner/Keyboard Support (Enter Key)
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (!query) return;

                // 1. Try Exact Barcode Match first (Priority)
                const perfectMatch = this.products.find(p => p.barcode === query);
                if (perfectMatch) {
                    this.addToCart(perfectMatch);
                    searchInput.value = ''; // Clear for next scan
                    this.renderProductGrid(''); // Reset view
                    window.showToast('Item Scanned', 'success');
                    return;
                }

                // 2. If no barcode match, and only 1 filtered result exists, select it
                const filtered = this.products.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (p.barcode && p.barcode.includes(query))
                );

                if (filtered.length === 1) {
                    this.addToCart(filtered[0]);
                    searchInput.value = '';
                    this.renderProductGrid('');
                    return;
                }
            }
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


    }

    async processCheckout() {
        // Recalculate total to be safe
        const total = this.cart.reduce((sum, item) => {
            const lineTotal = (item.price * item.qty) - (item.discount || 0);
            return sum + lineTotal;
        }, 0);

        const customerName = document.getElementById('customer-name').value.trim() || 'Walk-in Customer';

        // Get Payment Method
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

        const saleData = {
            date: new Date(),
            items: this.cart,
            total: total,
            customer: customerName,
            cashier: JSON.parse(sessionStorage.getItem('pointify_user'))?.username || 'Unknown',
            paymentMethod: paymentMethod
        };

        try {
            await db.processSale(saleData, this.cart);
            window.showToast('Sale Completed Successfully!');
            this.generateReceipt(saleData);
            this.cart = [];
            this.renderCart();
            // Clear Customer Name for next sale
            document.getElementById('customer-name').value = '';
            await this.loadProducts(); // Reload stock
        } catch (error) {
            console.error(error);
            window.showToast('Transaction Failed', 'error');
        }
    }

    generateReceipt(sale) {
        const modal = document.getElementById('receipt-modal');
        const content = document.getElementById('receipt-content');
        const date = new Date(sale.date).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric' });

        const logoHtml = this.settings.storeLogo
            ? `<div class="text-center mb-2"><img src="${this.settings.storeLogo}" class="max-h-12 mx-auto filter grayscale"></div>`
            : '';

        const itemsHtml = sale.items.map(item => {
            const originalPrice = (item.price * item.qty).toFixed(2);
            const discountAmt = item.discount ? item.discount.toFixed(2) : '0.00';
            const finalPrice = ((item.price * item.qty) - (item.discount || 0)).toFixed(2);

            return `
            <div style="margin-bottom: 4px; border-bottom: 1px dotted #ddd; padding-bottom: 2px;">
                <div style="font-weight: bold;">${item.name}</div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333;">
                    <span>${item.qty} x ${item.price.toFixed(2)}</span>
                    <span>${originalPrice}</span>
                </div>
                ${item.discount ? `
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #e11d48;">
                    <span>Discount</span>
                    <span>-${discountAmt}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-top: 1px;">
                    <span>Item Total</span>
                    <span>${finalPrice}</span>
                </div>
            </div>
            `;
        }).join('');

        content.innerHTML = `
            <div style="font-family: 'Courier New', monospace; font-size: 12px; width: 100%; color: black;">
                ${logoHtml}
                <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 2px;">${this.settings.storeName}</div>
                <div style="text-align: center; margin-bottom: 8px;">
                    ${this.settings.storeAddress ? `<div>${this.settings.storeAddress}</div>` : ''}
                    ${this.settings.storePhone ? `<div>Tel: ${this.settings.storePhone}</div>` : ''}
                </div>

                <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
                    <div>${date}</div>
                    <div>Order: #${sale.id || 'NEW'}</div>
                    <div style="font-weight: bold; margin-top: 2px;">Cashier: ${sale.cashier.toUpperCase()}</div>
                    <div style="margin-top: 2px;">Customer: ${sale.customer || 'Walk-in'}</div>
                </div>
                
                <div style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;">
                    ${itemsHtml}
                </div>
                
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px;">
                    <span>TOTAL</span>
                    <span>${this.settings.currencySymbol}${sale.total.toFixed(2)}</span>
                </div>
                
                <div style="margin-top: 10px; border-top: 1px dashed #000; pt-2;">
                    <div style="font-weight: bold; font-size: 11px;">Payment: ${sale.paymentMethod}</div>
                    <div style="font-size: 10px; margin-top: 2px;">
                        ${this.getPaymentDetailsHtml(sale.paymentMethod)}
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 15px; font-size: 10px;">
                    Thank you for your shopping!
                     <div style="margin-top: 5px; font-size: 8px; color: #888;">Powered by Pointify Inc</div>
                    <div style="font-weight: bold; font-size: 12px; color: #000; margin-top: 4px;">::Need the sofware Contuct us +254791262422</div>
                </div>
            </div>
            
            <div class="mt-6 flex gap-3 no-print">
                <button onclick="window.print()" class="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-black transition">Print Receipt</button>
                <button id="close-receipt-btn" class="flex-1 bg-stone-100 text-slate-800 py-3 rounded-lg font-bold hover:bg-stone-200 transition">Close</button>
            </div>
        `;

        modal.classList.remove('hidden');

        // Dynamic bind for the specific button created above
        document.getElementById('close-receipt-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    getPaymentDetailsHtml(method) {
        const s = this.settings;
        let html = '';

        if (method === 'MPESA') {
            if (s.mpesaPaybill) html += `<div>Paybill: <b>${s.mpesaPaybill}</b></div>`;
            if (s.mpesaAccount) html += `<div>Account: <b>${s.mpesaAccount}</b></div>`;
            if (s.mpesaBuyGoods) html += `<div>Buy Goods: <b>${s.mpesaBuyGoods}</b></div>`;
            if (s.mpesaAgent && s.mpesaStoreNumber) {
                html += `<div>Agent No: <b>${s.mpesaAgent}</b></div>`;
                html += `<div>Store No: <b>${s.mpesaStoreNumber}</b></div>`;
            } else if (s.mpesaAgent) {
                html += `<div>Agent No: <b>${s.mpesaAgent}</b></div>`;
            }
        }
        else if (method === 'EVC Plus' && s.somaliaEVC) html += `<div>EVC+: <b>${s.somaliaEVC}</b></div>`;
        else if (method === 'Jeeb' && s.somaliaJeeb) html += `<div>Jeeb: <b>${s.somaliaJeeb}</b></div>`;
        else if (method === 'e-Dahab' && s.somaliaEdahab) html += `<div>e-Dahab: <b>${s.somaliaEdahab}</b></div>`;
        else if (method === 'Salaam' && s.somaliaSalaam) html += `<div>Salaam Acc: <b>${s.somaliaSalaam}</b></div>`;
        else if (method === 'Merchant' && s.somaliaMerchant) html += `<div>Merchant: <b>${s.somaliaMerchant}</b></div>`;
        else if (method === 'Airtel Money' && s.ugandaAirtel) html += `<div>Airtel Merch: <b>${s.ugandaAirtel}</b></div>`;
        else if (method === 'MTN MoMo' && s.ugandaMTN) html += `<div>MTN Merch: <b>${s.ugandaMTN}</b></div>`;
        else if (method === 'Other' && s.ugandaOther) html += `<div>Info: <b>${s.ugandaOther}</b></div>`;

        return html;
    }
}

export const pos = new POSModule();
window.posModule = pos;
