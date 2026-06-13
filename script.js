// ============================================================
// SUPABASE SETUP
// ============================================================
const SUPABASE_URL = "https://skuheucjlmuqtdmovugp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ONscpGwZaU3LdZaF_-WgAg_9Fd22Wtf";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function setSyncStatus(ok, text) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot || !txt) return;
  dot.classList.toggle('offline', !ok);
  txt.innerText = text;
}

async function sbSelect(table, order) {
  let q = sb.from(table).select('*');
  if (order) q = q.order(order.col, { ascending: order.asc !== false });
  const { data, error } = await q;
  if (error) { console.error(table, error); setSyncStatus(false, 'Sync Error'); return []; }
  return data || [];
}
async function sbInsert(table, row) {
  const { error } = await sb.from(table).insert(row);
  if (error) { console.error(table, error); alert('❌ Save error: ' + error.message); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}
async function sbUpdate(table, idCol, idVal, row) {
  const { error } = await sb.from(table).update(row).eq(idCol, idVal);
  if (error) { console.error(table, error); alert('❌ Update error: ' + error.message); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}
async function sbUpsert(table, row, idCol) {
  const { error } = await sb.from(table).upsert(row, { onConflict: idCol });
  if (error) { console.error(table, error); alert('❌ Save error: ' + error.message); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}
async function sbDelete(table, idCol, idVal) {
  const { error } = await sb.from(table).delete().eq(idCol, idVal);
  if (error) { console.error(table, error); alert('❌ Delete error: ' + error.message); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}

// ============================================================
// PRODUCT DATABASE
// ============================================================
const PRODUCTS = {
  "6957404902857":"SPONGE SCRUB 2 IN 1","8512532310967":"JUMBO SPIRAL 1 PCS 50 GRAM",
  "6971432358486":"FANCY HANDLE 2 IN 1","6971432358769":"FANCY HANDLE 3 IN 1 SILVER COLOR",
  "9031582648886":"FANCY HANDLE 3 IN 1","9031582691028":"FANCY HANDLE 1 PCS",
  "9035484809734":"COLOR SPONGE 6 COLOR","6956589300113":"MULTI COLOR FANCY FOAM 3 IN 1",
  "40883779":"BATH BELT","925100017805":"REGULAR LAMINATE 2 IN 1",
  "925100017812":"REGULAR LAMINATE 1 PCS","925100017652":"NAIL SAVER 1 PCS",
  "925100017799":"NAIL SAVER 2 IN 1","2215414451340":"LARGE LAMINATE 1 PCS",
  "8512532310295":"REGULAR PAD 1 PCS","8500532310186":"LARGE PAD 1 PCS",
  "6267207001641":"SMALL SPIRAL 2 IN 1","6267207001665":"JUMBO 2 IN 1",
  "230062603912":"REGULAR SPIRAL 1 PCS","6267207001658":"JUMBO SPIRAL 1 PCS",
  "4684000000190":"JUMBO SPIRAL 4 IN 1","4684000000183":"MICRO FIBER CLOTH 4 IN 1",
  "6971432358721":"FANCY NYLON SCRUBBER","4684000000992":"NAIL SAVER 3 IN 1",
  "4684000001005":"LARGE LAMINATE 3 IN 1","925100018864":"SILVER CLASSIC BODY RAZOR"
};

// ============================================================
// IN-MEMORY STATE (loaded from Supabase)
// ============================================================
let storeRates      = [];
let stockInEntries  = [];
let stockOutEntries = [];
let invoices        = [];
let gulzarData      = [];
let kashifData      = [];
let salaryData      = {}; // { "2026-06": [ {name,salary,advance,note} ] }
let spInEntries     = [];
let spOutEntries    = [];
let editingRateId   = null;
let editingInvTs    = null;
let editingStockInId  = null;
let editingStockOutId = null;
let editingSPInId     = null;
let editingSPOutId    = null;
let editingLedgerId   = { gulzar: null, kashif: null };

// ============================================================
// MAPPERS (DB row <-> app object)
// ============================================================
const map = {
  storeRate: r => ({ id: r.id, store: r.store, barcode: r.barcode, item: r.item, rate: Number(r.rate) }),
  invoice: r => ({
    timestamp: r.timestamp, invoiceNo: r.invoice_no, storeName: r.store_name, customerName: r.customer_name,
    ntn: r.ntn, strn: r.strn, address: r.address, date: r.date, items: r.items || [],
    discountPercent: Number(r.discount_percent), subTotal: r.sub_total, discountAmt: r.discount_amt, finalTotal: r.final_total
  }),
  stockIn: r => ({ srNo: r.sr_no, date: r.date, vendor: r.vendor, itemName: r.item_name, barcode: r.barcode, qty: Number(r.qty), price: Number(r.price), total: Number(r.total) }),
  stockOut: r => ({ srNo: r.sr_no, date: r.date, customer: r.customer, itemName: r.item_name, barcode: r.barcode, qty: Number(r.qty), price: Number(r.price), total: Number(r.total) }),
  ledger: r => ({ id: r.id, date: r.date, credit: Number(r.credit), debit: Number(r.debit), note: r.note || '' }),
  spIn: r => ({ srNo: r.sr_no, date: r.date, vendor: r.vendor, itemName: r.item_name, barcode: r.barcode, pcsPerCtn: Number(r.pcs_per_ctn), ctn: Number(r.ctn), extra: Number(r.extra), totalPcs: Number(r.total_pcs), price: Number(r.price), total: Number(r.total) }),
  spOut: r => ({ srNo: r.sr_no, date: r.date, store: r.store, barcode: r.barcode, itemName: r.item_name, qty: Number(r.qty), price: Number(r.price), total: Number(r.total) }),
};

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function login() {
  if (document.getElementById('pass').value === '123') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}
function logout() { location.reload(); }
document.getElementById('pass').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

// ============================================================
// INIT — load everything from Supabase once
// ============================================================
async function initApp() {
  document.getElementById('todayDate').innerText = new Date().toLocaleDateString('ur-PK');
  document.querySelectorAll('.stock-date').forEach(f => f.value = new Date().toISOString().split('T')[0]);
  setSyncStatus(true, 'Loading...');
  await loadAllData();
  setSyncStatus(true, 'Synced ✔');
  showPage('dashboard', 'Dashboard');
}

async function loadAllData() {
  const [rates, invs, sin, sout, gul, kas, sal, spin, spout] = await Promise.all([
    sbSelect('store_rates', { col: 'id' }),
    sbSelect('invoices', { col: 'timestamp' }),
    sbSelect('stock_in', { col: 'sr_no' }),
    sbSelect('stock_out', { col: 'sr_no' }),
    sbSelect('gulzar_ledger', { col: 'id' }),
    sbSelect('kashif_ledger', { col: 'id' }),
    sbSelect('salary_data', { col: 'month' }),
    sbSelect('sp_stock_in', { col: 'sr_no' }),
    sbSelect('sp_stock_out', { col: 'sr_no' }),
  ]);
  storeRates      = rates.map(map.storeRate);
  invoices        = invs.map(map.invoice);
  stockInEntries  = sin.map(map.stockIn);
  stockOutEntries = sout.map(map.stockOut);
  gulzarData      = gul.map(map.ledger);
  kashifData      = kas.map(map.ledger);
  spInEntries     = spin.map(map.spIn);
  spOutEntries    = spout.map(map.spOut);
  salaryData = {};
  sal.forEach(r => { salaryData[r.month] = r.rows || []; });
}

// ============================================================
// LAYOUT
// ============================================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('main-content').classList.toggle('expanded');
}

function showPage(id, title) {
  document.querySelectorAll('.page-section').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.style.display = 'block';
  document.getElementById('page-title').innerText = title;
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + id + "'")) n.classList.add('active');
  });
  // Page-specific loads
  if (id === 'dashboard')       loadDashboard();
  if (id === 'store-rates')     { renderRatesTable(); updateStoreLists(); }
  if (id === 'cash-invoice')    { updateInvStoreLists(); if (!document.querySelector('#inv-body tr')) addInvoiceRow(); }
  if (id === 'invoice-history') renderInvoiceHistory();
  if (id === 'stock-in')        renderStockInTable();
  if (id === 'stock-out')       renderStockOutTable();
  if (id === 'stock-balance')   calcBalanceSheet();
  if (id === 'gulzar')          { renderLedgerPage('gulzar'); }
  if (id === 'kashif')          { renderLedgerPage('kashif'); }
  if (id === 'salary-entry')    { initSalaryEntry(); }
  if (id === 'salary-sheet')    { initSalarySheet(); }
  if (id === 'salary-history')  { updateHistNameList(); }
  if (id === 'sp-in')           { renderSPInTable(); }
  if (id === 'sp-out')          { updateSPStoreList(); renderSPOutTable(); }
  if (id === 'sp-balance')      { calcSPBalance(); }
}

