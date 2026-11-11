/* ============================================================
   ADMIN.JS - Lógica del Panel de Administración de Cupones
   ============================================================ */

// --- SEGURIDAD Y LOGIN ---
const AUTH_USER = "fabri.grotta";
const AUTH_PASS = "FBG.rosario2026";

function checkAuth() {
  const isLogged = sessionStorage.getItem('fbg_admin_logged');
  const loginScreen = document.getElementById('login-screen');
  const mainApp = document.querySelector('main');
  const headerApp = document.querySelector('header');

  if (isLogged === 'true') {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.style.display = '';
    if (headerApp) headerApp.style.display = '';
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.style.display = 'none';
    if (headerApp) headerApp.style.display = 'none';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  const errorDiv = document.getElementById('login-error');

  if (user === AUTH_USER && pass === AUTH_PASS) {
    sessionStorage.setItem('fbg_admin_logged', 'true');
    errorDiv.classList.add('hidden');
    checkAuth();
    renderTable();
  } else {
    errorDiv.classList.remove('hidden');
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}

function handleLogout() {
  sessionStorage.removeItem('fbg_admin_logged');
  if (window.showGlobalToast) {
    window.showGlobalToast('Sesión finalizada. Redirigiendo...', false);
  }
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
}

document.addEventListener('DOMContentLoaded', checkAuth);

// --- LÓGICA DE CUPONES ---
let currentDiscountType = 'PERCENT';
let editingCouponId = null;

function showConfirm(title, message, onAccept) {
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
}

function showGlobalToast(message, isError = false) {
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
}

function showToast(msg, isError = false) {
  showGlobalToast(msg, isError);
}

function getStoredCoupons() {
  const stored = localStorage.getItem('fbg_coupons');
  if (stored) return JSON.parse(stored);
  
  const today = new Date();
  const nextMonth = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0];
  const defaultCoupons = [
    { id: 'CUP-9921', code: 'FBGGAMER20', type: 'PERCENT', value: 20, limit: 50, uses: 32, expiry: nextMonth, services: ['Armado PC Gamer'], status: 'ACTIVO' },
    { id: 'CUP-9922', code: 'COMBOFULL15', type: 'PERCENT', value: 15, limit: 30, uses: 11, expiry: nextMonth, services: ['Combo Mantenimiento'], status: 'ACTIVO' },
    { id: 'CUP-9923', code: 'FBG10KFIX', type: 'FIXED', value: 10000, limit: 20, uses: 19, expiry: nextMonth, services: ['Mantenimiento PC'], status: 'ACTIVO' },
    { id: 'CUP-9918', code: 'CYBERPROMO', type: 'PERCENT', value: 25, limit: 50, uses: 50, expiry: '2026-09-15', services: ['Armado PC Gamer', 'Mantenimiento PC'], status: 'EXPIRADO' }
  ];
  localStorage.setItem('fbg_coupons', JSON.stringify(defaultCoupons));
  return defaultCoupons;
}

function saveCoupons(coupons) {
  localStorage.setItem('fbg_coupons', JSON.stringify(coupons));
}

function toggleAllServices(source) {
  const checkboxes = document.querySelectorAll('.service-checkbox');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function checkAllStatus() {
  const checkboxes = document.querySelectorAll('.service-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  const checkAllBox = document.getElementById('checkAllServices');
  if (checkAllBox) {
    checkAllBox.indeterminate = false; 
    checkAllBox.checked = allChecked;
  }
}

function renderTable() {
  const coupons = getStoredCoupons();
  const tbody = document.getElementById('couponsBody');
  if (!tbody) return;
  tbody.innerHTML = ''; 

  coupons.forEach(c => {
    const uses = c.uses || 0;
    const limit = c.limit || 50;
    const percent = Math.min((uses / limit) * 100, 100).toFixed(0);
    const isExpired = c.status === 'EXPIRADO' || uses >= limit;
    
    const discountStr = c.type === 'PERCENT' ? `-${c.value}%` : `-$${Number(c.value).toLocaleString('es-AR')}`;
    
    let dateFormatted = 'Sin fecha';
    if (c.expiry) {
      const [year, month, day] = c.expiry.split('-');
      dateFormatted = `${day}/${month}/${year}`;
    }

    let servicesHTML = '';
    if (c.services && c.services.length > 0) {
      if (c.services.length === 4) {
        servicesHTML = `<span class="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[11px] w-full text-center">Todos los servicios</span>`;
      } else {
        const shortNames = c.services.map(s => {
          if (s === 'Armado PC Gamer') return 'Gamer';
          if (s === 'Combo Mantenimiento') return 'Combo';
          if (s === 'Mantenimiento PC') return 'Mantenimiento';
          if (s === 'Diagnóstico / Revisión') return 'Diagnóstico';
          return s;
        });
        
        servicesHTML = shortNames.map(name => 
          `<span class="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] whitespace-nowrap">${name}</span>`
        ).join('');
      }
    } else {
      servicesHTML = `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">No definido</span>`;
    }

    const borderColor = c.type === 'PERCENT' ? 'border-primary/50 text-primary' : 'border-cyber-gold/50 text-cyber-gold';
    const bgBadge = c.type === 'PERCENT' ? 'bg-secondary/15 border-secondary/50 text-secondary' : 'bg-cyber-gold/15 border-cyber-gold/50 text-cyber-gold';

    const tr = document.createElement('tr');
    tr.className = `coupon-row hover:bg-primary/5 transition-colors group ${isExpired ? 'opacity-60' : ''}`;
    tr.setAttribute('data-status', isExpired ? 'EXPIRADO' : c.status);

    tr.innerHTML = `
      <td class="py-3 px-1 sm:px-2">
        <div class="flex items-center gap-1.5">
          <span class="px-2 py-1 rounded bg-[#05060b] border ${borderColor} font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)] ${isExpired ? 'line-through text-slate-500 border-slate-700' : ''} text-xs">${c.code}</span>
          <button onclick="copyCode('${c.code}')" title="Copiar Enlace" class="text-slate-500 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[15px]">link</span>
          </button>
        </div>
        <span class="text-[10px] text-slate-500 block mt-0.5">#${c.id}</span>
      </td>
      <td class="py-3 px-1 sm:px-2">
        <span class="px-2 py-1 rounded-full ${isExpired ? 'bg-slate-800 border-slate-700 text-slate-400' : bgBadge} font-bold shadow-[0_0_12px_rgba(255,0,127,0.3)] text-xs">${discountStr}</span>
      </td>
      <td class="py-3 px-1 sm:px-2">
        <div class="flex flex-wrap gap-1 max-w-[160px]">
          ${servicesHTML}
        </div>
      </td>
      <td class="py-3 px-1 sm:px-2">
        <div class="flex flex-col gap-1 min-w-[80px]">
          <span class="${isExpired ? 'text-rose-400' : 'text-primary'} font-bold text-[11px] font-mono">${dateFormatted}</span>
        </div>
      </td>
      <td class="py-3 px-1 sm:px-2">
        <div class="flex flex-col gap-1 min-w-[70px]">
          <span class="text-white font-bold text-[11px]">${uses} / ${limit}</span>
          <div class="w-full bg-[#05060b] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="${isExpired ? 'bg-rose-500' : 'bg-secondary'}" style="width: ${percent}%; height: 100%;"></div>
          </div>
          <span class="text-[9px] ${isExpired ? 'text-rose-400' : 'text-secondary'} font-bold mt-0.5">${percent}% cupo</span>
        </div>
      </td>
      <td class="py-3 px-1 sm:px-2">
        ${isExpired ? `
          <div class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400 text-[10px]">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span><span class="font-bold">AGOTADO</span>
          </div>
        ` : `
          <div class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px]">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span class="font-bold">ACTIVO</span>
          </div>
        `}
      </td>
      <td class="py-3 px-1 sm:px-2 text-right">
        <div class="flex items-center justify-end gap-1">
          <button onclick="editCoupon('${c.id}')" class="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
            <span class="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button onclick="deleteCouponRow('${c.id}')" class="p-1 rounded-lg text-slate-400 hover:text-secondary hover:bg-secondary/10 transition-colors" title="Eliminar">
            <span class="material-symbols-outlined text-[16px]">delete_forever</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  updateKPIs();
  renderLiveFeed();
}

function renderLiveFeed() {
  const feed = document.getElementById('liveLogFeed');
  if (!feed) return;

  const logs = JSON.parse(localStorage.getItem('fbg_coupon_logs') || '[]');
  
  if (logs.length === 0) {
    feed.innerHTML = `<div class="text-slate-500 text-center py-4 font-mono text-xs">// SIN CANJES REGISTRADOS AÚN</div>`;
    return;
  }

  feed.innerHTML = logs.slice(0, 5).map((log, index) => {
    const color = index % 2 === 0 ? 'text-primary' : 'text-secondary';
    const bgColor = index % 2 === 0 ? 'hover:border-primary/40' : 'hover:border-secondary/40';
    
    return `
      <div class="p-3 rounded-xl bg-[#0d101a] border border-slate-800 ${bgColor} transition-colors flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="${color} font-bold text-[11px]">CLIENTE #${log.id}</span>
          <span class="text-[10px] text-slate-400">${log.date}</span>
        </div>
        <div class="text-slate-200 text-xs font-sans">
          Canjeó <span class="font-mono ${color} font-bold">${log.code}</span>
        </div>
      </div>
    `;
  }).join('');
}

function clearLogs() {
  showConfirm(
    'Borrar Historial', 
    '¿Estás seguro de que deseas borrar permanentemente todo el historial de canjes del laboratorio? Esta acción no se puede deshacer.', 
    () => {
      localStorage.removeItem('fbg_coupon_logs');
      renderLiveFeed(); // Vuelve a dibujar el feed (que ahora estará vacío)
      showToast('// HISTORIAL DE CANJES ELIMINADO');
    }
  );
}

function updateKPIs() {
  const coupons = getStoredCoupons();
  
  const activeCount = coupons.filter(c => c.status === 'ACTIVO' && (c.uses || 0) < (c.limit || 50)).length;
  const kpi1 = document.querySelector('.grid .hud-corner:nth-child(1) span.text-white');
  if (kpi1) kpi1.innerText = activeCount.toString().padStart(2, '0');

  const totalUses = coupons.reduce((sum, c) => sum + (c.uses || 0), 0);
  const kpi2 = document.querySelector('.grid .hud-corner:nth-child(2) span.text-white');
  if (kpi2) kpi2.innerText = totalUses;

  let percentCount = 0;
  let fixedCount = 0;
  
  coupons.forEach(c => {
    if (c.type === 'PERCENT') percentCount++;
    if (c.type === 'FIXED') fixedCount++;
  });

  const total = percentCount + fixedCount;
  if (total > 0) {
    const pPercent = Math.round((percentCount / total) * 100);
    const pFixed = Math.round((fixedCount / total) * 100);

    const barPercent = document.querySelector('.bg-primary.h-full');
    const barFixed = document.querySelector('.bg-secondary.h-full');
    
    const textPercent = document.querySelector('.flex.justify-between.text-\\[11px\\].text-slate-400.mt-2 span:first-child');
    const textFixed = document.querySelector('.flex.justify-between.text-\\[11px\\].text-slate-400.mt-2 span:last-child');

    if (barPercent) barPercent.style.width = `${pPercent}%`;
    if (barFixed) barFixed.style.width = `${pFixed}%`;
    if (textPercent) textPercent.innerText = `${pPercent}% Descuento %`;
    if (textFixed) textFixed.innerText = `${pFixed}% Fijo ARS`;
  }
}

function openModal() {
  document.getElementById('couponModal').classList.remove('hidden');
  document.getElementById('modalTitle').innerText = 'Crear Cupón // FBG LAB';
  document.getElementById('couponCodeInput').value = '';
  editingCouponId = null;
  
  document.getElementById('checkAllServices').checked = false;
  document.getElementById('checkAllServices').indeterminate = false;
  document.querySelectorAll('.service-checkbox').forEach(cb => cb.checked = false);
  
  updatePreview();
  document.getElementById('couponCodeInput').focus();
}

function closeModal() {
  document.getElementById('couponModal').classList.add('hidden');
}

function setDiscountType(type) {
  currentDiscountType = type;
  const btnPercent = document.getElementById('btnTypePercent');
  const btnFixed = document.getElementById('btnTypeFixed');
  const valLabel = document.getElementById('valLabel');
  const range = document.getElementById('discountRange');
  const number = document.getElementById('discountNumber');

  if (type === 'PERCENT') {
    btnPercent.className = 'flex-1 py-2 rounded-lg font-bold bg-primary text-black transition-all shadow-[0_0_10px_rgba(0,240,255,0.4)]';
    btnFixed.className = 'flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition-all';
    valLabel.innerText = 'VALOR (%)';
    range.min = 5; range.max = 50; range.step = 5; range.value = 20;
    number.value = 20;
    document.getElementById('sliderValueDisplay').innerText = '20%';
  } else {
    btnFixed.className = 'flex-1 py-2 rounded-lg font-bold bg-secondary text-white transition-all shadow-[0_0_10px_rgba(255,0,127,0.4)]';
    btnPercent.className = 'flex-1 py-2 rounded-lg text-slate-400 hover:text-white transition-all';
    valLabel.innerText = 'VALOR ($)';
    range.min = 5000; range.max = 30000; range.step = 1000; range.value = 10000;
    number.value = 10000;
    document.getElementById('sliderValueDisplay').innerText = '$10.000';
  }
  updatePreview();
}

function syncRangeToNumber(val) {
  document.getElementById('discountNumber').value = val;
  document.getElementById('sliderValueDisplay').innerText = currentDiscountType === 'PERCENT' ? val + '%' : '$' + Number(val).toLocaleString('es-AR');
  updatePreview();
}

function syncNumberToRange(val) {
  document.getElementById('discountRange').value = val;
  document.getElementById('sliderValueDisplay').innerText = currentDiscountType === 'PERCENT' ? val + '%' : '$' + Number(val).toLocaleString('es-AR');
  updatePreview();
}

function updatePreview() {
  const code = document.getElementById('couponCodeInput').value || 'FBGPROMO';
  const numVal = Number(document.getElementById('discountNumber').value) || 20;
  const previewBadge = document.getElementById('previewBadge');
  const previewSavings = document.getElementById('previewSavings');

  if (currentDiscountType === 'PERCENT') {
    previewBadge.innerText = `${code} (-${numVal}%)`;
    const finalPrice = 100000 * (1 - (numVal / 100));
    previewSavings.innerText = `Paga: $${finalPrice.toLocaleString('es-AR')} ARS`;
  } else {
    previewBadge.innerText = `${code} (-$${numVal.toLocaleString('es-AR')})`;
    const finalPrice = Math.max(0, 100000 - numVal);
    previewSavings.innerText = `Paga: $${finalPrice.toLocaleString('es-AR')} ARS`;
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
  const val = Number(document.getElementById('discountNumber').value);
  const uses = Number(document.getElementById('limitUses').value) || 50;
  const expiry = document.getElementById('dateEnd').value;
  
  const selectedServices = Array.from(document.querySelectorAll('.service-checkbox:checked')).map(cb => cb.value);

  if (selectedServices.length === 0) {
    showToast('Debes seleccionar al menos un servicio.', true);
    return;
  }
  
  let coupons = getStoredCoupons();

  if (editingCouponId) {
    const index = coupons.findIndex(c => c.id === editingCouponId);
    if (index > -1) {
      coupons[index].code = code;
      coupons[index].type = currentDiscountType;
      coupons[index].value = val;
      coupons[index].limit = uses;
      coupons[index].expiry = expiry;
      coupons[index].services = selectedServices;
    }
    showToast(`// CUPÓN '${code}' ACTUALIZADO`);
  } else {
    const newCoupon = {
      id: `CUP-${Math.floor(Math.random() * 9000) + 1000}`,
      code: code,
      type: currentDiscountType,
      value: val,
      limit: uses,
      uses: 0,
      expiry: expiry,
      services: selectedServices,
      status: 'ACTIVO'
    };
    coupons.unshift(newCoupon);
    showToast(`// CUPÓN '${code}' REGISTRADO`);
  }

  saveCoupons(coupons);
  renderTable();
  closeModal();
}

function editCoupon(id) {
  const coupons = getStoredCoupons();
  const c = coupons.find(x => x.id === id);
  if (!c) return;

  openModal();
  editingCouponId = id;
  document.getElementById('modalTitle').innerText = `Modificar Cupón // ${c.code}`;
  document.getElementById('couponCodeInput').value = c.code;
  setDiscountType(c.type);
  document.getElementById('discountNumber').value = c.value;
  document.getElementById('discountRange').value = c.value;
  document.getElementById('limitUses').value = c.limit;
  document.getElementById('dateEnd').value = c.expiry || '';
  
  document.getElementById('checkAllServices').checked = false;
  document.getElementById('checkAllServices').indeterminate = false;
  document.querySelectorAll('.service-checkbox').forEach(cb => cb.checked = false);
  
  if (c.services && c.services.length > 0) {
    document.querySelectorAll('.service-checkbox').forEach(cb => {
      if (c.services.includes(cb.value)) cb.checked = true;
    });
  }
  
  checkAllStatus();
  updatePreview();
}

function copyCode(code) {
  navigator.clipboard.writeText(`https://fabrigrotta.github.io/fbgrosario/?cupon=${code}`);
  showToast(`// ENLACE COPIADO (?cupon=${code})`);
}

function deleteCouponRow(id) {
  showConfirm(
    'Eliminar Cupón', 
    '¿Estás seguro de que deseas eliminar este cupón permanentemente? Esta acción no se puede deshacer.', 
    () => {
      let coupons = getStoredCoupons();
      coupons = coupons.filter(c => c.id !== id);
      saveCoupons(coupons);
      renderTable();
      showToast('// CUPÓN ELIMINADO');
    }
  );
}

function hideToast() {
  document.getElementById('global-toast').classList.add('translate-x-[150%]');
}

function filterCoupons() {
  const q = document.getElementById('searchInput').value.toUpperCase();
  const rows = document.querySelectorAll('.coupon-row');
  rows.forEach(r => {
    const text = r.innerText.toUpperCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

function setFilter(type) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.className = 'filter-btn px-2.5 py-1 rounded-lg text-slate-400 hover:text-white';
  });

  if (type === 'ALL') {
    document.getElementById('filter-all').className = 'filter-btn px-2.5 py-1 rounded-lg bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]';
  } else if (type === 'ACTIVO') {
    document.getElementById('filter-active').className = 'filter-btn px-2.5 py-1 rounded-lg bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]';
  } else if (type === 'EXPIRADO') {
    document.getElementById('filter-expired').className = 'filter-btn px-2.5 py-1 rounded-lg bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]';
  }

  const rows = document.querySelectorAll('.coupon-row');
  rows.forEach(r => {
    const status = r.getAttribute('data-status');
    if (type === 'ALL') {
      r.style.display = '';
    } else {
      r.style.display = status === type ? '' : 'none';
    }
  });
}

/* ============================================================
   PARTÍCULAS DE FONDO Y EVENTOS INICIALES
   ============================================================ */
(function() {
  const canvas = document.getElementById('ambient-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0;
  const mouse = { x: -9999, y: -9999, radius: 180 };
  
  function updateDimensions() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
  window.addEventListener('resize', updateDimensions);
  window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', function() { mouse.x = -9999; mouse.y = -9999; });
  
  const particlePalettes = [
    { color: 'rgba(255, 0, 127, ', glow: '#ff007f' },
    { color: 'rgba(0, 240, 255, ', glow: '#00f0ff' },
    { color: 'rgba(192, 132, 252, ', glow: '#c084fc' }
  ];
  const particleCount = 100;
  let particles = [];
  
  class AmbientDot {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width; this.y = Math.random() * height;
      this.size = Math.random() * 2.2 + 1;
      const scheme = particlePalettes[Math.floor(Math.random() * particlePalettes.length)];
      this.colorBase = scheme.color; this.glowColor = scheme.glow;
      this.alpha = Math.random() * 0.5 + 0.3;
      const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 0.2 + 0.08;
      this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
      this.pushX = 0; this.pushY = 0;
    }
    draw() {
      ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.closePath();
      ctx.fillStyle = this.colorBase + this.alpha + ')'; ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = this.size > 2 ? 10 : 6; ctx.fill(); ctx.restore();
    }
    update() {
      this.x += this.vx + this.pushX; this.y += this.vy + this.pushY;
      this.pushX *= 0.93; this.pushY *= 0.93;
      const dx = mouse.x - this.x; const dy = mouse.y - this.y; const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius && dist > 0.1) { const force = (mouse.radius - dist) / mouse.radius; this.pushX -= (dx / dist) * force * 1.5; this.pushY -= (dy / dist) * force * 1.5; }
      const margin = 10;
      if (this.x < -margin) this.x = width + margin; else if (this.x > width + margin) this.x = -margin;
      if (this.y < -margin) this.y = height + margin; else if (this.y > height + margin) this.y = -margin;
    }
  }
  
  function init() { updateDimensions(); particles = []; for (let i = 0; i < particleCount; i++) particles.push(new AmbientDot()); }
  function loop() { ctx.clearRect(0, 0, width, height); for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); } requestAnimationFrame(loop); }
  
  init(); 
  loop();
})();

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});