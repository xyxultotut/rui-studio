/**
 * 新野兽派弹窗与详情管理器
 */
import { storage } from './storage.js';

export class DetailModal {
  constructor(toastCallback) {
    this.toastCallback = toastCallback;
    this.backdrop = document.getElementById('detailModalBackdrop');
    this.modalContent = document.getElementById('modalDynamicContent');
    this.closeBtn = document.getElementById('modalCloseBtn');

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  open(item) {
    if (!this.backdrop || !this.modalContent) return;

    const config = storage.getSiteConfig();
    const wechat = config.wechat || 'RUI-STUDIO-MUSIC';

    // Build modal body HTML (No cart button, no copy title button)
    this.modalContent.innerHTML = `
      <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
        <span class="neo-badge ${item.badgeColor || 'badge-yellow'}">${item.badge || '推荐'}</span>
        <span class="neo-badge badge-lime">${item.category}</span>
      </div>

      
      ${item.coverImage ? `
        <div style="text-align: center; margin-bottom: 14px; background: #000; border-radius: var(--radius-md); overflow: hidden; max-height: 240px; display: flex; align-items: center; justify-content: center; border: var(--border-thin);">
          <img src="${item.coverImage}" alt="" style="max-width: 100%; max-height: 240px; object-fit: contain;">
        </div>
      ` : ''}

      <h2 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 12px; line-height: 1.25;">
        ${item.title}
      </h2>

      <div style="background: #FAF6ED; border: var(--border-thick); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <div style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 900; color: #000; margin-bottom: 6px;">
          ${item.price}
        </div>
        <div style="font-size: 0.85rem; color: #444; font-weight: 600;">
          <strong>交付方式 / 周期：</strong>${item.delivery || '拍下后网盘极速直发 / 专属定制对接'}
        </div>
      </div>

      <div style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 16px;">
        <p style="margin-bottom: 10px;">${item.desc}</p>
        <p style="color: #222; background: #FFF; border-left: 4px solid #000; padding-left: 10px; font-weight: 500;">
          ${item.details || ''}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
          包含特性与服务标准:
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${item.tags.map(t => `<span class="feature-tag" style="background: #EFE9DE;"># ${t}</span>`).join('')}
        </div>
      </div>

      <div style="display: flex; gap: 10px; flex-wrap: wrap; padding-top: 14px; border-top: var(--border-thin);">
        ${item.fileUrl ? `
          <a href="${item.fileUrl}" target="_blank" class="neo-btn neo-btn-yellow" style="flex: 1; display: flex; align-items: center; justify-content: center; text-decoration: none; font-weight: 900;" title="在浏览器新标签页打开预览或下载原谱">
            📄 在线查看 / 试读乐谱
          </a>
        ` : ''}
        <button id="modalWechatContactBtn" class="neo-btn neo-btn-green" style="flex: 1;">
          微信咨询 (点击复制微信号)
        </button>
        <button id="modalCloseActionBtn" class="neo-btn neo-btn-white" style="flex: 0 0 100px;">
          关闭
        </button>
      </div>
    `;

    const wechatBtn = document.getElementById('modalWechatContactBtn');
    if (wechatBtn) {
      wechatBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(wechat).then(() => {
          if (this.toastCallback) {
            this.toastCallback(`微信号【${wechat}】已复制到剪贴板！`);
          }
        });
      });
    }

    const closeActionBtn = document.getElementById('modalCloseActionBtn');
    if (closeActionBtn) {
      closeActionBtn.addEventListener('click', () => this.close());
    }

    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.backdrop) return;
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
}
