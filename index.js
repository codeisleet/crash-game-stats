const express = require('express');
const cors = require('cors');
const app = express();
const { param } = require('express-validator');

app.use(cors());

const Queue = require('./utils/MyQueue');
const roo = require('./core/Roo');
const visual = require('./utils/Visual');


// write data points in a csv
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const headerConfig = [
  { id: 'games', value: 'Games' },
  { id: 'balance', value: 'Balance' }
];

const csvWriter = createCsvWriter({
  path: 'public/result.csv',
  header: [
    { id: 'games', value: 'Games' },
    { id: 'balance', value: 'Balance' },
  ]
});

let data = [];
function addInTheData(k, v) {
  data[data.length] = { 'games': k, 'balance': v };
}
//----------------------------------------------------------------------------------------------------------------- The Hashes

//hashes
//const crashHash =  "2f48fb477f0d0063ba97de02ab3f4a6d3c091d1990ec232408eef4fb6cf85950";
//const firstHash =  "786efb849f4062cc471ed4c1b2de334fa4ef2c30f7a611db82ac130cd0275255";

const firstHash = "dd11d85f91f5ee022dc34bd4a65b4e8e95beaf4dc497389c82501372a7a798da";
//arg1
const crashHash = firstHash;//process.argv.slice(2).toString();

// ------------------------------------- Globals ------------------------------------------------ //
let queueSize = 20; // -- to change with the change in cashOutPoint

let cashOutPoint = 3.65;

const initialBet = 1;
const intervalOfBetIncrease = 1;
const betIncreaseMultiplier = 1.45;

let lostGamesInARowMaxEver = 0;
let lostGamesInARowCurrent = 0;

let currentBet = initialBet;

let losingStreakAmountCurrent = 0;
let losingStreakAmountMaxEver = 0;

// -- do not reset
let bankroll = 0;
let gamesCounterTotal = 0;
let gamesCounterPlayed = 0;

function resetStrategy() {
  currentBet = initialBet;
  lostGamesInARowCurrent = 0;
  losingStreakAmountCurrent = 0;
}

function isGameWin(currentScore) {
  return currentScore >= cashOutPoint;
}

function isGameWin2(currentScore, cashOutPoint) {
  return currentScore >= cashOutPoint;
}

//-------------------------------------------------------------------------------------------------------------------QUEUE

let lastHashInTheQueue = "";

let queue = new Queue(queueSize, cashOutPoint);

function initQueue(theHashForQ) {
  let currentHashForEnQ = theHashForQ;
  //console.log("LAST KNOWN: " + roo.crashPointFromHash(currentHashForEnQ));
  for (let index = 0; index < queueSize; index++) {
    queue.enqueue(roo.crashPointFromHash(currentHashForEnQ));
    currentHashForEnQ = roo.generateHash(currentHashForEnQ);
  }
  lastHashInTheQueue = currentHashForEnQ;
}

function updateQueue() {
  queue.enqueue(roo.crashPointFromHash(lastHashInTheQueue));
  lastHashInTheQueue = roo.generateHash(lastHashInTheQueue);
  return true;
}

//-------------------------------------------------------------------------------------------------------------------MAIN

function gameStart(theHash) {
  
  // initQueue(theHash);
  let hash = theHash;
  
  // while (hash != firstHash) {
  for (let i = 0; i < 50000; i++) {
    ++gamesCounterTotal;
    
    let currentScore = roo.crashPointFromHash(hash);
    
    // updateQueue();
    
    // if(true){//queue.isTableHot()){
    makeTheBet(currentScore);
    //}
    
    //get next hash... technicaly the previous
    hash = roo.generateHash(hash);
  }
  
  // console.log("RESULT---------------------------------------------------------------");
  console.log("Strategy: { cashOutPoint: " + cashOutPoint + ", betIncreaseMultiplier: " + betIncreaseMultiplier + ", intervalOfBetIncrease: " + intervalOfBetIncrease + " }");
  console.log("Bankroll: { gamesAll: " + gamesCounterTotal + ", gamesPlayed: " + gamesCounterPlayed + ", moneyFinal: " + "\x1b[31m" + bankroll + "\x1b[0m }");
  console.log("MaxPossibeLossUSD = " + losingStreakAmountMaxEver + ", maxPossibleConsecLosses = " + lostGamesInARowMaxEver + ", + losingStreakAmountCurrent:  " + losingStreakAmountCurrent);
  // queue.showAll();
  
  csvWriter
  .writeRecords(Array.from(data))
  .then(() => console.log('The CSV file was written successfully'));
}

