let CARS = [];

// DOM ელემენტების ქეშირება - კოდის გასამარტივებლად
const DOM = {
    list: document.getElementById('list'),
    count: document.getElementById('count'),
    carDetail: document.getElementById('carDetail'),
    typeSelect: document.getElementById('typeSelect'),
    makeSelect: document.getElementById('makeSelect'),
    modelSelect: document.getElementById('modelSelect'),
    applyBtn: document.getElementById('applyBtn'),
    resetBtn: document.getElementById('resetBtn'),
    q: document.getElementById('q'),
    sort: document.getElementById('sort'),
    yearMin: document.getElementById('yearMin'),
    yearMax: document.getElementById('yearMax'),
    priceMin: document.getElementById('priceMin'),
    priceMax: document.getElementById('priceMax'),
};

/**
 * URL პარამეტრის წაკითხვა
 * @param {string} name - პარამეტრის სახელი
 * @returns {string | null}
 */
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

/**
 * HTML <option> ელემენტის შექმნა
 * @param {string} value
 * @param {string} text
 * @returns {HTMLOptionElement}
 */
const createOption = (value, text) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    return o;
};

// ---



/**
 * მონაცემების ჩატვირთვა და გვერდის ინიციალიზაცია
 */
async function init() {
    try {
        const response = await fetch('cars.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        CARS = await response.json();

        const isCarPage = window.location.pathname.endsWith('car.html');

        if (isCarPage) {
            showCarDetail();
        } else {
            setupFilters();
            renderList(CARS);
        }
    } catch (err) {
        console.error('cars.json load failed', err);
        const errorMessage = '<div class="no-results">მონაცემები ვერ ჩაიტვირთა</div>';
        const isCarPage = window.location.pathname.endsWith('car.html');

        if (isCarPage && DOM.carDetail) {
            DOM.carDetail.innerText = 'მონაცემები ვერ ჩაიტვირთა';
        } else if (DOM.list) {
            DOM.list.innerHTML = errorMessage;
        }
    }
}

// ---

/**
 * ფილტრის ინტერფეისის ინიციალიზაცია
 */
function setupFilters() {
    if (!DOM.typeSelect) return; // ამოწმებს, არის თუ არა ფილტრების გვერდზე

    // როცა ტიპი/მარკა იცვლება -> განახლდეს მარკები/მოდელები
    DOM.typeSelect.addEventListener('change', () => {
        populateMakes();
        populateModels();
    });

    DOM.makeSelect.addEventListener('change', populateModels);

    // ღილაკების დამმუშავებლები
    DOM.applyBtn.addEventListener('click', applyFilter);
    DOM.resetBtn.addEventListener('click', resetFilters);

    // სორტირება
    DOM.sort.addEventListener('change', applyFilter);
    
    // თავდაპირველად ავავსოთ მარკები/მოდელები
    populateMakes();
    populateModels();
}

/**
 * მარკების სელექტორის შევსება
 */
function populateMakes() {
    const typeVal = DOM.typeSelect.value;
    const makeSel = DOM.makeSelect;

    makeSel.innerHTML = ''; // დაცლა
    makeSel.appendChild(createOption('', 'ყველა'));

    const makes = CARS
        .filter(c => !typeVal || c.type === typeVal)
        .map(c => c.make);

    Array.from(new Set(makes))
        .sort()
        .forEach(m => makeSel.appendChild(createOption(m, m)));
}

/**
 * მოდელების სელექტორის შევსება
 */
function populateModels() {
    const typeVal = DOM.typeSelect.value;
    const makeVal = DOM.makeSelect.value;
    const modelSel = DOM.modelSelect;

    modelSel.innerHTML = ''; // დაცლა
    modelSel.appendChild(createOption('', 'ყველა'));

    const models = CARS
        .filter(c => (!typeVal || c.type === typeVal) && (!makeVal || c.make === makeVal))
        .map(c => c.model);

    Array.from(new Set(models))
        .sort()
        .forEach(m => modelSel.appendChild(createOption(m, m)));
}

/**
 * ფილტრების გასუფთავება და სიის განახლება
 */
function resetFilters() {
    // ფილტრის ველების გასუფთავება
    document.querySelectorAll('.filters input, .filters select').forEach(i => i.value = '');

    // სელექტორების განახლება
    populateMakes();
    populateModels();
    
    // სიის რენდერინგი
    renderList(CARS);
}

/**
 * ფილტრების ლოგიკის გამოყენება და სიის განახლება
 */
function applyFilter() {
    const { typeSelect, makeSelect, modelSelect, q, yearMin, yearMax, priceMin, priceMax, sort } = DOM;

    // ფილტრის მნიშვნელობების ობიექტში მოგროვება
    const filters = {
        type: typeSelect.value,
        make: makeSelect.value,
        model: modelSelect.value,
        query: (q.value || '').trim().toLowerCase(),
        yearMin: parseInt(yearMin.value),
        yearMax: parseInt(yearMax.value),
        priceMin: parseFloat(priceMin.value),
        priceMax: parseFloat(priceMax.value),
        sort: sort.value
    };

    let out = CARS.slice();

    // ფილტრაცია
    out = out.filter(c => {
        const queryMatch = !filters.query || 
            (c.make + ' ' + c.model).toLowerCase().includes(filters.query) || 
            (c.color || '').toLowerCase().includes(filters.query);

        return (
            (!filters.type || c.type === filters.type) &&
            (!filters.make || c.make === filters.make) &&
            (!filters.model || c.model === filters.model) &&
            queryMatch &&
            (Number.isNaN(filters.yearMin) || c.year >= filters.yearMin) &&
            (Number.isNaN(filters.yearMax) || c.year <= filters.yearMax) &&
            (Number.isNaN(filters.priceMin) || c.price >= filters.priceMin) &&
            (Number.isNaN(filters.priceMax) || c.price <= filters.priceMax)
        );
    });

    // სორტირება
    switch (filters.sort) {
        case 'priceAsc':
            out.sort((a, b) => a.price - b.price);
            break;
        case 'priceDesc':
            out.sort((a, b) => b.price - a.price);
            break;
        case 'yearDesc':
            out.sort((a, b) => b.year - a.year);
            break;
    }

    renderList(out);
}

// ---



/**
 * მანქანების სიის რენდერინგი
 * @param {Array<Object>} items - გასარენდერებელი მანქანების მასივი
 */
function renderList(items) {
    if (!DOM.list || !DOM.count) return;

    DOM.list.innerHTML = '';
    
    if (!items.length) {
        DOM.list.innerHTML = '<div class="no-results">შედეგი არ მოიძებნა</div>';
        DOM.count.textContent = '0';
        return;
    }
    
    DOM.count.textContent = items.length;

    const fragment = document.createDocumentFragment();

    items.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        const img = c.images && c.images.length ? c.images[0] : '';
        
        // თეგით ლითერალი (Template literal)
        card.innerHTML = `
            <img src="${img}" alt="${c.make} ${c.model}" loading="lazy" />
            <div class="info">
                <div class="title">${c.make} ${c.model}</div>
                <div class="specs">${c.type} · ${c.year} · ${c.fuel || ''} · ${c.trans || ''}</div>
                <div class="price">₾${(c.price || 0).toLocaleString('en-US')}</div>
            </div>
        `;

        card.addEventListener('click', () => { window.location = `car.html?id=${c.id}`; });
        fragment.appendChild(card);
    });
    
    DOM.list.appendChild(fragment);
}

