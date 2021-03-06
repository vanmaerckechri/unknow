"use strict";

class Resolution
{
	static update()
	{
		let sections = document.querySelectorAll('section')

		let standardWidth = 1920;
		let standardHeight = 1080;
		let standardRatio = standardWidth / standardHeight;

		let windowWidth = window.innerWidth;
		let windowHeight = window.innerHeight;
		let windowRatio = windowWidth / windowHeight;

		let newWidth = 0;
		let newHeight = 0;

		if (windowHeight >= standardHeight && windowWidth >= standardWidth)
		{
			newWidth = standardWidth;
			newHeight = standardHeight;
		}
		else
		{
			if (standardRatio < windowRatio)
			{
				newHeight = windowHeight;
				newWidth = newHeight * standardRatio;
			}
			else
			{
				newWidth = windowWidth;
				newHeight = windowWidth / standardRatio;
			}
		}
		
		for (let s = sections.length - 1; s >= 0; s--)
		{
			let section = sections[s];

			section.style.width = newWidth + "px";
			section.style.height = newHeight + "px";
		}
	}

	static resizeCanvas(canWidth, canHeight)
	{
		Canvas.resizeSections();

		let standardWidth = 1920;
		let standardHeight = 1080;

		let gameSection = document.getElementById('game');
		let gameWidth = gameSection.offsetWidth;
		let gameHeight = gameSection.offsetHeight;

		let ratio = standardWidth / gameWidth;

		let canvasContainer = document.getElementById('canvas-container');
		let canvas = document.getElementById('canvas-bg');

		canvas.width = canWidth / ratio;
		canvas.height = canHeight / ratio;

		canvasContainer.style.width = canvas.width + "px";
		canvasContainer.style.height = canvas.height + "px";
	}

	static resizeWindow(canWidth, canHeight)
	{
		Canvas.resizeSections();
		Canvas.resizeBgCanvas(canWidth, canHeight);
	}

	static drawCanvasBg(imgBg)
	{
		let canvasBg = document.getElementById('canvas-bg');
		let ctx = canvasBg.getContext('2d');

		ctx.drawImage(imgBg, 0, 0, imgBg.width, imgBg.height, 0, 0, canvasBg.width, canvasBg.height);
	}

	static initSize(imgBg)
	{
		this.drawCanvasBg(imgBg);
	}
}