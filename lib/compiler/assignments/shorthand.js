import { Assignment } from "./assignment";

export class Shorthand extends Assignment {
    static regex = /^:([a-zA-Z0-9_]+)$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": ' + matches[1];
    }
}
