import { Context } from "./context";

export class Loop {
    constructor() {
        this.regex = /^([a-zA-Z0-9_>\s]+?)(?:\s+@\s+([a-zA-Z0-9_]+)(?:\s*>\s*([a-zA-Z0-9_]+))?)?$/;
        this.stack = [];
    }

    open(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            if (matches[2]) {
                return this.foreach((new Context(matches[1])).compiled, matches[2], matches[3] ?? '');
            }

            return this.for((new Context(matches[1])).compiled);
        }

        console.warn('Template syntax error. Tag: {{#}}. Statement: "' + statement + '"');
        return '';
    }

    close() {
        const foreach = this.stack.pop();

        if (foreach) {
            return '}); ';
        }

        return '} ';
    }

    for(max) {
        this.stack.push(false);

        return 'for (let index = 0; index < parseInt(' + max + '); index++) { ';
    }

    foreach(array, first, last = '') {
        this.stack.push(true);

        let compiled = array + '.forEach((';

        if (last === '') {
            compiled += first;
        } else {
            compiled += last + ', ' + first;
        }

        return compiled + ') => { ';
    }
}
