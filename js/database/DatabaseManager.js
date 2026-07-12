/**
 * DatabaseManager - Quản lý IndexedDB
 * Tự động tạo database, bảng và các thao tác CRUD
 */
export class DatabaseManager {
    constructor(dbName = 'AppDB', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.tables = ['users', 'settings', 'notes', 'history', 'logs'];
    }

    /**
     * Mở kết nối database
     */
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Tạo các bảng nếu chưa tồn tại
                this.tables.forEach(tableName => {
                    if (!db.objectStoreNames.contains(tableName)) {
                        const store = db.createObjectStore(tableName, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        
                        // Tạo indexes cho tìm kiếm
                        if (tableName === 'users') {
                            store.createIndex('email', 'email', { unique: true });
                            store.createIndex('name', 'name');
                        } else if (tableName === 'notes') {
                            store.createIndex('title', 'title');
                            store.createIndex('createdAt', 'createdAt');
                        } else if (tableName === 'settings') {
                            store.createIndex('key', 'key', { unique: true });
                        }
                    }
                });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Tạo bảng mới
     */
    async createTable(tableName, options = {}) {
        if (!this.tables.includes(tableName)) {
            this.tables.push(tableName);
            // Upgrade version để tạo bảng mới
            this.version++;
            await this.open();
            return true;
        }
        return false;
    }

    /**
     * Thêm bản ghi
     */
    async insert(tableName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            
            // Thêm timestamp
            if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
            }
            data.updatedAt = new Date().toISOString();

            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Cập nhật bản ghi
     */
    async update(tableName, id, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            
            // Lấy dữ liệu cũ
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const oldData = getRequest.result;
                if (!oldData) {
                    reject(new Error('Không tìm thấy bản ghi'));
                    return;
                }
                
                const updatedData = { ...oldData, ...data };
                updatedData.updatedAt = new Date().toISOString();
                
                const putRequest = store.put(updatedData);
                putRequest.onsuccess = () => resolve(updatedData);
                putRequest.onerror = () => reject(putRequest.error);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Xóa bản ghi
     */
    async delete(tableName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Lấy một bản ghi
     */
    async get(tableName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readonly');
            const store = transaction.objectStore(tableName);
            
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Lấy tất cả bản ghi
     */
    async getAll(tableName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readonly');
            const store = transaction.objectStore(tableName);
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Tìm kiếm
     */
    async search(tableName, field, value, exact = false) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readonly');
            const store = transaction.objectStore(tableName);
            
            // Kiểm tra index
            const index = store.index(field);
            const request = exact ? 
                index.getAll(value) : 
                index.getAll(IDBKeyRange.bound(value, value + '\uffff'));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Tìm kiếm toàn văn
     */
    async searchAll(tableName, keyword) {
        const allData = await this.getAll(tableName);
        if (!keyword) return allData;
        
        const keywordLower = keyword.toLowerCase();
        return allData.filter(item => {
            return Object.values(item).some(value => {
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(keywordLower);
                }
                return false;
            });
        });
    }

    /**
     * Export toàn bộ dữ liệu
     */
    async exportJSON() {
        const data = {};
        for (const tableName of this.tables) {
            data[tableName] = await this.getAll(tableName);
        }
        return data;
    }

    /**
     * Import dữ liệu
     */
    async importJSON(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            for (const [tableName, records] of Object.entries(data)) {
                if (!this.tables.includes(tableName)) {
                    await this.createTable(tableName);
                }
                
                // Xóa dữ liệu cũ
                await this.clearTable(tableName);
                
                // Thêm dữ liệu mới
                for (const record of records) {
                    await this.insert(tableName, record);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            throw new Error('Dữ liệu import không hợp lệ');
        }
    }

    /**
     * Xóa toàn bộ bảng
     */
    async clearTable(tableName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Xóa toàn bộ database
     */
    async clearDatabase() {
        for (const tableName of this.tables) {
            await this.clearTable(tableName);
        }
    }

    /**
     * Lấy số lượng bản ghi
     */
    async count(tableName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database chưa được mở'));
                return;
            }

            const transaction = this.db.transaction([tableName], 'readonly');
            const store = transaction.objectStore(tableName);
            
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}
