import { Context } from "./context";

export class Condition {
    open(statement) {
        const context = new Context(statement, true);
        return 'if (typeof ' + context.variable + ' !== "undefined" && __brain.isTrue(' + context.compiled + ')) { ';
    }

    close() {
        return '} ';
    }
}
