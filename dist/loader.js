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
        return 'text +=  __brain.includeExtension("' + this.template + '", ' + this.data + ', ' + (this.advanced === '+') + '); ';
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

class Assignment {
    static regex;

    static makeVariable(matches) {
        throw new Error("Method 'makeVariable(matches)' must be implemented.");
    }

    static compile(token, last = false) {
        let compiled = '';

        const matches = token.match(this.regex);

        if (matches) {
            compiled += this.makeVariable(matches);

            if (! last) {
                compiled += ', ';
            }
        }

        return compiled;
    }
}

class Constant extends Assignment {
    static regex = /^([a-zA-Z0-9_]+)=([0-9.]*|true|false)$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": ' + matches[2];
    }
}

class Shorthand extends Assignment {
    static regex = /^:([a-zA-Z0-9_]+)$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": ' + matches[1];
    }
}

class Text extends Assignment {
    static regex = /^([a-zA-Z0-9_]+)="([^"]*)"$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": "' + escapeCode(matches[2]) + '"';
    }
}

class Variable extends Assignment {
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
            this.compiled += this.compileToken(token, (index === this.tokens.length - 1));
        });

        this.compiled += '}';
    }

    compileToken(token, last = false) {
        const shorthand = Shorthand.compile(token, last);
        if (shorthand) {
            return shorthand;
        }

        const variable = Variable.compile(token, last);
        if (variable) {
            return variable;
        }

        const text = Text.compile(token, last);
        if (text) {
            return text;
        }

        const constant = Constant.compile(token, last);
        if (constant) {
            return constant;
        }

        return '';
    }
}

class Tag {
    //
}

class SingleTag extends Tag {
    static compile(statement) {
        throw new Error("Method 'compile(statement)' must be implemented.");
    }
}

class BlockTag extends Tag {
    static open(statement) {
        throw new Error("Method 'open(statement)' must be implemented.");
    }

    static close() {
        throw new Error("Method 'close()' must be implemented.");
    }
}

class Condition extends BlockTag {
    static open(statement) {
        const context = new Context(statement, true);
        return 'if (typeof ' + context.variable + ' !== "undefined" && __brain.isTrue(' + context.compiled + ')) { ';
    }

    static close() {
        return '} ';
    }
}

class Escaped extends SingleTag {
    static compile(statement) {
        const context = new Context(statement);

        if (context !== '') {
            return 'text += __brain.escape(' + context.compiled + '); ';
        }

        return '';
    }
}

class Inclusion extends SingleTag {
    static regex = /^(\+?)\s*([a-zA-Z0-9_\-.]+)(?:\s+([\S\s]*))?$/;

    static compile(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const data = (typeof matches[3] !== 'undefined') ? (new Assignments(matches[3])).compiled : '{}';

            return 'text += __brain.includePartial("' + matches[2] + '", ' + data + ', ' + (matches[1] !== '') + '); ';
        }

        console.warn('Template syntax error. Tag: {{>}}. Statement: "' + statement + '"');
        return '';
    }

    static getExtension(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const assignments = new Assignments(matches[3] ?? '');
            return new Extension(matches[2], assignments.compiled, matches[1]);
        }

        console.warn('Template syntax error. Tag: {{&}}. Statement: "' + statement + '"');
        return null;
    }
}

class Slot extends BlockTag {
    static open(statement) {
        return '__brain.slots.make("' + statement + '", (() => { let text = ""; ';
    }

    static close() {
        return 'return text; })()); ';
    }
}

class Unescaped extends SingleTag {
    static compile(statement) {
        const context = new Context(statement);

        if (context !== '') {
            return 'text += ' + context.compiled + '; ';
        }

        return '';
    }
}

class Loop extends Tag {
    regex = /^([a-zA-Z0-9_>\s]+?)(?:\s+@\s+([a-zA-Z0-9_]+)(?:\s*>\s*([a-zA-Z0-9_]+))?)?$/;
    stack = [];

    open(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const context = new Context(matches[1]);

            if (matches[2]) {
                return this.foreach(context.compiled, matches[2], matches[3] ?? '');
            }

            return this.for(context.compiled);
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

const loop = new Loop();

class Compiler {
    constructor(string, filename = null) {
        this.tagOpen = false;
        this.filename = filename;
        this.extending = null;
        this.compiled = 'let text = ""; ';

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
                this.compiled += Escaped.compile(matches[2]);
                break;

            case '!':
                this.compiled += Unescaped.compile(matches[2]);
                break;

            case '?':
                this.compiled += Condition.open(matches[2]);
                break;

            case '/?':
                this.compiled += Condition.close();
                break;

            case '#':
                this.compiled += loop.open(matches[2]);
                break;

            case '/#':
                this.compiled += loop.close();
                break;

            case '>':
                this.compiled += Inclusion.compile(matches[2]);
                break;

            case '&':
                this.extending = Inclusion.getExtension(matches[2]);
                break;

            case '$':
                this.compiled += Slot.open(matches[2]);
                break;

            case '/$':
                this.compiled += Slot.close();
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
