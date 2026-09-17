/**
 * 意向咨询单管理器 (Inquiry Cart)
 * 允许用户将心仪的乐谱、服务项目或雪菲力汽水加入咨询篮，并一键生成微信对接文案
 */

const STORAGE_KEY = 'neobrutalism_inquiry_cart';

export class InquiryCart {
  constructor(renderCallback, toastCallback) {
    this.items = this.load();
    this.renderCallback = renderCallback;
    this.toastCallback = toastCallback;
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load cart from localStorage', e);
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage', e);
    }
    if (this.renderCallback) {
      this.renderCallback(this.items);
    }
  }

  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      this.items.push({
        id: item.id,
        title: item.title,
        price: item.price,
        priceValue: item.priceValue || 0,
        category: item.category,
        quantity: 1
      });
    }
    this.save();
    if (this.toastCallback) {
      this.toastCallback(`已将「${item.title.substring(0, 14)}...」加入咨询单！`);
    }
  }

  removeItem(itemId) {
    this.items = this.items.filter(i => i.id !== itemId);
    this.save();
    if (this.toastCallback) {
      this.toastCallback('已从咨询单移除该项');
    }
  }

  clear() {
    this.items = [];
    this.save();
    if (this.toastCallback) {
      this.toastCallback('已清空咨询单');
    }
  }

  getItems() {
    return this.items;
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  generateInquiryText() {
    if (this.items.length === 0) {
      return '';
    }

    let text = `【站长您好！我在个人站选好了以下意向项目，特来咨询订购/档期】：\n--------------------------------\n`;
    this.items.forEach((item, index) => {
      text += `${index + 1}. ${item.title}  [${item.price}] x${item.quantity || 1}\n`;
    });
    text += `--------------------------------\n`;
    text += `请问目前能安排交付/有现货吗？谢谢！`;
    return text;
  }
}
