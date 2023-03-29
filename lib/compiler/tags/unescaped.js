import { SingleTag } from "./single-tag";
import { Context } from "../context";

export class Unescaped extends SingleTag {
    static compile(statement) {
        const context = new Context(statement);

        if (context !== '') {
            return 'text += ' + context.compiled + '; ';
        }

        return '';
    }
}
