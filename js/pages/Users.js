export class Users {
    constructor(app) {
        this.app = app;
        this.db = app.getDB();
        this.users = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
    }

    async render() {
        const container = document.getElementById('page-container');
        container.innerHTML = this.getHTML();
        await this.loadUsers();
        this.bindEvents();
    }

    getHTML() {
        return `
            <div class="page-header">
                <h1 class="page-title">👤 Người dùng</h1>
                <button class="btn" onclick="window.app.pages.users.showAddUser()">
                    ➕ Thêm người dùng
                </button>
            </div>

            <div class="card">
                <div class="search-bar">
                    <input type="text" id="search-users" class="form-control" placeholder="🔍 Tìm kiếm người dùng...">
                </div>

                <div id="users-container">
                    <div class="loading">
                        <div class="spinner"></div>
                    </div>
                </div>

                <div id="users-pagination" class="flex-between mt-16">
                    <div id="users-pagination-info"></div>
                    <div id="users-pagination-controls"></div>
                </div>
            </div>
        `;
    }

    async loadUsers() {
        try {
            const allUsers = await this.db.getAll('users');
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                this.users = allUsers.filter(user => 
                    user.name?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term) ||
                    user.phone?.includes(term)
                );
            } else {
                this.users = allUsers;
            }
            this.renderUsers();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading users:', error);
            Toast.show('Lỗi tải dữ liệu', 'error');
        }
    }

    renderUsers() {
        const container = document.getElementById('users-container');
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageUsers = this.users.slice(start, end);

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
                    <h3>Chưa có người dùng nào</h3>
                    <p style="color: var(--text-secondary);">Hãy thêm người dùng đầu tiên</p>
                    <button class="btn mt-16" onclick="window.app.pages.users.showAddUser()">Thêm người dùng</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Ngày tạo</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageUsers.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td><strong>${this.escapeHtml(user.name || '')}</strong></td>
                                <td>${this.escapeHtml(user.email || '')}</td>
                                <td>${this.escapeHtml(user.phone || '')}</td>
                                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="window.app.pages.users.editUser(${user.id})">
                                        ✏️
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="window.app.pages.users.deleteUser(${user.id})">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderPagination() {
        const total = this.users.length;
        const totalPages = Math.ceil(total / this.pageSize);
        
        const info = document.getElementById('users-pagination-info');
        const controls = document.getElementById('users-pagination-controls');

        info.textContent = `Hiển thị ${Math.min(total, (this.currentPage - 1) * this.pageSize + 1)} - ${Math.min(total, this.currentPage * this.pageSize)} / ${total} người dùng`;

        if (totalPages <= 1) {
            controls.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="btn ${i === this.currentPage ? 'btn' : 'btn-secondary'}" 
                        style="margin: 0 2px; min-width: 36px;"
                        onclick="window.app.pages.users.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        controls.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderUsers();
        this.renderPagination();
    }

    bindEvents() {
        document.getElementById('search-users').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.currentPage = 1;
            this.loadUsers();
        });
    }

    async showAddUser() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="form-group">
                <label>Tên</label>
                <input type="text" id="user-name" class="form-control" placeholder="Nhập tên...">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="user-email" class="form-control" placeholder="Nhập email...">
            </div>
            <div class="form-group">
                <label>Số điện thoại</label>
                <input type="text" id="user-phone" class="form-control" placeholder="Nhập số điện thoại...">
            </div>
        `;

        Modal.show({
            title: 'Thêm người dùng mới',
            content: content,
            confirmText: 'Thêm',
            onConfirm: async () => {
                const name = document.getElementById('user-name').value;
                const email = document.getElementById('user-email').value;
                const phone = document.getElementById('user-phone').value;

                if (!name) {
                    Toast.show('Vui lòng nhập tên', 'warning');
                    return;
                }

                try {
                    await this.db.insert('users', { name, email, phone });
                    Toast.show('Thêm người dùng thành công', 'success');
                    this.loadUsers();
                } catch (error) {
                    console.error('Error adding user:', error);
                    Toast.show('Lỗi thêm người dùng', 'error');
                }
            }
        });
    }

    async editUser(id) {
        try {
            const user = await this.db.get('users', id);
            if (!user) {
                Toast.show('Không tìm thấy người dùng', 'error');
                return;
            }

            const content = document.createElement('div');
            content.innerHTML = `
                <div class="form-group">
                    <label>Tên</label>
                    <input type="text" id="edit-user-name" class="form-control" value="${this.escapeHtml(user.name || '')}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="edit-user-email" class="form-control" value="${this.escapeHtml(user.email || '')}">
                </div>
                <div class="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" id="edit-user-phone" class="form-control" value="${this.escapeHtml(user.phone || '')}">
                </div>
            `;

            Modal.show({
                title: 'Sửa người dùng',
                content: content,
                confirmText: 'Lưu',
                onConfirm: async () => {
                    const name = document.getElementById('edit-user-name').value;
                    const email = document.getElementById('edit-user-email').value;
                    const phone = document.getElementById('edit-user-phone').value;

                    if (!name) {
                        Toast.show('Vui lòng nhập tên', 'warning');
                        return;
                    }

                    try {
                        await this.db.update('users', id, { name, email, phone });
                        Toast.show('Cập nhật người dùng thành công', 'success');
                        this.loadUsers();
                    } catch (error) {
                        console.error('Error updating user:', error);
                        Toast.show('Lỗi cập nhật người dùng', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('Error loading user:', error);
            Toast.show('Lỗi tải dữ liệu', 'error');
        }
    }

    async deleteUser(id) {
        Popup.show({
            title: 'Xác nhận xóa',
            message: 'Bạn có chắc chắn muốn xóa người dùng này?',
            onConfirm: async () => {
                try {
                    await this.db.delete('users', id);
                    Toast.show('Xóa người dùng thành công', 'success');
                    this.loadUsers();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    Toast.show('Lỗi xóa người dùng', 'error');
                }
            }
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
