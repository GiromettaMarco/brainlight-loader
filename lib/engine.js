import { Folder } from "./types/folder";
import { SlotsMap } from "./types/slots-map";

export class Engine {
    constructor(options) {
        if ((typeof options === 'undefined') || (! 'webpackContext' in options)) {
            throw new Error("A Webpack Context must be provided.");
        }

        this.templates = new Folder(options.webpackContext, options.templateExtension ?? 'brain');

        if ('logicContext' in options) {
            this.logics = new Folder(options.logicContext, options.logicExtension ?? 'js');
        }

        this.slots = new SlotsMap();
    }

    /**
     * Renders a template by name.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @returns The parsed template as a string
     */
    render(template, variables = {}) {
        return this.evaluateTemplate(template, variables);
    }

    /**
     * Renders a template and parses it as an HTMLElement.
     * 
     * @param {string} template - The template name
     * @param {Object} variables - Key paired object with values for substitution
     * @returns An HTMLElement obtained from the first tag found inside the template
     */
    renderHTML(template, variables = {}) {
        const node = document.createElement('template');
        node.innerHTML = this.render(template, variables);
        return node.content.firstChild;
    }

    /**
     * Renders a partial template by name.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @returns The parsed template as a string
     */
    includePartial(template, variables = {}) {
        return this.evaluateTemplate(template, variables);
    }

    /**
     * Renders a template extension by name.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @returns The parsed template as a string
     */
    includeExtension(template, variables = {}) {
        return this.evaluateTemplate(template, {...variables, ...this.slots.pop()});
    }

    /**
     * Renders a partial template with additional logic.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @returns The parsed template as a string
     */
    includePartialWithLogic(template, variables = {}) {
        if (typeof this.logics === 'undefined') {
            throw new Error("Logic Webpack Context missing.");
        }

        const className = this.resolveLogicClassName(template);
        const logic = new (this.logics.get(template)[className])(template);

        return this.includePartial(logic.template, logic.filterVariables(variables));
    }

    includeExtensionWithLogic(template, variables = {}) {
        if (typeof this.logics === 'undefined') {
            throw new Error("Logic Webpack Context missing.");
        }

        const className = this.resolveLogicClassName(template);
        const logic = new (this.logics.get(template)[className])(template);

        return this.includeExtension(logic.template, logic.filterVariables(variables));
    }

    resolveLogicClassName(template) {
        const path = template.split('.');
        const templateName = path[path.length - 1];

        let className = '';

        templateName.split('-').forEach((word) => {
            className += word.charAt(0).toUpperCase() + word.slice(1);
        });

        return className;
    }

    evaluateTemplate(template, variables = {}) {
        this.slots.increaseLevel();
        const content = this.templates.get(template)(this, variables);
        this.slots.decreaseLevel();
        return content;
    }

    /**
     * Escapes a string.
     * 
     * @todo Add escape customization in options.
     * 
     * @param {string} unsafe - A string to escape
     * @returns The escaped string
     */
    escape(unsafe) {
        return this.escapeHtml(unsafe);
    }

    /**
     * Escapes HTML entities in a string.
     * 
     * @param {string} unsafe - A string to escape
     * @returns The escaped string
     */
    escapeHtml(unsafe) {
        if (typeof unsafe === 'string' || unsafe instanceof String) {
            return unsafe.replace(/[&<>"'`=\/]/g, this.replaceByEntity);
        }

        return unsafe;
    }

    replaceByEntity(char) {
        const entityMap = new Map([
            ['&', '&amp;'],
            ['<', '&lt;'],
            ['>', '&gt;'],
            ['"', '&quot;'],
            ["'", '&#39;'],
            ['/', '&#x2F;'],
            ['`', '&#x60;'],
            ['=', '&#x3D;']
        ]);
        return entityMap.get(char);
    }

    isTrue(variable) {
        if (!variable || (Array.isArray(variable) && !variable.length) || (typeof variable === 'string' && variable === "0")) {
            return false;
        }

        return true;
    }

    contextualize(context, chain = [], isset = false) {
        if (chain.length !== 0) {

            const nested = (context instanceof Map) ? context.get(chain[0]) : context[chain[0]];

            if (isset && (typeof nested === 'undefined')) {
                return false;
            }

            return this.contextualize(nested, chain.slice(1), isset);
        }

        return context;
    }

}
