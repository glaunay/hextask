"use strict";
/*
********************
***** HEX TASK *****
********************

* GOAL *
Realize a simple task to run Hex.

* INPUT *
Coming from a readable stream, the input must be like :


* OUTPUT *
The output is a literal with this form :

*/
Object.defineProperty(exports, "__esModule", { value: true });
// TODO
// - doc
// - npm
// - prepareResults
const tk = require("taskObject");
class Hex extends tk.Task {
    /*
    * Initialize the task parameters.
    */
    constructor(management, syncMode, options) {
        super(management, syncMode, options);
        this.rootdir = __dirname;
        this.settFile = this.rootdir + '/data/settings.json';
        super.init(this.settFile);
        this.staticTag = 'hex';
    }
    /*
    * Here manage the input(s)
    */
    prepareJob(inputs) {
        inputs.push(this.staticInputs);
        return super.configJob(inputs);
    }
    /*
    * To manage the output(s)
    */
    prepareResults(chunk) {
        var results = super.parseJson(chunk);
        return results;
    }
}
exports.Hex = Hex;
