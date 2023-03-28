export class Context {
    constructor(statement, isset = false) {
        this.regex = /^([a-zA-Z0-9_]+)(?:\s*>\s*([a-zA-Z0-9_>\s]+))?$/;
        this.compiled = '';
        this.variable = '';
        this.chain = '[]';
        this.isset = isset;

        this.compile(statement);
    }

    compile(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            this.variable = matches[1];

            if (matches[2]) {
                this.chain = this.compileChain(matches[2]);
            }

            this.compiled = '__brain.contextualize(' + this.variable + ', ' + this.chain;
            if (this.isset) {
                this.compiled += ', true';
            }
            this.compiled += ')';
        }
    }

    compileChain(statement) {
        let chain = '[';

        const children = statement.split('>');

        children.forEach((child, index) => {
            chain += "'" + child.trim() + "'";

            if (index !== children.length - 1) {
                chain += ', ';
            }
        });

        return chain + ']';
    }
}
