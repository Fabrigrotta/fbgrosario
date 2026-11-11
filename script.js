/* ============================================================
   FBG SERVICIO TÉCNICO - Lógica de cupones + partículas
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. SISTEMA DE CUPONES
     ============================================================ */
  const availableCoupons = {
    'FBG10': 10,
    'PROMO10': 10,
    'FBG15': 15,
    'PROMO15': 15,
    'FBG20': 20,
    'CYBER20': 20,
    'PROMO20': 20,
    'CYBERTECH': 25,
    'FBG25': 25
  };

  let activeDiscountPercent = 0;
  let activeCouponCode = '';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const modal = $('#coupon-modal');
  const input = $('#coupon-input');
  const openBtn = $('#open-coupon-btn');
  const applyBtn = $('#apply-coupon-btn');
  const btnText = $('#coupon-btn-text');
  const successAlert = $('#coupon-alert-success');
  const errorAlert = $('#coupon-alert-error');
  const successMsg = $('#coupon-success-msg');
  const navBtn = openBtn;

  // ---- Helpers de formato ----
  const formatARS = (n) => '$ ' + n.toLocaleString('es-AR');
  const formatARSTable = (n) => '$' + n.toLocaleString('es-AR');

  // ---- Abrir / Cerrar modal ----
  function openCouponModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input && input.focus(), 60);
  }

  function closeCouponModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    errorAlert && errorAlert.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ---- Aplicar cupón ----
  function applyCoupon() {
    const rawCode = (input?.value || '').trim().toUpperCase();

    if (!rawCode) {
      errorAlert?.classList.remove('hidden');
      successAlert?.classList.add('hidden');
      return;
    }

    let discount = 0;
    if (availableCoupons[rawCode]) {
      discount = availableCoupons[rawCode];
    } else {
      const matches = rawCode.match(/\d+/);
      if (matches) {
        discount = Math.min(Math.max(parseInt(matches[0], 10), 5), 50);
      }
    }

    if (discount > 0) {
      activeDiscountPercent = discount;
      activeCouponCode = rawCode;

      errorAlert?.classList.add('hidden');
      successAlert?.classList.remove('hidden');
      if (successMsg) {
        successMsg.innerText = `¡CUPÓN ${activeCouponCode} ACTIVADO! ${discount}% OFF aplicado en todos los valores.`;
      }

      if (btnText) btnText.innerText = `Cupón: ${discount}% OFF Activo`;
      if (navBtn) {
        navBtn.classList.remove('from-secondary', 'to-primary');
        navBtn.classList.add('from-emerald-500', 'via-teal-600', 'to-primary', 'border-emerald-400');
      }

      updateAllPrices(discount);
    } else {
      errorAlert?.classList.remove('hidden');
      successAlert?.classList.add('hidden');
    }
  }

  // ---- Quitar cupón ----
  function removeCoupon() {
    activeDiscountPercent = 0;
    activeCouponCode = '';
    if (input) input.value = '';
    successAlert?.classList.add('hidden');
    errorAlert?.classList.add('hidden');

    if (btnText) btnText.innerText = 'Canjear Cupón';
    if (navBtn) {
      navBtn.classList.remove('from-emerald-500', 'via-teal-600', 'border-emerald-400');
      navBtn.classList.add('from-secondary', 'to-primary');
    }

    updateAllPrices(0);
  }

  // ---- Recalcular precios en pantalla ----
  function updateAllPrices(discountPercent) {
    // 1) Cards de planes
    $$('[data-price-container]').forEach((container) => {
      const basePrice = parseInt(container.getAttribute('data-price-container'), 10);

      if (discountPercent > 0) {
        const discounted = Math.round(basePrice * (1 - discountPercent / 100));
        container.innerHTML = `
          <div class="flex flex-col">
            <span class="text-xs line-through text-slate-500 font-mono">${formatARS(basePrice)}</span>
            <div class="flex items-baseline gap-1.5">
              <span class="text-3xl font-bold font-mono text-[#00f0ff] drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]">${formatARS(discounted)}</span>
              <span class="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">-${discountPercent}%</span>
              <span class="text-xs text-primary font-mono">ARS</span>
            </div>
          </div>`;
      } else {
        container.innerHTML = `
          <span class="text-3xl text-white font-bold font-mono price-display" data-base="${basePrice}">${formatARS(basePrice)}</span>
          <span class="text-xs text-primary font-mono currency-tag">ARS</span>`;
      }
    });

    // 2) Tabla de tarifario
    $$('.price-table').forEach((span) => {
      const basePrice = parseInt(span.getAttribute('data-base'), 10);
      const parent = span.parentElement;

      if (discountPercent > 0) {
        const discounted = Math.round(basePrice * (1 - discountPercent / 100));
        parent.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="text-xs line-through text-slate-500 font-mono">${formatARSTable(basePrice)}</span>
            <span class="font-mono font-bold text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">${formatARSTable(discounted)}</span>
            <span class="text-[10px] font-bold font-mono px-1 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">-${discountPercent}%</span>
          </div>`;
      } else {
        parent.innerHTML = `
          <span class="font-mono font-bold text-white group-hover:text-secondary transition-colors price-table" data-base="${basePrice}">${formatARSTable(basePrice)}</span>`;
      }
    });
  }

  // ---- Listeners de cupones ----
  openBtn?.addEventListener('click', openCouponModal);
  applyBtn?.addEventListener('click', applyCoupon);

  $$('[data-close-coupon]').forEach((btn) =>
    btn.addEventListener('click', closeCouponModal)
  );

  $$('[data-coupon]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-coupon');
      if (input) input.value = code;
      applyCoupon();
    })
  );

  $$('[data-remove-coupon]').forEach((btn) =>
    btn.addEventListener('click', removeCoupon)
  );

  // Enter en el input
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCoupon();
    }
  });

  // Escape + click fuera
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeCouponModal();
    }
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeCouponModal();
  });

  /* ============================================================
     2. CANVAS DE PARTÍCULAS DEL HERO
     ============================================================ */
  function initParticles() {
    const canvas = document.getElementById('hero-particles');
    const section = document.getElementById('hero-section');
    if (!canvas || !section) return;

    // Respetar preferencia de movimiento reducido
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999, radius: 190 };

    const palettes = [
      { color: 'rgba(255, 0, 127, ',  glow: '#ff007f' },
      { color: 'rgba(255, 20, 147, ', glow: '#ff1493' },
      { color: 'rgba(255, 74, 141, ', glow: '#ff4a8d' },
      { color: 'rgba(0, 240, 255, ',  glow: '#00f0ff' },
      { color: 'rgba(125, 244, 255, ', glow: '#00dbe9' },
      { color: 'rgba(192, 132, 252, ', glow: '#c084fc' }
    ];

    const PARTICLE_COUNT = 140;
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

        this.pushX = 0;
        this.pushY = 0;
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

        this.pushX *= 0.94;
        this.pushY *= 0.94;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouse.radius && distance > 0.1) {
          const force = (mouse.radius - distance) / mouse.radius;
          const forceX = (dx / distance) * force * 1.8;
          const forceY = (dy / distance) * force * 1.8;
          this.pushX -= forceX;
          this.pushY -= forceY;
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
      requestAnimationFrame(animate);
    }

    // Init
    updateDimensions();
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    // Listeners
    window.addEventListener('resize', updateDimensions);

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    section.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Touch support opcional
    section.addEventListener('touchmove', (e) => {
      const rect = section.getBoundingClientRect();
      const t = e.touches[0];
      mouse.x = t.clientX - rect.left;
      mouse.y = t.clientY - rect.top;
    }, { passive: true });

    requestAnimationFrame(animate);
  }

  // Arrancar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticles);
  } else {
    initParticles();
  }

})();