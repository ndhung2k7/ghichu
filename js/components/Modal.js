export class Modal {
    static container = document.getElementById('modal-container');
    static currentModal = null;

    static show(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'medium',
            confirmText = 'Xác nhận',
            cancelText = 'Hủy',
            onConfirm = null,
            onCancel = null
        } = options;

        // Remove existing modal
        this.close();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${typeof content === 'string' ? content : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">${cancelText}</button>
                    <button class="btn modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        // If content is HTMLElement, append to body
        if (typeof content === 'object' && content instanceof HTMLElement) {
            const body = modal.querySelector('.modal-body');
            body.innerHTML = '';
            body.appendChild(content);
        }

        this.container.appendChild(modal);
        this.currentModal = modal;

        // Events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.close();
            if (onCancel) onCancel();
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            this.close();
            if (onCancel) onCancel();
        });

        modal.querySelector('.modal-confirm').addEventListener('click', () => {
            if (onConfirm) {
                onConfirm();
            }
            this.close();
        });

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
                if (onCancel) onCancel();
            }
        });

        // Show with animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            const content = modal.querySelector('.modal-content');
            content.style.transform = 'scale(1)';
        });

        return modal;
    }

    static close() {
        if (this.currentModal) {
            const content = this.currentModal.querySelector('.modal-content');
            if (content) {
                content.style.transform = 'scale(0.9)';
            }
            this.currentModal.style.opacity = '0';
            setTimeout(() => {
                if (this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
            }, 300);
        }
    }
}
