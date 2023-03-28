import { escapeCode } from "../helpers/escape";
import { Context } from "./context";

export class Assignments {
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
