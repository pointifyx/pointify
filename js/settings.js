import { db } from './db.js';

class SettingsModule {
    constructor() {
        this.container = document.getElementById('view-settings');
        this.config = {
            storeName: 'My Store',
            currencySymbol: '$',
            currencyCode: 'USD',
            storeLogo: null // Base64
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
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Currency Symbol</label>
                                <input type="text" id="setting-currency-symbol" value="${this.config.currencySymbol}" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-500 mb-1">Currency Code</label>
                                <input type="text" id="setting-currency-code" value="${this.config.currencyCode}" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-red-500 outline-none font-medium">
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
                        <button type="submit" class="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg transition mt-4 shadow-lg shadow-gray-500/20">
                            Save Configuration
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
        `;
    }

    bindEvents() {
        const form = document.getElementById('settings-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('setting-name').value;
            const sym = document.getElementById('setting-currency-symbol').value;
            const code = document.getElementById('setting-currency-code').value;
            const fileInput = document.getElementById('setting-logo');

            let logoBase64 = this.config.storeLogo;

            if (fileInput.files.length > 0) {
                logoBase64 = await this.fileToBase64(fileInput.files[0]);
            }

            await db.put('settings', { key: 'storeName', value: name });
            await db.put('settings', { key: 'currencySymbol', value: sym });
            await db.put('settings', { key: 'currencyCode', value: code });
            if (logoBase64) await db.put('settings', { key: 'storeLogo', value: logoBase64 });

            window.showToast('Settings Saved Successfully');
            // Reload to update local config state
            await this.loadSettings();
            this.render(); // Re-render to show updated image
        });

        document.getElementById('btn-export').addEventListener('click', async () => {
            const json = await db.exportData();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pointify_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.showToast('Data Exported Successfully');
        });

        const importBtn = document.getElementById('btn-import');
        const fileImport = document.getElementById('file-import');

        importBtn.addEventListener('click', () => fileImport.click());

        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm('Are you sure? This will DELETE ALL CURRENT DATA and replace it with the backup.')) {
                fileImport.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    await db.importData(event.target.result);
                    window.showToast('Data Restored Successfully', 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    console.error(err);
                    window.showToast('Failed to restore data', 'error');
                }
            };
            reader.readAsText(file);
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
