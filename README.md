# Brainlight Loader

[Brainlight](https://github.com/GiromettaMarco/brainlight) is a lightweight templating system with minimal logic pattern.

This npm package allows to compile and render Brainlight Templates in a JavaScript environment. It makes use of a webpack loader to compile templates and a template engine for rendering.

- [Requirements](#requirements)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [RenderHTML](#renderhtml)
- [Extra logic](#extra-logic)
- [Options](#options)
- [License](#license)

## Requirements

- npm
- webpack 5

## Installation

```
npm i brainlight-loader
```

## Basic Usage

Add the loader to your webpack config. For example:

```js
module: {
  rules: [
    {
      test: /\.brain$/,
      loader: "brainlight-loader",
    }
  ]
}
```

Import the Brainlight engine into your JS:

```js
import { Engine as BrainlightEngine } from 'brainlight-loader/lib/engine';
```

Make a new engine instance and pass it your template directory by using the webpack ```require.context()``` function:

```js
const brain = new BrainlightEngine({
  webpackContext: require.context('./templates/', true, /\.brain$/)
});
```

Now you can render templates like so:

```js
brain.render('template-name', {
  name: 'Alice',
  age: 25
});
```

Make reference to the [Brainlight documentation](https://github.com/GiromettaMarco/brainlight) for templates syntax.

## RenderHTML

If your templates is wrapped in a single HTML node, you can use ```renderHTML()``` function to render the template as an ```Element``` object instead of a string:

```js
brain.renderHTML('button', {
  text: 'Submit'
});
```

## Extra logic

Brainlight Loader supports templates with extra logic.

First pass your logic scripts directory to the engine constructor by using the webpack ```require.context()``` function:

```js
import { Engine as BrainlightEngine } from 'brainlight-loader/lib/engine';

const brain = new BrainlightEngine({
  webpackContext: require.context('./templates/', true, /\.brain$/),
  logicContext: require.context('./logic/', true, /\.js$/)
});
```

Then write logic scripts by extending end exporting the ```Logic``` class:

```js
import { Logic } from 'brainlight-loader/lib/logic';

export class Smart extends Logic {
  getVariables(parameters) {
    // operations with parameters
    return parameters;
  }
}
```

A logic class must implement the ```getVariables()``` function. The purpose of this function is to modify the arguments passed to the template. Such arguments are collected inside the ```parameters``` object.

It is possible to set mandatory arguments using the ```mandatory``` array property and mandatory slots using the ```mandatorySlots``` array property:

```js
import { Logic } from 'brainlight-loader/lib/logic';

export class Smart extends Logic {
  mandatory = [
    'title'
  ];

  mandatorySlots = [
    'content'
  ];

  // ...
}
```

Extra logic scripts will be called when resolving inclusions with additional logic: ```{{>+}}}``` and ```{{&+}}```. In this cases the template path will be resolved as a namespace and the template name as class name.

For example ```{{ >+ buttons.button-delete }}}``` will retrieve logic from class ```ButtonDelete``` exported by ```buttons/button-delete.js```.

If you want to change the default template associated with a logic class, you can use the ```template``` property:

```js
import { Logic } from 'brainlight-loader/lib/logic';

export class ButtonDelete extends Logic {
  template = 'buttons.delete';

  // ...
}
```

This way, when reading ```{{ >+ buttons.button-delete }}}```, class ```ButtonDelete``` will provide extra logic, but the rendered template will be ```buttons.delete```.

Lastly, to render a template with extra logic from your JS scripts, use the third parameter of the ```render()``` and ```renderHTML()``` functions:

```js
brain.render('buttons.button-delete', {}, true);

brain.renderHTML('buttons.button-delete', {}, true);
```

## Options

The Engine constructor supports the following options:

### webpackContext

A reference to the template directory using the webpack ```require.context()``` function.

This field is mandatory.

### logicContext

A reference to the logic directory using the webpack ```require.context()``` function.

This field is required when loading templates with additional logic.

### templateExtension

The file extension of templates (without ```.``` (dot)).

By default is set to ```brain```.

### logicExtension

The file extension of logic scripts (without ```.``` (dot)).

By default is set to ```js```.

## License

Brainlight PHP is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT)
