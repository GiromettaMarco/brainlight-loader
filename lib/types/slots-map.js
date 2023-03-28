import { Slot } from "./slot";

export class SlotsMap {
    constructor(slots = []) {
        this.slots = slots;
        this.level = 0;
    }

    make(name, content) {
        const newSlot = new Slot(name, content, this.level);
        this.slots.push(newSlot);
        return newSlot;
    }

    increaseLevel() {
        this.level++;
    }

    decreaseLevel() {
        this.level--;
    }

    pop() {
        const collected = {};

        this.slots = this.slots.filter((slot, index) => {
            if (slot.hasLevel(this.level)) {
                collected[slot.name] = slot.content;
                return false;
            }

            return true;
        });

        return collected;
    }
}