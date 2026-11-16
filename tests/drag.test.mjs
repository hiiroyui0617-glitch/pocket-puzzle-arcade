import test from 'node:test';
import assert from 'node:assert/strict';
import { positionForDrag, snapToBoard } from '../src/block-drag.js';

test('drag ghost is centered on cursor and lifted for touch',()=>{
  const pos=positionForDrag(220,320,2,3,40,40,4,4,78);
  assert.deepEqual(pos,{left:182,top:184,width:76,height:116});
});
test('board snapping handles all 8x8 indices and out-of-bounds',()=>{
  const v=(x,y)=>snapToBoard(x,y,20,30,42,42);
  assert.equal(v(20,30),0);
  assert.equal(v(20+42*7,30+42*7),63);
  assert.equal(v(20+42*3.49,30+42*4.4),4*8+3);
  assert.equal(v(20-42,30),-1);
  assert.equal(v(20+42*8,30),-1);
  assert.equal(v(20,30+42*8),-1);
});
test('drag geometry rejects malformed pointer values',()=>{
  assert.equal(snapToBoard(NaN,20,0,0,40,40),-1);
  assert.equal(snapToBoard(0,0,0,0,0,40),-1);
});
