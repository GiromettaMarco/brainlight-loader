import { escapeCode } from "../helpers/escape";
import { Condition } from "./condition";
import { Inclusion } from "./inclusion";
import { Loop } from "./loop";
import { Slot } from "./slot";
import { Variable } from "./variable";

export class Core {
    constructor(string, filename = null) {
        this.tagOpen = false;
        this.filename = filename;
        this.extending = null;
        this.compiled = 'let text = ""; ';

        this.variable = new Variable();
        this.condition = new Condition();
        this.loop = new Loop();
        this.inclusion = new Inclusion();
        this.slot = new Slot();

        this.tokens = string.split(/({{)\s*(.*?)\s*(}})/);
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
                this.compiled += this.variable.print(matches[2]);
                break;

            case '!':
                this.compiled += this.variable.print(matches[2], false);
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