// ============================================================
// DASHBOARD
// ============================================================
function loadDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const todayInvs = invoices.filter(i => i.date === today);
  const todaySales = todayInvs.reduce((s, i) => s + parseFloat(i.finalTotal || 0), 0);
  document.getElementById('dash-today-sales').innerText = 'Rs. ' + todaySales.toLocaleString('en-PK', {minimumFractionDigits: 2});
  document.getElementById('dash-sale-count').innerText = todayInvs.length + ' invoices';
  document.getElementById('dash-stock-in').innerText = stockInEntries.reduce((s, i) => s + Number(i.qty), 0);
  document.getElementById('dash-stock-out').innerText = stockOutEntries.reduce((s, i) => s + Number(i.qty), 0);
  document.getElementById('dash-rates').innerText = storeRates.length;
  const recent = [...invoices].reverse().slice(0, 5);
  const tbody = document.getElementById('dash-recent-inv');
  tbody.innerHTML = recent.length === 0
    ? '<tr class="no-data"><td colspan="4">Koi invoice nahi</td></tr>'
    : recent.map(i => `<tr><td>${i.invoiceNo}</td><td>${i.storeName || i.customerName || '-'}</td><td>${i.date}</td><td>Rs. ${parseFloat(i.finalTotal).toLocaleString()}</td></tr>`).join('');
}

