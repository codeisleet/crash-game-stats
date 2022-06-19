const crypto = require('crypto');

const salt = "00000000000000000006b3a5a60849712b5f42f5fe3d2b475adea1d7bee9e36f";
//const salt = "0000000000000000001b34dc6a1e86083f95500b096231436e9b25cbdd0075c4";

function generateHash(seed) {
    return crypto.createHash("sha256").update(seed).digest("hex");
}
  
function divisible(hash, mod) {
    // We will read in 4 hex at a time, but the first chunk might be a bit smaller
    // So ABCDEFGHIJ should be chunked like  AB CDEF GHIJ
    var val = 0;

    var o = hash.length % 4;
    // console.log("mod: " + mod + "o: " + o + "hl: " + hash.length);

    for (var i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
        val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
    }

    return val === 0;
}
  
function crashPointFromHash(serverSeed) {
    const hash = crypto.createHmac("sha256", serverSeed)
      .update(salt)
      .digest("hex");
  
    const hs = parseInt(100 / 5);
    if (divisible(hash, hs)) {
      //console.log("blq");
      return 1.00;
    }
  
    const h = parseInt(hash.slice(0, 52 / 4), 16);
    const e = Math.pow(2, 52);
  
    return Math.floor((100 * e - h) / (e - h)) / 100.0;
}

// agv values

var ratiosForCrashPoint = new Map(
  [["1.1", 7.318007158070395],
  ["1.2", 4.785469165051332],
  ["1.33", 3.4859790601106613],
  ["1.5", 2.7109043288705243],
  ["1.66", 2.3266061194144463],
  ["1.99", 1.8958565610139024],
  ["2", 2.1162501269938025],
  ["3", 3.1838467533532957],
  ["4.9", 5.193875586572013],
  ["5", 5.299238079632968],
  ["10", 10.571047957371226],
  ["50", 52.94424146147736]]);


  

// ----------------------------------------------------- Testing ------------------------------------------------- //


function avgValues(){
  let currentHash = crashHash;
  let ones = 0;
  let countPointOne = 0;
  let countPointTwo = 0;
  let countPointThird = 0;
  let countPointHalf = 0;
  let countPointSixtySix = 0;
  let countUnderTwo = 0;
  
  let countOverTwo = 0;
  let countOverThree = 0;
  let countOverFive = 0;
  let countOverTen = 0;
  let countOverFifty = 0;
  
  let total = 0;
  
  for (let index = 0; index < 2000000; index++) {
  //while(currentHash != firstHash){
    ++total;
    let currentScore = roo.crashPointFromHash(currentHash);
    if(currentScore == 1.0069420)
    ++ones;
    if (currentScore < 2) {
      countUnderTwo++;
      if (currentScore < 1.66) {
        ++countPointSixtySix;
        if (currentScore < 1.5) {
          ++countPointHalf;
          if(currentScore < 1.33) {
            ++countPointThird;
            if (currentScore < 1.20) { 
              ++countPointTwo;
              if(currentScore < 1.1) {
                ++countPointOne;
              }
            }
          }
        }
      }
    }  else {
      ++countOverTwo;
      if (currentScore > 3) {
        ++countOverThree;
        if (currentScore > 4.9) {
          ++countOverFive;
          if (currentScore > 10) {
            ++countOverTen;
            if (currentScore > 50) {
              ++countOverFifty;
            }
          }
        }
      }
    }
    
    currentHash = roo.generateHash(currentHash);
  }
  
  // for (let index = 0; index < 1000000; index++) {
  //   currentHash = roo.generateHash(currentHash);    
  //   ++total;
  // }
  console.log(total/ones);
  //console.log("Curr Hash: " + currHash);
  console.log("-1.1 = " + total/countPointOne + ", -1.2 = " + total/countPointTwo + ", -1.33 = " + total/countPointThird + ", -1.5 = " + total/countPointHalf + ", -1.66 = " + total/countPointSixtySix +", -2 = " + total/countUnderTwo);
  console.log("+2 " + total/countOverTwo + ", +3 " + total/countOverThree + ", +5 " + total/countOverFive + " +10 " + total/countOverTen + ", +50 " + total/countOverFifty);
  console.log("Total = " + total + "  under 2 = " + countUnderTwo + ", over2= " + countOverTwo + ", sum = " + (countUnderTwo + countOverTwo));
  console.log("Test: " + countPointThird + " " + countPointThird *  3.4843960424485103);
}
//avgValues();



// exports

module.exports = {generateHash, crashPointFromHash, ratiosForCrashPoint};