function makeTheBet(currentScore) {
  
  gamesCounterPlayed++;
  bankroll -= currentBet;
  
  if (isGameWin(currentScore)) {
    
    bankroll += currentBet * cashOutPoint;
    resetStrategy();
    
  } else {
    
    losingStreakAmountCurrent -= currentBet;
    if (losingStreakAmountMaxEver > losingStreakAmountCurrent)
    losingStreakAmountMaxEver = losingStreakAmountCurrent;
    
    lostGamesInARowCurrent++;
    if (lostGamesInARowMaxEver < lostGamesInARowCurrent)
    lostGamesInARowMaxEver = lostGamesInARowCurrent;
    
    if (lostGamesInARowCurrent % intervalOfBetIncrease == 0) {
      currentBet *= betIncreaseMultiplier;
    }
  }
  
  if (gamesCounterPlayed % 50 == 0 && gamesCounterPlayed > 1) {
    addInTheData(gamesCounterPlayed, bankroll);
  }
}


/*
*** LAST CHANGES 
*/



// ------------------------------------- BASIC STRATEGY  ------------------------------------- //


function basicStrategyHelper(hash, lossMultiplier, cashOutOn, initialBankroll) {
  
  const gamesTotal = 200000;
  let gamesPlayedCount = 0;

  let bakrollFinal = 0;
  let bankrollTemp = initialBankroll;
  let currentBet = 1;

  // queueSize = 20;
  // cashOutPoint = cashOutOn;
  initQueue(hash);

  let lossesC = 0;
  let winsC = 0;
  // console.log("1: " + winMultiplier + ", 2: " +  lossMultiplier + ", 3: " + cashOutOn);
  
  for (let index = 0; index < gamesTotal; index++) {    
    if (updateQueue() && queue.isTableHot()) {
    gamesPlayedCount++;
    bankrollTemp -= currentBet;
    let currentcrashPoint = roo.crashPointFromHash(hash);
    
    if (isGameWin2(currentcrashPoint, cashOutOn)) { // WIN
      bankrollTemp += currentBet * cashOutOn;
      currentBet = 1;
      
      if (bankrollTemp >= initialBankroll * 2) {
        bakrollFinal += bankrollTemp - initialBankroll;
        ++winsC;
        bankrollTemp = initialBankroll;
      }
    } else {                   // ----------------- LOSS
      currentBet *= lossMultiplier;
      
      if (bankrollTemp - currentBet < 0) {
        bakrollFinal -= initialBankroll - bankrollTemp;
        ++lossesC;
        bankrollTemp = initialBankroll;
        currentBet = 1;
      }
    }
  }
    hash = roo.generateHash(hash);
  }
  
  console.log("------------------------------------------------");
  console.log("WINS: " + winsC + ", LOSSES: " + lossesC + ", Final(" + gamesPlayedCount + " games): " + bakrollFinal + " " + bankrollTemp);
  console.log("------------------------------------------------");
}


function basicStrategy(hash, lossMultiplier, cashOutOn) {
  
  let bankroll = 0;
  let currentBet = 1;
  
  let lossesInARowCurrent = 0;
  let lossesInARowMax = 0;
  let maxBet = 1;
  
  let games = [];
  let balance = [];
  
  games.push(0);
  balance.push(bankroll);
  
  // console.log("1: " + winMultiplier + ", 2: " +  lossMultiplier + ", 3: " + cashOutOn);
  
  for (let index = 0; index < 100000; index++) {
    
    bankroll -= currentBet;
    let currentcrashPoint = roo.crashPointFromHash(hash);
    
    if (isGameWin2(currentcrashPoint, cashOutOn)) { // WIN
      
      bankroll += currentBet * cashOutOn;
      currentBet = 1;
      lossesInARowCurrent = 0;
      
    } else {                   // ----------------- LOSS
      
      currentBet *= lossMultiplier;
      lossesInARowCurrent++;
      if (lossesInARowCurrent > lossesInARowMax) {
        lossesInARowMax = lossesInARowCurrent;
        maxBet = currentBet;
      }
    }
    
    hash = roo.generateHash(hash);
    
    if (index % 100 == 0 && index > 1) {
      games.push(index);
      balance.push(bankroll);
    }
  }
  
  console.log("Max Bet = " + maxBet);
  console.log("Maximum consecutive Losses = " + lossesInARowMax);
  return { games, balance };
}

