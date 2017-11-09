#!/bin/bash

# already loaded in the sbatch script
#module load cuda/5.0
#module load hex
#module load naccess

# required variables
#probePdbFile
#targetPdbFile

export HEX_FIRST_GPU=${CUDA_VISIBLE_DEVICES}
#ldd /software/mobi/hex/8.0.0//exe/hex8.0.0-cuda.x64

SOURCEDIR=`pwd`
cd $WORKDIR/

# debug
cp $targetPdbFile $SOURCEDIR

# copy target structure
cp $targetPdbFile ./
targetPdbFile=`basename $targetPdbFile`
cp $probePdbFile ./
probePdbFile=`basename $probePdbFile`

# compute free-form accessibility
naccess $targetPdbFile > /dev/null
rsaFree=${targetPdbFile%%.inp}".rsa"
grep "^RES" $rsaFree > ${targetPdbFile%%.inp}"_trim.rsa"
rsaFree=${targetPdbFile%%.inp}"_trim.rsa"

# create hex macro file
  echo "
open_receptor $targetPdbFile
open_ligand $probePdbFile

docking_fft_device 1
docking_fft_type 1

molecular_axis 1
display_sidechain 0

receptor_range_angle 180
ligand_range_angle 180

docking_r12_range 40
docking_r12_step 0.75
docking_r12_substeps 2

max_docking_solutions 3000
max_docking_clusters 2000
docking_cluster_window 200
docking_cluster_threshold 9.0
docking_correlation 0

MOVING_THING 1
RANDOMISE_MOLECULE
MOVING_THING 0
RANDOMISE_MOLECULE
COMMIT_VIEW
MOVING_THING -1

activate_docking
save_range 1 10 ./  pose_ pdb
#save_matrix matrix.dat
exit" > input.mac

#run docking

#echo "/data/software/mobi/hex/8.0.0/exe/hex8.0.0.x64 $hexFlags -noexec < input.mac > hex.log" > $SOURCEDIR/titi.log
#echo 'titi' > $SOURCEDIR/titi.log
$hexScript $hexFlags -noexec < input.mac > hex.log

# hex error management
if [ `cat hex.log | grep "Docking done in a total of" | wc -l` -eq 0 ]
	then echo "ERROR with Hex" 1>&2 # redirect to error
fi

#ls *.pdb
cp hex.log $SOURCEDIR/

ls pose_*.pdb > /dev/null
if test $? -ne 0
    then
    (>&2 echo "no pose found")
   # echo '{}' # Empty results
else
  # detect interface residues, based on accessibility
    # size of the target accessibility file
    NB=`wc -l $rsaFree  | cut -f1 -d" "`
    touch interface_index.temp
    #echo post-treat docking poses
    # interate on poses
    for file in `ls pose_*.pdb`
    do
        tag=${file%%.pdb}
        cmd="naccess $WORKDIR/$file";
        $cmd > /dev/null
        cp $tag.rsa $SOURCEDIR
    # truncate pose accessibility file for target record only:
        #echo "head -$NB $WORKDIR/$tag.rsa > $WORKDIR/temp.rsa "
        grep "^RES" $WORKDIR/$tag.rsa | head -$NB > $WORKDIR/temp.rsa
    #extract interface: residues with accessiblity change, i.e., differences in the accessibility file
        diff temp.rsa $rsaFree | grep "> RES"  | cut -c 11-16  >> $WORKDIR/interface_index.temp
    done
    cp *.pdb $SOURCEDIR
    cp *.asa $SOURCEDIR
    cp *.rsa $SOURCEDIR
    cp interface_index.temp $SOURCEDIR
# count residues
    #cat $WORKDIR/interface_index.temp | sort | uniq -c | awk '{print substr($0,9,6)","substr($0,0,7)}' > $SOURCEDIR/nb_hits.data
# Docking done in a total of


## inliner perl to produce json file out of raw count
    cat $SOURCEDIR/interface_index.temp | perl -ne 'BEGIN {print "{ \"rawCounts\":[\n"; $all =[] } @tmp = $_ =~ /^(.)(.{4})(.)$/g;$tmp[2] = $tmp[2] eq " " ? "null" : "\"$tmp[2]\"";  push @{$all}, "{\"chain\" : \"" . $tmp[0] . "\" , \"resSeq\" : \"" . $tmp[1] . "\" , \"AChar\" : " . $tmp[2] . "}"; END{ print join(",", @{$all}) . "\n]}\n"}'
fi
