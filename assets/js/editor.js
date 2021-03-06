"use strict";

class Editor
{
	constructor(maps, mapWidth, mapHeight)
	{
		this.status = "editor";
		// all maps infos
		this.maps = maps;

		this.selectedElem = null;
		this.mouseX = 0;
		this.mouseY = 0;

		this.action = false;

		this.tileRatio = 1;

		// current map created in editor
		this.map =
		{ 
			index: false,
			intro:
			{
				map: "Editor Map",
				rules: 10,
				tips: "..."
			},
			w: 1280,
			h: 720,
			antsLength: 20,
			deletedAntsLength: 0,
			savedLength: 0,
			actions:
			{
				block: 2,
				ball: 3,
				cancel: " ",
				suicide: " "
			},
			elemsList: 
			{
			},
			tiles: [],
			collisions: []
		};
		this.mapWidth = mapWidth;
		this.mapHeight = mapHeight;
		this.col = 0;
		this.row = 0;
		this.spawn = null;

		this.currentLink =
		{
			active: false,
			row: 0,
			col: 0,
			x: 0,
			y: 0
		};

		this.init();
	}

	getStatus()
	{
		return this.status;
	}

	importAntsOptions()
	{
		let actions = this.map.actions;

		for (let actionName in actions)
		{
			if (actionName != "cancel" && actionName != "suicide")
			{
				let tag = document.getElementById(actionName);
				tag.value = this.map.actions[actionName];
			}
		}
	}

	exportAntsOptions()
	{
		let actions = this.map.actions;

		for (let actionName in actions)
		{
			if (actionName != "cancel" && actionName != "suicide")
			{
				let tag = document.getElementById(actionName);

				this.map.actions[actionName] = tag.value;
			}
		}
	}

	importMapOptions()
	{
		let title = document.getElementById('mapOptions-title')
		let botsLength = document.getElementById('mapOptions-botsLength');
		let botsToSave = document.getElementById('mapOptions-botsToSave');	
		let tips = document.getElementById('mapOptions-tips');

		let map = this.map;

		title.value = map.intro.map;
		tips.value = map.intro.tips;

		botsLength.value = map.antsLength;
		botsToSave.value = map.intro.rules;		
	}

	exportMapOptions()
	{
		let title = document.getElementById('mapOptions-title')
		let botsLength = document.getElementById('mapOptions-botsLength');
		let botsToSave = document.getElementById('mapOptions-botsToSave');	
		let tips = document.getElementById('mapOptions-tips');


		let map = this.map;

		map.intro.map = title.value;
		map.intro.tips = tips.value;

		botsLength.value = isNaN(botsLength.value) ? 10 : parseInt(botsLength.value, 10);
		botsToSave.value = isNaN(botsToSave.value) || parseInt(botsToSave.value) > botsLength.value ? 5 : parseInt(botsToSave.value);

		map.antsLength = botsLength.value;
		map.intro.rules = botsToSave.value;
	}

	testMap()
	{
		let canvas = document.getElementById('canvas-editorUi');
		let editorUi = document.getElementById('editor-ui');
		let backToEditor = document.getElementById('backToEditor');

		let introContainer = document.getElementById('intro-container');

		this.exportMapOptions();
		this.exportAntsOptions();

		canvas.classList.add('hidden');
		editorUi.classList.add('hidden');
		backToEditor.classList.remove('hidden');
		introContainer.classList.remove('hidden');

		this.status = 'testMap';
		this.maps.editorMap = JSON.parse(JSON.stringify(this.map));
		this.maps.currentMapName = "editorMap";
	}

	backToEditor()
	{
		let canvas = document.getElementById('canvas-editorUi');
		let editorUi = document.getElementById('editor-ui');
		let backToEditor = document.getElementById('backToEditor');
		let introContainer = document.getElementById('intro-container');
		let outroContainer = document.getElementById('outro-container');

		canvas.classList.remove('hidden');
		editorUi.classList.remove('hidden');
		backToEditor.classList.add('hidden');
		introContainer.classList.add('hidden');
		outroContainer.classList.add('hidden');

		this.status = 'editor';
	}