// ============================================================
// STORE RATES
// ============================================================
function updateStoreLists() {
  const stores = [...new Set(storeRates.map(r => r.store))];
  document.getElementById('sr-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
  const sel = document.getElementById('sr-filter-store');
  sel.innerHTML = '<option value="">Sab Stores</option>' + stores.map(s => `<option>${s}</option>`).join('');
}
function updateInvStoreLists() {
  const stores = [...new Set(storeRates.map(r => r.store))];
  document.getElementById('inv-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
}

function srBarcodeInput() {
  const bc = document.getElementById('sr-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('sr-item').value = PRODUCTS[bc];
}

async function saveStoreRate() {
  const store   = document.getElementById('sr-store').value.trim();
  const barcode = document.getElementById('sr-barcode').value.trim();
  const item    = document.getElementById('sr-item').value.trim() || PRODUCTS[barcode] || barcode;
  const rate    = parseFloat(document.getElementById('sr-rate').value) || 0;
  if (!store || !barcode || rate <= 0) { alert('Store, barcode aur rate zaroori hain!'); return; }

  if (editingRateId !== null) {
    const idx = storeRates.findIndex(r => r.id === editingRateId);
    const ok = await sbUpdate('store_rates', 'id', editingRateId, { store, barcode, item, rate });
    if (!ok) return;
    if (idx > -1) storeRates[idx] = { id: editingRateId, store, barcode, item, rate };
    editingRateId = null;
    document.getElementById('sr-save-btn').innerText = '+ Rate Save Karein';
    document.getElementById('sr-cancel-btn').style.display = 'none';
  } else {
    const existing = storeRates.findIndex(r => r.store === store && r.barcode === barcode);
    if (existing > -1) {
      const id = storeRates[existing].id;
      const ok = await sbUpdate('store_rates', 'id', id, { rate, item });
      if (!ok) return;
      storeRates[existing].rate = rate;
      storeRates[existing].item = item;
    } else {
      const id = Date.now();
      const ok = await sbInsert('store_rates', { id, store, barcode, item, rate });
      if (!ok) return;
      storeRates.push({ id, store, barcode, item, rate });
    }
  }

  ['sr-store','sr-barcode','sr-item','sr-rate'].forEach(id => document.getElementById(id).value = '');
  renderRatesTable();
  updateStoreLists();
}

function editRate(id) {
  const r = storeRates.find(x => x.id === id);
  if (!r) return;
  document.getElementById('sr-store').value   = r.store;
  document.getElementById('sr-barcode').value = r.barcode;
  document.getElementById('sr-item').value    = r.item;
  document.getElementById('sr-rate').value    = r.rate;
  editingRateId = id;
  document.getElementById('sr-save-btn').innerText = '✔ Update Rate';
  document.getElementById('sr-cancel-btn').style.display = '';
  window.scrollTo(0, 0);
}

function cancelRateEdit() {
  editingRateId = null;
  ['sr-store','sr-barcode','sr-item','sr-rate'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sr-save-btn').innerText = '+ Rate Save Karein';
  document.getElementById('sr-cancel-btn').style.display = 'none';
}

async function deleteRate(id) {
  if (!confirm('Is rate ko delete karein?')) return;
  const ok = await sbDelete('store_rates', 'id', id);
  if (!ok) return;
  storeRates = storeRates.filter(r => r.id !== id);
  renderRatesTable();
  updateStoreLists();
}

function filterRatesTable(q) {
  const filterStore = document.getElementById('sr-filter-store').value;
  const search = q.toLowerCase();
  document.querySelectorAll('#sr-table-body tr[data-search]').forEach(row => {
    const matchSearch = row.dataset.search.includes(search);
    const matchStore  = !filterStore || row.dataset.store === filterStore;
    row.style.display = matchSearch && matchStore ? '' : 'none';
  });
}

function renderRatesTable() {
  const tbody = document.getElementById('sr-table-body');
  if (storeRates.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="6">Koi rate nahi — upar se add karein</td></tr>';
    return;
  }
  tbody.innerHTML = storeRates.map(r => `
    <tr data-search="${(r.store+r.barcode+r.item).toLowerCase()}" data-store="${r.store}">
      <td><span class="badge badge-store">${r.store}</span></td>
      <td style="font-family:monospace;font-size:12px">${r.barcode}</td>
      <td>${r.item}</td>
      <td><strong>Rs. ${r.rate}</strong></td>
      <td><button class="btn btn-edit btn-sm" onclick="editRate(${r.id})">✏️</button></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRate(${r.id})">🗑️</button></td>
    </tr>`).join('');
}

// ============================================================
// CASH INVOICE
// ============================================================
function getStoreRate(barcode, storeName) {
  const r = storeRates.find(x => x.store === storeName && x.barcode === barcode);
  return r ? r.rate : 0;
}

function onInvStoreChange(storeName) {
  const info = document.getElementById('inv-store-info');
  const preview = document.getElementById('inv-store-rate-preview');
  const storeItems = storeRates.filter(r => r.store === storeName);
  if (storeName && storeItems.length > 0) {
    info.innerHTML = `<span class="badge badge-success">✔ ${storeName} — ${storeItems.length} items ke rates set hain</span>`;
    preview.innerHTML = storeItems.map(r => `<div style="font-size:12px;color:var(--muted);padding:2px 0">${r.item}: <strong>Rs. ${r.rate}</strong></div>`).join('');
  } else if (storeName) {
    info.innerHTML = `<span class="badge badge-warn">⚠ Is store ke rates nahi mile — manual rate daalen</span>`;
    preview.innerHTML = '';
  } else {
    info.innerHTML = 'Store name likhein — us store ke rates show honge';
    preview.innerHTML = '';
  }
  document.querySelectorAll('#inv-body tr').forEach(row => {
    const bc = row.querySelector('.bc-input')?.value.trim();
    const rateEl = row.querySelector('.rate-input');
    if (bc && rateEl) {
      const r = getStoreRate(bc, storeName);
      if (r > 0) rateEl.value = r;
    }
  });
  calcInvoice();
}

function addInvoiceRow() {
  const tbody = document.getElementById('inv-body');
  const n = tbody.rows.length + 1;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${n}</td>
    <td><input type="text" class="bc-input" placeholder="Barcode" oninput="onInvBarcode(this)"></td>
    <td><input type="text" class="item-input" placeholder="Item name"></td>
    <td><input type="number" class="qty-input" value="1" min="1" oninput="calcInvoice()"></td>
    <td><input type="number" class="rate-input" value="0" min="0" oninput="calcInvoice()"></td>
    <td class="row-total">Rs. 0.00</td>
    <td><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove();calcInvoice();renumberRows()">✕</button></td>`;
  tbody.appendChild(tr);
}

function renumberRows() {
  document.querySelectorAll('#inv-body tr').forEach((r, i) => r.cells[0].textContent = i + 1);
}

function onInvBarcode(el) {
  const bc = el.value.trim();
  const row = el.closest('tr');
  if (PRODUCTS[bc]) row.querySelector('.item-input').value = PRODUCTS[bc];
  const storeName = document.getElementById('inv-store').value.trim();
  const r = getStoreRate(bc, storeName);
  if (r > 0) row.querySelector('.rate-input').value = r;
  calcInvoice();
}

function calcInvoice() {
  let sub = 0;
  document.querySelectorAll('#inv-body tr').forEach(row => {
    const q = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const r = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    const t = q * r;
    const rt = row.querySelector('.row-total');
    if (rt) rt.innerText = 'Rs. ' + t.toFixed(2);
    sub += t;
  });
  const disc = parseFloat(document.getElementById('inv-discount').value) || 0;
  const discAmt = sub * disc / 100;
  const final = sub - discAmt;
  document.getElementById('inv-subtotal').innerText = 'Rs. ' + sub.toFixed(2);
  document.getElementById('inv-disc-amt').innerText = '- Rs. ' + discAmt.toFixed(2);
  document.getElementById('inv-disc-label').innerText = `Discount (${disc}%):`;
  document.getElementById('inv-final').innerText = 'Rs. ' + final.toFixed(2);
}

function clearInvoiceForm() {
  ['inv-store','inv-customer','inv-ntn','inv-strn','inv-address'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('inv-discount').value = '0';
  document.getElementById('inv-body').innerHTML = '';
  document.getElementById('inv-store-info').innerHTML = 'Store name likhein — us store ke rates show honge';
  document.getElementById('inv-store-rate-preview').innerHTML = '';
  calcInvoice();
  addInvoiceRow();
  editingInvTs = null;
}

async function saveInvoiceNow() {
  const storeName = document.getElementById('inv-store').value.trim();
  const date      = document.getElementById('inv-date').value;
  if (!storeName || !date) { alert('Store name aur date zaroori hain!'); return; }

  const items = [];
  document.querySelectorAll('#inv-body tr').forEach(row => {
    const bc   = row.querySelector('.bc-input')?.value.trim() || '';
    const item = row.querySelector('.item-input')?.value.trim() || '';
    const qty  = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    if (item || bc) items.push({ barcode: bc, item, qty, rate, total: (qty * rate).toFixed(2) });
  });
  if (items.length === 0) { alert('Koi item nahi hai!'); return; }

  const disc      = parseFloat(document.getElementById('inv-discount').value) || 0;
  const sub       = items.reduce((s, i) => s + parseFloat(i.total), 0);
  const discAmt   = sub * disc / 100;
  const final     = sub - discAmt;

  const customerName = document.getElementById('inv-customer').value;
  const ntn = document.getElementById('inv-ntn').value;
  const strn = document.getElementById('inv-strn').value;
  const address = document.getElementById('inv-address').value;

  if (editingInvTs) {
    const idx = invoices.findIndex(i => i.timestamp === editingInvTs);
    const row = {
      store_name: storeName, customer_name: customerName, ntn, strn, address, date, items,
      discount_percent: disc, sub_total: sub.toFixed(2), discount_amt: discAmt.toFixed(2), final_total: final.toFixed(2)
    };
    const ok = await sbUpdate('invoices', 'timestamp', editingInvTs, row);
    if (!ok) return;
    if (idx > -1) {
      invoices[idx] = { ...invoices[idx], storeName, customerName, ntn, strn, address, date, items,
        discountPercent: disc, subTotal: sub.toFixed(2), discountAmt: discAmt.toFixed(2), finalTotal: final.toFixed(2) };
    }
    alert('✔ Invoice Update Ho Gayi!');
    editingInvTs = null;
  } else {
    const ts = Date.now();
    const invoiceNo = 'INV-' + ts;
    const row = {
      timestamp: ts, invoice_no: invoiceNo, store_name: storeName, customer_name: customerName,
      ntn, strn, address, date, items, discount_percent: disc,
      sub_total: sub.toFixed(2), discount_amt: discAmt.toFixed(2), final_total: final.toFixed(2)
    };
    const ok = await sbInsert('invoices', row);
    if (!ok) return;
    invoices.push({
      invoiceNo, timestamp: ts, storeName, customerName, ntn, strn, address, date, items,
      discountPercent: disc, subTotal: sub.toFixed(2), discountAmt: discAmt.toFixed(2), finalTotal: final.toFixed(2)
    });
    alert('✔ Invoice Saved!');
  }

  clearInvoiceForm();
  loadDashboard();
}

function printCurrentInvoice() {
  const storeName  = document.getElementById('inv-store').value || 'KRT Customer';
  const date       = document.getElementById('inv-date').value;
  const disc       = parseFloat(document.getElementById('inv-discount').value) || 0;
  let sub = 0, rows = '';
  document.querySelectorAll('#inv-body tr').forEach((row, i) => {
    const bc   = row.querySelector('.bc-input')?.value || '';
    const item = row.querySelector('.item-input')?.value || '';
    const qty  = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    const tot  = qty * rate;
    sub += tot;
    rows += `<tr><td>${i+1}</td><td>${bc}</td><td>${item}</td><td>${qty}</td><td>${rate.toFixed(2)}</td><td>${tot.toFixed(2)}</td></tr>`;
  });
  const discAmt = sub * disc / 100;
  const final   = sub - discAmt;
  openPrintWindow(storeName, date, rows, sub, disc, discAmt, final,
    document.getElementById('inv-ntn').value,
    document.getElementById('inv-strn').value,
    document.getElementById('inv-address').value);
}

function openPrintWindow(storeName, date, rows, sub, disc, discAmt, final, ntn, strn, address) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>KRT Invoice</title>
  <style>body{font-family:Arial;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #000;padding:5px 7px}th{background:#f0f0f0}
  .center{text-align:center}.right{text-align:right}h2,h4{text-align:center;margin:3px}
  .info-table{border:none}td.info-label{border:none;width:100px;font-weight:bold}
  td.info-val{border:none}</style></head><body>
  <h2>KRT TRADERS</h2><h4>CASH INVOICE</h4>
  <table class="info-table" style="margin:10px 0">
    <tr><td class="info-label">Store:</td><td class="info-val">${storeName}</td><td class="info-label">Date:</td><td class="info-val">${date}</td></tr>
    <tr><td class="info-label">NTN:</td><td class="info-val">${ntn||'-'}</td><td class="info-label">STRN:</td><td class="info-val">${strn||'-'}</td></tr>
    <tr><td class="info-label">Address:</td><td class="info-val" colspan="3">${address||'-'}</td></tr>
  </table>
  <table><thead><tr><th>#</th><th>Barcode</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <table style="margin-top:6px;width:auto;float:right">
    <tr><td style="border:none;padding:4px 8px">Sub Total:</td><td style="border:none;text-align:right;padding:4px 8px">Rs. ${sub.toFixed(2)}</td></tr>
    <tr><td style="border:none;padding:4px 8px">Discount (${disc}%):</td><td style="border:none;text-align:right;padding:4px 8px">Rs. ${discAmt.toFixed(2)}</td></tr>
    <tr><td style="border:1px solid;padding:4px 8px;font-weight:bold">FINAL TOTAL:</td><td style="border:1px solid;text-align:right;padding:4px 8px;font-weight:bold">Rs. ${final.toFixed(2)}</td></tr>
  </table>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
}

// ============================================================
// INVOICE HISTORY
// ============================================================
function renderInvoiceHistory(q = '') {
  const list = [...invoices].reverse().filter(i => {
    const s = q.toLowerCase();
    return (i.storeName || i.customerName || '').toLowerCase().includes(s) || (i.invoiceNo || '').toLowerCase().includes(s);
  });
  const tbody = document.getElementById('inv-history-body');
  tbody.innerHTML = list.length === 0
    ? '<tr class="no-data"><td colspan="6">Koi invoice nahi</td></tr>'
    : list.map(i => `
      <tr>
        <td style="font-family:monospace;font-size:12px">${i.invoiceNo}</td>
        <td>${i.storeName || i.customerName || '-'}</td>
        <td>${i.date}</td>
        <td>${(i.items||[]).length} items</td>
        <td><strong>Rs. ${parseFloat(i.finalTotal).toLocaleString()}</strong></td>
        <td class="action-cell" style="white-space:nowrap">
          <button class="btn btn-outline btn-sm" onclick="viewInvModal(${i.timestamp})">👁 View</button>
          <button class="btn btn-edit btn-sm" onclick="loadInvToForm(${i.timestamp})">✏️ Edit</button>
          <button class="btn btn-print btn-sm" onclick="printInvoiceByTs(${i.timestamp})">🖨️ Print</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice(${i.timestamp})">🗑️</button>
        </td>
      </tr>`).join('');
}

function printInvoiceByTs(ts) {
  const inv = invoices.find(i => i.timestamp === ts);
  if (!inv) return;
  let sub = 0;
  const rows = (inv.items||[]).map((item, i) => {
    const t = parseFloat(item.total||0);
    sub += t;
    return `<tr><td>${i+1}</td><td>${item.barcode||'-'}</td><td>${item.item||'-'}</td><td>${item.qty}</td><td>${parseFloat(item.rate).toFixed(2)}</td><td>${t.toFixed(2)}</td></tr>`;
  }).join('');
  const disc = parseFloat(inv.discountPercent||0);
  const discAmt = parseFloat(inv.discountAmt||0);
  const final = parseFloat(inv.finalTotal||0);
  openPrintWindow(inv.storeName||inv.customerName||'-', inv.date, rows, sub, disc, discAmt, final, inv.ntn, inv.strn, inv.address);
}

function viewInvModal(ts) {
  const inv = invoices.find(i => i.timestamp === ts);
  if (!inv) { alert('Invoice nahi mili!'); return; }
  let rows = (inv.items||[]).map((item, i) => `
    <tr><td>${i+1}</td><td style="font-family:monospace;font-size:12px">${item.barcode||'-'}</td>
    <td>${item.item||'-'}</td><td>${item.qty}</td><td>Rs. ${parseFloat(item.rate).toFixed(2)}</td>
    <td>Rs. ${parseFloat(item.total).toFixed(2)}</td></tr>`).join('');
  document.getElementById('inv-modal-body').innerHTML = `
    <div class="grid2" style="margin-bottom:12px">
      <div><label>Invoice #</label><strong>${inv.invoiceNo}</strong></div>
      <div><label>Date</label>${inv.date}</div>
      <div><label>Store</label><strong>${inv.storeName||'-'}</strong></div>
      <div><label>Customer</label>${inv.customerName||'-'}</div>
      <div><label>NTN</label>${inv.ntn||'-'}</div>
      <div><label>STRN</label>${inv.strn||'-'}</div>
    </div>
    <table><thead><tr><th>#</th><th>Barcode</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div style="margin-top:12px;text-align:right">
      <div>Sub Total: Rs. ${parseFloat(inv.subTotal||0).toFixed(2)}</div>
      <div>Discount (${inv.discountPercent||0}%): - Rs. ${parseFloat(inv.discountAmt||0).toFixed(2)}</div>
      <div><strong>Final: Rs. ${parseFloat(inv.finalTotal).toFixed(2)}</strong></div>
    </div>`;
  document.getElementById('modal-del-btn').onclick = () => { deleteInvoice(ts); closeInvModal(); };
  document.getElementById('inv-modal').classList.add('open');
  window._modalInvTs = ts;
}

function editInvoiceFromModal() {
  closeInvModal();
  if (window._modalInvTs) loadInvToForm(window._modalInvTs);
}

function loadInvToForm(ts) {
  const inv = invoices.find(i => i.timestamp === ts);
  if (!inv) return;
  showPage('cash-invoice', 'Cash Invoice');
  document.getElementById('inv-store').value    = inv.storeName || '';
  document.getElementById('inv-customer').value = inv.customerName || '';
  document.getElementById('inv-ntn').value      = inv.ntn || '';
  document.getElementById('inv-strn').value     = inv.strn || '';
  document.getElementById('inv-address').value  = inv.address || '';
  document.getElementById('inv-date').value     = inv.date || '';
  document.getElementById('inv-discount').value = inv.discountPercent || 0;
  onInvStoreChange(inv.storeName || '');
  document.getElementById('inv-body').innerHTML = '';
  (inv.items || []).forEach(item => {
    addInvoiceRow();
    const row = document.querySelector('#inv-body tr:last-child');
    row.querySelector('.bc-input').value   = item.barcode || '';
    row.querySelector('.item-input').value = item.item || '';
    row.querySelector('.qty-input').value  = item.qty || 1;
    row.querySelector('.rate-input').value = item.rate || 0;
  });
  calcInvoice();
  editingInvTs = ts;
}

function closeInvModal() {
  document.getElementById('inv-modal').classList.remove('open');
}

function printModal() {
  printInvoiceByTs(window._modalInvTs);
}

async function deleteInvoice(ts) {
  if (!confirm('Invoice delete karein?')) return;
  const ok = await sbDelete('invoices', 'timestamp', ts);
  if (!ok) return;
  invoices = invoices.filter(i => i.timestamp !== ts);
  renderInvoiceHistory();
  loadDashboard();
  alert('✔ Invoice Delete Ho Gayi!');
}

// ============================================================
// STOCK IN
// ============================================================
function inBarcodeInput() {
  const bc = document.getElementById('in-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('in-item').value = PRODUCTS[bc];
}

async function saveStockIn() {
  const itemName = document.getElementById('in-item').value.trim();
  const qty      = parseFloat(document.getElementById('in-qty').value) || 0;
  const price    = parseFloat(document.getElementById('in-price').value) || 0;
  const vendor   = document.getElementById('in-vendor').value || 'N/A';
  const barcode  = document.getElementById('in-barcode').value || 'N/A';
  const date     = document.getElementById('in-date').value;
  if (!itemName || qty <= 0) { alert('Item name aur qty zaroori hai!'); return; }

  if (editingStockInId !== null) {
    const idx = stockInEntries.findIndex(e => e.srNo === editingStockInId);
    const row = { date, vendor, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbUpdate('stock_in', 'sr_no', editingStockInId, row);
    if (!ok) return;
    if (idx > -1) stockInEntries[idx] = { srNo: editingStockInId, date, vendor, itemName, barcode, qty, price, total: qty*price };
    editingStockInId = null;
    document.querySelector('#page-stock-in .btn-primary').innerText = 'Save Stock In';
    alert('✔ Stock In Updated!');
  } else {
    const srNo = Date.now();
    const row = { sr_no: srNo, date, vendor, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbInsert('stock_in', row);
    if (!ok) return;
    stockInEntries.push({ srNo, date, vendor, itemName, barcode, qty, price, total: qty * price });
    alert('✔ Stock In Saved!');
  }

  renderStockInTable();
  ['in-item','in-barcode','in-qty','in-price','in-vendor'].forEach(id => document.getElementById(id).value = '');
}

function renderStockInTable() {
  const tbody = document.getElementById('stock-in-table');
  if (stockInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="10">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...stockInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date||'-'}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span>${d.barcode && d.barcode!=='N/A' ? `<span class="stock-item-sub">${d.barcode}</span>` : ''}</div></td>
      <td>${d.vendor}</td>
      <td><span class="qty-pill">${d.qty}</span></td>
      <td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td><button class="btn btn-edit btn-sm" onclick="editStockIn(${d.srNo})">✏️</button></td>
      <td><button class="btn btn-print btn-sm" onclick="printStockEntry('in',${d.srNo})">🖨️</button></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStockIn(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function editStockIn(srNo) {
  const d = stockInEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('stock-in','Stock In');
  document.getElementById('in-date').value = d.date || '';
  document.getElementById('in-vendor').value = d.vendor || '';
  document.getElementById('in-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('in-item').value = d.itemName;
  document.getElementById('in-qty').value = d.qty;
  document.getElementById('in-price').value = d.price;
  editingStockInId = srNo;
  document.querySelector('#page-stock-in .btn-primary').innerText = '✔ Update Stock In';
  window.scrollTo(0,0);
}

async function deleteStockIn(srNo) {
  if (!confirm('Delete karein?')) return;
  const ok = await sbDelete('stock_in', 'sr_no', srNo);
  if (!ok) return;
  stockInEntries = stockInEntries.filter(e => e.srNo !== srNo);
  renderStockInTable();
}

function printStockEntry(type, srNo) {
  const list = type === 'in' ? stockInEntries : stockOutEntries;
  const d = list.find(e => e.srNo === srNo);
  if (!d) return;
  const title = type === 'in' ? 'STOCK IN RECEIPT' : 'STOCK OUT RECEIPT';
  const partyLabel = type === 'in' ? 'Vendor' : 'Customer';
  const party = type === 'in' ? d.vendor : d.customer;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>body{font-family:Arial;font-size:13px;margin:24px}table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #000;padding:6px 8px}th{background:#f0f0f0}
  h2,h4{text-align:center;margin:3px}.info-table{border:none;margin-top:8px}
  td.info-label{border:none;width:110px;font-weight:bold}td.info-val{border:none}</style></head><body>
  <h2>KRT TRADERS</h2><h4>${title}</h4>
  <table class="info-table">
    <tr><td class="info-label">Date:</td><td class="info-val">${d.date||'-'}</td></tr>
    <tr><td class="info-label">${partyLabel}:</td><td class="info-val">${party||'-'}</td></tr>
    <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
    <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode && d.barcode!=='N/A' ? d.barcode : '-'}</td></tr>
  </table>
  <table><thead><tr><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
  <tbody><tr><td>${d.qty}</td><td>Rs. ${d.price}</td><td>Rs. ${d.total}</td></tr></tbody></table>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
}

// ============================================================
// STOCK OUT
// ============================================================
function outBarcodeInput() {
  const bc = document.getElementById('out-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('out-item').value = PRODUCTS[bc];
}

function getBalance(itemName) {
  const inn  = stockInEntries.filter(x => x.itemName === itemName).reduce((s, x) => s + Number(x.qty), 0);
  const out  = stockOutEntries.filter(x => x.itemName === itemName).reduce((s, x) => s + Number(x.qty), 0);
  return inn - out;
}

async function saveStockOut() {
  const itemName = document.getElementById('out-item').value.trim();
  const qty      = parseFloat(document.getElementById('out-qty').value) || 0;
  const price    = parseFloat(document.getElementById('out-price').value) || 0;
  const customer = document.getElementById('out-customer').value.trim();
  const barcode  = document.getElementById('out-barcode').value || 'N/A';
  const date     = document.getElementById('out-date').value;
  if (!itemName || !customer || qty <= 0) { alert('Customer, item aur qty zaroori hain!'); return; }

  if (editingStockOutId !== null) {
    const idx = stockOutEntries.findIndex(e => e.srNo === editingStockOutId);
    const row = { date, customer, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbUpdate('stock_out', 'sr_no', editingStockOutId, row);
    if (!ok) return;
    if (idx > -1) stockOutEntries[idx] = { srNo: editingStockOutId, date, customer, itemName, barcode, qty, price, total: qty*price };
    editingStockOutId = null;
    document.querySelector('#page-stock-out .btn-primary').innerText = 'Save Stock Out';
    alert('✔ Stock Out Updated!');
  } else {
    const bal = getBalance(itemName);
    if (qty > bal) { if (!confirm(`Stock kam hai! Available: ${bal}. Phir bhi save karein?`)) return; }
    const srNo = Date.now();
    const row = { sr_no: srNo, date, customer, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbInsert('stock_out', row);
    if (!ok) return;
    stockOutEntries.push({ srNo, date, customer, itemName, barcode, qty, price, total: qty * price });
    alert('✔ Stock Out Saved!');
  }

  renderStockOutTable();
  ['out-item','out-barcode','out-qty','out-price','out-customer'].forEach(id => document.getElementById(id).value = '');
}

function renderStockOutTable() {
  const tbody = document.getElementById('stock-out-table');
  if (stockOutEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="10">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...stockOutEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date||'-'}</td><td>${d.customer}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span>${d.barcode && d.barcode!=='N/A' ? `<span class="stock-item-sub">${d.barcode}</span>` : ''}</div></td>
      <td><span class="qty-pill">${d.qty}</span></td>
      <td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td><button class="btn btn-edit btn-sm" onclick="editStockOut(${d.srNo})">✏️</button></td>
      <td><button class="btn btn-print btn-sm" onclick="printStockEntry('out',${d.srNo})">🖨️</button></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStockOut(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function editStockOut(srNo) {
  const d = stockOutEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('stock-out','Stock Out');
  document.getElementById('out-date').value = d.date || '';
  document.getElementById('out-customer').value = d.customer || '';
  document.getElementById('out-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('out-item').value = d.itemName;
  document.getElementById('out-qty').value = d.qty;
  document.getElementById('out-price').value = d.price;
  editingStockOutId = srNo;
  document.querySelector('#page-stock-out .btn-primary').innerText = '✔ Update Stock Out';
  window.scrollTo(0,0);
}

async function deleteStockOut(srNo) {
  if (!confirm('Delete karein?')) return;
  const ok = await sbDelete('stock_out', 'sr_no', srNo);
  if (!ok) return;
  stockOutEntries = stockOutEntries.filter(e => e.srNo !== srNo);
  renderStockOutTable();
}

// ============================================================
// STOCK BALANCE
// ============================================================
function calcBalanceSheet() {
  const stock = {};
  stockInEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0 };
    stock[k].totalIn += Number(item.qty) || 0;
  });
  stockOutEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0 };
    stock[k].totalOut += Number(item.qty) || 0;
  });
  const tbody = document.getElementById('balance-table');
  const vals = Object.values(stock);
  tbody.innerHTML = vals.length === 0
    ? '<tr class="no-data"><td colspan="5">Koi stock nahi</td></tr>'
    : vals.map(x => {
        const bal = x.totalIn - x.totalOut;
        return `<tr>
          <td style="font-family:monospace;font-size:12px">${x.barcode}</td>
          <td>${x.itemName}</td><td>${x.totalIn}</td><td>${x.totalOut}</td>
          <td><strong style="color:${bal>0?'var(--primary)':'var(--danger)'}">${bal}</strong></td>
        </tr>`;
      }).join('');
}

// ============================================================
// LEDGER (GULZAR / KASHIF) — generic
// ============================================================
function getLedgerData(person) { return person === 'gulzar' ? gulzarData : kashifData; }
function setLedgerData(person, data) { if (person === 'gulzar') gulzarData = data; else kashifData = data; }
function ledgerTable(person) { return person === 'gulzar' ? 'gulzar_ledger' : 'kashif_ledger'; }

function todayStr() { return new Date().toISOString().split('T')[0]; }

async function addLedgerEntry(person) {
  const date = document.getElementById(person + '-date').value;
  if (!date) { alert('Date zaroori hai!'); return; }
  const credit = parseFloat(document.getElementById(person + '-credit').value) || 0;
  const debit  = parseFloat(document.getElementById(person + '-debit').value)  || 0;
  const note   = document.getElementById(person + '-note').value || '';

  if (editingLedgerId[person] !== null) {
    const id = editingLedgerId[person];
    const ok = await sbUpdate(ledgerTable(person), 'id', id, { date, credit, debit, note });
    if (!ok) return;
    const data = getLedgerData(person);
    const idx = data.findIndex(x => x.id === id);
    if (idx > -1) data[idx] = { id, date, credit, debit, note };
    setLedgerData(person, data);
    editingLedgerId[person] = null;
    document.querySelector(`#page-${person} .btn-primary`).innerText = 'Save Entry';
  } else {
    const id = Date.now();
    const ok = await sbInsert(ledgerTable(person), { id, date, credit, debit, note });
    if (!ok) return;
    const data = getLedgerData(person);
    data.push({ id, date, credit, debit, note });
    setLedgerData(person, data);
  }

  [person+'-credit', person+'-debit', person+'-note'].forEach(id => document.getElementById(id).value = '');
  renderLedgerPage(person);
}

function editLedgerEntry(person, id) {
  const data = getLedgerData(person);
  const x = data.find(e => e.id === id);
  if (!x) return;
  document.getElementById(person+'-date').value = x.date;
  document.getElementById(person+'-credit').value = x.credit;
  document.getElementById(person+'-debit').value = x.debit;
  document.getElementById(person+'-note').value = x.note;
  editingLedgerId[person] = id;
  document.querySelector(`#page-${person} .btn-primary`).innerText = '✔ Update Entry';
  window.scrollTo(0,0);
}

async function deleteLedgerEntry(person, id) {
  if (!confirm('Delete karein?')) return;
  const ok = await sbDelete(ledgerTable(person), 'id', id);
  if (!ok) return;
  setLedgerData(person, getLedgerData(person).filter(x => x.id !== id));
  renderLedgerPage(person);
}

function printLedger(person) {
  const data = getLedgerData(person);
  const sorted = [...data].sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const withBalance = sorted.map(x => { running += x.credit - x.debit; return {...x, balance: running}; });
  const name = person === 'gulzar' ? 'Gulzar Bhai' : 'Kashif Bhai';
  const rows = withBalance.map(x => `<tr><td>${x.date}</td><td>${x.credit}</td><td>${x.debit}</td><td>${x.balance}</td><td>${x.note||''}</td></tr>`).join('');
  const totalCredit = data.reduce((s,x)=>s+x.credit,0);
  const totalDebit = data.reduce((s,x)=>s+x.debit,0);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${name} Ledger</title>
  <style>body{font-family:Arial;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #000;padding:5px 7px}th{background:#f0f0f0}h2,h4{text-align:center;margin:3px}</style></head><body>
  <h2>KRT TRADERS</h2><h4>${name} — Ledger Statement</h4>
  <table><thead><tr><th>Date</th><th>Credit</th><th>Debit</th><th>Balance</th><th>Note</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <p><strong>Total Credit:</strong> Rs. ${totalCredit} &nbsp; <strong>Total Debit:</strong> Rs. ${totalDebit} &nbsp; <strong>Net Balance:</strong> Rs. ${totalCredit-totalDebit}</p>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
}

function renderLedgerPage(person) {
  const data = getLedgerData(person);
  const sorted = [...data].sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const withBalance = sorted.map(x => { running += x.credit - x.debit; return {...x, balance: running}; });

  const totalCredit = data.reduce((s,x) => s + x.credit, 0);
  const totalDebit  = data.reduce((s,x) => s + x.debit, 0);
  document.getElementById(person+'-total-credit').innerText = 'Rs. ' + totalCredit.toLocaleString();
  document.getElementById(person+'-total-debit').innerText  = 'Rs. ' + totalDebit.toLocaleString();
  document.getElementById(person+'-balance').innerText      = 'Rs. ' + (totalCredit-totalDebit).toLocaleString();

  const today = todayStr();
  const todayRows = withBalance.filter(x => x.date === today);
  const oldRows   = withBalance.filter(x => x.date !== today);

  const renderRows = (rows) => rows.length === 0
    ? '<tr class="no-data"><td colspan="8">Koi entry nahi</td></tr>'
    : rows.map(x => `<tr>
        <td>${x.date}</td><td class="text-credit">Rs. ${x.credit}</td>
        <td class="text-debit">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance>=0?'var(--primary)':'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
        <td><button class="btn btn-edit btn-sm" onclick="editLedgerEntry('${person}',${x.id})">✏️</button></td>
        <td><button class="btn btn-print btn-sm" onclick="printLedger('${person}')">🖨️</button></td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteLedgerEntry('${person}',${x.id})">🗑️</button></td>
      </tr>`).join('');

  document.getElementById(person+'-today-table').innerHTML = renderRows(todayRows);
  document.getElementById(person+'-history-table').innerHTML = renderRows([...oldRows].reverse());
}

function renderLedgerHistory(person) {
  const from = document.getElementById(person+'-from').value;
  const to   = document.getElementById(person+'-to').value;
  const data = getLedgerData(person);
  const sorted = [...data].sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  let withBalance = sorted.map(x => { running += x.credit - x.debit; return {...x, balance: running}; });

  if (from) withBalance = withBalance.filter(x => x.date >= from);
  if (to)   withBalance = withBalance.filter(x => x.date <= to);

  const tbody = document.getElementById(person+'-history-table');
  tbody.innerHTML = withBalance.length === 0
    ? '<tr class="no-data"><td colspan="8">Is period mein koi entry nahi</td></tr>'
    : [...withBalance].reverse().map(x => `<tr>
        <td>${x.date}</td><td class="text-credit">Rs. ${x.credit}</td>
        <td class="text-debit">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance>=0?'var(--primary)':'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
        <td><button class="btn btn-edit btn-sm" onclick="editLedgerEntry('${person}',${x.id})">✏️</button></td>
        <td><button class="btn btn-print btn-sm" onclick="printLedger('${person}')">🖨️</button></td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteLedgerEntry('${person}',${x.id})">🗑️</button></td>
      </tr>`).join('');
}

function clearLedgerHistoryFilter(person) {
  document.getElementById(person+'-from').value = '';
  document.getElementById(person+'-to').value = '';
  renderLedgerPage(person);
}

// ============================================================
// SALARY SYSTEM
// ============================================================
function currentMonthStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

function initSalaryEntry() {
  const monthInput = document.getElementById('sal-month');
  if (!monthInput.value) monthInput.value = currentMonthStr();
  loadSalaryMonth();
}

function loadSalaryMonth() {
  const month = document.getElementById('sal-month').value;
  if (!month) return;
  document.getElementById('sal-month-label').innerText = month;
  if (!salaryData[month]) salaryData[month] = [];
  renderSalaryTable(month);
}

function renderSalaryTable(month) {
  const tbody = document.getElementById('sal-body');
  const rows = salaryData[month] || [];
  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="7">Koi employee nahi — "Employee Add Karein" se shuru karein</td></tr>';
  } else {
    tbody.innerHTML = rows.map((r, i) => {
      const balance = (r.salary - r.advance).toFixed(2);
      return `<tr>
        <td>${i+1}</td>
        <td><input type="text" value="${r.name}" oninput="updateSalRow('${month}',${i},'name',this.value)" placeholder="Naam"></td>
        <td><input type="number" value="${r.salary}" oninput="updateSalRow('${month}',${i},'salary',this.value)" placeholder="0"></td>
        <td><input type="number" value="${r.advance}" oninput="updateSalRow('${month}',${i},'advance',this.value)" placeholder="0"></td>
        <td class="row-total">Rs. ${balance}</td>
        <td><input type="text" value="${r.note||''}" oninput="updateSalRow('${month}',${i},'note',this.value)" placeholder="Note"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeSalRow('${month}',${i})">✕</button></td>
      </tr>`;
    }).join('');
  }
  updateSalaryTotals(month);
}

function addSalaryEmployeeRow() {
  const month = document.getElementById('sal-month').value;
  if (!month) { alert('Pehle month select karein!'); return; }
  if (!salaryData[month]) salaryData[month] = [];
  salaryData[month].push({ name: '', salary: 0, advance: 0, note: '' });
  renderSalaryTable(month);
}

function updateSalRow(month, idx, field, value) {
  const row = salaryData[month][idx];
  if (field === 'salary' || field === 'advance') row[field] = parseFloat(value) || 0;
  else row[field] = value;
  const balance = (row.salary - row.advance).toFixed(2);
  const tr = document.getElementById('sal-body').rows[idx];
  if (tr) tr.cells[4].innerText = 'Rs. ' + balance;
  updateSalaryTotals(month);
}

function removeSalRow(month, idx) {
  salaryData[month].splice(idx, 1);
  renderSalaryTable(month);
}

function updateSalaryTotals(month) {
  const rows = salaryData[month] || [];
  const totalSalary  = rows.reduce((s,r) => s + (Number(r.salary)||0), 0);
  const totalAdvance = rows.reduce((s,r) => s + (Number(r.advance)||0), 0);
  document.getElementById('sal-total-salary').innerText  = 'Rs. ' + totalSalary.toLocaleString();
  document.getElementById('sal-total-advance').innerText = 'Rs. ' + totalAdvance.toLocaleString();
}

async function saveSalaryMonth() {
  const month = document.getElementById('sal-month').value;
  if (!month) { alert('Month select karein!'); return; }
  const rows = salaryData[month] || [];
  const ok = await sbUpsert('salary_data', { month, rows, updated_at: new Date().toISOString() }, 'month');
  if (!ok) return;
  alert('✔ Salary Month Saved!');
}

// SALARY SHEET
function initSalarySheet() {
  const monthInput = document.getElementById('sheet-month');
  if (!monthInput.value) monthInput.value = currentMonthStr();
  renderSalarySheet();
}

function renderSalarySheet() {
  const month = document.getElementById('sheet-month').value;
  const tbody = document.getElementById('sheet-body');
  if (!month) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="6">Month select karein</td></tr>';
    document.getElementById('sheet-month-label').innerText = 'Month select karein';
    document.getElementById('sheet-total-salary').innerText = 'Rs. 0';
    document.getElementById('sheet-total-advance').innerText = 'Rs. 0';
    document.getElementById('sheet-total-net').innerText = 'Rs. 0';
    return;
  }
  document.getElementById('sheet-month-label').innerText = month;
  const rows = (salaryData[month] || []).filter(r => r.name && r.name.trim());
  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="6">Is month ka data nahi — Salary Entry mein add karein</td></tr>';
  } else {
    tbody.innerHTML = rows.map((r, i) => `<tr>
      <td>${i+1}</td><td><strong>${r.name}</strong></td>
      <td>Rs. ${Number(r.salary).toLocaleString()}</td>
      <td style="color:var(--danger)">Rs. ${Number(r.advance).toLocaleString()}</td>
      <td><strong style="color:var(--primary)">Rs. ${(r.salary-r.advance).toLocaleString()}</strong></td>
      <td>${r.note||''}</td>
    </tr>`).join('');
  }
  const totalSalary  = rows.reduce((s,r) => s + (Number(r.salary)||0), 0);
  const totalAdvance = rows.reduce((s,r) => s + (Number(r.advance)||0), 0);
  document.getElementById('sheet-total-salary').innerText  = 'Rs. ' + totalSalary.toLocaleString();
  document.getElementById('sheet-total-advance').innerText = 'Rs. ' + totalAdvance.toLocaleString();
  document.getElementById('sheet-total-net').innerText     = 'Rs. ' + (totalSalary-totalAdvance).toLocaleString();
}

// SALARY HISTORY
function updateHistNameList() {
  const names = new Set();
  Object.values(salaryData).forEach(rows => rows.forEach(r => { if (r.name && r.name.trim()) names.add(r.name.trim()); }));
  document.getElementById('hist-name-list').innerHTML = [...names].map(n => `<option value="${n}">`).join('');
}

function renderSalaryHistory() {
  const name  = (document.getElementById('hist-name').value || '').trim().toLowerCase();
  const month = document.getElementById('hist-month').value;
  const tbody = document.getElementById('hist-body');
  if (!name) { tbody.innerHTML = '<tr class="no-data"><td colspan="6">Naam likh kr search karein</td></tr>'; return; }

  const months = month ? [month] : Object.keys(salaryData).sort();
  const results = [];
  months.forEach(m => {
    (salaryData[m] || []).forEach(r => {
      if (r.name && r.name.trim().toLowerCase() === name) {
        results.push({ month: m, ...r });
      }
    });
  });

  tbody.innerHTML = results.length === 0
    ? '<tr class="no-data"><td colspan="6">Koi record nahi mila</td></tr>'
    : results.sort((a,b) => a.month.localeCompare(b.month)).map(r => `<tr>
        <td>${r.month}</td><td><strong>${r.name}</strong></td>
        <td>Rs. ${Number(r.salary).toLocaleString()}</td>
        <td style="color:var(--danger)">Rs. ${Number(r.advance).toLocaleString()}</td>
        <td><strong style="color:var(--primary)">Rs. ${(r.salary-r.advance).toLocaleString()}</strong></td>
        <td>${r.note||''}</td>
      </tr>`).join('');
}

function printSalarySheet() {
  const el = document.getElementById('page-salary-sheet');
  el.classList.add('printing-sheet');
  window.print();
  setTimeout(() => el.classList.remove('printing-sheet'), 500);
}

// ============================================================
// DAILY REPORT
// ============================================================
function generateReport() {
  const from = document.getElementById('rep-from').value;
  const to   = document.getElementById('rep-to').value;
  if (!from || !to) { alert('From aur To date select karein!'); return; }
  const filtIn  = stockInEntries.filter(x => x.date >= from && x.date <= to);
  const filtOut = stockOutEntries.filter(x => x.date >= from && x.date <= to);
  const inBody  = document.getElementById('rep-in-table');
  const outBody = document.getElementById('rep-out-table');
  inBody.innerHTML = filtIn.length === 0
    ? '<tr class="no-data"><td colspan="5">Is period mein koi purchase nahi</td></tr>'
    : filtIn.map(x => `<tr><td>${x.date}</td><td>${x.itemName}</td><td>${x.vendor||'-'}</td><td>${x.qty}</td><td>Rs. ${x.total}</td></tr>`).join('');
  outBody.innerHTML = filtOut.length === 0
    ? '<tr class="no-data"><td colspan="5">Is period mein koi sale nahi</td></tr>'
    : filtOut.map(x => `<tr><td>${x.date}</td><td>${x.itemName}</td><td>${x.customer||'-'}</td><td>${x.qty}</td><td>Rs. ${x.total}</td></tr>`).join('');
}

// ============================================================
// STORE PREDICTION (GODAM — CTN/PCS SYSTEM)
// ============================================================
function spinBarcodeInput() {
  const bc = document.getElementById('spin-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('spin-item').value = PRODUCTS[bc];
  const last = [...spInEntries].reverse().find(x => x.barcode === bc);
  if (last && !document.getElementById('spin-pcsperctn').value) {
    document.getElementById('spin-pcsperctn').value = last.pcsPerCtn;
  }
  updateSPInPreview();
}

function updateSPInPreview() {
  const ctn = parseFloat(document.getElementById('spin-ctn').value) || 0;
  const pcsPerCtn = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
  const extra = parseFloat(document.getElementById('spin-extra').value) || 0;
  const total = (ctn * pcsPerCtn) + extra;
  document.getElementById('spin-total-preview').innerText = 'Total Pcs: ' + total;
}

async function saveSPStockIn() {
  const itemName   = document.getElementById('spin-item').value.trim();
  const barcode    = document.getElementById('spin-barcode').value.trim() || 'N/A';
  const pcsPerCtn  = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
  const ctn        = parseFloat(document.getElementById('spin-ctn').value) || 0;
  const extra      = parseFloat(document.getElementById('spin-extra').value) || 0;
  const price      = parseFloat(document.getElementById('spin-price').value) || 0;
  const date       = document.getElementById('spin-date').value;
  const vendor     = document.getElementById('spin-vendor').value || 'N/A';

  if (!itemName || pcsPerCtn <= 0) { alert('Item name aur Pcs per Ctn zaroori hain!'); return; }
  const totalPcs = (ctn * pcsPerCtn) + extra;
  if (totalPcs <= 0) { alert('Ctn ya Extra Pcs mein qty likhein!'); return; }
  const total = totalPcs * price;

  if (editingSPInId !== null) {
    const idx = spInEntries.findIndex(e => e.srNo === editingSPInId);
    const row = { date, vendor, item_name: itemName, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: totalPcs, price, total };
    const ok = await sbUpdate('sp_stock_in', 'sr_no', editingSPInId, row);
    if (!ok) return;
    if (idx > -1) spInEntries[idx] = { srNo: editingSPInId, date, vendor, itemName, barcode, pcsPerCtn, ctn, extra, totalPcs, price, total };
    editingSPInId = null;
    document.querySelector('#page-sp-in .btn-primary').innerText = 'Save Stock In';
    alert('✔ Updated! Total Pcs: ' + totalPcs);
  } else {
    const srNo = Date.now();
    const row = { sr_no: srNo, date, vendor, item_name: itemName, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: totalPcs, price, total };
    const ok = await sbInsert('sp_stock_in', row);
    if (!ok) return;
    spInEntries.push({ srNo, date, vendor, itemName, barcode, pcsPerCtn, ctn, extra, totalPcs, price, total });
    alert('✔ Stock In Saved! Total Pcs: ' + totalPcs);
  }

  renderSPInTable();
  ['spin-item','spin-barcode','spin-ctn','spin-extra','spin-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('spin-pcsperctn').value = '';
  updateSPInPreview();
}

function renderSPInTable() {
  const tbody = document.getElementById('sp-in-table');
  if (spInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="14">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...spInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date||'-'}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span></div></td>
      <td style="font-family:monospace;font-size:12px">${d.barcode}</td>
      <td>${d.vendor}</td><td>${d.ctn}</td><td>${d.extra}</td><td>${d.pcsPerCtn}</td>
      <td><span class="qty-pill">${d.totalPcs}</span></td><td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td><button class="btn btn-edit btn-sm" onclick="editSPIn(${d.srNo})">✏️</button></td>
      <td><button class="btn btn-print btn-sm" onclick="printSPEntry('in',${d.srNo})">🖨️</button></td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSPIn(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function editSPIn(srNo) {
  const d = spInEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('sp-in','Store Prediction - Stock In');
  document.getElementById('spin-date').value = d.date || '';
  document.getElementById('spin-vendor').value = d.vendor === 'N/A' ? '' : d.vendor;
  document.getElementById('spin-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('spin-item').value = d.itemName;
  document.getElementById('spin-pcsperctn').value = d.pcsPerCtn;
  document.getElementById('spin-ctn').value = d.ctn;
  document.getElementById('spin-extra').value = d.extra;
  document.getElementById('spin-price').value = d.price;
  editingSPInId = srNo;
  document.querySelector('#page-sp-in .btn-primary').innerText = '✔ Update Stock In';
  updateSPInPreview();
  window.scrollTo(0,0);
}

async function deleteSPIn(srNo) {
  if (!confirm('Delete karein?')) return;
  const ok = await sbDelete('sp_stock_in', 'sr_no', srNo);
  if (!ok) return;
  spInEntries = spInEntries.filter(e => e.srNo !== srNo);
  renderSPInTable();
}

function printSPEntry(type, srNo) {
  if (type === 'in') {
    const d = spInEntries.find(e => e.srNo === srNo);
    if (!d) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>SP Stock In</title>
    <style>body{font-family:Arial;font-size:13px;margin:24px}table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #000;padding:6px 8px}th{background:#f0f0f0}h2,h4{text-align:center;margin:3px}
    .info-table{border:none;margin-top:8px}td.info-label{border:none;width:110px;font-weight:bold}td.info-val{border:none}</style></head><body>
    <h2>KRT TRADERS — GODAM</h2><h4>STOCK IN RECEIPT</h4>
    <table class="info-table">
      <tr><td class="info-label">Date:</td><td class="info-val">${d.date||'-'}</td></tr>
      <tr><td class="info-label">Vendor:</td><td class="info-val">${d.vendor||'-'}</td></tr>
      <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
      <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode!=='N/A'?d.barcode:'-'}</td></tr>
    </table>
    <table><thead><tr><th>Ctn</th><th>Extra Pcs</th><th>Pcs/Ctn</th><th>Total Pcs</th><th>Price</th><th>Total</th></tr></thead>
    <tbody><tr><td>${d.ctn}</td><td>${d.extra}</td><td>${d.pcsPerCtn}</td><td>${d.totalPcs}</td><td>Rs. ${d.price}</td><td>Rs. ${d.total}</td></tr></tbody></table>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  } else {
    const d = spOutEntries.find(e => e.srNo === srNo);
    if (!d) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>SP Stock Out</title>
    <style>body{font-family:Arial;font-size:13px;margin:24px}table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #000;padding:6px 8px}th{background:#f0f0f0}h2,h4{text-align:center;margin:3px}
    .info-table{border:none;margin-top:8px}td.info-label{border:none;width:110px;font-weight:bold}td.info-val{border:none}</style></head><body>
    <h2>KRT TRADERS — GODAM</h2><h4>STOCK OUT RECEIPT</h4>
    <table class="info-table">
      <tr><td class="info-label">Date:</td><td class="info-val">${d.date||'-'}</td></tr>
      <tr><td class="info-label">Store:</td><td class="info-val">${d.store||'-'}</td></tr>
      <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
      <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode||'-'}</td></tr>
    </table>
    <table><thead><tr><th>Qty (Pcs)</th><th>Price</th><th>Total</th></tr></thead>
    <tbody><tr><td>${d.qty}</td><td>Rs. ${d.price}</td><td>Rs. ${d.total}</td></tr></tbody></table>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  }
}

// SP STOCK OUT
function getSPItemByBarcode(bc) {
  return [...spInEntries].reverse().find(x => x.barcode === bc);
}

function getSPBalancePcs(barcode) {
  const totalIn  = spInEntries.filter(x => x.barcode === barcode).reduce((s,x) => s + Number(x.totalPcs), 0);
  const totalOut = spOutEntries.filter(x => x.barcode === barcode).reduce((s,x) => s + Number(x.qty), 0);
  return totalIn - totalOut;
}

function spoutBarcodeInput() {
  const bc = document.getElementById('spout-barcode').value.trim();
  const entry = getSPItemByBarcode(bc);
  const itemField = document.getElementById('spout-item');
  const info = document.getElementById('spout-balance-info');
  if (entry) {
    itemField.value = entry.itemName;
    const bal = getSPBalancePcs(bc);
    const pcsPerCtn = entry.pcsPerCtn || 0;
    const ctnPart = pcsPerCtn > 0 ? Math.floor(bal / pcsPerCtn) : 0;
    const pcsPart = pcsPerCtn > 0 ? bal % pcsPerCtn : bal;
    info.innerHTML = `<span class="badge ${bal>0?'badge-success':'badge-danger'}">Available Balance: ${bal} Pcs (${ctnPart} Ctn + ${pcsPart} Pcs)</span>`;
    if (!document.getElementById('spout-price').value && entry.price) {
      document.getElementById('spout-price').value = entry.price;
    }
  } else if (PRODUCTS[bc]) {
    itemField.value = PRODUCTS[bc];
    info.innerHTML = `<span class="badge badge-warn">⚠ Is barcode ka godam stock nahi mila</span>`;
  } else {
    itemField.value = '';
    info.innerHTML = bc ? `<span class="badge badge-warn">⚠ Barcode godam mein nahi mila</span>` : '';
  }
}

function updateSPStoreList() {
  const stores = [...new Set(spOutEntries.map(x => x.store))];
  document.getElementById('spout-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
}

async function saveSPStockOut() {
  const store    = document.getElementById('spout-store').value.trim();
  const barcode  = document.getElementById('spout-barcode').value.trim();
  const itemName = document.getElementById('spout-item').value.trim();
  const qty      = parseFloat(document.getElementById('spout-qty').value) || 0;
  const price    = parseFloat(document.getElementById('spout-price').value) || 0;
  const date     = document.getElementById('spout-date').value;
  if (!store || !barcode || !itemName || qty <= 0) { alert('Store, barcode aur qty zaroori hain!'); return; }

  if (editingSPOutId !== null) {
    const idx = spOutEntries.findIndex(e => e.srNo === editingSPOutId);
    const row = { date, store, barcode, item_name: itemName, qty, price, total: qty * price };
    const ok = await sbUpdate('sp_stock_out', 'sr_no', editingSPOutId, row);
    if (!ok) return;
    if (idx > -1) spOutEntries[idx] = { srNo: editingSPOutId, date, store, barcode, itemName, qty, price, total: qty*price };
    editingSPOutId = null;
    document.querySelector('#page-sp-out .btn-primary').innerText = 'Save Stock Out';
    alert('✔ Stock Out Updated!');
  } else {
    const bal = getSPBalancePcs(barcode);
    if (qty > bal) { alert(`Godam mein stock kam hai! Available: ${bal} Pcs`); return; }
    const srNo = Date.now();
    const row = { sr_no: srNo, date, store, barcode, item_name: itemName, qty, price, total: qty * price };
    const ok = await sbInsert('sp_stock_out', row);
    if (!ok) return;
    spOutEntries.push({ srNo, date, store, barcode, itemName, qty, price, total: qty * price });
    alert('✔ Stock Out Saved!');
  }

  renderSPOutTable();
  updateSPStoreList();
  ['spout-barcode','spout-item','spout-qty','spout-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('spout-balance-info').innerHTML = '';
}

function renderSPOutTable() {
  const from = document.getElementById('spout-from')?.value;
  const to   = document.getElementById('spout-to')?.value;
  const search = (document.getElementById('spout-search')?.value || '').toLowerCase();
  let list = [...spOutEntries].reverse();
  if (from) list = list.filter(x => x.date >= from);
  if (to)   list = list.filter(x => x.date <= to);
  if (search) list = list.filter(x => (x.store+x.itemName+x.barcode).toLowerCase().includes(search));

  const tbody = document.getElementById('sp-out-table');
  tbody.innerHTML = list.length === 0
    ? '<tr class="no-data"><td colspan="11">Koi entry nahi</td></tr>'
    : list.map((d, i) => `
      <tr>
        <td>${i+1}</td><td>${d.date||'-'}</td><td><span class="badge badge-store">${d.store}</span></td>
        <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span></div></td>
        <td style="font-family:monospace;font-size:12px">${d.barcode}</td>
        <td><span class="qty-pill">${d.qty}</span></td><td>${d.price}</td>
        <td><span class="total-pill">Rs. ${d.total}</span></td>
        <td><button class="btn btn-edit btn-sm" onclick="editSPOut(${d.srNo})">✏️</button></td>
        <td><button class="btn btn-print btn-sm" onclick="printSPEntry('out',${d.srNo})">🖨️</button></td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteSPOut(${d.srNo})">🗑️</button></td>
      </tr>`).join('');
}

function editSPOut(srNo) {
  const d = spOutEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('sp-out','Store Prediction - Stock Out');
  document.getElementById('spout-date').value = d.date || '';
  document.getElementById('spout-store').value = d.store || '';
  document.getElementById('spout-barcode').value = d.barcode || '';
  document.getElementById('spout-item').value = d.itemName;
  document.getElementById('spout-qty').value = d.qty;
  document.getElementById('spout-price').value = d.price;
  editingSPOutId = srNo;
  document.querySelector('#page-sp-out .btn-primary').innerText = '✔ Update Stock Out';
  window.scrollTo(0,0);
}

function clearSPOutFilter() {
  ['spout-from','spout-to','spout-search'].forEach(id => document.getElementById(id).value = '');
  renderSPOutTable();
}

async function deleteSPOut(srNo) {
  if (!confirm('Delete karein?')) return;
  const ok = await sbDelete('sp_stock_out', 'sr_no', srNo);
  if (!ok) return;
  spOutEntries = spOutEntries.filter(e => e.srNo !== srNo);
  renderSPOutTable();
}

// SP BALANCE
function calcSPBalance() {
  const stock = {};
  spInEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0, pcsPerCtn: item.pcsPerCtn };
    stock[k].totalIn += Number(item.totalPcs) || 0;
    stock[k].pcsPerCtn = item.pcsPerCtn;
  });
  spOutEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0, pcsPerCtn: 0 };
    stock[k].totalOut += Number(item.qty) || 0;
  });
  const tbody = document.getElementById('sp-balance-table');
  const vals = Object.values(stock);
  tbody.innerHTML = vals.length === 0
    ? '<tr class="no-data"><td colspan="6">Koi stock nahi</td></tr>'
    : vals.map(x => {
        const bal = x.totalIn - x.totalOut;
        const pcsPerCtn = x.pcsPerCtn || 0;
        const ctnPart = pcsPerCtn > 0 ? Math.floor(bal / pcsPerCtn) : 0;
        const pcsPart = pcsPerCtn > 0 ? bal % pcsPerCtn : bal;
        const ctnDisplay = pcsPerCtn > 0 ? `${ctnPart} Ctn + ${pcsPart} Pcs` : `${bal} Pcs`;
        return `<tr>
          <td style="font-family:monospace;font-size:12px">${x.barcode}</td>
          <td>${x.itemName}</td><td>${x.totalIn}</td><td>${x.totalOut}</td>
          <td><strong style="color:${bal>0?'var(--primary)':'var(--danger)'}">${bal}</strong></td>
          <td>${ctnDisplay}</td>
        </tr>`;
      }).join('');
}
