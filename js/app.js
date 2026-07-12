import { DatabaseManager } from './database/DatabaseManager.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { Toast } from './components/Toast.js';
import { Modal } from './components/Modal.js';
import { Popup } from './components/Popup.js';
import { ContextMenu } from './components/ContextMenu.js';
import { Dashboard } from './pages/Dashboard.js';
import { Notes } from './pages/Notes.js';
import { Users } from './pages/Users.js';
import { Settings } from './pages/Settings.js';

/**
 * Ứng dụng chính
 */
class App {
    constructor() {
        this.db = null;
        this.currentPage = 'dashboard';
        this.pages = {
            dashboard: Dashboard,
            notes: Notes,
            users: Users,
            settings: Settings
        };
        this.components = {};
        this.init();
    }

    async init() {
        try {
            // Khởi tạo Database
            this.db = new DatabaseManager();
            await this.db.open();
            console.log('Database connected successfully');

            // Khởi tạo các components
            this.initComponents();
            
            // Khởi tạo các pages
            this.initPages();
            
            // Load page đầu tiên
            this.navigateTo('dashboard');
            
            // Setup Service Worker
            this.registerSW();
            
            // Auto backup
            this.setupAutoBackup();
            
            // Lưu dữ liệu mẫu nếu chưa có
            await this.seedData();
            
        } catch (error) {
            console.error('App initialization error:', error);
            Toast.show('Lỗi khởi tạo ứng dụng', 'error');
        }
    }

    initComponents() {
        this.components.sidebar = new Sidebar(this);
        this.components.header = new Header(this);
        this.components.toast = Toast;
        this.components.modal = Modal;
        this.components.popup = Popup;
        this.components.contextMenu = ContextMenu;
    }

    initPages() {
        for (const [name, PageClass] of Object.entries(this.pages)) {
            this.pages[name] = new PageClass(this);
        }
    }

    async navigateTo(pageName) {
        this.currentPage = pageName;
        
        // Cập nhật sidebar
        this.components.sidebar.setActive(pageName);
        
        // Render page
        const page = this.pages[pageName];
        if (page) {
            await page.render();
        }
        
        // Update URL hash
        window.location.hash = pageName;
    }

    async registerSW() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    setupAutoBackup() {
        // Tự động backup mỗi 5 phút
        setInterval(() => {
            this.backupData();
        }, 300000);
    }

    async backupData() {
        try {
            const data = await this.db.exportJSON();
            localStorage.setItem('app_backup', JSON.stringify(data));
            localStorage.setItem('app_backup_time', new Date().toISOString());
        } catch (error) {
            console.error('Backup failed:', error);
        }
    }

    async restoreBackup() {
        try {
            const backup = localStorage.getItem('app_backup');
            if (backup) {
                await this.db.importJSON(backup);
                Toast.show('Khôi phục dữ liệu thành công', 'success');
                return true;
            }
        } catch (error) {
            console.error('Restore failed:', error);
            Toast.show('Khôi phục dữ liệu thất bại', 'error');
        }
        return false;
    }

    async seedData() {
        // Kiểm tra xem đã có dữ liệu chưa
        const count = await this.db.count('notes');
        if (count > 0) return;

        // Thêm dữ liệu mẫu
        const sampleData = [
            {
                title: 'Chào mừng đến với ứng dụng',
                content: 'Đây là ứng dụng quản lý dữ liệu với IndexedDB',
                tags: ['welcome', 'demo'],
                createdAt: new Date().toISOString()
            },
            {
                title: 'Hướng dẫn sử dụng',
                content: 'Bạn có thể thêm, sửa, xóa và tìm kiếm dữ liệu',
                tags: ['guide', 'tutorial'],
                createdAt: new Date().toISOString()
            }
        ];

        for (const data of sampleData) {
            await this.db.insert('notes', data);
        }

        // Thêm settings mặc định
        const defaultSettings = {
            theme: 'light',
            language: 'vi',
            fontSize: 'medium',
            autoSave: true,
            sidebarWidth: 260
        };
        await this.db.insert('settings', defaultSettings);
    }

    getDB() {
        return this.db;
    }
}

// Khởi tạo app khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Xử lý hash change
window.addEventListener('hashchange', () => {
    if (window.app) {
        const page = window.location.hash.replace('#', '') || 'dashboard';
        window.app.navigateTo(page);
    }
});
