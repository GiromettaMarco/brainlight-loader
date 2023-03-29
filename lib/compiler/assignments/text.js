import { Assignment } from "./assignment";
import { escapeCode } from "../helpers/escape";

export class Text extends Assignment {
    static regex = /^([a-zA-Z0-9_]+)="([^"]*)"$/;

    static makeVariable(matches) {
        return '"' + matches[1] + '": "' + escapeCode(matches[2]) + '"';
    }
}
