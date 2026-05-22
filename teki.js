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
		// if (this.timer) {h
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
		this.imageSrc = tekiMaster[t].image;
		this.imgW = tekiMaster[t].imgW;
		this.imgH = tekiMaster[t].imgH;
		this.customImage = this.imageSrc ? customImages[this.imageSrc] : null;
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

	draw() {
		if (this.customImage && this.customImage.complete && this.customImage.naturalWidth > 0) {
			let w = this.imgW;
			let h = this.imgH;
			let px = (this.x >> 8) - w / 2;
			let py = (this.y >> 8) - h / 2;
			if (px + w < camera_x || px >= camera_x + SCREEN_W
				|| py + h < camera_y || py >= camera_y + SCREEN_H) return;
			vcon.drawImage(this.customImage, px, py, w, h);
		} else {
			super.draw();
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
	if (!obj.flag && (obj.y >> 8) >= 70) {
		obj.flag = 1;
		bossSound.play().catch(error => {
			console.error("Failed to play boss sound:", error);
		});
	}
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
//白ニワトリ(ザコ) - ジグザグ降下、たまに発射
function tekiMove05(obj) {
	//ジグザグに動く
	obj.vx = Math.sin(obj.count * 0.05) * 200;
	if (obj.vy < 200) obj.vy += 4;

	//たまに弾を撃つ
	if (obj.count > 60 && !obj.relo && obj.count % 80 == 0) {
		if (rand(0, 3) == 1) {
			tekiShot(obj, 350);
			obj.relo = 100;
		}
	}

	//スプライトの変更(にわとり)
	const ptn = [57, 58, 57, 59];
	obj.sn = ptn[(obj.count >> 3) % 4];
}

//メカニワトリ(ザコ) - 急降下後、自機を追跡
function tekiMove06(obj) {
	if (!obj.flag) {
		//最初は普通に降下
		if (obj.vy < 300) obj.vy += 10;
		if ((obj.y >> 8) > 80) obj.flag = 1;
	}
	else if (obj.flag == 1) {
		//自機の方向に向かう
		if (jiki.x > obj.x && obj.vx < 250) obj.vx += 8;
		else if (jiki.x < obj.x && obj.vx > -250) obj.vx -= 8;
		if (obj.vy > 150) obj.vy -= 3;

		//弾を撃つ
		if (!obj.relo && obj.count % 50 == 0) {
			tekiShot(obj, 400);
			obj.relo = 80;
		}
	}

	//スプライトの変更(ロボ)
	const ptn = [51, 52, 51, 53];
	obj.sn = ptn[(obj.count >> 3) % 4];
}

//ボス（エイリアン船 ___.png） - 左右移動しながら扇状に弾を撃つ
function tekiMove07(obj) {
		if (!obj.flag && (obj.y >> 8) >= 80) {
					obj.flag = 1;
					bossSound.play().catch(error => {
									console.error("Failed to play boss sound:", error);
					});
		}
	if (obj.flag == 1) {
		if ((obj.vy -= 2) <= 0) {
			obj.flag = 2;
			obj.vy = 0;
		}
	}
	else if (obj.flag == 2) {
		if (obj.vx < 250) obj.vx += 8;
		if ((obj.x >> 8) > (FIELD_W - 100)) obj.flag = 3;
	}
	else if (obj.flag == 3) {
		if (obj.vx > -250) obj.vx -= 8;
		if ((obj.x >> 8) < 100) obj.flag = 2;
	}

	//扇状の弾発射
	if (obj.flag > 1 && obj.count % 30 == 0) {
		for (let i = -2; i <= 2; i++) {
			let an = (90 + i * 15) * Math.PI / 180;
			let dx = Math.cos(an) * 280;
			let dy = Math.sin(an) * 280;
			teta.push(new Teta(15, obj.x, obj.y, dx, dy));
		}
	}

	//HP半分以下で追加攻撃
	if (obj.hp < obj.mhp / 2 && obj.count % 90 == 0) {
		tekiShot(obj, 450);
	}
}

//ボス（ドラゴン ボス.png） - 上下に揺れながら高速弾を撃つ
function tekiMove08(obj) {
		if (!obj.flag && (obj.y >> 8) >= 90) {
					obj.flag = 1;
					bossSound.play().catch(error => {
									console.error("Failed to play boss sound:", error);
					});
		}
	if (obj.flag == 1) {
		if ((obj.vy -= 2) <= 0) {
			obj.flag = 2;
			obj.vy = 0;
		}
	}
	else if (obj.flag >= 2) {
		//左右に大きく移動
		if (obj.flag == 2) {
			if (obj.vx < 350) obj.vx += 6;
			if ((obj.x >> 8) > (FIELD_W - 80)) obj.flag = 3;
		}
		else if (obj.flag == 3) {
			if (obj.vx > -350) obj.vx -= 6;
			if ((obj.x >> 8) < 80) obj.flag = 2;
		}
		//上下にゆらゆら
		obj.vy = Math.sin(obj.count * 0.03) * 80;
	}

	//ぐるぐる回転する弾
	if (obj.flag > 1) {
		if (obj.count % 8 == 0) {
			let an = obj.dr * Math.PI / 180;
			let dx = Math.cos(an) * 250;
			let dy = Math.sin(an) * 250;
			teta.push(new Teta(15, obj.x, obj.y, dx, dy));
			if ((obj.dr += 25) >= 360) obj.dr = 0;
		}

		//狙い撃ち
		if (obj.count % 60 == 0) {
			tekiShot(obj, 500);
		}
	}

	//HP半分以下で子分召喚
	if (obj.hp < obj.mhp / 2 && obj.count % 180 == 0) {
		teki.push(new Teki(4, rand(50, FIELD_W - 50) << 8, 0, 0, 200));
	}
}

let tekiFunc = [
	tekiMove01, tekiMove02, tekiMove03, tekiMove04,
	tekiMove05, tekiMove06, tekiMove07, tekiMove08,
];
