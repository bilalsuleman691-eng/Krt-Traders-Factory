// ============================================================
// KRT TRADERS ERP - COMPLETE JAVASCRIPT
// Version: 4.3 - FINAL FIXED ALL TOTALS
// ============================================================

// ============================================================
// SUPABASE CONFIG
// ============================================================
const SUPABASE_URL = "https://skuheucjlmuqtdmovugp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ONscpGwZaU3LdZaF_-WgAg_9Fd22Wtf";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIG = {
    APP_PASSWORD: 'admin123',
    TAX_RATE: 18,
    CURRENCY: 'PKR',
    CURRENCY_SYMBOL: 'Rs.'
};

// ============================================================
// PRODUCTS DATABASE
// ============================================================
const PRODUCTS = {
    "6957404902857": "SPONGE SCRUB 2 IN 1",
    "8512532310967": "JUMBO SPIRAL 1 PCS 45 GRAM",
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
    "6267207001641": "REGULAR SPIRAL 2 IN 1",
    "6267207001665": "JUMBO SPIRAL 2 IN 1",
    "230062603912": "REGULAR SPIRAL 1 PCS",
    "6267207001658": "JUMBO SPIRAL 1 PCS",
    "4684000000190": "JUMBO SPIRAL 4 IN 1",
    "4684000000183": "MICRO FIBER CLOTH 4 IN 1",
    "6971432358721": "FANCY NYLON SCRUBBER",
    "4684000000992": "NAIL SAVER 3 IN 1",
    "4684000001005": "LARGE LAMINATE 3 IN 1",
    "925100018864": "SILVER CLASSIC BODY RAZOR",
    "6971432356031": "FANCY HANDLE 3 IN 1 NEW",
    "5321543216365": "BATH BELT NEW",
    "5489754856234": "MICRO FIBER 1 PCS"
};

// ============================================================
// ITEM CATEGORIES
// ============================================================
const ITEM_CATEGORIES = {
    'NAIL SAVER 1 PCS': { category: 'Foam', hsCode: '6805.2000', weight: 5.9 },
    'NAIL SAVER 2 IN 1': { category: 'Foam', hsCode: '6805.2000', weight: 11.8 },
    'REGULAR LAMINATE 1 PCS': { category: 'Foam', hsCode: '6805.2000', weight: 5 },
    'REGULAR LAMINATE 2 IN 1': { category: 'Foam', hsCode: '6805.2000', weight: 10 },
    'LARGE LAMINATE 1 PCS': { category: 'Foam', hsCode: '6805.2000', weight: 6 },
    'LARGE LAMINATE 3 IN 1': { category: 'Foam', hsCode: '6805.2000', weight: 15 },
    'REGULAR PAD 1 PCS': { category: 'Foam', hsCode: '6805.2000', weight: 5 },
    'LARGE PAD 1 PCS': { category: 'Foam', hsCode: '6805.2000', weight: 13 },
    'NAIL SAVER 3 IN 1': { category: 'Foam', hsCode: '6805.2000', weight: 17.7 },
    'REGULAR SPIRAL 1 PCS': { category: 'Steel', hsCode: '7223.0000', weight: 15 },
    'REGULAR SPIRAL 2 IN 1': { category: 'Steel', hsCode: '7223.0000', weight: 30 },
    'JUMBO SPIRAL 1 PCS': { category: 'Steel', hsCode: '7223.0000', weight: 30 },
    'JUMBO SPIRAL 1 PCS 45 GRAM': { category: 'Steel', hsCode: '7223.0000', weight: 45 },
    'JUMBO SPIRAL 2 IN 1': { category: 'Steel', hsCode: '7223.0000', weight: 60 },
    'JUMBO SPIRAL 4 IN 1': { category: 'Steel', hsCode: '7223.0000', weight: 104 },
    'SPONGE SCRUB 2 IN 1': { category: 'Steel', hsCode: '7223.0000', weight: 10 },
    'MICRO FIBER 1 PCS': { category: 'Micro', hsCode: '6307.1030', weight: 0 },
    'MICRO FIBER CLOTH 4 IN 1': { category: 'Micro', hsCode: '6307.1030', weight: 0 },
    'FANCY HANDLE 3 IN 1': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'FANCY HANDLE 3 IN 1 SILVER COLOR': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'FANCY HANDLE 1 PCS': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'FANCY HANDLE 2 IN 1': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'BATH BELT': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'FANCY NYLON SCRUBBER': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'COLOR SPONGE 6 COLOR': { category: 'Fancy', hsCode: '3926.9099', weight: 0 },
    'SILVER CLASSIC BODY RAZOR': { category: 'Razor', hsCode: '8212.9000', weight: 0 }
};

function getItemCategory(itemName) {
    if (!itemName) return { category: 'Fancy', hsCode: '3926.9099', weight: 0 };
    if (ITEM_CATEGORIES[itemName]) return ITEM_CATEGORIES[itemName];
    for (const key of Object.keys(ITEM_CATEGORIES)) {
        if (itemName.includes(key) || key.includes(itemName)) return ITEM_CATEGORIES[key];
    }
    return { category: 'Fancy', hsCode: '3926.9099', weight: 0 };
}

// ============================================================
// STATE
// ============================================================
let storeRates = [], invoices = [], taxInvoices = [], stockIn = [], stockOut = [];
let spStockIn = [], spStockOut = [], gulzarLedger = [], kashifLedger = [], salaryData = {};
let invoiceCounter = 0, editingRateId = null, editingInvoiceTs = null;
let editingStockInId = null, editingStockOutId = null, editingSPInId = null, editingSPOutId = null;
let editingLedgerId = { gulzar: null, kashif: null };
let manualInvoiceNumber = '', currentPage = 'dashboard', chartInstance = null, taxInvoiceData = null;

// ============================================================
// HELPERS
// ============================================================
function setSyncStatus(ok, text) {
    const dot = document.getElementById('sync-dot');
    const txt = document.getElementById('sync-text');
    if (dot) dot.classList.toggle('offline', !ok);
    if (txt) txt.innerText = text;
}

function showNotification(message, type = 'success') {
    const el = document.getElementById('notification');
    if (!el) return;
    el.textContent = message;
    el.className = type + ' show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 3500);
}

function showLoading() { const el = document.getElementById('loading-overlay'); if (el) el.style.display = 'flex'; }
function hideLoading() { const el = document.getElementById('loading-overlay'); if (el) el.style.display = 'none'; }

function getSPBalance(barcode) {
    const totalIn = spStockIn.filter(s => s.barcode === barcode).reduce((sum, s) => sum + (s.totalPcs || 0), 0);
    const totalOut = spStockOut.filter(s => s.barcode === barcode).reduce((sum, s) => sum + (s.qty || 0), 0);
    return totalIn - totalOut;
}

function checkDuplicateInvoice(invoiceNo, excludeId = null) {
    return invoices.find(inv => inv.invoiceNo === invoiceNo && (excludeId === null || inv.id !== excludeId));
}

// ============================================================
// LOAD DATA
// ============================================================
async function loadAllData() {
    try {
        showLoading();
        setSyncStatus(false, 'Loading...');
        const [ratesRes, invRes, taxInvRes, sinRes, soutRes, spinRes, spoutRes, gulRes, kasRes, salRes] = await Promise.all([
            sb.from('store_rates').select('*').order('id'),
            sb.from('invoices').select('*').order('timestamp'),
            sb.from('tax_invoices').select('*').order('timestamp'),
            sb.from('stock_in').select('*').order('sr_no'),
            sb.from('stock_out').select('*').order('sr_no'),
            sb.from('sp_stock_in').select('*').order('sr_no'),
            sb.from('sp_stock_out').select('*').order('sr_no'),
            sb.from('gulzar_ledger').select('*').order('id'),
            sb.from('kashif_ledger').select('*').order('id'),
            sb.from('salary_data').select('*').order('month')
        ]);
        storeRates = (ratesRes.data || []).map(r => ({ id: r.id, store: r.store, barcode: r.barcode, item: r.item, rate: Number(r.rate) }));
        invoices = (invRes.data || []).map(r => ({ 
            id: r.timestamp, invoiceNo: r.invoice_no, customerName: r.customer_name, storeName: r.store_name,
            ntn: r.ntn || '', strn: r.strn || '', address: r.address || '', date: r.date, items: r.items || [],
            discountPercent: Number(r.discount_percent) || 0, discountAmt: parseFloat(r.discount_amt) || 0,
            subtotal: parseFloat(r.sub_total) || 0, grossAmount: parseFloat(r.gross_amount) || 0,
            finalTotal: parseFloat(r.final_total) || 0
        }));
        taxInvoices = (taxInvRes.data || []).map(r => ({
            id: r.timestamp, invoiceNo: r.invoice_no, customerName: r.customer_name, storeName: r.store_name,
            ntn: r.ntn || '', strn: r.strn || '', address: r.address || '', date: r.date, categories: r.categories || [],
            grossAmount: parseFloat(r.gross_amount) || 0, excludingTax: parseFloat(r.excluding_tax) || 0,
            gstAmount: parseFloat(r.gst_amount) || 0, netAmount: parseFloat(r.net_amount) || 0,
            discountPercent: Number(r.discount_percent) || 0, cashInvoiceId: r.cash_invoice_timestamp
        }));
        stockIn = (sinRes.data || []).map(r => ({ id: r.sr_no, date: r.date, vendor: r.vendor, item: r.item_name, barcode: r.barcode, qty: Number(r.qty), price: Number(r.price), total: Number(r.total) }));
        stockOut = (soutRes.data || []).map(r => ({ id: r.sr_no, date: r.date, customer: r.customer, item: r.item_name, barcode: r.barcode, qty: Number(r.qty), price: Number(r.price), total: Number(r.total) }));
        spStockIn = (spinRes.data || []).map(r => ({ id: r.sr_no, date: r.date, vendor: r.vendor, item: r.item_name, barcode: r.barcode, pcsPerCtn: Number(r.pcs_per_ctn) || 0, ctn: Number(r.ctn) || 0, extra: Number(r.extra) || 0, totalPcs: Number(r.total_pcs) || 0, price: Number(r.price) || 0, total: Number(r.total) || 0 }));
        spStockOut = (spoutRes.data || []).map(r => ({ id: r.sr_no, date: r.date, store: r.store, barcode: r.barcode, item: r.item_name, qty: Number(r.qty), price: Number(r.price) || 0, total: Number(r.total) || 0, invoiceTimestamp: r.invoice_timestamp || null }));
        gulzarLedger = (gulRes.data || []).map(r => ({ id: r.id, date: r.date, credit: Number(r.credit), debit: Number(r.debit), note: r.note || '' }));
        kashifLedger = (kasRes.data || []).map(r => ({ id: r.id, date: r.date, credit: Number(r.credit), debit: Number(r.debit), note: r.note || '' }));
        salaryData = {};
        (salRes.data || []).forEach(r => { salaryData[r.month] = r.rows || []; });
        invoiceCounter = invoices.length;
        console.log('✅ Data loaded from Supabase!');
        setSyncStatus(true, 'Synced ✔');
        hideLoading();
        showNotification('Data loaded from Supabase!', 'success');
    } catch (error) {
        console.error('❌ Load error:', error);
        setSyncStatus(false, 'Sync Error');
        hideLoading();
        showNotification('Error loading data: ' + error.message, 'error');
    }
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function login() {
    const pass = document.getElementById('pass').value;
    if (pass === CONFIG.APP_PASSWORD) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('todayDate').textContent = new Date().toLocaleDateString();
        initApp();
    } else {
        document.getElementById('login-error').style.display = 'block';
        setTimeout(() => { document.getElementById('login-error').style.display = 'none'; }, 3000);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) { location.reload(); }
}

// ============================================================
// SIDEBAR & NAVIGATION
// ============================================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('main-content').classList.toggle('expanded');
}

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => {
        const onclick = n.getAttribute('onclick');
        if (onclick && onclick.includes("'" + pageId + "'")) n.classList.add('active');
    });
    const titles = { dashboard: 'Dashboard', 'store-rates': 'Store Rates', 'cash-invoice': 'Cash Invoice', 'tax-invoice': 'Tax Invoice', 'invoice-history': 'Invoice History', 'tax-history': 'Tax History', 'monthly-list': 'Monthly List', 'stock-in': 'Stock In', 'stock-out': 'Stock Out', 'stock-balance': 'Stock Balance', 'sp-in': 'SP Stock In', 'sp-out': 'SP Stock Out', 'sp-balance': 'SP Balance', gulzar: 'Gulzar Ledger', kashif: 'Kashif Ledger', 'salary-entry': 'Salary Entry', 'salary-sheet': 'Salary Sheet', settings: 'Settings' };
    document.getElementById('page-title').innerHTML = (titles[pageId] || pageId) + ' <small>Today: ' + new Date().toLocaleDateString() + '</small>';
    currentPage = pageId;
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'store-rates') renderRates();
    if (pageId === 'cash-invoice') initInvoice();
    if (pageId === 'invoice-history') renderInvoiceHistory();
    if (pageId === 'tax-history') renderTaxHistory();
    if (pageId === 'stock-in') renderStockIn();
    if (pageId === 'stock-out') { updateStockOutDropdown(); renderStockOut(); }
    if (pageId === 'stock-balance') calcBalance();
    if (pageId === 'sp-in') renderSPIn();
    if (pageId === 'sp-out') { updateSPStoreList(); renderSPOut(); }
    if (pageId === 'sp-balance') calcSPBalance();
    if (pageId === 'gulzar' || pageId === 'kashif') loadLedger(pageId);
    if (pageId === 'salary-entry') loadSalaryMonth();
    if (pageId === 'salary-sheet') renderSalarySheet();
    updateBadges();
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    const icon = document.getElementById('theme-icon');
    const headerIcon = document.getElementById('header-theme-icon');
    const text = document.getElementById('theme-text');
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        headerIcon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        headerIcon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
    localStorage.setItem('theme', newTheme);
}

// ============================================================
// INIT APP
// ============================================================
async function initApp() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.getElementById('theme-icon').className = 'fas fa-sun';
        document.getElementById('header-theme-icon').className = 'fas fa-sun';
        document.getElementById('theme-text').textContent = 'Light Mode';
    }
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.stock-date').forEach(el => { if (!el.value) el.value = today; });
    const monthInput = document.getElementById('monthly-month');
    if (monthInput) { const now = new Date(); monthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); }
    const salMonth = document.getElementById('sal-month');
    if (salMonth) { const now = new Date(); salMonth.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); }
    const sheetMonth = document.getElementById('sheet-month');
    if (sheetMonth) { const now = new Date(); sheetMonth.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'); }
    await loadAllData();
    loadDashboard();
    renderRates();
    initInvoice();
    updateBadges();
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() { const el = document.getElementById('header-time'); if (el) el.textContent = new Date().toLocaleTimeString(); }

// ============================================================
// DASHBOARD
// ============================================================
function loadDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayInvs = invoices.filter(i => i.date === today);
    const todaySales = todayInvs.reduce((s, i) => s + (i.grossAmount || 0), 0);
    document.getElementById('dash-today-sales').textContent = 'Rs. ' + todaySales.toFixed(2);
    document.getElementById('dash-sale-count').textContent = todayInvs.length + ' invoices';
    const todayStockIn = stockIn.filter(s => s.date === today);
    const todayPurchase = todayStockIn.reduce((s, x) => s + (x.qty * x.price || 0), 0);
    document.getElementById('dash-today-purchase').textContent = 'Rs. ' + todayPurchase.toFixed(2);
    document.getElementById('dash-purchase-count').textContent = todayStockIn.reduce((s, x) => s + x.qty, 0) + ' items';
    const totalStock = stockIn.reduce((s, x) => s + x.qty, 0) - stockOut.reduce((s, x) => s + x.qty, 0);
    document.getElementById('dash-total-stock').textContent = totalStock;
    const gulzarBal = gulzarLedger.reduce((s, x) => s + x.credit - x.debit, 0);
    const kashifBal = kashifLedger.reduce((s, x) => s + x.credit - x.debit, 0);
    document.getElementById('dash-outstanding').textContent = 'Rs. ' + (gulzarBal + kashifBal).toFixed(2);
    document.getElementById('dash-rates').textContent = storeRates.length;
    const recent = [...invoices].reverse().slice(0, 5);
    const tbody = document.getElementById('dash-recent-inv');
    if (recent.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="4">No invoices found</td></tr>'; } else {
        tbody.innerHTML = recent.map(inv => `<tr><td><strong>${inv.invoiceNo}</strong></td><td>${inv.customerName || '-'}</td><td>${inv.date}</td><td><strong>Rs. ${(inv.grossAmount || 0).toFixed(2)}</strong></td></tr>`).join('');
    }
    document.getElementById('dash-recent-count').textContent = recent.length;
    updateDashboardChart();
}

