let CARS = [];

// ჩამართვა
function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

function init() {
    fetch('cars.json').then(r => r.json()).then(data => {
        CARS = data;
        if (window.location.pathname.endsWith('car.html')) {
            showCarDetail();
        } else {
            setupFilters();
            renderList(CARS);
        }
    }).catch(err => {
        console.error('cars.json load failed', err);
        if (!window.location.pathname.endsWith('car.html')) {
            document.getElementById('list').innerHTML = '<div class="no-results">მონაცემები ჩაიტვირთა ვერ</div>';
        } else {
            document.getElementById('carDetail').innerText = 'მონაცემები ჩაიტვირთა ვერ';
        }
    });
}

function setupFilters() {
    const type = document.getElementById('typeSelect');
    const make = document.getElementById('makeSelect');
    const model = document.getElementById('modelSelect');
    const apply = document.getElementById('applyBtn');
    const reset = document.getElementById('resetBtn');
    const q = document.getElementById('q');

    // როცა ტიპი იცვლება -> განახლდეს მარკები და მოდელები
    type.addEventListener('change', () => {
        populateMakes();
        populateModels();
    });

    make.addEventListener('change', () => {
        populateModels();
    });

    apply.addEventListener('click', applyFilter);
    reset.addEventListener('click', () => {
        document.querySelectorAll('.filters input, .filters select').forEach(i => i.value = '');
        populateMakes();
        populateModels();
        renderList(CARS);
    });

    // თავდაპირველად ავავსოთ მარკები/მოდელები
    populateMakes();
    populateModels();

    // შეიცავს Enter-ის მხარდაჭერას ძებნაზე
    q.addEventListener('keydown', e => { if (e.key === 'Enter') applyFilter(); });

    // sort
    document.getElementById('sort').addEventListener('change', () => {
        applyFilter();
    });
}

function populateMakes() {
    const typeVal = document.getElementById('typeSelect').value;
    const makeSel = document.getElementById('makeSelect');
    makeSel.innerHTML = '<option value="">ყველა</option>';
    const makes = Array.from(new Set(CARS.filter(c => !typeVal || c.type === typeVal).map(c => c.make))).sort();
    makes.forEach(m => {
        const o = document.createElement('option'); o.value = m; o.textContent = m; makeSel.appendChild(o);
    });
}

function populateModels() {
    const typeVal = document.getElementById('typeSelect').value;
    const makeVal = document.getElementById('makeSelect').value;
    const modelSel = document.getElementById('modelSelect');
    modelSel.innerHTML = '<option value="">ყველა</option>';
    const models = Array.from(new Set(CARS
        .filter(c => (!typeVal || c.type === typeVal) && (!makeVal || c.make === makeVal))
        .map(c => c.model))).sort();
    models.forEach(m => {
        const o = document.createElement('option'); o.value = m; o.textContent = m; modelSel.appendChild(o);
    });
}

function applyFilter() {
    const typeVal = document.getElementById('typeSelect').value;
    const makeVal = document.getElementById('makeSelect').value;
    const modelVal = document.getElementById('modelSelect').value;
    const q = (document.getElementById('q').value || '').trim().toLowerCase();
    const ym = parseInt(document.getElementById('yearMin').value);
    const yM = parseInt(document.getElementById('yearMax').value);
    const pmin = parseFloat(document.getElementById('priceMin').value);
    const pmax = parseFloat(document.getElementById('priceMax').value);
    const sortVal = document.getElementById('sort').value;

    let out = CARS.slice();
    if (typeVal) out = out.filter(c => c.type === typeVal);
    if (makeVal) out = out.filter(c => c.make === makeVal);
    if (modelVal) out = out.filter(c => c.model === modelVal);
    if (q) out = out.filter(c => (c.make + ' ' + c.model).toLowerCase().includes(q) || (c.color || '').toLowerCase().includes(q));
    if (!Number.isNaN(ym)) out = out.filter(c => c.year >= ym);
    if (!Number.isNaN(yM)) out = out.filter(c => c.year <= yM);
    if (!Number.isNaN(pmin)) out = out.filter(c => c.price >= pmin);
    if (!Number.isNaN(pmax)) out = out.filter(c => c.price <= pmax);

    if (sortVal === 'priceAsc') out.sort((a, b) => a.price - b.price);
    else if (sortVal === 'priceDesc') out.sort((a, b) => b.price - a.price);
    else if (sortVal === 'yearDesc') out.sort((a, b) => b.year - a.year);

    renderList(out);
}

function renderList(items) {
    const container = document.getElementById('list');
    const count = document.getElementById('count');
    container.innerHTML = '';
    if (!items.length) {
        container.innerHTML = '<div class="no-results">შედეგი არ მოიძებნა</div>';
        count.textContent = '0';
        return;
    }
    count.textContent = items.length;
    items.forEach(c => {
        const card = document.createElement('div'); card.className = 'card';
        const img = c.images && c.images.length ? c.images[0] : '';
        card.innerHTML = `
      <img src="${img}" alt="${c.make} ${c.model}" />
      <div class="info">
        <div class="title">${c.make} ${c.model}</div>
        <div class="specs">${c.type} · ${c.year} · ${c.fuel || ''} · ${c.trans || ''}</div>
        <div class="price">₾${c.price.toLocaleString()}</div>
      </div>
    `;
        card.addEventListener('click', () => { window.location = `car.html?id=${c.id}`; });
        container.appendChild(card);
    });
}

function showCarDetail() {
    const id = parseInt(getParam('id'));
    const container = document.getElementById('carDetail');
    if (isNaN(id)) { container.innerText = 'მანქანა არ იპოვა (არასწორი id)'; return; }
    const car = CARS.find(c => c.id === id);
    if (!car) { container.innerText = 'მანქანა არ იპოვა'; return; }

    let html = `<h2>${car.make} ${car.model} (${car.year})</h2>`;
    html += `<div class="gallery">`;
    (car.images || []).forEach(img => {
        html += `<img src="${img}" alt="${car.make} ${car.model}" />`;
    });
    html += `</div>`;
    html += `<p><strong>ტიპი:</strong> ${car.type}</p>`;
    html += `<p><strong>ფასი:</strong> ₾${car.price}</p>`;
    if (car.fuel) html += `<p><strong>საწვავი:</strong> ${car.fuel}</p>`;
    if (car.trans) html += `<p><strong>ტრანს:</strong> ${car.trans}</p>`;
    if (car.mileage !== undefined) html += `<p><strong>გარბენი:</strong> ${car.mileage.toLocaleString()} კმ</p>`;
    if (car.color) html += `<p><strong>ფერი:</strong> ${car.color}</p>`;
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', init);
