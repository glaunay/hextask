# HexTask

Hextask is an instance of taskobject ([Git repo][1], [NPM package][4]), used to process a simple Hex job ([Hex website][5]).

## Installation

In your project repository :

```
npm install hextask
```


## Usage

You can either make a test in your proper JS file or use the test file we provide.


### Your proper test

In your JS script, import the test file :

```
var hexTestModule = require('./node_modules/hextask/test/test');
```

Then you have to start and set up a JM (= Job Manager, more info in the [More](#more) section). We provide a method that takes care of that :

```
hexTestModule.JMsetup();
```

`JMsetup` returns an object instance of EventEmitter. It emits `"ready"` when the JM is ready to receive jobs, and provide the JM object.
Then, you can run the `hexTest` method :

```
hexTestModule.JMsetup().on('ready', function (JMobject) {
	hexTestModule.hexTest(pdbFile, management, probeContent, ncpu);
});
```

- `pdbFile` is the absolute path to your PDB file.
- `probeContent` is the content of the PDB file of your probe.
- `ncpu` is the number of CPUs on which you want to run Hex. WARNING : for now, only 16 is available !
- `management` is a literal like :

```
let management = {
	'jobManager' : JMobject // provided by the JMsetup method
}
```

The `hexTest` method :

1. creates a stream (Readable) containing a JSON with your `pdbFile` content,
2. instantiates a hextask (more info on the [Hex website][5]),
3. pipes the stream on the hextask, also piped on `process.stdout`, so you can watch the results in your console.


### The test file

The previous test is already implemented in the `./node_modules/hextask/test/` directory. To use it :

```
node ./node_modules/hextask/test.js
```

This script needs some command line options. You can use option `-u` to display the documentation.


### Loading library

In your JavaScript module :

```
var hexModule = require('hextask');
```

### Creating an instance of hextask - not updated !!!!

In your JavaScript module :

```
var h = new hexModule.Hex (management);
```
Note that you need a job manager to use hextask, like **nslurm** ([GitHub repo][2], [NPM package][3]) adapted to SLURM manager.


### Using in a pipeline - not updated !!!!

In your JavaScript module :

```
readableStream
	.pipe(h)
	.pipe(writableStream);
```


### Setting the hextask - not updated !!!!

You can modify the parameters in the `./data/settings.json` file :

```
{
	"coreScript": "./data/run_hex.sh",
	"automaticClosure": false,
	"settings": {} // proper hex parameters
}
```
Proper hextask parameters must be defined in the "settings" part of the JSON.


## More

### Job Manager

Coming soon...  
A Job Manager (JM) is necessary to run a Task. In our case, we use the nslurm package ([GitHub repo][1], [NPM package][2]), adapted for SLURM.





[1]: https://github.com/melaniegarnier/taskobject
[2]: https://github.com/glaunay/nslurm
[3]: https://www.npmjs.com/package/nslurm
[4]: https://www.npmjs.com/package/taskobject
[5]: http://hex.loria.fr/