	deleteTileByParent(r, c)
	{
		let map = this.map['tiles'];

		if (map[r] && map[r][c] && map[r][c]['catName'])
		{
			let catName = map[r][c]['catName'];
			let objName = map[r][c]['objName'];
			let tileInfos = this.maps['elemInfos'][catName][objName];

			for (let h = tileInfos.rowHeight - 1; h >= 0; h--)
			{
				for (let w = tileInfos.colWidth - 1; w >= 0; w--)
				{
					map[r + h][c + w] = null;
				}
			}
		}
	}

	cleanTiles(r, c)
	{
		let map = this.map['tiles'];
		// check if current tile is busy
		if (map[r] && map[r][c])
		{
			// check if current tile is a child tile
			if (map[r][c].dependToCol)
			{
				let rTemp = r;
				r = map[r][c].dependToRow;
				c = map[rTemp][c].dependToCol;
			}
			// delete parent tile
			this.deleteTileByParent(r, c);
		}
	}

	deleteAll(catName, objName)
	{
		let map = this.map['tiles'];
		for (let r = map.length - 1; r >= 0; r--)
		{
			if (map[r])
			{
				for (let c = map[r].length - 1; c >= 0; c--)
				{
					if (map[r][c] && map[r][c].catName && map[r][c].catName == catName && map[r][c].objName == objName)
					{
						this.cleanTiles(r, c);
					}
				}
			}
		}
	}

	completeLinkIntObj()
	{
		if (this.currentLink.active)
		{
			let map = this.map['tiles'];

			let tileSizeOr = this.maps.tileSizeOrigin;
			let tileRatio = this.maps.tileSizeCurrent / tileSizeOr;

			let x = this.mouseX / tileRatio;
			let y = this.mouseY / tileRatio;

			let col = Math.floor(x / tileSizeOr);
			let row = Math.floor(y / tileSizeOr);

			if (map[row] && map[row][col])
			{
				if (map[row][col].dependToRow)
				{
					let rowTemp = row;
					row = map[row][col].dependToRow;
					col = map[rowTemp][col].dependToCol;
				}
				if (map[row][col].objName == "door")
				{
					let rowBtn = this.currentLink.row;
					let colBtn = this.currentLink.col;

					map[rowBtn][colBtn].focus = !map[rowBtn][colBtn].focus ? [] : map[rowBtn][colBtn].focus;

					// check if btn is already link to this door
					let focusList =  map[rowBtn][colBtn].focus;
					let isAlreadyExist = false;
					for (let i = focusList.length - 1; i >= 0; i--)
					{
						if (focusList[i].row == row && focusList[i].col == col)
						{
							isAlreadyExist = true;
							break;
						}
					}
					if (!isAlreadyExist)
					{
						let newFocus = {row: row, col: col};
						map[rowBtn][colBtn].focus.push(newFocus);
					}
				}
			}


			// reset current link
			this.currentLink = 
			{
				active: false,
				row: 0,
				col: 0,
				x: 0,
				y: 0
			}
		}
	}

	tryToLinkIntObjs(row, col, y, x)
	{
		let map = this.map['tiles'];
		if (!this.currentLink.active && map[row] && map[row][col] && map[row][col].objName)
		{
			if (map[row][col].objName == "btn")
			{
				this.currentLink = 
				{
					active: true,
					row: row,
					col: col,
					x: x,
					y: y
				}
			}
		}
	}

