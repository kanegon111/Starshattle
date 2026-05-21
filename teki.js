//
//teki.js 敵関連
//
let bossSound = new Audio("警報が鳴る.mp3");

//敵弾クラス
class Teta extends CharaBase {
	constructor(sn, x, y, vx, vy) {
		super(sn, x, y, vx, vy);
		this.r = 3;
		// if (t == undefined) this.timer = 0;
		// else this.timer = t;
	}
	update() {
		// if (this.timer) {
		// 	this.timer--;
		// 	return;
		// }
		super.update();

		if (!gameOver && !jiki.muteki && checkHit(this.x, this.y, this.r,
			jiki.x, jiki.y, jiki.r)) {
			this.kill = true;
			if ((jiki.hp -= 30) <= 0) {
				gameOver = true;
			}
			else {
				jiki.damage = 10;
				jiki.muteki = 60;
			}
		}
		this.sn = 14 + ((this.count >> 3) & 1);
	}
}
//敵クラス
class Teki extends CharaBase {
	constructor(t, x, y, vx, vy) {
		super(0, x, y, vx, vy);
		this.tnum = tekiMaster[t].tnum;
		this.r = tekiMaster[t].r;
		this.mhp = tekiMaster[t].hp;
		this.hp = this.mhp;
		this.score = tekiMaster[t].score;
		this.flag = false;
		this.dr = 90;
		this.relo = 0;

	}

	update() {
		//共通のアップデート
		if (this.relo) this.relo--;
		super.update();
		//個別のアップデート

		tekiFunc[this.tnum](this);

		//当たり判定 
		if (!gameOver && !jiki.muteki && checkHit(this.x, this.y, this.r,
			jiki.x, jiki.y, jiki.r)) {
			if (this.mhp < 500) this.kill = true;

			if ((jiki.hp -= 30) <= 0) {
				gameOver = true;
			}
			else {
				jiki.damage = 10;
				jiki.muteki = 60;
			}
		}
	}
}

function tekiShot(obj, speed) {
	if (gameOver) return;
	let px = (obj.x >> 8);
	let py = (obj.y >> 8);

	if (px - 40 < camera_x || px + 40 >= camera_x + SCREEN_W
		|| py - 40 < camera_y || py + 40 >= camera_y + SCREEN_H) return;
	let an, dx, dy;
	an = Math.atan2(jiki.y - obj.y, jiki.x - obj.x);

	// an += rand(-3, 3) * Math.PI / 180;

	dx = Math.cos(an) * speed;
	dy = Math.sin(an) * speed;

	teta.push(new Teta(15, obj.x, obj.y, dx, dy));
}
function tekiMove01(obj) {
	if (!obj.flag) {
		if (jiki.x > obj.x && obj.vx < 120) obj.vx += 4;
		else if (jiki.x < obj.x && obj.vx > -120) obj.vx -= 4;
	}
	else {
		if (jiki.x < obj.x && obj.vx < 400) obj.vx += 30;
		else if (jiki.x > obj.x && obj.vx > -400) obj.vx -= 30;
	}
	if (Math.abs(jiki.y - obj.y) < (100 << 8) && !obj.flag) {
		obj.flag = true;
		tekiShot(obj, 600);

	}
	if (obj.flag && obj.vy > -800) obj.vy = -30;

	//スプライトの変更
	const ptn = [39, 40, 39, 41];
	obj.sn = ptn[(obj.count >> 3) % 3];
}

function tekiMove02(obj) {
	if (!obj.flag) {
		if (jiki.x > obj.x && obj.vx < 600) obj.vx += 30;
		else if (jiki.x < obj.x && obj.vx > -600) obj.vx -= 30;
	}
	else {
		if (jiki.x < obj.x && obj.vx < 600) obj.vx += 30;
		else if (jiki.x > obj.x && obj.vx > -600) obj.vx -= 30;
	}
	if (Math.abs(jiki.y - obj.y) < (100 << 8) && !obj.flag) {
		obj.flag = true;
		tekiShot(obj, 600);
	}
	// if (obj.flag && obj.vy > -800) obj.vy = -30;

	//スプライトの変更
	const ptn = [33, 34, 33, 35];
	obj.sn = ptn[(obj.count >> 3) % 3];
}

//ボスパターン
function tekiMove03(obj) {
	if (!obj.flag && (obj.y >> 8) >= 70) obj.flag = 1;
	// 効果音を再生
	bossSound.play().catch(error => {
		console.error("Failed to play boss sound:", error);
	});
	if (obj.flag == 1) {
		if ((obj.vy -= 2) <= 0) {
			obj.flag = 2;
			obj.vy = 0;
		}
	}
	else if (obj.flag == 2) {
		if (obj.vx < 300) obj.vx += 10;
		if ((obj.x >> 8) > (FIELD_W - 100)) obj.flag = 3;
	}
	else if (obj.flag == 3) {
		if (obj.vx > -300) obj.vx -= 10;
		if ((obj.x >> 8) < 100) obj.flag = 2;
	}

	//弾発射
	if (obj.flag > 1) {
		let an, dx, dy;
		an = obj.dr * Math.PI / 180;
		dx = Math.cos(an) * 300;
		dy = Math.sin(an) * 300;
		let x2 = (Math.cos(an) * 70) << 8;
		let y2 = (Math.sin(an) * 70) << 8;
		teta.push(new Teta(15, obj.x + 2, obj.y + 2, dx, dy, 60));

		if ((obj.dr += 60) >= 360) obj.dr = 0;
	}
	//追加攻撃
	if (obj.hp < obj.mhp / 2) {
		let c = obj.count % (60 * 5);
		if (c / 10 < 4 && c % 10 == 0) {
			let an, dx, dy;
			an = (90 + 45 - (c / 10) * 30) * Math.PI / 180;
			dx = Math.cos(an) * 300;
			dy = Math.sin(an) * 300;
			let x2 = (Math.cos(an) * 70) << 8;
			let y2 = (Math.sin(an) * 70) << 8;
			teki.push(new Teki(3, obj.x + 2, obj.y + 2, dx, dy));
		}
	}
	//スプライトの変更
	obj.sn = 75;
}
function tekiMove04(obj) {
	if (obj.count == 10) {
		obj.vx = obj.vy = 0;
	}
	if (obj.count == 60) {
		if (obj.x > jiki.x) obj.vx = -30;
		obj.vy = 100;
	}
	if (obj.count > 100 && !obj.relo) {
		if (rand(0, 100) == 1) {
			tekiShot(obj, 300);
			obj.relo = 200;
		}
	}
	//スプライトの変更
	const ptn = [33, 34, 33, 35];
	obj.sn = ptn[(obj.count >> 3) % 3];
}
let tekiFunc = [
	tekiMove01, tekiMove02, tekiMove03, tekiMove04,
];