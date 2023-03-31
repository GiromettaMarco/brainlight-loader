export class Extension {

    constructor(template, data = null, advanced = false) {
        this.template = template;
        this.data = data ?? '{}';
        this.advanced = advanced;
    }

    compile() {
        return 'text +=  __brain.includeExtension("' + this.template + '", ' + this.data + ', ' + (this.advanced === '+') + '); ';
    }

}
