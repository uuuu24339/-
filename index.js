// --- 画面の要素を取得 ---
const board = document.getElementById('board');
const statusMessage = document.getElementById('status-message');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const p1Card = document.getElementById('p1-card');
const p2Card = document.getElementById('p2-card');
const p1LifeEl = document.getElementById('p1-life');
const p2LifeEl = document.getElementById('p2-life');

// --- ゲームの設定 ---
const totalCells = 16;  // 4x4のマス数
const setLimit = 3;     // 爆弾を置く数（3回）
const playLimit = 2;    // マスをめくる数（1ターン2回）

// --- ゲームの変数を初期化 ---
let gameState = 'waiting'; 
let count = 0;             
let bombMap = Array(totalCells).fill(0); // 各マスの爆弾数を保持する配列（16要素）
let p1Life = 3;            
let p2Life = 3;            

// クリックイベント
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

// --- 周囲8マスの爆弾の合計数を計算する関数 ---
function getAdjacentBombCount(index) {
  const row = Math.floor(index / 4);
  const col = index % 4;
  let count = 0;

  // 周囲8方向の相対座標 (行, 列)
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  for (const [dr, dc] of directions) {
    const r = row + dr;
    const c = col + dc;

    // 4x4の範囲内にあるか判定
    if (r >= 0 && r < 4 && c >= 0 && c < 4) {
      const neighborIndex = r * 4 + c;
      count += bombMap[neighborIndex]; // 重複爆弾の数も加算
    }
  }

  return count;
}

// --- 盤面の16マスを作成 ---
for (let i = 0; i < totalCells; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;

  // マスをクリックしたときの処理
  cell.addEventListener('click', () => {
    if (gameState === 'waiting' || gameState === 'game_over') return;

    // 1. P1 爆弾設置
    if (gameState === 'p1_set') {
      if (cell.dataset.p1Set === 'true' || count >= setLimit) return;
      
      bombMap[i] += 1;
      cell.dataset.p1Set = 'true';
      cell.classList.add('bomb');
      cell.textContent = '💣'; 
      
      count++;
      updateStatus();

      if (count === setLimit) {
        setTimeout(() => {
          resetBoard();
          gameState = 'p2_set';
          count = 0;
          updateStatus();
        }, 500);
      }
    }
    // 2. P2 爆弾設置
    else if (gameState === 'p2_set') {
      if (cell.dataset.p2Set === 'true' || count >= setLimit) return;

      bombMap[i] += 1;
      cell.dataset.p2Set = 'true';
      cell.classList.add('bomb');
      cell.textContent = '💣'

      count++;
      updateStatus();

      if (count === setLimit) {
        setTimeout(() => {
          resetBoard();
          gameState = 'p1_play';
          count = 0;
          updateStatus();
        }, 500);
      }
    }
    // 3. めくりフェーズ（P1またはP2）
    else if (gameState === 'p1_play' || gameState === 'p2_play') {
      if (cell.classList.contains('revealed') || count >= playLimit) return;

      cell.classList.add('revealed');
      count++;

      const bombCount = bombMap[i]; // マスの爆弾数を取得

      if (bombCount > 0) {
        cell.textContent = '💣'.repeat(bombCount); // めくった際も個数ぶん表示
        
        if (gameState === 'p1_play') {
          cell.classList.add('bomb-p1');
          p1Life -= bombCount; // 爆弾の数だけライフ減少
        } else {
          cell.classList.add('bomb-p2');
          p2Life -= bombCount; // 爆弾の数だけライフ減少
        }
        updateLifeDisplay();
        } else {
        // 周囲8マスの爆弾数を取得して表示
        const adjacentBombs = getAdjacentBombCount(i);
        cell.textContent = adjacentBombs;
        cell.dataset.count = adjacentBombs;
        cell.classList.add('safe');
      }

      // 勝敗判定
      if (p1Life <= 0 || p2Life <= 0) {
        endGame();
        return;
      }

      // 2マスめくったら交代
      if (count === playLimit) {
        setTimeout(() => {
          count = 0;
          gameState = (gameState === 'p1_play') ? 'p2_play' : 'p1_play';
          updateStatus();
        }, 500);
      } else {
        updateStatus();
      }
    }
  });

  board.appendChild(cell);
}

