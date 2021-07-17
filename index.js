let fs = require('fs');
let mkdirp = require('mkdirp');
let path = require('path');

if(process.argv.length != 4 && process.argv.length != 5) {
  console.error(`Invalid number of arguments. This is the correct usage:
    node index.js <source directory> <destination directory> [-mirror|-scan]

    -mirror: This option will create sub directories
    -scan: This option will perform a trial run

    By default, this script will flatten the source nested directory.
  `)
  return;
}
let sourceDir = process.argv[2];
let destDir = process.argv[3];
let options = process.argv.length == 5 ? process.argv[4] : null;

console.log("source directory:", sourceDir);
console.log("destination directory:", destDir);
console.log("options:", options);
console.log("\n\nSearching for files...\n");

if(options != '-scan') {
  mkdirp(destDir, function(err) {
    if(err != null) {
      console.error("Error creating destination directory: ", err);
      return;
    }

    console.log(`Created directory: ${destDir}`)
    recFindByExt(sourceDir, destDir, options);
  });
}
else {
  recFindByExt(sourceDir, destDir, options);
}

function recFindByExt(fromDir, toDir,  options) {
  let { COPYFILE_EXCL } = fs.constants;
  let files = fs.readdirSync(fromDir);

  files.forEach(
    function (file) {
      let sourceFile = path.join(fromDir,file);
      let destFile = path.join(toDir,file);
      var isSameSize = false;
      // if(fs.existsSync(destFile)) {
      //   let sourceStats = fs.statSync(sourceFile);
      //   let destStats = fs.statSync(destFile);
      //   isSameSize = sourceStats.size == destStats.size;
      // }
      let canCopy = fs.existsSync(sourceFile) && !(fs.existsSync(destFile)/* && isSameSize*/);

      if ( fs.statSync(sourceFile).isDirectory()) {
        if(options == '-mirror') {
          let mirrorDestDir = path.join(toDir,file);
          mkdirp(mirrorDestDir, function(err) {
            if(err != null) {
              console.error("Error creating destination directory: ", mirrorDestDir, err);
            }
            else {
              console.log(`Created directory: ${mirrorDestDir}`)
              recFindByExt(sourceFile, mirrorDestDir, options);
            }
          });
        }
        else {
          recFindByExt(sourceFile, destDir, options);
        }
      }
      else if(options == '-scan') {
        console.log(`${canCopy ? "Can Copy" : "Must Skip"} ${sourceFile} -> \n\t${destFile}`);
      }
      else {
        console.log(`${canCopy ? "Copying" : "Skipping"} ${sourceFile} -> \n\t${destFile}`);
        if (canCopy) {
          fs.copyFileSync(sourceFile, destFile, COPYFILE_EXCL);
        }
      }
    }
  );
}
