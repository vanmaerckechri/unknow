"use strict";

class Ants
{
	constructor(maps)
	{
		this.mouseX;
		this.mouseY;

		this.spawn = 
		{
			x: 150,
			y: 300
		};
		this.antsSpawned = 0;
		this.spawnTempo = null;

		this.selectedAction = null;
		this.selectedAnt = null;

		this.ants = [];
		this.maps = maps;

		this.init()
	}

	createAnt()
	{
		let ant =
		{
			animationTempo: null,
			direction: 1,
			speed: 1,
			x: this.spawn.x,
			y: this.spawn.y,
			w: 32,
			h: 32,
			fallStartY: 0,
			imgIndex: 0,
			lastAnimationType: 'walk',
			animationType: 'spawn', 
			status: 'spawn'
		}
		this.ants.push(ant);
	}

	draw(ant, engineSpeed)
	{
		let canvas = document.getElementById('canvas-ant');
		let ctx = canvas.getContext('2d');
		let tileSizeOrigin = this.maps.tileSizeOrigin;
		let tileRatio = this.maps.tileSizeCurrent / tileSizeOrigin

		let currentAnim = ant['animationType'];

		let sX = ant.w * ant.imgIndex;
		let sY = currentAnim == "walk" && ant.direction < 0 ? tileSizeOrigin : 0;
		let dX = ant.x * tileRatio;
		let dY = ant.y * tileRatio;
		let dW = this.maps.tileSizeCurrent * this.maps['elemInfos']['ants'][currentAnim]['colWidth'];
		let dH = this.maps.tileSizeCurrent * this.maps['elemInfos']['ants'][currentAnim]['rowHeight'];

		let img = this.maps['elemInfos']['ants'][currentAnim]['img'];
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(img, sX, sY, ant.w, ant.h, dX, dY, dW, dH);

		let speed = 100 / engineSpeed;
		let animationTempo = ant.animationTempo;
		ant.animationTempo = Tools.countTime(ant.animationTempo, speed);
		if (animationTempo != ant.animationTempo)
		{
			ant.imgIndex = ant.imgIndex < img.width / ant.w - 1 ? ant.imgIndex + 1 : 0;
		}

		// for selected ant
		if (this.selectedAnt && this.selectedAnt == ant)
		{
			ctx.beginPath();
			ctx.fillStyle = "orange";
			ctx.arc(dX + (this.maps.tileSizeCurrent / 2), dY, this.maps.tileSizeCurrent / 8, 0, 2 * Math.PI);
			ctx.fill();
		}
	}

	pxToGrid(px)
	{
		let gridValue = Math.ceil(px / this.maps.tileSizeOrigin);
		return gridValue;
	}

	checkIfAntAtMouse()
	{
		if (this.mouseX && this.mouseY)
		{
			let mouseX = this.mouseX
			let mouseY = this.mouseY

			let tileSize = this.maps.tileSizeCurrent;
			let tileRatio = this.maps.tileSizeCurrent / this.maps.tileSizeOrigin;

			for (let a = this.ants.length - 1; a >= 0; a--)
			{
				let ant = this.ants[a];

				if (mouseX >= ant.x * tileRatio && mouseX < (ant.x * tileRatio) + tileSize && mouseY >= ant.y * tileRatio && mouseY < (ant.y * tileRatio) + tileSize)
				{
					this.selectedAnt = ant;
					return;
				}
			}
			this.selectedAnt = null;
		}
	}

/*
	addCollision(row, col)
	{
		let map = this.maps.currentMap;

		map['tiles'][row] = !map['tiles'][row] ? [] : map['tiles'][row];
		map['tiles'][row][col] = !map['tiles'][row][col] ? {} : map['tiles'][row][col];
		map['tiles'][row][col]['collision'] = true;
	}
*/

	unSelectAction()
	{
		let icon = document.getElementById(this.selectedAction);
		if (icon.classList.contains('selected'))
		{
			icon.classList.remove('selected');
		}
		this.selectedAction = null;
	}

	manageActionLength()
	{
		let actions = this.maps['currentMap']['actions'];
		if (actions[this.selectedAction] > 0)
		{
			actions[this.selectedAction] -= 1;

			let uiIcon = document.getElementById(this.selectedAction);
			let uiNumber = uiIcon.querySelector('.actionLength');
			uiNumber.innerText = actions[this.selectedAction];

			if (actions[this.selectedAction] == 0)
			{
				uiIcon.classList.add('off');
			}

			return true;
		}
	}

	giveActionToAnt(event)
	{
		if (this.selectedAction)
		{
			let ant = this.selectedAnt;
			if (ant)
			{
				if (this.selectedAction == "gameBlock")
				{
					let y = ant.y + ant.h;
					let x = ant.direction < 0 ? ant.x + ant.w : ant.x;

					// if ground exist and action have length
					if (Collisions.check(this.maps, y, x) && this.manageActionLength())
					{
						this.unSelectAction();

						ant.animationType = "block";
						
						let currentMap = this.maps['currentMap'];
						let ctx = false;
						currentMap['collisions'] = Collisions.update(ctx, currentMap['collisions'], ant.x, ant.y, ant.w, ant.h);
					}
				}
			}
		}
	}

