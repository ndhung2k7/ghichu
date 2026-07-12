export class Dashboard {
    constructor(app) {
        this.app = app;
        this.db = app.getDB();
    }

    async render() {
        const container = document.getElementById('page-container');
        
        // Show skeleton loading
        container.innerHTML = this.getSkeletonHTML();
        
        // Load data
        const stats = await this.getStats();
        
        // Render actual content
        container.innerHTML = this.getHTML(stats);
        
        this.bindEvents();
    }

    getSkeletonHTML() {
        return `
            <div class="page-header">
                <h1 class="page-title skeleton" style="width: 200px; height: 36px;"></h1>
                <div class="skeleton" style="width: 120px; height: 36px;"></div>
            </div>
            <div class="card-grid">
                ${Array(4).fill(0).map(() => `
                    <div class="stat-card">
                        <div class="skeleton" style="height: 40px; width: 60px; margin-bottom: 8px;"></div>
                        <div class="skeleton" style="height: 20px; width: 100px;"></div>
                    </div>
                `).join('')}
            </div>
            <div class="card">
                <div class="skeleton" style="height: 30px; width: 150px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="height: 200px;"></div>
            </div>
        `;
    }

    async getStats() {
        try {
            const [notesCount, usersCount, logsCount] = await Promise.all([
                this.db.count('notes'),
                this.db.count('users'),
                this.db.count('logs')
            ]);

            return {
                notes: notesCount,
                users: usersCount,
                logs: logsCount,
                total: notesCount + usersCount + logsCount
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { notes: 0, users: 0, logs: 0, total: 0 };
        }
    }

    getHTML(stats) {
        return `
            <div class="page-header">
                <h1 class="page-title">📊 Bảng điều khiển</h1>
                <div>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.backupData()">
                        💾 Backup
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.app.restoreBackup()">
                        ↩️ Khôi phục
                    </button>
                </div>
            </div>
            
            <div class="card-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tổng số bản ghi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.notes}</div>
                    <div class="stat-label">📝 Ghi chú</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.users}</div>
                    <div class="stat-label">👤 Người dùng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.logs}</div>
                    <div class="stat-label">📋 Nhật ký</div>
                </div>
            </div>

            <div class="card">
                <div class="flex-between mb-16">
                    <h3>📌 Ghi chú gần đây</h3>
                    <button class="btn btn-sm" onclick="window.app.navigateTo('notes')">Xem tất cả</button>
                </div>
                <div id="recent-notes">
                    <div class="loading">Đang tải...</div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        // Load recent notes
        await this.loadRecentNotes();
    }

    async loadRecentNotes() {
        try {
            const notes = await this.db.getAll('notes');
            const recent = notes.slice(-5).reverse();
            
            const container = document.getElementById('recent-notes');
            
            if (recent.length === 0) {
                container.innerHTML = '<p class="text-center" style="padding: 20px; color: var(--text-secondary);">Chưa có ghi chú nào</p>';
                return;
            }

            container.innerHTML = recent.map(note => `
                <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <div style="font-weight: 500;">${this.escapeHtml(note.title || 'Không có tiêu đề')}</div>
                    <div style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">
                        ${this.escapeHtml(note.content || '').substring(0, 100)}${note.content?.length > 100 ? '...' : ''}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 12px; margin-top: 4px;">
                        ${new Date(note.createdAt).toLocaleString('vi-VN')}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent notes:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
