// ============================================================
// SUPABASE SETUP
// ============================================================
const SUPABASE_URL = "https://skuheucjlmuqtdmovugp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ONscpGwZaU3LdZaF_-WgAg_9Fd22Wtf";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let invoiceCounter = 0;

function setSyncStatus(ok, text) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot || !txt) return;
  dot.classList.toggle('offline', !ok);
  txt.innerText = text;
}

function showNotification(message, type = 'success') {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = message;
  el.className = 'notification ' + type + ' show';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
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
  if (error) { console.error(table, error); showNotification('Save error: ' + error.message, 'error'); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}

async function sbUpdate(table, idCol, idVal, row) {
  const { error } = await sb.from(table).update(row).eq(idCol, idVal);
  if (error) { console.error(table, error); showNotification('Update error: ' + error.message, 'error'); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}

async function sbUpsert(table, row, idCol) {
  const { error } = await sb.from(table).upsert(row, { onConflict: idCol });
  if (error) { console.error(table, error); showNotification('Save error: ' + error.message, 'error'); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}

async function sbDelete(table, idCol, idVal) {
  const { error } = await sb.from(table).delete().eq(idCol, idVal);
  if (error) { console.error(table, error); showNotification('Delete error: ' + error.message, 'error'); setSyncStatus(false, 'Sync Error'); return false; }
  return true;
}

// ============================================================
// PRODUCT DATABASE
// ============================================================
const PRODUCTS = {
  "6957404902857": "SPONGE SCRUB 2 IN 1",
  "8512532310967": "JUMBO SPIRAL 1 PCS 50 GRAM",
  "6971432358486": "FANCY HANDLE 2 IN 1",
  "6971432358769": "FANCY HANDLE 3 IN 1 SILVER COLOR",
  "9031582648886": "FANCY HANDLE 3 IN 1",
  "9031582691028": "FANCY HANDLE 1 PCS",
  "9035484809734": "COLOR SPONGE 6 COLOR",
  "6956589300113": "MULTI COLOR FANCY FOAM 3 IN 1",
  "40883779": "BATH BELT",
  "925100017805": "REGULAR LAMINATE 2 IN 1",
  "925100017812": "REGULAR LAMINATE 1 PCS",
  "925100017652": "NAIL SAVER 1 PCS",
  "925100017799": "NAIL SAVER 2 IN 1",
  "2215414451340": "LARGE LAMINATE 1 PCS",
  "8512532310295": "REGULAR PAD 1 PCS",
  "8500532310186": "LARGE PAD 1 PCS",
  "6267207001641": "SMALL SPIRAL 2 IN 1",
  "6267207001665": "JUMBO 2 IN 1",
  "230062603912": "REGULAR SPIRAL 1 PCS",
  "6267207001658": "JUMBO SPIRAL 1 PCS",
  "4684000000190": "JUMBO SPIRAL 4 IN 1",
  "4684000000183": "MICRO FIBER CLOTH 4 IN 1",
  "6971432358721": "FANCY NYLON SCRUBBER",
  "4684000000992": "NAIL SAVER 3 IN 1",
  "4684000001005": "LARGE LAMINATE 3 IN 1",
  "925100018864": "SILVER CLASSIC BODY RAZOR"
};

// ============================================================
// IN-MEMORY STATE
// ============================================================
let storeRates = [];
let stockInEntries = [];
let stockOutEntries = [];
let invoices = [];
let gulzarData = [];
let kashifData = [];
let salaryData = {};
let spInEntries = [];
let spOutEntries = [];
let editingRateId = null;
let editingInvTs = null;
let editingStockInId = null;
let editingStockOutId = null;
let editingSPInId = null;
let editingSPOutId = null;
let editingLedgerId = { gulzar: null, kashif: null };
let ratesVisible = false;

// ============================================================
// MAPPERS
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
  spIn: r => ({ srNo: r.sr_no, date: r.date, vendor: r.vendor, itemName: r.item_name, barcode: r.barcode, pcsPerCtn: Number(r.pcs_per_ctn) || 0, ctn: Number(r.ctn) || 0, extra: Number(r.extra) || 0, totalPcs: Number(r.total_pcs) || 0, price: Number(r.price) || 0, total: Number(r.total) || 0 }),
  spOut: r => ({ srNo: r.sr_no, date: r.date, store: r.store, barcode: r.barcode, itemName: r.item_name, qty: Number(r.qty), price: Number(r.price), total: Number(r.total), invoiceTimestamp: r.invoice_timestamp || null }),
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
// INIT
// ============================================================
async function initApp() {
  document.getElementById('todayDate').innerText = new Date().toLocaleDateString('en-PK');
  document.querySelectorAll('.stock-date').forEach(f => f.value = new Date().toISOString().split('T')[0]);
  setSyncStatus(true, 'Loading...');
  await loadAllData();
  setSyncStatus(true, 'Synced ✔');
  updateInvoiceNumber();
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
  storeRates = rates.map(map.storeRate);
  invoices = invs.map(map.invoice);
  stockInEntries = sin.map(map.stockIn);
  stockOutEntries = sout.map(map.stockOut);
  gulzarData = gul.map(map.ledger);
  kashifData = kas.map(map.ledger);
  spInEntries = spin.map(map.spIn);
  spOutEntries = spout.map(map.spOut);
  salaryData = {};
  sal.forEach(r => { salaryData[r.month] = r.rows || []; });
  invoiceCounter = invoices.length;
}

// ============================================================
// INVOICE NUMBER
// ============================================================
function updateInvoiceNumber() {
  const num = String(invoiceCounter + 1).padStart(3, '0');
  document.getElementById('invoice-number-display').innerText = 'INV-' + num;
}

function getNextInvoiceNumber() {
  invoiceCounter++;
  return 'INV-' + String(invoiceCounter).padStart(3, '0');
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
  
  if (id === 'dashboard') loadDashboard();
  if (id === 'store-rates') { renderRatesTable(); updateStoreLists(); }
  if (id === 'cash-invoice') { updateInvStoreLists(); if (!document.querySelector('#inv-body tr')) addInvoiceRow(); updateInvoiceNumber(); }
  if (id === 'invoice-history') renderInvoiceHistory();
  if (id === 'stock-in') renderStockInTable();
  if (id === 'stock-out') renderStockOutTable();
  if (id === 'stock-balance') calcBalanceSheet();
  if (id === 'gulzar') renderLedgerPage('gulzar');
  if (id === 'kashif') renderLedgerPage('kashif');
  if (id === 'salary-entry') initSalaryEntry();
  if (id === 'salary-sheet') initSalarySheet();
  if (id === 'salary-history') updateHistNameList();
  if (id === 'sp-in') renderSPInTable();
  if (id === 'sp-out') { updateSPStoreList(); renderSPOutTable(); }
  if (id === 'sp-balance') calcSPBalance();
}

// ============================================================
// DASHBOARD
// ============================================================
function loadDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const todayInvs = invoices.filter(i => i.date === today);
  const todaySales = todayInvs.reduce((s, i) => s + parseFloat(i.finalTotal || 0), 0);
  document.getElementById('dash-today-sales').innerText = 'Rs. ' + todaySales.toLocaleString('en-PK', { minimumFractionDigits: 2 });
  document.getElementById('dash-sale-count').innerText = todayInvs.length + ' invoices';

  const todayStockIn = stockInEntries.filter(x => x.date === today);
  const todayPurchase = todayStockIn.reduce((s, x) => s + x.total, 0);
  document.getElementById('dash-today-purchase').innerText = 'Rs. ' + todayPurchase.toLocaleString('en-PK', { minimumFractionDigits: 2 });
  document.getElementById('dash-purchase-count').innerText = todayStockIn.reduce((s, x) => s + x.qty, 0) + ' items';

  const totalStock = stockInEntries.reduce((s, x) => s + x.qty, 0) - stockOutEntries.reduce((s, x) => s + x.qty, 0);
  document.getElementById('dash-total-stock').innerText = totalStock;

  const totalSales = invoices.reduce((s, i) => s + parseFloat(i.finalTotal || 0), 0);
  document.getElementById('dash-total-sales').innerText = 'Rs. ' + totalSales.toLocaleString('en-PK', { minimumFractionDigits: 2 });

  const gulzarBal = gulzarData.reduce((s, x) => s + x.credit - x.debit, 0);
  const kashifBal = kashifData.reduce((s, x) => s + x.credit - x.debit, 0);
  document.getElementById('dash-outstanding').innerText = 'Rs. ' + (gulzarBal + kashifBal).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  document.getElementById('dash-rates').innerText = storeRates.length;

  const recent = [...invoices].reverse().slice(0, 5);
  const tbody = document.getElementById('dash-recent-inv');
  tbody.innerHTML = recent.length === 0
    ? '<tr class="no-data"><td colspan="4">No invoices found</td></tr>'
    : recent.map(i => `<tr><td>${i.invoiceNo}</td><td>${i.storeName || i.customerName || '-'}</td><td>${i.date}</td><td>Rs. ${parseFloat(i.finalTotal).toLocaleString()}</td></tr>`).join('');
}

// ============================================================
// STORE RATES
// ============================================================
function toggleRatesVisibility() {
  ratesVisible = !ratesVisible;
  document.getElementById('rates-list-container').style.display = ratesVisible ? 'block' : 'none';
  document.getElementById('rates-toggle-text').innerText = ratesVisible ? 'Hide' : 'Show';
}

function updateStoreLists() {
  const stores = [...new Set(storeRates.map(r => r.store))];
  document.getElementById('sr-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
  const sel = document.getElementById('sr-filter-store');
  sel.innerHTML = '<option value="">All Stores</option>' + stores.map(s => `<option>${s}</option>`).join('');
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
  const store = document.getElementById('sr-store').value.trim();
  const barcode = document.getElementById('sr-barcode').value.trim();
  const item = document.getElementById('sr-item').value.trim() || PRODUCTS[barcode] || barcode;
  const rate = parseFloat(document.getElementById('sr-rate').value) || 0;
  if (!store || !barcode || rate <= 0) { showNotification('Store, barcode and rate are required!', 'error'); return; }

  if (editingRateId !== null) {
    const idx = storeRates.findIndex(r => r.id === editingRateId);
    const ok = await sbUpdate('store_rates', 'id', editingRateId, { store, barcode, item, rate });
    if (!ok) return;
    if (idx > -1) storeRates[idx] = { id: editingRateId, store, barcode, item, rate };
    editingRateId = null;
    document.getElementById('sr-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Rate';
    document.getElementById('sr-cancel-btn').style.display = 'none';
    showNotification('Rate updated successfully!');
  } else {
    const existing = storeRates.findIndex(r => r.store === store && r.barcode === barcode);
    if (existing > -1) {
      const id = storeRates[existing].id;
      const ok = await sbUpdate('store_rates', 'id', id, { rate, item });
      if (!ok) return;
      storeRates[existing].rate = rate;
      storeRates[existing].item = item;
      showNotification('Rate updated successfully!');
    } else {
      const id = Date.now();
      const ok = await sbInsert('store_rates', { id, store, barcode, item, rate });
      if (!ok) return;
      storeRates.push({ id, store, barcode, item, rate });
      showNotification('Rate saved successfully!');
    }
  }

  ['sr-store', 'sr-barcode', 'sr-item', 'sr-rate'].forEach(id => document.getElementById(id).value = '');
  renderRatesTable();
  updateStoreLists();
}

function editRate(id) {
  const r = storeRates.find(x => x.id === id);
  if (!r) return;
  document.getElementById('sr-store').value = r.store;
  document.getElementById('sr-barcode').value = r.barcode;
  document.getElementById('sr-item').value = r.item;
  document.getElementById('sr-rate').value = r.rate;
  editingRateId = id;
  document.getElementById('sr-save-btn').innerHTML = '<i class="fas fa-edit"></i> Update Rate';
  document.getElementById('sr-cancel-btn').style.display = '';
  window.scrollTo(0, 0);
}

function cancelRateEdit() {
  editingRateId = null;
  ['sr-store', 'sr-barcode', 'sr-item', 'sr-rate'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('sr-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Rate';
  document.getElementById('sr-cancel-btn').style.display = 'none';
}

async function deleteRate(id) {
  if (!confirm('Delete this rate?')) return;
  const ok = await sbDelete('store_rates', 'id', id);
  if (!ok) return;
  storeRates = storeRates.filter(r => r.id !== id);
  renderRatesTable();
  updateStoreLists();
  showNotification('Rate deleted!');
}

function filterRatesTable(q) {
  const filterStore = document.getElementById('sr-filter-store').value;
  const search = q.toLowerCase();
  document.querySelectorAll('#sr-table-body tr[data-search]').forEach(row => {
    const matchSearch = row.dataset.search.includes(search);
    const matchStore = !filterStore || row.dataset.store === filterStore;
    row.style.display = matchSearch && matchStore ? '' : 'none';
  });
}

function renderRatesTable() {
  const tbody = document.getElementById('sr-table-body');
  if (storeRates.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="5">No rates added yet</td></tr>';
    return;
  }
  tbody.innerHTML = storeRates.map(r => `
    <tr data-search="${(r.store + r.barcode + r.item).toLowerCase()}" data-store="${r.store}">
      <td><span class="badge badge-store">${r.store}</span></td>
      <td style="font-family:monospace;font-size:12px">${r.barcode}</td>
      <td>${r.item}</td>
      <td><strong>Rs. ${r.rate}</strong></td>
      <td>
        <button class="btn btn-edit btn-sm" onclick="editRate(${r.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteRate(${r.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

// ============================================================
// SP BALANCE HELPER
// ============================================================
function getSPBalance(barcode) {
  const totalIn = spInEntries.filter(x => x.barcode === barcode).reduce((s, x) => s + (x.totalPcs || 0), 0);
  const totalOut = spOutEntries.filter(x => x.barcode === barcode).reduce((s, x) => s + (x.qty || 0), 0);
  return totalIn - totalOut;
}

function updateSPBalanceDisplay(row) {
  const bc = row.querySelector('.bc-input')?.value.trim();
  const spBalEl = row.querySelector('.sp-balance-cell');
  if (bc && spBalEl) {
    const bal = getSPBalance(bc);
    spBalEl.textContent = bal;
    spBalEl.className = 'sp-balance-cell ' + (bal > 0 ? 'positive' : bal < 0 ? 'negative' : '');
  }
}

// ============================================================
// DELETE SP ENTRIES BY INVOICE TIMESTAMP
// ============================================================
async function deleteSPOutByInvoice(timestamp) {
  // Delete from database
  const { error } = await sb.from('sp_stock_out').delete().eq('invoice_timestamp', timestamp);
  if (error) {
    console.error('Delete SP error:', error);
    showNotification('Failed to delete SP entries: ' + error.message, 'error');
    return false;
  }
  // Remove from in-memory
  spOutEntries = spOutEntries.filter(e => e.invoiceTimestamp !== timestamp);
  return true;
}

// ============================================================
// CASH INVOICE - WITH SP INTEGRATION
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
    info.innerHTML = `<span class="badge badge-success"><i class="fas fa-check"></i> ${storeName} — ${storeItems.length} items with rates set</span>`;
    preview.innerHTML = storeItems.map(r => `<div>${r.item}: <strong>Rs. ${r.rate}</strong></div>`).join('');
  } else if (storeName) {
    info.innerHTML = `<span class="badge badge-warn"><i class="fas fa-exclamation-triangle"></i> No rates found for this store — enter manually</span>`;
    preview.innerHTML = '';
  } else {
    info.innerHTML = '<i class="fas fa-store"></i> Enter store name to see rates';
    preview.innerHTML = '';
  }
  document.querySelectorAll('#inv-body tr').forEach(row => {
    const bc = row.querySelector('.bc-input')?.value.trim();
    const rateEl = row.querySelector('.rate-input');
    if (bc && rateEl) {
      const r = getStoreRate(bc, storeName);
      if (r > 0) rateEl.value = r;
    }
    updateSPBalanceDisplay(row);
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
    <td class="sp-balance-cell" style="text-align:center;">0</td>
    <td><button class="btn btn-danger btn-sm" onclick="this.closest('tr').remove();calcInvoice();renumberRows()"><i class="fas fa-times"></i></button></td>
  `;
  tbody.appendChild(tr);
  updateSPBalanceDisplay(tr);
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
  updateSPBalanceDisplay(row);
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
  document.getElementById('inv-disc-label').innerHTML = `Discount (${disc}%):`;
  document.getElementById('inv-final').innerText = 'Rs. ' + final.toFixed(2);
}

function clearInvoiceForm() {
  ['inv-store', 'inv-customer', 'inv-customer-ntn', 'inv-customer-strn', 'inv-customer-address'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('inv-discount').value = '0';
  document.getElementById('inv-body').innerHTML = '';
  document.getElementById('inv-store-info').innerHTML = '<i class="fas fa-store"></i> Enter store name to see rates';
  document.getElementById('inv-store-rate-preview').innerHTML = '';
  calcInvoice();
  addInvoiceRow();
  editingInvTs = null;
  updateInvoiceNumber();
}

async function saveInvoiceNow() {
  const customerName = document.getElementById('inv-customer').value.trim();
  const storeName = document.getElementById('inv-store').value.trim();
  const date = document.getElementById('inv-date').value;
  if (!customerName || !date) { showNotification('Customer name and date are required!', 'error'); return; }

  const items = [];
  document.querySelectorAll('#inv-body tr').forEach(row => {
    const bc = row.querySelector('.bc-input')?.value.trim() || '';
    const item = row.querySelector('.item-input')?.value.trim() || '';
    const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    if (item || bc) items.push({ barcode: bc, item, qty, rate, total: (qty * rate).toFixed(2) });
  });
  if (items.length === 0) { showNotification('No items added!', 'error'); return; }

  // Check SP balance and create SP Stock Out entries
  const spEntries = [];
  let hasError = false;
  for (const item of items) {
    if (item.barcode && item.qty > 0) {
      const bal = getSPBalance(item.barcode);
      if (bal < item.qty) {
        showNotification(`⚠️ Insufficient SP balance for ${item.item || item.barcode}! Available: ${bal}`, 'error');
        hasError = true;
        break;
      }
    }
  }
  if (hasError) return;

  const disc = parseFloat(document.getElementById('inv-discount').value) || 0;
  const sub = items.reduce((s, i) => s + parseFloat(i.total), 0);
  const discAmt = sub * disc / 100;
  const final = sub - discAmt;

  const customerNtn = document.getElementById('inv-customer-ntn').value;
  const customerStrn = document.getElementById('inv-customer-strn').value;
  const customerAddress = document.getElementById('inv-customer-address').value;

  let ts, invoiceNo, isEdit = false;

  if (editingInvTs !== null) {
    // Edit mode: delete existing SP entries for this invoice
    const delOk = await deleteSPOutByInvoice(editingInvTs);
    if (!delOk) return;
    ts = editingInvTs;
    // Update invoice in DB
    const row = {
      store_name: storeName, customer_name: customerName,
      ntn: customerNtn, strn: customerStrn, address: customerAddress,
      date, items,
      discount_percent: disc, sub_total: sub.toFixed(2), discount_amt: discAmt.toFixed(2), final_total: final.toFixed(2)
    };
    const ok = await sbUpdate('invoices', 'timestamp', ts, row);
    if (!ok) return;
    // Update in-memory
    const idx = invoices.findIndex(i => i.timestamp === ts);
    if (idx > -1) {
      invoices[idx] = { ...invoices[idx], storeName, customerName, ntn: customerNtn, strn: customerStrn, address: customerAddress, date, items,
        discountPercent: disc, subTotal: sub.toFixed(2), discountAmt: discAmt.toFixed(2), finalTotal: final.toFixed(2) };
    }
    isEdit = true;
    showNotification('Invoice updated successfully!');
  } else {
    // New invoice
    ts = Date.now();
    invoiceNo = getNextInvoiceNumber();
    const row = {
      timestamp: ts, invoice_no: invoiceNo,
      store_name: storeName, customer_name: customerName,
      ntn: customerNtn, strn: customerStrn, address: customerAddress,
      date, items, discount_percent: disc,
      sub_total: sub.toFixed(2), discount_amt: discAmt.toFixed(2), final_total: final.toFixed(2)
    };
    const ok = await sbInsert('invoices', row);
    if (!ok) return;
    invoices.push({
      invoiceNo, timestamp: ts, storeName, customerName,
      ntn: customerNtn, strn: customerStrn, address: customerAddress,
      date, items,
      discountPercent: disc, subTotal: sub.toFixed(2), discountAmt: discAmt.toFixed(2), finalTotal: final.toFixed(2)
    });
    showNotification('Invoice saved!');
  }

  // Create new SP Stock Out entries for this invoice
  for (const item of items) {
    if (item.barcode && item.qty > 0) {
      const srNo = Date.now() + Math.floor(Math.random() * 1000) + items.indexOf(item);
      const spRow = {
        sr_no: srNo,
        date: date,
        store: storeName || customerName,
        barcode: item.barcode,
        item_name: item.item || PRODUCTS[item.barcode] || item.barcode,
        qty: item.qty,
        price: item.rate,
        total: item.qty * item.rate,
        invoice_timestamp: ts
      };
      const ok = await sbInsert('sp_stock_out', spRow);
      if (!ok) { showNotification('Failed to create SP entry!', 'error'); return; }
      spOutEntries.push({
        srNo: srNo,
        date: date,
        store: spRow.store,
        barcode: spRow.barcode,
        itemName: spRow.item_name,
        qty: spRow.qty,
        price: spRow.price,
        total: spRow.total,
        invoiceTimestamp: ts
      });
    }
  }

  if (!isEdit) updateInvoiceNumber();
  clearInvoiceForm();
  loadDashboard();
}

// ============================================================
// INVOICE PRINT - Professional Cash Invoice Style
// ============================================================
function printCurrentInvoice() {
  const customerName = document.getElementById('inv-customer').value || 'Walk-in Customer';
  const storeName = document.getElementById('inv-store').value || '';
  const date = document.getElementById('inv-date').value;
  const disc = parseFloat(document.getElementById('inv-discount').value) || 0;
  const customerNtn = document.getElementById('inv-customer-ntn').value || '';
  const customerStrn = document.getElementById('inv-customer-strn').value || '';
  const customerAddress = document.getElementById('inv-customer-address').value || '';
  
  let sub = 0, rows = '';
  document.querySelectorAll('#inv-body tr').forEach((row, i) => {
    const bc = row.querySelector('.bc-input')?.value || '';
    const item = row.querySelector('.item-input')?.value || '';
    const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
    const tot = qty * rate;
    sub += tot;
    rows += `<tr><td style="text-align:center;">${i+1}</td><td>${bc}</td><td>${item}</td><td style="text-align:center;">${qty}</td><td style="text-align:right;">${rate.toFixed(2)}</td><td style="text-align:right;">${tot.toFixed(2)}</td></tr>`;
  });
  const discAmt = sub * disc / 100;
  const final = sub - discAmt;
  const invoiceNo = document.getElementById('invoice-number-display').innerText || 'INV-001';

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>KRT TRADERS - Cash Invoice</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; margin: 20px; background: #fff; color: #1a1a2e; }
    .invoice-wrapper { max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #22c99a; margin-bottom: 16px; flex-wrap: wrap; }
    .company { flex: 1; }
    .company h1 { font-size: 26px; color: #22c99a; font-weight: 800; letter-spacing: 1px; }
    .company .sub-title { font-size: 13px; color: #555; font-weight: 600; margin-top: 2px; }
    .company-details { font-size: 10px; color: #666; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px; }
    .company-details span { background: #f5f5f5; padding: 2px 10px; border-radius: 4px; }
    .inv-number { text-align: right; background: #f8f9fa; padding: 8px 16px; border-radius: 8px; border: 1px solid #e0e0e0; min-width: 140px; }
    .inv-number label { font-size: 10px; color: #888; font-weight: 600; display: block; }
    .inv-number .num { font-size: 22px; font-weight: 800; color: #22c99a; }
    .info-table { width: 100%; margin: 10px 0 14px; border: none; background: #f8f9fa; border-radius: 6px; padding: 10px 12px; }
    .info-table td { border: none; padding: 4px 8px; font-size: 11px; }
    .info-table .label { font-weight: 600; color: #666; width: 80px; display: inline-block; }
    .info-table .row { display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .info-table .row-item { display: flex; align-items: center; gap: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #22c99a; color: #fff; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e8e8e8; }
    tr:last-child td { border-bottom: none; }
    .totals { width: 280px; float: right; margin-top: 12px; background: #f8f9fa; padding: 14px 18px; border-radius: 8px; border: 1px solid #e8e8e8; }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
    .totals .final { font-size: 17px; font-weight: 800; border-top: 2px solid #22c99a; padding-top: 8px; margin-top: 4px; color: #22c99a; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 12px; clear: both; }
    @media print { body { margin: 10px; } th { background: #22c99a !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="header">
    <div class="company">
      <h1>KRT TRADERS</h1>
      <div class="sub-title">CASH INVOICE</div>
      <div class="company-details">
        <span><strong>NTN:</strong> 1234567-8</span>
        <span><strong>STRN:</strong> 9876543-2</span>
        <span><strong>Contact:</strong> +92 300 1234567</span>
        <span><strong>Address:</strong> Lahore, Pakistan</span>
      </div>
    </div>
    <div class="inv-number">
      <label>INVOICE #</label>
      <div class="num">${invoiceNo}</div>
    </div>
  </div>

  <div class="info-table">
    <div class="row">
      <div class="row-item"><span class="label">Customer:</span> <strong>${customerName}</strong></div>
      ${storeName ? `<div class="row-item"><span class="label">Store:</span> ${storeName}</div>` : ''}
      <div class="row-item"><span class="label">Date:</span> ${date || new Date().toISOString().split('T')[0]}</div>
    </div>
    ${customerAddress ? `<div class="row"><span class="label">Address:</span> ${customerAddress}</div>` : ''}
    ${customerNtn || customerStrn ? `<div class="row"><span class="label">Tax:</span> ${customerNtn ? 'NTN: '+customerNtn : ''} ${customerStrn ? 'STRN: '+customerStrn : ''}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:40px;text-align:center;">#</th>
        <th style="text-align:left;">Barcode</th>
        <th style="text-align:left;">Item Description</th>
        <th style="width:60px;text-align:center;">Qty</th>
        <th style="width:80px;text-align:right;">Rate</th>
        <th style="width:100px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sub Total:</span><span>Rs. ${sub.toFixed(2)}</span></div>
    <div class="row"><span>Discount (${disc}%):</span><span style="color:#e74c3c;">- Rs. ${discAmt.toFixed(2)}</span></div>
    <div class="row final"><span>FINAL TOTAL:</span><span>Rs. ${final.toFixed(2)}</span></div>
  </div>

  <div class="footer">Thank you for your business! — Goods once sold cannot be returned.</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
</body>
</html>`);
}

// ============================================================
// INVOICE HISTORY
// ============================================================
function renderInvoiceHistory() {
  const from = document.getElementById('inv-hist-from').value;
  const to = document.getElementById('inv-hist-to').value;
  let list = [...invoices].reverse();
  if (from) list = list.filter(i => i.date >= from);
  if (to) list = list.filter(i => i.date <= to);

  const tbody = document.getElementById('inv-history-body');
  tbody.innerHTML = list.length === 0
    ? '<tr class="no-data"><td colspan="7">No invoices found</td></tr>'
    : list.map(i => `
      <tr>
        <td style="font-family:monospace;font-size:12px">${i.invoiceNo}</td>
        <td>${i.storeName || '-'}</td>
        <td>${i.customerName || '-'}</td>
        <td>${i.date}</td>
        <td>${(i.items || []).length} items</td>
        <td><strong>Rs. ${parseFloat(i.finalTotal).toLocaleString()}</strong></td>
        <td class="action-cell" style="white-space:nowrap">
          <button class="btn btn-outline btn-sm" onclick="viewInvModal(${i.timestamp})"><i class="fas fa-eye"></i></button>
          <button class="btn btn-edit btn-sm" onclick="loadInvToForm(${i.timestamp})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-print btn-sm" onclick="printInvoiceByTs(${i.timestamp})"><i class="fas fa-print"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteInvoice(${i.timestamp})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
}

function clearInvoiceHistoryFilter() {
  document.getElementById('inv-hist-from').value = '';
  document.getElementById('inv-hist-to').value = '';
  renderInvoiceHistory();
}

function exportInvoiceHistory() {
  const from = document.getElementById('inv-hist-from').value;
  const to = document.getElementById('inv-hist-to').value;
  let list = [...invoices].reverse();
  if (from) list = list.filter(i => i.date >= from);
  if (to) list = list.filter(i => i.date <= to);

  let text = 'Invoice #,Store,Customer,Date,Items,Total\n';
  list.forEach(i => {
    text += `${i.invoiceNo},${i.storeName || ''},${i.customerName || ''},${i.date},${(i.items || []).length},${i.finalTotal}\n`;
  });
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function printInvoiceByTs(ts) {
  const inv = invoices.find(i => i.timestamp === ts);
  if (!inv) return;
  let sub = 0;
  const rows = (inv.items || []).map((item, i) => {
    const t = parseFloat(item.total || 0);
    sub += t;
    return `<tr><td style="text-align:center;">${i+1}</td><td>${item.barcode || '-'}</td><td>${item.item || '-'}</td><td style="text-align:center;">${item.qty}</td><td style="text-align:right;">${parseFloat(item.rate).toFixed(2)}</td><td style="text-align:right;">${t.toFixed(2)}</td></tr>`;
  }).join('');
  const disc = parseFloat(inv.discountPercent || 0);
  const discAmt = parseFloat(inv.discountAmt || 0);
  const final = parseFloat(inv.finalTotal || 0);
  
  const w = window.open('', '_blank');
  const invoiceNo = inv.invoiceNo || 'INV-001';
  const customerName = inv.customerName || 'Walk-in Customer';
  const storeName = inv.storeName || '';
  const date = inv.date || '';
  const address = inv.address || '';
  const ntn = inv.ntn || '';
  const strn = inv.strn || '';

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>KRT TRADERS - ${invoiceNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; margin: 20px; background: #fff; color: #1a1a2e; }
    .invoice-wrapper { max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 3px solid #22c99a; margin-bottom: 16px; flex-wrap: wrap; }
    .company h1 { font-size: 26px; color: #22c99a; font-weight: 800; letter-spacing: 1px; }
    .company .sub-title { font-size: 13px; color: #555; font-weight: 600; margin-top: 2px; }
    .company-details { font-size: 10px; color: #666; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 12px; }
    .company-details span { background: #f5f5f5; padding: 2px 10px; border-radius: 4px; }
    .inv-number { text-align: right; background: #f8f9fa; padding: 8px 16px; border-radius: 8px; border: 1px solid #e0e0e0; }
    .inv-number label { font-size: 10px; color: #888; font-weight: 600; display: block; }
    .inv-number .num { font-size: 22px; font-weight: 800; color: #22c99a; }
    .info-table { width: 100%; margin: 10px 0 14px; border: none; background: #f8f9fa; border-radius: 6px; padding: 10px 12px; }
    .info-table td { border: none; padding: 4px 8px; font-size: 11px; }
    .info-table .label { font-weight: 600; color: #666; width: 80px; display: inline-block; }
    .info-table .row { display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .info-table .row-item { display: flex; align-items: center; gap: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #22c99a; color: #fff; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e8e8e8; }
    tr:last-child td { border-bottom: none; }
    .totals { width: 280px; float: right; margin-top: 12px; background: #f8f9fa; padding: 14px 18px; border-radius: 8px; border: 1px solid #e8e8e8; }
    .totals .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
    .totals .final { font-size: 17px; font-weight: 800; border-top: 2px solid #22c99a; padding-top: 8px; margin-top: 4px; color: #22c99a; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 12px; clear: both; }
    @media print { body { margin: 10px; } th { background: #22c99a !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="header">
    <div class="company">
      <h1>KRT TRADERS</h1>
      <div class="sub-title">CASH INVOICE</div>
      <div class="company-details">
        <span><strong>NTN:</strong> 1234567-8</span>
        <span><strong>STRN:</strong> 9876543-2</span>
        <span><strong>Contact:</strong> +92 300 1234567</span>
        <span><strong>Address:</strong> Lahore, Pakistan</span>
      </div>
    </div>
    <div class="inv-number">
      <label>INVOICE #</label>
      <div class="num">${invoiceNo}</div>
    </div>
  </div>

  <div class="info-table">
    <div class="row">
      <div class="row-item"><span class="label">Customer:</span> <strong>${customerName}</strong></div>
      ${storeName ? `<div class="row-item"><span class="label">Store:</span> ${storeName}</div>` : ''}
      <div class="row-item"><span class="label">Date:</span> ${date}</div>
    </div>
    ${address ? `<div class="row"><span class="label">Address:</span> ${address}</div>` : ''}
    ${ntn || strn ? `<div class="row"><span class="label">Tax:</span> ${ntn ? 'NTN: '+ntn : ''} ${strn ? 'STRN: '+strn : ''}</div>` : ''}
  </div>

  <table>
    <thead><tr><th style="width:40px;text-align:center;">#</th><th style="text-align:left;">Barcode</th><th style="text-align:left;">Item</th><th style="width:60px;text-align:center;">Qty</th><th style="width:80px;text-align:right;">Rate</th><th style="width:100px;text-align:right;">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sub Total:</span><span>Rs. ${sub.toFixed(2)}</span></div>
    <div class="row"><span>Discount (${disc}%):</span><span style="color:#e74c3c;">- Rs. ${discAmt.toFixed(2)}</span></div>
    <div class="row final"><span>FINAL TOTAL:</span><span>Rs. ${final.toFixed(2)}</span></div>
  </div>

  <div class="footer">Thank you for your business! — Goods once sold cannot be returned.</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
</body>
</html>`);
}

function viewInvModal(ts) {
  const inv = invoices.find(i => i.timestamp === ts);
  if (!inv) { showNotification('Invoice not found!', 'error'); return; }
  let rows = (inv.items || []).map((item, i) => `
    <tr><td>${i+1}</td><td style="font-family:monospace;font-size:12px">${item.barcode || '-'}</td>
    <td>${item.item || '-'}</td><td>${item.qty}</td><td>Rs. ${parseFloat(item.rate).toFixed(2)}</td>
    <td>Rs. ${parseFloat(item.total).toFixed(2)}</td></tr>`).join('');
  document.getElementById('inv-modal-body').innerHTML = `
    <div class="grid-2" style="margin-bottom:12px">
      <div><label>Invoice #</label><strong>${inv.invoiceNo}</strong></div>
      <div><label>Date</label>${inv.date}</div>
      <div><label>Customer</label><strong>${inv.customerName || '-'}</strong></div>
      <div><label>Store</label>${inv.storeName || '-'}</div>
      <div><label>NTN</label>${inv.ntn || '-'}</div>
      <div><label>STRN</label>${inv.strn || '-'}</div>
      <div><label>Address</label>${inv.address || '-'}</div>
    </div>
    <div class="table-wrap">
      <table><thead><tr><th>#</th><th>Barcode</th><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>
    <div style="margin-top:12px;text-align:right">
      <div>Sub Total: Rs. ${parseFloat(inv.subTotal || 0).toFixed(2)}</div>
      <div>Discount (${inv.discountPercent || 0}%): - Rs. ${parseFloat(inv.discountAmt || 0).toFixed(2)}</div>
      <div><strong>Final: Rs. ${parseFloat(inv.finalTotal).toFixed(2)}</strong></div>
    </div>`;
  document.getElementById('modal-del-btn').onclick = () => { deleteInvoice(ts);
    closeInvModal(); };
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
  document.getElementById('inv-customer').value = inv.customerName || '';
  document.getElementById('inv-store').value = inv.storeName || '';
  document.getElementById('inv-customer-ntn').value = inv.ntn || '';
  document.getElementById('inv-customer-strn').value = inv.strn || '';
  document.getElementById('inv-customer-address').value = inv.address || '';
  document.getElementById('inv-date').value = inv.date || '';
  document.getElementById('inv-discount').value = inv.discountPercent || 0;
  onInvStoreChange(inv.storeName || '');
  document.getElementById('inv-body').innerHTML = '';
  (inv.items || []).forEach(item => {
    addInvoiceRow();
    const row = document.querySelector('#inv-body tr:last-child');
    row.querySelector('.bc-input').value = item.barcode || '';
    row.querySelector('.item-input').value = item.item || '';
    row.querySelector('.qty-input').value = item.qty || 1;
    row.querySelector('.rate-input').value = item.rate || 0;
    updateSPBalanceDisplay(row);
  });
  calcInvoice();
  editingInvTs = ts;
  updateInvoiceNumber();
}

function closeInvModal() {
  document.getElementById('inv-modal').classList.remove('open');
}

function printModal() {
  printInvoiceByTs(window._modalInvTs);
}

async function deleteInvoice(ts) {
  if (!confirm('Delete this invoice?')) return;
  // Delete associated SP Stock Out entries
  const delOk = await deleteSPOutByInvoice(ts);
  if (!delOk) return;
  // Delete the invoice itself
  const ok = await sbDelete('invoices', 'timestamp', ts);
  if (!ok) return;
  invoices = invoices.filter(i => i.timestamp !== ts);
  renderInvoiceHistory();
  loadDashboard();
  showNotification('Invoice and associated SP entries deleted!');
}

// ============================================================
// STOCK IN, STOCK OUT, STOCK BALANCE (unchanged)
// ============================================================
function inBarcodeInput() {
  const bc = document.getElementById('in-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('in-item').value = PRODUCTS[bc];
}

async function saveStockIn() {
  const itemName = document.getElementById('in-item').value.trim();
  const qty = parseFloat(document.getElementById('in-qty').value) || 0;
  const price = parseFloat(document.getElementById('in-price').value) || 0;
  const vendor = document.getElementById('in-vendor').value || 'N/A';
  const barcode = document.getElementById('in-barcode').value || 'N/A';
  const date = document.getElementById('in-date').value;
  if (!itemName || qty <= 0) { showNotification('Item name and quantity are required!', 'error'); return; }

  if (editingStockInId !== null) {
    const idx = stockInEntries.findIndex(e => e.srNo === editingStockInId);
    const row = { date, vendor, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbUpdate('stock_in', 'sr_no', editingStockInId, row);
    if (!ok) return;
    if (idx > -1) stockInEntries[idx] = { srNo: editingStockInId, date, vendor, itemName, barcode, qty, price, total: qty * price };
    editingStockInId = null;
    document.querySelector('#page-stock-in .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock In';
    showNotification('Stock In updated!');
  } else {
    const srNo = Date.now();
    const row = { sr_no: srNo, date, vendor, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbInsert('stock_in', row);
    if (!ok) return;
    stockInEntries.push({ srNo, date, vendor, itemName, barcode, qty, price, total: qty * price });
    showNotification('Stock In saved!');
  }

  renderStockInTable();
  ['in-item', 'in-barcode', 'in-qty', 'in-price', 'in-vendor'].forEach(id => document.getElementById(id).value = '');
}

function renderStockInTable() {
  const tbody = document.getElementById('stock-in-table');
  if (stockInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="8">No entries found</td></tr>';
    return;
  }
  tbody.innerHTML = [...stockInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date || '-'}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span>${d.barcode && d.barcode !== 'N/A' ? `<span class="stock-item-sub">${d.barcode}</span>` : ''}</div></td>
      <td>${d.vendor}</td>
      <td><span class="qty-pill">${d.qty}</span></td>
      <td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td>
        <button class="btn btn-edit btn-sm" onclick="editStockIn(${d.srNo})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-print btn-sm" onclick="printStockEntry('in',${d.srNo})"><i class="fas fa-print"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteStockIn(${d.srNo})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function editStockIn(srNo) {
  const d = stockInEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('stock-in', 'Stock In');
  document.getElementById('in-date').value = d.date || '';
  document.getElementById('in-vendor').value = d.vendor || '';
  document.getElementById('in-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('in-item').value = d.itemName;
  document.getElementById('in-qty').value = d.qty;
  document.getElementById('in-price').value = d.price;
  editingStockInId = srNo;
  document.querySelector('#page-stock-in .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock In';
  window.scrollTo(0, 0);
}

async function deleteStockIn(srNo) {
  if (!confirm('Delete this entry?')) return;
  const ok = await sbDelete('stock_in', 'sr_no', srNo);
  if (!ok) return;
  stockInEntries = stockInEntries.filter(e => e.srNo !== srNo);
  renderStockInTable();
  showNotification('Entry deleted!');
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
  th,td{border:1px solid #000;padding:6px 8px}th{background:#f0f0f0}h2,h4{text-align:center;margin:3px}
  .info-table{border:none;margin-top:8px}td.info-label{border:none;width:110px;font-weight:bold}td.info-val{border:none}</style></head><body>
  <h2>KRT TRADERS</h2><h4>${title}</h4>
  <table class="info-table">
    <tr><td class="info-label">Date:</td><td class="info-val">${d.date || '-'}</td></tr>
    <tr><td class="info-label">${partyLabel}:</td><td class="info-val">${party || '-'}</td></tr>
    <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
    <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode && d.barcode !== 'N/A' ? d.barcode : '-'}</td></tr>
  </table>
  <table><thead><tr><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
  <tbody><tr><td>${d.qty}</td><td>Rs. ${d.price}</td><td>Rs. ${d.total}</td></tr></tbody></table>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
}

function outBarcodeInput() {
  const bc = document.getElementById('out-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('out-item').value = PRODUCTS[bc];
}

function getBalance(itemName) {
  const inn = stockInEntries.filter(x => x.itemName === itemName).reduce((s, x) => s + Number(x.qty), 0);
  const out = stockOutEntries.filter(x => x.itemName === itemName).reduce((s, x) => s + Number(x.qty), 0);
  return inn - out;
}

async function saveStockOut() {
  const itemName = document.getElementById('out-item').value.trim();
  const qty = parseFloat(document.getElementById('out-qty').value) || 0;
  const price = parseFloat(document.getElementById('out-price').value) || 0;
  const customer = document.getElementById('out-customer').value.trim();
  const barcode = document.getElementById('out-barcode').value || 'N/A';
  const date = document.getElementById('out-date').value;
  if (!itemName || !customer || qty <= 0) { showNotification('Customer, item and quantity are required!', 'error'); return; }

  if (editingStockOutId !== null) {
    const idx = stockOutEntries.findIndex(e => e.srNo === editingStockOutId);
    const row = { date, customer, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbUpdate('stock_out', 'sr_no', editingStockOutId, row);
    if (!ok) return;
    if (idx > -1) stockOutEntries[idx] = { srNo: editingStockOutId, date, customer, itemName, barcode, qty, price, total: qty * price };
    editingStockOutId = null;
    document.querySelector('#page-stock-out .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock Out';
    showNotification('Stock Out updated!');
  } else {
    const bal = getBalance(itemName);
    if (qty > bal) { if (!confirm(`Stock is low! Available: ${bal}. Still save?`)) return; }
    const srNo = Date.now();
    const row = { sr_no: srNo, date, customer, item_name: itemName, barcode, qty, price, total: qty * price };
    const ok = await sbInsert('stock_out', row);
    if (!ok) return;
    stockOutEntries.push({ srNo, date, customer, itemName, barcode, qty, price, total: qty * price });
    showNotification('Stock Out saved!');
  }

  renderStockOutTable();
  ['out-item', 'out-barcode', 'out-qty', 'out-price', 'out-customer'].forEach(id => document.getElementById(id).value = '');
}

function renderStockOutTable() {
  const tbody = document.getElementById('stock-out-table');
  if (stockOutEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="8">No entries found</td></tr>';
    return;
  }
  tbody.innerHTML = [...stockOutEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date || '-'}</td><td>${d.customer}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span>${d.barcode && d.barcode !== 'N/A' ? `<span class="stock-item-sub">${d.barcode}</span>` : ''}</div></td>
      <td><span class="qty-pill">${d.qty}</span></td>
      <td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td>
        <button class="btn btn-edit btn-sm" onclick="editStockOut(${d.srNo})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-print btn-sm" onclick="printStockEntry('out',${d.srNo})"><i class="fas fa-print"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteStockOut(${d.srNo})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function editStockOut(srNo) {
  const d = stockOutEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('stock-out', 'Stock Out');
  document.getElementById('out-date').value = d.date || '';
  document.getElementById('out-customer').value = d.customer || '';
  document.getElementById('out-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('out-item').value = d.itemName;
  document.getElementById('out-qty').value = d.qty;
  document.getElementById('out-price').value = d.price;
  editingStockOutId = srNo;
  document.querySelector('#page-stock-out .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock Out';
  window.scrollTo(0, 0);
}

async function deleteStockOut(srNo) {
  if (!confirm('Delete this entry?')) return;
  const ok = await sbDelete('stock_out', 'sr_no', srNo);
  if (!ok) return;
  stockOutEntries = stockOutEntries.filter(e => e.srNo !== srNo);
  renderStockOutTable();
  showNotification('Entry deleted!');
}

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
    ? '<tr class="no-data"><td colspan="5">No stock found</td></tr>'
    : vals.map(x => {
      const bal = x.totalIn - x.totalOut;
      return `<tr>
          <td style="font-family:monospace;font-size:12px">${x.barcode}</td>
          <td>${x.itemName}</td><td>${x.totalIn}</td><td>${x.totalOut}</td>
          <td><strong style="color:${bal > 0 ? 'var(--primary)' : 'var(--danger)'}">${bal}</strong></td>
        </tr>`;
    }).join('');
}

// ============================================================
// LEDGER (GULZAR / KASHIF) - unchanged
// ============================================================
function getLedgerData(person) { return person === 'gulzar' ? gulzarData : kashifData; }

function setLedgerData(person, data) { if (person === 'gulzar') gulzarData = data;
  else kashifData = data; }

function ledgerTable(person) { return person === 'gulzar' ? 'gulzar_ledger' : 'kashif_ledger'; }

function todayStr() { return new Date().toISOString().split('T')[0]; }

async function addLedgerEntry(person) {
  const date = document.getElementById(person + '-date').value;
  if (!date) { showNotification('Date is required!', 'error'); return; }
  const credit = parseFloat(document.getElementById(person + '-credit').value) || 0;
  const debit = parseFloat(document.getElementById(person + '-debit').value) || 0;
  const note = document.getElementById(person + '-note').value || '';

  if (editingLedgerId[person] !== null) {
    const id = editingLedgerId[person];
    const ok = await sbUpdate(ledgerTable(person), 'id', id, { date, credit, debit, note });
    if (!ok) return;
    const data = getLedgerData(person);
    const idx = data.findIndex(x => x.id === id);
    if (idx > -1) data[idx] = { id, date, credit, debit, note };
    setLedgerData(person, data);
    editingLedgerId[person] = null;
    document.querySelector(`#page-${person} .btn-primary`).innerHTML = '<i class="fas fa-save"></i> Save Entry';
    showNotification('Entry updated!');
  } else {
    const id = Date.now();
    const ok = await sbInsert(ledgerTable(person), { id, date, credit, debit, note });
    if (!ok) return;
    const data = getLedgerData(person);
    data.push({ id, date, credit, debit, note });
    setLedgerData(person, data);
    showNotification('Entry saved!');
  }

  [person + '-credit', person + '-debit', person + '-note'].forEach(id => document.getElementById(id).value = '');
  renderLedgerPage(person);
}

function editLedgerEntry(person, id) {
  const data = getLedgerData(person);
  const x = data.find(e => e.id === id);
  if (!x) return;
  document.getElementById(person + '-date').value = x.date;
  document.getElementById(person + '-credit').value = x.credit;
  document.getElementById(person + '-debit').value = x.debit;
  document.getElementById(person + '-note').value = x.note;
  editingLedgerId[person] = id;
  document.querySelector(`#page-${person} .btn-primary`).innerHTML = '<i class="fas fa-edit"></i> Update Entry';
  window.scrollTo(0, 0);
}

async function deleteLedgerEntry(person, id) {
  if (!confirm('Delete this entry?')) return;
  const ok = await sbDelete(ledgerTable(person), 'id', id);
  if (!ok) return;
  setLedgerData(person, getLedgerData(person).filter(x => x.id !== id));
  renderLedgerPage(person);
  showNotification('Entry deleted!');
}

function printLedger(person) {
  const data = getLedgerData(person);
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const withBalance = sorted.map(x => { running += x.credit - x.debit; return { ...x, balance: running }; });
  const name = person === 'gulzar' ? 'Gulzar Bhai' : 'Kashif Bhai';
  const rows = withBalance.map(x => `<tr><td>${x.date}</td><td>${x.credit}</td><td>${x.debit}</td><td>${x.balance}</td><td>${x.note || ''}</td></tr>`).join('');
  const totalCredit = data.reduce((s, x) => s + x.credit, 0);
  const totalDebit = data.reduce((s, x) => s + x.debit, 0);
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${name} Ledger</title>
  <style>body{font-family:Arial;font-size:12px;margin:20px}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #000;padding:5px 7px}th{background:#f0f0f0}h2,h4{text-align:center;margin:3px}</style></head><body>
  <h2>KRT TRADERS</h2><h4>${name} — Ledger Statement</h4>
  <table><thead><tr><th>Date</th><th>Credit</th><th>Debit</th><th>Balance</th><th>Note</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <p><strong>Total Credit:</strong> Rs. ${totalCredit} &nbsp; <strong>Total Debit:</strong> Rs. ${totalDebit} &nbsp; <strong>Net Balance:</strong> Rs. ${totalCredit - totalDebit}</p>
  <script>window.onload=()=>window.print()<\/script></body></html>`);
}

function renderLedgerPage(person) {
  const data = getLedgerData(person);
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  const withBalance = sorted.map(x => { running += x.credit - x.debit; return { ...x, balance: running }; });

  const totalCredit = data.reduce((s, x) => s + x.credit, 0);
  const totalDebit = data.reduce((s, x) => s + x.debit, 0);
  document.getElementById(person + '-total-credit').innerText = 'Rs. ' + totalCredit.toLocaleString();
  document.getElementById(person + '-total-debit').innerText = 'Rs. ' + totalDebit.toLocaleString();
  document.getElementById(person + '-balance').innerText = 'Rs. ' + (totalCredit - totalDebit).toLocaleString();

  const today = todayStr();
  const todayRows = withBalance.filter(x => x.date === today);
  const oldRows = withBalance.filter(x => x.date !== today);

  const renderRows = (rows) => rows.length === 0
    ? '<tr class="no-data"><td colspan="6">No entries found</td></tr>'
    : rows.map(x => `<tr>
        <td>${x.date}</td><td class="text-credit">Rs. ${x.credit}</td>
        <td class="text-debit">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance >= 0 ? 'var(--primary)' : 'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
        <td>
          <button class="btn btn-edit btn-sm" onclick="editLedgerEntry('${person}',${x.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-print btn-sm" onclick="printLedger('${person}')"><i class="fas fa-print"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteLedgerEntry('${person}',${x.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');

  document.getElementById(person + '-today-table').innerHTML = renderRows(todayRows);
  document.getElementById(person + '-history-table').innerHTML = renderRows([...oldRows].reverse());
}

function renderLedgerHistory(person) {
  const from = document.getElementById(person + '-from').value;
  const to = document.getElementById(person + '-to').value;
  const data = getLedgerData(person);
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  let running = 0;
  let withBalance = sorted.map(x => { running += x.credit - x.debit; return { ...x, balance: running }; });

  if (from) withBalance = withBalance.filter(x => x.date >= from);
  if (to) withBalance = withBalance.filter(x => x.date <= to);

  const tbody = document.getElementById(person + '-history-table');
  tbody.innerHTML = withBalance.length === 0
    ? '<tr class="no-data"><td colspan="6">No entries found in this period</td></tr>'
    : [...withBalance].reverse().map(x => `<tr>
        <td>${x.date}</td><td class="text-credit">Rs. ${x.credit}</td>
        <td class="text-debit">Rs. ${x.debit}</td>
        <td><strong style="color:${x.balance >= 0 ? 'var(--primary)' : 'var(--danger)'}">Rs. ${x.balance}</strong></td>
        <td>${x.note}</td>
        <td>
          <button class="btn btn-edit btn-sm" onclick="editLedgerEntry('${person}',${x.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-print btn-sm" onclick="printLedger('${person}')"><i class="fas fa-print"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteLedgerEntry('${person}',${x.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
}

function clearLedgerHistoryFilter(person) {
  document.getElementById(person + '-from').value = '';
  document.getElementById(person + '-to').value = '';
  renderLedgerPage(person);
}

// ============================================================
// SALARY SYSTEM (unchanged)
// ============================================================
function currentMonthStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
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
    tbody.innerHTML = '<tr class="no-data"><td colspan="7">No employees — click "Add Employee"</td></tr>';
  } else {
    tbody.innerHTML = rows.map((r, i) => {
      const balance = (r.salary - r.advance).toFixed(2);
      return `<tr>
        <td>${i+1}</td>
        <td><input type="text" value="${r.name}" oninput="updateSalRow('${month}',${i},'name',this.value)" placeholder="Name"></td>
        <td><input type="number" value="${r.salary}" oninput="updateSalRow('${month}',${i},'salary',this.value)" placeholder="0"></td>
        <td><input type="number" value="${r.advance}" oninput="updateSalRow('${month}',${i},'advance',this.value)" placeholder="0"></td>
        <td class="row-total">Rs. ${balance}</td>
        <td><input type="text" value="${r.note || ''}" oninput="updateSalRow('${month}',${i},'note',this.value)" placeholder="Note"></td>
        <td><button class="btn btn-danger btn-sm" onclick="removeSalRow('${month}',${i})"><i class="fas fa-times"></i></button></td>
      </tr>`;
    }).join('');
  }
  updateSalaryTotals(month);
}

function addSalaryEmployeeRow() {
  const month = document.getElementById('sal-month').value;
  if (!month) { showNotification('Select month first!', 'error'); return; }
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
  const totalSalary = rows.reduce((s, r) => s + (Number(r.salary) || 0), 0);
  const totalAdvance = rows.reduce((s, r) => s + (Number(r.advance) || 0), 0);
  document.getElementById('sal-total-salary').innerText = 'Rs. ' + totalSalary.toLocaleString();
  document.getElementById('sal-total-advance').innerText = 'Rs. ' + totalAdvance.toLocaleString();
}

async function saveSalaryMonth() {
  const month = document.getElementById('sal-month').value;
  if (!month) { showNotification('Select month first!', 'error'); return; }
  const rows = salaryData[month] || [];
  const ok = await sbUpsert('salary_data', { month, rows, updated_at: new Date().toISOString() }, 'month');
  if (!ok) return;
  showNotification('Salary month saved!');
}

function initSalarySheet() {
  const monthInput = document.getElementById('sheet-month');
  if (!monthInput.value) monthInput.value = currentMonthStr();
  renderSalarySheet();
}

function renderSalarySheet() {
  const month = document.getElementById('sheet-month').value;
  const tbody = document.getElementById('sheet-body');
  if (!month) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="6">Select month</td></tr>';
    document.getElementById('sheet-month-label').innerText = 'Select month';
    document.getElementById('sheet-total-salary').innerText = 'Rs. 0';
    document.getElementById('sheet-total-advance').innerText = 'Rs. 0';
    document.getElementById('sheet-total-net').innerText = 'Rs. 0';
    return;
  }
  document.getElementById('sheet-month-label').innerText = month;
  const rows = (salaryData[month] || []).filter(r => r.name && r.name.trim());
  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="6">No data for this month</td></tr>';
  } else {
    tbody.innerHTML = rows.map((r, i) => `<tr>
      <td>${i+1}</td><td><strong>${r.name}</strong></td>
      <td>Rs. ${Number(r.salary).toLocaleString()}</td>
      <td style="color:var(--danger)">Rs. ${Number(r.advance).toLocaleString()}</td>
      <td><strong style="color:var(--primary)">Rs. ${(r.salary - r.advance).toLocaleString()}</strong></td>
      <td>${r.note || ''}</td>
    </tr>`).join('');
  }
  const totalSalary = rows.reduce((s, r) => s + (Number(r.salary) || 0), 0);
  const totalAdvance = rows.reduce((s, r) => s + (Number(r.advance) || 0), 0);
  document.getElementById('sheet-total-salary').innerText = 'Rs. ' + totalSalary.toLocaleString();
  document.getElementById('sheet-total-advance').innerText = 'Rs. ' + totalAdvance.toLocaleString();
  document.getElementById('sheet-total-net').innerText = 'Rs. ' + (totalSalary - totalAdvance).toLocaleString();
}

function printSalarySheet() {
  const el = document.getElementById('page-salary-sheet');
  el.classList.add('printing-sheet');
  window.print();
  setTimeout(() => el.classList.remove('printing-sheet'), 500);
}

function updateHistNameList() {
  const names = new Set();
  Object.values(salaryData).forEach(rows => rows.forEach(r => { if (r.name && r.name.trim()) names.add(r.name.trim()); }));
  document.getElementById('hist-name-list').innerHTML = [...names].map(n => `<option value="${n}">`).join('');
}

function renderSalaryHistory() {
  const name = (document.getElementById('hist-name').value || '').trim().toLowerCase();
  const month = document.getElementById('hist-month').value;
  const tbody = document.getElementById('hist-body');
  if (!name) { tbody.innerHTML = '<tr class="no-data"><td colspan="6">Enter name to search</td></tr>'; return; }

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
    ? '<tr class="no-data"><td colspan="6">No records found</td></tr>'
    : results.sort((a, b) => a.month.localeCompare(b.month)).map(r => `<tr>
        <td>${r.month}</td><td><strong>${r.name}</strong></td>
        <td>Rs. ${Number(r.salary).toLocaleString()}</td>
        <td style="color:var(--danger)">Rs. ${Number(r.advance).toLocaleString()}</td>
        <td><strong style="color:var(--primary)">Rs. ${(r.salary - r.advance).toLocaleString()}</strong></td>
        <td>${r.note || ''}</td>
      </tr>`).join('');
}

// ============================================================
// DAILY REPORT
// ============================================================
function generateReport() {
  const from = document.getElementById('rep-from').value;
  const to = document.getElementById('rep-to').value;
  if (!from || !to) { showNotification('Select both from and to dates!', 'error'); return; }
  const filtIn = stockInEntries.filter(x => x.date >= from && x.date <= to);
  const filtOut = stockOutEntries.filter(x => x.date >= from && x.date <= to);
  const inBody = document.getElementById('rep-in-table');
  const outBody = document.getElementById('rep-out-table');
  inBody.innerHTML = filtIn.length === 0
    ? '<tr class="no-data"><td colspan="5">No purchases in this period</td></tr>'
    : filtIn.map(x => `<tr><td>${x.date}</td><td>${x.itemName}</td><td>${x.vendor || '-'}</td><td>${x.qty}</td><td>Rs. ${x.total}</td></tr>`).join('');
  outBody.innerHTML = filtOut.length === 0
    ? '<tr class="no-data"><td colspan="5">No sales in this period</td></tr>'
    : filtOut.map(x => `<tr><td>${x.date}</td><td>${x.itemName}</td><td>${x.customer || '-'}</td><td>${x.qty}</td><td>Rs. ${x.total}</td></tr>`).join('');
}

// ============================================================
// STORE PREDICTION (GODAM) - updated SP In/Out functions
// ============================================================
function spinBarcodeInput() {
  const bc = document.getElementById('spin-barcode').value.trim();
  if (PRODUCTS[bc]) document.getElementById('spin-item').value = PRODUCTS[bc];
  const last = [...spInEntries].reverse().find(x => x.barcode === bc);
  if (last && !document.getElementById('spin-pcsperctn').value) {
    document.getElementById('spin-pcsperctn').value = last.pcsPerCtn || 0;
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
  const itemName = document.getElementById('spin-item').value.trim();
  const barcode = document.getElementById('spin-barcode').value.trim() || 'N/A';
  const pcsPerCtn = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
  const ctn = parseFloat(document.getElementById('spin-ctn').value) || 0;
  const extra = parseFloat(document.getElementById('spin-extra').value) || 0;
  const price = parseFloat(document.getElementById('spin-price').value) || 0;
  const date = document.getElementById('spin-date').value;
  const vendor = document.getElementById('spin-vendor').value || 'N/A';

  if (!itemName) { showNotification('Item name is required!', 'error'); return; }
  const totalPcs = (ctn * pcsPerCtn) + extra;
  if (totalPcs <= 0) { showNotification('Enter quantity in Ctn or Extra Pcs!', 'error'); return; }
  
  const finalTotalPcs = totalPcs;
  const total = finalTotalPcs * price;

  if (editingSPInId !== null) {
    const idx = spInEntries.findIndex(e => e.srNo === editingSPInId);
    const row = { date, vendor, item_name: itemName, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: finalTotalPcs, price, total };
    const ok = await sbUpdate('sp_stock_in', 'sr_no', editingSPInId, row);
    if (!ok) return;
    if (idx > -1) spInEntries[idx] = { srNo: editingSPInId, date, vendor, itemName, barcode, pcsPerCtn, ctn, extra, totalPcs: finalTotalPcs, price, total };
    editingSPInId = null;
    document.querySelector('#page-sp-in .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock In';
    showNotification('Updated! Total Pcs: ' + finalTotalPcs);
  } else {
    const srNo = Date.now();
    const row = { sr_no: srNo, date, vendor, item_name: itemName, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: finalTotalPcs, price, total };
    const ok = await sbInsert('sp_stock_in', row);
    if (!ok) return;
    spInEntries.push({ srNo, date, vendor, itemName, barcode, pcsPerCtn, ctn, extra, totalPcs: finalTotalPcs, price, total });
    showNotification('Stock In saved! Total Pcs: ' + finalTotalPcs);
  }

  renderSPInTable();
  ['spin-item', 'spin-barcode', 'spin-ctn', 'spin-extra', 'spin-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('spin-pcsperctn').value = '';
  updateSPInPreview();
}

function renderSPInTable() {
  const tbody = document.getElementById('sp-in-table');
  if (spInEntries.length === 0) {
    tbody.innerHTML = '<tr class="no-data"><td colspan="12">No entries found</td></tr>';
    return;
  }
  tbody.innerHTML = [...spInEntries].reverse().map((d, i) => `
    <tr>
      <td>${i+1}</td><td>${d.date || '-'}</td>
      <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span></div></td>
      <td style="font-family:monospace;font-size:12px">${d.barcode}</td>
      <td>${d.vendor}</td><td>${d.ctn}</td><td>${d.extra}</td><td>${d.pcsPerCtn}</td>
      <td><span class="qty-pill">${d.totalPcs}</span></td><td>${d.price}</td>
      <td><span class="total-pill">Rs. ${d.total}</span></td>
      <td>
        <button class="btn btn-edit btn-sm" onclick="editSPIn(${d.srNo})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-print btn-sm" onclick="printSPEntry('in',${d.srNo})"><i class="fas fa-print"></i></button>
        <button class="btn btn-danger btn-sm" onclick="deleteSPIn(${d.srNo})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function editSPIn(srNo) {
  const d = spInEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('sp-in', 'Store Prediction - Stock In');
  document.getElementById('spin-date').value = d.date || '';
  document.getElementById('spin-vendor').value = d.vendor === 'N/A' ? '' : d.vendor;
  document.getElementById('spin-barcode').value = d.barcode === 'N/A' ? '' : d.barcode;
  document.getElementById('spin-item').value = d.itemName;
  document.getElementById('spin-pcsperctn').value = d.pcsPerCtn;
  document.getElementById('spin-ctn').value = d.ctn;
  document.getElementById('spin-extra').value = d.extra;
  document.getElementById('spin-price').value = d.price;
  editingSPInId = srNo;
  document.querySelector('#page-sp-in .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock In';
  updateSPInPreview();
  window.scrollTo(0, 0);
}

async function deleteSPIn(srNo) {
  if (!confirm('Delete this entry?')) return;
  const ok = await sbDelete('sp_stock_in', 'sr_no', srNo);
  if (!ok) return;
  spInEntries = spInEntries.filter(e => e.srNo !== srNo);
  renderSPInTable();
  showNotification('Entry deleted!');
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
      <tr><td class="info-label">Date:</td><td class="info-val">${d.date || '-'}</td></tr>
      <tr><td class="info-label">Vendor:</td><td class="info-val">${d.vendor || '-'}</td></tr>
      <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
      <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode !== 'N/A' ? d.barcode : '-'}</td></tr>
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
      <tr><td class="info-label">Date:</td><td class="info-val">${d.date || '-'}</td></tr>
      <tr><td class="info-label">Store:</td><td class="info-val">${d.store || '-'}</td></tr>
      <tr><td class="info-label">Item:</td><td class="info-val">${d.itemName}</td></tr>
      <tr><td class="info-label">Barcode:</td><td class="info-val">${d.barcode || '-'}</td></tr>
    </table>
    <table><thead><tr><th>Qty (Pcs)</th><th>Price</th><th>Total</th></tr></thead>
    <tbody><tr><td>${d.qty}</td><td>Rs. ${d.price}</td><td>Rs. ${d.total}</td></tr></tbody></table>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
  }
}

function getSPItemByBarcode(bc) {
  return [...spInEntries].reverse().find(x => x.barcode === bc);
}

function getSPBalancePcs(barcode) {
  const totalIn = spInEntries.filter(x => x.barcode === barcode).reduce((s, x) => s + Number(x.totalPcs || 0), 0);
  const totalOut = spOutEntries.filter(x => x.barcode === barcode).reduce((s, x) => s + Number(x.qty || 0), 0);
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
    info.innerHTML = `<span class="badge ${bal > 0 ? 'badge-success' : 'badge-danger'}">Available Balance: ${bal} Pcs (${ctnPart} Ctn + ${pcsPart} Pcs)</span>`;
    if (!document.getElementById('spout-price').value && entry.price) {
      document.getElementById('spout-price').value = entry.price;
    }
  } else if (PRODUCTS[bc]) {
    itemField.value = PRODUCTS[bc];
    info.innerHTML = `<span class="badge badge-warn">⚠ No godam stock found for this barcode</span>`;
  } else {
    itemField.value = '';
    info.innerHTML = bc ? `<span class="badge badge-warn">⚠ Barcode not found in godam</span>` : '';
  }
}

function updateSPStoreList() {
  const stores = [...new Set(spOutEntries.map(x => x.store))];
  document.getElementById('spout-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
}

async function saveSPStockOut() {
  const store = document.getElementById('spout-store').value.trim();
  const barcode = document.getElementById('spout-barcode').value.trim();
  const itemName = document.getElementById('spout-item').value.trim();
  const qty = parseFloat(document.getElementById('spout-qty').value) || 0;
  const price = parseFloat(document.getElementById('spout-price').value) || 0;
  const date = document.getElementById('spout-date').value;
  if (!store || !barcode || !itemName || qty <= 0) { showNotification('Store, barcode and quantity are required!', 'error'); return; }

  if (editingSPOutId !== null) {
    const idx = spOutEntries.findIndex(e => e.srNo === editingSPOutId);
    const row = { date, store, barcode, item_name: itemName, qty, price, total: qty * price };
    const ok = await sbUpdate('sp_stock_out', 'sr_no', editingSPOutId, row);
    if (!ok) return;
    if (idx > -1) spOutEntries[idx] = { srNo: editingSPOutId, date, store, barcode, itemName, qty, price, total: qty * price, invoiceTimestamp: spOutEntries[idx].invoiceTimestamp || null };
    editingSPOutId = null;
    document.querySelector('#page-sp-out .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock Out';
    showNotification('Stock Out updated!');
  } else {
    const bal = getSPBalancePcs(barcode);
    if (qty > bal) { showNotification(`Godam stock is low! Available: ${bal} Pcs`, 'error'); return; }
    const srNo = Date.now();
    const row = { sr_no: srNo, date, store, barcode, item_name: itemName, qty, price, total: qty * price };
    const ok = await sbInsert('sp_stock_out', row);
    if (!ok) return;
    spOutEntries.push({ srNo, date, store, barcode, itemName, qty, price, total: qty * price, invoiceTimestamp: null });
    showNotification('Stock Out saved!');
  }

  renderSPOutTable();
  updateSPStoreList();
  ['spout-barcode', 'spout-item', 'spout-qty', 'spout-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('spout-balance-info').innerHTML = '';
}

function renderSPOutTable() {
  const from = document.getElementById('spout-from')?.value;
  const to = document.getElementById('spout-to')?.value;
  const search = (document.getElementById('spout-search')?.value || '').toLowerCase();
  let list = [...spOutEntries].reverse();
  if (from) list = list.filter(x => x.date >= from);
  if (to) list = list.filter(x => x.date <= to);
  if (search) list = list.filter(x => (x.store + x.itemName + x.barcode).toLowerCase().includes(search));

  const tbody = document.getElementById('sp-out-table');
  tbody.innerHTML = list.length === 0
    ? '<tr class="no-data"><td colspan="11">No entries found</td></tr>'
    : list.map((d, i) => `
      <tr>
        <td>${i+1}</td><td>${d.date || '-'}</td><td><span class="badge badge-store">${d.store}</span></td>
        <td><div class="stock-item-cell"><span class="stock-item-name">${d.itemName}</span></div></td>
        <td style="font-family:monospace;font-size:12px">${d.barcode}</td>
        <td><span class="qty-pill">${d.qty}</span></td><td>${d.price}</td>
        <td><span class="total-pill">Rs. ${d.total}</span></td>
        <td>
          <button class="btn btn-edit btn-sm" onclick="editSPOut(${d.srNo})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-print btn-sm" onclick="printSPEntry('out',${d.srNo})"><i class="fas fa-print"></i></button>
          <button class="btn btn-danger btn-sm" onclick="deleteSPOut(${d.srNo})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('');
}

function editSPOut(srNo) {
  const d = spOutEntries.find(e => e.srNo === srNo);
  if (!d) return;
  showPage('sp-out', 'Store Prediction - Stock Out');
  document.getElementById('spout-date').value = d.date || '';
  document.getElementById('spout-store').value = d.store || '';
  document.getElementById('spout-barcode').value = d.barcode || '';
  document.getElementById('spout-item').value = d.itemName;
  document.getElementById('spout-qty').value = d.qty;
  document.getElementById('spout-price').value = d.price;
  editingSPOutId = srNo;
  document.querySelector('#page-sp-out .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock Out';
  window.scrollTo(0, 0);
}

function clearSPOutFilter() {
  ['spout-from', 'spout-to', 'spout-search'].forEach(id => document.getElementById(id).value = '');
  renderSPOutTable();
}

async function deleteSPOut(srNo) {
  if (!confirm('Delete this entry?')) return;
  const ok = await sbDelete('sp_stock_out', 'sr_no', srNo);
  if (!ok) return;
  spOutEntries = spOutEntries.filter(e => e.srNo !== srNo);
  renderSPOutTable();
  showNotification('Entry deleted!');
}

function printSPOutTable() {
  const from = document.getElementById('spout-from')?.value;
  const to = document.getElementById('spout-to')?.value;
  const search = (document.getElementById('spout-search')?.value || '').toLowerCase();
  let list = [...spOutEntries].reverse();
  if (from) list = list.filter(x => x.date >= from);
  if (to) list = list.filter(x => x.date <= to);
  if (search) list = list.filter(x => (x.store + x.itemName + x.barcode).toLowerCase().includes(search));

  let rows = '';
  list.forEach((d, i) => {
    rows += `<tr><td>${i+1}</td><td>${d.date}</td><td>${d.store}</td><td>${d.itemName}</td><td>${d.barcode}</td><td>${d.qty}</td><td>${d.price}</td><td>${d.total}</td></tr>`;
  });

  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>SP Stock Out Report</title>
  <style>
    body { font-family: Arial; font-size: 12px; margin: 20px; }
    h2 { text-align: center; color: #22c99a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; }
    th { background: #22c99a; color: #fff; }
    @media print { th { background: #22c99a !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h2>KRT TRADERS — SP Stock Out Report</h2>
  <table>
    <thead><tr><th>#</th><th>Date</th><th>Store</th><th>Item</th><th>Barcode</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
</body>
</html>`);
}

function calcSPBalance() {
  const stock = {};
  spInEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0, pcsPerCtn: item.pcsPerCtn || 0 };
    stock[k].totalIn += Number(item.totalPcs) || 0;
    stock[k].pcsPerCtn = item.pcsPerCtn || 0;
  });
  spOutEntries.forEach(item => {
    const k = item.barcode && item.barcode !== 'N/A' ? item.barcode : item.itemName;
    if (!stock[k]) stock[k] = { barcode: item.barcode || '-', itemName: item.itemName, totalIn: 0, totalOut: 0, pcsPerCtn: 0 };
    stock[k].totalOut += Number(item.qty) || 0;
  });
  const tbody = document.getElementById('sp-balance-table');
  const vals = Object.values(stock);
  tbody.innerHTML = vals.length === 0
    ? '<tr class="no-data"><td colspan="6">No stock found</td></tr>'
    : vals.map(x => {
      const bal = x.totalIn - x.totalOut;
      const pcsPerCtn = x.pcsPerCtn || 0;
      const ctnPart = pcsPerCtn > 0 ? Math.floor(bal / pcsPerCtn) : 0;
      const pcsPart = pcsPerCtn > 0 ? bal % pcsPerCtn : bal;
      const ctnDisplay = pcsPerCtn > 0 ? `${ctnPart} Ctn + ${pcsPart} Pcs` : `${bal} Pcs`;
      return `<tr>
          <td style="font-family:monospace;font-size:12px">${x.barcode}</td>
          <td>${x.itemName}</td><td>${x.totalIn}</td><td>${x.totalOut}</td>
          <td><strong style="color:${bal > 0 ? 'var(--primary)' : 'var(--danger)'}">${bal}</strong></td>
          <td>${ctnDisplay}</td>
        </tr>`;
    }).join('');
}
