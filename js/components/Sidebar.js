export class Sidebar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('sidebar');
        this.menuItems = [
            { id: 'dashboard', icon: '📊', label: 'Bảng điều khiển' },
            { id: 'notes', icon: '📝', label: 'Ghi chú' },
            { id: 'users', icon: '👤', label: 'Người dùng' },
            { id: 'settings', icon: '⚙️', label: 'Cài đặt' }
        ];
        this.render();
        this.bindEvents();
    }

    render() {
        const menuHTML = this.menuItems.map(item => `
            <li data-page="${item.id}" class="${item.id === 'dashboard' ? 'active' : ''}">
                <span class="icon">${item.icon}</span>
                <span>${item.label}</span>
            </li>
        `).join('');

        this.element.innerHTML = `
            <nav>
                <ul class="sidebar-menu">
                    ${menuHTML}
                </ul>
            </nav>
            <div class="sidebar-footer">
                <div class="sidebar-version">v1.0.0</div>
            </div>
        `;
    }

    bindEvents() {
        this.element.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.app.navigateTo(page);
                
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    this.close();
                }
            });
        });
    }

    setActive(pageId) {
        this.element.querySelectorAll('li').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
    }

    toggle() {
        this.element.classList.toggle('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    open() {
        this.element.classList.add('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    close() {
        this.element.classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}
