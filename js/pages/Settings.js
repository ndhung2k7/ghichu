export class Settings {
    constructor(app) {
        this.app = app;
        this.db = app.getDB();
        this.settings = {};
    }

    async render() {
        const container = document.getElementById('page-container');
        await this.loadSettings();
        container.innerHTML = this.getHTML();
        this.bindEvents();
    }

    async loadSettings() {
        try {
            const settings = await this.db.getAll('settings');
            this.settings = settings[0] || {};
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = {};
        }
    }

    getHTML() {
        return `
            <div class="page-header">
                <h1 class="page-title">⚙️ Cài đặt</h1>
            </div>

            <div class="card">
                <h3>Giao diện</h3>
                <div class="form-group">
                    <label>Chủ đề</label>
                    <select id="setting-theme" class="form-control">
                        <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Sáng</option>
                        <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Tối</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Ngôn ngữ</label>
                    <select id="setting-language" class="form-control">
                        <option value="vi" ${this.settings.language === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                        <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cỡ chữ</label>
                    <select id="setting-fontsize" class="form-control">
                        <option value="small" ${this.settings.fontSize === 'small' ? 'selected' : ''}>Nhỏ</option>
                        <option value="medium" ${this.settings.fontSize === 'medium' ? 'selected' : ''}>Trung bình</option>
                        <option value="large" ${this.settings.fontSize === 'large' ? 'selected' : ''}>Lớn</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <h3>Dữ liệu</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="setting-autosave" ${this.settings.autoSave !== false ? 'checked' : ''}>
                        Tự động lưu
                    </label>
                </div>
                <div class="flex gap-8">
                    <button class="btn btn-secondary" onclick="window.app.pages.settings.exportData()">
                        📤 Xuất dữ liệu
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.pages.settings.importData()">
                        📥 Nhập dữ liệu
                    </button>
                    <button class="btn btn-danger" onclick="window.app.pages.settings.clearData()">
                        🗑️ Xóa toàn bộ dữ liệu
                    </button>
                </div>
            </div>

            <div class="card">
                <h3>Thông tin</h3>
                <p><strong>Ứng dụng:</strong> IndexedDB App</p>
                <p><strong>Phiên bản:</strong> 1.0.0</p>
                <p><strong>Database:</strong> ${this.app.db.dbName}</p>
                <p><strong>Dung lượng:</strong> ${await this.getDatabaseSize()}</p>
            </div>
        `;
    }

    async getDatabaseSize() {
        try {
            const allData = await this.db.exportJSON();
            const size = new Blob([JSON.stringify(allData)]).size;
            return this.formatSize(size);
        } catch (error) {
            return 'Không xác định';
        }
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    bindEvents() {
        // Theme
        document.getElementById('setting-theme').addEventListener('change', async (e) => {
            const theme = e.target.value;
            document.body.classList.toggle('dark-theme', theme === 'dark');
            await this.saveSetting('theme', theme);
        });

        // Language
        document.getElementById('setting-language').addEventListener('change', async (e) => {
            await this.saveSetting('language', e.target.value);
            Toast.show('Đã cập nhật ngôn ngữ', 'success');
        });

        // Font size
        document.getElementById('setting-fontsize').addEventListener('change', async (e) => {
            const size = e.target.value;
            const sizes = { small: '14px', medium: '16px', large: '18px' };
            document.body.style.fontSize = sizes[size];
            await this.saveSetting('fontSize', size);
        });

        // Auto save
        document.getElementById('setting-autosave').addEventListener('change', async (e) => {
            await this.saveSetting('autoSave', e.target.checked);
        });
    }

    async saveSetting(key, value) {
        try {
            const settings = await this.db.getAll('settings');
            if (settings.length > 0) {
                const setting = settings[0];
                setting[key] = value;
                await this.db.update('settings', setting.id, setting);
            } else {
                await this.db.insert('settings', { [key]: value });
            }
            this.settings[key] = value;
            Toast.show('Đã lưu cài đặt', 'success');
        } catch (error) {
            console.error('Error saving setting:', error);
            Toast.show('Lỗi lưu cài đặt', 'error');
        }
    }

    async exportData() {
        try {
            const data = await this.db.exportJSON();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `database_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Toast.show('Xuất dữ liệu thành công', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Toast.show('Lỗi xuất dữ liệu', 'error');
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                Popup.show({
                    title: 'Xác nhận nhập dữ liệu',
                    message: 'Dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn?',
                    onConfirm: async () => {
                        await this.db.importJSON(data);
                        Toast.show('Nhập dữ liệu thành công', 'success');
                        window.location.reload();
                    }
                });
            } catch (error) {
                console.error('Import error:', error);
                Toast.show('Dữ liệu không hợp lệ', 'error');
            }
        };
        input.click();
    }

    async clearData() {
        Popup.show({
            title: 'Xác nhận xóa toàn bộ dữ liệu',
            message: 'Hành động này không thể hoàn tác. Bạn có chắc chắn?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await this.db.clearDatabase();
                    Toast.show('Đã xóa toàn bộ dữ liệu', 'success');
                    window.location.reload();
                } catch (error) {
                    console.error('Clear data error:', error);
                    Toast.show('Lỗi xóa dữ liệu', 'error');
                }
            }
        });
    }
}