	fall(ant, engineSpeed)
	{
		let y = ant.y + ant.h;
		let x = ant.x;

		x = ant.direction < 0 ? x + ant.w : x;

		let speed = this.maps.gravity * engineSpeed;

		let isCollision = Collisions.check(this.maps, y, x);

		if (!isCollision)
		{
			ant.y += speed;
			// if ant begin to fall
			if (ant.animationType != "fall")
			{
				ant.imgIndex = 0;
				ant.lastAnimationType = ant.animationType;
				ant.animationType = "fall";
				ant.fallStartY = y;
			}
		}
		else
		{
			// ant is landing
			if (ant.animationType == "fall")
			{
				ant.animationType = ant.lastAnimationType;
			}
		}
	}

	walk(ant, engineSpeed)
	{
		let y = ant.y;
		let x = ant.x;

		x = ant.direction > 0 ? x + ant.w : x;

		let speed = ant.direction * engineSpeed;

		let isCollision = Collisions.check(this.maps, y, x);

		if (!isCollision)
		{
			ant.x += speed;
		}
		else
		{
			ant.direction *= -1;
		}
	}

	manageStatut(ant, engineSpeed)
	{
		if (ant.animationType == "spawn")
		{
			let img = this.maps['elemInfos']['ants']['spawn']['img'];
			// if last spawn img is played => walk
			if (ant.imgIndex >= img.width / ant.w - 1)
			{
				ant.animationType = "walk";
				ant.imgIndex = 0;
			}
		}
		else
		{
			this.fall(ant, engineSpeed);
		}
		
		if (ant.animationType == "walk")
		{
			this.walk(ant, engineSpeed);
		}
	}

	mainLoop(engineSpeed)
	{
		// create ants
		if (this.antsSpawned < this.maps['currentMap']['antsLength'])
		{
			let speed = 2000 / engineSpeed;
			let spawnTempo = this.spawnTempo;
			this.spawnTempo = Tools.countTime(this.spawnTempo, speed);

			if (spawnTempo != this.spawnTempo)
			{
				this.antsSpawned += 1;
				this.createAnt();
			}
		}

		// manage ants
		let canvas = document.getElementById('canvas-ant');
		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = this.ants.length - 1; i >= 0; i--)
		{
			let ant = this.ants[i];

			this.manageStatut(ant, engineSpeed);
			this.draw(ant, engineSpeed);
		}
		
		this.checkIfAntAtMouse();
	}

	detectSpawn()
	{
		let map = this.maps[this.maps['currentMapName']];

		for (let r = map['tiles'].length - 1; r >= 0; r--)
		{
			if (map['tiles'][r])
			{
				for (let c = map['tiles'][r].length - 1; c >= 0; c--)
				{
					if (map['tiles'][r][c])
					{
						let mapTiles = map['tiles'][r][c];
						if (mapTiles['catName'] == "doors" && mapTiles['objName'] == "spawn")
						{
							this.spawn.x = (c + 0.5) * this.maps.tileSizeOrigin;
							this.spawn.y = (r + 1) * this.maps.tileSizeOrigin;
						}
					}
				}
			}
		}
	}

	createGameIcons()
	{
		let gameUiContainer = document.getElementById('game-ui');
		gameUiContainer.classList.remove('hidden');

		let gameUiBotCont = document.getElementById('game-uiBotCont');

		let icons = this.maps['commonElem']['elemsList']['antsIcons'];
		for (let i = 0, iLength = icons.length; i < iLength; i++)
		{
			// action does exist on this map ?
			if (this.maps['currentMap']['actions'][icons[i]])
			{
				let imgContainer = document.createElement('div');
				imgContainer.setAttribute('id', icons[i]);
				imgContainer.setAttribute('class', 'img-container');

				let actionLength = document.createElement('p');
				actionLength.setAttribute('class', 'actionLength');
				actionLength.innerText = this.maps['currentMap']['actions'][icons[i]];

				let img = this.maps['elemInfos']['antsIcons'][icons[i]]['img'];
				imgContainer.addEventListener('click', () =>
				{
					this.selectedAction = icons[i];
					let icon = document.getElementById(icons[i]);
					if (!icon.classList.contains('selected') && !icon.classList.contains('off'))
					{
						icon.classList.add('selected');
					}
				})

				imgContainer.appendChild(img);
				imgContainer.appendChild(actionLength);
				gameUiBotCont.appendChild(imgContainer);
			}
		}
	}

	init()
	{
		let canvasCon = document.getElementById('canvas-container');

		canvasCon.addEventListener('click', ()=>
		{
			this.giveActionToAnt(event);
		})

		canvasCon.addEventListener('mousemove', ()=>
		{
			this.mouseX = event.layerX;
			this.mouseY = event.layerY;
		})
		this.createGameIcons();

		this.detectSpawn();
	}
}