import { Assignment } from "./assignment";
import { Context } from "./context";

export class Variable extends Assignment {
    static regex = /^:([a-zA-Z0-9_]+)=(.+)$/;

    static makeVariable(matches) {
        const context = new Context(matches[2]);

        if (context.compiled === '') {
            console.warn('Template syntax error. Invalide assignment: \'' + matches[0] + '\'');
            return '';
        }

        return '"' + matches[1] + '": ' + context.compiled;
    }
}
