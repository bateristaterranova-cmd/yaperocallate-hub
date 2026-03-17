document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('masonry-grid');

    // Imgenes de placeholder abstractas y con vibratividad para contraste al hacer hover
    const items = [
        { title: 'A P P S', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=800&fit=crop' },
        { title: 'F 0 R 0', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&h=450&fit=crop' },
        { title: 'P R 0 Y E C T 0 S', img: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&h=900&fit=crop' },
        { title: 'V 1 D E O 5', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&h=500&fit=crop' },
        { title: 'L 1 N K 5', img: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&h=700&fit=crop' }
    ];

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid-item';
        
        itemDiv.innerHTML = `
            <img src="${item.img}" alt="${item.title}" loading="lazy">
            <div class="badge">${item.title}</div>
        `;
        
        grid.appendChild(itemDiv);
    });
});
