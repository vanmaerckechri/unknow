"use strict";

class Maps
{
	constructor()
	{
		this.currentMap = "map01";
		this.standardTileWidth= 32;
		this.standardTileHeight= 32;

		this.elemInfos = 
		{
			blocs:
			{
				grass:
				{
					img: null,
					imgSrc: "bloc_grass.png",
					colWidth: 1,
					rowHeight: 1,
					shadeLength: 4,
					typeLength: 3
				},
				ground:
				{
					img: null,
					imgSrc: "bloc_ground.png",
					colWidth: 1,
					rowHeight: 1,
					shadeLength: 4,
					typeLength: 3
				},
				stalactites:
				{
					img: null,
					imgSrc: "bloc_stalactites.png",
					colWidth: 1,
					rowHeight: 1,
					shadeLength: 4,
					typeLength: 3
				}
			},
			player:
			{
				walk:
				{
					img: null,
					imgSrc: "player_walk.png",
					colWidth: 1,
					rowHeight: 1,
					shadeLength: 1,
					typeLength: 1
				}
			},
			doors:
			{
				spawn:
				{
					editor: true,
					img: null,
					imgSrc: "entity_spawn.png",
					colWidth: 2,
					rowHeight: 2,
					shadeLength: 1,
					typeLength: 1
				},
				exit:
				{
					img: null,
					imgSrc: "entity_exit.png",
					colWidth: 2,
					rowHeight: 2,
					shadeLength: 1,
					typeLength: 1
				}
			},
			background:
			{
				gabarit:
				{
					img: null,
					imgSrc: "background.png"
				}
			}
		};

		this.editor =
		{
			elemsList: 
			{
				blocs: ["grass", "ground", "stalactites"],
				doors: ["spawn", "exit"]
			}
		};

		this.commonElem = 
		{
			elemsList: 
			{
				player: ["walk"],
				doors: ["spawn", "exit"],
				background: ["gabarit"]
			}
		};

		this.map01 = 
		{
			w: 3840,
			h: 2160,
			elemsList: 
			{
				blocs: ["grass", "ground", "stalactites"],
			},

			tiles:
			[
				
			]
		}
	}
}