function updateDashboardChart() {
    const days = parseInt(document.getElementById('chart-period')?.value) || 30;
    const labels = [], data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        labels.push(dateStr.slice(5));
        const dailyTotal = invoices.filter(inv => inv.date === dateStr).reduce((s, inv) => s + (inv.grossAmount || 0), 0);
        data.push(dailyTotal);
    }
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Sales (Rs.)', data, borderColor: '#22c99a', backgroundColor: 'rgba(34,201,154,0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// ============================================================
// STORE RATES - CRUD
// ============================================================
function srBarcodeInput() {
    const bc = document.getElementById('sr-barcode').value.trim();
    if (PRODUCTS[bc]) document.getElementById('sr-item').value = PRODUCTS[bc];
}

async function saveStoreRate() {
    const store = document.getElementById('sr-store').value.trim();
    const barcode = document.getElementById('sr-barcode').value.trim();
    const item = document.getElementById('sr-item').value.trim() || barcode;
    const rate = parseFloat(document.getElementById('sr-rate').value) || 0;
    if (!store || !barcode || rate <= 0) { showNotification('Store, barcode and rate are required!', 'error'); return; }
    if (editingRateId !== null) {
        const { error } = await sb.from('store_rates').update({ store, barcode, item, rate }).eq('id', editingRateId);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = storeRates.findIndex(r => r.id === editingRateId);
        if (idx > -1) storeRates[idx] = { id: editingRateId, store, barcode, item, rate };
        editingRateId = null;
        document.getElementById('sr-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Rate';
        document.getElementById('sr-cancel-btn').style.display = 'none';
        showNotification('Rate updated!', 'success');
    } else {
        const id = Date.now();
        const { error } = await sb.from('store_rates').insert({ id, store, barcode, item, rate });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        storeRates.push({ id, store, barcode, item, rate });
        showNotification('Rate saved!', 'success');
    }
    renderRates();
    clearRateForm();
    updateBadges();
}

function renderRates() {
    const tbody = document.getElementById('sr-table-body');
    if (!tbody) return;
    if (storeRates.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="5">No rates added yet</td></tr>'; } else {
        tbody.innerHTML = storeRates.map(r => `
            <tr data-search="${(r.store + r.barcode + r.item).toLowerCase()}" data-store="${r.store}">
                <td><span class="badge badge-store">${r.store}</span></td>
                <td style="font-family:monospace;font-size:12px">${r.barcode}</td>
                <td>${r.item}</td>
                <td><strong>Rs. ${r.rate}</strong></td>
                <td><button class="btn btn-edit btn-sm" onclick="editRate(${r.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-sm" onclick="deleteRate(${r.id})"><i class="fas fa-trash"></i></button></td>
            </tr>`).join('');
    }
    const stores = [...new Set(storeRates.map(r => r.store))];
    document.getElementById('sr-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
    document.getElementById('inv-store-list').innerHTML = stores.map(s => `<option value="${s}">`).join('');
    const filter = document.getElementById('sr-filter-store');
    if (filter) { const currentVal = filter.value; filter.innerHTML = '<option value="">All Stores</option>' + stores.map(s => `<option value="${s}">${s}</option>`).join(''); filter.value = currentVal; }
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
    document.getElementById('sr-cancel-btn').style.display = 'inline-flex';
    window.scrollTo(0, 0);
}

function cancelRateEdit() { editingRateId = null; clearRateForm(); document.getElementById('sr-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Rate'; document.getElementById('sr-cancel-btn').style.display = 'none'; }

async function deleteRate(id) {
    if (!confirm('Delete this rate?')) return;
    const { error } = await sb.from('store_rates').delete().eq('id', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    storeRates = storeRates.filter(r => r.id !== id);
    renderRates();
    updateBadges();
    showNotification('Rate deleted!', 'success');
}

function clearRateForm() { ['sr-store', 'sr-barcode', 'sr-item', 'sr-rate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

function toggleRatesVisibility() {
    const container = document.getElementById('rates-list-container');
    const text = document.getElementById('rates-toggle-text');
    if (!container) return;
    if (container.style.display === 'none') { container.style.display = 'block'; text.textContent = 'Hide'; } else { container.style.display = 'none'; text.textContent = 'Show'; }
}

function filterRatesTable(search) {
    const filterStore = document.getElementById('sr-filter-store')?.value || '';
    const searchLower = search.toLowerCase();
    document.querySelectorAll('#sr-table-body tr[data-search]').forEach(row => {
        const matchSearch = row.dataset.search.includes(searchLower);
        const matchStore = !filterStore || row.dataset.store === filterStore;
        row.style.display = matchSearch && matchStore ? '' : 'none';
    });
}

function exportRates() {
    if (storeRates.length === 0) { showNotification('No rates to export', 'warning'); return; }
    let csv = 'Store,Barcode,Item,Rate\n';
    storeRates.forEach(r => { csv += `${r.store},${r.barcode},${r.item},${r.rate}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'store_rates.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    showNotification('Export successful!', 'success');
}

// ============================================================
// INVOICE FUNCTIONS
// ============================================================
let invoiceItems = [];

function initInvoice() {
    invoiceItems = [];
    const body = document.getElementById('inv-body');
    if (body) body.innerHTML = '';
    document.getElementById('inv-discount').value = 0;
    document.getElementById('inv-tax-rate').value = 18;
    calcInvoice();
    updateInvoiceNumber();
    const dateInput = document.getElementById('inv-date');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
    editingInvoiceTs = null;
    const cancelBtn = document.getElementById('inv-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    addInvoiceRow();
}

function updateInvoiceNumber() {
    const display = document.getElementById('invoice-number-display');
    const custom = document.getElementById('inv-number')?.value?.trim() || '';
    if (custom) { display.textContent = custom; return; }
    const nextNum = invoices.length + 1;
    display.textContent = 'INV-' + String(nextNum).padStart(3, '0');
}

function updateInvoiceNumberManual(value) { manualInvoiceNumber = value.trim(); updateInvoiceNumber(); }

function addInvoiceRow() {
    const tbody = document.getElementById('inv-body');
    if (!tbody) return;
    const n = tbody.children.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${n}</td><td><input type="text" class="inv-barcode" placeholder="Barcode" onchange="onInvBarcode(this)" style="width:100%;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><input type="text" class="inv-item" placeholder="Item name" style="width:100%;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><input type="number" class="inv-qty" value="1" min="1" oninput="calcInvoice()" style="width:60px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><input type="number" class="inv-rate" placeholder="0.00" step="0.01" oninput="calcInvoice()" style="width:80px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td class="inv-total">Rs. 0.00</td><td><button class="btn btn-danger btn-xs" onclick="removeInvoiceRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(tr);
    calcInvoice();
}

function removeInvoiceRow(btn) {
    const row = btn.closest('tr');
    const tbody = document.getElementById('inv-body');
    if (tbody.children.length <= 1) { showNotification('At least one item is required', 'warning'); return; }
    row.remove();
    document.querySelectorAll('#inv-body tr').forEach((tr, i) => tr.cells[0].textContent = i + 1);
    calcInvoice();
}

function onInvBarcode(input) {
    const bc = input.value.trim();
    const row = input.closest('tr');
    if (PRODUCTS[bc]) row.querySelector('.inv-item').value = PRODUCTS[bc];
    const storeName = document.getElementById('inv-store')?.value?.trim() || '';
    const rate = storeRates.find(r => r.store === storeName && r.barcode === bc);
    if (rate) row.querySelector('.inv-rate').value = rate.rate;
    calcInvoice();
}

function onInvStoreChange(value) {
    const preview = document.getElementById('inv-store-rate-preview');
    const info = document.getElementById('inv-store-info');
    if (!preview || !info) return;
    if (value) {
        const rates = storeRates.filter(r => r.store === value);
        if (rates.length > 0) { info.innerHTML = '<i class="fas fa-check-circle" style="color:#22c99a;"></i> Rates loaded for: <strong>' + value + '</strong>'; preview.innerHTML = rates.map(r => `<span class="badge badge-primary">${r.barcode}: Rs. ${r.rate.toFixed(2)}</span>`).join(' '); } else { info.innerHTML = '<i class="fas fa-store"></i> No rates found for: <strong>' + value + '</strong>'; preview.innerHTML = ''; }
    } else { info.innerHTML = '<i class="fas fa-store"></i> Enter store name to see rates'; preview.innerHTML = ''; }
    calcInvoice();
}

// ============================================================
// CALC INVOICE - FIXED TOTALS
// ============================================================
function calcInvoice() {
    const rows = document.querySelectorAll('#inv-body tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.inv-rate').value) || 0;
        const total = qty * rate;
        row.querySelector('.inv-total').textContent = 'Rs. ' + total.toFixed(2);
        subtotal += total;
    });
    
    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const currency = document.getElementById('inv-currency')?.value || 'PKR';
    const symbol = currency === 'PKR' ? 'Rs.' : currency === 'USD' ? '$' : '€';
    const discountAmt = (subtotal * discount) / 100;
    const grossAmount = subtotal - discountAmt;
    
    // CASH INVOICE - SHOW ALL TOTALS
    document.getElementById('inv-subtotal').textContent = symbol + ' ' + subtotal.toFixed(2);
    document.getElementById('inv-disc-label').textContent = 'Discount (' + discount + '%):';
    document.getElementById('inv-disc-amt').textContent = '- ' + symbol + ' ' + discountAmt.toFixed(2);
    document.getElementById('inv-after-disc').textContent = symbol + ' ' + grossAmount.toFixed(2);
    document.getElementById('inv-final').textContent = symbol + ' ' + grossAmount.toFixed(2);
    
    // CASH INVOICE - HIDE GST
    document.getElementById('inv-excl-tax').textContent = '-';
    document.getElementById('inv-gst').textContent = '-';
}

// ============================================================
// CLEAR INVOICE FORM
// ============================================================
function clearInvoiceForm() {
    ['inv-customer', 'inv-store', 'inv-customer-ntn', 'inv-customer-strn', 'inv-customer-address'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('inv-discount').value = 0;
    document.getElementById('inv-tax-rate').value = 18;
    const body = document.getElementById('inv-body');
    if (body) body.innerHTML = '';
    document.getElementById('inv-number').value = '';
    manualInvoiceNumber = '';
    editingInvoiceTs = null;
    const cancelBtn = document.getElementById('inv-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    calcInvoice();
    addInvoiceRow();
    updateInvoiceNumber();
    showNotification('Form cleared', 'info');
}

function cancelInvoiceEdit() { editingInvoiceTs = null; document.getElementById('inv-cancel-btn').style.display = 'none'; clearInvoiceForm(); showNotification('Edit cancelled', 'info'); }

// ============================================================
// SAVE INVOICE - FULLY FIXED (SMART STOCK CHECK)
// ============================================================
async function saveInvoiceNow() {
    const customer = document.getElementById('inv-customer').value.trim();
    const date = document.getElementById('inv-date').value;
    const store = document.getElementById('inv-store').value.trim();
    const ntn = document.getElementById('inv-customer-ntn').value.trim();
    const strn = document.getElementById('inv-customer-strn').value.trim();
    const address = document.getElementById('inv-customer-address').value.trim();
    
    if (!customer || !date) {
        showNotification('Customer name and date are required!', 'error');
        return;
    }
    
    // ============================================================
    // STEP 1: Get existing items from current invoice (if editing)
    // ============================================================
    const items = [];
    let hasError = false;
    let errorMessage = '';
    
    let existingItemsMap = {};
    let existingInvoiceItems = [];
    
    if (editingInvoiceTs !== null) {
        const existingInvoice = invoices.find(inv => inv.id === editingInvoiceTs);
        if (existingInvoice && existingInvoice.items) {
            existingInvoiceItems = existingInvoice.items;
            existingInvoiceItems.forEach(item => {
                existingItemsMap[item.barcode] = {
                    qty: item.qty,
                    rate: item.rate,
                    item: item.item
                };
            });
            console.log('📦 Existing items in this invoice:', existingItemsMap);
        }
    }
    
    // ============================================================
    // STEP 2: Collect form items and smart stock check
    // ============================================================
    document.querySelectorAll('#inv-body tr').forEach(row => {
        const barcode = row.querySelector('.inv-barcode').value || '';
        const item = row.querySelector('.inv-item').value || '';
        const qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.inv-rate').value) || 0;
        
        if (qty > 0 && rate > 0) {
            // ============================================================
            // SMART STOCK CHECK LOGIC
            // ============================================================
            let shouldCheckStock = false;
            let checkQty = 0;
            let isNewItem = false;
            let oldQty = 0;
            
            if (editingInvoiceTs === null) {
                // NEW INVOICE: Full stock check
                shouldCheckStock = true;
                checkQty = qty;
                console.log(`🆕 New invoice: ${barcode} - Full stock check (${qty})`);
            } else {
                // EDITING INVOICE
                if (existingItemsMap[barcode]) {
                    // Item already exists in this invoice
                    oldQty = existingItemsMap[barcode].qty;
                    
                    if (qty > oldQty) {
                        // Quantity INCREASED: Check ONLY extra quantity
                        shouldCheckStock = true;
                        checkQty = qty - oldQty;
                        console.log(`📈 ${barcode}: Increased from ${oldQty} to ${qty} - Check extra ${checkQty}`);
                    } else {
                        // Quantity SAME or DECREASED: NO stock check needed
                        shouldCheckStock = false;
                        console.log(`✅ ${barcode}: ${oldQty} → ${qty} (same/decreased) - NO stock check`);
                    }
                } else {
                    // NEW ITEM added during edit: Full stock check
                    shouldCheckStock = true;
                    checkQty = qty;
                    isNewItem = true;
                    console.log(`🆕 ${barcode}: New item added - Full stock check (${qty})`);
                }
            }
            
            // ============================================================
            // STEP 3: Execute stock check if needed
            // ============================================================
            if (shouldCheckStock) {
                // Calculate available stock (excluding current invoice if editing)
                let totalIn = spStockIn.filter(s => s.barcode === barcode).reduce((sum, s) => sum + (s.totalPcs || 0), 0);
                let totalOut = spStockOut.filter(s => s.barcode === barcode).reduce((sum, s) => sum + (s.qty || 0), 0);
                
                // If editing, exclude this invoice's old quantity from totalOut
                if (editingInvoiceTs !== null && oldQty > 0) {
                    totalOut = totalOut - oldQty;
                    console.log(`📊 ${barcode}: Excluding old qty ${oldQty}, Total Out = ${totalOut}`);
                }
                
                const available = totalIn - totalOut;
                console.log(`📊 ${barcode}: Available = ${available}, Need = ${checkQty}`);
                
                if (available < checkQty) {
                    hasError = true;
                    if (isNewItem) {
                        errorMessage = `❌ ${item || barcode} - Insufficient stock! Available: ${available} Pcs`;
                    } else {
                        errorMessage = `❌ ${item || barcode} - Need extra ${checkQty} Pcs but only ${available} available!`;
                    }
                    return;
                }
            }
            
            items.push({ barcode, item, qty, rate, total: qty * rate });
        }
    });
    
    if (hasError) {
        showNotification(errorMessage, 'error');
        return;
    }
    
    if (items.length === 0) {
        showNotification('Add at least one item!', 'error');
        return;
    }
    
    // ============================================================
    // STEP 4: Calculate totals
    // ============================================================
    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const subtotal = items.reduce((s, item) => s + item.total, 0);
    const discountAmt = (subtotal * discount) / 100;
    const grossAmount = subtotal - discountAmt;
    
    let invoiceNo = manualInvoiceNumber || 'INV-' + String(invoices.length + 1).padStart(3, '0');
    
    if (editingInvoiceTs === null) {
        const existing = checkDuplicateInvoice(invoiceNo);
        if (existing) {
            showNotification('❌ Invoice number already exists! Please change it.', 'error');
            return;
        }
    }
    
    const ts = editingInvoiceTs || Date.now();
    
    // ============================================================
    // STEP 5: Prepare invoice data
    // ============================================================
    const invoiceData = { 
        timestamp: ts, 
        invoice_no: invoiceNo, 
        customer_name: customer, 
        store_name: store, 
        ntn: ntn || '', 
        strn: strn || '', 
        address: address || '', 
        date: date, 
        items: items, 
        discount_percent: discount, 
        discount_amt: discountAmt,
        sub_total: subtotal,
        gross_amount: grossAmount,
        final_total: grossAmount
    };
    
    // ============================================================
    // STEP 6: Handle Update (Delete old entries)
    // ============================================================
    if (editingInvoiceTs !== null) {
        // Delete old SP entries
        const oldSP = spStockOut.filter(e => e.invoiceTimestamp === editingInvoiceTs);
        for (const sp of oldSP) {
            await sb.from('sp_stock_out').delete().eq('sr_no', sp.id);
        }
        spStockOut = spStockOut.filter(e => e.invoiceTimestamp !== editingInvoiceTs);
        
        // Delete old tax invoice
        const oldTax = taxInvoices.find(i => i.cashInvoiceId === editingInvoiceTs);
        if (oldTax) {
            await sb.from('tax_invoices').delete().eq('timestamp', oldTax.id);
            taxInvoices = taxInvoices.filter(i => i.id !== oldTax.id);
        }
        
        // Update invoice
        const { error } = await sb.from('invoices').update(invoiceData).eq('timestamp', ts);
        if (error) {
            showNotification('Error updating: ' + error.message, 'error');
            return;
        }
        const idx = invoices.findIndex(inv => inv.id === editingInvoiceTs);
        if (idx > -1) invoices[idx] = { ...invoiceData, id: ts };
        
        editingInvoiceTs = null;
        document.getElementById('inv-cancel-btn').style.display = 'none';
        showNotification('✅ Invoice updated!', 'success');
    } else {
        // ============================================================
        // STEP 7: Handle New Invoice
        // ============================================================
        const { error } = await sb.from('invoices').insert(invoiceData);
        if (error) {
            showNotification('Error saving: ' + error.message, 'error');
            return;
        }
        invoices.push({ ...invoiceData, id: ts });
        invoiceCounter++;
        showNotification('✅ Invoice saved!', 'success');
    }
    
    // ============================================================
    // STEP 8: Create new SP Stock Out entries
    // ============================================================
    for (const item of items) {
        if (item.barcode && item.qty > 0) {
            const srNo = Date.now() + Math.floor(Math.random() * 1000);
            const spRow = {
                sr_no: srNo,
                date: date,
                store: store || customer,
                barcode: item.barcode,
                item_name: item.item || PRODUCTS[item.barcode] || item.barcode,
                qty: item.qty,
                price: item.rate,
                total: item.qty * item.rate,
                invoice_timestamp: ts
            };
            const { error } = await sb.from('sp_stock_out').insert(spRow);
            if (!error) {
                spStockOut.push({
                    id: srNo,
                    date: spRow.date,
                    store: spRow.store,
                    barcode: spRow.barcode,
                    item: spRow.item_name,
                    qty: spRow.qty,
                    price: spRow.price,
                    total: spRow.total,
                    invoiceTimestamp: ts
                });
            }
        }
    }
    
    // ============================================================
    // STEP 9: Generate Tax Invoice
    // ============================================================
    await generateAndSaveTaxInvoice(
        ts, discount, items, store, customer, ntn, strn, address,
        date, invoiceNo, grossAmount
    );
    
    // ============================================================
    // STEP 10: Refresh UI
    // ============================================================
    renderInvoiceHistory();
    renderTaxHistory();
    renderSPOut();
    updateBadges();
    loadDashboard();
    clearInvoiceForm();
    updateInvoiceNumber();
    showNotification('✅ Invoice saved successfully!', 'success');
}
// ============================================================
// GENERATE TAX INVOICE - WITH TOTALS
// ============================================================
async function generateAndSaveTaxInvoice(cashTimestamp, discountPercent, items, storeName, customerName, customerNtn, customerStrn, customerAddress, date, invoiceNo, grossAmount) {
    
    const existingTax = taxInvoices.find(i => i.cashInvoiceId === cashTimestamp);
    if (existingTax) {
        await sb.from('tax_invoices').delete().eq('timestamp', existingTax.id);
        taxInvoices = taxInvoices.filter(i => i.id !== existingTax.id);
    }
    
    const categories = {};
    const disc = discountPercent || 0;
    
    items.forEach(item => {
        const itemName = item.item || item.barcode;
        const catInfo = getItemCategory(itemName);
        let key = catInfo.category;
        
        if (key === 'Other') {
            if (itemName.includes('HANDLE') || itemName.includes('FANCY') || itemName.includes('BATH')) key = 'Fancy';
            else if (itemName.includes('FOAM') || itemName.includes('PAD') || itemName.includes('LAMINATE') || itemName.includes('NAIL')) key = 'Foam';
            else if (itemName.includes('SPIRAL') || itemName.includes('SCRUB')) key = 'Steel';
            else if (itemName.includes('MICRO') || itemName.includes('FIBER')) key = 'Micro';
            else key = 'Fancy';
        }
        
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const totalBeforeDiscount = qty * rate;
        const discAmtItem = totalBeforeDiscount * (disc / 100);
        const totalAfterDiscount = totalBeforeDiscount - discAmtItem;
        
        if (!categories[key]) {
            categories[key] = {
                category: key,
                hsCode: catInfo.hsCode || '0000',
                totalPcs: 0,
                totalGram: 0,
                totalKg: 0,
                totalSheet: 0,
                totalAmount: 0,
                weight: catInfo.weight || 0
            };
        }
        
        categories[key].totalPcs += qty;
        categories[key].totalAmount += totalAfterDiscount;
        
        if (catInfo.weight > 0 && (key === 'Foam' || key === 'Steel')) {
            categories[key].totalGram += (qty * catInfo.weight);
            categories[key].totalKg = categories[key].totalGram / 1000;
            if (key === 'Foam') {
                categories[key].totalSheet = categories[key].totalGram / 1400;
            }
        }
    });
    
    const categoryList = Object.keys(categories).map(key => {
        const cat = categories[key];
        return {
            category: key,
            totalPcs: cat.totalPcs,
            totalGram: cat.totalGram || 0,
            totalKg: cat.totalKg || 0,
            totalSheet: cat.totalSheet || 0,
            totalAmount: cat.totalAmount,
            avgRatePerPcs: cat.totalPcs > 0 ? cat.totalAmount / cat.totalPcs : 0,
            hsCode: cat.hsCode || '0000'
        };
    });
    
    // TAX INVOICE CALCULATION
    // Gross Amount = Cash Invoice Total (after discount)
    // Excluding Tax = Gross Amount / 1.18
    // GST = Gross Amount - Excluding Tax
    // Net = Excluding + GST = Gross Amount
    
    const excludingTax = grossAmount / 1.18;
    const gstAmount = grossAmount - excludingTax;
    const netAmount = excludingTax + gstAmount;
    
    // Calculate category totals
    let totalExclTax = 0;
    let totalGst = 0;
    let totalGross = 0;
    
    categoryList.forEach(cat => {
        const excl = cat.totalAmount / 1.18;
        const gst = excl * 0.18;
        cat.excludingTax = excl;
        cat.gstAmount = gst;
        totalExclTax += excl;
        totalGst += gst;
        totalGross += cat.totalAmount;
    });
    
    const taxInvoiceData = { 
        timestamp: Date.now(), 
        invoice_no: invoiceNo + '-TAX', 
        store_name: storeName, 
        customer_name: customerName, 
        ntn: customerNtn || '', 
        strn: customerStrn || '', 
        address: customerAddress || '', 
        date: date, 
        categories: categoryList, 
        gross_amount: grossAmount,
        excluding_tax: excludingTax,
        gst_amount: gstAmount,
        net_amount: netAmount,
        discount_percent: disc, 
        cash_invoice_timestamp: cashTimestamp
    };
    
    const row = {
        timestamp: taxInvoiceData.timestamp,
        invoice_no: taxInvoiceData.invoice_no,
        store_name: taxInvoiceData.store_name,
        customer_name: taxInvoiceData.customer_name,
        ntn: taxInvoiceData.ntn,
        strn: taxInvoiceData.strn,
        address: taxInvoiceData.address,
        date: taxInvoiceData.date,
        categories: taxInvoiceData.categories,
        gross_amount: taxInvoiceData.gross_amount,
        excluding_tax: taxInvoiceData.excluding_tax,
        gst_amount: taxInvoiceData.gst_amount,
        net_amount: taxInvoiceData.net_amount,
        discount_percent: taxInvoiceData.discount_percent,
        cash_invoice_timestamp: taxInvoiceData.cash_invoice_timestamp
    };
    
    const { error } = await sb.from('tax_invoices').insert(row);
    if (!error) {
        taxInvoices.push(taxInvoiceData);
        renderTaxInvoice(taxInvoiceData);
        console.log('✅ Tax Invoice generated:', invoiceNo + '-TAX');
        console.log('📊 Gross:', grossAmount, 'Excl:', excludingTax, 'GST:', gstAmount, 'Net:', netAmount);
    } else {
        console.error('Tax Invoice Insert Error:', error);
        showNotification('Error generating tax invoice: ' + error.message, 'error');
    }
}

// ============================================================
// GENERATE TAX INVOICE FROM CASH
// ============================================================
async function generateTaxInvoiceFromCash() {
    const customer = document.getElementById('inv-customer').value.trim();
    const date = document.getElementById('inv-date').value;
    const store = document.getElementById('inv-store').value.trim();
    const ntn = document.getElementById('inv-customer-ntn').value.trim();
    const strn = document.getElementById('inv-customer-strn').value.trim();
    const address = document.getElementById('inv-customer-address').value.trim();
    
    if (!customer) {
        showNotification('Please fill customer name first', 'error');
        return;
    }
    
    const items = [];
    document.querySelectorAll('#inv-body tr').forEach(row => {
        const barcode = row.querySelector('.inv-barcode').value || '';
        const item = row.querySelector('.inv-item').value || '';
        const qty = parseFloat(row.querySelector('.inv-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.inv-rate').value) || 0;
        if (qty > 0 && rate > 0) items.push({ barcode, item, qty, rate, total: qty * rate });
    });
    
    if (items.length === 0) {
        showNotification('Add items first!', 'error');
        return;
    }
    
    const discount = parseFloat(document.getElementById('inv-discount').value) || 0;
    const subtotal = items.reduce((s, item) => s + item.total, 0);
    const discountAmt = (subtotal * discount) / 100;
    const grossAmount = subtotal - discountAmt;
    const invoiceNo = manualInvoiceNumber || 'INV-' + String(invoices.length + 1).padStart(3, '0');
    const ts = editingInvoiceTs || Date.now();
    
    await generateAndSaveTaxInvoice(
        ts, discount, items, store, customer, ntn, strn, address,
        date, invoiceNo, grossAmount
    );
    
    showNotification('Tax Invoice generated!', 'success');
    updateBadges();
    showPage('tax-invoice');
}

// ============================================================
// RENDER TAX INVOICE - WITH TOTALS
// ============================================================
function renderTaxInvoice(data) {
    const container = document.getElementById('tax-invoice-container');
    if (!container) return;
    if (!data || !data.categories || data.categories.length === 0) {
        container.innerHTML = `<div class="tax-invoice-placeholder"><i class="fas fa-file-invoice" style="font-size:48px;color:var(--text-light);"></i><p style="margin-top:12px;color:var(--text-light);">No Tax Invoice generated yet.</p></div>`;
        return;
    }
    
    const labels = { 'Foam': 'Abrasive Sheet', 'Steel': 'Stainless Steel', 'Fancy': 'Home Consumption', 'Micro': 'Micro Fiber', 'Razor': 'Classic Razor' };
    const colors = { 'Foam': '#22c99a', 'Steel': '#3b82f6', 'Fancy': '#8b5cf6', 'Micro': '#f59e0b', 'Razor': '#ef4444' };
    
    // CALCULATE TOTALS
    let totalExclTax = 0;
    let totalGst = 0;
    let totalAmount = 0;
    let rows = '';
    
    data.categories.forEach(cat => {
        if (cat.totalPcs === 0) return;
        const catName = labels[cat.category] || cat.category;
        const exclTax = cat.totalAmount / 1.18;
        const gst = exclTax * 0.18;
        totalExclTax += exclTax;
        totalGst += gst;
        totalAmount += cat.totalAmount;
        
        rows += `<tr>
            <td>${cat.totalPcs}</td>
            <td><span style="color:${colors[cat.category] || '#64748b'};font-weight:600;">${catName}</span></td>
            <td>${cat.hsCode}</td>
            <td>${cat.totalSheet > 0 ? cat.totalSheet.toFixed(3) : '-'}</td>
            <td>${cat.totalKg > 0 ? cat.totalKg.toFixed(3) : '-'}</td>
            <td>${cat.avgRatePerPcs.toFixed(2)}</td>
            <td>Rs. ${exclTax.toFixed(2)}</td>
            <td>Rs. ${gst.toFixed(2)}</td>
            <td><strong>Rs. ${cat.totalAmount.toFixed(2)}</strong></td>
        </tr>`;
    });
    
    // GET VALUES FROM DATA
    const gross = parseFloat(data.gross_amount) || 0;
    const excludingTax = parseFloat(data.excluding_tax) || 0;
    const gst = parseFloat(data.gst_amount) || 0;
    const net = parseFloat(data.net_amount) || 0;
    const disc = parseFloat(data.discount_percent) || 0;
    const discAmt = (gross * disc) / 100;
    
    // IF VALUES ARE 0, CALCULATE FROM TOTAL AMOUNT
    let finalGross = gross;
    let finalExcluding = excludingTax;
    let finalGst = gst;
    let finalNet = net;
    
    if (finalGross === 0 && totalAmount > 0) {
        finalGross = totalAmount;
        finalExcluding = totalAmount / 1.18;
        finalGst = totalAmount - finalExcluding;
        finalNet = finalExcluding + finalGst;
    }
    
    container.innerHTML = `
        <div class="tax-invoice-display">
            <div class="header">
                <h1>KRT TRADERS</h1>
                <p class="sub-title">Deals in all kinds of cleaning item and general products</p>
                <p class="invoice-title">SALES TAX INVOICE</p>
                <p class="copy-type">Original — Duplicate</p>
            </div>
            <div class="info-grid">
                <div><strong>Invoice #:</strong> ${data.invoice_no}</div>
                <div><strong>Date:</strong> ${data.date}</div>
                <div><strong>Discount:</strong> ${disc}%</div>
            </div>
            <div class="buyer-grid">
                <div class="buyer-box">
                    <span class="box-title">Supplier</span>
                    <div class="box-name">KRT TRADERS</div>
                    <div class="box-detail">NTN: 2995454-1</div>
                    <div class="box-detail">STRN: 300299545411</div>
                    <div class="box-detail">Address: Lahore, Pakistan</div>
                </div>
                <div class="buyer-box">
                    <span class="box-title">Buyer</span>
                    <div class="box-name">${data.customer_name}</div>
                    <div class="box-detail">NTN: ${data.ntn || '-'}</div>
                    <div class="box-detail">STRN: ${data.strn || '-'}</div>
                    <div class="box-detail">Address: ${data.address || '-'}</div>
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Qty</th><th>Category</th><th>HS Code</th><th>Sheet</th><th>KG</th><th>Rate/Pcs</th><th>Excl. Tax</th><th>GST 18%</th><th>Amount</th></tr></thead>
                    <tbody>
                        ${rows}
                        <tr class="total-row">
                            <td colspan="6" style="text-align:right;font-weight:bold;">TOTAL</td>
                            <td><strong>Rs. ${totalExclTax.toFixed(2)}</strong></td>
                            <td><strong>Rs. ${totalGst.toFixed(2)}</strong></td>
                            <td><strong>Rs. ${totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="totals-grid">
                <div>
                    <div><strong>Gross Amount:</strong> Rs. ${finalGross.toFixed(2)}</div>
                    <div><strong>Excluding Tax:</strong> Rs. ${finalExcluding.toFixed(2)}</div>
                    <div><strong>GST @ 18%:</strong> Rs. ${finalGst.toFixed(2)}</div>
                    <div style="margin-top:6px;color:#666;font-size:12px;">
                        (Excl. Tax + GST = ${finalExcluding.toFixed(2)} + ${finalGst.toFixed(2)} = ${finalNet.toFixed(2)})
                    </div>
                </div>
                <div style="text-align:right;border-left:2px solid #ddd;padding-left:20px;">
                    <div><strong>Discount (${disc}%):</strong> - Rs. ${discAmt.toFixed(2)}</div>
                    <div style="font-size:24px;font-weight:800;color:#22c99a;margin-top:8px;border-top:2px solid #22c99a;padding-top:8px;">
                        <strong>Net Amount:</strong> Rs. ${finalNet.toFixed(2)}
                    </div>
                </div>
            </div>
            <div class="signature-section">
                <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Receiver's Signature</span></div>
                <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Authorized Signature</span></div>
                <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Company Stamp</span></div>
            </div>
            <div class="footer-note">
                <p>Generated by KRT TRADERS ERP System | Thank you for your business!</p>
            </div>
        </div>
    `;
    taxInvoiceData = data;
}

// ============================================================
// PRINT CASH INVOICE - FIXED TOTAL (CALCULATES FROM ITEMS)
// ============================================================
function printInvoice() {
    const last = invoices.length > 0 ? invoices[invoices.length - 1] : null;
    if (last) printInvoiceById(last.id);
    else showNotification('No invoice to print!', 'error');
}

function printInvoiceById(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) { showNotification('Invoice not found', 'error'); return; }
    
    // ============================================================
    // CRITICAL FIX: CALCULATE TOTALS DIRECTLY FROM ITEMS
    // ============================================================
    let subtotal = 0;
    const items = inv.items || [];
    items.forEach(item => {
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        subtotal += qty * rate;
    });
    
    const discountPercent = parseFloat(inv.discountPercent) || 0;
    const discountAmt = (subtotal * discountPercent) / 100;
    const finalTotal = subtotal - discountAmt;
    
    // Debug log to check values
    console.log('📊 Invoice Print - Subtotal:', subtotal, 'Discount:', discountAmt, 'Final:', finalTotal);
    console.log('📊 Invoice Data:', inv);
    
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.invoiceNo}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body{font-family:Arial;font-size:12px;margin:20px;background:#fff;padding:20px}
        .header{text-align:center;border-bottom:3px solid #22c99a;padding-bottom:14px;margin-bottom:16px}
        .header h1{color:#22c99a;font-size:24px}
        .header .sub-title{color:#666;font-size:14px;margin-top:4px}
        .company-info{display:flex;justify-content:space-between;margin:10px 0;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #eee}
        .company-info .info-item{min-width:150px}
        .company-info .info-item strong{color:#333}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        th{background:#22c99a;color:#fff;padding:8px;text-align:left;font-size:11px}
        td{padding:6px 8px;border-bottom:1px solid #ddd}
        .totals{text-align:right;margin-top:10px;font-size:13px;border-top:2px solid #ddd;padding-top:10px}
        .totals .total-line{display:flex;justify-content:flex-end;padding:3px 0;gap:30px}
        .totals .total-line .label{font-weight:normal;color:#555}
        .totals .total-line .value{font-weight:bold;min-width:100px;text-align:right}
        .totals .total-line.discount .value{color:#ef4444}
        .totals .total-line.final .value{color:#22c99a;font-size:20px}
        .footer{text-align:center;margin-top:20px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#999}
        .signature{display:flex;justify-content:space-between;margin-top:20px;padding-top:20px;border-top:2px solid #ddd}
        .sig-box{text-align:center;width:30%}
        .sig-line{border-top:2px solid #333;width:80%;margin:0 auto;padding-top:4px}
        .sig-label{font-size:10px;color:#666;display:block;margin-top:4px}
        .invoice-title{text-align:center;font-size:18px;font-weight:700;color:#1a3c6e;margin:10px 0}
        .barcode-cell{font-size:10px;font-family:monospace}
        @media print{
            th{background:#22c99a !important;color:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        }
    </style>
    </head><body>
        <div class="header">
            <h1>KRT TRADERS</h1>
            <p class="sub-title">NTN: 2995454-1 | STRN: 300299545411 | Lahore, Pakistan</p>
            <div class="invoice-title">CASH INVOICE</div>
        </div>
        
        <div class="company-info">
            <div class="info-item"><strong>Invoice #:</strong> ${inv.invoiceNo}</div>
            <div class="info-item"><strong>Date:</strong> ${inv.date}</div>
            <div class="info-item"><strong>Customer:</strong> ${inv.customerName}</div>
            <div class="info-item"><strong>Store:</strong> ${inv.storeName || '-'}</div>
        </div>
        
        <div class="company-info">
            <div class="info-item"><strong>NTN:</strong> ${inv.ntn || '-'}</div>
            <div class="info-item"><strong>STRN:</strong> ${inv.strn || '-'}</div>
            <div class="info-item"><strong>Address:</strong> ${inv.address || '-'}</div>
        </div>
        
        <table>
            <thead>
                <tr><th style="width:30px;">#</th><th style="width:120px;">Barcode</th><th>Item</th><th style="text-align:center;width:50px;">Qty</th><th style="text-align:right;width:80px;">Rate</th><th style="text-align:right;width:100px;">Total</th></tr>
            </thead>
            <tbody>
                ${items.map((item, i) => `
                    <tr>
                        <td>${i+1}</td>
                        <td class="barcode-cell">${item.barcode || '-'}</td>
                        <td>${item.item || '-'}</td>
                        <td style="text-align:center;">${parseFloat(item.qty || 0)}</td>
                        <td style="text-align:right;">Rs. ${parseFloat(item.rate || 0).toFixed(2)}</td>
                        <td style="text-align:right;">Rs. ${(parseFloat(item.qty || 0) * parseFloat(item.rate || 0)).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-line">
                <span class="label">Sub Total:</span>
                <span class="value">Rs. ${subtotal.toFixed(2)}</span>
            </div>
            ${discountPercent > 0 ? `
                <div class="total-line discount">
                    <span class="label">Discount (${discountPercent}%):</span>
                    <span class="value">- Rs. ${discountAmt.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="total-line final">
                <span class="label" style="font-size:16px;"><strong>FINAL TOTAL:</strong></span>
                <span class="value" style="font-size:20px;"><strong>Rs. ${finalTotal.toFixed(2)}</strong></span>
            </div>
        </div>
        
        <div class="signature">
            <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Receiver's Signature</span></div>
            <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Authorized Signature</span></div>
            <div class="sig-box"><div class="sig-line"></div><span class="sig-label">Company Stamp</span></div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business! — Goods once sold cannot be returned.</p>
            <p style="margin-top:4px;font-size:9px;color:#aaa;">Generated by KRT TRADERS ERP System</p>
        </div>
        
        <script>
            window.onload = function() {
                setTimeout(function() { window.print(); }, 500);
            };
        <\/script>
    </body></html>`);
    w.document.close();
}
// ============================================================
// INVOICE HISTORY - WITH TOTALS
// ============================================================
function renderInvoiceHistory() {
    const from = document.getElementById('inv-hist-from')?.value || '';
    const to = document.getElementById('inv-hist-to')?.value || '';
    const search = (document.getElementById('inv-hist-search')?.value || '').toLowerCase();
    let filtered = [...invoices].reverse();
    if (from) filtered = filtered.filter(inv => inv.date >= from);
    if (to) filtered = filtered.filter(inv => inv.date <= to);
    if (search) filtered = filtered.filter(inv => (inv.invoiceNo || '').toLowerCase().includes(search) || (inv.customerName || '').toLowerCase().includes(search) || (inv.storeName || '').toLowerCase().includes(search));
    const tbody = document.getElementById('inv-history-body');
    if (!tbody) return;
    if (filtered.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="7">No invoices found</td></tr>'; } else {
        tbody.innerHTML = filtered.map(inv => `<tr>
            <td><strong>${inv.invoiceNo}</strong></td>
            <td>${inv.storeName || '-'}</td>
            <td>${inv.customerName || '-'}</td>
            <td>${inv.date}</td>
            <td>${inv.items?.length || 0}</td>
            <td><strong>Rs. ${(inv.grossAmount || 0).toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-edit btn-xs" onclick="viewInvoice(${inv.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-print btn-xs" onclick="printInvoiceById(${inv.id})"><i class="fas fa-print"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteInvoice(${inv.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    }
    document.getElementById('inv-hist-badge').textContent = filtered.length;
}

function viewInvoice(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) { showNotification('Invoice not found', 'error'); return; }
    const body = document.getElementById('inv-modal-body');
    if (!body) return;
    body.innerHTML = `<div style="padding:10px 0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
            <div><strong>Invoice #:</strong> ${inv.invoiceNo}</div>
            <div><strong>Date:</strong> ${inv.date}</div>
            <div><strong>Customer:</strong> ${inv.customerName}</div>
            <div><strong>Store:</strong> ${inv.storeName || '-'}</div>
            <div><strong>NTN:</strong> ${inv.ntn || '-'}</div>
            <div><strong>STRN:</strong> ${inv.strn || '-'}</div>
            <div><strong>Discount:</strong> ${inv.discountPercent || 0}%</div>
            <div><strong style="color:#22c99a;font-size:16px;">Total: Rs. ${(inv.grossAmount || 0).toFixed(2)}</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="background:#f1f5f9;"><th style="padding:8px;border:1px solid #ddd;">Item</th><th style="padding:8px;border:1px solid #ddd;">Qty</th><th style="padding:8px;border:1px solid #ddd;">Rate</th><th style="padding:8px;border:1px solid #ddd;">Total</th></tr></thead>
            <tbody>
                ${(inv.items || []).map(item => `<tr><td style="padding:6px 8px;border:1px solid #ddd;">${item.item || item.barcode || '-'}</td><td style="padding:6px 8px;border:1px solid #ddd;">${item.qty}</td><td style="padding:6px 8px;border:1px solid #ddd;">Rs. ${item.rate.toFixed(2)}</td><td style="padding:6px 8px;border:1px solid #ddd;">Rs. ${(item.qty * item.rate).toFixed(2)}</td></tr>`).join('')}
                <tr style="font-weight:bold;background:#e8f5f0;">
                    <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;">TOTAL:</td>
                    <td style="padding:8px;border:1px solid #ddd;color:#22c99a;font-size:16px;"><strong>Rs. ${(inv.grossAmount || 0).toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>`;
    document.getElementById('modal-del-btn').onclick = () => deleteInvoice(id);
    document.getElementById('inv-modal').classList.add('open');
    window._modalInvId = id;
}

function closeInvModal() { document.getElementById('inv-modal').classList.remove('open'); }

function editInvoiceFromModal() { closeInvModal(); if (window._modalInvId) loadInvoiceToForm(window._modalInvId); }

function loadInvoiceToForm(id) {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    showPage('cash-invoice');
    document.getElementById('inv-customer').value = inv.customerName || '';
    document.getElementById('inv-store').value = inv.storeName || '';
    document.getElementById('inv-customer-ntn').value = inv.ntn || '';
    document.getElementById('inv-customer-strn').value = inv.strn || '';
    document.getElementById('inv-customer-address').value = inv.address || '';
    document.getElementById('inv-date').value = inv.date || '';
    document.getElementById('inv-discount').value = inv.discountPercent || 0;
    document.getElementById('inv-number').value = inv.invoiceNo || '';
    manualInvoiceNumber = inv.invoiceNo || '';
    onInvStoreChange(inv.storeName || '');
    document.getElementById('inv-body').innerHTML = '';
    (inv.items || []).forEach(item => { addInvoiceRow(); const row = document.querySelector('#inv-body tr:last-child'); row.querySelector('.inv-barcode').value = item.barcode || ''; row.querySelector('.inv-item').value = item.item || ''; row.querySelector('.inv-qty').value = item.qty || 1; row.querySelector('.inv-rate').value = item.rate || 0; });
    calcInvoice();
    editingInvoiceTs = inv.id;
    document.getElementById('inv-cancel-btn').style.display = 'inline-flex';
    updateInvoiceNumber();
}

async function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    const { error } = await sb.from('invoices').delete().eq('timestamp', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    invoices = invoices.filter(inv => inv.id !== id);
    taxInvoices = taxInvoices.filter(inv => inv.cashInvoiceId !== id);
    const spToDelete = spStockOut.filter(e => e.invoiceTimestamp === id);
    for (const sp of spToDelete) { await sb.from('sp_stock_out').delete().eq('sr_no', sp.id); }
    spStockOut = spStockOut.filter(e => e.invoiceTimestamp !== id);
    renderInvoiceHistory(); loadDashboard(); updateBadges(); closeInvModal();
    showNotification('Invoice deleted!', 'success');
}

function refreshInvoiceHistory() { renderInvoiceHistory(); showNotification('Refreshed!', 'info'); }
function clearInvoiceHistoryFilter() { document.getElementById('inv-hist-from').value = ''; document.getElementById('inv-hist-to').value = ''; document.getElementById('inv-hist-search').value = ''; renderInvoiceHistory(); }

function exportInvoiceHistory() {
    if (invoices.length === 0) { showNotification('No invoices to export', 'warning'); return; }
    let csv = 'Invoice #,Customer,Store,Date,Items,Total\n';
    invoices.forEach(inv => { csv += `${inv.invoiceNo},${inv.customerName || ''},${inv.storeName || ''},${inv.date},${inv.items?.length || 0},${(inv.grossAmount || 0).toFixed(2)}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoice_history.csv'; a.click(); URL.revokeObjectURL(a.href);
    showNotification('Export successful!', 'success');
}

// ============================================================
// TAX HISTORY - WITH TOTALS
// ============================================================
function renderTaxHistory() {
    const from = document.getElementById('tax-hist-from')?.value || '';
    const to = document.getElementById('tax-hist-to')?.value || '';
    const search = (document.getElementById('tax-hist-search')?.value || '').toLowerCase();
    let filtered = [...taxInvoices].reverse();
    if (from) filtered = filtered.filter(inv => inv.date >= from);
    if (to) filtered = filtered.filter(inv => inv.date <= to);
    if (search) filtered = filtered.filter(inv => (inv.invoiceNo || '').toLowerCase().includes(search) || (inv.customerName || '').toLowerCase().includes(search));
    const tbody = document.getElementById('tax-history-body');
    if (!tbody) return;
    if (filtered.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="10">No tax invoices found</td></tr>'; } else {
        tbody.innerHTML = filtered.map(inv => `<tr>
            <td><strong>${inv.invoiceNo}</strong></td>
            <td>${inv.storeName || '-'}</td>
            <td>${inv.customerName || '-'}</td>
            <td>${inv.date}</td>
            <td>${inv.categories?.length || 0}</td>
            <td><strong>Rs. ${(inv.grossAmount || 0).toFixed(2)}</strong></td>
            <td>Rs. ${(inv.gstAmount || 0).toFixed(2)}</td>
            <td><strong>Rs. ${(inv.netAmount || 0).toFixed(2)}</strong></td>
            <td>${inv.discountPercent || 0}%</td>
            <td>
                <button class="btn btn-edit btn-xs" onclick="viewTaxInvoice(${inv.id})"><i class="fas fa-eye"></i></button>
                <button class="btn btn-print btn-xs" onclick="printTaxInvoiceById(${inv.id})"><i class="fas fa-print"></i></button>
                <button class="btn btn-danger btn-xs" onclick="deleteTaxInvoice(${inv.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
    }
    document.getElementById('tax-hist-badge').textContent = filtered.length;
}

function viewTaxInvoice(id) { const inv = taxInvoices.find(i => i.id === id); if (!inv) { showNotification('Tax invoice not found', 'error'); return; } renderTaxInvoice(inv); showPage('tax-invoice'); }
function printTaxInvoiceById(id) {
    const inv = taxInvoices.find(i => i.id === id);
    if (!inv) { 
        showNotification('Tax invoice not found!', 'error'); 
        return; 
    }
    
    // Tax invoice ka HTML banayein
    const printContent = document.getElementById('tax-invoice-container')?.innerHTML;
    if (!printContent) {
        showNotification('No content to print!', 'error');
        return;
    }
    
    // Naya window open karein sirf tax invoice ke liye
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<!DOCTYPE html>
    <html>
    <head>
        <title>${inv.invoice_no}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:Arial; padding:20px; background:#fff; }
            .tax-invoice-display { max-width:1100px; margin:0 auto; }
            .header { text-align:center; border-bottom:3px solid #22c99a; padding-bottom:14px; margin-bottom:16px; }
            .header h1 { color:#22c99a; font-size:24px; }
            .header .sub-title { color:#666; font-size:13px; margin-top:4px; }
            .header .invoice-title { font-size:18px; font-weight:700; color:#1a3c6e; margin:8px 0; }
            .header .copy-type { color:#666; font-size:11px; font-style:italic; }
            .info-grid { display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:10px 0; border-bottom:1px solid #ddd; margin-bottom:12px; }
            .buyer-grid { display:flex; gap:20px; margin:12px 0; flex-wrap:wrap; }
            .buyer-box { flex:1; min-width:200px; padding:10px 14px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; }
            .buyer-box .box-title { font-size:9px; text-transform:uppercase; color:#64748b; font-weight:600; }
            .buyer-box .box-name { font-size:15px; font-weight:700; color:#1a3c6e; margin:4px 0; }
            .buyer-box .box-detail { font-size:10px; color:#555; }
            .table-wrap { overflow-x:auto; margin:12px 0; }
            table { width:100%; border-collapse:collapse; font-size:10px; }
            th { background:#1a3c6e; color:#fff; padding:6px 8px; text-align:left; border:1px solid #1a3c6e; }
            th.center { text-align:center; }
            th.right { text-align:right; }
            td { padding:5px 8px; border:1px solid #ddd; }
            td.center { text-align:center; }
            td.right { text-align:right; }
            .total-row { background:#e8f5f0; font-weight:700; }
            .total-row td { font-weight:700; border-top:2px solid #0a3d2a; }
            .totals-grid { display:flex; justify-content:space-between; flex-wrap:wrap; gap:15px; margin-top:15px; padding-top:15px; border-top:2px solid #ddd; }
            .totals-grid .right-section { text-align:right; border-left:2px solid #ddd; padding-left:20px; }
            .signature-section { display:flex; justify-content:space-between; margin-top:25px; padding-top:20px; border-top:2px solid #ddd; }
            .sig-box { text-align:center; width:30%; }
            .sig-line { border-top:2px solid #333; width:80%; margin:0 auto; padding-top:4px; }
            .sig-label { font-size:9px; color:#666; display:block; margin-top:4px; }
            .footer-note { text-align:center; margin-top:20px; border-top:1px solid #ddd; padding-top:10px; font-size:9px; color:#999; }
            .badge-discount { background:#fef3c7; color:#d4a017; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:600; }
            @media print { 
                th { background:#1a3c6e !important; color:#fff !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                .buyer-box { background:#f8fafc !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                .total-row { background:#e8f5f0 !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            }
        </style>
    </head>
    <body>
        ${printContent}
        <script>
            window.onload = function() {
                setTimeout(function() { window.print(); }, 500);
            };
        <\/script>
    </body>
    </html>`);
    w.document.close();
}
async function deleteTaxInvoice(id) {
    if (!confirm('Delete this tax invoice?')) return;
    const { error } = await sb.from('tax_invoices').delete().eq('timestamp', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    taxInvoices = taxInvoices.filter(inv => inv.id !== id);
    renderTaxHistory(); updateBadges(); showNotification('Tax invoice deleted!', 'success');
}
function refreshTaxHistory() { renderTaxHistory(); showNotification('Refreshed!', 'info'); }
function clearTaxHistoryFilter() { document.getElementById('tax-hist-from').value = ''; document.getElementById('tax-hist-to').value = ''; document.getElementById('tax-hist-search').value = ''; renderTaxHistory(); }
function exportTaxHistory() {
    if (taxInvoices.length === 0) { showNotification('No tax invoices to export', 'warning'); return; }
    let csv = 'Invoice #,Customer,Store,Date,Categories,Gross,GST,Net,Discount\n';
    taxInvoices.forEach(inv => { csv += `${inv.invoiceNo},${inv.customerName || ''},${inv.storeName || ''},${inv.date},${inv.categories?.length || 0},${(inv.grossAmount || 0).toFixed(2)},${(inv.gstAmount || 0).toFixed(2)},${(inv.netAmount || 0).toFixed(2)},${inv.discountPercent || 0}%\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tax_invoice_history.csv'; a.click(); URL.revokeObjectURL(a.href);
    showNotification('Export successful!', 'success');
}

// ============================================================
// MONTHLY REPORT - COMPLETE FIX WITH ALL TOTALS
// ============================================================
function generateMonthlyReport() {
    const month = document.getElementById('monthly-month')?.value;
    if (!month) { showNotification('Select a month!', 'error'); return; }
    const [year, monthNum] = month.split('-').map(Number);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[monthNum - 1];
    const filtered = invoices.filter(inv => { 
        const d = new Date(inv.date); 
        return d.getFullYear() === year && d.getMonth() === monthNum - 1; 
    });
    const container = document.getElementById('monthly-report-container');
    if (!container) return;
    if (filtered.length === 0) { 
        container.innerHTML = `<div class="monthly-report-empty"><i class="fas fa-calendar-times" style="font-size:48px;color:#cbd5e1;"></i><h3>No Invoices Found</h3><p>No invoices found for ${monthName} ${year}</p></div>`; 
        return; 
    }
    
    const totalSales = filtered.reduce((s, inv) => s + (inv.grossAmount || 0), 0);
    const totalItems = filtered.reduce((s, inv) => s + (inv.items?.length || 0), 0);
    
    let html = `<div class="monthly-report-wrapper">
        <div class="report-header-modern">
            <div class="report-header-top">
                <div class="report-brand">
                    <span style="font-size:32px;">🏪</span>
                    <div>
                        <h2>KRT TRADERS</h2>
                        <span>Monthly Invoice Report</span>
                    </div>
                </div>
                <div class="report-meta">
                    <div class="meta-item">
                        <span class="meta-label">Month</span>
                        <span class="meta-value">${monthName} ${year}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Total Invoices</span>
                        <span class="meta-value">${filtered.length}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Generated</span>
                        <span class="meta-value">${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>`;
    
    let grandTotal = 0;
    
    filtered.forEach((inv, index) => {
        const catData = {};
        const disc = inv.discountPercent || 0;
        const items = inv.items || [];
        
        // Process each item to get category totals
        items.forEach(item => {
            const name = item.item || item.barcode;
            const info = getItemCategory(name);
            const key = info.category;
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            const amount = (qty * rate) * (1 - disc / 100);
            
            if (!catData[key]) { 
                catData[key] = { 
                    category: key, 
                    hsCode: info.hsCode, 
                    totalPcs: 0, 
                    totalSheet: 0, 
                    totalKg: 0, 
                    totalAmount: 0, 
                    weight: info.weight || 0 
                }; 
            }
            catData[key].totalPcs += qty;
            catData[key].totalAmount += amount;
            
            if (key === 'Foam' && info.weight > 0) {
                catData[key].totalSheet += (qty * info.weight) / 1400;
            }
            if (key === 'Steel' && info.weight > 0) {
                catData[key].totalKg += (qty * info.weight) / 1000;
            }
        });
        
        const labels = { 'Foam': 'Abrasive Sheet', 'Steel': 'Stainless Steel', 'Fancy': 'Home Consumption', 'Micro': 'Micro Fiber', 'Razor': 'Classic Razor' };
        const colors = { 'Foam': '#22c99a', 'Steel': '#3b82f6', 'Fancy': '#8b5cf6', 'Micro': '#f59e0b', 'Razor': '#ef4444' };
        
        let rows = '';
        let totalExcl = 0;
        let totalGst = 0;
        let invoiceSubtotal = 0;
        
        Object.values(catData).forEach(c => {
            if (c.totalPcs === 0) return;
            const excl = c.totalAmount / 1.18;
            const gst = excl * 0.18;
            totalExcl += excl;
            totalGst += gst;
            invoiceSubtotal += c.totalAmount;
            
            rows += `<tr>
                <td>
                    <div class="category-cell">
                        <span class="category-icon" style="background:${colors[c.category] || '#64748b'}20;color:${colors[c.category] || '#64748b'};">
                            <i class="fas ${c.category === 'Foam' ? 'fa-layer-group' : c.category === 'Steel' ? 'fa-cogs' : c.category === 'Fancy' ? 'fa-gem' : c.category === 'Micro' ? 'fa-microscope' : 'fa-box'}"></i>
                        </span>
                        <span class="category-name">${labels[c.category] || c.category}</span>
                    </div>
                </td>
                <td><span class="badge-count">${c.totalPcs}</span></td>
                <td>${c.totalSheet > 0 ? c.totalSheet.toFixed(3) : '-'}</td>
                <td>${c.totalKg > 0 ? c.totalKg.toFixed(3) : '-'}</td>
                <td>${(c.totalPcs > 0 ? c.totalAmount / c.totalPcs : 0).toFixed(2)}</td>
                <td class="amount-cell">Rs. ${excl.toFixed(2)}</td>
                <td class="gst-cell">Rs. ${gst.toFixed(2)}</td>
                <td class="amount-cell-bold">Rs. ${c.totalAmount.toFixed(2)}</td>
                <td><span class="hs-code">${c.hsCode}</span></td>
            </tr>`;
        });
        
        // Use invoice total from inv.grossAmount
        const invoiceTotal = inv.grossAmount || invoiceSubtotal;
        grandTotal += invoiceTotal;
        
        html += `<div class="invoice-card-modern">
            <div class="invoice-card-header">
                <div class="invoice-title-section">
                    <span class="invoice-number-badge">#${inv.invoiceNo}</span>
                    <span class="invoice-date-badge"><i class="far fa-calendar-alt"></i> ${inv.date}</span>
                    ${disc > 0 ? `<span class="discount-badge"><i class="fas fa-tag"></i> ${disc}% OFF</span>` : ''}
                </div>
                <div class="invoice-party-section">
                    <span><i class="fas fa-store"></i> ${inv.storeName || inv.customerName || '-'}</span>
                    <span><i class="fas fa-id-card"></i> NTN: ${inv.ntn || '-'}</span>
                </div>
            </div>
            <div class="table-wrap-modern">
                <table>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>PCS</th>
                            <th>Sheet</th>
                            <th>KG</th>
                            <th>Rate/PCS</th>
                            <th>Excl. Tax</th>
                            <th>GST 18%</th>
                            <th>Amount</th>
                            <th>HS Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr class="total-row-modern">
                            <td colspan="5">
                                <div class="total-label"><i class="fas fa-calculator"></i> TOTAL</div>
                            </td>
                            <td class="total-excl"><strong>Rs. ${totalExcl.toFixed(2)}</strong></td>
                            <td class="total-gst"><strong>Rs. ${totalGst.toFixed(2)}</strong></td>
                            <td class="total-amount"><strong>Rs. ${invoiceTotal.toFixed(2)}</strong></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="invoice-card-footer">
                <div class="footer-left">
                    <span><i class="fas fa-file-invoice"></i> Items: ${items.length}</span>
                    ${disc > 0 ? `<span><i class="fas fa-tag"></i> Discount: ${disc}%</span>` : ''}
                </div>
                <div class="footer-right">
                    <span class="final-total">Final: <strong style="color:#22c99a;font-size:16px;">Rs. ${invoiceTotal.toFixed(2)}</strong></span>
                </div>
            </div>
        </div>`;
    });
    
    html += `<div class="report-footer-modern">
        <div class="footer-brand"><span>KRT TRADERS ERP System</span></div>
        <div class="footer-stats">
            <div class="stat-item">
                <span class="stat-label">Total Invoices</span>
                <span class="stat-number">${filtered.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Items</span>
                <span class="stat-number">${totalItems}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Grand Total</span>
                <span class="stat-number grand"><strong>Rs. ${grandTotal.toFixed(2)}</strong></span>
            </div>
        </div>
        <div class="footer-copy">© ${new Date().getFullYear()} KRT TRADERS. All rights reserved.</div>
    </div></div>`;
    
    container.innerHTML = html;
    showNotification(`Report generated for ${monthName} ${year}`, 'success');
}

function clearMonthlyReport() {
    const container = document.getElementById('monthly-report-container');
    if (!container) return;
    container.innerHTML = `<div class="tax-invoice-placeholder"><i class="fas fa-calendar-alt" style="font-size:48px;color:var(--text-light);"></i><p style="margin-top:12px;color:var(--text-light);">Select a month and click "Generate"</p></div>`;
    showNotification('Report cleared', 'info');
}

function printMonthlyReport() {
    const content = document.getElementById('monthly-report-container')?.innerHTML;
    if (!content || content.includes('Select a month')) { showNotification('Generate a report first!', 'error'); return; }
    const w = window.open('', '_blank', 'width=1100,height=800');
    w.document.write(`<!DOCTYPE html><html><head><title>Monthly Report</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial;font-size:11px;margin:10px;background:#fff}.monthly-report-wrapper{max-width:1300px;margin:0 auto}.report-header-modern{background:#1a3c6e;padding:20px 30px;border-bottom:4px solid #22c99a;color:#fff}.report-header-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px}.report-brand{display:flex;align-items:center;gap:15px}.report-brand h2{font-size:22px;color:#fff}.report-brand span{color:rgba(255,255,255,0.6);font-size:12px;display:block}.report-meta{display:flex;gap:15px;flex-wrap:wrap}.meta-item{background:rgba(255,255,255,0.08);padding:5px 12px;border-radius:6px;text-align:right;min-width:80px}.meta-item .meta-label{font-size:8px;text-transform:uppercase;color:rgba(255,255,255,0.5);display:block}.meta-item .meta-value{font-size:14px;font-weight:700;color:#fff;display:block}.invoice-card-modern{margin:12px 16px;border:1px solid #ddd;border-radius:6px;overflow:hidden;page-break-inside:avoid}.invoice-card-header{background:#f8fafc;padding:10px 16px;border-bottom:1px solid #ddd;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}.invoice-title-section{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.invoice-number-badge{font-size:14px;font-weight:700;color:#0a3d2a;background:#e8f5f0;padding:3px 12px;border-radius:6px}.invoice-date-badge{font-size:11px;color:#555;background:#f1f5f9;padding:3px 10px;border-radius:4px}.discount-badge{font-size:11px;font-weight:700;color:#fff;background:#d4a017;padding:2px 10px;border-radius:20px}.invoice-party-section{font-size:11px;color:#333;display:flex;gap:12px;flex-wrap:wrap}.table-wrap-modern{overflow-x:auto;padding:0}.table-wrap-modern table{width:100%;border-collapse:collapse;font-size:9px;min-width:100%}.table-wrap-modern table thead th{background:#1a3c6e;color:#fff;padding:5px 8px;font-size:8px;text-transform:uppercase;border:1px solid #1a3c6e}.table-wrap-modern table tbody td{padding:4px 8px;border:1px solid #ccc}.table-wrap-modern table tbody tr:nth-child(even) td{background:#f9fafc}.category-cell{display:flex;align-items:center;gap:6px}.category-icon{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}.category-name{font-weight:500;font-size:10px}.badge-count{background:#e8ecf1;padding:1px 8px;border-radius:20px;font-size:9px;font-weight:600;display:inline-block}.hs-code{font-family:monospace;font-size:8px;background:#f1f5f9;padding:1px 6px;border-radius:3px;color:#555}.amount-cell{font-weight:500}.amount-cell-bold{font-weight:700;color:#0a3d2a}.gst-cell{font-weight:600;color:#d97706}.total-row-modern{background:#e8f5f0;border-top:2px solid #0a3d2a}.total-row-modern td{padding:6px 8px;font-weight:700}.total-label{color:#0a3d2a;font-size:11px;display:flex;align-items:center;gap:5px}.total-amount{color:#0a3d2a;font-size:12px}.invoice-card-footer{background:#fafbfc;padding:6px 16px;border-top:1px solid #ddd;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px}.footer-left{font-size:10px;color:#555}.footer-right .final-total{font-size:13px;font-weight:600}.footer-right .final-total strong{color:#0a3d2a;font-size:15px}.report-footer-modern{background:#1a2332;padding:15px 25px;border-top:3px solid #22c99a;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;color:#fff}.footer-brand{color:rgba(255,255,255,0.5);font-size:12px}.footer-stats{display:flex;gap:20px}.footer-stats .stat-item{text-align:center}.footer-stats .stat-label{font-size:8px;text-transform:uppercase;color:rgba(255,255,255,0.4);display:block}.footer-stats .stat-number{font-size:18px;font-weight:800;color:#fff;display:block}.footer-stats .stat-number.grand{color:#22c99a}.footer-copy{font-size:10px;color:rgba(255,255,255,0.3)}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0.1in;padding:0}</style></head><body>${content}<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>`);
    w.document.close();
}

// ============================================================
// STOCK IN - CRUD
// ============================================================
function inBarcodeInput() {
    const bc = document.getElementById('in-barcode').value.trim();
    if (PRODUCTS[bc]) document.getElementById('in-item').value = PRODUCTS[bc];
}

async function saveStockIn() {
    const item = document.getElementById('in-item').value.trim();
    const qty = parseFloat(document.getElementById('in-qty').value) || 0;
    const price = parseFloat(document.getElementById('in-price').value) || 0;
    const vendor = document.getElementById('in-vendor').value.trim() || 'N/A';
    const barcode = document.getElementById('in-barcode').value.trim() || 'N/A';
    const date = document.getElementById('in-date').value;
    if (!item || qty <= 0) { showNotification('Item and quantity are required!', 'error'); return; }
    if (editingStockInId !== null) {
        const { error } = await sb.from('stock_in').update({ date, vendor, item_name: item, barcode, qty, price, total: qty * price }).eq('sr_no', editingStockInId);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = stockIn.findIndex(s => s.id === editingStockInId);
        if (idx > -1) stockIn[idx] = { ...stockIn[idx], date, vendor, item, barcode, qty, price, total: qty * price };
        editingStockInId = null;
        document.querySelector('#page-stock-in .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock In';
        showNotification('Stock In updated!', 'success');
    } else {
        const srNo = Date.now();
        const { error } = await sb.from('stock_in').insert({ sr_no: srNo, date, vendor, item_name: item, barcode, qty, price, total: qty * price });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        stockIn.push({ id: srNo, date, vendor, item, barcode, qty, price, total: qty * price });
        showNotification('Stock In saved!', 'success');
    }
    renderStockIn(); updateBadges(); clearStockInForm();
}

function renderStockIn() {
    const tbody = document.getElementById('stock-in-table');
    if (!tbody) return;
    if (stockIn.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="8">No entries found</td></tr>'; } else {
        tbody.innerHTML = [...stockIn].reverse().map((s, i) => `<tr><td>${i + 1}</td><td>${s.date}</td><td>${s.item}</td><td>${s.vendor}</td><td><span class="qty-pill">${s.qty}</span></td><td>Rs. ${s.price.toFixed(2)}</td><td><span class="total-pill">Rs. ${s.total.toFixed(2)}</span></td><td><button class="btn btn-edit btn-xs" onclick="editStockIn(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteStockIn(${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    }
    document.getElementById('stock-in-count').textContent = stockIn.length;
}

function editStockIn(id) {
    const s = stockIn.find(x => x.id === id);
    if (!s) return;
    showPage('stock-in');
    document.getElementById('in-date').value = s.date || '';
    document.getElementById('in-vendor').value = s.vendor === 'N/A' ? '' : s.vendor;
    document.getElementById('in-barcode').value = s.barcode === 'N/A' ? '' : s.barcode;
    document.getElementById('in-item').value = s.item;
    document.getElementById('in-qty').value = s.qty;
    document.getElementById('in-price').value = s.price;
    editingStockInId = id;
    document.querySelector('#page-stock-in .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock In';
    window.scrollTo(0, 0);
}

async function deleteStockIn(id) {
    if (!confirm('Delete this entry?')) return;
    const { error } = await sb.from('stock_in').delete().eq('sr_no', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    stockIn = stockIn.filter(s => s.id !== id);
    renderStockIn(); updateBadges(); showNotification('Entry deleted!', 'success');
}

function clearStockInForm() { ['in-vendor', 'in-barcode', 'in-item', 'in-qty', 'in-price'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); showNotification('Form cleared', 'info'); }
function printStockInHistory() { window.print(); }

function exportStockIn() {
    if (stockIn.length === 0) { showNotification('No data to export', 'warning'); return; }
    let csv = '#,Date,Item,Vendor,Qty,Price,Total\n';
    stockIn.forEach((s, i) => { csv += `${i+1},${s.date},${s.item},${s.vendor},${s.qty},${s.price},${s.total}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stock_in.csv'; a.click(); URL.revokeObjectURL(a.href);
    showNotification('Export successful!', 'success');
}

// ============================================================
// STOCK OUT - CRUD
// ============================================================
function updateStockOutDropdown() {
    const select = document.getElementById('out-item-select');
    if (!select) return;
    const uniqueItems = [...new Set(stockIn.map(s => s.item))];
    select.innerHTML = '<option value="">-- Select Item --</option>' + uniqueItems.map(item => `<option value="${item}">${item}</option>`).join('');
}

function onOutItemSelect() {
    const item = document.getElementById('out-item-select').value;
    document.getElementById('out-item').value = item;
    const entry = stockIn.find(s => s.item === item);
    if (entry) { document.getElementById('out-barcode').value = entry.barcode === 'N/A' ? '' : entry.barcode; document.getElementById('out-price').value = entry.price; }
    updateOutBalanceInfo();
}

function onOutCustomItem() {
    const val = document.getElementById('out-item').value.trim();
    if (val) { document.getElementById('out-item-select').value = ''; const entry = stockIn.find(s => s.item === val); if (entry) { document.getElementById('out-barcode').value = entry.barcode === 'N/A' ? '' : entry.barcode; document.getElementById('out-price').value = entry.price; } }
    updateOutBalanceInfo();
}

function updateOutBalanceInfo() {
    const item = document.getElementById('out-item').value.trim();
    const info = document.getElementById('out-balance-info');
    if (!info) return;
    if (!item) { info.innerHTML = ''; return; }
    const totalIn = stockIn.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
    const totalOut = stockOut.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
    const bal = totalIn - totalOut;
    info.innerHTML = `<span class="badge ${bal > 0 ? 'badge-success' : bal < 0 ? 'badge-danger' : 'badge-warning'}">Balance: ${bal} Pcs</span>`;
}

async function saveStockOut() {
    const customer = document.getElementById('out-customer').value.trim();
    const item = document.getElementById('out-item').value.trim();
    const qty = parseFloat(document.getElementById('out-qty').value) || 0;
    const price = parseFloat(document.getElementById('out-price').value) || 0;
    const barcode = document.getElementById('out-barcode').value.trim() || 'N/A';
    const date = document.getElementById('out-date').value;
    if (!customer || !item || qty <= 0) { showNotification('Customer, item and quantity are required!', 'error'); return; }
    const totalIn = stockIn.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
    const totalOut = stockOut.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
    const bal = totalIn - totalOut;
    if (qty > bal) { showNotification(`Insufficient stock! Available: ${bal}`, 'error'); return; }
    if (editingStockOutId !== null) {
        const { error } = await sb.from('stock_out').update({ date, customer, item_name: item, barcode, qty, price, total: qty * price }).eq('sr_no', editingStockOutId);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = stockOut.findIndex(s => s.id === editingStockOutId);
        if (idx > -1) stockOut[idx] = { ...stockOut[idx], date, customer, item, barcode, qty, price, total: qty * price };
        editingStockOutId = null;
        document.querySelector('#page-stock-out .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock Out';
        showNotification('Stock Out updated!', 'success');
    } else {
        const srNo = Date.now();
        const { error } = await sb.from('stock_out').insert({ sr_no: srNo, date, customer, item_name: item, barcode, qty, price, total: qty * price });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        stockOut.push({ id: srNo, date, customer, item, barcode, qty, price, total: qty * price });
        showNotification('Stock Out saved!', 'success');
    }
    renderStockOut(); updateBadges(); clearStockOutForm();
}

function renderStockOut() {
    const tbody = document.getElementById('stock-out-table');
    if (!tbody) return;
    if (stockOut.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="8">No entries found</td></tr>'; } else {
        tbody.innerHTML = [...stockOut].reverse().map((s, i) => `<tr><td>${i + 1}</td><td>${s.date}</td><td>${s.customer}</td><td>${s.item}</td><td><span class="qty-pill">${s.qty}</span></td><td>Rs. ${s.price.toFixed(2)}</td><td><span class="total-pill">Rs. ${s.total.toFixed(2)}</span></td><td><button class="btn btn-edit btn-xs" onclick="editStockOut(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteStockOut(${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    }
    document.getElementById('stock-out-count').textContent = stockOut.length;
}

function editStockOut(id) {
    const s = stockOut.find(x => x.id === id);
    if (!s) return;
    showPage('stock-out');
    document.getElementById('out-date').value = s.date || '';
    document.getElementById('out-customer').value = s.customer || '';
    document.getElementById('out-barcode').value = s.barcode === 'N/A' ? '' : s.barcode;
    document.getElementById('out-item').value = s.item;
    document.getElementById('out-item-select').value = s.item;
    document.getElementById('out-qty').value = s.qty;
    document.getElementById('out-price').value = s.price;
    editingStockOutId = id;
    document.querySelector('#page-stock-out .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock Out';
    updateOutBalanceInfo(); window.scrollTo(0, 0);
}

async function deleteStockOut(id) {
    if (!confirm('Delete this entry?')) return;
    const { error } = await sb.from('stock_out').delete().eq('sr_no', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    stockOut = stockOut.filter(s => s.id !== id);
    renderStockOut(); updateBadges(); showNotification('Entry deleted!', 'success');
}

function clearStockOutForm() { ['out-customer', 'out-item', 'out-barcode', 'out-qty', 'out-price'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); document.getElementById('out-item-select').value = ''; document.getElementById('out-balance-info').innerHTML = ''; showNotification('Form cleared', 'info'); }
function printStockOutHistory() { window.print(); }

function exportStockOut() {
    if (stockOut.length === 0) { showNotification('No data to export', 'warning'); return; }
    let csv = '#,Date,Customer,Item,Qty,Price,Total\n';
    stockOut.forEach((s, i) => { csv += `${i+1},${s.date},${s.customer},${s.item},${s.qty},${s.price},${s.total}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stock_out.csv'; a.click(); URL.revokeObjectURL(a.href);
    showNotification('Export successful!', 'success');
}

// ============================================================
// STOCK BALANCE
// ============================================================
function calcBalance() {
    const items = [...new Set([...stockIn.map(s => s.item), ...stockOut.map(s => s.item)])];
    const tbody = document.getElementById('balance-table');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="5">No stock found</td></tr>'; return; }
    tbody.innerHTML = items.map(item => {
        const inTotal = stockIn.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
        const outTotal = stockOut.filter(s => s.item === item).reduce((sum, s) => sum + s.qty, 0);
        const bal = inTotal - outTotal;
        const barcode = stockIn.find(s => s.item === item)?.barcode || '-';
        return `<tr><td><code>${barcode}</code></td><td><strong>${item}</strong></td><td>${inTotal}</td><td>${outTotal}</td><td><span style="font-weight:700;color:${bal > 0 ? '#22c99a' : bal < 0 ? '#ef4444' : '#64748b'};">${bal}</span></td></tr>`;
    }).join('');
}

function printStockBalance() { window.print(); }

// ============================================================
// SP STOCK IN - CRUD
// ============================================================
function spinBarcodeInput() {
    const bc = document.getElementById('spin-barcode').value.trim();
    if (PRODUCTS[bc]) document.getElementById('spin-item').value = PRODUCTS[bc];
    updateSPInPreview();
}

function updateSPInPreview() {
    const ctn = parseFloat(document.getElementById('spin-ctn').value) || 0;
    const pcsPerCtn = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
    const extra = parseFloat(document.getElementById('spin-extra').value) || 0;
    const total = (ctn * pcsPerCtn) + extra;
    const el = document.getElementById('spin-total-preview');
    if (el) el.textContent = 'Total Pcs: ' + total;
}

async function saveSPStockIn() {
    const item = document.getElementById('spin-item').value.trim();
    const barcode = document.getElementById('spin-barcode').value.trim() || 'N/A';
    const pcsPerCtn = parseFloat(document.getElementById('spin-pcsperctn').value) || 0;
    const ctn = parseFloat(document.getElementById('spin-ctn').value) || 0;
    const extra = parseFloat(document.getElementById('spin-extra').value) || 0;
    const price = parseFloat(document.getElementById('spin-price').value) || 0;
    const date = document.getElementById('spin-date').value;
    const vendor = document.getElementById('spin-vendor').value.trim() || 'N/A';
    if (!item) { showNotification('Item name is required!', 'error'); return; }
    const totalPcs = (ctn * pcsPerCtn) + extra;
    if (totalPcs <= 0) { showNotification('Enter quantity in Ctn or Extra Pcs!', 'error'); return; }
    if (editingSPInId !== null) {
        const { error } = await sb.from('sp_stock_in').update({ date, vendor, item_name: item, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: totalPcs, price, total: totalPcs * price }).eq('sr_no', editingSPInId);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = spStockIn.findIndex(s => s.id === editingSPInId);
        if (idx > -1) spStockIn[idx] = { ...spStockIn[idx], date, vendor, item, barcode, pcsPerCtn, ctn, extra, totalPcs, price, total: totalPcs * price };
        editingSPInId = null;
        document.querySelector('#page-sp-in .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock In';
        showNotification('SP Stock In updated!', 'success');
    } else {
        const srNo = Date.now();
        const { error } = await sb.from('sp_stock_in').insert({ sr_no: srNo, date, vendor, item_name: item, barcode, pcs_per_ctn: pcsPerCtn, ctn, extra, total_pcs: totalPcs, price, total: totalPcs * price });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        spStockIn.push({ id: srNo, date, vendor, item, barcode, pcsPerCtn, ctn, extra, totalPcs, price, total: totalPcs * price });
        showNotification('SP Stock In saved!', 'success');
    }
    renderSPIn(); updateBadges(); clearSPInForm();
}

function renderSPIn() {
    const tbody = document.getElementById('sp-in-table');
    if (!tbody) return;
    if (spStockIn.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="12">No entries found</td></tr>'; } else {
        tbody.innerHTML = [...spStockIn].reverse().map((s, i) => `<tr><td>${i + 1}</td><td>${s.date}</td><td>${s.item}</td><td><code>${s.barcode}</code></td><td>${s.vendor}</td><td>${s.ctn}</td><td>${s.extra}</td><td>${s.pcsPerCtn}</td><td><span class="qty-pill">${s.totalPcs}</span></td><td>Rs. ${s.price.toFixed(2)}</td><td><span class="total-pill">Rs. ${s.total.toFixed(2)}</span></td><td><button class="btn btn-edit btn-xs" onclick="editSPIn(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteSPIn(${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    }
}

function editSPIn(id) {
    const s = spStockIn.find(x => x.id === id);
    if (!s) return;
    showPage('sp-in');
    document.getElementById('spin-date').value = s.date || '';
    document.getElementById('spin-vendor').value = s.vendor === 'N/A' ? '' : s.vendor;
    document.getElementById('spin-barcode').value = s.barcode === 'N/A' ? '' : s.barcode;
    document.getElementById('spin-item').value = s.item;
    document.getElementById('spin-pcsperctn').value = s.pcsPerCtn;
    document.getElementById('spin-ctn').value = s.ctn;
    document.getElementById('spin-extra').value = s.extra;
    document.getElementById('spin-price').value = s.price;
    editingSPInId = id;
    document.querySelector('#page-sp-in .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock In';
    updateSPInPreview(); window.scrollTo(0, 0);
}

async function deleteSPIn(id) {
    if (!confirm('Delete this entry?')) return;
    const { error } = await sb.from('sp_stock_in').delete().eq('sr_no', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    spStockIn = spStockIn.filter(s => s.id !== id);
    renderSPIn(); updateBadges(); showNotification('Entry deleted!', 'success');
}

function clearSPInForm() { ['spin-vendor', 'spin-barcode', 'spin-item', 'spin-pcsperctn', 'spin-ctn', 'spin-extra', 'spin-price'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); updateSPInPreview(); showNotification('Form cleared', 'info'); }

// ============================================================
// SP STOCK OUT - CRUD
// ============================================================
function updateSPStoreList() {
    const stores = [...new Set(spStockOut.map(s => s.store))];
    const list = document.getElementById('spout-store-list');
    if (list) list.innerHTML = stores.map(s => `<option value="${s}">`).join('');
}

function spoutBarcodeInput() {
    const bc = document.getElementById('spout-barcode').value.trim();
    const info = document.getElementById('spout-balance-info');
    if (!info) return;
    if (bc) {
        const entry = spStockIn.find(s => s.barcode === bc);
        if (entry) {
            document.getElementById('spout-item').value = entry.item;
            const bal = getSPBalance(bc);
            const pcsPerCtn = entry.pcsPerCtn || 0;
            const ctnPart = pcsPerCtn > 0 ? Math.floor(bal / pcsPerCtn) : 0;
            const pcsPart = pcsPerCtn > 0 ? bal % pcsPerCtn : bal;
            info.innerHTML = `<span class="badge ${bal > 0 ? 'badge-success' : 'badge-danger'}">Available: ${bal} Pcs (${ctnPart} Ctn + ${pcsPart} Pcs)</span>`;
            if (!document.getElementById('spout-price').value && entry.price) { document.getElementById('spout-price').value = entry.price; }
        } else if (PRODUCTS[bc]) { document.getElementById('spout-item').value = PRODUCTS[bc]; info.innerHTML = `<span class="badge badge-warning">⚠ No stock found</span>`; } else { info.innerHTML = ''; }
    }
}

async function saveSPStockOut() {
    const store = document.getElementById('spout-store').value.trim();
    const barcode = document.getElementById('spout-barcode').value.trim();
    const item = document.getElementById('spout-item').value.trim();
    const qty = parseFloat(document.getElementById('spout-qty').value) || 0;
    const price = parseFloat(document.getElementById('spout-price').value) || 0;
    const date = document.getElementById('spout-date').value;
    if (!store || !barcode || !item || qty <= 0) { showNotification('Store, barcode, item and quantity are required!', 'error'); return; }
    const bal = getSPBalance(barcode);
    if (qty > bal) { showNotification(`Insufficient stock! Available: ${bal} Pcs`, 'error'); return; }
    if (editingSPOutId !== null) {
        const { error } = await sb.from('sp_stock_out').update({ date, store, barcode, item_name: item, qty, price, total: qty * price }).eq('sr_no', editingSPOutId);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = spStockOut.findIndex(s => s.id === editingSPOutId);
        if (idx > -1) spStockOut[idx] = { ...spStockOut[idx], date, store, barcode, item, qty, price, total: qty * price };
        editingSPOutId = null;
        document.querySelector('#page-sp-out .btn-primary').innerHTML = '<i class="fas fa-save"></i> Save Stock Out';
        showNotification('SP Stock Out updated!', 'success');
    } else {
        const srNo = Date.now();
        const { error } = await sb.from('sp_stock_out').insert({ sr_no: srNo, date, store, barcode, item_name: item, qty, price, total: qty * price });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        spStockOut.push({ id: srNo, date, store, barcode, item, qty, price, total: qty * price, invoiceTimestamp: null });
        showNotification('SP Stock Out saved!', 'success');
    }
    renderSPOut(); updateBadges(); clearSPOutForm();
}

function renderSPOut() {
    const from = document.getElementById('spout-from')?.value || '';
    const to = document.getElementById('spout-to')?.value || '';
    const search = (document.getElementById('spout-search')?.value || '').toLowerCase();
    let list = [...spStockOut].reverse();
    if (from) list = list.filter(s => s.date >= from);
    if (to) list = list.filter(s => s.date <= to);
    if (search) list = list.filter(s => (s.store + s.item + s.barcode).toLowerCase().includes(search));
    const tbody = document.getElementById('sp-out-table');
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="9">No entries found</td></tr>'; } else {
        tbody.innerHTML = list.map((s, i) => `<tr><td>${i + 1}</td><td>${s.date}</td><td><span class="badge badge-store">${s.store}</span></td><td>${s.item}</td><td><code>${s.barcode}</code></td><td><span class="qty-pill">${s.qty}</span></td><td>Rs. ${s.price.toFixed(2)}</td><td><span class="total-pill">Rs. ${s.total.toFixed(2)}</span></td><td><button class="btn btn-edit btn-xs" onclick="editSPOut(${s.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteSPOut(${s.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    }
}

function editSPOut(id) {
    const s = spStockOut.find(x => x.id === id);
    if (!s) return;
    showPage('sp-out');
    document.getElementById('spout-date').value = s.date || '';
    document.getElementById('spout-store').value = s.store || '';
    document.getElementById('spout-barcode').value = s.barcode || '';
    document.getElementById('spout-item').value = s.item;
    document.getElementById('spout-qty').value = s.qty;
    document.getElementById('spout-price').value = s.price;
    editingSPOutId = id;
    document.querySelector('#page-sp-out .btn-primary').innerHTML = '<i class="fas fa-edit"></i> Update Stock Out';
    window.scrollTo(0, 0);
}

async function deleteSPOut(id) {
    if (!confirm('Delete this entry?')) return;
    const { error } = await sb.from('sp_stock_out').delete().eq('sr_no', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    spStockOut = spStockOut.filter(s => s.id !== id);
    renderSPOut(); updateBadges(); showNotification('Entry deleted!', 'success');
}

function clearSPOutFilter() { ['spout-from', 'spout-to', 'spout-search'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); renderSPOut(); }
function clearSPOutForm() { ['spout-store', 'spout-barcode', 'spout-item', 'spout-qty', 'spout-price'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); document.getElementById('spout-balance-info').innerHTML = ''; showNotification('Form cleared', 'info'); }
function printSPOutTable() { window.print(); }

// ============================================================
// SP BALANCE
// ============================================================
function calcSPBalance() {
    const items = [...new Set([...spStockIn.map(s => s.item), ...spStockOut.map(s => s.item)])];
    const tbody = document.getElementById('sp-balance-table');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="6">No stock found</td></tr>'; return; }
    tbody.innerHTML = items.map(item => {
        const inTotal = spStockIn.filter(s => s.item === item).reduce((sum, s) => sum + (s.totalPcs || 0), 0);
        const outTotal = spStockOut.filter(s => s.item === item).reduce((sum, s) => sum + (s.qty || 0), 0);
        const bal = inTotal - outTotal;
        const barcode = spStockIn.find(s => s.item === item)?.barcode || '-';
        const pcsPerCtn = spStockIn.find(s => s.item === item)?.pcsPerCtn || 0;
        let ctnDisplay;
        if (pcsPerCtn > 0) { const ctnPart = Math.floor(bal / pcsPerCtn); const pcsPart = bal % pcsPerCtn; ctnDisplay = ctnPart > 0 && pcsPart > 0 ? `${ctnPart} Ctn + ${pcsPart} Pcs` : ctnPart > 0 ? `${ctnPart} Ctn` : `${pcsPart} Pcs`; } else { ctnDisplay = `${bal} Pcs`; }
        return `<tr><td><code>${barcode}</code></td><td><strong>${item}</strong></td><td>${inTotal}</td><td>${outTotal}</td><td><span style="font-weight:700;color:${bal > 0 ? '#22c99a' : bal < 0 ? '#ef4444' : '#64748b'};">${bal}</span></td><td>${ctnDisplay}</td></tr>`;
    }).join('');
}

function printSPBalance() { window.print(); }

// ============================================================
// LEDGER (Gulzar & Kashif)
// ============================================================
async function addLedgerEntry(person) {
    const date = document.getElementById(person + '-date').value;
    const credit = parseFloat(document.getElementById(person + '-credit').value) || 0;
    const debit = parseFloat(document.getElementById(person + '-debit').value) || 0;
    const note = document.getElementById(person + '-note').value.trim() || '';
    if (!date) { showNotification('Date is required!', 'error'); return; }
    if (credit === 0 && debit === 0) { showNotification('Enter either credit or debit!', 'error'); return; }
    const ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    const table = person === 'gulzar' ? 'gulzar_ledger' : 'kashif_ledger';
    if (editingLedgerId[person] !== null) {
        const { error } = await sb.from(table).update({ date, credit, debit, note }).eq('id', editingLedgerId[person]);
        if (error) { showNotification('Error updating: ' + error.message, 'error'); return; }
        const idx = ledger.findIndex(e => e.id === editingLedgerId[person]);
        if (idx > -1) ledger[idx] = { ...ledger[idx], date, credit, debit, note };
        editingLedgerId[person] = null;
        document.querySelector(`#page-${person} .btn-primary`).innerHTML = '<i class="fas fa-save"></i> Save Entry';
        showNotification('Entry updated!', 'success');
    } else {
        const id = Date.now();
        const { error } = await sb.from(table).insert({ id, date, credit, debit, note });
        if (error) { showNotification('Error saving: ' + error.message, 'error'); return; }
        ledger.push({ id, date, credit, debit, note });
        showNotification('Entry saved!', 'success');
    }
    if (person === 'gulzar') gulzarLedger = ledger; else kashifLedger = ledger;
    loadLedger(person); clearLedgerForm(person);
}

function loadLedger(person) {
    const ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    const totalCredit = ledger.reduce((sum, e) => sum + e.credit, 0);
    const totalDebit = ledger.reduce((sum, e) => sum + e.debit, 0);
    const balance = totalCredit - totalDebit;
    document.getElementById(person + '-total-credit').textContent = 'Rs. ' + totalCredit.toFixed(2);
    document.getElementById(person + '-total-debit').textContent = 'Rs. ' + totalDebit.toFixed(2);
    document.getElementById(person + '-balance').textContent = 'Rs. ' + balance.toFixed(2);
    document.getElementById(person + '-total-entries').textContent = ledger.length;
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = ledger.filter(e => e.date === today);
    const todayBody = document.getElementById(person + '-today-table');
    document.getElementById(person + '-today-count').textContent = todayEntries.length;
    if (!todayBody) return;
    if (todayEntries.length === 0) { todayBody.innerHTML = '<tr class="no-data"><td colspan="6">No entries today</td></tr>'; } else {
        let runningBalance = 0;
        todayBody.innerHTML = todayEntries.map(e => { runningBalance += e.credit - e.debit; return `<tr><td>${e.date}</td><td class="text-credit" style="color:#22c99a;font-weight:600;">${e.credit > 0 ? 'Rs. ' + e.credit.toFixed(2) : '-'}</td><td class="text-debit" style="color:#ef4444;font-weight:600;">${e.debit > 0 ? 'Rs. ' + e.debit.toFixed(2) : '-'}</td><td style="font-weight:700;color:#f59e0b;">Rs. ${runningBalance.toFixed(2)}</td><td>${e.note}</td><td><button class="btn btn-edit btn-xs" onclick="editLedgerEntry('${person}', ${e.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteLedgerEntry('${person}', ${e.id})"><i class="fas fa-trash"></i></button></td></tr>`; }).join('');
    }
    renderLedgerHistory(person);
}

function renderLedgerHistory(person) {
    const ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    const from = document.getElementById(person + '-from')?.value || '';
    const to = document.getElementById(person + '-to')?.value || '';
    let filtered = [...ledger];
    if (from) filtered = filtered.filter(e => e.date >= from);
    if (to) filtered = filtered.filter(e => e.date <= to);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    const body = document.getElementById(person + '-history-table');
    if (!body) return;
    if (filtered.length === 0) { body.innerHTML = '<tr class="no-data"><td colspan="6">No entries found</td></tr>'; } else {
        let runningBalance = 0;
        body.innerHTML = filtered.map(e => { runningBalance += e.credit - e.debit; return `<tr><td>${e.date}</td><td class="text-credit" style="color:#22c99a;font-weight:600;">${e.credit > 0 ? 'Rs. ' + e.credit.toFixed(2) : '-'}</td><td class="text-debit" style="color:#ef4444;font-weight:600;">${e.debit > 0 ? 'Rs. ' + e.debit.toFixed(2) : '-'}</td><td style="font-weight:700;color:#f59e0b;">Rs. ${runningBalance.toFixed(2)}</td><td>${e.note}</td><td><button class="btn btn-edit btn-xs" onclick="editLedgerEntry('${person}', ${e.id})"><i class="fas fa-edit"></i></button><button class="btn btn-danger btn-xs" onclick="deleteLedgerEntry('${person}', ${e.id})"><i class="fas fa-trash"></i></button></td></tr>`; }).join('');
    }
}

function editLedgerEntry(person, id) {
    const ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    const e = ledger.find(x => x.id === id);
    if (!e) return;
    document.getElementById(person + '-date').value = e.date;
    document.getElementById(person + '-credit').value = e.credit;
    document.getElementById(person + '-debit').value = e.debit;
    document.getElementById(person + '-note').value = e.note;
    editingLedgerId[person] = id;
    document.querySelector(`#page-${person} .btn-primary`).innerHTML = '<i class="fas fa-edit"></i> Update Entry';
    window.scrollTo(0, 0);
}

async function deleteLedgerEntry(person, id) {
    if (!confirm('Delete this entry?')) return;
    const table = person === 'gulzar' ? 'gulzar_ledger' : 'kashif_ledger';
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) { showNotification('Error deleting: ' + error.message, 'error'); return; }
    let ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    ledger = ledger.filter(e => e.id !== id);
    if (person === 'gulzar') gulzarLedger = ledger; else kashifLedger = ledger;
    loadLedger(person); showNotification('Entry deleted!', 'success');
}

function clearLedgerHistoryFilter(person) { document.getElementById(person + '-from').value = ''; document.getElementById(person + '-to').value = ''; renderLedgerHistory(person); showNotification('Filter cleared', 'info'); }
function clearLedgerForm(person) { document.getElementById(person + '-credit').value = ''; document.getElementById(person + '-debit').value = ''; document.getElementById(person + '-note').value = ''; showNotification('Form cleared', 'info'); }

function printLedger(person) {
    const ledger = person === 'gulzar' ? gulzarLedger : kashifLedger;
    const name = person === 'gulzar' ? 'Gulzar Bhai' : 'Kashif Bhai';
    const totalCredit = ledger.reduce((s, e) => s + e.credit, 0);
    const totalDebit = ledger.reduce((s, e) => s + e.debit, 0);
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<!DOCTYPE html><html><head><title>${name} Ledger</title>
    <style>body{font-family:Arial;font-size:12px;margin:20px;background:#fff}h2{text-align:center;color:#22c99a;font-size:24px}.header{text-align:center;border-bottom:3px solid #22c99a;padding-bottom:10px;margin-bottom:16px}.header p{color:#666;font-size:14px}.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0;padding:12px;background:#f8f9fa;border-radius:8px}.summary-box{text-align:center;padding:8px;border-radius:6px}.summary-box.credit{background:#e8f5f0;color:#22c99a}.summary-box.debit{background:#fee2e2;color:#ef4444}.summary-box.balance{background:#fef3c7;color:#f59e0b}.summary-box .label{font-size:10px;text-transform:uppercase;display:block;color:#666}.summary-box .value{font-size:20px;font-weight:800;display:block}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#22c99a;color:#fff;padding:8px 12px;text-align:left}td{padding:6px 12px;border-bottom:1px solid #ddd}.footer{text-align:center;margin-top:20px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#999}@media print{th{background:#22c99a !important;color:#fff !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.summary-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="header"><h2>KRT TRADERS</h2><p><strong>${name}</strong> — Ledger Statement</p></div><div class="summary"><div class="summary-box credit"><span class="label">Total Credit</span><span class="value">Rs. ${totalCredit.toFixed(2)}</span></div><div class="summary-box debit"><span class="label">Total Debit</span><span class="value">Rs. ${totalDebit.toFixed(2)}</span></div><div class="summary-box balance"><span class="label">Net Balance</span><span class="value">Rs. ${(totalCredit - totalDebit).toFixed(2)}</span></div></div><table><thead><tr><th>Date</th><th>Credit</th><th>Debit</th><th>Running Balance</th><th>Note</th></tr></thead><tbody>${ledger.map((e, i, arr) => { const running = arr.slice(0, i+1).reduce((s, x) => s + x.credit - x.debit, 0); return `<tr><td>${e.date}</td><td style="color:#22c99a;font-weight:600;">${e.credit > 0 ? 'Rs. ' + e.credit.toFixed(2) : '-'}</td><td style="color:#ef4444;font-weight:600;">${e.debit > 0 ? 'Rs. ' + e.debit.toFixed(2) : '-'}</td><td style="font-weight:700;color:#f59e0b;">Rs. ${running.toFixed(2)}</td><td>${e.note}</td></tr>`; }).join('')}</tbody></table><div class="footer"><p>Generated by KRT TRADERS ERP System | © ${new Date().getFullYear()} All rights reserved</p></div><script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>`);
    w.document.close();
}

// ============================================================
// SALARY
// ============================================================
function loadSalaryMonth() {
    const month = document.getElementById('sal-month')?.value;
    if (!month) return;
    if (!salaryData[month]) salaryData[month] = [];
    renderSalaryTable(month);
}

function renderSalaryTable(month) {
    const tbody = document.getElementById('sal-body');
    if (!tbody) return;
    const rows = salaryData[month] || [];
    if (rows.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="7">No employees — click "Add Employee"</td></tr>'; } else {
        tbody.innerHTML = rows.map((r, i) => { const balance = (r.salary - r.advance).toFixed(2); return `<tr><td>${i+1}</td><td><input type="text" value="${r.name}" oninput="updateSalRow('${month}',${i},'name',this.value)" placeholder="Name" style="width:100%;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><input type="number" value="${r.salary}" oninput="updateSalRow('${month}',${i},'salary',this.value)" placeholder="0" style="width:100px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><input type="number" value="${r.advance}" oninput="updateSalRow('${month}',${i},'advance',this.value)" placeholder="0" style="width:100px;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td class="row-total" style="font-weight:700;color:${balance >= 0 ? '#22c99a' : '#ef4444'};">Rs. ${balance}</td><td><input type="text" value="${r.note || ''}" oninput="updateSalRow('${month}',${i},'note',this.value)" placeholder="Note" style="width:100%;padding:4px 6px;border:1px solid #ddd;border-radius:4px;" /></td><td><button class="btn btn-danger btn-xs" onclick="removeSalRow('${month}',${i})"><i class="fas fa-times"></i></button></td></tr>`; }).join('');
    }
    updateSalaryTotals(month);
}

function addSalaryEmployeeRow() {
    const month = document.getElementById('sal-month')?.value;
    if (!month) { showNotification('Select month first!', 'error'); return; }
    if (!salaryData[month]) salaryData[month] = [];
    salaryData[month].push({ name: '', salary: 0, advance: 0, note: '' });
    renderSalaryTable(month); saveSalaryData();
}

function updateSalRow(month, idx, field, value) {
    const row = salaryData[month][idx];
    if (field === 'salary' || field === 'advance') row[field] = parseFloat(value) || 0;
    else row[field] = value;
    const balance = (row.salary - row.advance).toFixed(2);
    const tr = document.getElementById('sal-body')?.rows[idx];
    if (tr) { tr.cells[4].innerText = 'Rs. ' + balance; tr.cells[4].style.color = balance >= 0 ? '#22c99a' : '#ef4444'; }
    updateSalaryTotals(month);
}

function removeSalRow(month, idx) { salaryData[month].splice(idx, 1); renderSalaryTable(month); saveSalaryData(); }
function updateSalaryTotals(month) {
    const rows = salaryData[month] || [];
    const totalSalary = rows.reduce((s, r) => s + (Number(r.salary) || 0), 0);
    const totalAdvance = rows.reduce((s, r) => s + (Number(r.advance) || 0), 0);
    document.getElementById('sal-total-salary').innerText = 'Rs. ' + totalSalary.toFixed(2);
    document.getElementById('sal-total-advance').innerText = 'Rs. ' + totalAdvance.toFixed(2);
}

async function saveSalaryMonth() {
    const month = document.getElementById('sal-month')?.value;
    if (!month) { showNotification('Select month first!', 'error'); return; }
    await saveSalaryData(); showNotification('Salary month saved!', 'success');
}

async function saveSalaryData() {
    const rows = Object.entries(salaryData).map(([month, data]) => ({ month, rows: data }));
    for (const entry of rows) {
        const { error } = await sb.from('salary_data').upsert(entry, { onConflict: 'month' });
        if (error) console.error('Salary save error:', error);
    }
}

function renderSalarySheet() {
    const month = document.getElementById('sheet-month')?.value;
    const tbody = document.getElementById('sheet-body');
    if (!tbody) return;
    if (!month) { tbody.innerHTML = '<tr class="no-data"><td colspan="6">Select month</td></tr>'; document.getElementById('sheet-month-label').textContent = 'Select month'; document.getElementById('sheet-total-salary').innerText = 'Rs. 0'; document.getElementById('sheet-total-advance').innerText = 'Rs. 0'; document.getElementById('sheet-total-net').innerText = 'Rs. 0'; return; }
    document.getElementById('sheet-month-label').textContent = month;
    const rows = (salaryData[month] || []).filter(r => r.name && r.name.trim());
    if (rows.length === 0) { tbody.innerHTML = '<tr class="no-data"><td colspan="6">No data for this month</td></tr>'; } else {
        tbody.innerHTML = rows.map((r, i) => `<tr><td>${i+1}</td><td><strong>${r.name}</strong></td><td>Rs. ${(r.salary || 0).toFixed(2)}</td><td style="color:#ef4444;">Rs. ${(r.advance || 0).toFixed(2)}</td><td style="color:#22c99a;font-weight:700;">Rs. ${((r.salary || 0) - (r.advance || 0)).toFixed(2)}</td><td>${r.note || ''}</td></tr>`).join('');
    }
    const totalSalary = rows.reduce((s, r) => s + (Number(r.salary) || 0), 0);
    const totalAdvance = rows.reduce((s, r) => s + (Number(r.advance) || 0), 0);
    document.getElementById('sheet-total-salary').innerText = 'Rs. ' + totalSalary.toFixed(2);
    document.getElementById('sheet-total-advance').innerText = 'Rs. ' + totalAdvance.toFixed(2);
    document.getElementById('sheet-total-net').innerText = 'Rs. ' + (totalSalary - totalAdvance).toFixed(2);
}

function printSalarySheet() { window.print(); }

// ============================================================
// SETTINGS
// ============================================================
function saveSettings() {
    const taxRate = parseFloat(document.getElementById('tax-rate-setting').value) || 18;
    localStorage.setItem('taxRate', taxRate);
    document.getElementById('inv-tax-rate').value = taxRate;
    showNotification('Settings saved!', 'success');
}

function updateCurrency() {
    const currency = document.getElementById('currency-select').value;
    localStorage.setItem('currency', currency);
    calcInvoice();
    showNotification('Currency updated!', 'success');
}

// ============================================================
// BACKUP & RESTORE
// ============================================================
function backupData() {
    const data = { storeRates, invoices, taxInvoices, stockIn, stockOut, spStockIn, spStockOut, gulzarLedger, kashifLedger, salaryData, timestamp: new Date().toISOString(), version: '4.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `krt_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    showNotification('Backup created!', 'success');
}

function restoreData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.version) {
                storeRates = data.storeRates || [];
                invoices = data.invoices || [];
                taxInvoices = data.taxInvoices || [];
                stockIn = data.stockIn || [];
                stockOut = data.stockOut || [];
                spStockIn = data.spStockIn || [];
                spStockOut = data.spStockOut || [];
                gulzarLedger = data.gulzarLedger || [];
                kashifLedger = data.kashifLedger || [];
                salaryData = data.salaryData || {};
                location.reload();
                showNotification('Restore successful!', 'success');
            } else { showNotification('Invalid backup file!', 'error'); }
        } catch(err) { showNotification('Error restoring: ' + err.message, 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================================
// WHATSAPP & EMAIL
// ============================================================
function shareWhatsApp() {
    const customer = document.getElementById('inv-customer').value.trim();
    const total = document.getElementById('inv-final').textContent;
    if (!customer) { showNotification('Please save invoice first!', 'error'); return; }
    const msg = `🏪 *KRT TRADERS*%0A📄 *Invoice*%0A👤 Customer: ${customer}%0A💰 Total: ${total}%0A%0AThank you for your business!`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function shareWhatsAppTax() {
    const data = taxInvoiceData;
    if (!data) { showNotification('No tax invoice to share!', 'error'); return; }
    const msg = `🏪 *KRT TRADERS*%0A📄 *TAX INVOICE*%0A📋 #${data.invoice_no}%0A👤 Customer: ${data.customer_name}%0A💰 Net Amount: Rs. ${data.net_amount}%0A%0AThank you for your business!`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function emailInvoice() {
    const customer = document.getElementById('inv-customer').value.trim();
    const total = document.getElementById('inv-final').textContent;
    if (!customer) { showNotification('Please save invoice first!', 'error'); return; }
    const subject = `Invoice from KRT TRADERS`;
    const body = `Dear ${customer},\n\nThank you for your purchase!\n\nTotal: ${total}\n\nRegards,\nKRT TRADERS`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ============================================================
// BARCODE SCANNER
// ============================================================
function scanBarcode() {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        showNotification('Camera scanner coming soon! Use barcode input field.', 'info');
        document.querySelector('.inv-barcode')?.focus();
    } else {
        showNotification('Camera not supported. Please enter barcode manually.', 'warning');
        document.querySelector('.inv-barcode')?.focus();
    }
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================
function exportTaxInvoicePDF() { showNotification('PDF export coming soon!', 'info'); }
function exportInvoiceHistoryPDF() { showNotification('PDF export coming soon!', 'info'); }
function exportMonthlyReportPDF() { showNotification('PDF export coming soon!', 'info'); }

// ============================================================
// UPDATE BADGES
// ============================================================
function updateBadges() {
    document.getElementById('rates-badge').textContent = storeRates.length;
    document.getElementById('inv-hist-badge').textContent = invoices.length;
    document.getElementById('tax-hist-badge').textContent = taxInvoices.length;
    document.getElementById('dash-badge').textContent = invoices.length;
    document.getElementById('gulzar-badge').textContent = gulzarLedger.length;
    document.getElementById('kashif-badge').textContent = kashifLedger.length;
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); if (currentPage === 'cash-invoice') saveInvoiceNow(); }
    if (e.key === 'Escape') { closeInvModal(); }
    if (e.ctrlKey && e.key === 'p') { if (currentPage === 'cash-invoice') printInvoice(); }
});

// ============================================================
// INITIALIZE
// ============================================================
console.log('🏪 KRT TRADERS ERP System v4.3 Loaded!');
console.log('🔑 Password: admin123');
console.log('☁️ Data Mode: Supabase (Online)');
console.log('📊 Data loaded from Supabase Cloud');
