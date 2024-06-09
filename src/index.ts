import './style.css'

// import $, { timers } from 'jquery';
import { Subscription, interval } from 'rxjs';
import { TwistyPlayer } from 'cubing/twisty';
import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';

import * as THREE from 'three';

import {
  now,
  connectGanCube,
  GanCubeConnection,
  GanCubeEvent,
  GanCubeMove,
  MacAddressProvider,
  makeTimeFromTimestamp,
  cubeTimestampCalcSkew,
  cubeTimestampLinearFit
} from 'gan-web-bluetooth';

import { faceletsToPattern, patternToFacelets } from './utils';

const SOLVED_STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

const defaultStartAvg:number = 10;
const badTimePriority:number = 4; //0 = no priority
const averageOf:number = 5;
const notCounted:number = 1;

interface AlgInterface{
  alg:string;
  times:number[];
  avg:number;
  index:number
}

var algStrings:string[] = [
  "r U R' U' M U R U' R'",
  "R U R' U' M' U R U' r'",
  "R U R' U' R U' R' F' U' F R U R'",
  "F U R U2 R' U' R U2 R' U' F'",
  "R U R' U R U2 R' F R U R' U' F'",
  "R' U' R U' R' U2 R F R U R' U' F'",
  "f R f' U' r' U' R U M'",
  "R' U' R' F R F' U R",
  "R U R' U' R' F R2 U R' U' F'",
  "R U R' U R' F R F' R U2 R'",
  "R U2 R2 F R F' R U2 R'",
  "F R U' R' U' R U R' F'",
  "F U R U' R2 F' R U R U' R'",
  "F' U' L' U L2 F L' U' L' U L",
  "l' U' l L' U' L U l' U l",
  "r U r' R U R' U' r U' r'",
  "F' L' U' L U L' U' L U F",
  "F R U R' U' R U R' U' F'",
  "r U' r2 U r2 U r2 U' r",
  "r' U r2 U' r2 U' r2 U r'",
  "l' U' L U' L' U L U' L' U2 l",
  "r U R' U R U' R' U R U2 r'",
  "r U R' U R U2 r'",
  "r' U' R U' R' U2 r",
  "r' R2 U R' U R U2 R' U M'",
  "M' R' U' R U' R' U2 R U' M",
  "L F' L' U' L U F U' L'",
  "R' F R U R' U' F' U R",
  "f R U R' U' R U R' U' f'",
  "R U R' U R d' R U' R' F' d",
  "R U2 R2 U' R U' R' U2 F R F'",
  "r U r' U R U' R' U R U' R' r U' r'",
  "S' L' U' L U L F' L' f",
  "S R U R' U' R' F R f'",
  "f' L' U' L U f",
  "f R U R' U' f'",
  "r' U2 R U R' U r",
  "r U2 R' U' R U' r'",
  "R U R' U' R' F R F'",
  "F R U R' U' F'",
  "L' U' L U' L' U L U L F' L' F",
  "R U R' U R U' R' U' R' F R F'"
]

var algs:AlgInterface[] = [];

for(i = 0; i < algStrings.length; i++){
  var alg:AlgInterface = {
    alg: algStrings[i],
    times: [],
    avg: defaultStartAvg,
    index: i
  }
  algs.push(alg)
}


