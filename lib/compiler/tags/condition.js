import { BlockTag } from "./block-tag";
import { Context } from "../context";

export class Condition extends BlockTag {
    static open(statement) {
        const context = new Context(statement, true);
        return 'if (typeof ' + context.variable + ' !== "undefined" && __brain.isTrue(' + context.compiled + ')) { ';
    }

    static close() {
        return '} ';
    }
}
