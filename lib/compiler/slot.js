export class Slot {
    open(slotName) {
        return '__brain.slots.make("' + slotName + '", (() => { let text = ""; ';
    }

    close() {
        return 'return text; })()); ';
    }
}