// var algs = [
//   {
//     "name":"28",
//     "alg":"r U R' U' M U R U' R'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"57",
//     "alg":"R U R' U' M' U R U' r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"29",
//     "alg":"R U R' U' R U' R' F' U' F R U R'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"30",
//     "alg":"F U R U2 R' U' R U2 R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"41",
//     "alg":"R U R' U R U2 R' F R U R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"42",
//     "alg":"R' U' R U' R' U2 R F R U R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"34",
//     "alg":"f R f' U' r' U' R U M'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"46",
//     "alg":"R' U' R' F R F' U R",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"9",
//     "alg":"R U R' U' R' F R2 U R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"10",
//     "alg":"R U R' U R' F R F' R U2 R'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"35",
//     "alg":"R U2 R2 F R F' R U2 R'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"37",
//     "alg":"F R U' R' U' R U R' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"13",
//     "alg":"F U R U' R2 F' R U R U' R'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"14",
//     "alg":"F' U' L' U L2 F L' U' L' U L",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"15",
//     "alg":"l' U' l L' U' L U l' U l",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"16",
//     "alg":"r U r' R U R' U' r U' r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"47",
//     "alg":"F' L' U' L U L' U' L U F",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"48",
//     "alg":"F R U R' U' R U R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"49",
//     "alg":"r U' r2 U r2 U r2 U' r",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"50",
//     "alg":"r' U r2 U' r2 U' r2 U r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"53",
//     "alg":"l' U' L U' L' U L U' L' U2 l",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"54",
//     "alg":"r U R' U R U' R' U R U2 r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"7",
//     "alg":"r U R' U R U2 r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"8",
//     "alg":"r' U' R U' R' U2 r",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"11",
//     "alg":"r' R2 U R' U R U2 R' U M'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"12",
//     "alg":"M' R' U' R U' R' U2 R U' M",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"39",
//     "alg":"L F' L' U' L U F U' L'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"40",
//     "alg":"R' F R U R' U' F' U R",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"51",
//     "alg":"f R U R' U' R U R' U' f'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"52",
//     "alg":"R U R' U R d' R U' R' F' d",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"55",
//     "alg":"R U2 R2 U' R U' R' U2 F R F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"56",
//     "alg":"r U r' U R U' R' U R U' R' r U' r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"31",
//     "alg":"S' L' U' L U L F' L' f",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"32",
//     "alg":"S R U R' U' R' F R f'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"43",
//     "alg":"f' L' U' L U f",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"44",
//     "alg":"f R U R' U' f'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"5",
//     "alg":"r' U2 R U R' U r",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"6",
//     "alg":"r U2 R' U' R U' r'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"33",
//     "alg":"R U R' U' R' F R F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"45",
//     "alg":"F R U R' U' F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"36",
//     "alg":"L' U' L U' L' U L U L F' L' F",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
//   {
//     "name":"38",
//     "alg":"R U R' U R U' R' U' R' F R F'",
//     "times":[],
//     "avg":defaultStartAvg,
//     "index":0
//   },
// ]


for(var i = 0; i < algs.length; i++){
  algs[i].index = i;
  // console.log(algs[i].alg)
}

var practiceIsActive = false;
var isPaused = false;
var currentAlgIndex:number = 0;
var lastAlgIndex:number = 0;
var algStart:number = 0;

function updateStats(){
  var algsCopy = algs.slice()
  algsCopy.sort((a,b) => (a.avg < b.avg) ? 1 : ((b.avg < a.avg) ? -1 : 0))
  $("#stats").empty()
  var maxAvg = 0;
  for(var i = 0; i < algsCopy.length; i++){
    if(algsCopy[i].avg > maxAvg){
      maxAvg = algsCopy[i].avg
    }
  }
  for(var i = 0; i < algsCopy.length; i++){
    if(algsCopy[i].index == currentAlgIndex){
      $("#stats").append(`<div class="bar current" style="width:${algsCopy[i].avg/maxAvg * 100}%; height:${100/algsCopy.length}%">${algsCopy[i].avg.toFixed(2)}</div>`);
    }
    else if(algsCopy[i].index == lastAlgIndex){
      $("#stats").append(`<div class="bar last"    style="width:${algsCopy[i].avg/maxAvg * 100}%; height:${100/algsCopy.length}%">${algsCopy[i].avg.toFixed(2)}</div>`);
    }
    else{
      $("#stats").append(`<div class="bar"         style="width:${algsCopy[i].avg/maxAvg * 100}%; height:${100/algsCopy.length}%">${algsCopy[i].avg.toFixed(2)}</div>`);
    }
  }
}

