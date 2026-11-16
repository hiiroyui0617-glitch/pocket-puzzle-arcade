import { generateSudoku, findConflicts, sudokuComplete } from './sudoku.js';
import { applyGate, formatNumber, generateGates, runGate } from './gates.js';
import { GRID, newBlockState, placePiece, fits, canPlaceAnywhere } from './blocks.js';
import { loadData, saveData } from './storage.js';

let data = loadData();
let page = 'home';
let sudokuSelected = 0;
let notesMode = false;
let selectedPiece = 0;
let toastTimer = 0;
let audio = null;
let blockDrag = null;
const $ = selector => document.querySelector(selector);
const app = $('#app');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function persist() { saveData(data); }
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2100);
}
function tone(freq = 540, length = .08) {
  if (!data.settings.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(freq, audio.currentTime);
    gain.gain.setValueAtTime(.065, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + length);
  } catch { /* Audio is optional */ }
}
function openPage(next) {
  page = next;
  if (next === 'sudoku' && !data.sudoku) newSudoku('normal', false);
  if (next === 'gates' && !data.gates) newGates(false);
  if (next === 'blocks' && !data.blocks) newBlocks(false);
  if (next === 'blocks' && !data.blocks.pieces[selectedPiece]) selectedPiece = Math.max(0, data.blocks.pieces.findIndex(Boolean));
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}
function header() {
  return `<div class="shell"><header class="site-header">
    <div class="brand"><div class="brand-icon" aria-hidden="true">✦</div><div><div class="brand-title">PUZZLE BOX</div><div class="brand-sub">PLAY YOUR WAY</div></div></div>
    <div class="header-actions"><span class="chip">✦ 3 MINI GAMES</span><button id="sound-btn" class="sound-button" aria-label="サウンド ${data.settings.sound?'オフ':'オン'}" title="サウンド切り替え">${data.settings.sound?'♫':'♪̸'}</button></div>
  </header><nav class="nav" aria-label="ゲームの切り替え">
    ${[['home','🏠','ホーム'],['sudoku','🔢','数独'],['gates','⚡','ナンバーゲート'],['blocks','🧩','ブロック']].map(([id,icon,title]) => `<button class="nav-item ${page===id?'active':''}" data-nav="${id}" ${page===id?'aria-current="page"':''}><span class="nav-emoji" aria-hidden="true">${icon}</span><span>${title}</span></button>`).join('')}
  </nav>`;
}
const card = ({id, art, category, title, desc, stat}) => `<article class="game-card">
  <div class="card-art ${art}"><div class="art-glow"></div>${id==='sudoku' ? `<div class="sudoku-art-grid">${['1','','9','','5','','7','','3'].map(c=>`<span>${c}</span>`).join('')}</div>` : id==='gates' ? `<div class="gate-art-grid"><span>＋20</span><span>×3</span></div>` : `<div class="blocks-art-grid">${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>`<span class="${[1,2,5,6,9,10,11,14].includes(i)?'f':''}"></span>`).join('')}</div>`}</div>
  <div class="card-body"><div class="card-kicker">${category}</div><h2>${title}</h2><p>${desc}</p><div class="card-bottom"><button class="play-button" data-nav="${id}">遊ぶ →</button><span class="card-stat">${stat}</span></div></div>
</article>`;
function home() {
  return `<section class="hero"><div><p class="eyebrow">YOUR NEXT FAVORITE GAME</p><h1>ちょっとした時間に、<br><span class="gradient-text">夢中になれる3つのゲーム。</span></h1><p>登録不要・広告なし・無料。遊んだ記録はこの端末に保存されます。</p></div></section>
  <div class="cards">${[
    {id:'sudoku',art:'art-sudoku',category:'LOGIC / 01',title:'数独',desc:'1〜9の数字を埋める定番パズル。3段階の難易度、メモ、ヒントに対応。',stat:`クリア ${data.stats.sudokuWins} 回`},
    {id:'gates',art:'art-gates',category:'CHOICE / 02',title:'ナンバーゲート',desc:'左右のゲートを選んで数字を増やそう！12ステージで最高記録に挑戦。',stat:`最高 ${formatNumber(data.stats.gatesBest)}`},
    {id:'blocks',art:'art-blocks',category:'PUZZLE / 03',title:'ブロックパズル',desc:'ピースを8×8の盤面に配置。縦横のラインを揃えて消し続けよう。',stat:`最高 ${data.stats.blocksBest.toLocaleString('ja-JP')} pt`}
  ].map(card).join('')}</div><p class="footer">© PUZZLE BOX · オリジナルデザイン · 外部広告・課金・追跡なし</p>`;
}
function gameHeading(title, desc) {
  return `<div class="game-top"><div><h1 class="game-title">${title}</h1><p class="game-description">${desc}</p></div><button class="back-button" data-nav="home">← 戻る</button></div>`;
}

