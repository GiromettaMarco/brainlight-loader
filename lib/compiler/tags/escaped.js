import { SingleTag } from "./single-tag";
import { Context } from "../context";

export class Escaped extends SingleTag {
    static compile(statement) {
        const context = new Context(statement);

        if (context !== '') {
            return 'text += __brain.escape(' + context.compiled + '); ';
        }

        return '';
    }
}
