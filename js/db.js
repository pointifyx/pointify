/**
 * POINTIFY CORE DATABASE ENGINE
 * Native IndexedDB Wrapper with Atomic Transactions
 */

const DB_NAME = 'PointifyDB';
const DB_VERSION = 2;

class PointifyDB {
    constructor() {
        this.db = null;
        // Chain the init with seeding to ensure data exists
        this.initPromise = this.init().then(() => this.seed());

        // Request Persistent Storage
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then(granted => {
                if (granted) {
                    console.log("Storage will not be cleared except by explicit user action");
                } else {
                    console.warn("Storage may be cleared by the UA under storage pressure.");
                }
            });
        }
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: ", event.target.error);
                reject("Database failed to open");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Database opened successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users Store (Admin, Manager, Cashier)
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    usersStore.createIndex('username', 'username', { unique: true });
                    usersStore.createIndex('role', 'role', { unique: false });
                }

                // Products Store
                if (!db.objectStoreNames.contains('products')) {
                    const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                    productsStore.createIndex('barcode', 'barcode', { unique: true });
                    productsStore.createIndex('name', 'name', { unique: false });
                }

                // Sales Store
                if (!db.objectStoreNames.contains('sales')) {
                    const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
                    salesStore.createIndex('date', 'date', { unique: false });
                    salesStore.createIndex('cashier', 'cashier', { unique: false });
                }

                // Settings Store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async seed() {
        // Ensure Admin Exists
        try {
            const db = await this.getDB();
            const userCount = await this.count('users');
            if (userCount === 0) {
                // Default Credentials: Admin / 123Admin
                await this.add('users', { username: 'Admin', password: '123Admin', role: 'admin', name: 'Super Admin' });
                console.log("Seeded Default Admin User");
            }
        } catch (e) {
            console.error("Seeding failed", e);
        }
    }

    async count(storeName) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDB() {
        if (!this.db) await this.initPromise;
        return this.db;
    }

    // Generic Add
    async add(storeName, data) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Get All
    async getAll(storeName) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Get by ID
    async get(storeName, id) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Update
    async put(storeName, data) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic Delete
    async delete(storeName, id) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Atomic Sale Transaction
    async processSale(saleData, cartItems) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['products', 'sales'], 'readwrite');
            const productStore = transaction.objectStore('products');
            const saleStore = transaction.objectStore('sales');

            transaction.oncomplete = () => {
                console.log("Transaction completed: Sale processed");
                resolve(true); // Return true on success
            };

            transaction.onerror = (event) => {
                console.error("Transaction failed: ", event.target.error);
                reject(event.target.error);
            };

            // 1. Add Sale Record
            // Calculate total profit for the sale
            let totalProfit = 0;
            cartItems.forEach(item => {
                const profit = (item.price - (item.costPrice || 0)) * item.qty;
                totalProfit += profit;
            });
            saleData.netProfit = totalProfit;
            saleStore.add(saleData);

            // 2. Decrement Stock
            cartItems.forEach(item => {
                const getRequest = productStore.get(item.id);
                getRequest.onsuccess = () => {
                    const product = getRequest.result;
                    if (product) {
                        product.stock = product.stock - item.qty;
                        if (product.stock < 0) product.stock = 0; // Prevent negative stock for now
                        productStore.put(product);
                    } else {
                        console.error(`Product ${item.id} not found during transaction`);
                        transaction.abort();
                    }
                };
                getRequest.onerror = () => transaction.abort();
            });
        });
    }

    // JSON Export
    async exportData() {
        const db = await this.getDB();
        const exportObj = {};
        const stores = ['users', 'products', 'sales', 'settings'];

        for (const storeName of stores) {
            exportObj[storeName] = await this.getAll(storeName);
        }
        return JSON.stringify(exportObj);
    }

    // JSON Import
    async importData(jsonString) {
        const data = JSON.parse(jsonString);
        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['users', 'products', 'sales', 'settings'], 'readwrite');

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = (e) => reject(e);

            // Clear existing data and add new
            for (const storeName of Object.keys(data)) {
                if (['users', 'products', 'sales', 'settings'].includes(storeName)) {
                    const store = transaction.objectStore(storeName);
                    store.clear();
                    data[storeName].forEach(item => store.add(item));
                }
            }
        });
    }
}

export const db = new PointifyDB();