updateStats()


var twistyPlayer = new TwistyPlayer({
  puzzle: '3x3x3',
  visualization: 'PG3D',
  experimentalStickering:"OLL",
  alg: '',
  experimentalSetupAnchor: 'start',
  background: 'none',
  controlPanel: 'none',
  // hintFacelets: 'hintFacelets',
  hintFacelets: 'none',
  experimentalDragInput: 'none',
  cameraLatitude: 0,
  cameraLongitude: 0,
  cameraLatitudeLimit: 0,
  tempoScale: 5
});

$('#cube').append(twistyPlayer);

var conn: GanCubeConnection | null;
var lastMoves: GanCubeMove[] = [];
var solutionMoves: GanCubeMove[] = [];

var twistyScene: THREE.Scene;
var twistyVantage: any;

const HOME_ORIENTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(30 * Math.PI / 180, 0 * Math.PI / 180, 0));
var cubeQuaternion: THREE.Quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(30 * Math.PI / 180, 0 * Math.PI / 180, 0));

async function amimateCubeOrientation() {
  if (!twistyScene || !twistyVantage) {
    var vantageList = await twistyPlayer.experimentalCurrentVantages();
    twistyVantage = [...vantageList][0];
    twistyScene = await twistyVantage.scene.scene();
  }
  twistyScene.quaternion.slerp(cubeQuaternion, 0.25);
  twistyVantage.render();
  requestAnimationFrame(amimateCubeOrientation);
}
requestAnimationFrame(amimateCubeOrientation);

var basis: THREE.Quaternion | null;

async function handleGyroEvent(event: GanCubeEvent) {
  if (event.type == "GYRO") {
    let { x: qx, y: qy, z: qz, w: qw } = event.quaternion;
    let quat = new THREE.Quaternion(qx, qz, -qy, qw).normalize();
    if (!basis) {
      basis = quat.clone().conjugate();
    }
    cubeQuaternion.copy(quat.premultiply(basis).premultiply(HOME_ORIENTATION));
    $('#quaternion').val(`x: ${qx.toFixed(3)}, y: ${qy.toFixed(3)}, z: ${qz.toFixed(3)}, w: ${qw.toFixed(3)}`);
    if (event.velocity) {
      let { x: vx, y: vy, z: vz } = event.velocity;
      $('#velocity').val(`x: ${vx}, y: ${vy}, z: ${vz}`);
    }
  }
}

async function handleMoveEvent(event: GanCubeEvent) {
  if (event.type == "MOVE") {
    if (timerState == "READY") {
      setTimerState("RUNNING");
    }
    // console.log(typeof(event.move))
    // console.log(event.move)
    twistyPlayer.experimentalAddMove(event.move, { cancel: false });
    lastMoves.push(event);
    if (timerState == "RUNNING") {
      solutionMoves.push(event);
    }
    if (lastMoves.length > 256) {
      lastMoves = lastMoves.slice(-256);
    }
    if (lastMoves.length > 10) {
      var skew = cubeTimestampCalcSkew(lastMoves);
      $('#skew').val(skew + '%');
    }
  }
}

var cubeStateInitialized = false;

async function handleFaceletsEvent(event: GanCubeEvent) {
  if (event.type == "FACELETS" && !cubeStateInitialized) {
    if (event.facelets != SOLVED_STATE) {
      var kpattern = faceletsToPattern(event.facelets);
      var solution = await experimentalSolve3x3x3IgnoringCenters(kpattern);
      var scramble = solution.invert();
      twistyPlayer.alg = scramble;
    } else {
      twistyPlayer.alg = '';
    }
    cubeStateInitialized = true;
    console.log("Initial cube state is applied successfully", event.facelets);
  }
}