// -------- SUDOKU --------
function newSudoku(difficulty='normal', redraw=true) {
  const generated = generateSudoku(difficulty);
  data.sudoku = { ...generated, board:[...generated.puzzle], notes:Array.from({length:81},()=>[]),
    startedAt: Date.now(), elapsed:0, finished:false, mistakes:0, hints:0, undo:[] };
  sudokuSelected = data.sudoku.puzzle.findIndex(v => v === 0);
  notesMode = false;
  persist(); if (redraw) render();
}
function sudokuSeconds() {
  const s = data.sudoku;
  return s.elapsed + (s.finished ? 0 : Math.floor((Date.now() - s.startedAt)/1000));
}
function clockTime(t) { return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`; }
function updateSudokuWin() {
  const s = data.sudoku;
  if (s.finished || !sudokuComplete(s)) return;
  s.elapsed = sudokuSeconds(); s.finished = true;
  data.stats.sudokuWins++;
  if (data.stats.sudokuBest === null || s.elapsed < data.stats.sudokuBest) data.stats.sudokuBest = s.elapsed;
  tone(900,.23); toast('🎉 数独クリア！');
}
function sudokuSnapshot() {
  const s=data.sudoku;
  s.undo.push({board:[...s.board],notes:s.notes.map(x=>[...x])});
  if (s.undo.length>60) s.undo.shift();
}
function setSudokuDigit(value) {
  const s=data.sudoku, i=sudokuSelected;
  if (s.finished || i<0 || s.puzzle[i]) return;
  if (notesMode && value>0) {
    sudokuSnapshot();
    const note=new Set(s.notes[i]);
    if (note.has(value)) note.delete(value); else note.add(value);
    s.notes[i]=[...note]; s.board[i]=0;
  } else {
    if (s.board[i]===value && !s.notes[i].length) return;
    sudokuSnapshot(); s.board[i]=value; s.notes[i]=[];
    if (value && value!==s.solution[i]) {s.mistakes++;tone(210,.12);}
    else tone(550,.05);
  }
  updateSudokuWin();persist();render();
}
function sudokuHint() {
  const s=data.sudoku;
  if (s.finished) return;
  let i=sudokuSelected;
  if (i<0 || s.puzzle[i] || s.board[i]===s.solution[i]) {
    i=s.board.findIndex((v,k)=>!s.puzzle[k] && v!==s.solution[k]);
  }
  if (i===-1) return;
  sudokuSnapshot(); sudokuSelected=i; s.board[i]=s.solution[i];s.notes[i]=[];s.hints++;
  updateSudokuWin();persist();render();toast('ヒント：正しい数字を1マス入力しました');
}
function sudokuUndo() {
  const s=data.sudoku;
  if (s.finished || !s.undo.length) return;
  const prev=s.undo.pop();s.board=prev.board;s.notes=prev.notes;
  persist();render();
}
function sudokuContent() {
  const s=data.sudoku;
  const conflicts=findConflicts(s.board);
  const activeValue=s.board[sudokuSelected];
  const activeRow=Math.floor(sudokuSelected/9),activeCol=sudokuSelected%9;
  const filled=s.board.filter(Boolean).length;
  return `${gameHeading('数独','すべての行・列・3×3のマスに、1〜9を1度ずつ入れよう。')}
  <div class="game-layout"><div class="section-panel game-main">
  <div class="stats-row"><div class="stat-box"><div class="stat-heading">タイム</div><div class="stat-value" id="sudoku-timer">${clockTime(sudokuSeconds())}</div></div><div class="stat-box"><div class="stat-heading">進捗</div><div class="stat-value">${filled}/81</div></div><div class="stat-box"><div class="stat-heading">ヒント</div><div class="stat-value">${s.hints} 回</div></div></div>
  <div class="sudoku-board" role="grid" aria-label="数独盤面">${s.board.map((n,i)=>{
    const r=Math.floor(i/9),c=i%9;
    const peer=activeRow===r||activeCol===c||(Math.floor(r/3)===Math.floor(activeRow/3)&&Math.floor(c/3)===Math.floor(activeCol/3));
    const cl=['sudoku-cell',s.puzzle[i]?'given':'',i===sudokuSelected?'selected':'',i!==sudokuSelected&&n&&n===activeValue?'same':'',i!==sudokuSelected&&peer?'peer':'',conflicts.has(i)||(!s.puzzle[i]&&n&&n!==s.solution[i])?'wrong':''].filter(Boolean).join(' ');
    return `<button class="${cl}" data-cell="${i}" data-row="${r}" data-col="${c}" role="gridcell" aria-selected="${i===sudokuSelected}" aria-label="${r+1}行${c+1}列 ${n||'空欄'}${s.puzzle[i]?' 固定':''}" ${s.finished?'disabled':''}>${n?`${n}`:s.notes[i]?.length?`<span class="notes">${[1,2,3,4,5,6,7,8,9].map(k=>`<span>${s.notes[i].includes(k)?k:''}</span>`).join('')}</span>`:''}</button>`;
  }).join('')}</div>
  <div class="number-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-digit="${n}" ${s.finished?'disabled':''}>${n}</button>`).join('')}</div>
  <div class="sudoku-toolrow"><button class="secondary-button erase-pad" data-digit="0" ${s.finished?'disabled':''}>⌫ 消去</button><button id="note-mode" class="secondary-button ${notesMode?'active':''}" ${s.finished?'disabled':''}>✎ メモ ${notesMode?'ON':'OFF'}</button><button id="undo-sudoku" class="secondary-button" ${s.finished||!s.undo.length?'disabled':''}>↶ 戻す</button><button id="sudoku-hint" class="secondary-button" ${s.finished?'disabled':''}>✦ ヒント</button></div>
  ${s.finished?`<div class="finish-panel"><h3>🎉 クリア！</h3><p>${clockTime(s.elapsed)} で解き終わりました。おめでとう！</p><button class="primary-button" id="sudoku-again">次の問題 →</button></div>`:''}
  </div><aside class="game-sidebar"><div class="section-panel"><h2 class="note-title">ゲーム設定</h2><p class="help">難易度を選んで「新しい問題」を押すと、新しい盤面が生成されます。</p><select id="sudoku-difficulty" class="control-select" aria-label="難易度"><option value="easy" ${s.difficulty==='easy'?'selected':''}>やさしい</option><option value="normal" ${s.difficulty==='normal'?'selected':''}>ふつう</option><option value="hard" ${s.difficulty==='hard'?'selected':''}>むずかしい</option></select><div style="margin-top:10px"><button id="sudoku-new" class="primary-button">新しい問題</button></div></div>
  <div class="section-panel"><h2 class="note-title">遊び方</h2><p class="help">① マスを選択<br>② 下の数字をタップして入力<br>③ メモをONにすると候補数字を記録できます。<br>④ キーボードの数字・Deleteキーでも操作できます。</p><p class="help">間違った数字は赤く表示されます。</p></div>
  <div class="stat-box span-full"><div class="stat-heading">自己ベスト</div><div class="stat-value">${data.stats.sudokuBest==null?'—':clockTime(data.stats.sudokuBest)}</div><p class="help">クリア回数：${data.stats.sudokuWins} 回 ／ 誤入力：${s.mistakes} 回</p></div></aside></div>`;
}

// -------- GATES --------
function newGates(redraw=true) {
  data.gates={ stages:generateGates(), round:0, value:10, history:[], finished:false };
  persist();if(redraw)render();
}
function chooseGate(lane) {
  const s=data.gates;
  if (s.finished) return;
  data.gates=runGate(s,lane);
  if (data.gates.finished) {
    data.stats.gatesRuns++;
    data.stats.gatesBest=Math.max(data.stats.gatesBest,data.gates.value);
    toast('🏆 ゴール！ 記録を保存しました');tone(840,.25);
  } else tone(lane===0?470:640,.09);
  persist();render();
}
function gatesContent() {
  const s=data.gates;
  const progress=Math.round(s.round/s.stages.length*100);
  const gateLabels=s.stages[s.round] || [];
  const nextText = gate => formatNumber(applyGate(s.value,gate));
  const people = Math.min(32,Math.max(1,Math.ceil(Math.log2(s.value + 1)*2)));
  return `${gameHeading('ナンバーゲート','左右どちらかのゲートを選んで、最後にできるだけ大きな数を目指そう。')}
  <div class="game-layout"><div class="section-panel game-main"><div class="stats-row"><div class="stat-box"><div class="stat-heading">現在の数</div><div class="stat-value">${formatNumber(s.value)}</div></div><div class="stat-box"><div class="stat-heading">ステージ</div><div class="stat-value">${s.round}/${s.stages.length}</div></div><div class="stat-box"><div class="stat-heading">最高記録</div><div class="stat-value">${formatNumber(data.stats.gatesBest)}</div></div></div>
  <div class="runner-stage"><div class="runner-road"><div class="runner-score">${formatNumber(s.value)}</div><div class="runner-crowd" aria-hidden="true">${Array.from({length:people},()=>'<span class="runner-person"></span>').join('')}</div></div><div class="runner-progress"><span style="width:${progress}%"></span></div><div class="runner-progress-label"><span>START</span><span>${progress}%</span><span>GOAL</span></div></div>
  ${s.finished?`<div class="finish-panel"><h3>🏆 GOAL!</h3><p>最終スコア <strong>${formatNumber(s.value)}</strong><br>${s.value>=data.stats.gatesBest?'自己ベスト記録！':'もう一度、自己ベストに挑戦！'}</p><button id="gates-again" class="primary-button">もう一度遊ぶ →</button></div>`:
  `<div class="gate-pair">${gateLabels.map((gate,lane)=>`<button class="gate-option" data-lane="${lane}" aria-label="${lane?'右':'左'} ${gate.op}${gate.amount}"><span class="gate-label">${lane?'RIGHT →':'← LEFT'} · ${lane?'→':'←'}キー</span><span class="gate-math">${gate.op}${gate.amount}</span><span class="gate-result">選択後：${nextText(gate)}</span></button>`).join('')}</div><p class="help" style="text-align:center">どちらかをタップ（PCでは ← / → キー）</p>`}
  </div><aside class="game-sidebar"><div class="section-panel"><h2 class="note-title">遊び方</h2><p class="help">表示された2つのゲートから好きな方を選びます。掛け算は数字が一気に増えますが、割り算やマイナスにも注意。</p><button class="secondary-button" id="gates-restart">↻ 最初から</button></div><div class="section-panel"><h2 class="note-title">これまでの選択</h2><div class="gate-history">${s.history.length?s.history.map(h=>`<span class="history-step ${h.lane?'right':'left'}">${h.gate.op}${h.gate.amount} → ${formatNumber(h.score)}</span>`).join(''):'<span class="help">まだ選択がありません。</span>'}</div></div><div class="stat-box span-full"><div class="stat-heading">チャレンジ回数</div><div class="stat-value">${data.stats.gatesRuns} 回</div></div></aside></div>`;
}

// -------- BLOCKS --------
function newBlocks(redraw=true) {
  data.blocks = newBlockState(); selectedPiece=0;persist();if(redraw)render();
}
function miniature(piece) {
  if (!piece) return '<span class="help">配置済み</span>';
  const cols=Math.max(...piece.cells.map(c=>c[0]))+1;
  const rows=Math.max(...piece.cells.map(c=>c[1]))+1;
  const coords=new Set(piece.cells.map(([x,y])=>`${x},${y}`));
  return `<span class="mini-grid" style="--cols:${cols};--rows:${rows}">${Array.from({length:cols*rows},(_,i)=>`<span class="mini-cell ${coords.has(`${i%cols},${Math.floor(i/cols)}`)?`filled c${piece.color}`:'blank'}"></span>`).join('')}</span>`;
}
function blockPlaceAt(index) {
  const row=Math.floor(index/GRID),col=index%GRID;
  const s=data.blocks;
  const next=placePiece(s,selectedPiece,row,col);
  if (!next) {tone(170,.1);toast('そこには置けません。別のマスを選んでください');return;}
  data.blocks=next;
  if (next.score>data.stats.blocksBest) data.stats.blocksBest=next.score;
  if (next.over) {data.stats.blocksGames++;toast('ゲームオーバー！ 最高記録に挑戦しよう');tone(230,.2);}
  else if (next.lines>0) {toast(`✨ ${next.lines} ライン消去！${next.combo>1?` ${next.combo}コンボ！`:''}`);tone(880,.17);}
  else tone(550,.06);
  selectedPiece=Math.max(0,next.pieces.findIndex(p=>p));
  persist();render();
}
function updateBlockPreview(index) {
  const s=data.blocks, piece=s.pieces[selectedPiece];
  const board=$('.blocks-board');
  if (!board) return;
  const cells=board.querySelectorAll('.block-cell');
  cells.forEach(c=>c.classList.remove('preview','invalid'));
  if (!piece || index<0) return;
  const row=Math.floor(index/GRID),col=index%GRID;
  const valid=fits(s.board,piece,row,col);
  for(const [x,y] of piece.cells){
    const r=row+y,c=col+x;
    if(r>=0&&r<GRID&&c>=0&&c<GRID)cells[r*GRID+c].classList.add(valid?'preview':'invalid');
  }
}
function blocksContent() {
  const s=data.blocks;
  return `${gameHeading('ブロックパズル','ピースを盤面に置いて、縦または横の8マスを揃えよう。')}
  <div class="game-layout"><div class="section-panel game-main"><div class="stats-row"><div class="stat-box"><div class="stat-heading">スコア</div><div class="stat-value">${s.score.toLocaleString('ja-JP')}</div></div><div class="stat-box"><div class="stat-heading">最高記録</div><div class="stat-value">${data.stats.blocksBest.toLocaleString('ja-JP')}</div></div><div class="stat-box"><div class="stat-heading">コンボ</div><div class="stat-value">${s.combo ? `${s.combo} ×`:'—'}</div></div></div>
  <div class="blocks-board" role="grid" aria-label="8×8のブロック盤面">${s.board.map((n,i)=>`<button class="block-cell ${n?`filled c${n}`:''}" data-block-cell="${i}" role="gridcell" aria-label="${Math.floor(i/8)+1}行${i%8+1}列 ${n?'埋まっている':'空欄'}" ${s.over?'disabled':''}></button>`).join('')}</div>
  <p class="help" style="text-align:center">① 下のピースを選択 → ② 盤面の置きたい位置をタップ（ドラッグでも配置できます）</p>
  <div class="piece-tray">${s.pieces.map((piece,i)=>`<button class="piece-slot ${!piece?'empty':''} ${selectedPiece===i?'active':''}" data-piece="${i}" aria-label="ピース ${i+1}${piece?' を選択':' 配置済み'}" aria-pressed="${selectedPiece===i}" ${!piece||s.over?'disabled':''}><span class="slot-number">0${i+1}</span>${miniature(piece)}</button>`).join('')}</div>
  ${s.over?`<div class="game-over"><strong>GAME OVER</strong><p>置けるピースがなくなりました。スコア ${s.score.toLocaleString('ja-JP')} pt</p><button id="blocks-again" class="primary-button">もう一度遊ぶ →</button></div>`:''}
  </div><aside class="game-sidebar"><div class="section-panel"><h2 class="note-title">遊び方</h2><p class="help">① 3つのピースから1つ選びます。<br>② 盤面のマスをタップして配置します。<br>③ 縦か横を一列埋めると消去！<br>④ 3つ置くと次の3つが出ます。</p><p class="help"><strong>連続でラインを消すとコンボボーナス。</strong>どのピースも置けなくなったら終了です。</p><button class="secondary-button" id="blocks-restart">↻ 新しいゲーム</button></div><div class="stat-box span-full"><div class="stat-heading">配置回数</div><div class="stat-value">${s.moves} 回</div><p class="help">過去のゲーム終了回数：${data.stats.blocksGames} 回</p></div></aside></div>`;
}

function render() {
  app.innerHTML=header()+(page==='home'?home():page==='sudoku'?sudokuContent():page==='gates'?gatesContent():blocksContent())+'</div>';
  bind();
}
function confirmReset(message) {return window.confirm(message);}
function bind() {
  document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>openPage(b.dataset.nav)));
  $('#sound-btn')?.addEventListener('click',()=>{ data.settings.sound=!data.settings.sound;persist();render();toast(data.settings.sound?'サウンドON':'サウンドOFF'); });
  if(page==='sudoku'){
    document.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>{sudokuSelected=Number(b.dataset.cell);render();}));
    document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>setSudokuDigit(Number(b.dataset.digit))));
    $('#note-mode')?.addEventListener('click',()=>{notesMode=!notesMode;render();});
    $('#undo-sudoku')?.addEventListener('click',sudokuUndo);
    $('#sudoku-hint')?.addEventListener('click',sudokuHint);
    $('#sudoku-new')?.addEventListener('click',()=>{
      if (!data.sudoku.finished && !confirmReset('今の数独の途中経過を破棄して、新しい問題を始めますか？')) return;
      newSudoku($('#sudoku-difficulty').value);
    });
    $('#sudoku-again')?.addEventListener('click',()=>newSudoku(data.sudoku.difficulty));
  }
  if(page==='gates'){
    document.querySelectorAll('[data-lane]').forEach(b=>b.addEventListener('click',()=>chooseGate(Number(b.dataset.lane))));
    $('#gates-again')?.addEventListener('click',()=>newGates());
    $('#gates-restart')?.addEventListener('click',()=>{
      if (!data.gates.finished && data.gates.round>0 && !confirmReset('今のナンバーゲートの記録を破棄しますか？')) return;
      newGates();
    });
  }
  if(page==='blocks'){
    document.querySelectorAll('[data-block-cell]').forEach(b=>{
      const i=Number(b.dataset.blockCell);
      b.addEventListener('click',()=>blockPlaceAt(i));
      b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')updateBlockPreview(i);});
    });
    $('.blocks-board')?.addEventListener('pointerleave',()=>updateBlockPreview(-1));
    document.querySelectorAll('[data-piece]').forEach(b=>{
      b.addEventListener('click',()=>{selectedPiece=Number(b.dataset.piece); render();});
      b.addEventListener('pointerdown',e=>{
        if (e.button!==0 && e.pointerType==='mouse')return;
        blockDrag={index:Number(b.dataset.piece),x:e.clientX,y:e.clientY,moved:false};
        selectedPiece=blockDrag.index;
      });
    });
    $('#blocks-again')?.addEventListener('click',()=>newBlocks());
    $('#blocks-restart')?.addEventListener('click',()=>{
      if (!data.blocks.over && data.blocks.moves>0 && !confirmReset('今のブロックパズルの記録を破棄しますか？')) return;
      newBlocks();
    });
  }
}
// Drag placement is supported in addition to the more reliable select-and-tap interaction.
document.addEventListener('pointermove',e=>{
  if (!blockDrag || page!=='blocks')return;
  if(Math.hypot(e.clientX-blockDrag.x,e.clientY-blockDrag.y)>12)blockDrag.moved=true;
  if(!blockDrag.moved)return;
  const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-block-cell]');
  updateBlockPreview(cell?Number(cell.dataset.blockCell):-1);
});
document.addEventListener('pointerup',e=>{
  if(!blockDrag||page!=='blocks')return;
  const drag=blockDrag;blockDrag=null;
  if(!drag.moved)return;
  const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-block-cell]');
  if(cell){selectedPiece=drag.index;blockPlaceAt(Number(cell.dataset.blockCell));}
  else {updateBlockPreview(-1);render();}
});
document.addEventListener('pointercancel',()=>{blockDrag=null;});
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.altKey||e.metaKey||['SELECT','INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  if(page==='gates' && !data.gates?.finished && ['ArrowLeft','ArrowRight'].includes(e.key)) {e.preventDefault();chooseGate(e.key==='ArrowLeft'?0:1);return;}
  if(page!=='sudoku'||!data.sudoku||data.sudoku.finished)return;
  if(/^[1-9]$/.test(e.key)){e.preventDefault();setSudokuDigit(Number(e.key));}
  else if(['Delete','Backspace','0'].includes(e.key)){e.preventDefault();setSudokuDigit(0);}
  else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();const dr=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
    const dc=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0;
    const r=Math.max(0,Math.min(8,Math.floor(sudokuSelected/9)+dr));
    const c=Math.max(0,Math.min(8,sudokuSelected%9+dc));
    sudokuSelected=r*9+c;render();
  } else if(e.key.toLowerCase()==='n'){notesMode=!notesMode;render();}
});
setInterval(()=>{
  if(page!=='sudoku'||!data.sudoku||data.sudoku.finished)return;
  const timer=$('#sudoku-timer');if(timer)timer.textContent=clockTime(sudokuSeconds());
},1000);
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
render();