/**
 * მანქანის დეტალების გვერდის რენდერინგი
 */
function showCarDetail() {
    if (!DOM.carDetail) return;
    
    const id = parseInt(getParam('id'));
    
    if (isNaN(id)) {
        DOM.carDetail.innerText = 'მანქანა არ იპოვა (არასწორი id)';
        return;
    }

    const car = CARS.find(c => c.id === id);
    
    if (!car) {
        DOM.carDetail.innerText = 'მანქანა არ იპოვა';
        return;
    }

    // დეტალების HTML-ის გენერირება
    let html = `<h2>${car.make} ${car.model} (${car.year})</h2>`;
    
    // გალერეა
    const galleryHtml = (car.images || [])
        .map(img => `<img src="${img}" alt="${car.make} ${car.model}" loading="lazy" />`)
        .join('');

    html += `<div class="gallery">${galleryHtml}</div>`;

    // სპეციფიკაციები
    const specs = [
        { label: 'ტიპი', value: car.type },
        { label: 'ფასი', value: `₾${car.price.toLocaleString('en-US')}` },
        { label: 'საწვავი', value: car.fuel },
        { label: 'ტრანს', value: car.trans },
        { label: 'გარბენი', value: car.mileage !== undefined ? `${car.mileage.toLocaleString('en-US')} კმ` : null },
        { label: 'ფერი', value: car.color }
    ];

    specs.forEach(spec => {
        if (spec.value) {
            html += `<p><strong>${spec.label}:</strong> ${spec.value}</p>`;
        }
    });
    
    DOM.carDetail.innerHTML = html;
}

// ---

document.addEventListener('DOMContentLoaded', init);