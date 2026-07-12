export class Popup {
    static show(options = {}) {
        const {
            title = 'Xác nhận',
            message = 'Bạn có chắc chắn?',
            confirmText = 'Xác nhận',
            cancelText = 'Hủy',
            onConfirm = null,
            onCancel = null,
            type = 'info' // info, warning, danger
        } = options;

        // Remove existing popup
        this.close();

        const overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.innerHTML = `
            <div class="popup-content">
                <div class="popup-icon popup-${type}">
                    ${this.getIcon(type)}
                </div>
                <h3 class="popup-title">${title}</h3>
                <p class="popup-message">${message}</p>
                <div class="popup-actions">
                    <button class="btn btn-secondary popup-cancel">${cancelText}</button>
                    <button class="btn popup-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Events
        overlay.querySelector('.popup-cancel').addEventListener('click', () => {
            this.close();
            if (onCancel) onCancel();
        });

        overlay.querySelector('.popup-confirm').addEventListener('click', () => {
            this.close();
            if (onConfirm) onConfirm();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
                if (onCancel) onCancel();
            }
        });

        // Show animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            const content = overlay.querySelector('.popup-content');
            content.style.transform = 'scale(1)';
        });

        return overlay;
    }

    static close() {
        const popup = document.querySelector('.popup-overlay');
        if (popup) {
            const content = popup.querySelector('.popup-content');
            if (content) {
                content.style.transform = 'scale(0.9)';
            }
            popup.style.opacity = '0';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        }
    }

    static getIcon(type) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            danger: '❌',
            success: '✅'
        };
        return icons[type] || icons.info;
    }
}
