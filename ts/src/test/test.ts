/// <reference path="../../typings/index.d.ts" />

/*
TO RUN :
node path/to/this/script/test.js -cache /path/to/cache/tmp/
                                -conf /path/to/nslurm/config/arwenConf.json
                                -pdb /path/to/your/PDB/file.pdb 
                                -probe /path/to/your/probe/PDB/file.pdb
                                -ncpu 16
*/

import hexT = require ('../index');
import localIP = require ('my-local-ip');
import jobManager = require ('nslurm'); // engineLayer branch
import jsonfile = require ('jsonfile');
import fs = require ('fs');
import stream = require ('stream');
import pdbLib = require ('pdb-lib');


var tcp = localIP(),
	port: string = "2240";
var engineType: string = null,
	cacheDir: string = null,
	bean: any = null,
	inputFile: string = null,
    probeFile: string = null,
    ncpu: string = null,
    b_index: boolean = false,
    slurmOptions: {} = null;
var optCacheDir: string[] = [];



//////////////// usage //////////////////
var usage = function (): void {
    let str: string = '\n\n********** Test file to run a hexTask **********\n\n';
    str += 'DATE : 2017.12.15\n\n';
    str += 'USAGE : (in the hexTask directory)\n';
    str += 'node test/test.js\n';
    str += '    -u, to have help\n';
    str += '    -cache [PATH_TO_CACHE_DIRECTORY_FOR_NSLURM], [optional if -conf]\n';
    str += '    -conf [PATH_TO_THE_CLUSTER_CONFIG_FILE_FOR_NSLURM], [not necessary if --emul]\n';
    str += '    -pdb [PATH_TO_YOUR_PDB_FILE]\n';
    str += '    -probe [PATH_TO_YOUR_PROBE_FILE]\n';
    str += '    -ncpu [NUMBER OF CPUS NEEDED]\n';
    str += '    --index, to allow indexation of the cache directory of nslurm [optional]\n';
    str += 'EXAMPLE :\n';
    str += 'node test/test.js\n';
    str += '    -cache /home/mgarnier/tmp/\n';
    str += '    -conf /home/mgarnier/taskObject_devTests/node_modules/nslurm/config/arwenConf.json\n';
    str += '    -pdb ./test/1BRS.pdb\n';
    str += '    -probe ./test/probe.pdb\n';
    str += '    -ncpu 16\n\n';
    str += '**************************************************\n\n';
    console.log(str);
}



//////////// functions /////////////
var hexTest = function (management, probe) {
    let syncMode: boolean = false;

    var hexOptions = {
        'staticInputs' : { 'probePdbFile' : probe },
        'modules' : ['naccess', 'hex'],
        'exportVar' : { 'hexFlags' : ' -nocuda -ncpu ' + ncpu + ' ',
                        'hexScript' : '/software/mobi/hex/8.1.1/exe/hex8.1.1.x64' }
    };
    var h = new hexT.Hex(management, syncMode, hexOptions);
    //h.testMode(true);

    pdbLib.parse({ 'file' : inputFile}).on('end', function (pdbObj) {
        pdbObj.stream(true, "targetPdbFile").pipe(h);
        //process.stdin.pipe(h);
        h.on('processed', function (results) {
            console.log('**** data H');
        })
        .on('err', function (err, jobID) {
            console.log('**** ERROR H');
        })
        //.pipe(process.stdout);
    });
}


var multiple_hexTests = function (management, probe) {
    var nRun = 500;
    for (var i = 0; i < nRun; i ++) {
        var probe_i = "REMARK " + i + "\n" + probe; // to have different input files (and no resurrection)
        hexTest(management, probe_i);
    }
}






///////////// arguments /////////////
process.argv.forEach(function (val, index, array) {
    if (val == '-u') {
        console.log(usage());
        process.exit();
    }
    if (val === '-cache') {
        if (! array[index + 1]) throw 'usage : ' + usage();
        cacheDir = array[index + 1];
    }
    if (val === '-conf') {
		if (! array[index + 1]) throw 'usage : ' + usage();
        try {
            bean = jsonfile.readFileSync(array[index + 1]);
        } catch (err) {
            console.log('ERROR while reading the config file :');
            console.log(err);
        }
    }
    if (val === '-pdb') {
        if (! array[index + 1]) throw 'usage : ' + usage();
		inputFile = array[index + 1];
	}
    if (val === '-probe') {
        if (! array[index + 1]) throw 'usage : ' + usage();
        probeFile = array[index + 1];
    }
    if (val === '-ncpu') {
        if (! array[index + 1]) throw 'usage : ' + usage();
        ncpu = array[index + 1];
    }
    if (val === '--index') {
        b_index = true;
    }
});

if (! inputFile) throw 'No PDB file specified ! Usage : ' + usage();
if (! probeFile) throw 'No probe PDB file specified ! Usage : ' + usage();
if (! ncpu) throw 'No number of CPUs specified ! Usage : ' + usage();
if (! bean) throw 'No config file specified ! Usage : ' + usage();
if (! bean.hasOwnProperty('cacheDir') && ! cacheDir) throw 'No cacheDir specified ! Usage : ' + usage();

try { var probeContent = fs.readFileSync(probeFile, 'utf8'); }
catch (err) { throw err; }
// console.log("Config file content:\n");
// console.dir(bean);




///////////// management /////////////
slurmOptions = {
    'cacheDir' : null,
    'tcp' : tcp,
    'port' : port
}

///////////// jobManager /////////////
bean.cacheDir = cacheDir ? cacheDir : bean.cacheDir;
slurmOptions['cacheDir'] = bean.cacheDir;
optCacheDir.push(bean.cacheDir);


let jobProfile: string = "arwen_hex_" + ncpu + "cpu"; // "arwen_hex_16cpu" for example
let management: {} = {
    'jobManager' : jobManager,
    'jobProfile' : jobProfile
}

//jobManager.debugOn();
if (b_index) jobManager.index(optCacheDir);
else jobManager.index(null);

jobManager.configure({"engine" : engineType, "binaries" : bean.binaries });

jobManager.start(slurmOptions);
jobManager.on('exhausted', function (){
    console.log("All jobs processed");
});
jobManager.on('ready', function () {
	hexTest(management, probeContent);
    //multiple_hexTests(management, probeContent); // to detect errors
});








