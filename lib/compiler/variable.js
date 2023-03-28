import { Context } from "./context";

export class Variable {
    compile(statement, escape = true) {
        const context = new Context(statement);

        if (context !== '') {
            return this.prepend(escape) + context.compiled + this.append(escape);
        }

        return '';
    }

    prepend(escape = true) {
        let compiled = 'text += ';

        if (escape) {
            compiled += '__brain.escape(';
        }

        return compiled;
    }

    append(escape = true) {
        let compiled = '';

        if (escape) {
            compiled += ')';
        }

        return compiled += '; ';
    }

    print(statement, escape = true) {
        return this.compile(statement, escape);
    }
}
