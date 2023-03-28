export class Slot {
    constructor(name, content, level = 0) {
        this.name = name;
        this.content = content;
        this.level = level;
    }

    hasLevel(level) {
        if (this.level === level) {
            return true;
        }

        return false;
    }
}