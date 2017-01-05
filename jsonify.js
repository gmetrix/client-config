/**
 * Created by giova on 1/4/2017.
 */

var fs = require("fs");
var path = require("path");
var l_aryArgs = process.argv.slice(2);
var l_strDirectory     = "";
var l_outFile          = "";
var l_aryFiles         = [];
var l_aryExclude       = [];
var l_strCompanyGuid;
var l_strType          = 'br';
var l_regexType        = /-t|--type/;
var l_regexDirectory   = /-d|--company-directory/;
var l_regexFile        = /-f|--files/;
var l_regexExclude     = /-e|--exclude/;
var l_regexCompanyGuid = /-c|--company-guid/;
var l_regexHelp        = /\?|--help/;
/**
 * Function processes the arguments provided by the command line interface.
 */
var lf_processArguments = function(){
    console.log("\n *START JSONIFYING* \n");
    var l_strFlag = "";

    while (0 < l_aryArgs.length){
        l_strFlag = l_aryArgs.shift();

        if(l_regexDirectory.test(l_strFlag)){
            l_strDirectory = l_aryArgs.shift();
            l_outFile = l_strDirectory + '.json';
        } else if (l_regexFile.test(l_strFlag)) {
            l_aryFiles = l_aryArgs.shift().split(',');
        } else if (l_regexExclude.test(l_strFlag)) {
            l_aryExclude = l_aryArgs.shift().split(',');
        } else if (l_regexCompanyGuid.test(l_strFlag)) {
            l_strCompanyGuid = l_aryArgs.shift().split(',');
        } else if(l_regexHelp.test(l_strFlag)) {
            /*TODO: Make a hepler guide.*/
            //lf_printHelpGuide();
        } else if(l_regexType.test(l_strFlag)) {
            l_strType = l_aryArgs.shift();
        } else {
            console.log("Flag is NOT found!");
            //lf_printHelpGuide();
        }
    }
};
/*
 Function that processes and concatenates file to the final json file.
 */
var lf_processFile = function(p_strFile) {
    var l_testFile = p_strFile;
    if(0 < l_aryExclude) {
        for (var e in l_aryExclude){
            l_strExcludedFile = l_aryExclude[e].trim();
            if(l_testFile === l_strDirectory + "/" + l_strExcludedFile ){
                return;
            }
        }
    }
    var l_strContent = fs.readFileSync(l_testFile,{encoding: 'utf8'});
    if(-1 !== l_strContent.indexOf('@file:')){
        l_arySplitContent = l_strContent.substr(l_strContent.indexOf('@file:')+ 6).split(/"\s*,/);
        var l_strFileReplace = fs.readFileSync(l_strDirectory + "/" + l_arySplitContent[0], {encoding: 'utf8'});
        l_strFileReplace = l_strFileReplace.replace(/\n/, ' ').replace(/\r/, ' ').replace(/\"/g, "\\\"");

        l_strContent = l_strContent.replace(/@file:.+\.(html|js)/, l_strFileReplace);
    }
    if ('' != l_strCompanyGuid){
        l_strContent = l_strContent.replace(/"companyId"\s*:\s*""/,'"companyId" : "' + l_strCompanyGuid + '"');
    }
    l_strContent = l_strContent.replace(/\[/,"").replace(/]\s*$/, "").replace(/\r\n/g,' ').replace(/\n/g, ' ');
    return l_strContent;
};
/**
 * Cycles through the page rule or business rule files and processes them
 * @param p_oErr
 * @param p_aryFiles
 */
var lf_handleForProcessFile = function(p_oErr, p_aryFiles){

    var l_strFinalContent = "";
    var l_strDirPath      = l_strDirectory + "/";
    var l_strTestFile;

    if(p_oErr){
        console.log(p_oErr);
    }
    for(var l_dx in p_aryFiles){
        l_strTestFile = l_strDirPath + p_aryFiles[l_dx];

        if( "br" === p_aryFiles[l_dx].substr(-l_strType.length) ||
            "pr" === l_strType && "pr" === p_aryFiles[l_dx].substr(-l_strType.length)) {
            l_strFinalContent += lf_processFile(l_strTestFile) + ', ';
        }
    }
    //here we remove the last comma, otherwise it won't be a perfect json object
    l_strFinalContent = l_strFinalContent.substr(0, l_strFinalContent.length-2);
    writer.write(l_strFinalContent);

    writer.end(']');
};
//1. First we grab the arguments and assign the values to some variables
//2. Create a new write stream object so that we can write into the final json file
//3. Then we process the files in a loop.
lf_processArguments();
var writer        = fs.createWriteStream(l_outFile);
writer.write("[");

//if no file here then continue into this block of code.
if (0 >= l_aryFiles.length){
    fs.readdir(l_strDirectory + '/', lf_handleForProcessFile);

} else {

    lf_handleForProcessFile(null, l_aryFiles);
}
