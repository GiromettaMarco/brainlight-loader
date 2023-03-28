'use strict';

function escapeCode(string) {
    return string
        .replace(/\\/g, '\\\\')
        .replace(/\"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

class Extension {

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

class Context {
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

class Condition {
    open(statement) {
        const context = new Context(statement, true);
        return 'if (typeof ' + context.variable + ' !== "undefined" && __brain.isTrue(' + context.compiled + ')) { ';
    }

    close() {
        return '} ';
    }
}

class Assignments {
    constructor(string) {
        this.tokens = string.match(/\S*"[^"]*"|[^"\s]+/g);
        if (! this.tokens) {
            this.tokens = [];
        }
        this.compileTokens();
    }

    compileTokens() {
        this.compiled = '{';

        this.tokens.forEach((token, index) => {
            this.compileToken(token, (index === this.tokens.length - 1));
        });

        this.compiled += '}';
    }

    compileToken(token, last = false) {
        if (
            this.compileShorthand(token, last) ||
            this.compileVariable(token, last) ||
            this.compileString(token, last) ||
            this.compileBoolAndNumb(token, last)
        ) {
            return true;
        }
        return false;
    }

    compileShorthand(token, last = false) {
        const matches = token.match(/^:([a-zA-Z0-9_]+)$/);

        if (matches) {
            this.compiled += '"' + matches[1] + '": ' + matches[1];

            if (! last) {
                this.compiled += ', ';
            }

            return true;
        }

        return false;
    }

    compileVariable(token, last = false) {
        const matches = token.match(/^:([a-zA-Z0-9_]+)=(.+)$/);

        if (matches) {
            const context = new Context(matches[2]);
            if (context.compiled === '') {
                console.warn('Template syntax error. Invalide assignment: \'' + token + '\'');
                return false;
            }

            this.compiled += '"' + matches[1] + '": ' + context.compiled;

            if (! last) {
                this.compiled += ', ';
            }

            return true;
        }

        return false;
    }

    compileString(token, last = false) {
        const matches = token.match(/^([a-zA-Z0-9_]+)="([^"]*)"$/);

        if (matches) {
            this.compiled += '"' + matches[1] + '": "' + escapeCode(matches[2]) + '"';

            if (! last) {
                this.compiled += ', ';
            }

            return true;
        }

        return false;
    }

    compileBoolAndNumb(token, last = false) {
        const matches = token.match(/^([a-zA-Z0-9_]+)=([0-9.]*|true|false)$/);

        if (matches) {
            this.compiled += '"' + matches[1] + '": ' + matches[2];

            if (! last) {
                this.compiled += ', ';
            }

            return true;
        }

        return false;
    }
}

class Inclusion {
    constructor() {
        this.regex = /^(\+?)\s*([a-zA-Z0-9_\-.]+)(?:\s+([\S\s]*))?$/;
    }

    partial(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const data = (typeof matches[3] !== 'undefined') ? (new Assignments(matches[3])).compiled : '{}';

            let compiled = 'text += __brain.';

            if (matches[1] !== '') {
                compiled += 'includePartialWithLogic';
            } else {
                compiled += 'includePartial';
            }

            return compiled += '("' + matches[2] + '", ' + data + '); ';
        }

        console.warn('Template syntax error. Tag: {{>}}. Statement: "' + statement + '"');
        return '';
    }

    getExtension(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            return new Extension(matches[2], new Assignments(matches[3] ?? '').compiled, matches[1]);
        }

        console.warn('Template syntax error. Tag: {{&}}. Statement: "' + statement + '"');
        return null;
    }
}

class Loop {
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

class Slot {
    open(slotName) {
        return '__brain.slots.make("' + slotName + '", (() => { let text = ""; ';
    }

    close() {
        return 'return text; })()); ';
    }
}

class Variable {
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

class Compiler {
    constructor(string, filename = null) {
        this.tagOpen = false;
        this.filename = filename;
        this.extending = null;
        this.compiled = 'let text = ""; ';

        this.condition = new Condition();
        this.loop = new Loop();
        this.inclusion = new Inclusion();
        this.slot = new Slot();

        this.tokens = string.split(/({{)\s*([\S\s]*?)\s*(}})/);
        this.tokens.forEach(this.compileToken, this);

        this.appendExtension();
        this.appendReturn();
    }

    compileToken(token) {
        if (this.tagOpen) {
            if (token === '}}') {
                this.tagOpen = false;
            } else {
                this.compileTag(token);
            }
        } else {
            if (token === '{{') {
                this.tagOpen = true;
            } else {
                this.compileRaw(token);
            }
        }
    }

    compileRaw(string) {
        this.compiled += 'text += "' + escapeCode(string) + '"; ';
    }

    compileTag(tag) {
        const matches = tag.match(/^(!|\?|\/\?|#|\/#|>|\$|\/\$|&|-)*\s*([\S\s]*)$/);

        switch (matches[1]) {
            case undefined:
                this.compiled += (new Variable(matches[2])).compiled;
                break;

            case '!':
                this.compiled += (new Variable(matches[2], false)).compiled;
                break;

            case '?':
                this.compiled += this.condition.open(matches[2]);
                break;

            case '/?':
                this.compiled += this.condition.close();
                break;

            case '#':
                this.compiled += this.loop.open(matches[2]);
                break;

            case '/#':
                this.compiled += this.loop.close();
                break;

            case '>':
                this.compiled += this.inclusion.partial(matches[2]);
                break;

            case '&':
                this.extending = this.inclusion.getExtension(matches[2]);
                break;

            case '$':
                this.compiled += this.slot.open(matches[2]);
                break;

            case '/$':
                this.compiled += this.slot.close();
                break;
        
            default:
                break;
        }
    }

    appendExtension() {
        if (this.extending) {
            this.compiled += this.extending.compile();
        }
    }

    appendReturn() {
        this.compiled += 'return text;';
    }
}

module.exports = function (content) {
    let code = 'module.exports = function() { const __brain = arguments[0]; for (const key in arguments[1]) { this[key] = arguments[1][key]; } ';
    code += (new Compiler(content)).compiled;
    code += ' };';
    return code;
};
