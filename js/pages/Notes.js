export class Notes {
    constructor(app) {
        this.app = app;
        this.db = app.getDB();
        this.notes = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.filterTag = '';
    }

    async render() {
        const container = document.getElementById('page-container');
        container.innerHTML = this.getHTML();
        await this.loadNotes();
        this.bindEvents();
    }

    getHTML() {
        return `
            <div class="page-header">
                <h1 class="page-title">📝 Ghi chú</h1>
                <button class="btn" onclick="window.app.pages.notes.showAddNote()">
                    ➕ Thêm ghi chú
                </button>
            </div>

            <div class="card">
                <div class="search-bar">
                    <input type="text" id="search-notes" class="form-control" placeholder="🔍 Tìm kiếm ghi chú...">
                    <div class="filters">
                        <select id="filter-tag" class="form-control" style="width: auto;">
                            <option value="">Tất cả tags</option>
                        </select>
                        <select id="sort-notes" class="form-control" style="width: auto;">
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>
                    </div>
                </div>

                <div id="notes-container">
                    <div class="loading">
                        <div class="spinner"></div>
                    </div>
                </div>

                <div id="pagination" class="flex-between mt-16">
                    <div id="pagination-info"></div>
                    <div id="pagination-controls"></div>
                </div>
            </div>
        `;
    }

    async loadNotes() {
        try {
            const allNotes = await this.db.getAll('notes');
            this.notes = this.filterNotes(allNotes);
            this.notes = this.sortNotes(this.notes);
            this.renderNotes();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading notes:', error);
            Toast.show('Lỗi tải dữ liệu', 'error');
        }
    }

    filterNotes(notes) {
        let filtered = notes;

        // Search
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(note => 
                note.title?.toLowerCase().includes(term) ||
                note.content?.toLowerCase().includes(term) ||
                note.tags?.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // Filter by tag
        if (this.filterTag) {
            filtered = filtered.filter(note => 
                note.tags?.includes(this.filterTag)
            );
        }

        return filtered;
    }

    sortNotes(notes) {
        const sortBy = document.getElementById('sort-notes')?.value || 'newest';
        
        switch (sortBy) {
            case 'newest':
                return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'az':
                return notes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            case 'za':
                return notes.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            default:
                return notes;
        }
    }

    renderNotes() {
        const container = document.getElementById('notes-container');
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageNotes = this.notes.slice(start, end);

        if (this.notes.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <h3>Chưa có ghi chú nào</h3>
                    <p style="color: var(--text-secondary);">Hãy tạo ghi chú đầu tiên của bạn</p>
                    <button class="btn mt-16" onclick="window.app.pages.notes.showAddNote()">Tạo ghi chú</button>
                </div>
            `;
            return;
        }

        container.innerHTML = pageNotes.map(note => `
            <div class="note-item" style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                <div class="flex-between">
                    <div>
                        <h3 style="cursor: pointer;" onclick="window.app.pages.notes.viewNote(${note.id})">
                            ${this.escapeHtml(note.title || 'Không có tiêu đề')}
                        </h3>
                        <div style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                            ${this.escapeHtml(note.content || '').substring(0, 200)}${note.content?.length > 200 ? '...' : ''}
                        </div>
                        <div style="margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;">
                            ${note.tags?.map(tag => `
                                <span style="background: var(--bg-primary); padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                                    #${this.escapeHtml(tag)}
                                </span>
                            `).join('') || ''}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">
                            ${new Date(note.createdAt).toLocaleString('vi-VN')}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="window.app.pages.notes.editNote(${note.id})">
                            ✏️ Sửa
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.app.pages.notes.deleteNote(${note.id})">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const total = this.notes.length;
        const totalPages = Math.ceil(total / this.pageSize);
        
        const info = document.getElementById('pagination-info');
        const controls = document.getElementById('pagination-controls');

        info.textContent = `Hiển thị ${Math.min(total, (this.currentPage - 1) * this.pageSize + 1)} - ${Math.min(total, this.currentPage * this.pageSize)} / ${total} ghi chú`;

        if (totalPages <= 1) {
            controls.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="btn ${i === this.currentPage ? 'btn' : 'btn-secondary'}" 
                        style="margin: 0 2px; min-width: 36px;"
                        onclick="window.app.pages.notes.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        controls.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderNotes();
        this.renderPagination();
        document.getElementById('notes-container').scrollTop = 0;
    }

    bindEvents() {
        // Search
        document.getElementById('search-notes').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.currentPage = 1;
            this.loadNotes();
        });

        // Filter tag
        document.getElementById('filter-tag').addEventListener('change', (e) => {
            this.filterTag = e.target.value;
            this.currentPage = 1;
            this.loadNotes();
        });

        // Sort
        document.getElementById('sort-notes').addEventListener('change', () => {
            this.loadNotes();
        });

        // Load tags for filter
        this.loadTags();
    }

    async loadTags() {
        try {
            const notes = await this.db.getAll('notes');
            const tags = new Set();
            notes.forEach(note => {
                note.tags?.forEach(tag => tags.add(tag));
            });

            const select = document.getElementById('filter-tag');
            const currentValue = select.value;
            select.innerHTML = '<option value="">Tất cả tags</option>';
            tags.forEach(tag => {
                select.innerHTML += `<option value="${tag}">#${tag}</option>`;
            });
            select.value = currentValue;
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    async showAddNote() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="form-group">
                <label>Tiêu đề</label>
                <input type="text" id="note-title" class="form-control" placeholder="Nhập tiêu đề...">
            </div>
            <div class="form-group">
                <label>Nội dung</label>
                <textarea id="note-content" class="form-control" rows="5" placeholder="Nhập nội dung..."></textarea>
            </div>
            <div class="form-group">
                <label>Tags (cách nhau bởi dấu phẩy)</label>
                <input type="text" id="note-tags" class="form-control" placeholder="ví dụ: work, personal, important">
            </div>
        `;

        Modal.show({
            title: 'Thêm ghi chú mới',
            content: content,
            confirmText: 'Thêm',
            onConfirm: async () => {
                const title = document.getElementById('note-title').value;
                const content = document.getElementById('note-content').value;
                const tags = document.getElementById('note-tags').value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag);

                if (!title && !content) {
                    Toast.show('Vui lòng nhập tiêu đề hoặc nội dung', 'warning');
                    return;
                }

                try {
                    await this.db.insert('notes', { title, content, tags });
                    Toast.show('Thêm ghi chú thành công', 'success');
                    this.loadNotes();
                    this.loadTags();
                } catch (error) {
                    console.error('Error adding note:', error);
                    Toast.show('Lỗi thêm ghi chú', 'error');
                }
            }
        });
    }

    async editNote(id) {
        try {
            const note = await this.db.get('notes', id);
            if (!note) {
                Toast.show('Không tìm thấy ghi chú', 'error');
                return;
            }

            const content = document.createElement('div');
            content.innerHTML = `
                <div class="form-group">
                    <label>Tiêu đề</label>
                    <input type="text" id="edit-note-title" class="form-control" value="${this.escapeHtml(note.title || '')}">
                </div>
                <div class="form-group">
                    <label>Nội dung</label>
                    <textarea id="edit-note-content" class="form-control" rows="5">${this.escapeHtml(note.content || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Tags (cách nhau bởi dấu phẩy)</label>
                    <input type="text" id="edit-note-tags" class="form-control" value="${note.tags?.join(', ') || ''}">
                </div>
            `;

            Modal.show({
                title: 'Sửa ghi chú',
                content: content,
                confirmText: 'Lưu',
                onConfirm: async () => {
                    const title = document.getElementById('edit-note-title').value;
                    const content = document.getElementById('edit-note-content').value;
                    const tags = document.getElementById('edit-note-tags').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag);

                    try {
                        await this.db.update('notes', id, { title, content, tags });
                        Toast.show('Cập nhật ghi chú thành công', 'success');
                        this.loadNotes();
                        this.loadTags();
                    } catch (error) {
                        console.error('Error updating note:', error);
                        Toast.show('Lỗi cập nhật ghi chú', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('Error loading note:', error);
            Toast.show('Lỗi tải dữ liệu', 'error');
        }
    }

    async deleteNote(id) {
        Popup.show({
            title: 'Xác nhận xóa',
            message: 'Bạn có chắc chắn muốn xóa ghi chú này?',
            onConfirm: async () => {
                try {
                    await this.db.delete('notes', id);
                    Toast.show('Xóa ghi chú thành công', 'success');
                    this.loadNotes();
                    this.loadTags();
                } catch (error) {
                    console.error('Error deleting note:', error);
                    Toast.show('Lỗi xóa ghi chú', 'error');
                }
            }
        });
    }

    async viewNote(id) {
        try {
            const note = await this.db.get('notes', id);
            if (!note) {
                Toast.show('Không tìm thấy ghi chú', 'error');
                return;
            }

            const content = document.createElement('div');
            content.innerHTML = `
                <h3>${this.escapeHtml(note.title || 'Không có tiêu đề')}</h3>
                <div style="margin: 16px 0; padding: 16px; background: var(--bg-primary); border-radius: var(--radius);">
                    ${this.escapeHtml(note.content || '')}
                </div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    ${note.tags?.map(tag => `
                        <span style="background: var(--bg-primary); padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            #${this.escapeHtml(tag)}
                        </span>
                    `).join('') || ''}
                </div>
                <div style="color: var(--text-secondary); font-size: 12px; margin-top: 16px;">
                    Tạo: ${new Date(note.createdAt).toLocaleString('vi-VN')}
                    ${note.updatedAt ? ` - Cập nhật: ${new Date(note.updatedAt).toLocaleString('vi-VN')}` : ''}
                </div>
            `;

            Modal.show({
                title: 'Chi tiết ghi chú',
                content: content,
                confirmText: 'Đóng',
                cancelText: '',
                size: 'large'
            });
        } catch (error) {
            console.error('Error viewing note:', error);
            Toast.show('Lỗi tải dữ liệu', 'error');
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