	putElement()
	{
		if (this.selectedElem != null)
		{
			let map = this.map['tiles'];

			let tileSizeOr = this.maps.tileSizeOrigin;
			let tileRatio = this.maps.tileSizeCurrent / tileSizeOr;

			let x = this.mouseX / tileRatio;
			let y = this.mouseY / tileRatio;

			let col = Math.floor(x / tileSizeOr);
			let row = Math.floor(y / tileSizeOr);

			if (this.selectedElem == "removeTile")
			{
				this.cleanTiles(row, col);
			}
			else if (this.selectedElem == "link")
			{
				this.tryToLinkIntObjs(row, col, y, x);
			}
			else
			{
				let catName = this.selectedElem['catName'];
				let objName = this.selectedElem['objName'];
				let elRef = this.maps['elemInfos'][catName][objName];

				// items that can not be duplicated
				if (objName == "spawn" || objName == "exit")
				{
					this.deleteAll(catName, objName);
				}

				// clean and create tiles informations (parent / childs)
				for (let r = elRef.rowHeight - 1; r >= 0; r--)
				{
					map[row + r] = !map[row + r] ? [] : map[row + r];

					for (let c = elRef.colWidth - 1; c >= 0; c--)
					{
						// clean current tile if busy
						if (map[row + r][col + c] && map[row + r][col + c].dependToRow)
						{
							this.cleanTiles(row + r, col + c);
						}
						// create child tile infos if element have more than 1*1 tile
						map[row + r][col + c] = { dependToRow: row, dependToCol: col };
					}
				}

				// replace this tile by parent element info tile
				let newObj = JSON.parse(JSON.stringify(this.selectedElem));
				map[row][col] = newObj;

				// change visual shade for next
				let shade = 0;
				if (!elRef.animation && elRef.shadeLength > 1)
				{
					shade = Math.floor(Math.random() * (elRef.shadeLength - 0) + 0);
				}
				this.selectedElem.imgCol = shade
			}

			this.updateLinkToExportMap();
		}
	}

	updateCursor()
	{
		let canvas = document.getElementById('canvas-editorUi');

		if (this.selectedElem)
		{
			if (canvas.style.cursor != "none")
			{
				canvas.style.cursor = "none";
			}
		}
		else
		{
			canvas.style.cursor = "";
		}
	}

