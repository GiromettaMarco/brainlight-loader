import { Tag } from "./tag";

export class BlockTag extends Tag {
    static open(statement) {
        throw new Error("Method 'open(statement)' must be implemented.");
    }

    static close() {
        throw new Error("Method 'close()' must be implemented.");
    }
}
