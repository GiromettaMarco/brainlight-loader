export function escapeCode(string) {
    return string
        .replace(/\\/g, '\\\\')
        .replace(/\"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
