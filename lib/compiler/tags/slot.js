import { BlockTag } from "./block-tag";

export class Slot extends BlockTag {
    static open(statement) {
        return '__brain.slots.make("' + statement + '", (() => { let text = ""; ';
    }

    static close() {
        return 'return text; })()); ';
    }
}
