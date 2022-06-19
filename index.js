const express =  require('express');
const app = express();

const Queue =  require('./utils/MyQueue');
const roo = require('./core/Roo');
const visual = require('./utils/Visual');


// write data points in a csv
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const headerConfig = [
  {id: 'games', value: 'Games'},
  {id: 'balance', value: 'Balance'}
];

const csvWriter = createCsvWriter({
  path: 'public/result.csv',
  header: [
    {id: 'games', value: 'Games'},
    {id: 'balance', value: 'Balance'},
  ]
});

let data = [];
function addInTheData(k, v){
  data[data.length] = {'games': k, 'balance': v};
}
//----------------------------------------------------------------------------------------------------------------- The Hashes

//hashes
//const crashHash =  "2f48fb477f0d0063ba97de02ab3f4a6d3c091d1990ec232408eef4fb6cf85950";
//const firstHash =  "786efb849f4062cc471ed4c1b2de334fa4ef2c30f7a611db82ac130cd0275255";

 const firstHash =  "dd11d85f91f5ee022dc34bd4a65b4e8e95beaf4dc497389c82501372a7a798da";
//arg1
const crashHash = process.argv.slice(2).toString();

// ------------------------------------- Globals ------------------------------------------------ //
const queueSize = 30; // -- to change with the change in cashOutPoint

const initialBet = 1;
const cashOutPoint = 3;
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

function resetStrategy(){
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

function initQueue(theHashForQ){
  let currentHashForEnQ = theHashForQ;
  //console.log("LAST KNOWN: " + roo.crashPointFromHash(currentHashForEnQ));
  for (let index = 0; index < queueSize; index++) {  
    queue.enqueue(roo.crashPointFromHash(currentHashForEnQ));
    currentHashForEnQ = roo.generateHash(currentHashForEnQ);
  }
  lastHashInTheQueue = currentHashForEnQ;
}

function updateQueue(){
  queue.enqueue(roo.crashPointFromHash(lastHashInTheQueue));
  lastHashInTheQueue = roo.generateHash(lastHashInTheQueue);
}

//-------------------------------------------------------------------------------------------------------------------MAIN

function gameStart(theHash) {
  
 // initQueue(theHash);
  let hash = theHash;
  
 // while (hash != firstHash) {
 for(let i = 0; i < 50000; i++){
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
  console.log("Bankroll: { gamesAll: " + gamesCounterTotal + ", gamesPlayed: " + gamesCounterPlayed+ ", moneyFinal: " + "\x1b[31m" +  bankroll + "\x1b[0m }");
  console.log("MaxPossibeLossUSD = " + losingStreakAmountMaxEver + ", maxPossibleConsecLosses = " + lostGamesInARowMaxEver + ", + losingStreakAmountCurrent:  " + losingStreakAmountCurrent );
 // queue.showAll();
  
  csvWriter
  .writeRecords(Array.from(data))
  .then(()=> console.log('The CSV file was written successfully'));
}

function makeTheBet(currentScore){
  
  gamesCounterPlayed++;
  bankroll -= currentBet;
  
  if (isGameWin(currentScore)){
    
    bankroll += currentBet * cashOutPoint;
    resetStrategy();
    
  } else {
    
    losingStreakAmountCurrent -= currentBet;
    if(losingStreakAmountMaxEver > losingStreakAmountCurrent)
    losingStreakAmountMaxEver = losingStreakAmountCurrent;
    
    lostGamesInARowCurrent++;
    if(lostGamesInARowMaxEver < lostGamesInARowCurrent)
    lostGamesInARowMaxEver = lostGamesInARowCurrent;
    
    if(lostGamesInARowCurrent % intervalOfBetIncrease == 0){
      currentBet *= betIncreaseMultiplier;
    }
  }
  
  if(gamesCounterPlayed % 50 == 0 && gamesCounterPlayed > 1){
    addInTheData(gamesCounterPlayed, bankroll);
  }     
}

// ------------------------------------- BASIC STRATEGY


function basicStrategyHelper(hash, lossMultiplier, cashOutOn, initialBankroll){

  initQueue(hash);

  let bakrollFinal = 0;
  let bankrollTemp = initialBankroll * lossMultiplier;
  let currentBet = 1;

  let lossesInARowCurrent = 0;
  
  let lossesC = 0;
  let winsC = 0;

 // console.log("1: " + winMultiplier + ", 2: " +  lossMultiplier + ", 3: " + cashOutOn);

  for (let index = 0; index < 400000; index++) {
    updateQueue();

    if(queue.isTableHot()){
      bankrollTemp -= currentBet;
      let currentcrashPoint = roo.crashPointFromHash(hash);
  
      if(isGameWin2(currentcrashPoint, cashOutOn)){ // WIN
  
        bankrollTemp += currentBet * cashOutOn;
  
        currentBet = 1;
        lossesInARowCurrent = 0;
  
        if(bankrollTemp > initialBankroll * 2 ){
          bakrollFinal += bankrollTemp - initialBankroll;
          ++winsC;
          bankrollTemp = initialBankroll;
        }
  
      } else {                   // ----------------- LOSS
  
        currentBet *= lossMultiplier;
        lossesInARowCurrent++;
  
        if(bankrollTemp - currentBet < 0 ){
          bakrollFinal -= initialBankroll - bankrollTemp;
          ++lossesC;
          bankrollTemp = initialBankroll;
          lossesInARowCurrent = 0;
          currentBet = 1;
        }
      }

    }
    hash = roo.generateHash(hash);
  }

  console.log("------------------------------------------------");
  console.log("WINS: " + winsC + ", LOSSES: " + lossesC + ", Final: " + bakrollFinal);
  console.log("------------------------------------------------");
}

function basicStrategy(hash, lossMultiplier, cashOutOn){

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

    if(isGameWin2(currentcrashPoint, cashOutOn)){ // WIN

      bankroll += currentBet * cashOutOn;
      currentBet = 1;
      lossesInARowCurrent = 0;

    } else {                   // ----------------- LOSS

      currentBet *= lossMultiplier;
      lossesInARowCurrent++;
      if(lossesInARowCurrent > lossesInARowMax) {
        lossesInARowMax = lossesInARowCurrent;
        maxBet = currentBet;
      }
    }

    hash = roo.generateHash(hash);

    if(index % 50 == 0 && index > 1){
      games.push(index);
      balance.push(bankroll);
    }
  }

  console.log("Max Bet = " + maxBet);
  console.log("Maximum consecutive Losses = " + lossesInARowMax);
  return {games, balance};  
}

function getLastStats(hash){
  let gameIds = [];
  let crashPoints = [];

  for (let index = 1; index <= 20; index++) {
    gameIds.push(index);
    crashPoints.push(roo.crashPointFromHash(hash));
    hash = roo.generateHash(hash);
  }

  return {gameIds, crashPoints};
}

// --------------------------------------------------------------------------------------------- API

app.listen(34567, () => console.log("Listening at 34567"));

app.get('/hash-chart/:hash', (request, response)  => {

  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
  // console.log("request.rawHeaders");
  // console.log(request.rawHeaders );
  // console.log(request.params);
  console.log();

  let lastHash = request.params['hash'];
  console.log("HASH: " + lastHash);
  //gameStart(lastHash);
  
  response.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": request.headers.origin
  });

  response.json( getLastStats(lastHash) );
});

