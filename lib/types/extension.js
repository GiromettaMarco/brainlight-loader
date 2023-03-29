export class Extension {

    constructor(template, data = null, advanced = false) {
        this.template = template;
        this.data = data ?? '{}';
        this.advanced = advanced;
    }

    compile() {
        let code = 'text +=  __brain.';

        if (this.advanced) {
            code += 'includeExtensionWithLogic';
        } else {
            code += 'includeExtension';
        }

        return code += "('" + this.template + "', " + this.data + "); ";
    }

}
