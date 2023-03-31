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
     * @param {bool} logic - If set to true then 'template' will be used as namespace to include extra logic
     * @returns The parsed template as a string
     */
    render(template, variables = {}, logic = false) {
        if (logic) {
            logic = this.getLogic(template);

            template = logic.template;
            variables = logic.filterVariables(variables);
        }

        return this.evaluateTemplate(template, variables);
    }

    /**
     * Renders a template and parses it as an HTMLElement.
     * 
     * @param {string} template - The template name
     * @param {Object} variables - Key paired object with values for substitution
     * @param {bool} logic - If set to true then 'template' will be used as namespace to include extra logic
     * @returns An HTMLElement obtained from the first tag found inside the template
     */
    renderHTML(template, variables = {}, logic = false) {
        const node = document.createElement('template');
        node.innerHTML = this.render(template, variables, logic);
        return node.content.firstElementChild;
    }

    /**
     * Renders a partial template by name.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @param {bool} logic - If set to true then 'template' will be used as namespace to include extra logic
     * @returns The parsed template as a string
     */
    includePartial(template, variables = {}, logic = false) {
        if (logic) {
            logic = this.getLogic(template);

            template = logic.template;
            variables = logic.filterVariables(variables);
        }

        return this.evaluateTemplate(template, variables);
    }

    /**
     * Renders a template extension by name.
     * 
     * @param {string} template - The template name
     * @param {object} variables - Key paired object with values for substitution
     * @param {bool} logic - If set to true then 'template' will be used as namespace to include extra logic
     * @returns The parsed template as a string
     */
    includeExtension(template, variables = {}, logic = false) {
        if (logic) {
            logic = this.getLogic(template);

            logic.checkSlots(this.slots.getNames());

            template = logic.template;
            variables = logic.filterVariables(variables);
        }

        return this.evaluateTemplate(template, {...variables, ...this.slots.pop()});
    }

    /**
     * Instantiates a logic object from its namespace.
     * 
     * @param {string} namespace - The full namespace
     * @returns {object}
     */
    getLogic(namespace) {
        if (typeof this.logics === 'undefined') {
            throw new Error("Logic Webpack Context missing.");
        }

        const className = this.resolveLogicClassName(namespace);
        return new (this.logics.get(namespace)[className])(namespace);
    }

    /**
     * Estimates a logic class name form its full namespace.
     * 
     * @param {string} namespace - The full namespace
     * @returns {string}
     */
    resolveLogicClassName(namespace) {
        const path = namespace.split('.');
        const templateName = path[path.length - 1];

        let className = '';

        templateName.split('-').forEach((word) => {
            className += word.charAt(0).toUpperCase() + word.slice(1);
        });

        return className;
    }

    /**
     * Evaluetes the contents of a compiled template.
     * 
     * @param {string} template - The template name to render
     * @param {object} variables - Key paired object with variables passed to the template
     * @returns {string}
     */
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
     * @returns {string}
     */
    escape(unsafe) {
        return this.escapeHtml(unsafe);
    }

    /**
     * Escapes HTML entities in a string.
     * 
     * @param {string} unsafe - A string to escape
     * @returns {string}
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

    /**
     * Tests a variable boolean value according to Brainlight rules.
     * 
     * @param {*} variable - The variable to test
     * @returns {bool}
     */
    isTrue(variable) {
        if (!variable || (Array.isArray(variable) && !variable.length) || (typeof variable === 'string' && variable === "0")) {
            return false;
        }

        return true;
    }

    /**
     * Extractes a property from an object.
     * 
     * @param {object} context - Object containing the value to extract
     * @param {array} chain - Array of property names for extraction
     * @param {bool} isset - If set to true then the existence of properties will be checked ahead and false is returned in negative case.
     * @returns {*}
     */
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
