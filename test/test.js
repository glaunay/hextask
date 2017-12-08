"use strict";
/// <reference path="../../typings/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
/*
TO RUN :
node path/to/this/script/test.js -cache /path/to/cache/tmp/
                                -conf /path/to/nslurm/config/arwenConf.json
                                -pdb /path/to/your/PDB/file.pdb
                                -probe /path/to/your/probe/PDB/file.pdb
                                -ncpu 16
*/
const hexT = require("../index");
const jobManager = require("nslurm"); // engineLayer branch
const localIP = require("my-local-ip");
const jsonfile = require("jsonfile");
const fs = require("fs");
const pdbLib = require("pdb-lib");
var tcp = localIP(), port = "2240";
var engineType = null, cacheDir = null, bean = null, entryFile = null, probeFile = null, ncpu = null;
var optCacheDir = [];
///////////// arguments /////////////
process.argv.forEach(function (val, index, array) {
    if (val === '-cache') {
        if (!array[index + 1])
            throw 'usage : ';
        cacheDir = array[index + 1];
    }
    if (val === '-conf') {
        if (!array[index + 1])
            throw 'usage : ';
        try {
            bean = jsonfile.readFileSync(array[index + 1]);
        }
        catch (err) {
            console.log('ERROR while reading the config file :');
            console.log(err);
        }
    }
    if (val === '-pdb') {
        if (!array[index + 1])
            throw 'usage : ';
        entryFile = array[index + 1];
    }
    if (val === '-probe') {
        if (!array[index + 1])
            throw 'usage : ';
        probeFile = array[index + 1];
    }
    if (val === '-ncpu') {
        if (!array[index + 1])
            throw 'usage : ';
        ncpu = array[index + 1];
    }
});
if (!cacheDir)
    throw 'No cacheDir specified !';
// example CACHEDIR = /home/mgarnier/tmp
if (!bean)
    throw 'No config file specified !';
// example BEAN = /home/mgarnier/taskObject_devTests/node_modules/nslurm/config/arwenConf.json
if (!entryFile)
    throw 'No PDB file specified !';
// example ENTRYFILE = ./test/1BRS.pdb
if (!probeFile)
    throw 'No probe PDB file specified !';
// example PROBEFILE = ./test/probe.pdb
if (!ncpu)
    throw 'No number of CPUs specified !';
// example NCPU = 16
engineType = engineType ? engineType : bean.engineType;
bean.cacheDir = cacheDir ? cacheDir : bean.cacheDir;
try {
    var probeContent = fs.readFileSync(probeFile, 'utf8');
}
catch (err) {
    throw err;
}
// console.log("Config file content:\n");
// console.dir(bean);
optCacheDir.push(bean.cacheDir);
///////////// jobManager /////////////
//jobManager.debugOn();
jobManager.index(optCacheDir);
jobManager.configure({ "engine": engineType, "binaries": bean.binaries });
jobManager.start({
    'cacheDir': bean.cacheDir,
    'tcp': tcp,
    'port': port
});
jobManager.on('exhausted', function () {
    console.log("All jobs processed");
});
jobManager.on('ready', function () {
    hexTest(probeContent);
    //multiple_hexTests(probeContent); // to detect errors
});
//////////// tests /////////////
var hexTest = function (probe) {
    var jobProfile = "arwen_hex_" + ncpu + "cpu"; // "arwen_hex_16cpu" for example
    var syncMode = false;
    let management = {
        'jobManager': jobManager,
        'jobProfile': jobProfile
    };
    var options = {
        'staticInputs': { 'probePdbFile': probe },
        'modules': ['naccess', 'hex'],
        'exportVar': { 'hexFlags': ' -nocuda -ncpu ' + ncpu + ' ',
            'hexScript': '/software/mobi/hex/8.1.1/exe/hex8.1.1.x64' }
    };
    var h = new hexT.Hex(management, syncMode, options);
    //h.testMode(true);
    pdbLib.parse({ 'file': entryFile }).on('end', function (pdbObj) {
        pdbObj.stream(true, "targetPdbFile").pipe(h);
        //process.stdin.pipe(h);
        h.on('processed', function (results) {
            console.log('**** data H');
        })
            .on('err', function (err, jobID) {
            console.log('**** ERROR H');
        });
        //.pipe(process.stdout);
    });
};
var multiple_hexTests = function (probe) {
    var nRun = 500;
    for (var i = 0; i < nRun; i++) {
        var probe_i = "REMARK " + i + "\n" + probe; // to have different input files (and no resurrection)
        hexTest(probe_i);
    }
};
