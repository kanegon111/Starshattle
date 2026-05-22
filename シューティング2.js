//デバッグのフラグ
const DEBUG = false;

let drawCount = 0;
let fps = 0;
let lastTime = Date.now();
let bgm = new Audio("0000245482.320.mp3");
bgm.loop = true;


// スムージング
const SMOOTHING = false;

//ゲームスピード(ms)
const GAME_SPEED = 1000 / 60;

//画面サイズ
const SCREEN_W = 320;
const SCREEN_H = 320;

//キャンバスサイズ
const CANVAS_W = SCREEN_W * 2;
const CANVAS_H = SCREEN_H * 2;

//フィールドサイズ
const FIELD_W = SCREEN_W + 120;
const FIELD_H = SCREEN_H + 40;

//星の数
const STAR_MAX = 300;

//キャンバス
let can = document.getElementById("can");
let con = can.getContext("2d");
can.width = CANVAS_W;
can.height = CANVAS_H;
con.mozimageSmoothingEnagbled = SMOOTHING;
con.webkitimageSmoothingEnabled = SMOOTHING;
con.msimageSmoothingEnabled = SMOOTHING;
con.imageSmoothingEnabled = SMOOTHING;
con.font = "20px 'Impact'";

//フィールド（仮想画面）
let vcan = document.createElement("canvas");
let vcon = vcan.getContext("2d");
vcan.width = FIELD_W;
vcan.height = FIELD_H;
vcon.font = "20px 'Impact'";

//カメラの座標
let camera_x = 0;
let camera_y = 0;

let gameOver = false;
let score = 0;

//
let bossHP = 0;
let bossMHP = 0;
//星の実体
let star = [];

//キーボードの状態
let key = [];

//オブジェクト達
let teki = [];
let teta = [];
let tama = [];
let expl = [];
let jiki = new Jiki();
//teki[0]= new Teki( 75, 200<<8,200<<8, 0,0);

//ファイルを読み込み
let spriteImage = new Image();
spriteImage.src = "sprite.png";

//ボス用の画像
let customImages = {};
function loadCustomImage(src) {
	let img = new Image();
	img.src = src;
	customImages[src] = img;
}
loadCustomImage("___.png");
loadCustomImage("ボス.png");


//ゲーム初期化
function gameInit() {
	document.getElementById("titleScreen").style.display = "none"; // タイトル画面を隠す
	for (let i = 0; i < STAR_MAX; i++)star[i] = new Star();
	setInterval(gameLoop, GAME_SPEED);
	bgm.play().catch(error => {
		console.error("Failed to play BGM:", error);
	});
}

//オブジェクトをアップデート
function updateObj(obj) {
	for (let i = obj.length - 1; i >= 0; i--) {
		obj[i].update();
		if (obj[i].kill) obj.splice(i, 1);
	}
}

//オブジェクトを描画
function drawObj(obj) {
	for (let i = 0; i < obj.length; i++)obj[i].draw();
}


//移動の処理
function updateAll() {
	updateObj(star);
	updateObj(tama);
	updateObj(teta);
	updateObj(teki);
	updateObj(expl);
	if (!gameOver) jiki.update();
}

//描画の処理
function drawAll() {
	//描画の処理

	vcon.fillStyle = (jiki.damage) ? "red" : "black";
	vcon.fillRect(camera_x, camera_y, SCREEN_W, SCREEN_H);

	drawObj(star);
	drawObj(tama);
	if (!gameOver) jiki.draw();
	drawObj(teki);
	drawObj(expl);
	drawObj(teta);

	// 自機の範囲 0 ～ FIELD_W
	// カメラの範囲 0 ～ (FIELD_W-SCREEN_W)

	camera_x = Math.floor((jiki.x >> 8) / FIELD_W * (FIELD_W - SCREEN_W));
	camera_y = Math.floor((jiki.y >> 8) / FIELD_H * (FIELD_H - SCREEN_H));

	//ボスHP表示
	if (bossHP > 0) {
		let sz = (SCREEN_W - 20) * bossHP / bossMHP;
		let sz2 = (SCREEN_W - 20);
		vcon.fillStyle = "red";
		vcon.fillRect(camera_x + 10, camera_y + 10, sz, 10);
		vcon.strokeStyle = "orange";
		vcon.strokeRect(camera_x + 10, camera_y + 10, sz2, 10);
	}

	//スコア表示
	vcon.fillStyle = "white";
	vcon.fillText("SCORE " + score, camera_x + 10, camera_y + 20);
	//仮想画面から実際のキャンバスにコピー
	con.drawImage(vcan, camera_x, camera_y, SCREEN_W, SCREEN_H,
		0, 0, CANVAS_W, CANVAS_H);
}

