/****************************************************************
 * Farm2Door — Frontend single-file app
 ****************************************************************/

/* -----------------------
   DOM Elements
   ----------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* -----------------------
   Local Data Simulation
   ----------------------- */
const SampleSuppliers = [
  {id: 's1', name: 'Bagerhat Mango Collective', location: 'Bagerhat, Khulna', mfs:'01710000001', verified:true, products:'mango'},
  {id: 's2', name: 'Netrokona Vegetable Coop', location: 'Netrokona', mfs:'01710000002', verified:true, products:'potatoes, spring onion'},
  {id: 's3', name: 'Chattogram Tilapia Farm', location: 'Feni', mfs:'01710000003', verified:true, products:'tilapia fish'},
  {id: 's4', name: 'Gazipur Poultry Supplier', location: 'Gazipur', mfs:'01710000004', verified:true, products:'fresh chicken'}
];
const SampleProducts = [
  {id:'p1', title:'Mango (Langra)', unit:'kg', price:280, supplier:'s1', img:'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=400&auto=format&fit=crop'},
  {id:'p2', title:'Potatoes', unit:'kg', price:45, supplier:'s2', img:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400&auto=format&fit=crop'},
  {id:'p3', title:'Tilapia Fish', unit:'kg', price:420, supplier:'s3', img:'https://images.unsplash.com/photo-1598515598522-257367b625d3?q=80&w=400&auto=format&fit=crop'},
  {id:'p4', title:'Fresh Chicken (whole)', unit:'pc', price:360, supplier:'s4', img:'https://images.unsplash.com/photo-1604908176991-6a8a6a5e4013?q=80&w=400&auto=format&fit=crop'},
  {id:'p5', title:'Spring Onion', unit:'bunch', price:25, supplier:'s2', img:'https://images.unsplash.com/photo-1587428120153-2c1b72b8346e?q=80&w=400&auto=format&fit=crop'}
];

const storage = {
  get: (k, fallback = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function initData() {
    if (!storage.get('suppliers')) storage.set('suppliers', SampleSuppliers);
    if (!storage.get('products')) storage.set('products', SampleProducts);
    if (!storage.get('cart')) storage.set('cart', []);
    if (!storage.get('orders')) storage.set('orders', []);
}

/* -----------------------
   Rendering Functions
   ----------------------- */
function renderProducts() {
  const products = storage.get('products', []);
  const suppliers = storage.get('suppliers', []);
  const grid = $('#productGrid');
  grid.innerHTML = products.map(p => {
    const sup = suppliers.find(s => s.id === p.supplier) || { name: 'N/A' };
    return `
      <div class="card">
        <img src="${p.img}" alt="${p.title}" loading="lazy" />
        <div class="meta"><h4>${p.title}</h4><div class="price">৳ ${p.price}/${p.unit}</div></div>
        <div class="muted">${sup.name}</div>
        <div class="row">
          <input class="qty" type="number" min="0.25" step="0.25" value="1" id="qty-${p.id}" />
          <button class="btn primary add" data-add="${p.id}" style="margin-left:auto;">Add</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCart() {
  const cart = storage.get('cart', []);
  const products = storage.get('products', []);
  const cartList = $('#cartList');
  const cartCountEl = $('#cartCount');
  
  if (cart.length === 0) {
    cartList.innerHTML = '<div class="muted">Cart is empty</div>';
    cartCountEl.textContent = '0';
    $('#subtotal').textContent = '৳ 0';
    $('#placeOrderBtn').disabled = true;
    return;
  }
  
  $('#placeOrderBtn').disabled = false;
  cartCountEl.textContent = cart.length;
  let subtotal = 0;
  
  cartList.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) return '';
    const itemTotal = p.price * item.qty;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <div class="name">
          <div>${p.title}</div>
          <div class="muted">${item.qty} ${p.unit} &times; ৳${p.price}</div>
        </div>
        <div style="font-weight:600">৳ ${itemTotal.toFixed(0)}</div>
        <button class="btn ghost" data-rm="${item.productId}" style="padding:4px 8px;">✕</button>
      </div>
    `;
  }).join('');

  $('#subtotal').textContent = `৳ ${Math.round(subtotal)}`;
}

function renderSuppliers() {
  const suppliers = storage.get('suppliers', []);
  $('#supplierList').innerHTML = `<h4>Verified Suppliers</h4><table>
    <thead><tr><th>Name</th><th>Location</th><th>Products</th></tr></thead>
    <tbody>
      ${suppliers.filter(s => s.verified).map(s => `
        <tr><td>${s.name}</td><td>${s.location}</td><td>${s.products}</td></tr>
      `).join('')}
    </tbody>
  </table>`;
}

function renderOrdersList() {
  const orders = storage.get('orders', []);
  const products = storage.get('products', []);
  const ordersListEl = $('#ordersList');
  if (orders.length === 0) {
    ordersListEl.innerHTML = `<p class="muted">No orders found.</p>`;
    return;
  }
  ordersListEl.innerHTML = orders.slice().reverse().map(o => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between;">
        <strong>Order #${o.id.slice(-6)}</strong>
        <span class="badge">${o.status}</span>
      </div>
      <div class="muted">Placed: ${new Date(o.placedAt).toLocaleString('en-BD')} for ${o.deliveryDate} (${o.deliveryWindow})</div>
      <div class="muted">Customer: ${o.customer.name} (${o.customer.phone})</div>
      <table style="margin-top:8px;">
        ${o.items.map(i => {
          const p = products.find(prod => prod.id === i.productId);
          return `<tr><td>${p.title}</td><td>${i.qty} ${p.unit}</td></tr>`;
        }).join('')}
      </table>
      <div style="text-align:right; font-weight:bold; margin-top:8px;">Total: ৳ ${o.total} (${o.paymentMethod.toUpperCase()})</div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        ${o.status === 'Pending' ? `<button class="btn" data-status-update="${o.id}:QC Passed">Pass QC</button>` : ''}
        ${o.status === 'QC Passed' ? `<button class="btn" data-status-update="${o.id}:Out for Delivery">Send for Delivery</button>` : ''}
        ${o.status === 'Out for Delivery' ? `<button class="btn primary" data-status-update="${o.id}:Delivered">Mark Delivered</button>` : ''}
      </div>
    </div>
  `).join('');
}

/* -----------------------
   Core Logic
   ----------------------- */
function addToCart(productId, qty) {
  qty = parseFloat(qty);
  if (isNaN(qty) || qty <= 0) return alert('Invalid quantity');
  const cart = storage.get('cart', []);
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  storage.set('cart', cart);
  renderCart();
}

function removeFromCart(productId) {
    storage.set('cart', storage.get('cart', []).filter(i => i.productId !== productId));
    renderCart();
}

function showScene(targetScene) {
  $$('.scene').forEach(s => {
    s.classList.toggle('hidden', s.dataset.scene !== targetScene);
    s.classList.toggle('show', s.dataset.scene === targetScene);
  });
  // Auto-run functions when switching to certain scenes
  if (targetScene === 'orders') renderOrdersList();
  if (targetScene === 'onboard') renderSuppliers();
  if (targetScene === 'aggregate') $('#aggDate').valueAsDate = new Date();
}

/* -----------------------
   Event Listeners
   ----------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initData();
  renderProducts();
  renderCart();
  showScene('market');
  $('#deliveryDate').valueAsDate = new Date(); // Set default delivery date to today

  // Scene Switchers
  $$('[data-target]').forEach(btn => {
    btn.addEventListener('click', () => showScene(btn.dataset.target));
  });

  // Add to Cart
  $('#productGrid').addEventListener('click', e => {
    if (e.target.matches('[data-add]')) {
      const id = e.target.dataset.add;
      const qty = $(`#qty-${id}`).value;
      addToCart(id, qty);
    }
  });
  
  // Remove from Cart
  $('#cartList').addEventListener('click', e => {
    if (e.target.matches('[data-rm]')) {
      removeFromCart(e.target.dataset.rm);
    }
  });
  
  // MFS Instructions
  $('#paymentMethod').addEventListener('change', e => {
    const method = e.target.value;
    const mfsEl = $('#mfsInstruction');
    if (method === 'bkash') mfsEl.textContent = "Pay to bKash Merchant: 01... and enter TrxID.";
    else if (method === 'nagad') mfsEl.textContent = "Pay to Nagad Merchant: 01... and enter TrxID.";
    else if (method === 'rocket') mfsEl.textContent = "Pay to Rocket Merchant: 01... and enter TrxID.";
    else mfsEl.textContent = "You will pay the rider upon delivery.";
  });
  
  // Place Order Flow
  $('#placeOrderBtn').addEventListener('click', () => $('#orderModal').style.display = 'flex');
  $('#cancelOrderModal').addEventListener('click', () => $('#orderModal').style.display = 'none');
  $('#confirmOrderBtn').addEventListener('click', () => {
    const order = {
        id: 'o' + Date.now(),
        customer: { name: $('#custName').value, phone: $('#custPhone').value, address: $('#custAddress').value },
        items: storage.get('cart', []),
        total: Math.round(storage.get('cart', []).reduce((sum, item) => {
            const p = storage.get('products').find(prod => prod.id === item.productId);
            return sum + (p.price * item.qty);
        }, 0)),
        placedAt: new Date().toISOString(),
        deliveryDate: $('#deliveryDate').value,
        deliveryWindow: $('#deliveryWindow').value,
        paymentMethod: $('#paymentMethod').value,
        status: 'Pending'
    };
    if (!order.customer.name || !order.customer.phone || !order.customer.address) return alert('Please fill all customer details.');
    
    const allOrders = storage.get('orders', []);
    allOrders.push(order);
    storage.set('orders', allOrders);
    storage.set('cart', []);
    
    renderCart();
    $('#orderModal').style.display = 'none';
    alert(`Order confirmed! Your Order ID: ${order.id.slice(-6)}`);
  });
  
  // Farmer Onboarding
  $('#onboardForm').addEventListener('submit', e => {
    e.preventDefault();
    const newSupplier = {
        id: 's' + Date.now(),
        name: $('#fg_name').value,
        contact: $('#fg_contact').value,
        location: $('#fg_location').value,
        products: $('#fg_products').value,
        mfs: $('#fg_mfs').value,
        verified: false // A real system would have a verification step
    };
    const suppliers = storage.get('suppliers', []);
    suppliers.push(newSupplier);
    storage.set('suppliers', suppliers);
    alert(`${newSupplier.name} submitted for verification! For this demo, they won't appear in the list until 'verified' is set to true.`);
    e.target.reset();
  });
  $('#viewSuppliersBtn').addEventListener('click', renderSuppliers);
  
  // Order Aggregation
  $('#runAgg').addEventListener('click', () => {
    const date = $('#aggDate').value;
    const slot = $('#aggSlot').value;
    const orders = storage.get('orders', []).filter(o => o.deliveryDate === date && o.deliveryWindow === slot);
    if (orders.length === 0) {
      $('#aggResult').innerHTML = `<p class="muted">No orders found for ${date} (${slot}).</p>`;
      return;
    }
    
    const aggregation = {};
    const products = storage.get('products', []);
    const suppliers = storage.get('suppliers', []);

    orders.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (!aggregation[item.productId]) {
                aggregation[item.productId] = { totalQty: 0, product, supplier: suppliers.find(s => s.id === product.supplier) };
            }
            aggregation[item.productId].totalQty += item.qty;
        });
    });
    
    $('#aggResult').innerHTML = `<h4>Pickup List for ${date} (${slot})</h4><table>
        <thead><tr><th>Product</th><th>Total Quantity</th><th>Unit</th><th>Supplier</th><th>Contact</th></tr></thead>
        <tbody>
          ${Object.values(aggregation).map(agg => `
            <tr>
              <td>${agg.product.title}</td>
              <td>${agg.totalQty.toFixed(2)}</td>
              <td>${agg.product.unit}</td>
              <td>${agg.supplier.name}</td>
              <td>${agg.supplier.mfs}</td>
            </tr>
          `).join('')}
        </tbody>
    </table>`;
  });
  
  // Order Status Update
  $('#ordersList').addEventListener('click', e => {
    if (e.target.matches('[data-status-update]')) {
        const [orderId, newStatus] = e.target.dataset.statusUpdate.split(':');
        const orders = storage.get('orders', []);
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            storage.set('orders', orders);
            renderOrdersList();
        }
    }
  });
  
  // Theme Toggle
  $('#themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    storage.set('theme', newTheme);
  });
  
  // Reset Data
  $('#clearDataBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all demo data (orders, suppliers, cart)?')) {
          localStorage.clear();
          initData();
          window.location.reload();
      }
  });
  
  // Load saved theme
  const savedTheme = storage.get('theme', 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
});