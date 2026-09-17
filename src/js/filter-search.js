/**
 * 实时筛选、搜索与交错式卡片网格渲染引擎
 * 保持左侧分类干净纯粹，已完全剔除左侧标签云
 */

import { CATEGORIES } from './data.js';
import { storage } from './storage.js';

export class FilterSearchEngine {
  constructor(containerElement, modalInstance, toastCallback) {
    this.container = containerElement;
    this.modal = modalInstance;
    // Cart removed per user request
    this.toast = toastCallback;

    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeTag = null;
    this.displayLimit = 36;
    this.BATCH_SIZE = 36;

    this.searchInput = document.getElementById('mainSearchInput');
    this.resultCountLabel = document.getElementById('resultCountLabel');
    this.asideCatList = document.getElementById('aside-cat-list');

    this.init();
  }

  init() {
    this.updateCategoryCounts();
    this.renderAsideCategories();
    this.render();

    // Bind search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.render();
      });
    }

    // Delegated click events for cards
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        const target = e.target;

        // Add to cart button
        const addBtn = target.closest('.btn-add-cart');
        if (addBtn) {
          const itemId = addBtn.dataset.id;
          const item = storage.getItemById(itemId);
          if (item) {
            this.cart.addItem(item);
          }
          return;
        }

        // View detail modal
        const detailBtn = target.closest('.btn-view-detail');
        if (detailBtn) {
          const itemId = detailBtn.dataset.id;
          const item = storage.getItemById(itemId);
          if (item) {
            this.modal.open(item);
          }
          return;
        }

        // Tag click on card
        const tagSpan = target.closest('.feature-tag');
        if (tagSpan) {
          const tag = tagSpan.textContent.replace(/^#\s*/, '').trim();
          this.setTag(tag);
          return;
        }
      });
    }

    // Listen to storage update event across tabs or windows
    window.addEventListener('site-storage-updated', () => {
      this.updateCategoryCounts();
      this.renderAsideCategories();
      this.render();
    });
  }

  updateCategoryCounts() {
    const items = storage.getItems();
    CATEGORIES.forEach(cat => {
      if (cat.id === 'all') {
        cat.count = items.length;
      } else {
        cat.count = items.filter(i => i.category === cat.id).length;
      }
    });

    const statArticles = document.getElementById('statAsideArticles');
    const statCategories = document.getElementById('statAsideCategories');

    if (statArticles) statArticles.textContent = items.length;
    if (statCategories) statCategories.textContent = CATEGORIES.length - 1; // excluding 'all'
  }

  renderAsideCategories() {
    if (!this.asideCatList) return;

    this.asideCatList.innerHTML = CATEGORIES.map(cat => `
      <li class="card-category-list-item ${this.currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
        </span>
        <span class="card-category-list-count">${cat.count}</span>
      </li>
    `).join('');

    this.asideCatList.querySelectorAll('.card-category-list-item').forEach(li => {
      li.addEventListener('click', () => {
        this.setCategory(li.dataset.category);
      });
    });
  }

  setCategory(catId) {
    this.currentCategory = catId;
    this.activeTag = null;
    this.displayLimit = 36;
    this.BATCH_SIZE = 36;
    this.renderAsideCategories();
    this.render();

    // Scroll main content into view on small screens
    const postsEl = document.getElementById('recent-posts-wrapper');
    if (postsEl && window.innerWidth < 960) {
      postsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setTag(tag) {
    this.activeTag = tag;
    this.displayLimit = 36;
    this.render();

    const postsEl = document.getElementById('recent-posts-wrapper');
    if (postsEl && window.innerWidth < 960) {
      postsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getFilteredItems() {
    const items = storage.getItems();
    return items.filter(item => {
      // Category match
      if (this.currentCategory !== 'all' && item.category !== this.currentCategory) {
        return false;
      }

      // Tag match
      if (this.activeTag && (!item.tags || !item.tags.includes(this.activeTag))) {
        return false;
      }

      // Search match
      if (this.searchQuery) {
        const q = this.searchQuery;
        const inTitle = (item.title || '').toLowerCase().includes(q);
        const inDesc = (item.desc || '').toLowerCase().includes(q);
        const inTags = (item.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) {
          return false;
        }
      }

      return true;
    });
  }

  getCategoryColor(catId) {
    switch (catId) {
      case 'sheet_music': return 'var(--neo-pink)';
      case 'video_courses': return 'var(--neo-purple)';
      case 'audio_engine': return 'var(--neo-cyan)';
      case 'teaching_ppt': return 'var(--neo-yellow)';
      case 'instruments_pc': return 'var(--neo-lime)';
      case 'ai_tech': return 'var(--neo-blue)';
      case 'xuefeili_zone': return 'var(--neo-orange)';
      case 'freebies': return 'var(--neo-green)';
      default: return 'var(--neo-yellow)';
    }
  }

  getCategoryEmoji(catId) {
    const found = CATEGORIES.find(c => c.id === catId);
    return found ? found.icon : '⚡';
  }

  render() {
    if (!this.container) return;

    const items = this.getFilteredItems();

    if (this.resultCountLabel) {
      this.resultCountLabel.textContent = `共呈现 ${items.length} 个展品项目`;
    }

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="neo-card" style="text-align: center; padding: 50px 20px; background: #FFF;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">未找到匹配项目</h3>
          <p style="color: #666; font-size: 0.9rem; margin-bottom: 18px;">
            请尝试更换关键词，或点击左侧分类列表浏览其他类别。
          </p>
          <button id="resetSearchBtn" class="neo-btn neo-btn-yellow">
            ⚡ 重置所有筛选
          </button>
        </div>
      `;

      const resetBtn = document.getElementById('resetSearchBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.searchQuery = '';
          if (this.searchInput) this.searchInput.value = '';
          this.currentCategory = 'all';
          this.activeTag = null;
    this.displayLimit = 36;
    this.BATCH_SIZE = 36;
          this.renderAsideCategories();
          this.render();
        });
      }
      return;
    }

    // Article full view
    if (this.currentCategory === 'articles' && !this.searchQuery) {
      this.container.innerHTML = items.map(art => `
        <article class="article-card-full">
          <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center;">
            <span class="neo-badge ${art.badgeColor || 'badge-yellow'}">${art.badge || '专栏'}</span>
            <span class="card-category-pill" style="background: var(--neo-yellow);">专栏干货</span>
            <span style="font-size: 0.8rem; color: #666; margin-left: auto;">📅 ${art.date || '2026-03'}</span>
          </div>
          <h2>${art.title}</h2>
          <div class="article-meta">
            <span>作者：RUI</span>
            <span>阅读：4分钟</span>
            <span>精选干货</span>
          </div>
          <div class="article-body">
            ${art.content}
          </div>
          <div style="margin-top: 20px; padding-top: 14px; border-top: var(--border-thin); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${(art.tags || []).map(t => `<span class="feature-tag"># ${t}</span>`).join('')}
            </div>
            <button class="neo-btn neo-btn-sm neo-btn-white" onclick="navigator.clipboard.writeText(window.location.href); alert('文章链接已复制！');">
              分享文章
            </button>
          </div>
        </article>
      `).join('');
      return;
    }

    // EdNovas Alternating Horizontal Cards (.recent-post-item / .reverse)
    const visibleItems = (this.searchQuery || items.length <= this.displayLimit) ? items : items.slice(0, this.displayLimit);
    const hasMore = items.length > visibleItems.length;

    let cardsHtml = visibleItems.map((item, index) => {
      const isReverse = index % 2 === 1;
      const catColor = this.getCategoryColor(item.category);
      const catEmoji = this.getCategoryEmoji(item.category);

      return `
        <div class="recent-post-item ${isReverse ? 'reverse' : ''}" data-id="${item.id}">
          <!-- Cover Side -->
          <div class="post_cover" style="background-color: ${catColor}; position: relative; overflow: hidden;">
            <span class="cover-corner-tag neo-badge ${item.badgeColor || 'badge-yellow'}" style="z-index: 3;">
              ${item.badge || '精选'}
            </span>
            ${item.coverImage ? `<img src="${item.coverImage}" alt="" loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" onerror="this.style.display='none';">` : ''}
            <div class="cover-emoji-large" style="z-index: 2;">${catEmoji}</div>
            <div style="font-family: var(--font-display); font-weight: 900; font-size: 0.88rem; background: #FFF; border: var(--border-thin); border-radius: var(--radius-sm); padding: 3px 8px; box-shadow: var(--shadow-sm);">
              ${this.getCategoryName(item.category)}
            </div>
          </div>

          <!-- Info Side -->
          <div class="recent-post-info">
            <div>
              <div class="article-meta-wrap">
                <span class="card-category-pill" style="background: #FAF6ED;">
                  ${catEmoji} ${this.getCategoryName(item.category)}
                </span>
                <span>2026</span>
                <span style="color: #888;">•</span>
                <span>交付：${item.delivery ? item.delivery.substring(0, 12) + '...' : '现货/快速交付'}</span>
              </div>

              <a class="article-title btn-view-detail" data-id="${item.id}" href="javascript:void(0);" title="点击查看详情">
                ${item.title}
              </a>

              <p class="article-excerpt-text">
                ${item.desc || ''}
              </p>

              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                ${(item.tags || []).map(t => `<span class="feature-tag"># ${t}</span>`).join('')}
              </div>
            </div>

            <!-- Footer row -->
            <div class="post-footer-row">
              <div class="card-price-tag ${item.priceValue === 0 ? 'free' : ''}" style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 900;">
                ${item.price}
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="neo-btn neo-btn-sm neo-btn-yellow btn-view-detail" data-id="${item.id}">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (hasMore) {
      cardsHtml += `
        <div style="text-align: center; margin: 30px 0 10px; grid-column: 1/-1;">
          <button id="btnLoadMorePlugins" class="neo-btn neo-btn-yellow" style="padding: 12px 32px; font-size: 1.05rem; font-weight: 900; box-shadow: var(--shadow-md);">
            ⚡ 加载更多音频展品 (已呈现 ${visibleItems.length} / 共 ${items.length} 个)
          </button>
        </div>
      `;
    }

    this.container.innerHTML = cardsHtml;

    if (hasMore) {
      const loadMoreBtn = document.getElementById('btnLoadMorePlugins');
      if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
          this.displayLimit += this.BATCH_SIZE;
          this.render();
        });
      }
    }
  }

  getCategoryName(catId) {
    const found = CATEGORIES.find(c => c.id === catId);
    return found ? found.name : catId;
  }
}
