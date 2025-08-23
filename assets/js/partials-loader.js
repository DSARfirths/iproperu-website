document.addEventListener("DOMContentLoaded", () => {
    const loadPartial = async (elementId, filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo: ${filePath}`);
            }
            const content = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = content;
            }
        } catch (error) {
            console.error('Error cargando partial:', error);
        }
    };

    // Cargar header y footer
    Promise.all([
        loadPartial('header-placeholder', '/partials/header.html'),
        loadPartial('footer-placeholder', '/partials/footer.html')
    ]).then(() => {
        // Una vez que ambos se cargan, muestra el contenido
        document.body.classList.remove('hidden');
    });
});

