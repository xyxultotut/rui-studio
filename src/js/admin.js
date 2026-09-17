/**
 * 站长免代码管理后台控制器 admin.js
 */

import { storage } from './storage.js';
import { CATEGORIES } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification
  const toastEl = document.getElementById('adminToast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.querySelector('.toast-text').textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }

  // 2. Tab Navigation
  const tabs = document.querySelectorAll('.admin-tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(tab.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // 3. Stats calculation
  function updateStats() {
    const items = storage.getItems();
    const resourceCount = items.filter(i => i.category !== 'articles').length;
    const articleCount = items.filter(i => i.category === 'articles').length;
    const freebieCount = items.filter(i => i.category === 'freebies' || (i.priceValue === 0 && i.category !== 'articles')).length;

    const totalEl = document.getElementById('statTotalItems');
    const articlesEl = document.getElementById('statTotalArticles');
    const freebiesEl = document.getElementById('statTotalFreebies');

    if (totalEl) totalEl.textContent = resourceCount;
    if (articlesEl) articlesEl.textContent = articleCount;
    if (freebiesEl) freebiesEl.textContent = freebieCount;
  }

  // =========================================================================
  // TAB 1: 资源与服务管理 (ITEMS & SERVICES)
  // =========================================================================
  const itemsTableBody = document.getElementById('itemsTableBody');
  const itemsFilterCategory = document.getElementById('itemsFilterCategory');
  const itemsSearchInput = document.getElementById('itemsSearchInput');
  const btnOpenAddItemModal = document.getElementById('btnOpenAddItemModal');
  const itemEditModal = document.getElementById('itemEditModal');
  const itemEditForm = document.getElementById('itemEditForm');
  const itemModalCloseBtn = document.getElementById('itemModalCloseBtn');
  const itemModalCancelBtn = document.getElementById('itemModalCancelBtn');
  const itemModalTitle = document.getElementById('itemModalTitle');

  // Populate category filter options
  if (itemsFilterCategory) {
    const validCats = CATEGORIES.filter(c => c.id !== 'articles');
    itemsFilterCategory.innerHTML = `
      <option value="all">⚡ 全部业务分类</option>
      ${validCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
    `;

    itemsFilterCategory.addEventListener('change', () => renderItemsTable());
  }

  if (itemsSearchInput) {
    itemsSearchInput.addEventListener('input', () => renderItemsTable());
  }

  function renderItemsTable() {
    if (!itemsTableBody) return;

    const allItems = storage.getItems();
    const categoryFilter = itemsFilterCategory ? itemsFilterCategory.value : 'all';
    const searchQuery = itemsSearchInput ? itemsSearchInput.value.trim().toLowerCase() : '';

    // Filter out articles here (they are managed in tab 2)
    let filtered = allItems.filter(i => i.category !== 'articles');

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(searchQuery) ||
        (i.desc && i.desc.toLowerCase().includes(searchQuery)) ||
        (i.tags && i.tags.some(t => t.toLowerCase().includes(searchQuery)))
      );
    }

    if (filtered.length === 0) {
      itemsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px 16px; color: #888; font-weight: 700;">
            暂无匹配项目，请点击上方【➕ 新增资源或服务】进行添加
          </td>
        </tr>
      `;
      return;
    }

    itemsTableBody.innerHTML = filtered.map((item, index) => `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 800; color: #666;">
          ${index + 1}
        </td>
        <td>
          <span class="neo-badge ${item.badgeColor || 'badge-yellow'}">
            ${item.badge || '精选'}
          </span>
        </td>
        <td>
          <div style="font-weight: 800; font-size: 0.95rem; margin-bottom: 2px;">
            ${item.title}
          </div>
          <div style="font-size: 0.78rem; color: #555; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.desc}
          </div>
        </td>
        <td>
          <span class="card-category-pill" style="background: #FAF6ED;">
            ${getCategoryLabel(item.category)}
          </span>
        </td>
        <td style="font-family: var(--font-display); font-weight: 800;">
          ${item.price}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="neo-btn neo-btn-sm neo-btn-white btn-edit-item" data-id="${item.id}" title="修改此项">
              ✏️ 编辑
            </button>
            <button class="neo-btn neo-btn-sm neo-btn-white btn-delete-item" data-id="${item.id}" title="删除此项" style="color: red;">
              🗑️ 删除
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Bind Edit & Delete buttons
    itemsTableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', () => openItemModal('edit', btn.dataset.id));
    });

    itemsTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const targetItem = storage.getItemById(id);
        if (confirm(`确定要删除「${targetItem ? targetItem.title : id}」吗？此操作无法撤销。`)) {
          storage.deleteItem(id);
          showToast('项目已成功删除！');
          renderItemsTable();
          updateStats();
        }
      });
    });
  }

  function getCategoryLabel(catId) {
    const found = CATEGORIES.find(c => c.id === catId);
    return found ? `${found.icon} ${found.name}` : catId;
  }

  // Item Modal Handlers
  function openItemModal(mode, itemId = null) {
    if (!itemEditModal) return;

    // Reset form
    itemEditForm.reset();
    document.getElementById('editItemId').value = '';

    if (mode === 'create') {
      itemModalTitle.textContent = '➕ 新增资源或服务项目';
      document.getElementById('editItemCategory').value = 'sheet_music';
      document.getElementById('editItemBadgeColor').value = 'badge-yellow';
      document.getElementById('editItemPriceValue').value = '20';
    } else {
      itemModalTitle.textContent = '✏️ 编辑资源或服务项目';
      const item = storage.getItemById(itemId);
      if (item) {
        document.getElementById('editItemId').value = item.id;
        document.getElementById('editItemCategory').value = item.category;
        document.getElementById('editItemTitle').value = item.title;
        document.getElementById('editItemPrice').value = item.price;
        document.getElementById('editItemPriceValue').value = item.priceValue || 0;
        document.getElementById('editItemBadge').value = item.badge || '精选';
        document.getElementById('editItemBadgeColor').value = item.badgeColor || 'badge-yellow';
        document.getElementById('editItemTags').value = (item.tags || []).join(', ');
        document.getElementById('editItemDesc').value = item.desc || '';
        document.getElementById('editItemDelivery').value = item.delivery || '';
        document.getElementById('editItemDetails').value = item.details || '';
      }
    }

    itemEditModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeItemModal() {
    if (!itemEditModal) return;
    itemEditModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (btnOpenAddItemModal) {
    btnOpenAddItemModal.addEventListener('click', () => openItemModal('create'));
  }
  if (itemModalCloseBtn) {
    itemModalCloseBtn.addEventListener('click', closeItemModal);
  }
  if (itemModalCancelBtn) {
    itemModalCancelBtn.addEventListener('click', closeItemModal);
  }

  if (itemEditForm) {
    itemEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editItemId').value;
      const category = document.getElementById('editItemCategory').value;
      const title = document.getElementById('editItemTitle').value.trim();
      const price = document.getElementById('editItemPrice').value.trim();
      const priceValue = parseFloat(document.getElementById('editItemPriceValue').value) || 0;
      const badge = document.getElementById('editItemBadge').value.trim() || '推荐';
      const badgeColor = document.getElementById('editItemBadgeColor').value;
      const rawTags = document.getElementById('editItemTags').value;
      const desc = document.getElementById('editItemDesc').value.trim();
      const delivery = document.getElementById('editItemDelivery').value.trim();
      const details = document.getElementById('editItemDetails').value.trim();

      const tags = rawTags
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const itemPayload = {
        category,
        title,
        price,
        priceValue,
        badge,
        badgeColor,
        tags,
        desc,
        delivery,
        details
      };

      if (id) {
        storage.updateItem(id, itemPayload);
        showToast('项目已成功更新！');
      } else {
        storage.addItem(itemPayload);
        showToast('新项目已成功创建！');
      }

      closeItemModal();
      renderItemsTable();
      updateStats();
    });
  }

  // =========================================================================
  // TAB 2: 专栏文章管理 (ARTICLES MANAGEMENT)
  // =========================================================================
  const articlesListContainer = document.getElementById('articlesListContainer');
  const btnOpenAddArticleModal = document.getElementById('btnOpenAddArticleModal');
  const articleEditModal = document.getElementById('articleEditModal');
  const articleEditForm = document.getElementById('articleEditForm');
  const articleModalCloseBtn = document.getElementById('articleModalCloseBtn');
  const articleModalCancelBtn = document.getElementById('articleModalCancelBtn');
  const articleModalTitle = document.getElementById('articleModalTitle');

  function renderArticlesList() {
    if (!articlesListContainer) return;

    const allItems = storage.getItems();
    const articles = allItems.filter(i => i.category === 'articles');

    if (articles.length === 0) {
      articlesListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #888; font-weight: 700;">
          暂无已发布的专栏文章，点击上方【➕ 发布新文章】开始撰写吧！
        </div>
      `;
      return;
    }

    articlesListContainer.innerHTML = articles.map(art => `
      <div class="neo-card" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="neo-badge ${art.badgeColor || 'badge-yellow'}">${art.badge || '专栏'}</span>
            <span style="font-size: 0.8rem; color: #666;">📅 ${art.date || '2026-03'}</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 8px;">${art.title}</h3>
          <p style="font-size: 0.86rem; color: #444; margin-bottom: 10px; line-height: 1.45;">${art.desc}</p>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${(art.tags || []).map(t => `<span class="feature-tag"># ${t}</span>`).join('')}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="neo-btn neo-btn-sm neo-btn-white btn-edit-article" data-id="${art.id}">
            ✏️ 编辑文章
          </button>
          <button class="neo-btn neo-btn-sm neo-btn-white btn-delete-article" data-id="${art.id}" style="color: red;">
            🗑️ 删除
          </button>
        </div>
      </div>
    `).join('');

    articlesListContainer.querySelectorAll('.btn-edit-article').forEach(btn => {
      btn.addEventListener('click', () => openArticleModal('edit', btn.dataset.id));
    });

    articlesListContainer.querySelectorAll('.btn-delete-article').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('确定要删除这篇专栏文章吗？')) {
          storage.deleteItem(id);
          showToast('文章已删除');
          renderArticlesList();
          updateStats();
        }
      });
    });
  }

  function openArticleModal(mode, articleId = null) {
    if (!articleEditModal) return;

    articleEditForm.reset();
    document.getElementById('editArticleId').value = '';

    if (mode === 'create') {
      articleModalTitle.textContent = '➕ 发布新专栏文章';
      document.getElementById('editArticleDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('editArticleBadge').value = '原创干货';
    } else {
      articleModalTitle.textContent = '✏️ 编辑专栏文章';
      const art = storage.getItemById(articleId);
      if (art) {
        document.getElementById('editArticleId').value = art.id;
        document.getElementById('editArticleTitle').value = art.title;
        document.getElementById('editArticleDate').value = art.date || '';
        document.getElementById('editArticleBadge').value = art.badge || '干货';
        document.getElementById('editArticleTags').value = (art.tags || []).join(', ');
        document.getElementById('editArticleDesc').value = art.desc || '';
        document.getElementById('editArticleContent').value = art.content || '';
      }
    }

    articleEditModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeArticleModal() {
    if (!articleEditModal) return;
    articleEditModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (btnOpenAddArticleModal) {
    btnOpenAddArticleModal.addEventListener('click', () => openArticleModal('create'));
  }
  if (articleModalCloseBtn) {
    articleModalCloseBtn.addEventListener('click', closeArticleModal);
  }
  if (articleModalCancelBtn) {
    articleModalCancelBtn.addEventListener('click', closeArticleModal);
  }

  if (articleEditForm) {
    articleEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editArticleId').value;
      const title = document.getElementById('editArticleTitle').value.trim();
      const date = document.getElementById('editArticleDate').value.trim();
      const badge = document.getElementById('editArticleBadge').value.trim();
      const rawTags = document.getElementById('editArticleTags').value;
      const desc = document.getElementById('editArticleDesc').value.trim();
      const content = document.getElementById('editArticleContent').value.trim();

      const tags = rawTags
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const articlePayload = {
        category: 'articles',
        title,
        date,
        badge,
        badgeColor: 'badge-yellow',
        price: '干货专栏',
        priceValue: 0,
        tags,
        desc,
        content
      };

      if (id) {
        storage.updateItem(id, articlePayload);
        showToast('文章已成功更新！');
      } else {
        storage.addItem(articlePayload);
        showToast('新文章已发布！');
      }

      closeArticleModal();
      renderArticlesList();
      updateStats();
    });
  }

  // =========================================================================
  // TAB 3: 雪菲力专区设置 (XUEFEILI CONFIG)
  // =========================================================================
  const xuefeiliForm = document.getElementById('xuefeiliForm');

  function loadXuefeiliConfig() {
    const config = storage.getSiteConfig();
    const x = config.xuefeili || {};
    document.getElementById('xfTitle').value = x.title || '哈尔滨雪菲力一级经销';
    document.getElementById('xfBadge').value = x.badge || '老哈味';
    document.getElementById('xfSlogan').value = x.slogan || '';
    document.getElementById('xfFlavor1Name').value = x.flavor1Name || '经典荔枝味';
    document.getElementById('xfFlavor1Spec').value = x.flavor1Spec || '24瓶整箱 / ¥48';
    document.getElementById('xfFlavor2Name').value = x.flavor2Name || '经典甜橙味';
    document.getElementById('xfFlavor2Spec').value = x.flavor2Spec || '24听整箱 / ¥48';
    document.getElementById('xfNotice').value = x.notice || '';
  }

  if (xuefeiliForm) {
    xuefeiliForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const config = storage.getSiteConfig();
      config.xuefeili = {
        title: document.getElementById('xfTitle').value.trim(),
        badge: document.getElementById('xfBadge').value.trim(),
        slogan: document.getElementById('xfSlogan').value.trim(),
        flavor1Name: document.getElementById('xfFlavor1Name').value.trim(),
        flavor1Spec: document.getElementById('xfFlavor1Spec').value.trim(),
        flavor2Name: document.getElementById('xfFlavor2Name').value.trim(),
        flavor2Spec: document.getElementById('xfFlavor2Spec').value.trim(),
        notice: document.getElementById('xfNotice').value.trim()
      };
      storage.saveSiteConfig(config);
      showToast('雪菲力专区配置已成功保存！');
    });
  }

  // =========================================================================
  // TAB 4: 站长资料与全站配置 (PROFILE & SITE CONFIG)
  // =========================================================================
  const profileForm = document.getElementById('profileForm');

  function loadProfileConfig() {
    const config = storage.getSiteConfig();
    document.getElementById('cfgSiteTitle').value = config.siteTitle || '';
    document.getElementById('cfgSlogan').value = config.slogan || '';
    document.getElementById('cfgBio').value = config.bio || '';
    document.getElementById('cfgWechat').value = config.wechat || '';
    document.getElementById('cfgLocation').value = config.location || '';
    document.getElementById('cfgStatusText').value = config.statusText || '';
    document.getElementById('cfgStatusState').value = config.statusState || 'live';
    document.getElementById('cfgMarqueeItems').value = (config.marqueeItems || []).join('\n');
  }

  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const config = storage.getSiteConfig();
      config.siteTitle = document.getElementById('cfgSiteTitle').value.trim();
      config.slogan = document.getElementById('cfgSlogan').value.trim();
      config.bio = document.getElementById('cfgBio').value.trim();
      config.wechat = document.getElementById('cfgWechat').value.trim();
      config.location = document.getElementById('cfgLocation').value.trim();
      config.statusText = document.getElementById('cfgStatusText').value.trim();
      config.statusState = document.getElementById('cfgStatusState').value;
      config.marqueeItems = document.getElementById('cfgMarqueeItems').value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      storage.saveSiteConfig(config);
      showToast('站长信息与全站配置已成功更新！');
    });
  }

  // =========================================================================
  // TAB 5: 备份、导入与恢复 (BACKUP & RESTORE)
  // =========================================================================
  const btnExportBackup = document.getElementById('btnExportBackup');
  const btnImportBackup = document.getElementById('btnImportBackup');
  const backupFileInput = document.getElementById('backupFileInput');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  if (btnExportBackup) {
    btnExportBackup.addEventListener('click', () => {
      const jsonStr = storage.exportBackupData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `rui-studio-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('备份文件已导出并下载至您的电脑！');
    });
  }

  if (btnImportBackup && backupFileInput) {
    btnImportBackup.addEventListener('click', () => {
      backupFileInput.click();
    });

    backupFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const result = storage.importBackupData(content);
        if (result.success) {
          showToast(`导入成功！共载入 ${result.count} 个项目与配置`);
          renderItemsTable();
          renderArticlesList();
          loadXuefeiliConfig();
          loadProfileConfig();
          updateStats();
        } else {
          alert('导入失败：' + result.error);
        }
      };
      reader.readAsText(file);
      backupFileInput.value = '';
    });
  }

  if (btnResetDefaults) {
    btnResetDefaults.addEventListener('click', () => {
      if (confirm('警告：确定要将全站数据恢复为系统出厂预设吗？当前的所有修改将被重置！')) {
        storage.resetToDefaults();
        showToast('已恢复出厂初始数据！');
        renderItemsTable();
        renderArticlesList();
        loadXuefeiliConfig();
        loadProfileConfig();
        updateStats();
      }
    });
  }

  // Initial loads
  updateStats();
  renderItemsTable();
  renderArticlesList();
  loadXuefeiliConfig();
  loadProfileConfig();

  console.log('Neobrutalism Admin Dashboard Initialized.');
});
