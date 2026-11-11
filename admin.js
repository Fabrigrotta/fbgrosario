/* ============================================================
   ADMIN.JS - Lógica del Panel de Administración de Cupones
   ============================================================ */

let currentDiscountType = 'PERCENT';
let editingCouponId = null;

// --- Lógica de Confirmación y Notificaciones Personalizadas ---
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

// 1. Obtener cupones desde el localStorage
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

// 2. Sincronizar Checkboxes de Servicios
function toggleAllServices(source) {
  const checkboxes = document.querySelectorAll('.service-checkbox');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function checkAllStatus() {
  const checkboxes = document.querySelectorAll('.service-checkbox');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  const checkAllBox = document.getElementById('checkAllServices');
  if (checkAllBox) {
    // Forzamos a que SIEMPRE sea false el indeterminate
    checkAllBox.indeterminate = false; 
    
    // Si están todos tildados, se marca. Si no, se destilda.
    checkAllBox.checked = allChecked;
  }
}

// 3. Renderizar la tabla compacta
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

    // Armamos las etiquetas visuales de los servicios
    let servicesHTML = '';
    if (c.services && c.services.length > 0) {
      if (c.services.length === 4) {
        servicesHTML = `<span class="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[11px] w-full text-center">Todos los servicios</span>`;
      } else {
        // Acortamos los nombres para que entren bien en la tabla
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

// 4. Historial
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

// 5. KPIs
function updateKPIs() {
  const coupons = getStoredCoupons();
  
  const activeCount = coupons.filter(c => c.status === 'ACTIVO' && (c.uses || 0) < (c.limit || 50)).length;
  const kpi1 = document.querySelector('.grid .hud-corner:nth-child(1) span.text-white');
  if (kpi1) kpi1.innerText = activeCount.toString().padStart(2, '0');

  const totalUses = coupons.reduce((sum, c) => sum + (c.uses || 0), 0);
  const kpi2 = document.querySelector('.grid .hud-corner:nth-child(2) span.text-white');
  if (kpi2) kpi2.innerText = totalUses;
}

// 6. Modal y Formulario
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

  // VALIDACIÓN: Al menos un servicio debe estar seleccionado
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

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', renderTable);

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});