	draw()
	{
		//this.updateCursor();

		let map = this.map['tiles'];

		let tileSizeOr = this.maps.tileSizeOrigin;
		let tileSizeCurrent = this.maps.tileSizeCurrent;
		let ratio = this.maps.ratio;

		if (this.action == "putElem")
		{
			this.putElement();
		}

		// draw selected tool
		if (this.selectedElem != null)
		{
			let canvas = document.getElementById('canvas-editorUi');
			let ctx = canvas.getContext('2d');

			let x = Math.floor(this.mouseX / tileSizeCurrent) * tileSizeCurrent;
			let y = Math.floor(this.mouseY / tileSizeCurrent) * tileSizeCurrent;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			if (this.selectedElem == "removeTile")
			{
				ctx.beginPath();
				ctx.rect(x, y, tileSizeCurrent, tileSizeCurrent);
				ctx.fillStyle = "rgba(255, 122, 122, .5)";
				ctx.strokeStyle = "rgba(255, 75, 75, 1)";
				ctx.fill();
				ctx.stroke();
			}
			else if (this.selectedElem == "link")
			{
				// cursor
				ctx.beginPath();
				ctx.rect(x, y, tileSizeCurrent, tileSizeCurrent);
				ctx.fillStyle = "rgba(122, 255, 122, .5)";
				ctx.strokeStyle = "rgba(75, 255, 75, 1)";
				ctx.fill();
				ctx.stroke();
				// line onclick to current mouse position
				if (this.currentLink.active)
				{
					let sX = this.currentLink.x * ratio;
					let sY = this.currentLink.y * ratio;
					ctx.beginPath();
					ctx.strokeStyle = "rgba(75, 255, 75, 1)";
					ctx.moveTo(sX, sY);
					ctx.lineTo(x, y);
					ctx.stroke(); 
				}
			}
			else
			{
				let imgRow = this.selectedElem.imgRow;
				let imgCol = this.selectedElem.imgCol;

				let elem = this.maps['elemInfos'][this.selectedElem.catName][this.selectedElem.objName];
				let img = elem.img

				let sX = imgCol * tileSizeOr;
				let sY = imgRow * tileSizeOr;
				let sW = tileSizeOr * elem.colWidth;
				let sH = tileSizeOr * elem.rowHeight;

				ctx.drawImage(img, sX, sY, sW, sH, x, y, sW * ratio, sH * ratio);
			}
		}

		// draw tiles
		let canvasEd = document.getElementById('canvas-editor');
		let ctxEd = canvasEd.getContext('2d');

		ctxEd.clearRect(0, 0, canvasEd.width, canvasEd.height);

		for (let r = map.length - 1; r >= 0; r--)
		{
			if (map[r])
			{
				for (let c = map[r].length - 1; c >= 0; c--)
				{
					if (map[r][c] && map[r][c].objName)
					{
						let imgRow = map[r][c].imgRow;
						let imgCol = map[r][c].imgCol;

						let el = this.maps['elemInfos'][map[r][c].catName][map[r][c].objName];
						let img = el.img;

						let sX = imgCol * tileSizeOr;
						let sY = imgRow * tileSizeOr;
						let sW = tileSizeOr * el.colWidth;
						let sH = tileSizeOr * el.rowHeight;
						let dX = c * tileSizeCurrent;
						let dY = r * tileSizeCurrent;

						ctxEd.imageSmoothingEnabled  = false;
 						ctxEd.drawImage(img, sX, sY, sW, sH, dX, dY, Math.floor(sW * ratio), Math.floor(sH * ratio));

 						// display links buttons/doors
 						if (map[r][c].objName == "btn")
 						{
 							let obj = map[r][c];
 							if (obj.focus && obj.focus.length > 0)
 							{
 								for (let i = obj.focus.length - 1; i >= 0; i--)
 								{
 									sX = (c + (el.colWidth / 2)) * tileSizeCurrent;
 									sY = (r + (el.rowHeight / 2)) * tileSizeCurrent;

 									let dRow = obj.focus[i].row;
 									let dCol = obj.focus[i].col;

 									// check if door still exist
 									if (map[dRow] && map[dRow][dCol] && map[dRow][dCol].objName == "door")
 									{
	 									let dEl = this.maps['elemInfos'][map[dRow][dCol].catName][map[dRow][dCol].objName];
	 									dX = (dCol + (dEl.colWidth / 2)) * tileSizeCurrent;
	 									dY = (dRow + (dEl.rowHeight / 2)) * tileSizeCurrent;

	 									ctxEd.beginPath();
										ctxEd.strokeStyle = "grey";
										ctxEd.moveTo(sX, sY);
										ctxEd.lineTo(dX, dY);
										ctxEd.stroke();
 									}
 									// ... clean links array
 									else
 									{
										obj.focus.splice(i, 1);
 									}
 								}
 							}
 						}
					}
				}
			}
		}
	}

	selectElem(catName, objName, imgRow, collision)
	{
		let elem = {};
		elem['catName'] = catName;
		elem['objName'] = objName;
		elem['imgRow'] = imgRow;
		elem['imgCol'] = 0;
		elem['collision'] = collision;
		this.selectedElem = elem;
	}

	loadMapFromFile(idInputFile)
	{
	    let inputFile, file, fr;

	    if (typeof window.FileReader !== "function")
	    {
	        alert("Browser need to be updated to work with this function.");
	        return;
	    }

	    inputFile = document.getElementById(idInputFile);
	    if (inputFile.files[0])
	    {
	        file = inputFile.files[0];
	        fr = new FileReader();
	        fr.onload = () =>
	        {
	        	this.map = JSON.parse(fr.result);
	        	this.importMapOptions();
	        	this.importAntsOptions();
	        	this.updateLinkToExportMap();
	        };
	        fr.readAsText(file);
	    }
	}

	updateLinkToExportMap()
	{
		let link = document.getElementById('linkToSaveMap');
		//let map = JSON.stringify(this.map, null, '\t');
		let map = JSON.stringify(this.map);
		let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(map);
		link.setAttribute("href", dataUri);
	}

