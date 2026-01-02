import { db } from './db.js';

class SettingsModule {
    constructor() {
        this.container = document.getElementById('view-settings');
        this.config = {
            storeName: 'My Store',
            currencySymbol: '$',
            currencyCode: 'USD',
            storeLogo: null, // Base64
            storeCountry: 'Kenya', // Default: Kenya, Somalia, Uganda, Others

            // Kenya (M-Pesa)
            mpesaPaybill: '',
            mpesaAccount: '',
            mpesaBuyGoods: '',
            // Kenya (M-Pesa)
            mpesaPaybill: '',
            mpesaAccount: '',
            mpesaBuyGoods: '',
            mpesaAgent: '',
            mpesaStoreNumber: '', // New Field for Withdrawal Store No

            // Somalia (EVC, Jeeb, e-Dahab, Salaam)
            somaliaEVC: '',
            somaliaJeeb: '',
            somaliaEdahab: '',
            somaliaSalaam: '',
            somaliaMerchant: '',

            // Uganda (Airtel, MTN)
            ugandaAirtel: '',
            ugandaMTN: '',
            ugandaOther: ''
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.render();
        this.bindEvents();
    }

    async loadSettings() {
        const settings = await db.getAll('settings');
        settings.forEach(setting => {
            this.config[setting.key] = setting.value;
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- General Settings -->
                <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Store Configuration
                    </h2>
                    
                    <form id="settings-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-500 mb-1">Store Name</label>
                            <input type="text" id="setting-name" value="${this.config.storeName}" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                        </div>
                         <!-- Contact Info -->
                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Store Phone</label>
                                <input type="text" id="setting-phone" value="${this.config.storePhone || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                            </div>
                             <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Store Address</label>
                                <input type="text" id="setting-address" value="${this.config.storeAddress || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Currency</label>
                                <select id="setting-currency-select" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                                    <option value="USD|$" ${this.config.currencyCode === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="KES|Ksh" ${this.config.currencyCode === 'KES' ? 'selected' : ''}>Kenya Shilling (Ksh)</option>
                                    <option value="UGX|USh" ${this.config.currencyCode === 'UGX' ? 'selected' : ''}>Uganda Shilling (USh)</option>
                                    <option value="TZS|TSh" ${this.config.currencyCode === 'TZS' ? 'selected' : ''}>Tanzania Shilling (TSh)</option>
                                    <option value="SOS|Ssh" ${this.config.currencyCode === 'SOS' ? 'selected' : ''}>Somali Shilling (Ssh)</option>
                                    <option value="EUR|€" ${this.config.currencyCode === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                                    <option value="GBP|£" ${this.config.currencyCode === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
                                    <option value="Custom|Custom" ${(this.config.currencyCode !== 'USD' && this.config.currencyCode !== 'KES' && this.config.currencyCode !== 'UGX' && this.config.currencyCode !== 'TZS' && this.config.currencyCode !== 'SOS' && this.config.currencyCode !== 'EUR' && this.config.currencyCode !== 'GBP') ? 'selected' : ''}>Custom</option>
                                </select>
                            </div>
                             <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Symbol (Auto)</label>
                                <input type="text" id="setting-currency-symbol" value="${this.config.currencySymbol}" class="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-600 outline-none font-medium" readonly>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Country</label>
                                <select id="setting-country" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                                    <option value="Kenya" ${this.config.storeCountry === 'Kenya' ? 'selected' : ''}>Kenya</option>
                                    <option value="Somalia" ${this.config.storeCountry === 'Somalia' ? 'selected' : ''}>Somalia</option>
                                    <option value="Uganda" ${this.config.storeCountry === 'Uganda' ? 'selected' : ''}>Uganda</option>
                                    <option value="Others" ${this.config.storeCountry === 'Others' ? 'selected' : ''}>Others</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Currency Code</label>
                                <input type="text" id="setting-currency-code" value="${this.config.currencyCode}" class="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-600 outline-none font-medium" readonly>
                            </div>
                        </div>
                        
                        <!-- Multi-Country Electronic Money Settings -->
                        <div class="border-t border-stone-100 pt-4 mt-2">
                            <h3 class="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Electronic Money Configuration</h3>
                            
                            <!-- KENYA -->
                            <div id="fields-kenya" class="country-fields ${this.config.storeCountry !== 'Kenya' ? 'hidden' : ''} space-y-6">
                                
                                <!-- 1. Buy Goods Section -->
                                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 class="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                                        Option 1: Buy Goods (Till Number)
                                    </h4>
                                    <div>
                                        <label class="block text-xs font-bold text-green-700 mb-1">Buy Goods / Till No.</label>
                                        <input type="text" id="setting-buygoods" value="${this.config.mpesaBuyGoods || ''}" placeholder="e.g. 123456" class="w-full bg-white border border-green-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-green-500 outline-none font-medium placeholder-green-300">
                                    </div>
                                </div>

                                <!-- 2. Paybill Section -->
                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 class="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                        Option 2: Paybill
                                    </h4>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-bold text-blue-700 mb-1">Paybill Number</label>
                                            <input type="text" id="setting-paybill" value="${this.config.mpesaPaybill || ''}" placeholder="e.g. 247247" class="w-full bg-white border border-blue-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-blue-300">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-blue-700 mb-1">Account No.</label>
                                            <input type="text" id="setting-paybill-acc" value="${this.config.mpesaAccount || ''}" placeholder="e.g. Store123" class="w-full bg-white border border-blue-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder-blue-300">
                                        </div>
                                    </div>
                                </div>

                                <!-- 3. Withdrawal Section -->
                                <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 class="font-bold text-purple-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        Option 3: Agency Withdrawal
                                    </h4>
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-xs font-bold text-purple-700 mb-1">Agent Number</label>
                                            <input type="text" id="setting-agent" value="${this.config.mpesaAgent || ''}" placeholder="e.g. 987654" class="w-full bg-white border border-purple-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none font-medium placeholder-purple-300">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-purple-700 mb-1">Store Number</label>
                                            <input type="text" id="setting-store-no" value="${this.config.mpesaStoreNumber || ''}" placeholder="For Withdrawal" class="w-full bg-white border border-purple-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none font-medium placeholder-purple-300">
                                        </div>
                                    </div>
                                    <p class="text-[10px] text-purple-600 mt-2 italic">* Both fields required for Agent Withdrawal</p>
                                </div>

                            </div>

                            <!-- SOMALIA -->
                            <div id="fields-somalia" class="country-fields ${this.config.storeCountry !== 'Somalia' ? 'hidden' : ''}">
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">EVC Plus Number</label>
                                        <input type="text" id="setting-som-evc" value="${this.config.somaliaEVC || ''}" placeholder="e.g. 0615..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">Jeeb Number</label>
                                        <input type="text" id="setting-som-jeeb" value="${this.config.somaliaJeeb || ''}" placeholder="Jeeb No." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">e-Dahab Number</label>
                                        <input type="text" id="setting-som-edahab" value="${this.config.somaliaEdahab || ''}" placeholder="e-Dahab No." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">Salaam Bank Account</label>
                                        <input type="text" id="setting-som-salaam" value="${this.config.somaliaSalaam || ''}" placeholder="Account No." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">Merchant Account</label>
                                        <input type="text" id="setting-som-merchant" value="${this.config.somaliaMerchant || ''}" placeholder="Merchant ID" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                                    </div>
                                </div>
                            </div>

                            <!-- UGANDA -->
                            <div id="fields-uganda" class="country-fields ${this.config.storeCountry !== 'Uganda' ? 'hidden' : ''}">
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">Airtel Money Merchant</label>
                                        <input type="text" id="setting-ug-airtel" value="${this.config.ugandaAirtel || ''}" placeholder="Merchant Code" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">MTN Mobile Money</label>
                                        <input type="text" id="setting-ug-mtn" value="${this.config.ugandaMTN || ''}" placeholder="Merchant Code" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-yellow-500 outline-none font-medium">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-500 mb-1">Other Payment Info</label>
                                        <input type="text" id="setting-ug-other" value="${this.config.ugandaOther || ''}" placeholder="Other Instructions" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-slate-500 outline-none font-medium">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-500 mb-1">Store Logo (Print Header)</label>
                            <input type="file" id="setting-logo" accept="image/*" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-500 pointer text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-bold
                            file:bg-red-50 file:text-red-700
                            hover:file:bg-red-100 hover:file:text-red-800 cursor-pointer transition">
                            ${this.config.storeLogo ? `<img src="${this.config.storeLogo}" class="h-16 mt-4 rounded border border-slate-200 p-1">` : ''}
                        </div>
                        <button type="button" id="btn-save-settings" class="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg transition mt-4 shadow-lg shadow-gray-500/20">
                            Save Configuration
                        </button>
                    </form>
                </div>

                <div class="space-y-8">
                    <!-- Team Management -->
                    <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                           <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            Team Management
                        </h2>
                        
                        <!-- Add User Form -->
                        <form id="add-user-form" class="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                            <h3 class="font-bold text-purple-900 mb-4 text-sm uppercase tracking-wide">Add New User</h3>
                            <div class="space-y-3">
                                <div class="grid grid-cols-2 gap-3">
                                    <input type="text" id="new-user-name" placeholder="Full Name" required class="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:outline-none focus:border-purple-500">
                                    <select id="new-user-role" class="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:outline-none focus:border-purple-500">
                                        <option value="cashier">Cashier</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <input type="text" id="new-user-username" placeholder="Username" required class="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:outline-none focus:border-purple-500">
                                    <input type="password" id="new-user-password" placeholder="Password" required class="w-full bg-white border border-purple-200 rounded p-2 text-sm focus:outline-none focus:border-purple-500">
                                </div>
                                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded shadow-sm transition text-sm">Create User</button>
                            </div>
                        </form>

                        <!-- User List -->
                        <div class="overflow-hidden rounded-lg border border-stone-200">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-stone-50 text-slate-500 font-bold border-b border-stone-200">
                                    <tr>
                                        <th class="p-3">Name</th>
                                        <th class="p-3">Role</th>
                                        <th class="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="user-list-body" class="divide-y divide-stone-100">
                                    <!-- Users injected here -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                     <!-- Profile Settings -->
                    <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                           <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            Profile Settings
                        </h2>
                        <form id="profile-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">New Username</label>
                                <input type="text" id="profile-username" placeholder="Leave empty to keep current" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">New Password</label>
                                <input type="password" id="profile-password" placeholder="Leave empty to keep current" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                            </div>
                             <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-4 shadow-lg shadow-blue-600/20">
                                Update Profile
                            </button>
                        </form>
                    </div>

                    <!-- Backup & Recovery -->
                    <div class="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                        <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            Data Management
                        </h2>
                        
                        <div class="space-y-6">
                            <div class="p-5 bg-stone-50 rounded-xl border border-stone-200">
                                <h3 class="font-bold text-slate-800 mb-2">Backup Data</h3>
                                <p class="text-sm text-slate-500 mb-4">Export all store data (Products, Sales, Settings) to a JSON file. Keep this safe.</p>
                                <button id="btn-export" class="w-full bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Export Database
                                </button>
                            </div>

                            <div class="p-5 bg-red-50 rounded-xl border border-red-100">
                                <h3 class="font-bold text-red-900 mb-2">Restore Data</h3>
                                <p class="text-sm text-red-700/80 mb-4">Overwrite current database with a backup file. <span class="font-bold text-red-700">Warning: This cannot be undone.</span></p>
                                <input type="file" id="file-import" accept=".json" class="hidden">
                                <button id="btn-import" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    Restore Database
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // NUCLEAR OPTION: Direct Click Listener
        const saveBtn = document.getElementById('btn-save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Just in case
                console.log('Settings: Save Button Clicked');

                // User Feedback - Immediate
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;

                try {
                    // Helper to safely get value
                    const getVal = (id) => {
                        const el = document.getElementById(id);
                        return el ? el.value.trim() : '';
                    };

                    const name = getVal('setting-name');
                    const phone = getVal('setting-phone');
                    const address = getVal('setting-address');
                    const sym = getVal('setting-currency-symbol');
                    const country = getVal('setting-country');
                    const code = getVal('setting-currency-code');

                    // Kenya Values
                    const paybill = getVal('setting-paybill');
                    const paybillAcc = getVal('setting-paybill-acc');
                    const buygoods = getVal('setting-buygoods');
                    const agent = getVal('setting-agent');
                    const storeNo = getVal('setting-store-no');

                    // VALIDATION: Agent & Store Number must be paired
                    if ((agent && !storeNo) || (!agent && storeNo)) {
                        throw new Error('Agent Number and Store Number must BOTH be filled or BOTH be empty.');
                    }

                    // Somalia Values
                    const somEvc = getVal('setting-som-evc');
                    const somJeeb = getVal('setting-som-jeeb');
                    const somEdahab = getVal('setting-som-edahab');
                    const somSalaam = getVal('setting-som-salaam');
                    const somMerchant = getVal('setting-som-merchant');

                    // Uganda Values
                    const ugAirtel = getVal('setting-ug-airtel');
                    const ugMtn = getVal('setting-ug-mtn');
                    const ugOther = getVal('setting-ug-other');

                    const fileInput = document.getElementById('setting-logo');
                    let logoBase64 = this.config.storeLogo;

                    if (fileInput && fileInput.files.length > 0) {
                        logoBase64 = await this.fileToBase64(fileInput.files[0]);
                    }

                    // Batch saves to ensure consistency
                    const saves = [
                        db.put('settings', { key: 'storeName', value: name }),
                        db.put('settings', { key: 'storePhone', value: phone }),
                        db.put('settings', { key: 'storeAddress', value: address }),
                        db.put('settings', { key: 'currencySymbol', value: sym }),
                        db.put('settings', { key: 'storeCountry', value: country }),
                        db.put('settings', { key: 'currencyCode', value: code }),

                        // Kenya
                        db.put('settings', { key: 'mpesaPaybill', value: paybill }),
                        db.put('settings', { key: 'mpesaAccount', value: paybillAcc }),
                        db.put('settings', { key: 'mpesaBuyGoods', value: buygoods }),
                        db.put('settings', { key: 'mpesaAgent', value: agent }),
                        db.put('settings', { key: 'mpesaStoreNumber', value: storeNo }),

                        // Somalia
                        db.put('settings', { key: 'somaliaEVC', value: somEvc }),
                        db.put('settings', { key: 'somaliaJeeb', value: somJeeb }),
                        db.put('settings', { key: 'somaliaEdahab', value: somEdahab }),
                        db.put('settings', { key: 'somaliaSalaam', value: somSalaam }),
                        db.put('settings', { key: 'somaliaMerchant', value: somMerchant }),

                        // Uganda
                        db.put('settings', { key: 'ugandaAirtel', value: ugAirtel }),
                        db.put('settings', { key: 'ugandaMTN', value: ugMtn }),
                        db.put('settings', { key: 'ugandaOther', value: ugOther }),
                    ];

                    if (logoBase64) {
                        saves.push(db.put('settings', { key: 'storeLogo', value: logoBase64 }));
                    }

                    await Promise.all(saves);

                    console.log('Settings Saved Successfully');
                    window.showToast('Settings Saved Successfully');

                    // Force UI Update
                    await this.init();
                    console.log('Settings re-initialized');
                    // User Feedback
                    alert('Settings Saved Successfully! application will refresh.');
                    window.location.reload();

                } catch (error) {
                    console.error('CRITICAL: Failed to save settings:', error);
                    window.showToast('Error saving settings: ' + error.message, 'error');
                    alert('Error saving settings: ' + error.message);
                } finally {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }
            });
        }

        // Profile Update Handler
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = document.getElementById('profile-username').value.trim();
                const newPassword = document.getElementById('profile-password').value.trim();

                if (!newUsername && !newPassword) {
                    window.showToast('Nothing to update', 'error');
                    return;
                }

                // Get current user from storage
                const currentUserSession = sessionStorage.getItem('pointify_user');
                if (!currentUserSession) {
                    window.showToast('Session Expired. Relogin.', 'error');
                    return;
                }

                const currentUser = JSON.parse(currentUserSession);

                try {
                    // Fetch actual user record from DB
                    const userRecord = await db.get('users', currentUser.id);

                    if (newUsername) userRecord.username = newUsername;
                    if (newPassword) userRecord.password = newPassword;

                    await db.put('users', userRecord);

                    // Update Session
                    sessionStorage.setItem('pointify_user', JSON.stringify(userRecord));

                    // Reset form
                    document.getElementById('profile-username').value = '';
                    document.getElementById('profile-password').value = '';

                    window.showToast('Profile Updated Successfully');
                } catch (err) {
                    console.error(err);
                    window.showToast('Failed to update profile', 'error');
                }
            });
        }

        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('new-user-name').value;
                const username = document.getElementById('new-user-username').value;
                const password = document.getElementById('new-user-password').value;
                const role = document.getElementById('new-user-role').value;

                try {
                    // Simple duplication check (in a real app, use index/constraint)
                    const allUsers = await db.getAll('users');
                    if (allUsers.find(u => u.username === username)) {
                        window.showToast('Username already exists', 'error');
                        return;
                    }

                    await db.add('users', { name, username, password, role });
                    window.showToast('User Created Successfully');
                    e.target.reset();
                    this.loadUsers();
                } catch (err) {
                    console.error(err);
                    window.showToast('Failed to create user', 'error');
                }
            });
        }

        // Initialize user list
        this.loadUsers();

        // Country Toggle
        const countrySelect = document.getElementById('setting-country');
        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                const val = e.target.value;
                document.querySelectorAll('.country-fields').forEach(el => el.classList.add('hidden'));
                if (val === 'Kenya') document.getElementById('fields-kenya')?.classList.remove('hidden');
                if (val === 'Somalia') document.getElementById('fields-somalia')?.classList.remove('hidden');
                if (val === 'Uganda') document.getElementById('fields-uganda')?.classList.remove('hidden');
            });
        }

        // Currency Selector Logic
        const currencySelect = document.getElementById('setting-currency-select');
        const symInput = document.getElementById('setting-currency-symbol');
        const codeInput = document.getElementById('setting-currency-code');

        if (currencySelect) {
            currencySelect.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'Custom|Custom') {
                    symInput.readOnly = false;
                    codeInput.readOnly = false;
                    symInput.value = '';
                    codeInput.value = '';
                    symInput.classList.remove('bg-slate-100', 'text-slate-600');
                    codeInput.classList.remove('bg-slate-100', 'text-slate-600');
                    symInput.classList.add('bg-white', 'text-slate-800');
                    codeInput.classList.add('bg-white', 'text-slate-800');
                    symInput.focus();
                } else {
                    const [code, sym] = val.split('|');
                    symInput.value = sym;
                    codeInput.value = code;
                    symInput.readOnly = true;
                    codeInput.readOnly = true;
                    symInput.classList.add('bg-slate-100', 'text-slate-600');
                    codeInput.classList.add('bg-slate-100', 'text-slate-600');
                    symInput.classList.remove('bg-white', 'text-slate-800');
                    codeInput.classList.remove('bg-white', 'text-slate-800');
                }
            });
        }
    }

    async loadUsers() {
        const list = document.getElementById('user-list-body');
        if (!list) return; // Guard

        list.innerHTML = '';
        const users = await db.getAll('users');
        const currentUser = JSON.parse(sessionStorage.getItem('pointify_user'));

        users.forEach(u => {
            const isMe = currentUser && currentUser.id === u.id;
            const isAdmin = u.username.toLowerCase() === 'admin';
            const row = document.createElement('tr');

            let actionHtml = '';
            if (isAdmin) {
                actionHtml = '<span class="text-xs text-red-400 italic font-bold">Protected</span>';
            } else if (isMe) {
                actionHtml = '<span class="text-xs text-slate-400 italic">You</span>';
            } else {
                actionHtml = `<button class="text-red-500 hover:text-red-700 font-bold text-xs delete-user-btn" data-id="${u.id}">Remove</button>`;
            }

            row.innerHTML = `
                <td class="p-3 font-medium text-slate-700">
                    <div>${u.name}</div>
                    <div class="text-xs text-slate-400 font-mono">@${u.username}</div>
                </td>
                <td class="p-3">
                    <span class="text-xs font-bold px-2 py-1 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'} uppercase">${u.role}</span>
                </td>
                <td class="p-3 text-right">
                    ${actionHtml}
                </td>
            `;
            list.appendChild(row);
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Are you sure you want to remove this user?')) {
                    await db.delete('users', id);
                    window.showToast('User Removed');
                    this.loadUsers();
                }
            });
        });
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
}

export const settings = new SettingsModule();
window.settingsModule = settings;
