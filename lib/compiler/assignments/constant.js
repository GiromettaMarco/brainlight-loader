import { Assignment } from "./assignment";

export class Constant extends Assignment {
    static regex = /^([a-zA-Z0-9_]+)=([0-9.]*|true|false)$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": ' + matches[2];
    }
}