	createLinkToExportMap()
	{
		let editorUi = document.getElementById('editor-ui');

		// save
		let link = document.createElement("a");
		link.setAttribute("id", "linkToSaveMap");
		link.setAttribute("class", "linkToSaveMap");
		link.setAttribute("download", "map.json");
		link.innerText = "save map";
		editorUi.appendChild(link);

		link.addEventListener('click', () =>
		{
			this.exportMapOptions();
			this.exportAntsOptions();

			this.updateLinkToExportMap();
			if (this.map['tiles'].length == 0)
			{
				event.preventDefault();
			}
		})

		//load
		let div = document.createElement("div");
		div.setAttribute("class", "loadFileContainer");

		link = document.createElement("a");
		link.setAttribute("class", "loadFileFakeLink");
		link.innerText = "load map";

		let input = document.createElement("input");
		input.setAttribute("id", "loadFile");
		input.setAttribute("class", "loadFile");
		input.setAttribute("type", "file");

		div.appendChild(link);
		div.appendChild(input);
		editorUi.appendChild(div);

		input.addEventListener('change', () =>
		{
			this.loadMapFromFile("loadFile");
		})
	}

	openUi()
	{
		let editorUI = document.getElementById('editor-ui');
		if (!editorUI.classList.contains('editor-openUi'))
		{
			editorUI.classList.add('editor-openUi');
		}
	}

	toggleMenuAutoClose()
	{
		let editorUi = document.getElementById('editor-ui');
		let autoCloseMenuIcon = document.getElementById('autoCloseMenu');

		if (editorUi.classList.contains('editor-autoClose'))
		{
			editorUi.classList.remove('editor-autoClose');
			autoCloseMenuIcon.classList.remove('iconSelected');
		}
		else
		{
			editorUi.classList.add('editor-autoClose');
			autoCloseMenuIcon.classList.add('iconSelected');
		}
	}

	toggleMenuSide()
	{
		let editorUi = document.getElementById('editor-ui');
		let editorMenuOptions = document.getElementById('editor-menuOptions');
		let toggleSideMenu = document.getElementById('toggleSideMenu');

		if (editorUi.classList.contains('editor-rightSide'))
		{
			editorUi.classList.remove('editor-rightSide');
			editorMenuOptions.appendChild(toggleSideMenu);
		}
		else
		{
			editorUi.classList.add('editor-rightSide');
			editorMenuOptions.insertBefore(toggleSideMenu, editorMenuOptions.firstChild);
		}
	}

	loadOptionsIcons(icons, catName)
	{
		let editorMenuOptions = document.getElementById('editor-menuOptions');

		for (let i = 0, length = icons.length; i < length; i++)
		{
			let icon = this.maps['elemInfos'][catName][icons[i]].img;

			let iconContainer = document.createElement('div');
			iconContainer.setAttribute('id', icons[i]);
			iconContainer.setAttribute('class', 'icon-Container ' + icons[i]);

			iconContainer.appendChild(icon);
			editorMenuOptions.appendChild(iconContainer);

			// events
			if (icons[i] == "autoCloseMenu")
			{
				iconContainer.addEventListener('click', this.toggleMenuAutoClose);
			}
			else if (icons[i] == "toggleSideMenu")
			{
				iconContainer.addEventListener('click', this.toggleMenuSide);
			}
		}
	}

	loadAntsOptions()
	{
		let antsOptionsCont = document.getElementById('editor-antsOptions');
		let antsOptionsIcons = this.maps.editor.elemsList.antsIcons
		for (let i = 0, length = antsOptionsIcons.length; i < length; i++)
		{
			if (antsOptionsIcons[i] != "cancel" && antsOptionsIcons[i] != "suicide")
			{
				let rowContainer = document.createElement('div');
				rowContainer.setAttribute('class', 'row-container')

				let imgNfo = this.maps['elemInfos']["antsIcons"][antsOptionsIcons[i]];
				let img = imgNfo.img.cloneNode(true);

				let input = document.createElement('input');
				input.setAttribute('id', antsOptionsIcons[i]);
				input.value = this.map.actions[antsOptionsIcons[i]];

				rowContainer.appendChild(img);
				rowContainer.appendChild(input);
				antsOptionsCont.appendChild(rowContainer);
			}
		}
	}

