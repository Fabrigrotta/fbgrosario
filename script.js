/* ============================================================
   FBG SERVICIO TÉCNICO - Lógica Principal
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  /* ============================================================
     1. MENÚ MOBILE
     ============================================================ */
  function initMobileMenu() {
    const toggle = $('#mobile-menu-toggle');
    const menu = $('#mobile-menu');
    const icon = $('#mobile-menu-icon');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        menu.classList.remove('hidden');
        if (icon) icon.textContent = 'close';
      } else {
        menu.classList.add('hidden');
        if (icon) icon.textContent = 'menu';
      }
    }

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    $$('.mobile-nav-link', menu).forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) setOpen(false);
    });
  }

  /* ============================================================
     2. SISTEMA DE CUPONES
     ============================================================ */
  function getCouponsFromStorage() {
    const stored = localStorage.getItem('fbg_coupons');
    if (stored) {
      const parsed = JSON.parse(stored);
      const activeOnly = {};
      parsed.forEach(c => {
        if (c.status === 'ACTIVO') activeOnly[c.code] = c;
      });
      return activeOnly;
    }
    // Fallback
    return {
      FBG10: { code: 'FBG10', type: 'PERCENT', value: 10 },
      PROMO15: { code: 'PROMO15', type: 'PERCENT', value: 15 },
      CYBER20: { code: 'CYBER20', type: 'PERCENT', value: 20 }
    };
  }

  const formatARS = (n) => '$ ' + n.toLocaleString('es-AR');
  const formatARSTable = (n) => '$' + n.toLocaleString('es-AR');

  function initCouponSystem() {
    const modal = $('#coupon-modal');
    const input = $('#coupon-input');
    const openBtns = [$('#open-coupon-btn'), $('#open-coupon-btn-mobile')];
    const applyBtn = $('#apply-coupon-btn');
    const btnTexts = [$('#coupon-btn-text'), $('#coupon-btn-text-mobile')];
    const successAlert = $('#coupon-alert-success');
    const errorAlert = $('#coupon-alert-error');
    const successMsg = $('#coupon-success-msg');
    const navBtn = $('#open-coupon-btn');

    if (!modal) return;

    function openModal() {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input && input.focus(), 60);
    }

    function closeModal() {
      modal.classList.add('hidden');
      errorAlert && errorAlert.classList.add('hidden');
      document.body.style.overflow = '';
    }

    function applyCoupon() {
      const rawCode = (input?.value || '').trim().toUpperCase();
      if (!rawCode) {
        errorAlert?.classList.remove('hidden');
        successAlert?.classList.add('hidden');
        return;
      }

      const availableCoupons = getCouponsFromStorage();
      let couponData = availableCoupons[rawCode];

      if (!couponData) {
        const matches = rawCode.match(/\d+/);
        if (matches) {
          const num = Math.min(Math.max(parseInt(matches[0], 10), 5), 50);
          couponData = { code: rawCode, type: 'PERCENT', value: num };
        }
      }

      if (couponData) {
        const isPercent = couponData.type === 'PERCENT';
        const val = couponData.value;
        const typeStr = isPercent ? '%' : '$';

        errorAlert?.classList.add('hidden');
        successAlert?.classList.remove('hidden');
        if (successMsg) {
          successMsg.innerText = `¡CUPÓN ${rawCode} ACTIVADO! ${typeStr}${val} OFF aplicado.`;
        }

        btnTexts.forEach((el) => {
          if (el) el.innerText = `Cupón: ${typeStr}${val} OFF`;
        });

        if (navBtn) {
          navBtn.classList.remove('from-secondary', 'to-primary');
          navBtn.classList.add('from-emerald-500', 'via-teal-600', 'to-primary', 'border-emerald-400');
        }

        updateAllPrices(couponData);
      } else {
        errorAlert?.classList.remove('hidden');
        successAlert?.classList.add('hidden');
      }
    }

    function removeCoupon() {
      if (input) input.value = '';
      successAlert?.classList.add('hidden');
      errorAlert?.classList.add('hidden');

      btnTexts.forEach((el) => {
        if (el) el.innerText = 'Canjear Cupón';
      });

      if (navBtn) {
        navBtn.classList.remove('from-emerald-500', 'via-teal-600', 'border-emerald-400');
        navBtn.classList.add('from-secondary', 'to-primary');
      }

      updateAllPrices({ type: 'PERCENT', value: 0 });
    }

    function updateAllPrices(discountData) {
      const isPercent = discountData.type === 'PERCENT';
      const val = discountData.value;

      $$('[data-price-container]').forEach((container) => {
        const basePrice = parseInt(container.getAttribute('data-price-container'), 10);
        const card = container.closest('.cyber-plan-card');
        const btn = card ? card.querySelector('.card-btn-action') : null;
        const originalHref = btn ? btn.getAttribute('href') : null;

        if (val > 0) {
          let discounted = basePrice;
          let badgeText = '';
          if (isPercent) {
            discounted = Math.round(basePrice * (1 - val / 100));
            badgeText = `-${val}%`;
          } else {
            discounted = Math.max(0, basePrice - val);
            badgeText = `-$${val.toLocaleString('es-AR')}`;
          }

          container.innerHTML = `
            <div class="flex flex-col">
              <span class="text-xs line-through text-slate-500 font-mono">${formatARS(basePrice)}</span>
              <div class="flex items-baseline gap-1.5 flex-wrap">
                <span class="text-2xl sm:text-3xl font-bold font-mono text-[#00f0ff] drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">${formatARS(discounted)}</span>
                <span class="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">${badgeText}</span>
                <span class="text-xs text-primary font-mono">ARS</span>
              </div>
            </div>`;
        } else {
          container.innerHTML = `
            <span class="text-2xl sm:text-3xl text-white font-bold font-mono price-display" data-base="${basePrice}">${formatARS(basePrice)}</span>
            <span class="text-xs text-primary font-mono currency-tag">ARS</span>`;
        }
        if (btn && originalHref) btn.setAttribute('href', originalHref);
      });

      $$('.price-table').forEach((span) => {
        const basePrice = parseInt(span.getAttribute('data-base'), 10);
        const parent = span.parentElement;

        if (val > 0) {
          let discounted = basePrice;
          let badgeText = '';
          if (isPercent) {
            discounted = Math.round(basePrice * (1 - val / 100));
            badgeText = `-${val}%`;
          } else {
            discounted = Math.max(0, basePrice - val);
            badgeText = `-$${val}`;
          }

          parent.innerHTML = `
            <div class="flex items-center gap-1.5 flex-wrap justify-end">
              <span class="text-xs line-through text-slate-500 font-mono">${formatARSTable(basePrice)}</span>
              <span class="font-mono font-bold text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] whitespace-nowrap">${formatARSTable(discounted)}</span>
              <span class="text-[10px] font-bold font-mono px-1 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">${badgeText}</span>
            </div>`;
        } else {
          parent.innerHTML = `
            <span class="font-mono font-bold text-white group-hover:text-secondary transition-colors price-table whitespace-nowrap" data-base="${basePrice}">${formatARSTable(basePrice)}</span>`;
        }
      });
    }

    openBtns.forEach((btn) => btn && btn.addEventListener('click', openModal));
    applyBtn && applyBtn.addEventListener('click', applyCoupon);

    $$('[data-close-coupon]').forEach((btn) => btn.addEventListener('click', closeModal));
    $$('[data-coupon]').forEach((btn) => btn.addEventListener('click', () => {
      if (input) input.value = btn.getAttribute('data-coupon');
      applyCoupon();
    }));
    $$('[data-remove-coupon]').forEach((btn) => btn.addEventListener('click', removeCoupon));

    input && input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Chequear si viene un cupón por URL al cargar la página
    const urlParams = new URLSearchParams(window.location.search);
    const cuponParam = urlParams.get('cupon');
    if (cuponParam) {
      if (input) input.value = cuponParam;
      setTimeout(() => applyCoupon(), 300);
    }
  }

  /* ============================================================
     3. CANVAS DE PARTÍCULAS
     ============================================================ */
  function initParticles() {
    const canvas = document.getElementById('hero-particles');
    const section = document.getElementById('hero-section');
    if (!canvas || !section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let width = 0, height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationId = null;
    const mouse = { x: -9999, y: -9999, radius: 190 };

    const palettes = [
      { color: 'rgba(255, 0, 127, ',  glow: '#ff007f' },
      { color: 'rgba(255, 20, 147, ', glow: '#ff1493' },
      { color: 'rgba(255, 74, 141, ', glow: '#ff4a8d' },
      { color: 'rgba(0, 240, 255, ',  glow: '#00f0ff' },
      { color: 'rgba(125, 244, 255, ', glow: '#00dbe9' },
      { color: 'rgba(192, 132, 252, ', glow: '#c084fc' }
    ];

    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 70 : 140;
    const particles = [];

    function updateDimensions() {
      const rect = section.getBoundingClientRect();
      width = rect.width || section.offsetWidth;
      height = rect.height || section.offsetHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.8 + 1.2;
        const scheme = palettes[Math.floor(Math.random() * palettes.length)];
        this.colorBase = scheme.color;
        this.glowColor = scheme.glow;
        this.alpha = Math.random() * 0.6 + 0.35;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.25 + 0.1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.pushX = 0; this.pushY = 0;
      }
      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = this.colorBase + this.alpha + ')';
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.size > 2.5 ? 12 : 8;
        ctx.fill();
        ctx.restore();
      }
      update() {
        this.x += this.vx + this.pushX;
        this.y += this.vy + this.pushY;
        this.pushX *= 0.94; this.pushY *= 0.94;
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance < mouse.radius && distance > 0.1) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.pushX -= (dx / distance) * force * 1.8;
          this.pushY -= (dy / distance) * force * 1.8;
        }
        const margin = 10;
        if (this.x < -margin) this.x = width + margin;
        else if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        else if (this.y > height + margin) this.y = -margin;
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      updateDimensions();
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
      if (animationId) cancelAnimationFrame(animationId);
      animate();
    }

    function onResize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      updateDimensions();
    }

    start();
    window.addEventListener('resize', onResize);

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    section.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    section.addEventListener('touchmove', (e) => {
      const rect = section.getBoundingClientRect();
      const t = e.touches[0];
      mouse.x = t.clientX - rect.left;
      mouse.y = t.clientY - rect.top;
    }, { passive: true });
    section.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });
  }

  function init() {
    initMobileMenu();
    initCouponSystem();
    initParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();