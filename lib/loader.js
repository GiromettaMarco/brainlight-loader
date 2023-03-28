import { Core as Compiler } from "./compiler/core";

module.exports = function (content) {
    let code = 'module.exports = function() { const __brain = arguments[0]; for (const key in arguments[1]) { this[key] = arguments[1][key]; } ';
    code += (new Compiler(content)).compiled;
    code += ' };';
    return code;
};