app.get('/hash/:hash', (request, response)  => {

  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
  // console.log("request.rawHeaders");
  // console.log(request.rawHeaders );
  // console.log(request.params);
  console.log();

  let lastHash = request.params['hash'];
  console.log("HASH: " + lastHash);
  //gameStart(lastHash);
  
  response.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": request.headers.origin
  });

  response.json( visual.displayStats(lastHash));
});

app.get('/lossMultiplier/:lossMultiplier/cashOutOn/:cashOutOn/initialBankroll/:initialBankroll', (request, response) => {

  console.log("------------------------------------------------------");
  console.log("IP: " + request.ip);
  console.log("request.rawHeaders");
  console.log(request.headers  );
  console.log(request.params);
  console.log();


  let defaultHash = "fa28e84d9c9b48682aaf7df9e23c5e2dccd7e19ef72814e948db58518fb7e996";

  // let resetOnWin = request.params['resetOnWin'];
  // let winMultiplier =parseFloat(request.params['winMultiplier']);

  let initialBankroll = parseFloat(request.params['initialBankroll']);
  let lossMultiplier =  parseFloat(request.params['lossMultiplier']);

  let cashOutOn = parseFloat(request.params['cashOutOn']);

  let result =  basicStrategy(defaultHash, lossMultiplier, cashOutOn);
 // basicStrategyHelper(defaultHash, lossMultiplier, cashOutOn, initialBankroll);

  response.set({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": request.headers.origin
  });
  response.json( result );

});

console.log("ALL MUST BE OK!!!");

//app.use(express.static('public'));
//visual.displayStats(crashHash);
//gameStart(crashHash);