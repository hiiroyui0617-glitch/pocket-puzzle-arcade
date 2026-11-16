import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSudoku, countSolutions, candidates, findConflicts, sudokuComplete } from '../src/sudoku.js';
import { applyGate, generateGates, runGate } from '../src/gates.js';
import { newBlockState, fits, placePiece, canPlaceAnywhere } from '../src/blocks.js';

test('generated Sudoku is valid and has a unique solution (every difficulty)',()=>{
  for (const level of ['easy','normal','hard']) {
    const s=generateSudoku(level);
    assert.equal(s.puzzle.length,81);
    assert.equal(s.solution.length,81);
    assert.equal(countSolutions(s.puzzle,2),1,`difficulty ${level}`);
    assert.equal(findConflicts(s.solution).size,0);
    for(let i=0;i<81;i++) if(s.puzzle[i])assert.equal(s.puzzle[i],s.solution[i]);
    assert.equal(sudokuComplete({board:s.solution,solution:s.solution}),true);
  }
});
test('Sudoku candidates and conflicts find duplicate row',()=>{
  const a=Array(81).fill(0);
  a[0]=1;a[1]=1;
  assert.deepEqual([...findConflicts(a)].sort((a,b)=>a-b),[0,1]);
  assert.equal(candidates(a,2).includes(1),false);
});
test('gates compute four operations and apply round/finish',()=>{
  assert.equal(applyGate(10,{op:'+',amount:3}),13);
  assert.equal(applyGate(10,{op:'-',amount:20}),1);
  assert.equal(applyGate(10,{op:'×',amount:3}),30);
  assert.equal(applyGate(10,{op:'÷',amount:3}),3);
  let s={stages:[[{op:'+',amount:5},{op:'×',amount:2}]],round:0,value:10,finished:false,history:[]};
  s=runGate(s,1);
  assert.equal(s.value,20);assert.equal(s.finished,true);assert.equal(s.history.length,1);
  assert.equal(runGate(s,0),s);
  assert.equal(generateGates(12).length,12);
});
test('block placement, line clearing and combo',()=>{
  let state={board:Array(64).fill(0),pieces:[{cells:[[0,0]],color:1},null,null],score:0,combo:0,moves:0,over:false};
  state.board.fill(1,0,7);
  const placed=placePiece(state,0,0,7,()=>0);
  assert.ok(placed);
  assert.equal(placed.board.slice(0,8).every(v=>v===0),true);
  assert.equal(placed.lines,1);
  assert.equal(placed.score,105);
  assert.equal(placed.combo,1);
  assert.equal(placed.moves,1);
  assert.equal(placed.pieces.length,3);
});
test('block fit disallows overlaps and grid bounds',()=>{
  const s=newBlockState(()=>0);
  const piece={cells:[[0,0],[1,0]],color:1};
  assert.equal(fits(s.board,piece,0,7),false);
  assert.equal(fits(s.board,piece,0,0),true);
  s.board[0]=1;
  assert.equal(fits(s.board,piece,0,0),false);
  assert.equal(canPlaceAnywhere(Array(64).fill(1),piece),false);
  assert.equal(placePiece(s,0,10,10),null);
});

test('clears a completed column without clearing neighboring cells', () => {
  let s={board:Array(64).fill(0),pieces:[{cells:[[0,0]],color:3},null,null],score:0,combo:0,moves:0,over:false};
  for(let r=0;r<7;r++)s.board[r*8+2]=1;
  s.board[7*8+1]=5;
  const next=placePiece(s,0,7,2,()=>0);
  assert.equal(next.lines,1);
  assert.equal(next.board[7*8+1],5);
  assert.equal(next.board.every((v,i)=>i%8!==2 || v===0),true);
});
test('clears a row and column simultaneously, with a combo bonus', () => {
  let s={board:Array(64).fill(0),pieces:[{cells:[[0,0]],color:2},null,null],score:10,combo:1,moves:0,over:false};
  for(let c=0;c<7;c++)s.board[0*8+c]=1;
  for(let r=1;r<8;r++)s.board[r*8+7]=1;
  const next=placePiece(s,0,0,7,()=>0);
  assert.equal(next.lines,2);
  assert.equal(next.combo,2);
  assert.equal(next.score,415);
  assert.equal(next.board.every(v=>v===0),true);
});
test('random block pieces can all be placed on a fresh board',()=>{
  for(let n=0;n<100;n++){
    const s=newBlockState();
    assert.equal(s.board.length,64);
    assert.equal(s.pieces.length,3);
    assert.equal(s.pieces.every(p=>canPlaceAnywhere(s.board,p)),true);
  }
});