	loadBuildMapIcons(objsName, catName)
	{
		let editorElemsCont = document.getElementById('editorElems-container');

		let catContainer = document.createElement('div');
		catContainer.setAttribute('id', 'editorCat_' + catName);
		catContainer.setAttribute('class', 'editorCat');

		// temp canvas to cut tiles collection
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');

		for (let i = 0, length = objsName.length; i < length; i++)
		{
			let elem = this.maps['elemInfos'][catName][objsName[i]];
			let collision = elem['collision'] ? elem['collision'] : false;

			let sW = this.maps.tileSizeOrigin * elem.colWidth;
			let sH = this.maps.tileSizeOrigin * elem.rowHeight;
			canvas.width = sW;
			canvas.height = sH;

			for (let t = 0, tLength = elem.typeLength; t < tLength; t++)
			{
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(elem.img, 0, t * sH, sW, sH, 0, 0, sW, sH);

				let imgContainer = document.createElement('div');
				imgContainer.setAttribute('id', objsName[i] + '_' + t);
				imgContainer.setAttribute('class', 'img-container');

				let img = new Image();
				img.src = canvas.toDataURL("image/png");

				imgContainer.appendChild(img);
				catContainer.appendChild(imgContainer);

				if (objsName[i] == "removeTile" || objsName[i] == "link")
				{
					imgContainer.addEventListener('click', () =>
					{
						this.selectedElem = objsName[i];
					});
				}
				else
				{
					imgContainer.addEventListener('click', this.selectElem.bind(this, catName, objsName[i], t, collision), false);
				}
			}
		}
		editorElemsCont.appendChild(catContainer)
	}

	moveDisplayFps()
	{
		let editorUi = document.getElementById('editor-ui');
		let fpsContainer = document.getElementById('fps-container');

		editorUi.insertBefore(fpsContainer, editorUi.firstChild);
	}

	initMenu()
	{
		this.moveDisplayFps();

		// Unhide all game canvas
		let section = document.getElementById('game');
		section.classList.remove('hidden')

		// Create icons
		let elemsList = this.maps['editor']['elemsList'];

		for (let catName in elemsList)
		{
			// icons for menu editor options
			if (catName == "editorOptionsIcons")
			{
				this.loadOptionsIcons(elemsList[catName], catName);
			}
			else if (catName == "antsIcons")
			{
				this.loadAntsOptions();
			}
			// icons to build map
			else
			{
				this.loadBuildMapIcons(elemsList[catName], catName);
			}
		}

		this.createLinkToExportMap();
	}

	initEvents()
	{
		let canvas = document.getElementById('canvas-editorUi');

		canvas.addEventListener('mousemove',  () =>
		{ 
			this.mouseX = event.layerX;
			this.mouseY = event.layerY;
		});

		canvas.addEventListener('mousedown',  () =>
		{
			this.action = "putElem";
		});

		window.addEventListener('mouseup',  () =>
		{
			this.action = "";
			this.completeLinkIntObj();
		});
	}

	initTestMap()
	{
		let testMapBtn = document.getElementById('testMap');
		testMapBtn.addEventListener('click', () => this.testMap());

		// back to editor
		let ui = document.getElementById('ui');
		let btn = document.createElement('button');
		btn.innerText = "back to editor";
		btn.setAttribute('id', "backToEditor");
		btn.setAttribute('class', "btn backToEditor hidden");

		btn.addEventListener('click', () => this.backToEditor());
		ui.appendChild(btn);
	}

	init()
	{
		this.initMenu();
		this.initTestMap();
		this.openUi();
		this.initEvents();
		this.importMapOptions();
		this.importAntsOptions();
	}
}