// --- ゲーム開始処理 ---
function startGame() {
  gameState = 'p1_set';
  count = 0;
  bombMap = Array(totalCells).fill(0);
  p1Life = 3;
  p2Life = 3;

  p1Card.classList.remove('winner');
  p2Card.classList.remove('winner');

  updateLifeDisplay(); 
  startBtn.classList.add('hidden'); 
  resetBtn.classList.remove('hidden');
  resetBoard(); 
  updateStatus(); 
}

// --- リセット処理 ---
function resetGame() {
  gameState = 'waiting';
  count = 0;
  bombMap = Array(totalCells).fill(0);
  p1Life = 3;
  p2Life = 3;

  p1Card.classList.remove('winner');
  p2Card.classList.remove('winner');

  updateLifeDisplay();
  resetBoard();
  
  startBtn.textContent = 'ゲームスタート';
  startBtn.classList.remove('hidden');
  resetBtn.classList.add('hidden');
  
  updateStatus();
}

// --- ライフ表示の書き換え関数 ---
function updateLifeDisplay() {
  p1LifeEl.textContent = '❤️'.repeat(Math.max(0, p1Life)) || '💀';
  p2LifeEl.textContent = '❤️'.repeat(Math.max(0, p2Life)) || '💀';
}

// --- ゲームセット（決着）処理 ---
function endGame() {
  gameState = 'game_over';
  p1Card.classList.remove('active');
  p2Card.classList.remove('active');
  
  // メッセージ枠の色クラスを一旦リセット
  statusMessage.classList.remove('p1-turn', 'p2-turn');

  if (p1Life <= 0) {
    statusMessage.textContent = '🎉 プレイヤー2 の勝利！';
    p2Card.classList.add('winner');
    statusMessage.classList.add('p2-turn'); 
  } else {
    statusMessage.textContent = '🎉 プレイヤー1 の勝利！';
    p1Card.classList.add('winner');
    statusMessage.classList.add('p1-turn');
  }

  startBtn.textContent = 'もう一度あそぶ';
  startBtn.classList.remove('hidden');
  resetBtn.classList.add('hidden');
}

// --- 盤面の見た目をリセットする関数 ---
function resetBoard() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('bomb', 'bomb-p1', 'bomb-p2', 'safe', 'revealed');
    delete cell.dataset.p1Set;
    delete cell.dataset.p2Set;
    delete cell.dataset.count;
  });
}

// --- 現在の状態に合わせて画面表示を変える関数 ---
function updateStatus() {
  p1Card.classList.remove('active');
  p2Card.classList.remove('active');
  statusMessage.classList.remove('p1-turn', 'p2-turn');

  if (gameState === 'waiting') {
    statusMessage.textContent = '「スタート」を押して開始';
  } else if (gameState === 'p1_set') {
    p1Card.classList.add('active');
    statusMessage.classList.add('p1-turn');
    statusMessage.textContent = `P1: 爆弾を設置 (${count}/${setLimit})`;
  } else if (gameState === 'p2_set') {
    p2Card.classList.add('active');
    statusMessage.classList.add('p2-turn');
    statusMessage.textContent = `P2: 爆弾を設置 (${count}/${setLimit})`;
  } else if (gameState === 'p1_play') {
    p1Card.classList.add('active');
    statusMessage.classList.add('p1-turn');
    statusMessage.textContent = `P1: マスをめくる (${count}/${playLimit})`;
  } else if (gameState === 'p2_play') {
    p2Card.classList.add('active');
    statusMessage.classList.add('p2-turn');
    statusMessage.textContent = `P2: マスをめくる (${count}/${playLimit})`;
  }
}

// 初期実行
updateStatus();
