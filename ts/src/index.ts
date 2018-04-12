
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


import tk = require('taskobject');

declare var __dirname;

export class hextask extends tk.Task {
    public targetPdbFile;
    public probePdbFile;

	/*
	* Initialize the task parameters.
	*/
	constructor (management: {}, options?: any) {
        super(management, options);
        this.rootdir = __dirname;
        this.coreScript = this.rootdir + '/data/run_hex.sh';
        this.staticTag = 'hextask';

        /* Creation of the slot symbols : only one here */
        this.slotSymbols = ['targetPdbFile', 'probePdbFile'];

        super.initSlots();
    }

    /*
    * Here manage the input(s)
    */
    prepareJob (inputs: any[]): any {
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
