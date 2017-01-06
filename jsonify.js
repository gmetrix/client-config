/**
 A script used to concatenate files and build a final json object file.
 Copyright (C) 2017  Giovanni Martinez

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see http://www.linkedin.com/giosmartinez16
 */
var g_oFileSystem = require("fs");
var l_aryArgs = process.argv.slice(2);
var l_strDirectory     = "";
var l_outFile          = "";
var l_aryFiles         = [];
var l_aryExclude       = [];
var l_strCompanyGuid;
var l_bDoNotContinue   = false;
var l_strType          = 'br';
var l_regexType        = /-t|--type/;
var l_regexDirectory   = /-d|--company-directory/;
var l_regexFile        = /-f|--files/;
var l_regexExclude     = /-e|--exclude/;
var l_regexCompanyGuid = /-c|--company-guid/;
var l_regexHelp        = /\?|--help/;

var lf_helpGuide = function () {
    console.log("usage: $self [-d|--company-directory \<company directory\>] [-f|--files <comma separated list of files>] [-e|--exclude <comma separated list of files]");

    console.log("This script concatenates and prepares the list of BR from a directory and puts them into a single json file.");

    console.log("Required flags:");

    console.log("\t-d | --company-directory \"company1\"");
    console.log("\t\tThe name of the directory to search.   This will also be the name of the json output file.");

    console.log("Optional flags:");
    console.log("\t-f | --files \"file1,file2,file3,...\"");
    console.log("\t\tA file or list of files separated by a comma that will be used to create the json file.");
    console.log("\t\tIf this parameter is undefined, then all files in the directory will be used.");

    console.log("\t-e | --exclude \"file1,file2,file3,...\"");
    console.log("\t\tA file or list of files separated by a comma that will be excluded from the json file.");
    console.log("\t\tIf this parameter is undefined, then no file will be excluded.");
    console.log("\t-c | --company-guid \"GUID\"");
    console.log("\t\tAn id used to dynamically allocate companyId to all of the json objects.");

    console.log("-? | --help");
    console.log("Print this help text");

};

/**
 * Function processes the arguments provided by the command line interface.
 */
var lf_processArguments = function(){
    console.log("\n *START JSONIFYING* \n");
    var l_strArg = "";

    while (0 < l_aryArgs.length){
        l_strArg = l_aryArgs.shift();

        if (l_regexDirectory.test(l_strArg)){
            l_strDirectory = l_aryArgs.shift();
            l_strDirectory = ('/' == l_strDirectory.charAt(l_strDirectory.length - 1))? l_strDirectory : l_strDirectory + '/';
            l_outFile = l_strDirectory.substr(0, l_strDirectory.length - 1) + '.json';
        } else if (l_regexFile.test(l_strArg)) {
            l_aryFiles = l_aryArgs.shift().split(',');
        } else if (l_regexExclude.test(l_strArg)) {
            l_aryExclude = l_aryArgs.shift().split(',');
        } else if (l_regexCompanyGuid.test(l_strArg)) {
            l_strCompanyGuid = l_aryArgs.shift().split(',');
        } else if(l_regexHelp.test(l_strArg)) {
            lf_helpGuide();
            l_bDoNotContinue = true;
            break;
        } else if(l_regexType.test(l_strArg)) {
            l_strType = l_aryArgs.shift();
        } else {
            lf_helpGuide();
            l_bDoNotContinue = true;
            break;
        }
    }
};
/**
 * Function that processes and concatenates file to the final json file.
 * @param p_strFile
 * @returns {*}
 */
var lf_processFile = function(p_strFile) {
    var l_strProcessedContent;
    var l_arySplitContent;
    var l_testFile = p_strFile;
    if(0 < l_aryExclude) {
        for (var e in l_aryExclude){
            l_strExcludedFile = l_aryExclude[e].trim();
            if(l_testFile === l_strDirectory + "/" + l_strExcludedFile ){
                return;
            }
        }
    }
    var l_strProcessedContent = g_oFileSystem.readFileSync(l_testFile,{encoding: 'utf8'});

    //Here we substitute the '@file:file' flag, with actual content from a file.
    if(-1 !== l_strProcessedContent.indexOf('@file:')){
        l_arySplitContent = l_strProcessedContent.substr(l_strProcessedContent.indexOf('@file:')+ 6).split(/"\s*,/);
        var l_strSubContent = g_oFileSystem.readFileSync(l_strDirectory + "/" + l_arySplitContent[0], {encoding: 'utf8'});
        l_strSubContent = l_strSubContent.replace(/\n/, ' ').replace(/\r/, ' ').replace(/\"/g, "\\\"");

        l_strProcessedContent = l_strProcessedContent.replace(/@file:.+\.(html|js)/, l_strSubContent);
    }
    if ('' != l_strCompanyGuid){
        l_strProcessedContent = l_strProcessedContent.replace(/"companyId"\s*:\s*""/,'"companyId" : "' + l_strCompanyGuid + '"');
    }
    l_strProcessedContent = l_strProcessedContent.replace(/\[/,"").replace(/]\s*$/, "").replace(/\r\n/g,' ').replace(/\n/g, ' ');
    return l_strProcessedContent;
};
/**
 * A callback function that cycles through the page rule or business rule files and processes them
 * @param {Object}  p_oErr     - Error object.
 * @param {Array}   p_aryFiles - Array of string filenames
 */
var lf_handleForProcessFile = function(p_oErr, p_aryFiles){
    //final content to be written into the json file.
    var l_strFinalContent = "";
    var l_strTestFile;

    if(p_oErr){
        console.log(p_oErr);
    }
    for(var l_dx in p_aryFiles){
        l_strTestFile = l_strDirectory + p_aryFiles[l_dx];

        if( "br" === p_aryFiles[l_dx].substr(-l_strType.length) ||
            "pr" === l_strType && "pr" === p_aryFiles[l_dx].substr(-l_strType.length)) {
            l_strFinalContent += lf_processFile(l_strTestFile) + ', ';
        }
    }
    //here we remove the last comma, otherwise it won't be a perfect json object
    l_strFinalContent = l_strFinalContent.substr(0, l_strFinalContent.length-2);
    l_oWriteStream.write(l_strFinalContent);

    l_oWriteStream.end(']');
};
//1. First we grab the arguments and assign the values to some variables
//2. Create a new write stream object so that we can write into the final json file
//3. Then we process the files in a loop.
lf_processArguments();
if(!l_bDoNotContinue){
    var l_oWriteStream        = g_oFileSystem.createWriteStream(l_outFile);
    l_oWriteStream.write("[");

    //if there are no files provided in the arguments, then proceed reading the directory.
    if (0 >= l_aryFiles.length){
        g_oFileSystem.readdir(l_strDirectory + '/', lf_handleForProcessFile);

    } else {
        lf_handleForProcessFile(null, l_aryFiles);
    }
}

