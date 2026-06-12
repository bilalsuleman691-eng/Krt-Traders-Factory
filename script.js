// Sirf ek baar initialize karein
const SUPABASE_URL = "https://skuheucjlmuqtdmovugp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ONscpGwZaU3LdZaF_-WgAg_9Fd22Wtf";

// Check karein ki pehle se to nahi bana hua
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


async function loadStockData() {
  const { data: inData } = await supabase.from("stock_in").select("*");
  const { data: outData } = await supabase.from("stock_out").select("*");

  if (inData) stockInEntries = inData;
  if (outData) stockOutEntries = outData;

  saveAll();
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
// DATA HELPERS
// ============================================================
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e) { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

let storeRates     = LS.get('krt_storeRates')     || [];
let stockInEntries = LS.get('krt_stockIn')         || [];
let stockOutEntries= LS.get('krt_stockOut')        || [];
let invoices       = LS.get('krt_invoices')        || [];
let gulzarData     = LS.get('krt_gulzar')          || [];
let kashifData     = LS.get('krt_kashif')          || [];
let salaryData     = LS.get('krt_salary')          || {}; // { "2026-06": [ {id,name,salary,advance,note} ] }
let spInEntries    = LS.get('krt_spIn')            || [];
let spOutEntries   = LS.get('krt_spOut')           || [];
let editingRateId  = null;
let editingInvTs   = null;

function saveAll() {
  LS.set('krt_storeRates', storeRates);
  LS.set('krt_stockIn', stockInEntries);
  LS.set('krt_stockOut', stockOutEntries);
  LS.set('krt_invoices', invoices);
  LS.set('krt_gulzar', gulzarData);
  LS.set('krt_kashif', kashifData);
  LS.set('krt_salary', salaryData);
  LS.set('krt_spIn', spInEntries);
  LS.set('krt_spOut', spOutEntries);
}

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
// INIT
// ============================================================
async function initApp() {
  await loadStockData();
  document.getElementById('todayDate').innerText = new Date().toLocaleDateString('ur-PK');
  document.querySelectorAll('.stock-date').forEach(f => f.value = new Date().toISOString().split('T')[0]);
  showPage('dashboard', 'Dashboard');
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

  if (!store || !barcode || rate <= 0) {
    alert('Store, barcode aur rate zaroori hain!');
    return;
  }

  // EDIT MODE
  if (editingRateId !== null) {
    const { error } = await supabase
      .from("store_rates")
      .update({ store, barcode, item, rate })
      .eq("id", editingRateId);

    if (error) {
      alert(error.message);
      return;
    }

    const idx = storeRates.findIndex(r => r.id === editingRateId);
    if (idx > -1) {
      storeRates[idx] = { id: editingRateId, store, barcode, item, rate };
    }

    editingRateId = null;
    document.getElementById('sr-save-btn').innerText = '+ Rate Save Karein';
    document.getElementById('sr-cancel-btn').style.display = 'none';

    alert("✔ Rate Updated");
    saveAll();
    return;
  }

  // ADD MODE
  const { data, error } = await supabase
    .from("store_rates")
    .insert([{
      store,
      barcode,
      item,
      rate
    }])
    .select();

  if (error) {
    alert(error.message);
    return;
  }

  // local sync
  if (data && data.length > 0) {
    storeRates.push(data[0]);
  }

  alert("✔ Rate Saved");
  saveAll();
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

function deleteRate(id) {
  if (!confirm('Is rate ko delete karein?')) return;
  storeRates = storeRates.filter(r => r.id !== id);
  saveAll();
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
      <td><button class="btn btn-outline btn-sm" onclick="editRate(${r.id})">✏️</button></td>
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
  // Update rates in existing rows
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

  if (!storeName || !date) {
    alert('Store name aur date zaroori hain!');
    return;
  }

  const items = [];

  document.querySelectorAll('#inv-body tr').forEach(row => {
    const bc   = row.querySelector('.bc-input')?.value || '';
    const item = row.querySelector('.item-input')?.value || '';
    const qty  = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;

    if (item || bc) {
      items.push({
        barcode: bc,
        item,
        qty,
        rate,
        total: qty * rate
      });
    }
  });

  if (items.length === 0) {
    alert('Koi item nahi hai!');
    return;
  }

  const disc    = parseFloat(document.getElementById('inv-discount').value) || 0;
  const sub     = items.reduce((s, i) => s + i.total, 0);
  const discAmt = sub * disc / 100;
  const final    = sub - discAmt;

  const ts = Date.now(); // ✅ FIX: missing variable

  // update local invoice if editing
  if (editingInvTs) {
    const idx = invoices.findIndex(i => i.timestamp === editingInvTs);

    if (idx > -1) {
      invoices[idx] = {
        ...invoices[idx],
        storeName,
        customerName: document.getElementById('inv-customer').value,
        ntn: document.getElementById('inv-ntn').value,
        strn: document.getElementById('inv-strn').value,
        address: document.getElementById('inv-address').value,
        date,
        items,
        discountPercent: disc,
        subTotal: sub.toFixed(2),
        discountAmt: discAmt.toFixed(2),
        finalTotal: final.toFixed(2)
      };

      alert('✔ Invoice Update Ho Gayi!');
    }

    editingInvTs = null;
  }

  // ✅ Supabase insert
  const { error } = await supabase.from("invoices").insert([{
    invoice_no: 'INV-' + ts,
    timestamp: ts,
    store_name: storeName,
    customer_name: document.getElementById('inv-customer').value,
    date,
    items,
    final_total: final
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  saveAll();
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
        <td style="white-space:nowrap">
          <button class="btn btn-outline btn-sm" onclick="viewInvModal(${i.timestamp})">👁 View</button>
          <button class="btn btn-outline btn-sm" onclick="loadInvToForm(${i.timestamp})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice(${i.timestamp})">🗑️</button>
        </td>
      </tr>`).join('');
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
  const ts = window._modalInvTs;
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

function deleteInvoice(ts) {
  if (!confirm('Invoice delete karein?')) return;
  invoices = invoices.filter(i => i.timestamp !== ts);
  saveAll();
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

  if (!itemName || qty <= 0) {
    alert('Item name aur qty zaroori hai!');
    return;
  }

  const date    = document.getElementById('in-date').value;
  const vendor  = document.getElementById('in-vendor').value;
  const barcode = document.getElementById('in-barcode').value;

  // 1️⃣ SUPABASE SAVE
  const { error } = await supabase.from("stock_in").insert([{
    date,
    vendor,
    item_name: itemName,
    barcode,
    qty,
    price,
    total: qty * price
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  // 2️⃣ LOCAL STORAGE ENTRY (✔ YAHAN EXACT PLACE HAI)
  const newEntry = {
    srNo: Date.now(),
    date,
    vendor,
    itemName,
    barcode,
    qty,
    price,
    total: qty * price
  };

  stockInEntries.push(newEntry);

  // 3️⃣ SAVE + UI UPDATE
  saveAll();
  renderStockInTable();

  alert("✔ Stock In Saved!");
}

function renderStockInTable() {
  const tbody = document.getElementById('stock-in-table');
  if (stockInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="8">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...stockInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date}</td><td>${d.itemName}</td><td>${d.vendor}</td>
      <td>${d.qty}</td><td>${d.price}</td><td>Rs. ${d.total}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStockIn(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function deleteStockIn(srNo) {
  if (!confirm('Delete karein?')) return;
  stockInEntries = stockInEntries.filter(e => e.srNo !== srNo);
  saveAll(); renderStockInTable();
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
  const barcode  = document.getElementById('out-barcode').value.trim();
  const date     = document.getElementById('out-date').value;

  if (!itemName || !customer || qty <= 0) {
    alert('Customer, item aur qty zaroori hain!');
    return;
  }

  const bal = getBalance(itemName);
  if (qty > bal) {
    alert(`Stock kam hai! Available: ${bal}`);
    return;
  }

  const { error } = await supabase.from("stock_out").insert([{
    date,
    customer,
    item_name: itemName,
    barcode,
    qty,
    price,
    total: qty * price
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  alert('✔ Stock Out Saved!');
}

function renderStockOutTable() {
  const tbody = document.getElementById('stock-out-table');
  if (stockOutEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="8">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...stockOutEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date}</td><td>${d.customer}</td><td>${d.itemName}</td>
      <td>${d.qty}</td><td>${d.price}</td><td>Rs. ${d.total}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStockOut(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function deleteStockOut(srNo) {
  if (!confirm('Delete karein?')) return;
  stockOutEntries = stockOutEntries.filter(e => e.srNo !== srNo);
  saveAll(); renderStockOutTable();
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
async function addLedgerEntry(person) {
  const date = document.getElementById(person + '-date').value;
  const credit = parseFloat(document.getElementById(person + '-credit').value) || 0;
  const debit = parseFloat(document.getElementById(person + '-debit').value) || 0;
  const note = document.getElementById(person + '-note').value || '';

  if (!date) {
    alert('Date zaroori hai!');
    return;
  }

  const tableName = person === "gulzar"
    ? "gulzar_ledger"
    : "kashif_ledger";

  const { error } = await supabase
    .from(tableName)
    .insert([{ date, credit, debit, note }]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Saved Successfully");
}

function deleteLedgerEntry(person, id) {
  if (!confirm('Delete karein?')) return;
  setLedgerData(person, getLedgerData(person).filter(x => x.id !== id));
  saveAll();
  renderLedgerPage(person);
}

function renderLedgerPage(person) {
  const data = getLedgerData(person);
  // running balance computed over full chronological data
  const sorted = [...data].sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const withBalance = sorted.map(x => { running += x.credit - x.debit; return {...x, balance: running}; });

  // summary
  const totalCredit = data.reduce((s,x) => s + x.credit, 0);
  const totalDebit  = data.reduce((s,x) => s + x.debit, 0);
  document.getElementById(person+'-total-credit').innerText = 'Rs. ' + totalCredit.toLocaleString();
  document.getElementById(person+'-total-debit').innerText  = 'Rs. ' + totalDebit.toLocaleString();
  document.getElementById(person+'-balance').innerText      = 'Rs. ' + (totalCredit-totalDebit).toLocaleString();

  // today's entries (entries dated today) -> "today" table; everything else -> history (old stock)
  
const today = new Date().toISOString().split('T')[0];
  const todayRows = withBalance.filter(x => x.date === today);
  const oldRows   = withBalance.filter(x => x.date !== today);

  const renderRows = (rows) => rows.length === 0
    ? '<tr class="no-data"><td colspan="6">Koi entry nahi</td></tr>'
    : rows.map(x => `<tr>
        <td>${x.date}</td><td style="color:green">Rs. ${x.credit}</td>
        <td style="color:var(--danger)">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance>=0?'green':'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteLedgerEntry('${person}',${x.id})">🗑️</button></td>
      </tr>`).join('');

  document.getElementById(person+'-today-table').innerHTML = renderRows(todayRows);
  // default history view = old (non-today) entries, most recent first
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
    ? '<tr class="no-data"><td colspan="6">Is period mein koi entry nahi</td></tr>'
    : [...withBalance].reverse().map(x => `<tr>
        <td>${x.date}</td><td style="color:green">Rs. ${x.credit}</td>
        <td style="color:var(--danger)">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance>=0?'green':'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
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
  // update only the balance cell + totals without full re-render (keeps focus)
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

async function saveSalaryMonth(){
 const month = document.getElementById('sal-month').value;

const rows = salaryData[month] || [];

for (let r of rows) {
  const { error } = await supabase
    .from("salary")
    .insert([{
      month,
      name: r.name,
      salary: r.salary,
      advance: r.advance,
      note: r.note
    }]);
    if (!salaryData[month]) salaryData[month] = [];
salaryData[month].push(r);
saveAll();

  if (error) {
    alert(error.message);
    return;
  }
}
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
  // auto-fill pcs-per-ctn from last entry of same barcode
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

  document.getElementById('spin-total-preview').innerText =
    'Total Pcs: ' + total;
}

async function saveSPStockIn() {
  const itemName   = document.getElementById('spin-item').value.trim();
  const barcode    = document.getElementById('spin-barcode').value.trim() || 'N/A';
  const pcsPerCtn  = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
  const ctn        = parseFloat(document.getElementById('spin-ctn').value) || 0;
  const extra      = parseFloat(document.getElementById('spin-extra').value) || 0;
  const price      = parseFloat(document.getElementById('spin-price').value) || 0;

  if (!itemName || pcsPerCtn <= 0) {
    alert('Item name aur Pcs per Ctn zaroori hain!');
    return;
  }

  const date = document.getElementById('spin-date').value;
  const vendor = document.getElementById('spin-vendor').value;

  const totalPcs = (ctn * pcsPerCtn) + extra;
  const total = totalPcs * price;

  const { error } = await supabase.from("sp_in").insert([{
    date,
    vendor,
    item_name: itemName,
    barcode,
    pcs_per_ctn: pcsPerCtn,
    ctn,
    extra,
    total_pcs: totalPcs,
    price,
    total
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Stock In Saved!");
}

function renderSPInTable() {
  const tbody = document.getElementById('sp-in-table');
  if (spInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="12">Koi entry nahi</td></tr>'; return;
  }
  tbody.innerHTML = [...spInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date||'-'}</td><td>${d.itemName}</td>
      <td style="font-family:monospace;font-size:12px">${d.barcode}</td>
      <td>${d.vendor}</td><td>${d.ctn}</td><td>${d.extra}</td><td>${d.pcsPerCtn}</td>
      <td><strong>${d.totalPcs}</strong></td><td>${d.price}</td><td>Rs. ${d.total}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSPIn(${d.srNo})">🗑️</button></td>
    </tr>`).join('');
}

function deleteSPIn(srNo) {
  if (!confirm('Delete karein?')) return;
  spInEntries = spInEntries.filter(e => e.srNo !== srNo);
  saveAll(); renderSPInTable();
}

// SP STOCK OUT
function getSPItemByBarcode(bc) {
  // find most recent stock-in entry with this barcode
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

  if (!store || !barcode || !itemName || qty <= 0) {
    alert('Store, barcode aur qty zaroori hain!');
    return;
  }

  const bal = getSPBalancePcs(barcode);
  if (qty > bal) {
    alert(`Godam mein stock kam hai! Available: ${bal} Pcs`);
    return;
  }

  const { error } = await supabase.from("sp_out").insert([{
    date,
    store,
    item_name: itemName,
    barcode,
    qty,
    price,
    total: qty * price
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  alert('✔ Stock Out Saved!');
  // clear form
  document.getElementById('spout-barcode').value = '';
  document.getElementById('spout-item').value = '';
  document.getElementById('spout-qty').value = '';
  document.getElementById('spout-price').value = '';

  renderSPOutTable();
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
    ? '<tr class="no-data"><td colspan="9">Koi entry nahi</td></tr>'
    : list.map((d, i) => `
      <tr>
        <td>${i+1}</td><td>${d.date||'-'}</td><td><span class="badge badge-store">${d.store}</span></td>
        <td>${d.itemName}</td><td style="font-family:monospace;font-size:12px">${d.barcode}</td>
        <td>${d.qty}</td><td>${d.price}</td><td>Rs. ${d.total}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteSPOut(${d.srNo})">🗑️</button></td>
      </tr>`).join('');
}

function clearSPOutFilter() {
  ['spout-from','spout-to','spout-search'].forEach(id => document.getElementById(id).value = '');
  renderSPOutTable();
}

function deleteSPOut(srNo) {
  if (!confirm('Delete karein?')) return;
  spOutEntries = spOutEntries.filter(e => e.srNo !== srNo);
  saveAll(); renderSPOutTable();
}

// SP BALANCE
function calcSPBalance() {
  const stock = {};
  spInEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0, pcsPerCtn: item.pcsPerCtn };
    stock[k].totalIn += Number(item.totalPcs) || 0;
    stock[k].pcsPerCtn = item.pcsPerCtn; // latest pcsPerCtn
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
  



function printSalarySheet() {
  const el = document.getElementById('page-salary-sheet');
  el.classList.add('printing-sheet');
  window.print();
  setTimeout(() => el.classList.remove('printing-sheet'), 500);
}




