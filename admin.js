/* ============================================================
   ADMIN.JS - Lógica del Panel de Administración de Cupones
   ============================================================ */

let currentDiscountType = 'PERCENT';
let editingCouponId = null;

// 1. Obtener cupones desde el localStorage
function getStoredCoupons() {
  const stored = localStorage.getItem('fbg_coupons');
  if (stored) return JSON.parse(stored);
  
  // Cupones de prueba con fechas
  const today = new Date();
  const nextMonth = new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0];
  const defaultCoupons = [
    { id: 'CUP-9921', code: 'FBGGAMER20', type: 'PERCENT', value: 20, limit: 50, uses: 32, expiry: nextMonth, status: 'ACTIVO' },
    { id: 'CUP-9922', code: 'COMBOFULL15', type: 'PERCENT', value: 15, limit: 30, uses: 11, expiry: nextMonth, status: 'ACTIVO' },
    { id: 'CUP-9923', code: 'FBG10KFIX', type: 'FIXED', value: 10000, limit: 20, uses: 19, expiry: nextMonth, status: 'ACTIVO' },
    { id: 'CUP-9918', code: 'CYBERPROMO', type: 'PERCENT', value: 25, limit: 50, uses: 50, expiry: '2026-09-15', status: 'EXPIRADO' }
  ];
  localStorage.setItem('fbg_coupons', JSON.stringify(defaultCoupons));
  return defaultCoupons;
}

function saveCoupons(coupons) {
  localStorage.setItem('fbg_coupons', JSON.stringify(coupons));
}

// 2. Renderizar la tabla
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
    
    // Formatear fecha para mostrar (DD/MM/YYYY)
    let dateFormatted = 'Sin fecha';
    if (c.expiry) {
      const [year, month, day] = c.expiry.split('-');
      dateFormatted = `${day}/${month}/${year}`;
    }

    const borderColor = c.type === 'PERCENT' ? 'border-primary/50 text-primary' : 'border-cyber-gold/50 text-cyber-gold';
    const bgBadge = c.type === 'PERCENT' ? 'bg-secondary/15 border-secondary/50 text-secondary' : 'bg-cyber-gold/15 border-cyber-gold/50 text-cyber-gold';

    const tr = document.createElement('tr');
    tr.className = `coupon-row hover:bg-primary/5 transition-colors group ${isExpired ? 'opacity-60' : ''}`;
    tr.setAttribute('data-status', isExpired ? 'EXPIRADO' : c.status);

    tr.innerHTML = `
      <td class="py-4 px-4">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded bg-[#05060b] border ${borderColor} font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)] ${isExpired ? 'line-through text-slate-500 border-slate-700' : ''}">${c.code}</span>
          <button onclick="copyCode('${c.code}')" title="Copiar Enlace Directo" class="text-slate-500 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[17px]">link</span>
          </button>
        </div>
        <span class="text-[10px] text-slate-500 block mt-0.5">#${c.id}</span>
      </td>
      <td class="py-4 px-4">
        <span class="px-2.5 py-1 rounded-full ${isExpired ? 'bg-slate-800 border-slate-700 text-slate-400' : bgBadge} font-bold shadow-[0_0_12px_rgba(255,0,127,0.3)]">${discountStr}</span>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 max-w-[170px]">
          <span class="px-2 py-0.5 rounded ${isExpired ? 'bg-slate-900 text-slate-400' : 'bg-primary/10 border border-primary/30 text-primary'} truncate">Todos</span>
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 min-w-[100px]">
          <span class="${isExpired ? 'text-rose-400' : 'text-primary'} font-bold text-xs font-mono">${dateFormatted}</span>
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 min-w-[110px]">
          <span class="text-white font-bold">${uses} / ${limit}</span>
          <div class="w-full bg-[#05060b] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="${isExpired ? 'bg-rose-500' : 'bg-secondary'}" style="width: ${percent}%; height: 100%;"></div>
          </div>
          ${uses >= limit ? `<span class="text-[10px] text-rose-400 font-bold mt-0.5">100% agotado</span>` : `<span class="text-[10px] text-secondary">${percent}% cupo</span>`}
        </div>
      </td>
      <td class="py-4 px-4">
        ${isExpired ? `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span><span class="font-bold">AGOTADO</span>
          </div>
        ` : `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span class="font-bold">ACTIVO</span>
          </div>
        `}
      </td>
      <td class="py-4 px-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="editCoupon('${c.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Editar">
            <span class="material-symbols-outlined text-lg">edit</span>
          </button>
          <button onclick="deleteCouponRow('${c.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors" title="Eliminar Cupón">
            <span class="material-symbols-outlined text-lg">delete_forever</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  updateKPIs();
  renderLiveFeed();
}

// 3. Renderizar el historial de canjes (LIVE FEED)
function renderLiveFeed() {
  const feed = document.getElementById('liveLogFeed');
  if (!feed) return;

  const logs = JSON.parse(localStorage.getItem('fbg_coupon_logs') || '[]');
  
  if (logs.length === 0) {
    feed.innerHTML = `<div class="text-slate-500 text-center py-4 font-mono text-xs">// SIN CANJES REGISTRADOS AÚN</div>`;
    return;
  }

  feed.innerHTML = logs.slice(0, 5).map((log, index) => {
    // Colores alternados para simular distintos clientes
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

// 4. KPIs
function updateKPIs() {
  const coupons = getStoredCoupons();
  
  const activeCount = coupons.filter(c => c.status === 'ACTIVO' && (c.uses || 0) < (c.limit || 50)).length;
  const kpi1 = document.querySelector('.grid .hud-corner:nth-child(1) span.text-white');
  if (kpi1) kpi1.innerText = activeCount.toString().padStart(2, '0');

  const totalUses = coupons.reduce((sum, c) => sum + (c.uses || 0), 0);
  const kpi2 = document.querySelector('.grid .hud-corner:nth-child(2) span.text-white');
  if (kpi2) kpi2.innerText = totalUses;
}

// 5. Modal y Formulario
function openModal() {
  document.getElementById('couponModal').classList.remove('hidden');
  document.getElementById('modalTitle').innerText = 'Crear Cupón // FBG LAB';
  document.getElementById('couponCodeInput').value = '';
  editingCouponId = null;
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
  
  let coupons = getStoredCoupons();

  if (editingCouponId) {
    const index = coupons.findIndex(c => c.id === editingCouponId);
    if (index > -1) {
      coupons[index].code = code;
      coupons[index].type = currentDiscountType;
      coupons[index].value = val;
      coupons[index].limit = uses;
      coupons[index].expiry = expiry;
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
  updatePreview();
}

function copyCode(code) {
  navigator.clipboard.writeText(`https://fabrigrotta.github.io/fbgrosario/?cupon=${code}`);
  showToast(`// ENLACE COPIADO (?cupon=${code})`);
}

function deleteCouponRow(id) {
  if (confirm('// CONFIRMACIÓN FBG ROOT: ¿Eliminar este cupón permanentemente?')) {
    let coupons = getStoredCoupons();
    coupons = coupons.filter(c => c.id !== id);
    saveCoupons(coupons);
    renderTable();
    showToast('// CUPÓN ELIMINADO');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  document.getElementById('toastMessage').innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => { toast.classList.add('hidden'); }, 4500);
}

function hideToast() {
  document.getElementById('toastNotification').classList.add('hidden');
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