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
const tk = require("taskobject");
class Hex extends tk.Task {
    /*
    * Initialize the task parameters.
    */
    constructor(management, options) {
        super(management, options);
        this.rootdir = __dirname;
        this.settFile = this.rootdir + '/data/settings.json';
        this.staticTag = 'hex';
        /* Creation of the slot symbols : only one here */
        this.slotSymbols = ['targetPdbFile', 'probePdbFile'];
        super.init(this.settFile);
    }
    /*
    * Here manage the input(s)
    */
    prepareJob(inputs) {
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
