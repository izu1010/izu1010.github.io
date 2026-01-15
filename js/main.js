document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Highlight active link based on current path
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        const href = link.getAttribute('href');
        // Simple check: if href is part of the path or if it's the home page
        if (href === '/' || href === 'index.html' || href === './index.html') {
            if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
                link.classList.add('active');
            }
        } else {
            // Clean up href to match part of the path (e.g., './pages/gameroom.html' -> 'gameroom.html')
            const cleanHref = href.replace('./pages/', '').replace('pages/', '');
            if (currentPath.includes(cleanHref)) {
                link.classList.add('active');
            }
        }
    });
});
