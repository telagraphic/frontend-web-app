export class NavigationLoader {
    constructor() {
        this.navigationContainer = null;
    }

    async loadNavigation(containerId, currentPage) {
        try {
            // Load the navigation HTML
            const response = await fetch('../pages/navigation.html');
            if (!response.ok) {
                throw new Error(`Failed to load navigation: ${response.status}`);
            }
            
            const navigationHTML = await response.text();
            
            // Find the container where navigation should be inserted
            this.navigationContainer = document.getElementById(containerId);
            if (!this.navigationContainer) {
                console.error(`Container with id '${containerId}' not found`);
                return;
            }

            // Insert the navigation HTML
            this.navigationContainer.innerHTML = navigationHTML;
            
            // Set the active state for the current page
            this.setActivePage(currentPage);
            
        } catch (error) {
            console.error('Error loading navigation:', error);
            // Fallback to basic navigation if loading fails
            this.loadFallbackNavigation(containerId, currentPage);
        }
    }

    setActivePage(currentPage) {
        const navLinks = this.navigationContainer.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    loadFallbackNavigation(containerId, currentPage) {
        // Simple fallback navigation if the file loading fails
        const fallbackNav = `
            <nav class="navigation">
                <div class="nav-container">
                    <div class="nav-logo">
                        <a href="../index.html">Solar System</a>
                    </div>
                    <ul class="nav-menu">
                        <li><a href="../index.html">Home</a></li>
                        <li><a href="about.html">About</a></li>
                        <li><a href="gallery.html">Gallery</a></li>
                        <li><a href="mercury.html">Mercury</a></li>
                        <li><a href="venus.html">Venus</a></li>
                        <li><a href="earth.html">Earth</a></li>
                        <li><a href="mars.html">Mars</a></li>
                        <li><a href="jupiter.html">Jupiter</a></li>
                        <li><a href="saturn.html">Saturn</a></li>
                        <li><a href="uranus.html">Uranus</a></li>
                        <li><a href="neptune.html">Neptune</a></li>
                        <li><a href="pluto.html">Pluto</a></li>
                    </ul>
                </div>
            </nav>
        `;
        
        this.navigationContainer.innerHTML = fallbackNav;
        this.setActivePage(currentPage);
    }
}
