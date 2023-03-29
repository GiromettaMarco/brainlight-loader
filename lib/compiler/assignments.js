import { Constant } from "./assignments/constant";
import { Shorthand } from "./assignments/shorthand";
import { Text } from "./assignments/text";
import { Variable } from "./assignments/variable";

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