//情報の表示
function putInfo() {

	con.fillStyle = "white";

	if (gameOver) {
		let s = "GAME OVER";
		let w = con.measureText(s).width;
		let x = CANVAS_W / 2 - w / 2;
		let y = CANVAS_H / 2 - 20;
		con.fillText(s, x, y);
		s = "Push 'R' key to Restart!";
		w = con.measureText(s).width;
		x = CANVAS_W / 2 - w / 2;
		y = CANVAS_H / 2 - 20 + 20;
		con.fillText(s, x, y);
	}


	if (DEBUG) {
		drawCount++;
		if (lastTime + 1000 <= Date.now()) {
			fps = drawCount;
			drawCount = 0;
			lastTime = Date.now();
		}



		con.fillText("FPS :" + fps, 20, 20);
		con.fillText("Tama:" + tama.length, 20, 40);
		con.fillText("Teki:" + teki.length, 20, 60);
		con.fillText("Teta:" + teta.length, 20, 80);
		con.fillText("Expl:" + expl.length, 20, 100);
		con.fillText("X:" + (jiki.x >> 8), 20, 120);
		con.fillText("Y:" + (jiki.y >> 8), 20, 140);
		con.fillText("HP:" + jiki.hp, 20, 160);
		con.fillText("SCORE:" + score, 20, 180);
		con.fillText("COUNT:" + gameCount, 20, 200);
		con.fillText("WAVE:" + gameWave, 20, 220);
	}
}
let gameCount = 0;
let gameWave = 0;
let gameRound = 0;
//ゲームループ
function gameLoop() {
	gameCount++;

	//WAVE 0: ピンクのザコ
	if (gameWave == 0) {
		if (rand(0, 50) == 1) {
			teki.push(new Teki(0, rand(0, FIELD_W) << 8, 0, 0, rand(300, 1200)));
		}
		if (gameCount > 60 * 15) {
			gameWave++;
			gameCount = 0;
		}
	}

	//WAVE 1: 黄色のザコ
	else if (gameWave == 1) {
		if (rand(0, 50) == 1) {
			teki.push(new Teki(1, rand(0, FIELD_W) << 8, 0, 0, rand(300, 1200)));
		}
		if (gameCount > 60 * 15) {
			gameWave++;
			gameCount = 0;
		}
	}

	//WAVE 2: 白ニワトリ登場
	else if (gameWave == 2) {
		if (rand(0, 45) == 1) {
			teki.push(new Teki(4, rand(0, FIELD_W) << 8, 0, 0, rand(200, 800)));
		}
		if (gameCount > 60 * 15) {
			gameWave++;
			gameCount = 0;
		}
	}

	//WAVE 3: メカニワトリ登場
	else if (gameWave == 3) {
		if (rand(0, 45) == 1) {
			teki.push(new Teki(5, rand(0, FIELD_W) << 8, 0, 0, rand(300, 1000)));
		}
		if (gameCount > 60 * 15) {
			gameWave++;
			gameCount = 0;
		}
	}

	//WAVE 4: 混成ザコ＋エイリアンボス出現
	else if (gameWave == 4) {
		if (rand(0, 50) == 1) {
			let r = rand(0, 5);
			let kinds = [0, 1, 4, 5, 0, 1];
			teki.push(new Teki(kinds[r], rand(0, FIELD_W) << 8, 0, 0, rand(300, 1000)));
		}
		if (gameCount > 60 * 12) {
			gameWave++;
			gameCount = 0;
			teki.push(new Teki(6, (FIELD_W / 2) << 8, -(70 << 8), 0, 200));
		}
	}

	//WAVE 5: エイリアンボス戦
	else if (gameWave == 5) {
		if (teki.length == 0) {
			gameWave++;
			gameCount = 0;
			bossHP = 0;
		}
	}

	//WAVE 6: 混成ザコ＋元のボス
	else if (gameWave == 6) {
		if (rand(0, 50) == 1) {
			let r = rand(0, 1);
			teki.push(new Teki(r, rand(0, FIELD_W) << 8, 0, 0, rand(300, 1200)));
		}
		if (gameCount > 60 * 10) {
			gameWave++;
			gameCount = 0;
			teki.push(new Teki(2, (FIELD_W / 2) << 8, -(70 << 8), 0, 200));
		}
	}

	//WAVE 7: 元のボス戦
	else if (gameWave == 7) {
		if (teki.length == 0) {
			gameWave++;
			gameCount = 0;
			bossHP = 0;
		}
	}

	//WAVE 8: 混成ザコ＋ドラゴンボス出現
	else if (gameWave == 8) {
		if (rand(0, 40) == 1) {
			let r = rand(0, 5);
			let kinds = [4, 5, 0, 1, 4, 5];
			teki.push(new Teki(kinds[r], rand(0, FIELD_W) << 8, 0, 0, rand(300, 1000)));
		}
		if (gameCount > 60 * 12) {
			gameWave++;
			gameCount = 0;
			teki.push(new Teki(7, (FIELD_W / 2) << 8, -(70 << 8), 0, 200));
		}
	}

	//WAVE 9: ドラゴンボス戦
	else if (gameWave == 9) {
		if (teki.length == 0) {
			gameWave = 0;
			gameCount = 0;
			gameRound++;
			bossHP = 0;
		}
	}

	updateAll();
	drawAll();
	putInfo();
}


//オンロードでゲーム開始
window.onload = function () {
	document.getElementById("startButton").onclick = function () {
		gameInit();
	};

}
