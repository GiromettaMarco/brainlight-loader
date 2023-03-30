export class Logic {
    mandatory = [];
    mandatorySlots = [];

    constructor(template) {
        if (!this.template) {
            this.template = template;
        }
    }

    getVariables(parameters) {
        throw new Error("Method 'getVariables(parameters)' must be implemented.");
    }

    checkParameters(parameters) {
        this.mandatory.forEach((mandatory) => {
            if (!(mandatory in parameters)) {
                this.throwError("Missing argument '" + mandatory + "'");
            }
        });
    }

    filterVariables(parameters) {
        this.checkParameters(parameters);

        return this.getVariables(parameters);
    }

    checkSlots(slotNames) {
        this.mandatorySlots.forEach((mandatory) => {
            if (!slotNames.includes(mandatory)) {
                this.throwError("Missing slot '" + mandatory + "'");
            }
        });
    }

    throwError(message) {
        let error = 'Runtime error.';

        if (this.template) {
            error += " Template: " + this.template + ".";
        }

        if (message) {
            error += " " + message;
        }

        throw new Error(error);
    }
}
