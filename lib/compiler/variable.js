import { Context } from "./context";

export class Variable {
    constructor(statement, escape = true) {
        this.compiled = '';
        this.escape = escape;
        this.compile(statement);
    }

    compile(statement) {
        const context = (new Context(statement)).compiled;

        if (context !== '') {
            this.start();
            this.compiled += context;
            this.stop();
        }
    }

    start() {
        this.compiled += 'text += ';

        if (this.escape) {
            this.compiled += '__brain.escape(';
        }
    }

    stop() {
        if (this.escape) {
            this.compiled += ')';
        }

        this.compiled += '; ';
    }
}
