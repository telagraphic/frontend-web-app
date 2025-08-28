export class TemplateLoader {
    constructor() {
        this.templates = new Map();
    }

    async loadTemplate(templateName) {
        if (this.templates.has(templateName)) {
            return this.templates.get(templateName);
        }

        try {
            const response = await fetch(`../templates/${templateName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status}`);
            }
            
            const templateHTML = await response.text();
            this.templates.set(templateName, templateHTML);
            return templateHTML;
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            return null;
        }
    }

    renderTemplate(templateName, containerId, data = {}) {
        this.loadTemplate(templateName).then(templateHTML => {
            if (templateHTML) {
                const container = document.getElementById(containerId);
                if (container) {
                    // Simple template variable replacement
                    let renderedHTML = templateHTML;
                    Object.entries(data).forEach(([key, value]) => {
                        renderedHTML = renderedHTML.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    });
                    container.innerHTML = renderedHTML;
                }
            }
        });
    }
}
