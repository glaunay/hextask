/*

A SIMPLE FILE WITH THE TEST METHODS

*/


import events = require('events');
import fs = require('fs');
import jobManager = require ('nslurm');
import hexT = require ('../index');
import localIP = require ('my-local-ip');
import pdbLib = require ('pdb-lib');



export var hexTest = function (inputFile, management, probeFile, ncpu) {
    var hexOptions = {
        'modules' : ['naccess', 'hex'],
        'exportVar' : { 'hexFlags' : ' -nocuda -ncpu ' + ncpu + ' ',
                        'hexScript' : '/software/mobi/hex/8.1.1/exe/hex8.1.1.x64' }
    };
    var h = new hexT.Hex(management, hexOptions);

    pdbLib.parse({ 'file' : probeFile}).on('end', function (pdbObj) { // read the probeFile
        pdbObj.stream(true, "probePdbFile").pipe(h.probePdbFile);

        pdbLib.parse({ 'file' : inputFile}).on('end', function (pdbObj) { // read the targetPdbFile
            pdbObj.stream(true, "targetPdbFile").pipe(h.targetPdbFile);

            h.on('processed', function (results) {
                console.log('**** data H');
            })
            .on('err', function (err, jobID) {
                console.log('**** ERROR H');
            })
            .pipe(process.stdout);
        });
    });
}


export var multiple_hexTests = function (inputFile, management, probe, ncpu) {
    var nRun = 500;
    for (var i = 0; i < nRun; i ++) {
        var probe_i = "REMARK " + i + "\n" + probe; // to have different input files (and no resurrection)
        hexTest(inputFile, management, probe_i, ncpu);
    }
}



/*
* Function to run jobManager.
* @opt [literal] contains the options to setup and start the JM. Key recognized by this method :
*     - bean [literal] like the file nslurm/config/arwenConf.json, optional
*     - optCacheDir [array] each element is a path to a previous cacheDir (for jobManager indexation), optional
*     - engineType [string] can be 'nslurm' for example, optional
*/
export var JMsetup = function (opt?: any): events.EventEmitter {
    let emitter = new events.EventEmitter();

    // @opt treatment
    if (! opt) { var opt: any = {}; }
    if (! opt.hasOwnProperty('optCacheDir')) opt['optCacheDir'] = null;
    if (! opt.hasOwnProperty('bean')) opt['bean'] = {};
    if (! opt.bean.hasOwnProperty('engineType')) opt.bean['engineType'] = 'emulator';
    if (! opt.bean.hasOwnProperty('cacheDir')) {
        console.log('No cacheDir specified in opt.bean, so we take current directory');
        opt.bean['cacheDir'] = process.cwd() + '/cacheDir';
        try { fs.mkdirSync(opt.bean.cacheDir); }
        catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }
    }

    let startData: {} = {
        'cacheDir' : opt.bean.cacheDir,
        'tcp' : localIP(),
        'port' : '2497'
    }

    //jobManager.debugOn();

    jobManager.index(opt.optCacheDir); // optCacheDir can be null
    jobManager.configure({"engine" : opt.bean.engineType, "binaries" : opt.bean.binaries });
    jobManager.start(startData);

    jobManager.on('exhausted', function(){
        emitter.emit('exhausted', jobManager);
    });
    jobManager.on('ready', function() {
        emitter.emit('ready', jobManager);
    });
    return emitter;

}