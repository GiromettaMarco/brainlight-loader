import { SingleTag } from "./single-tag";
import { Assignments } from "../assignments";
import { Extension } from "../../types/extension";

export class Inclusion extends SingleTag {
    static regex = /^(\+?)\s*([a-zA-Z0-9_\-.]+)(?:\s+([\S\s]*))?$/;

    static compile(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const data = (typeof matches[3] !== 'undefined') ? (new Assignments(matches[3])).compiled : '{}';

            return 'text += __brain.includePartial("' + matches[2] + '", ' + data + ', ' + (matches[1] !== '') + '); ';
        }

        console.warn('Template syntax error. Tag: {{>}}. Statement: "' + statement + '"');
        return '';
    }

    static getExtension(statement) {
        const matches = statement.match(this.regex);

        if (matches) {
            const assignments = new Assignments(matches[3] ?? '');
            return new Extension(matches[2], assignments.compiled, matches[1]);
        }

        console.warn('Template syntax error. Tag: {{&}}. Statement: "' + statement + '"');
        return null;
    }
}
