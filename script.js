document.addEventListener("DOMContentLoaded", async () => {
    // 1. Safe Load: Animation start
    document.body.classList.add("js-loaded");
    try { lucide.createIcons(); } catch (e) { console.log("Icons failed to load"); }

    let allFoodData = [];
    let currentDisplayedData = []; 
    let isShowingAll = false;      

    // ==========================================
    // DARK MODE LOGIC (SAFE VERSION)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            if(themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
        }

        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                if(themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
            } else {
                localStorage.setItem('theme', 'light');
                if(themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
            }
            try { lucide.createIcons(); } catch(e){} 
        });
    }

    // ==========================================
    // MOBILE MENU & CART LOGIC
    // ==========================================
    const mobileBtn = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('active'));
        mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mobileMenu.classList.remove('active')));
    }

    let cart = [];
    const cartCount = document.getElementById('cart-count');
    const cartPanel = document.getElementById('cart-panel');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    const toast = document.getElementById('toast');
    let toastTimer;

    function showToast(msg) {
        if(!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function updateCart() {
        if(!cartCount || !cartTotal || !cartList) return;
        
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartTotal.textContent = '₹' + cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartList.innerHTML = '';
        if (cart.length === 0) {
            cartList.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:2rem;">Your cart is empty</p>';
            return;
        }

        cart.forEach(item => {
            cartList.innerHTML += `
              <div class="cart-item">
                <div>
                  <h4 style="font-size: 0.95rem; font-weight: 600;">${item.name}</h4>
                  <p style="font-size: 0.85rem; color: var(--text-muted);">₹${item.price}</p>
                </div>
                <div class="qty-controls">
                  <button class="qty-btn dec" data-id="${item.id}">-</button>
                  <span style="width: 1.5rem; text-align: center; font-weight: 600;">${item.quantity}</span>
                  <button class="qty-btn inc" data-id="${item.id}">+</button>
                </div>
              </div>
            `;
        });
    }

    document.getElementById('open-cart')?.addEventListener('click', () => { cartPanel.classList.add('open'); cartOverlay.classList.add('open'); });
    document.getElementById('close-cart')?.addEventListener('click', () => { cartPanel.classList.remove('open'); cartOverlay.classList.remove('open'); });
    cartOverlay?.addEventListener('click', () => { cartPanel.classList.remove('open'); cartOverlay.classList.remove('open'); });

    cartList?.addEventListener('click', (e) => {
        if (!e.target.dataset.id) return;
        const id = e.target.dataset.id;
        const item = cart.find(i => i.id === id);
        if (e.target.classList.contains('inc')) item.quantity++;
        else if (e.target.classList.contains('dec')) item.quantity > 1 ? item.quantity-- : cart = cart.filter(i => i.id !== id);
        updateCart();
    });

    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        if (cart.length === 0) return showToast('Add items first!');
        showToast('Order Placed Successfully!');
        cart = []; updateCart();
        cartPanel.classList.remove('open'); cartOverlay.classList.remove('open');
    });

    function addItemToCart(name, price) {
        const existing = cart.find(i => i.name === name);
        existing ? existing.quantity++ : cart.push({ id: Math.random().toString(), name, price, quantity: 1 });
        updateCart();
        showToast(`${name} added!`);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ==========================================
    // MENU FETCH & DISPLAY LOGIC (VIEW MORE / LESS)
    // ==========================================
    const viewMoreContainer = document.getElementById('view-more-container');
    const viewMoreBtn = document.getElementById('view-more-btn');
    const menuGrid = document.getElementById('menu-grid');

    try {
        const response = await fetch('Food.json');
        if (!response.ok) throw new Error("Could not load JSON");
        allFoodData = await response.json();
        
        handleMenuDisplay(allFoodData, true); 
    } catch (error) {
        if(menuGrid) menuGrid.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Failed to load menu data.</p>";
    }

    function shuffleArray(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function handleMenuDisplay(dataArray, randomize = false) {
        currentDisplayedData = randomize ? shuffleArray(dataArray) : dataArray;
        isShowingAll = false; 
        renderMenu(currentDisplayedData);
    }

    function renderMenu(itemsToRender) {
        if (!menuGrid) return;
        
        let finalItems = itemsToRender;
        
        // Check karega items 8 se jyada hai ya nahi
        if (itemsToRender.length > 8) {
            if(viewMoreContainer) viewMoreContainer.style.display = 'block'; 
            
            if (!isShowingAll) {
                finalItems = itemsToRender.slice(0, 8);
                // Text 'View More' kar do
                if(viewMoreBtn) viewMoreBtn.innerHTML = 'View More Items <i data-lucide="chevron-down" style="width: 18px;"></i>';
            } else {
                // Text 'View Less' kar do
                if(viewMoreBtn) viewMoreBtn.innerHTML = 'View Less Items <i data-lucide="chevron-up" style="width: 18px;"></i>';
            }
        } else {
            if(viewMoreContainer) viewMoreContainer.style.display = 'none';  
        }
        
        menuGrid.innerHTML = finalItems.map(item => `
            <article class="food-card reveal" data-category="${item.category}">
              <img class="food-img" src="${item.image}" alt="${item.title}">
              <div class="food-content">
                <div class="food-header">
                  <h3 class="heading-font food-title">${item.title}</h3>
                  <span class="food-rating"><i data-lucide="star" style="width:16px; fill:#f59e0b"></i>${item.rating}</span>
                </div>
                <p class="food-desc">${item.description}</p>
                <div class="food-footer">
                  <span class="food-price">₹${item.price}</span><button class="add-btn" data-name="${item.title}" data-price="${item.price}">Add</button>
                </div>
              </div>
            </article>
        `).join('');

        try { lucide.createIcons(); } catch (e) { }
        menuGrid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        menuGrid.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => addItemToCart(e.target.getAttribute('data-name'), parseInt(e.target.getAttribute('data-price'))));
        });
    }

    // Toggle logic for View More / View Less
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            isShowingAll = !isShowingAll; // True hai toh False, False hai toh True
            renderMenu(currentDisplayedData); 
            
            // Jab View Less click ho, toh smoothly upar menu par scroll kar do
            if (!isShowingAll) {
                document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Category Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            if (filter === 'all') {
                handleMenuDisplay(allFoodData, true); 
            } else {
                const filteredData = allFoodData.filter(item => item.category === filter);
                handleMenuDisplay(filteredData, false); 
            }
        });
    });

    // ==========================================
    // SEARCH & FORMS
    // ==========================================
    const searchOverlay = document.getElementById('search-overlay');
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    function closeSearch() {
        searchOverlay?.classList.remove('open');
        searchPanel?.classList.remove('open');
        if(searchInput) searchInput.value = '';
        renderSearchResults('');
    }

    document.getElementById('open-search')?.addEventListener('click', () => {
        searchOverlay?.classList.add('open');
        searchPanel?.classList.add('open');
        setTimeout(() => searchInput?.focus(), 150);
    });
    document.getElementById('close-search')?.addEventListener('click', closeSearch);
    searchOverlay?.addEventListener('click', closeSearch);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && searchPanel?.classList.contains('open')) closeSearch(); });

    function renderSearchResults(query) {
        if(!searchResults) return;
        const q = query.trim().toLowerCase();
        if (!q) {
            searchResults.innerHTML = '<p class="search-hint">Start typing to search our menu 🍽️</p>';
            return;
        }
        const matches = allFoodData.filter(item => item.title.toLowerCase().includes(q));
        if (matches.length === 0) {
            searchResults.innerHTML = '<p class="search-empty">No dishes found for "' + query + '". Try another name.</p>';
            return;
        }
        searchResults.innerHTML = matches.map(item => `
          <div class="search-result-item">
            <img class="search-result-img" src="${item.image}" alt="${item.title}">
            <div class="search-result-info">
              <h4>${item.title.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark class="search-highlight">$1</mark>')}</h4>
              <p>₹${item.price}</p>
            </div>
            <button class="search-add-btn" data-name="${item.title}" data-price="${item.price}">Add</button>
          </div>
        `).join('');
    }

    searchInput?.addEventListener('input', (e) => renderSearchResults(e.target.value));
    searchResults?.addEventListener('click', (e) => {
        if (!e.target.classList.contains('search-add-btn')) return;
        addItemToCart(e.target.dataset.name, parseInt(e.target.dataset.price));
    });

    document.getElementById('contact-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const successMsg = document.getElementById('contact-success');
        if(successMsg) {
            successMsg.style.display = 'block';
            setTimeout(() => successMsg.style.display = 'none', 4000);
        }
        e.target.reset();
    });
    
    document.getElementById('news-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const newsMsg = document.getElementById('news-success');
        if(newsMsg) {
            newsMsg.style.display = 'block';
            setTimeout(() => newsMsg.style.display = 'none', 4000);
        }
        e.target.reset();
    });
});