function handleCubeEvent(event: GanCubeEvent) {
  // console.log("GanCubeEvent", event);
  if (event.type == "GYRO") {
    handleGyroEvent(event);
  } else if (event.type == "MOVE") {
    handleMoveEvent(event);
  } else if (event.type == "FACELETS") {
    handleFaceletsEvent(event);
  } else if (event.type == "HARDWARE") {
    $('#hardwareName').val(event.hardwareName);
    $('#hardwareVersion').val(event.hardwareVersion);
    $('#softwareVersion').val(event.softwareVersion);
    $('#gyroSupported').val(event.gyroSupported ? "YES" : "NO");
  } else if (event.type == "BATTERY") {
    $('#batteryLevel').val(event.batteryLevel + '%');
  } else if (event.type == "DISCONNECT") {
    twistyPlayer.alg = '';
    $('.info input').val('- n/a -');
    $('#connect').html('Connect');
  }
}

const customMacAddressProvider: MacAddressProvider = async (device, isFallbackCall): Promise<string | null> => {
  if (isFallbackCall) {
    return prompt('Unable do determine cube MAC address!\nPlease enter MAC address manually:');
  } else {
    return typeof device.watchAdvertisements == 'function' ? null :
      prompt('Seems like your browser does not support Web Bluetooth watchAdvertisements() API. Enable following flag in Chrome:\n\nchrome://flags/#enable-experimental-web-platform-features\n\nor enter cube MAC address manually:');
  }
};

$('#reset-state').on('click', async () => {
  await conn?.sendCubeCommand({ type: "REQUEST_RESET" });
  twistyPlayer.alg = '';
});

$('#reset-gyro').on('click', async () => {
  basis = null;
});

$('#connect').on('click', async () => {
  if (conn) {
    conn.disconnect();
    conn = null;
  } else {
    conn = await connectGanCube(customMacAddressProvider);
    conn.events$.subscribe(handleCubeEvent);
    await conn.sendCubeCommand({ type: "REQUEST_HARDWARE" });
    await conn.sendCubeCommand({ type: "REQUEST_BATTERY" });
    await conn.sendCubeCommand({ type: "REQUEST_FACELETS" });
    $('#deviceName').val(conn.deviceName);
    $('#deviceMAC').val(conn.deviceMAC);
    $('#connect').html('Disconnect');
  }
});

var timerState: "IDLE" | "READY" | "RUNNING" | "STOPPED" = "IDLE";

function setTimerState(state: typeof timerState) {
  timerState = state;
  switch (state) {
    case "IDLE":
      stopLocalTimer();
      $('#timer').hide();
      break;
    case 'READY':
      setTimerValue(0);
      $('#timer').show();
      $('#timer').css('color', '#0f0');
      break;
    case 'RUNNING':
      solutionMoves = [];
      startLocalTimer();
      $('#timer').css('color', '#999');
      break;
    case 'STOPPED':
      stopLocalTimer();
      $('#timer').css('color', '#fff');
      var fittedMoves = cubeTimestampLinearFit(solutionMoves);
      var lastMove = fittedMoves.slice(-1).pop();
      setTimerValue(lastMove ? lastMove.cubeTimestamp : 0);
      break;
  }
}

function setupAlg(alg:string){
  var algArray = alg.split(" ");
  for(var i = 0; i < algArray.length; i++){
    var move = algArray[algArray.length - i - 1]
    var lastSymbol = move[move.length - 1]
    if(lastSymbol == "2"){
    }
    else if(lastSymbol == "'"){
      move = move.substring(0, move.length-1)
    }
    else{
      move += "'"
    }
    twistyPlayer.experimentalAddMove(move, { cancel:false });
  }
  for(i = 0; i < Math.floor(Math.random()*5); i++){
    twistyPlayer.experimentalAddMove("U", { cancel:false });
  }
}

