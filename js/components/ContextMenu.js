export class ContextMenu {
    static menu = document.getElementById('context-menu');

    static show(x, y, items) {
        this.hide();
        
        if (!items || items.length === 0) return;
        
        // Position menu
        const menu = this.menu;
        menu.innerHTML = items.map(item => `
            <div class="context-menu-item" data-action="${item.action}">
                ${item.icon ? `<span class="context-menu-icon">${item.icon}</span>` : ''}
                ${item.label}
                ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
            </div>
        `).join('');

        menu.style.display = 'block';
        menu.style.top = y + 'px';
        menu.style.left = x + 'px';

        // Ensure menu is within viewport
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }

        // Events
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const target = items.find(i => i.action === action);
                if (target && target.onClick) {
                    target.onClick();
                }
                this.hide();
            });
        });

        // Click outside to hide
        document.addEventListener('click', this.handleOutsideClick);
        document.addEventListener('contextmenu', this.handleOutsideClick);
    }

    static hide() {
        this.menu.style.display = 'none';
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('contextmenu', this.handleOutsideClick);
    }

    static handleOutsideClick(e) {
        if (!ContextMenu.menu.contains(e.target)) {
            ContextMenu.hide();
        }
    }
}
