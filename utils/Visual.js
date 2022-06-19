const roo = require("../core/Roo");


const resetColor = '</span>';//"\x1b[0m";
const fgRed = '<span style="color:red">';//"\x1b[31m"
const fgGreen = '<span style="color:green">';//"\x1b[32m"
const fgBlue = '<span style="color:blue">';//"\x1b[34m";
const bgRed = '<span style="background-color:blue">';//"\x1b[41m"
const bgGreen = "\x1b[42m"

function displayStats(crashHash){

    const finalResult = [];
    
    //the initial hash - passed as arg from tty
    const myArgHash = process.argv.slice(2);
    //Count of games to be displayed
    const lastNGames = 120  ;
    

    // actual values of crash points
    let result = "";
    let currentHash = crashHash;  
    for (let index = 0; index < 20; index++) {
        let currentCrashValue =  roo.crashPointFromHash(currentHash);
        //the instant crash (1.00) is not correct most of the times
        result += " " + (currentCrashValue == 1.00 ? (fgRed + "1.00*" + resetColor) : currentCrashValue);
        currentHash = roo.generateHash(currentHash);
    }
  
    finalResult.push("Last Hash: " + crashHash);
    finalResult.push("Last 20 Values: " + result);


    finalResult.push(visualize(lastNGames, 50, crashHash));
    finalResult.push("   ");
    finalResult.push(visualize(lastNGames, 10, crashHash));
    finalResult.push("   ");
    finalResult.push( visualize(lastNGames, 5, crashHash));
    finalResult.push("   ");
    finalResult.push( visualize(lastNGames, 3, crashHash));
    finalResult.push("   ");
    finalResult.push(visualize(lastNGames, 2, crashHash));
    finalResult.push("   ");
  
    finalResult.push(visualize(lastNGames, 1.99, crashHash));
    finalResult.push("   ");
    finalResult.push(visualize(lastNGames, 1.66, crashHash));
    finalResult.push("   ");
    finalResult.push( visualize(lastNGames, 1.50, crashHash));
    finalResult.push("   ");
    finalResult.push(visualize(lastNGames, 1.33, crashHash));
    // finalResult.push("   ");
    // finalResult.push(visualize(lastNGames, 1.2, crashHash));
    finalResult.push("   ");
    finalResult.push(visualize(lastNGames, 1.1, crashHash));
    finalResult.push("   ");

    // console.log('Args: ', myArgHash);
    // console.log("Last 20 Values: " + result + "\n\n");

    // console.log(visualize(lastNGames, 1.10 , crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 1.20, crashHash));
    // console.log();
    // console.log( visualize(lastNGames, 1.33, crashHash));
    // console.log();
    // console.log( visualize(lastNGames, 1.50, crashHash));
    // console.log();
    // console.log( visualize(lastNGames, 1.66, crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 1.99, crashHash));
    // console.log();
  
    // console.log(visualize(lastNGames, 2, crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 3, crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 5, crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 10, crashHash));
    // console.log();
    // console.log(visualize(lastNGames, 50, crashHash));
    // console.log();

    finalResult.forEach(element => {
      //  console.log(element);
    });

    console.log();
    console.log();
    console.log();

   /// console.log(visualize(250, 5, crashHash));
    console.log();
  return finalResult;
}

  
  
function visualize(n, crashPointToCheck, lastHash){
    // add a space to separate the time-line every x time - for readabillity
    const separatorCount = 20;

    let result = "";  
    let resultCounter = 0;
    let resultCounterLastTwenty = 0;
  
    //console.log("Crash=" + isItCrash(crashPointToCheck, lastHash) + ", pointOverTwo=" + isCrashPointOverTwo(crashPointToCheck));
    for (let i = 0; i < n; i++) {
        if(i % separatorCount === 0) 
            result += " ";

        if (isCrashPointOverTwo(crashPointToCheck) ^ isItCrash(crashPointToCheck, lastHash)) { 
            ++resultCounter;
            if (i < 20) {
                resultCounterLastTwenty++;
            }
            result += isCrashPointOverTwo(crashPointToCheck) ? fgGreen : fgRed;
            result += "X" + resetColor;
        } else {
            result += "_";
        }
        lastHash = roo.generateHash(lastHash);
    }
  
    let ratiosAndCountInfo = (isCrashPointOverTwo(crashPointToCheck) ? (fgGreen + "+") : (fgRed + "-")) + crashPointToCheck  + (" ".repeat(5 - ("" + crashPointToCheck).length));
    ratiosAndCountInfo += formatRatiosAndCounts(20, resultCounterLastTwenty, crashPointToCheck) + " ";
    ratiosAndCountInfo += formatRatiosAndCounts(n, resultCounter, crashPointToCheck) + " ";
    return ratiosAndCountInfo + "|" + result;
}
  
function formatRatiosAndCounts(n, count, crashValue){
    let currentRatio = count > 0 ? ( n / count ) : 0;
    let result = resetColor + "AVG(" + fgBlue + ( n / roo.ratiosForCrashPoint.get(""+crashValue) ).toString().substring(0,4) + resetColor + "/" + n + ") ";
    result += "(" + (currentRatio > roo.ratiosForCrashPoint.get(""+crashValue) ? fgRed : fgGreen) + count + resetColor + "/" + n + ")" + (count < 10 ? " " : "");

    return result;
}

// helpers
 
function isItCrash(crashPointToCheck, hashValue){
    return roo.crashPointFromHash(hashValue) < crashPointToCheck;
}
  
function isCrashPointOverTwo(crashPointToCheck){
return crashPointToCheck >= 2;
}

  
module.exports = { displayStats };
