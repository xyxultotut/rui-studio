/**
 * 全站数据持久化引擎 (Storage Manager)
 * 统一管理前台与管理后台的数据读写、增删改查、备份导出与恢复
 */

import { CATEGORIES, ITEMS_DATA } from './data.js';

const STORAGE_KEYS = {
  ITEMS: 'neobrutalism_site_items_v4',
  SITE_CONFIG: 'neobrutalism_site_config_v2'
};

const DEFAULT_CONFIG = {
  siteTitle: 'RUI studio',
  slogan: '独立音乐人 · 硬件极客 · 雪菲力总代',
  bio: '哈尔滨本地多领域创作者。深耕音频工程、乐谱制作、PPT课件视觉与智能软硬件；同时也是哈尔滨雪菲力汽水一级经销商。用硬核技术与靠谱服务交付每一份信任！',
  wechat: 'RUI-STUDIO-MUSIC',
  location: '黑龙江省哈尔滨市 · 欢迎同城交流自提',
  statusText: '当前状态：营业接单中',
  statusBadge: 'LIVE 2026',
  statusState: 'live', // 'live' | 'busy' | 'rest'
  marqueeItems: [
    '🎵 录音贴唱 / 修音 / 商业混音母带',
    '🎼 MUSICNOTES / YOUTUBE / 古典流行海量乐谱',
    '🎬 音乐名师与海外制作人教学实录',
    '🎓 教师赛课PPT / 微课剪辑 / 学术开题辅导',
    '🎹 品牌古筝 / 进口二手钢琴零售',
    '💻 专业音频低延迟电脑主机定制装机',
    '🤖 AI编程辅助 / 提示词工程落地',
    '🥤 哈尔滨雪菲力汽水一级经销 · 现货直发'
  ],
  xuefeili: {
    title: '哈尔滨雪菲力一级经销',
    badge: '老哈味',
    slogan: '哈尔滨老铁的餐桌记忆！气足爽口、果香浓郁，吃烧烤、炖大鹅的灵魂伴侣！',
    flavor1Name: '经典荔枝味',
    flavor1Spec: '24瓶整箱 / ¥48',
    flavor2Name: '经典甜橙味',
    flavor2Spec: '24听整箱 / ¥48',
    notice: '支持哈尔滨同城自提与货拉拉极速派送；面向餐饮饭店、聚会酒席、商超批量供货！'
  }
};

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    // Check if items exist in localStorage, if not initialize from data.js
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      this.saveItems(ITEMS_DATA);
    }
    // Check if siteConfig exists, if not initialize or auto-migrate brand
    const existingConfigRaw = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
    if (!existingConfigRaw) {
      this.saveSiteConfig(DEFAULT_CONFIG);
    } else {
      try {
        const conf = JSON.parse(existingConfigRaw);
        let updated = false;
        if (conf.siteTitle === 'TONG STUDIO' || conf.siteTitle === 'Xiao的小站' || conf.siteTitle === 'Xiao') {
          conf.siteTitle = 'RUI studio';
          updated = true;
        }
        if (conf.wechat === 'TONG-STUDIO-MUSIC') {
          conf.wechat = 'RUI-STUDIO-MUSIC';
          updated = true;
        }
        if (updated) {
          this.saveSiteConfig(conf);
        }
      } catch (e) {}
    }
  }

  // --- Items & Services Operations ---
  getItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return raw ? JSON.parse(raw) : [...ITEMS_DATA];
    } catch (e) {
      console.error('Failed to get items from storage', e);
      return [...ITEMS_DATA];
    }
  }

  saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      this.notifyUpdate();
      return true;
    } catch (e) {
      console.error('Failed to save items to storage', e);
      return false;
    }
  }

  getItemById(id) {
    return this.getItems().find(i => i.id === id) || null;
  }

  addItem(newItem) {
    const items = this.getItems();
    // generate safe id if not provided
    if (!newItem.id) {
      newItem.id = 'item-' + Date.now();
    }
    items.unshift(newItem);
    this.saveItems(items);
    return newItem;
  }

  updateItem(id, updatedFields) {
    const items = this.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedFields };
      this.saveItems(items);
      return items[index];
    }
    return null;
  }

  deleteItem(id) {
    const items = this.getItems();
    const filtered = items.filter(i => i.id !== id);
    this.saveItems(filtered);
    return true;
  }

  // --- Site Config Operations ---
  getSiteConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
      return raw ? JSON.parse(raw) : { ...DEFAULT_CONFIG };
    } catch (e) {
      console.error('Failed to get config from storage', e);
      return { ...DEFAULT_CONFIG };
    }
  }

  saveSiteConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(config));
      this.notifyUpdate();
      return true;
    } catch (e) {
      console.error('Failed to save config to storage', e);
      return false;
    }
  }

  // --- Backup & Restore ---
  exportBackupData() {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      siteConfig: this.getSiteConfig(),
      items: this.getItems()
    };
    return JSON.stringify(data, null, 2);
  }

  importBackupData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('导入文件格式不正确：未找到 items 数据列表');
      }
      if (parsed.items) {
        this.saveItems(parsed.items);
      }
      if (parsed.siteConfig) {
        this.saveSiteConfig(parsed.siteConfig);
      }
      return { success: true, count: parsed.items.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDefaults() {
    this.saveItems(ITEMS_DATA);
    this.saveSiteConfig(DEFAULT_CONFIG);
    return true;
  }

  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('site-storage-updated'));
  }
}

export const storage = new StorageManager();