function calculateWeight(crashPoint) {
  // 10 levels
  // 10.00 - 50  => 41 - 50
  // 5.01 - 9.99 => 31 - 40
  // 3.34 - 4.99 => 21 - 30
  // 2.51 - 3.33 => 11 - 20
  // 2.01 - 2.49 => 1 -- 10
  //--------------------------------------- 2.0 => weight : 0
  // 1.80 - 1.99 => -10 -- -1
  // 1.60 - 1.79 => -20 -- -11
  // 1.40 - 1.59 => -30 -- -21
  // 1.20 - 1.39 => -40 -- -31
  // 1.00 - 1.19 => -50 -- -41
  let result = 0;
  if (crashPoint < 2) { result = (crashPoint - 2) * 50; }
  else if (crashPoint < 2.50) { result = (crashPoint - 2) * 20; }
  else if (crashPoint < 3.34) { result = (crashPoint - 2.5) * 12.04 + 10; }
  else if (crashPoint < 5) { result = (crashPoint - 3.33) * 6.02 + 20; }
  else if (crashPoint < 10) { result = (crashPoint - 5) * 2 + 30; }
  else if (crashPoint < 50) { result = (crashPoint - 10) * 0.25 + 40; }
  else { result = 50; }
  
  return Math.round(result);
}

function getLastStats(hash) {
  const gameIds = [];
  const crashPoints = [];
  const weights = [];
  
  for (let index = 1; index <= 100; index++) {
    gameIds.push(index);
    const crashPoint = roo.crashPointFromHash(hash);
    crashPoints.push(crashPoint);
    weights.push(calculateWeight(crashPoint));
    
    hash = roo.generateHash(hash);
  }
  
  return { gameIds, crashPoints, weights };
}

// --------------------------------------------------------------------------------------------- API

app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.listen(34567, () => console.log("CORS-enabled web server listening on port 34567"));

app.get('/hash-chart/:hash', param('hash').escape(), (request, response) => {
  
  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
  console.log(request.rawHeaders );
  console.log(request.params);
  console.log();
  
  let lastHash = request.params['hash'];
  
  console.log("HASH: " + lastHash);
  //gameStart(lastHash);
  
  response.json(getLastStats(lastHash));
});

app.get('/hash/:hash', param('hash').escape(), (request, response) => {
  
  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
  console.log(request.rawHeaders );
  console.log(request.params);
  console.log();
  
  let lastHash = request.params['hash'];
  console.log("HASH: " + lastHash);
  //gameStart(lastHash);
  response.json(visual.displayStats(lastHash));
});

app.get('/lossMultiplier/:lossMultiplier/cashOutOn/:cashOutOn/initialBankroll/:initialBankroll', (request, response) => {
  
  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
 // console.log(request.headers  );
  console.log(request.params);
  console.log();
  
  let defaultHash = "fa28e84d9c9b48682aaf7df9e23c5e2dccd7e19ef72814e948db58518fb7e996";
  
  // let resetOnWin = request.params['resetOnWin'];
  // let winMultiplier =parseFloat(request.params['winMultiplier']);
  
  let initialBankroll = 350;//parseFloat(request.params['initialBankroll']);
  let lossMultiplier = parseFloat(request.params['lossMultiplier']);
  let cashOutOn = parseFloat(request.params['cashOutOn']);
  
  let result = basicStrategy(defaultHash, lossMultiplier, cashOutOn);
  basicStrategyHelper(defaultHash, lossMultiplier, cashOutOn, initialBankroll);
  //console.log(result);
  
  response.json(result);
});

console.log("ALL MUST BE OK!!!");



function avgs() {
  let hash = '2bc8a9f2289a6d706cdb150949691f1f9e956a7ec20c937c304d69316784be7e';
  let vals = [1.2, 1.4, 1.6, 1.8, 2, 2, 2.5, 3.33, 5, 10, 50];
  let counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let index = 0, c = 0; index < 2000000; index++) {
    let crashPoint = roo.crashPointFromHash(hash);
    for (let i = 0; i < 5; i++) {
      if (crashPoint < vals[i]) {
        counts[i] = counts[i] + 1;
      }
    }
    for (let i = 5; i < 11; i++) {
      if (crashPoint >= vals[i]) {
        counts[i] = counts[i] + 1;
      }
    }
    if (index % 200000 == 0) {
      console.log('tick')
    }
    hash = roo.generateHash(hash);
  }
  let coef = counts.map(e => 2000000 / e);
  
  for (let i = 0; i < 11; i++) {
    console.log("val = " + vals[i] + ", coef = " + coef[i]);
  }
}
//avgs();

//app.use(express.static('public'));
//visual.displayStats(crashHash);
//gameStart(crashHash);


