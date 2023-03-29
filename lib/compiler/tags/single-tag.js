import { Tag } from "./tag";

export class SingleTag extends Tag {
    static compile(statement) {
        throw new Error("Method 'compile(statement)' must be implemented.");
    }
}
