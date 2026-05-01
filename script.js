document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('masonry-grid');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // SPA navigation elements
    const mainView = document.getElementById('main-view');
    const n8nSection = document.getElementById('n8n-section');
    const navN8n = document.getElementById('nav-n8n');
    const mainTitle = document.querySelector('.main-title');

    // Sidebar toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // SPA Navigation Logic
    navN8n.addEventListener('click', (e) => {
        e.preventDefault();
        mainView.style.display = 'none';
        n8nSection.style.display = 'block';
    });

    // Click on main title to go back to home
    mainTitle.style.cursor = 'pointer';
    mainTitle.addEventListener('click', () => {
        n8nSection.style.display = 'none';
        mainView.style.display = 'block';
    });

    // Imgenes de placeholder abstractas y con vibratividad para contraste al hacer hover
    const items = [
        { title: 'N 8 N', img: 'n8n_logo.svg' },
        { title: 'F 0 R 0', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&h=450&fit=crop' },
        { title: 'P R 0 Y E C T 0 S', img: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&h=900&fit=crop' },
        { title: 'V 1 D E O 5', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&h=500&fit=crop' },
        { title: 'L 1 N K 5', img: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&h=700&fit=crop' }
    ];

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid-item';
        
        // If it's n8n svg, don't apply grayscale so strongly or do it differently if wanted,
        // but since we are replacing the previous APPS, we keep the HTML.
        itemDiv.innerHTML = `
            <img src="${item.img}" alt="${item.title}" loading="lazy" ${item.img.includes('svg') ? 'style="filter: none; background: #050505; padding: 2rem; box-sizing: border-box;"' : ''}>
            <div class="badge">${item.title}</div>
        `;
        
        grid.appendChild(itemDiv);
    });
});