function nextAlg(){
  $('#alg').html("")

  lastAlgIndex = currentAlgIndex;

  var sumOfAvgs:number = 0;
  for(var i = 0; i < algs.length; i++){
    sumOfAvgs += Math.pow(algs[i].avg, badTimePriority);
  }
  var randomVar = Math.random() * sumOfAvgs;
  sumOfAvgs = 0;
  for(var i = 0; i < algs.length; i++){
    sumOfAvgs += Math.pow(algs[i].avg, badTimePriority);
    if(sumOfAvgs > randomVar){
      currentAlgIndex = i;
      break;
    }
  }
  console.log(algs[currentAlgIndex]);
  setupAlg(algs[currentAlgIndex].alg)
  algStart = Date.now()
  updateStats()
}

function avg(times:number[]){
  var timesCopy:number[] = times.slice()
  var actualNotCounted:number = notCounted;
  while(timesCopy.length <= actualNotCounted*2){
    actualNotCounted -= 1;
  }
  timesCopy.sort();
  console.log(timesCopy)
  var cumsum = 0;
  for(var i = actualNotCounted; i < timesCopy.length-actualNotCounted; i++){
    cumsum += timesCopy[i]
  }
  console.log(cumsum/(timesCopy.length-actualNotCounted*2))
  return cumsum/(timesCopy.length-actualNotCounted*2);
}

twistyPlayer.experimentalModel.currentPattern.addFreshListener(async (kpattern) => {
  var facelets = patternToFacelets(kpattern);
  if(facelets.substring(0,9) == "UUUUUUUUU" && practiceIsActive){
    console.log("OLL solved!")
    var algStop = Date.now();
    var algTime = (algStop - algStart!)/1000;
    algs[currentAlgIndex!].times.push(algTime);
    if(algs[currentAlgIndex!].times.length > averageOf){
      algs[currentAlgIndex!].times.shift();
    }
    console.log(algs[currentAlgIndex!].times)

    algs[currentAlgIndex!].avg = avg(algs[currentAlgIndex!].times)

    var cumsum = 0
    for(var i = 0; i < algs.length; i++){
      cumsum += algs[i].avg;
    }
    var totalAvg = cumsum/algs.length;

    $('#totalAvg').html("Total average: " + totalAvg.toFixed(2))
    $('#lastTime').html("Last time: " + algTime.toFixed(2))
    // $('#avgTime').html("Alg average: " + algs[currentAlgIndex!].avg.toFixed())

    

    nextAlg()
  }
  // if (facelets == SOLVED_STATE) {
  //   if (timerState == "RUNNING") {
  //     setTimerState("STOPPED");
  //   }
  //   twistyPlayer.alg = '';
  // }
});

function setTimerValue(timestamp: number) {
  let t = makeTimeFromTimestamp(timestamp);
  $('#timer').html(`${t.minutes}:${t.seconds.toString(10).padStart(2, '0')}.${t.milliseconds.toString(10).padStart(3, '0')}`);
}

var localTimer: Subscription | null = null;
function startLocalTimer() {
  var startTime = now();
  localTimer = interval(30).subscribe(() => {
    setTimerValue(now() - startTime);
  });
}

function stopLocalTimer() {
  localTimer?.unsubscribe();
  localTimer = null;
}

function activateTimer() {
  if (timerState == "IDLE" && conn) {
    setTimerState("READY");
  } else {
    setTimerState("IDLE");
  }
}



$(document).on('keydown', (event) => {
  console.log(event.which)
  if (event.which == 32) {
    // spacebar
    event.preventDefault();
    basis = null;
    //activateTimer();
  }
  if (event.which == 83) {
    // s key
    if(!practiceIsActive){
      practiceIsActive = true;
      twistyPlayer.alg = "";
      nextAlg();
    }
  }
  if (event.which == 68) {
    // d key
    if(practiceIsActive){
      $('#alg').html(algs[currentAlgIndex].alg)
    }
  }
  if (event.which == 80) {
    // p key
    if(!isPaused){
      isPaused = true;
      $('#paused').html("Paused")
    }
    else{
      isPaused = false;
      $('#paused').html("")
      algStart = Date.now()
    }
  }
});

$("#cube").on('touchstart', () => {
  activateTimer();
});
