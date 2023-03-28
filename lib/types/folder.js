export class Folder {
    /**
     * Webpack context obtained with the 'require.context' method.
     */
    #webpackContext;

    /**
     * The extension of the files.
     */
    #extension;

    /**
     * @param {Object} webpackContext - The webpack context
     * @param {string} extension - The extension of the files
     */
    constructor(webpackContext, extension) {
        this.#webpackContext = webpackContext;
        this.#extension = extension;
    }

    /**
     * Returns the content of a file fetched by its key name.
     * 
     * @param {string} key - The key refering to a file
     * @returns The content of the file
     */
    get(key) {
        return this.#webpackContext(this.resolve(key));
    }

    /**
     * Converts a key name to a webpack key.
     * 
     * @param {string} key - The key name of a file
     * @returns The key converted for the webpack format
     */
    resolve(key) {
        return "./" + key.replaceAll('.', '/') + "." + this.#extension;
    }
}