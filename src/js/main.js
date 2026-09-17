/**
 * 主程序入口 main.js (EdNovas 排版重构版)
 */

import { storage } from './storage.js';
// InquiryCart removed
import { DetailModal } from './modal.js';
import { FilterSearchEngine } from './filter-search.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification
  const toastEl = document.getElementById('neoToast');
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

  // 2. Typewriter Effect (EdNovas Signature Subtitle)
  const subtitleEl = document.getElementById('subtitle');
  const typePhrases = [
    '独立音乐人 · 硬件极客 · 哈尔滨雪菲力总代',
    '录音棚级贴唱修音 · 商业分轨混音母带',
    'Musicnotes & YouTube 热门乐谱 · 课件PPT美化',
    '人生不止眼前的苟且，还有音乐与雪菲力 🥤',
    '用硬核技术与靠谱服务交付每一份信任！'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 90;

  function typeWriter() {
    if (!subtitleEl) return;

    const currentPhrase = typePhrases[phraseIndex];

    if (isDeleting) {
      subtitleEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 40;
    } else {
      subtitleEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 90;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      typeSpeed = 2200; // Pause at full phrase
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % typePhrases.length;
      typeSpeed = 500;
    }

    setTimeout(typeWriter, typeSpeed);
  }
  typeWriter();

  // 3. Scroll Down Arrow
  const scrollDownBtn = document.getElementById('scroll-down');
  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      document.getElementById('content-inner')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 5. Detail Modal
  const detailModal = new DetailModal(showToast);

  // 6. Filter & Search Engine
  const showcaseGrid = document.getElementById('recent-posts-wrapper');
  const engine = new FilterSearchEngine(showcaseGrid, detailModal, showToast);

  // 7. Social / WeChat Copy Trigger
  const wechatTriggerBtn = document.getElementById('wechatSocialBtn');
  if (wechatTriggerBtn) {
    wechatTriggerBtn.addEventListener('click', () => {
      const config = storage.getSiteConfig();
      const wechat = config.wechat || 'RUI-STUDIO-MUSIC';
      navigator.clipboard.writeText(wechat).then(() => {
        showToast(`微信号【${wechat}】已复制到剪贴板！欢迎添加`);
      });
    });
  }

  // 8. Top Nav Search Focus
  const navSearchBtn = document.getElementById('navSearchBtn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('mainSearchInput');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
      }
    });
  }

  // 9. Back to Top Button
  const toTopBtn = document.getElementById('toTopBtn');
  if (toTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        toTopBtn.style.display = 'flex';
      } else {
        toTopBtn.style.display = 'none';
      }
    });
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 10. Sync Title & Slogan from storage
  function syncSiteBranding() {
    const config = storage.getSiteConfig();
    const siteTitleEl = document.getElementById('site-title');
    const brandNameEl = document.getElementById('brandSiteName');
    if (siteTitleEl) siteTitleEl.textContent = config.siteTitle || 'RUI的小站';
    if (brandNameEl) brandNameEl.textContent = config.siteTitle || 'RUI的小站';
  }
  syncSiteBranding();

  window.addEventListener('site-storage-updated', () => {
    syncSiteBranding();
  });

  // 11. Audio Click Tactile Feedback
  let clickAudioCtx = null;
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.neo-btn, .cat-pill-btn, .social-icon-btn, .nav-menu-item, .cart-remove-btn');
    if (!btn) return;
    try {
      if (!clickAudioCtx) {
        clickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (clickAudioCtx.state === 'suspended') {
        clickAudioCtx.resume();
      }
      const osc = clickAudioCtx.createOscillator();
      const gain = clickAudioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, clickAudioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(310, clickAudioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, clickAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickAudioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(clickAudioCtx.destination);
      osc.start();
      osc.stop(clickAudioCtx.currentTime + 0.04);
    } catch (err) {}
  });

    // 12. Smart Bottom-Sticky Sidebar controller (Natural Bidirectional Page Scroll)
  function initSmartStickySidebar() {
    const aside = document.getElementById('aside-content');
    if (!aside) return;

    const NAV_HEIGHT = 75;
    const BOTTOM_GAP = 24;
    let lastScrollY = window.scrollY;

    function calculateMinTop() {
      const viewportHeight = window.innerHeight;
      const asideHeight = aside.offsetHeight;
      return viewportHeight - asideHeight - BOTTOM_GAP;
    }

    function resetSidebarTop() {
      if (window.innerWidth <= 960) {
        aside.style.position = 'static';
        aside.style.top = '';
        return;
      }
      aside.style.position = 'sticky';
      const minTop = calculateMinTop();
      const maxTop = NAV_HEIGHT;
      if (minTop >= maxTop) {
        aside.style.top = `${maxTop}px`;
      } else {
        aside.style.top = `${minTop}px`;
      }
    }

    resetSidebarTop();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (window.innerWidth <= 960) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const delta = scrollY - lastScrollY;
          lastScrollY = scrollY;

          const minTop = calculateMinTop();
          const maxTop = NAV_HEIGHT;

          if (minTop >= maxTop) {
            aside.style.top = `${maxTop}px`;
            ticking = false;
            return;
          }

          const currentRectTop = aside.getBoundingClientRect().top;

          if (delta > 0) {
            // Scrolling down: move up towards minTop (anchoring bottom of sidebar to screen bottom)
            const targetTop = Math.max(minTop, currentRectTop - delta);
            aside.style.top = `${targetTop}px`;
          } else if (delta < 0) {
            // Scrolling up: move down towards maxTop (anchoring top of sidebar to top navbar)
            const targetTop = Math.min(maxTop, currentRectTop - delta);
            aside.style.top = `${targetTop}px`;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      resetSidebarTop();
    });

    window.addEventListener('site-storage-updated', () => {
      setTimeout(resetSidebarTop, 100);
    });
  }

  initSmartStickySidebar();

    // 12. Smart Bottom-Sticky Sidebar controller (Natural Bidirectional Page Scroll)
  function initSmartStickySidebar() {
    const aside = document.getElementById('aside-content');
    if (!aside) return;

    const NAV_HEIGHT = 75;
    const BOTTOM_GAP = 24;
    let lastScrollY = window.scrollY;

    function calculateMinTop() {
      const viewportHeight = window.innerHeight;
      const asideHeight = aside.offsetHeight;
      return viewportHeight - asideHeight - BOTTOM_GAP;
    }

    function resetSidebarTop() {
      if (window.innerWidth <= 960) {
        aside.style.position = 'static';
        aside.style.top = '';
        return;
      }
      aside.style.position = 'sticky';
      const minTop = calculateMinTop();
      const maxTop = NAV_HEIGHT;
      if (minTop >= maxTop) {
        aside.style.top = `${maxTop}px`;
      } else {
        aside.style.top = `${minTop}px`;
      }
    }

    resetSidebarTop();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (window.innerWidth <= 960) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const delta = scrollY - lastScrollY;
          lastScrollY = scrollY;

          const minTop = calculateMinTop();
          const maxTop = NAV_HEIGHT;

          if (minTop >= maxTop) {
            aside.style.top = `${maxTop}px`;
            ticking = false;
            return;
          }

          const currentRectTop = aside.getBoundingClientRect().top;

          if (delta > 0) {
            // Scrolling down: move up towards minTop (anchoring bottom of sidebar to screen bottom)
            const targetTop = Math.max(minTop, currentRectTop - delta);
            aside.style.top = `${targetTop}px`;
          } else if (delta < 0) {
            // Scrolling up: move down towards maxTop (anchoring top of sidebar to top navbar)
            const targetTop = Math.min(maxTop, currentRectTop - delta);
            aside.style.top = `${targetTop}px`;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      resetSidebarTop();
    });

    window.addEventListener('site-storage-updated', () => {
      setTimeout(resetSidebarTop, 100);
    });
  }

  initSmartStickySidebar();

  console.log('EdNovas Layout Integrated Successfully.');
});
