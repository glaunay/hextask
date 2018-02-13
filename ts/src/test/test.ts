/// <reference path="../../typings/index.d.ts" />

/*
TO RUN :
node path/to/this/script/test.js -cache /path/to/cache/tmp/
                                -conf /path/to/nslurm/config/arwenConf.json
                                -pdb /path/to/your/PDB/file.pdb 
                                -probe /path/to/your/probe/PDB/file.pdb
                                -ncpu 16
*/

import jsonfile = require ('jsonfile');
import fs = require ('fs');
import func = require('./index');


var cacheDir: string = null,
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
    str += 'DATE : 2018.02.06\n\n';
    str += 'WARNING : ncpu must be 16 for now (other cases are not implemented)'
    str += 'USAGE : (in the hexTask directory)\n';
    str += 'node ./test/test.js\n';
    str += '    -u, to have help\n';
    str += '    -cache [PATH_TO_CACHE_DIRECTORY_FOR_NSLURM], [optional if -conf]\n';
    str += '    -conf [PATH_TO_THE_CLUSTER_CONFIG_FILE_FOR_NSLURM], [not necessary if --emul]\n';
    str += '    -pdb [PATH_TO_YOUR_PDB_FILE]\n';
    str += '    -probe [PATH_TO_YOUR_PROBE_FILE]\n';
    str += '    -ncpu [NUMBER OF CPUS NEEDED]\n';
    str += '    --index, to allow indexation of the cache directory of nslurm [optional]\n';
    str += 'EXAMPLE :\n';
    str += 'node ./test/test.js\n';
    str += '    -cache /home/mgarnier/tmp/\n';
    str += '    -conf /home/mgarnier/taskObject_devTests/node_modules/nslurm/config/arwenConf.json\n';
    str += '    -pdb ./test/1BRS.pdb\n';
    str += '    -probe ./test/probe.pdb\n';
    str += '    -ncpu 16\n\n';
    str += '**************************************************\n\n';
    console.log(str);
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



///////////// management /////////////
bean.cacheDir = cacheDir ? cacheDir : bean.cacheDir; // priority for line command argument

if (b_index) optCacheDir.push(bean.cacheDir);
else optCacheDir = null;

let opt: {} = {
    'bean' : bean,
    'optCacheDir' : optCacheDir
}



///////////// jobManager /////////////
func.JMsetup(opt)
.on('exhausted', function (){
    console.log("All jobs processed");
})
.on('ready', function (myJM) {
    let jobProfile: string = "arwen_hex_" + ncpu + "cpu"; // "arwen_hex_16cpu" for example
    let management: {} = {
        'jobManager' : myJM,
        'jobProfile' : jobProfile
    }
	
    func.hexTest(inputFile, management, probeContent, ncpu);
    //func.multiple_hexTests(inputFile, management, probeContent, ncpu); // to detect errors
});








