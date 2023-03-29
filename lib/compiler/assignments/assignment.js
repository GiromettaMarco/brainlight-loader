export class Assignment {
    static regex;

    static makeVariable(matches) {
        throw new Error("Method 'makeVariable(matches)' must be implemented.");
    }

    static compile(token, last = false) {
        let compiled = '';

        const matches = token.match(this.regex);

        if (matches) {
            compiled += this.makeVariable(matches);

            if (! last) {
                compiled += ', ';
            }
        }

        return compiled;
    }
}
