/* ============================================================
   ADMIN.JS - Lógica del Panel de Administración de Cupones
   ============================================================ */

let currentDiscountType = 'PERCENT';
let editingCouponId = null;

function getStoredCoupons() {
  const stored = localStorage.getItem('fbg_coupons');
  if (stored) return JSON.parse(stored);
  
  const defaultCoupons = [
    { id: 'CUP-9921', code: 'FBGGAMER20', type: 'PERCENT', value: 20, limit: 50, status: 'ACTIVO' },
    { id: 'CUP-9922', code: 'COMBOFULL15', type: 'PERCENT', value: 15, limit: 30, status: 'ACTIVO' },
    { id: 'CUP-9923', code: 'FBG10KFIX', type: 'FIXED', value: 10000, limit: 20, status: 'ACTIVO' },
    { id: 'CUP-9918', code: 'CYBERPROMO', type: 'PERCENT', value: 25, limit: 50, status: 'EXPIRADO' }
  ];
  localStorage.setItem('fbg_coupons', JSON.stringify(defaultCoupons));
  return defaultCoupons;
}

function saveCoupons(coupons) {
  localStorage.setItem('fbg_coupons', JSON.stringify(coupons));
}

function renderTable() {
  const coupons = getStoredCoupons();
  const tbody = document.getElementById('couponsBody');
  if (!tbody) return;
  tbody.innerHTML = ''; 

  coupons.forEach(c => {
    const isExpired = c.status === 'EXPIRADO';
    const discountStr = c.type === 'PERCENT' ? `-${c.value}%` : `-$${Number(c.value).toLocaleString('es-AR')}`;
    
    const borderColor = c.type === 'PERCENT' ? 'border-primary/50 text-primary' : 'border-cyber-gold/50 text-cyber-gold';
    const bgBadge = c.type === 'PERCENT' ? 'bg-secondary/15 border-secondary/50 text-secondary' : 'bg-cyber-gold/15 border-cyber-gold/50 text-cyber-gold';

    const tr = document.createElement('tr');
    tr.className = `coupon-row hover:bg-primary/5 transition-colors group ${isExpired ? 'opacity-60' : ''}`;
    tr.setAttribute('data-status', c.status);

    tr.innerHTML = `
      <td class="py-4 px-4">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded bg-[#05060b] border ${borderColor} font-bold shadow-[0_0_10px_rgba(0,240,255,0.25)] ${isExpired ? 'line-through text-slate-500' : ''}">${c.code}</span>
          <button onclick="copyCode('${c.code}')" title="Copiar Enlace Directo" class="text-slate-500 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-[17px]">link</span>
          </button>
        </div>
        <span class="text-[10px] text-slate-500 block mt-0.5">#${c.id}</span>
      </td>
      <td class="py-4 px-4">
        <span class="px-2.5 py-1 rounded-full ${bgBadge} font-bold shadow-[0_0_12px_rgba(255,0,127,0.3)]">${discountStr}</span>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 max-w-[170px]">
          <span class="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary truncate">Todos</span>
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 min-w-[125px]">
          <span class="${isExpired ? 'text-rose-400' : 'text-primary'} font-bold">${isExpired ? 'Vencido' : 'Vigente'}</span>
          <div class="w-full bg-[#05060b] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="${isExpired ? 'bg-rose-500' : 'bg-primary'} h-full rounded-full" style="width: 100%;"></div>
          </div>
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="flex flex-col gap-1 min-w-[110px]">
          <span class="text-white font-bold">0 / ${c.limit}</span>
          <div class="w-full bg-[#05060b] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div class="bg-secondary h-full rounded-full" style="width: 0%;"></div>
          </div>
        </div>
      </td>
      <td class="py-4 px-4">
        ${isExpired ? `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-400">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span><span class="font-bold">EXPIRADO</span>
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
          ${!isExpired ? `
          <button onclick="toggleCouponStatus('${c.id}')" class="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" title="Pausar">
            <span class="material-symbols-outlined text-lg">pause_circle</span>
          </button>
          ` : ''}
          <button onclick="deleteCouponRow('${c.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-secondary hover:bg-secondary/10 transition-colors" title="Eliminar">
            <span class="material-symbols-outlined text-lg">delete_forever</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

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
  
  let coupons = getStoredCoupons();

  if (editingCouponId) {
    const index = coupons.findIndex(c => c.id === editingCouponId);
    if (index > -1) {
      coupons[index].code = code;
      coupons[index].type = currentDiscountType;
      coupons[index].value = val;
      coupons[index].limit = uses;
    }
    showToast(`// CUPÓN '${code}' ACTUALIZADO`);
  } else {
    const newCoupon = {
      id: `CUP-${Math.floor(Math.random() * 9000) + 1000}`,
      code: code,
      type: currentDiscountType,
      value: val,
      limit: uses,
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
  updatePreview();
}

function copyCode(code) {
  navigator.clipboard.writeText(`https://fabrigrotta.github.io/fbgrosario/?cupon=${code}`);
  showToast(`// ENLACE COPIADO (?cupon=${code})`);
}

function toggleCouponStatus(id) {
  let coupons = getStoredCoupons();
  const c = coupons.find(x => x.id === id);
  if (c) {
    c.status = c.status === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO';
    saveCoupons(coupons);
    renderTable();
    showToast(c.status === 'ACTIVO' ? '// REANUDADO' : '// PAUSADO');
  }
}

function deleteCouponRow(id) {
  if (confirm('// CONFIRMACIÓN FBG ROOT: ¿Eliminar este cupón?')) {
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