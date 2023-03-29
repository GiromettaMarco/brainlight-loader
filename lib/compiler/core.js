import { Condition } from "./tags/condition";
import { Escaped } from "./tags/escaped";
import { Inclusion } from "./tags/inclusion";
import { Slot } from "./tags/slot";
import { Unescaped } from "./tags/unescaped";
import { loop } from "./tags/loop";
import { escapeCode } from "../helpers/escape";

export class Core {
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
