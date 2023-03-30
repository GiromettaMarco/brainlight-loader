export class Logic {
    constructor(template) {
        this.mandatory = [];

        if (! this.template) {
            this.template = template;
        }
    }

    getVariables(parameters) {
        throw new Error("Method 'getVariables(parameters)' must be implemented.");
    }

    checkParameters(parameters) {
        this.mandatory.forEach((mandatory) => {
            if (! (mandatory in parameters)) {
                throw new Error("Missing argument '" + mandatory + "'");
            }
        });
    }

    filterVariables(parameters) {
        this.checkParameters(parameters);

        return this.getVariables(parameters);
    }
}
