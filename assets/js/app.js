
const $$ = (s, root=document)=>root.querySelector(s);
const $$$ = (s, root=document)=>root.querySelectorAll(s);

function money(n){ return `$${n.toFixed(2)}`; }

// Load products
async function getProducts(){
  const res = await fetch('products.json');
  return await res.json();
}

// Cart state
function loadCart(){ try { return JSON.parse(localStorage.getItem('iasf_cart')||'[]'); } catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem('iasf_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){
  const cart = loadCart();
  const count = cart.reduce((a,i)=>a + Number(i.qty||0), 0);
  const el = $$('#cart-count');
  if(el) el.textContent = count;
}

// Add to cart
function addToCart(item){
  const cart = loadCart();
  const key = `${item.id}-${item.size}`;
  const found = cart.find(i => `${i.id}-${i.size}` === key);
  if(found){ found.qty += item.qty; }
  else{ cart.push(item); }
  saveCart(cart);
  alert('Added to cart!');
}

// Render featured / shop grids
async function renderFeatured(){
  const box = $$('#featured'); if(!box) return;
  const prods = (await getProducts()).slice(0,3);
  box.innerHTML = prods.map(p => cardHTML(p)).join('');
  bindCardEvents(box);
}
async function renderShop(){
  const grid = $$('#shop-grid'); if(!grid) return;
  const prods = await getProducts();
  grid.innerHTML = prods.map(p => cardHTML(p,true)).join('');
  bindCardEvents(grid);
}

// Card HTML
function cardHTML(p, showDesc=false){
  return `
  <div class="card">
    <img src="${p.img}" alt="${p.name}">
    <div class="pad">
      <div><strong>${p.name}</strong></div>
      ${showDesc ? `<div style="margin:6px 0">${p.desc}</div>` : ``}
      <div class="price">${money(p.price)}</div>
      <div class="controls">
        <label>Size
          <select data-id="${p.id}" class="size">
            <option value="S">S</option><option value="M" selected>M</option><option value="L">L</option>
            <option value="XL">XL</option><option value="XXL">XXL</option>
          </select>
        </label>
        <label>Qty
          <select data-id="${p.id}" class="qty"><option>1</option><option>2</option><option>3</option><option>4</option></select>
        </label>
        <button class="btn add" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  </div>`;
}

function bindCardEvents(root){
  root.querySelectorAll('.add').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      const id = e.target.dataset.id;
      const prods = await getProducts();
      const p = prods.find(x=>x.id===id);
      const size = root.querySelector(`.size[data-id="${id}"]`).value;
      const qty = Number(root.querySelector(`.qty[data-id="${id}"]`).value);
      addToCart({ id:p.id, name:p.name, price:p.price, size, qty, img:p.img });
    });
  });
}

// Render cart
function renderCart(){
  const table = $$('#cart-table tbody');
  const wrap = $$('#cart-table-wrap');
  const empty = $$('#cart-empty');
  if(!table) return;
  const cart = loadCart();
  if(cart.length===0){ empty.style.display='block'; wrap.style.display='none'; return; }
  empty.style.display='none'; wrap.style.display='block';
  table.innerHTML = '';
  let total = 0;
  cart.forEach((item, idx)=>{
    const sub = item.price * item.qty;
    total += sub;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${item.img}" alt="" style="height:44px;vertical-align:middle;margin-right:8px;border:1px solid #ddd;border-radius:8px"> ${item.name}</td>
      <td>${item.size}</td>
      <td><input type="number" min="1" value="${item.qty}" style="width:64px" data-idx="${idx}" class="qty-edit"></td>
      <td>${money(item.price)}</td>
      <td>${money(sub)}</td>
      <td><button data-idx="${idx}" class="btn remove">Remove</button></td>`;
    table.appendChild(tr);
  });
  $$('#cart-total').textContent = money(total);
  $$$('.qty-edit').forEach(inp=> inp.addEventListener('change', e=>{
    const i = Number(e.target.dataset.idx); const cart = loadCart(); cart[i].qty = Math.max(1, Number(e.target.value)||1); saveCart(cart); renderCart();
  }));
  $$$('.remove').forEach(btn=> btn.addEventListener('click', e=>{
    const i = Number(e.target.dataset.idx); const cart = loadCart(); cart.splice(i,1); saveCart(cart); renderCart();
  }));
}

// Checkout
function renderOrderSummary(){
  const box = $$('#order-summary'); if(!box) return;
  const cart = loadCart();
  if(cart.length===0){ box.innerHTML = 'Your cart is empty.'; return; }
  let html = '<h2>Order summary</h2><ul>';
  let total = 0;
  cart.forEach(i=>{ const sub=i.price*i.qty; total+=sub; html += `<li>${i.qty} × ${i.name} (${i.size}) — ${money(sub)}</li>`; });
  html += `</ul><strong>Total: ${money(total)}</strong>`;
  box.innerHTML = html;
}

function handleCheckoutForm(){
  const form = $$('#checkout-form'); if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    $$('#success-email').textContent = data.email || '';
    $$('#checkout-success').style.display = 'block';
    localStorage.removeItem('iasf_cart'); updateCartCount();
  });
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  renderFeatured();
  renderShop();
  renderCart();
  renderOrderSummary();
  handleCheckoutForm();
});
