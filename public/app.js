const API_BASE = '/api';
let cachedFruits = [];

function showAlert(message, type = 'success') {
  const box = document.getElementById('alertBox');
  box.textContent = message;
  box.className = `alert ${type}`;
  setTimeout(() => {
    box.className = 'alert hidden';
  }, 6000);
}

function openTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// 1. Load Fruits & Stock
async function loadStockAndFruits() {
  const [fruitsRes, stockRes, lowRes] = await Promise.all([
    fetchJSON(`${API_BASE}/fruits`),
    fetchJSON(`${API_BASE}/fruits/stock`),
    fetchJSON(`${API_BASE}/fruits/stock/low?threshold=10`)
  ]);

  cachedFruits = fruitsRes.data;

  document.getElementById('stockTableBody').innerHTML = stockRes.data.map(s => `
    <tr>
      <td><strong>${s.fruit_name}</strong></td>
      <td style="text-transform: capitalize;">${s.packaging_size}</td>
      <td>${s.available_quantity}</td>
      <td>
        <span class="badge ${s.available_quantity <= 10 ? 'badge-low' : 'badge-ok'}">
          ${s.available_quantity <= 10 ? 'Low Stock' : 'In Stock'}
        </span>
      </td>
    </tr>
  `).join('');

  document.getElementById('lowStockTableBody').innerHTML = lowRes.data.length
    ? lowRes.data.map(s => `
        <tr>
          <td>${s.fruit_name}</td>
          <td style="text-transform: capitalize;">${s.packaging_size}</td>
          <td><strong>${s.available_quantity}</strong></td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">All items are well stocked.</td></tr>';
}

document.getElementById('fruitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await fetchJSON(`${API_BASE}/fruits`, {
      method: 'POST',
      body: JSON.stringify({
        fruit_name: document.getElementById('fruitName').value,
        description: document.getElementById('fruitDesc').value
      })
    });
    e.target.reset();
    showAlert('Fruit registered with small, medium, and large stock initialized.');
    await refreshAll();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// 2. Suppliers & Vendors
async function loadSuppliersAndVendors() {
  const [supRes, venRes] = await Promise.all([
    fetchJSON(`${API_BASE}/suppliers`),
    fetchJSON(`${API_BASE}/vendors`)
  ]);

  document.getElementById('suppliersTableBody').innerHTML = supRes.data.map(s => `
    <tr>
      <td>${s.business_name}</td>
      <td>${s.province}</td>
      <td>${s.phone}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSupplier(${s.supplier_id})">Delete</button></td>
    </tr>
  `).join('');

  document.getElementById('purchaseSupplierSelect').innerHTML = supRes.data.map(s =>
    `<option value="${s.supplier_id}">${s.business_name} (${s.province})</option>`
  ).join('');

  renderVendorsTable(venRes.data);

  document.getElementById('saleVendorSelect').innerHTML = venRes.data.map(v =>
    `<option value="${v.vendor_id}">${v.vendor_name} - ${v.location}</option>`
  ).join('');
}

function renderVendorsTable(vendors) {
  document.getElementById('vendorsTableBody').innerHTML = vendors.map(v => `
    <tr>
      <td>${v.vendor_name}</td>
      <td>${v.phone_number}</td>
      <td>${v.location}</td>
    </tr>
  `).join('');
}

async function searchVendors() {
  const q = document.getElementById('vendorSearchInput').value.trim();
  const res = q
    ? await fetchJSON(`${API_BASE}/vendors/search?q=${encodeURIComponent(q)}`)
    : await fetchJSON(`${API_BASE}/vendors`);
  renderVendorsTable(res.data);
}

document.getElementById('supplierForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await fetchJSON(`${API_BASE}/suppliers`, {
      method: 'POST',
      body: JSON.stringify({
        business_name: document.getElementById('supName').value,
        contact_person: document.getElementById('supContact').value,
        phone: document.getElementById('supPhone').value,
        province: document.getElementById('supProvince').value,
        address: document.getElementById('supAddress').value
      })
    });
    e.target.reset();
    showAlert('Supplier registered successfully.');
    await loadSuppliersAndVendors();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

async function deleteSupplier(id) {
  try {
    await fetchJSON(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
    showAlert('Supplier deleted.');
    await loadSuppliersAndVendors();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

document.getElementById('vendorForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await fetchJSON(`${API_BASE}/vendors`, {
      method: 'POST',
      body: JSON.stringify({
        vendor_name: document.getElementById('venName').value,
        phone_number: document.getElementById('venPhone').value,
        location: document.getElementById('venLocation').value
      })
    });
    e.target.reset();
    showAlert('Vendor registered successfully.');
    await loadSuppliersAndVendors();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

// 3. Purchases
function buildFruitOptions() {
  return cachedFruits.map(f => `<option value="${f.fruit_id}">${f.fruit_name}</option>`).join('');
}

function addPurchaseItemRow() {
  const container = document.getElementById('purchaseItemsContainer');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <select class="p-fruit">${buildFruitOptions()}</select>
    <select class="p-size">
      <option value="small">Small</option>
      <option value="medium">Medium</option>
      <option value="large">Large</option>
    </select>
    <input type="number" class="p-qty" min="1" value="5" oninput="recalcPurchaseTotal()" placeholder="Qty" required />
    <input type="number" class="p-cost" min="0" step="0.01" value="40" oninput="recalcPurchaseTotal()" placeholder="Unit Cost" required />
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); recalcPurchaseTotal()">X</button>
  `;
  container.appendChild(row);
  recalcPurchaseTotal();
}

function recalcPurchaseTotal() {
  let total = 0;
  document.querySelectorAll('#purchaseItemsContainer .item-row').forEach(row => {
    const qty = Number(row.querySelector('.p-qty').value || 0);
    const cost = Number(row.querySelector('.p-cost').value || 0);
    total += qty * cost;
  });
  document.getElementById('purchaseTotalDisplay').textContent = total.toFixed(2);
}

document.getElementById('purchaseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const items = [];
  document.querySelectorAll('#purchaseItemsContainer .item-row').forEach(row => {
    items.push({
      fruit_id: Number(row.querySelector('.p-fruit').value),
      packaging_size: row.querySelector('.p-size').value,
      quantity: Number(row.querySelector('.p-qty').value),
      unit_cost: Number(row.querySelector('.p-cost').value)
    });
  });

  try {
    await fetchJSON(`${API_BASE}/purchases`, {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: Number(document.getElementById('purchaseSupplierSelect').value),
        items
      })
    });
    showAlert('Purchase recorded and stock updated!');
    await refreshAll();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

async function loadPurchases() {
  const res = await fetchJSON(`${API_BASE}/purchases`);
  document.getElementById('purchasesTableBody').innerHTML = res.data.map(p => `
    <tr>
      <td>#${p.purchase_id}</td>
      <td>${p.supplier_name}</td>
      <td>${new Date(p.purchase_date).toLocaleDateString()}</td>
      <td>M ${Number(p.total_amount).toFixed(2)}</td>
    </tr>
  `).join('');
}

// 4. Sales & Payments
function addSaleItemRow() {
  const container = document.getElementById('saleItemsContainer');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <select class="s-fruit">${buildFruitOptions()}</select>
    <select class="s-size">
      <option value="small">Small</option>
      <option value="medium">Medium</option>
      <option value="large">Large</option>
    </select>
    <input type="number" class="s-qty" min="1" value="2" oninput="recalcSaleTotal()" placeholder="Qty" required />
    <input type="number" class="s-price" min="0" step="0.01" value="65" oninput="recalcSaleTotal()" placeholder="Unit Price" required />
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove(); recalcSaleTotal()">X</button>
  `;
  container.appendChild(row);
  recalcSaleTotal();
}

function recalcSaleTotal() {
  let total = 0;
  document.querySelectorAll('#saleItemsContainer .item-row').forEach(row => {
    const qty = Number(row.querySelector('.s-qty').value || 0);
    const price = Number(row.querySelector('.s-price').value || 0);
    total += qty * price;
  });
  document.getElementById('saleTotalDisplay').textContent = total.toFixed(2);
}

document.getElementById('saleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const items = [];
  document.querySelectorAll('#saleItemsContainer .item-row').forEach(row => {
    items.push({
      fruit_id: Number(row.querySelector('.s-fruit').value),
      packaging_size: row.querySelector('.s-size').value,
      quantity: Number(row.querySelector('.s-qty').value),
      unit_price: Number(row.querySelector('.s-price').value)
    });
  });

  try {
    await fetchJSON(`${API_BASE}/sales`, {
      method: 'POST',
      body: JSON.stringify({
        vendor_id: Number(document.getElementById('saleVendorSelect').value),
        payment_method: document.getElementById('salePaymentMethod').value,
        amount_paid: Number(document.getElementById('saleAmountPaid').value),
        items
      })
    });
    showAlert('Sale completed and stock deducted!');
    await refreshAll();
  } catch (err) {
    showAlert(err.message, 'error');
  }
});

async function loadSalesAndBalances() {
  const [salesRes, balRes] = await Promise.all([
    fetchJSON(`${API_BASE}/sales`),
    fetchJSON(`${API_BASE}/sales/balances`)
  ]);

  document.getElementById('balancesTableBody').innerHTML = balRes.data.map(b => `
    <tr>
      <td>${b.vendor_name}</td>
      <td>${Number(b.total_billed).toFixed(2)}</td>
      <td>${Number(b.total_paid).toFixed(2)}</td>
      <td><strong>M ${Number(b.outstanding_balance).toFixed(2)}</strong></td>
    </tr>
  `).join('');

  document.getElementById('salesTableBody').innerHTML = salesRes.data.map(s => {
    const badgeClass = s.payment_status === 'PAID' ? 'badge-ok' : (s.payment_status === 'PARTIALLY_PAID' ? 'badge-partial' : 'badge-low');
    return `
      <tr>
        <td>#${s.sale_id}</td>
        <td>${s.vendor_name}</td>
        <td>${s.payment_method}</td>
        <td><span class="badge ${badgeClass}">${s.payment_status}</span></td>
        <td>M ${Number(s.total_amount).toFixed(2)}</td>
        <td>M ${Number(s.outstanding_balance).toFixed(2)}</td>
        <td>
          ${Number(s.outstanding_balance) > 0
            ? `<button class="btn btn-primary btn-sm" onclick="payBalance(${s.sale_id}, ${s.outstanding_balance})">Settle</button>`
            : '✓'}
        </td>
      </tr>
    `;
  }).join('');
}

async function payBalance(saleId, remaining) {
  const input = prompt(`Enter payment amount (Remaining balance: M ${Number(remaining).toFixed(2)}):`, remaining);
  if (!input) return;
  try {
    await fetchJSON(`${API_BASE}/sales/${saleId}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ additional_payment: Number(input), payment_method: 'Mobile Money' })
    });
    showAlert('Payment updated successfully!');
    await refreshAll();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function loadReports() {
  const [topFruitsRes, topVendorRes, stockRes] = await Promise.all([
    fetchJSON(`${API_BASE}/reports/top-fruits`),
    fetchJSON(`${API_BASE}/reports/top-vendor`),
    fetchJSON(`${API_BASE}/reports/stock`)
  ]);

  document.getElementById('topFruitsBody').innerHTML = topFruitsRes.data.length
    ? topFruitsRes.data.map(f => `
        <tr>
          <td>${f.fruit_name}</td>
          <td>${f.times_sold}</td>
          <td><strong>${f.total_boxes_sold}</strong></td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">No sales recorded yet.</td></tr>';

  const tv = topVendorRes.data;
  document.getElementById('topVendorBox').innerHTML = tv
    ? `<strong>${tv.vendor_name}</strong> (${tv.location}) — Total Boxes Purchased: <strong>${tv.total_boxes_purchased}</strong>`
    : 'No vendor purchases recorded yet.';

  document.getElementById('reportStockBody').innerHTML = stockRes.data.map(s => `
    <tr>
      <td>${s.fruit_name}</td>
      <td style="text-transform: capitalize;">${s.packaging_size}</td>
      <td>${s.available_quantity}</td>
    </tr>
  `).join('');

  await loadRevenueReport();
}

async function loadRevenueReport() {
  const startDate = document.getElementById('repStartDate').value;
  const endDate = document.getElementById('repEndDate').value;
  try {
    const res = await fetchJSON(`${API_BASE}/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
    const d = res.data;
    document.getElementById('revenueResultBox').innerHTML = `
      Transactions: <strong>${d.total_transactions}</strong><br/>
      Total Sales Revenue: <strong>M ${Number(d.total_revenue).toFixed(2)}</strong><br/>
      Total Collected: <strong>M ${Number(d.total_collected).toFixed(2)}</strong> |
      Outstanding Credit: <strong>M ${Number(d.total_outstanding).toFixed(2)}</strong>
    `;
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function refreshAll() {
  await loadStockAndFruits();
  await loadSuppliersAndVendors();
  await loadPurchases();
  await loadSalesAndBalances();
  await loadReports();

  if (document.getElementById('purchaseItemsContainer').children.length === 0) {
    addPurchaseItemRow();
  }
  if (document.getElementById('saleItemsContainer').children.length === 0) {
    addSaleItemRow();
  }
}

window.addEventListener('DOMContentLoaded', refreshAll);
