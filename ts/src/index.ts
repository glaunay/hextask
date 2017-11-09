
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


// TODO
// - doc
// - npm
// - prepareResults


import tk = require('taskObject');

declare var __dirname;

var b_test = false; // test mode

export class Hex extends tk.Task {
	/*
	* Initialize the task parameters.
	*/
	constructor (jobManager, jobProfile: {}, syncMode: boolean, options?: any) {
		super(jobManager, jobProfile, syncMode, options);
        this.rootdir = __dirname;
        this.settFile = this.rootdir + '/data/settings.json';
        super.init(this.settFile);
        this.staticTag = 'hex';
    }

    /*
    * Here manage the input(s)
    */
    prepareJob (inputs: any[]): any {
        inputs.push(this.staticInputs);
        return super.configJob(inputs);
    }

    /*
    * To manage the output(s)
    */
    prepareResults (chunk: string): any {
        var results: {} = super.parseJson(chunk);
        return results;
    }

}