/* ============================================================
   FBG SERVICIO TÉCNICO - Lógica Principal
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  // --- Lógica de Confirmación y Notificaciones Personalizadas ---
  window.showConfirm = function(title, message, onAccept) {
    const modal = document.getElementById('custom-confirm-modal');
    if (!modal) return;
    
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    modal.classList.remove('hidden');
    
    const acceptBtn = document.getElementById('confirm-accept-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    
    const newAcceptBtn = acceptBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newAcceptBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      onAccept();
    });
    
    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  };

  window.showGlobalToast = function(message, isError = false) {
    const toast = document.getElementById('global-toast');
    const icon = document.getElementById('global-toast-icon');
    const msg = document.getElementById('global-toast-msg');
    
    if (!toast) return;
    
    msg.innerText = message;
    
    if (isError) {
      icon.innerText = 'error';
      icon.className = 'material-symbols-outlined text-red-500 text-xl';
      toast.querySelector('div').className = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-[#090b14] border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] min-w-[250px]';
    } else {
      icon.innerText = 'verified';
      icon.className = 'material-symbols-outlined text-primary text-xl';
      toast.querySelector('div').className = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-[#090b14] border border-primary/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] min-w-[250px]';
    }
    
    toast.classList.remove('translate-x-[150%]');
    
    setTimeout(() => {
      toast.classList.add('translate-x-[150%]');
    }, 3500);
  };

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

    let pendingCoupon = null;
    let failedAttempts = 0;
    let isLockedOut = false;
    let lockoutInterval = null;

    function getUsedCoupons() {
      return JSON.parse(localStorage.getItem('fbg_used_coupons') || '[]');
    }

    function markCouponAsUsed(code) {
      const used = getUsedCoupons();
      if (!used.includes(code)) {
        used.push(code);
        localStorage.setItem('fbg_used_coupons', JSON.stringify(used));
      }
    }

    function openModal() {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      
      // Si ya había un cupón pendiente (aplicado), restauramos el cartel verde
      if (pendingCoupon) {
        const rawCode = pendingCoupon.code;
        const isPercent = pendingCoupon.type === 'PERCENT';
        const val = pendingCoupon.value;
        const typeStr = isPercent ? '%' : '$';

        errorAlert?.classList.add('hidden');
        successAlert?.classList.remove('hidden');
        if (successMsg) {
          successMsg.innerText = `¡CUPÓN VÁLIDO! ${rawCode} aplica ${typeStr}${val} de descuento.`;
        }

        if (applyBtn) {
          applyBtn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span><span>Aplicar Descuento</span>`;
          applyBtn.classList.remove('bg-gradient-to-r', 'from-secondary', 'to-primary', 'text-white');
          applyBtn.classList.add('bg-emerald-500', 'border-emerald-400', 'text-black');
        }
      } else {
        // Si no hay cupón, limpiamos todo
        resetApplyBtn();
        errorAlert?.classList.add('hidden');
        successAlert?.classList.add('hidden');
      }

      setTimeout(() => input && input.focus(), 60);
    }

    function closeModal() {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      // NO borramos pendingCoupon ni el cartel verde acá.
      // Dejamos que se mantenga en memoria para cuando se vuelva a abrir.
    }

    function resetApplyBtn() {
      if (applyBtn) {
        applyBtn.innerHTML = `<span class="material-symbols-outlined text-sm">verified</span><span>Validar Código</span>`;
        applyBtn.classList.remove('bg-emerald-500', 'border-emerald-400', 'text-black');
        applyBtn.classList.add('bg-gradient-to-r', 'from-secondary', 'to-primary', 'text-white');
      }
    }

    function validateCoupon() {
      if (isLockedOut) return;

      const rawCode = (input?.value || '').trim().toUpperCase();
      
      if (!rawCode) {
        errorAlert?.classList.add('hidden');
        successAlert?.classList.add('hidden');
        pendingCoupon = null;
        resetApplyBtn();
        return;
      }

      const availableCoupons = getCouponsFromStorage();
      let couponData = availableCoupons[rawCode];
      const usedCoupons = getUsedCoupons();

      // Si el cupón no es de prueba y ya fue usado, lo bloquea
      if (usedCoupons.includes(rawCode) && !couponData?.isTest) {
        pendingCoupon = null;
        errorAlert?.classList.remove('hidden');
        successAlert?.classList.add('hidden');
        resetApplyBtn();
        window.showGlobalToast('Este cupón ya fue utilizado en este dispositivo.', true);
        return;
      }

      if (couponData) {
        failedAttempts = 0;
        pendingCoupon = couponData;
        const isPercent = couponData.type === 'PERCENT';
        const val = couponData.value;
        const typeStr = isPercent ? '%' : '$';

        errorAlert?.classList.add('hidden');
        successAlert?.classList.remove('hidden');
        if (successMsg) {
          successMsg.innerText = `¡CUPÓN VÁLIDO! ${rawCode} aplica ${typeStr}${val} de descuento.`;
        }

        if (applyBtn) {
          applyBtn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span><span>Aplicar Descuento</span>`;
          applyBtn.classList.remove('bg-gradient-to-r', 'from-secondary', 'to-primary', 'text-white');
          applyBtn.classList.add('bg-emerald-500', 'border-emerald-400', 'text-black');
        }
      } else {
        pendingCoupon = null;
        errorAlert?.classList.remove('hidden');
        successAlert?.classList.add('hidden');
        resetApplyBtn();
        
        failedAttempts++;
        if (failedAttempts >= 5) {
          triggerLockout();
        } else {
          window.showGlobalToast(`Cupón inválido. Intento ${failedAttempts}/5`, true);
        }
      }
    }

    function triggerLockout() {
      isLockedOut = true;
      let timeLeft = 60;
      if (input) input.disabled = true;
      if (applyBtn) applyBtn.disabled = true;
      const lockMsg = document.getElementById('coupon-lockout-msg');
      const timerSpan = document.getElementById('lockout-timer');
      
      if (lockMsg) lockMsg.classList.remove('hidden');
      if (timerSpan) timerSpan.innerText = timeLeft;

      lockoutInterval = setInterval(() => {
        timeLeft--;
        if (timerSpan) timerSpan.innerText = timeLeft;
        
        if (timeLeft <= 0) {
          clearInterval(lockoutInterval);
          isLockedOut = false;
          failedAttempts = 0;
          if (input) input.disabled = false;
          if (applyBtn) applyBtn.disabled = false;
          if (lockMsg) lockMsg.classList.add('hidden');
          window.showGlobalToast('Bloqueo finalizado. Ya puedes intentar de nuevo.', false);
        }
      }, 1000);
    }

    function applyCoupon() {
      const currentInput = (input?.value || '').trim().toUpperCase();
      
      if (!pendingCoupon || pendingCoupon.code !== currentInput) {
        validateCoupon();
        return; 
      }

      const rawCode = pendingCoupon.code;
      const isPercent = pendingCoupon.type === 'PERCENT';
      const val = pendingCoupon.value;
      const typeStr = isPercent ? '%' : '$';

      btnTexts.forEach((el) => {
        if (el) el.innerText = `Cupón: ${typeStr}${val} OFF`;
      });

      if (navBtn) {
        navBtn.classList.remove('from-secondary', 'to-primary');
        navBtn.classList.add('from-emerald-500', 'via-teal-600', 'to-primary', 'border-emerald-400');
      }

      let allCoupons = JSON.parse(localStorage.getItem('fbg_coupons') || '[]');
      const couponIndex = allCoupons.findIndex(c => c.code === rawCode);
      
      if (couponIndex > -1) {
        let c = allCoupons[couponIndex];
        c.uses = (c.uses || 0) + 1;
        
        if (c.limit > 0 && c.uses >= c.limit) {
          c.status = 'EXPIRADO';
        }
        localStorage.setItem('fbg_coupons', JSON.stringify(allCoupons));

        let logs = JSON.parse(localStorage.getItem('fbg_coupon_logs') || '[]');
        const newLog = {
          code: rawCode,
          date: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}),
          id: `CLI-${Math.floor(Math.random() * 9000) + 1000}`
        };
        logs.unshift(newLog);
        if (logs.length > 20) logs.pop();
        localStorage.setItem('fbg_coupon_logs', JSON.stringify(logs));
      }

      markCouponAsUsed(rawCode);
      updateAllPrices(pendingCoupon);
      closeModal();
    }

    function removeCoupon() {
      // Recargamos la página directamente. 
      // Como el cupón no se guarda en localStorage, al recargar 
      // los precios vuelven a su estado original de fábrica.
      window.location.reload();
    }

    function updateAllPrices(discountData) {
      const isPercent = discountData.type === 'PERCENT';
      const val = discountData.value;
      const categories = discountData.services || []; 
      const applyToAll = categories.length === 0;

      // 1. Actualizar Tarjetas Destacadas
      let anyCardDiscounted = false;
      $$('[data-price-container]').forEach((container) => {
        const basePrice = parseInt(container.getAttribute('data-price-container'), 10);
        const card = container.closest('.cyber-plan-card');
        const btn = card ? card.querySelector('.card-btn-action') : null;
        const originalHref = btn ? btn.getAttribute('href') : null;
        const cardTitle = card ? card.querySelector('h3').innerText.trim() : '';
        
        let categoryOfCard = '';
        if (cardTitle.includes('Armado')) categoryOfCard = 'Armados';
        else if (cardTitle.includes('Mantenimiento') || cardTitle.includes('Diagnóstico') || cardTitle.includes('Combo')) categoryOfCard = 'Mantenimientos';
        
        const applyDiscountHere = applyToAll || categories.includes(categoryOfCard);

        if (val > 0 && applyDiscountHere) {
          anyCardDiscounted = true;
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

      const alertCards = document.getElementById('alert-cards-discount');
      if (alertCards) {
        if (anyCardDiscounted) alertCards.classList.remove('hidden');
        else alertCards.classList.add('hidden');
      }

      // 2. Actualizar Tabla Tarifario
      let anyTableDiscounted = false;
      $$('.price-table').forEach((span) => {
        const basePrice = parseInt(span.getAttribute('data-base'), 10);
        const parent = span.parentElement;
        const row = parent.closest('.price-row'); 
        const section = row.closest('.rounded-2xl'); 
        let sectionTitle = '';
        
        if (section) {
          const h3 = section.querySelector('h3');
          if (h3) sectionTitle = h3.innerText.trim();
        }

        let categoryOfRow = '';
        if (sectionTitle === 'MANTENIMIENTOS') categoryOfRow = 'Mantenimientos';
        else if (sectionTitle === 'ARMADOS') categoryOfRow = 'Armados';
        else if (sectionTitle === 'REMOTOS Y VISITAS') categoryOfRow = 'Visitas y Remotos';
        else if (sectionTitle === 'DEMÁS TRABAJOS') categoryOfRow = 'Demás Trabajos';

        const applyHere = applyToAll || categories.includes(categoryOfRow);

        if (val > 0 && applyHere) {
          anyTableDiscounted = true;
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

      const alertTable = document.getElementById('alert-table-discount');
      if (alertTable) {
        if (anyTableDiscounted && applyToAll) alertTable.classList.remove('hidden');
        else alertTable.classList.add('hidden');
      }
    }

    openBtns.forEach((btn) => btn && btn.addEventListener('click', openModal));
    applyBtn && applyBtn.addEventListener('click', applyCoupon);
    
    input && input.addEventListener('input', () => {
      const currentInput = (input.value || '').trim().toUpperCase();
      if (pendingCoupon && pendingCoupon.code !== currentInput) {
        pendingCoupon = null;
        successAlert?.classList.add('hidden');
        errorAlert?.classList.add('hidden');
        resetApplyBtn();
      }
    });

    $$('[data-close-coupon]').forEach((btn) => btn.addEventListener('click', closeModal));
    
    $$('[data-coupon]').forEach((btn) => btn.addEventListener('click', () => {
      if (input) {
        input.value = btn.getAttribute('data-coupon');
        errorAlert?.classList.add('hidden');
        successAlert?.classList.add('hidden');
        pendingCoupon = null;
        resetApplyBtn();
      }
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

    const urlParams = new URLSearchParams(window.location.search);
    const cuponParam = urlParams.get('cupon');
    if (cuponParam) {
      if (input) input.value = cuponParam;
      validateCoupon();
      openModal();
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
        this.x = Math.random() * width; this.y = Math.random() * height;
        this.size = Math.random() * 2.8 + 1.2;
        const scheme = palettes[Math.floor(Math.random() * palettes.length)];
        this.colorBase = scheme.color; this.glowColor = scheme.glow;
        this.alpha = Math.random() * 0.6 + 0.35;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.25 + 0.1;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.pushX = 0; this.pushY = 0;
      }
      draw() {
        ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.closePath();
        ctx.fillStyle = this.colorBase + this.alpha + ')'; ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = this.size > 2.5 ? 12 : 8; ctx.fill(); ctx.restore();
      }
      update() {
        this.x += this.vx + this.pushX; this.y += this.vy + this.pushY;
        this.pushX *= 0.94; this.pushY *= 0.94;
        const dx = mouse.x - this.x; const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance < mouse.radius && distance > 0.1) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.pushX -= (dx / distance) * force * 1.8;
          this.pushY -= (dy / distance) * force * 1.8;
        }
        const margin = 10;
        if (this.x < -margin) this.x = width + margin; else if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin; else if (this.y > height + margin) this.y = -margin;
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      updateDimensions(); particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
      if (animationId) cancelAnimationFrame(animationId);
      animate();
    }

    start();
    window.addEventListener('resize', () => { dpr = Math.min(window.devicePixelRatio || 1, 2); updateDimensions(); });

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    section.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    section.addEventListener('touchmove', (e) => {
      const rect = section.getBoundingClientRect(); const t = e.touches[0];
      mouse.x = t.clientX - rect.left; mouse.y = t.clientY - rect.top;
    }, { passive: true });
    section.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; });
  }

  function init() {
    initMobileMenu();
    initCouponSystem();
    initParticles();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();