/*
TO RUN :
node path/to/this/script/test.js -d /path/to/cache/tmp/
                                -c /path/to/nslurm/config/arwenConf.json
                                -f /path/to/your/PDB/file.pdb 
                                -p /path/to/your/probe/PDB/file.pdb
                                -n 16
*/

import commander = require('commander');
import fs = require('fs');
import jsonfile = require('jsonfile');
import util = require('util');

import func = require('./index');


var cacheDir: string = null,
	bean: any = null,
	inputFile: string = null,
    probeFile: string = null,
    ncpu: number = null,
    b_index: boolean = false,
    slurmOptions: {} = null;
var optCacheDir: string[] = [];



//////////////// usage //////////////////
var usage = function (): void {
    let str: string = '\n\n  Example:\n\n'
    str += '    node ./test/test.js\n';
    str += '      -d /home/mgarnier/tmp/\n';
    str += '      -c ./node_modules/nslurm/config/arwenConf.json\n';
    str += '      -f ./test/1BRS.pdb\n';
    str += '      -p ./test/probe.pdb\n';
    str += '      -ncpu 16\n\n'
    console.log(str);
}


///////////// arguments /////////////
commander
    .usage('node ./test/test.js [options]        # in the hextask directory')
    .description('A script for testing a hextask')
    .on('--help', () => { usage(); })
    .option('-u, --usage', 'display examples of usages',
        () => { usage(); process.exit(); })
    .option('-d, --dircache <string>', 'path to cache directory used by the JobManager [optional if -c]',
        (val) => { cacheDir = val; })
    .option('-c, --config <string>', 'path to the cluster config file for the JobManager [optional if emulation]',
        (val) => { try {
            bean = jsonfile.readFileSync(val);
        } catch (err) {
            console.error('ERROR while reading the config file : \n' + util.format(err));
        } })
    .option('-f, --file <string>', 'path to your PDB file [mandatory]',
        (val) => { inputFile = val; })
    .option('-p, --probe <string>', 'path to your probe PDB file [mandatory]',
        (val) => { probeFile = val; })
    .option('-n, --ncpu <integer>', 'number of CPUs needed [mandatory]',
        (val) => { ncpu = parseInt(val); })
    .option('-i, --index', 'allow indexation of the cache directory of the JobManager [optional]',
        () => { b_index = true; })
    .parse(process.argv);

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
	
    func.hexTest(inputFile, management, probeFile, ncpu);
    //func.multiple_hexTests(inputFile, management, probeContent, ncpu); // to detect errors
});








