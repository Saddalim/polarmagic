
var canvas;
var drawables = [];
var origo = {x: 0.0, y: 0.0};
var graph;
var wind = {x: 0.0, y: 0.0};

const maxHorWind = 25;
const minHorWind = -25;
const maxVerWind = 6;
const minVerWind = -6;
const windHorRange = maxHorWind  - minHorWind;
const windVerRange = maxVerWind - minVerWind;

var uiUpdateTimer = null;
var windHorSlider;
var windVertSlider;
const polarResolution = 10;
const windHorResolution = 10; // How much of 10^-n
const windVerResolution = 10; // How much of 10^-n
var polar;

var showMidGlides = [ false, false, false, false ];
var glidePercents = [ 0.0, 0.38, 0.55, 1.0];
var glideColors = ["orange", "blue", "magenta", "red"];

      class Graph {
    	  
    	  constructor(config)
    	  {
        // user defined properties
        this.canvas = document.getElementById(config.canvasId);
        this.minX = config.minX;
        this.minY = config.minY;
        this.maxX = config.maxX;
        this.maxY = config.maxY;
        this.unitsPerTickX = config.unitsPerTickX;
        this.unitsPerTickY = config.unitsPerTickY;

        // constants
        this.axisColor = '#aaa';
        this.font = '8pt Calibri';
        this.tickSize = 20;

        // relationships
        this.context = this.canvas.getContext('2d');
        this.rangeX = this.maxX - this.minX;
        this.rangeY = this.maxY - this.minY;
        this.unitX = this.canvas.width / this.rangeX;
        this.unitY = this.canvas.height / this.rangeY;
        this.centerY = Math.round(Math.abs(this.minY / this.rangeY) * this.canvas.height);
        this.centerX = Math.round(Math.abs(this.minX / this.rangeX) * this.canvas.width);
        this.iteration = (this.maxX - this.minX) / 1000;
        this.scaleX = this.canvas.width / this.rangeX;
        this.scaleY = this.canvas.height / this.rangeY;

        // draw x and y axis
        this.drawXAxis();
        this.drawYAxis();
      }

      drawXAxis() {
        var context = this.context;
        context.save();
        context.beginPath();
        context.moveTo(0, this.centerY);
        context.lineTo(this.canvas.width, this.centerY);
        context.strokeStyle = this.axisColor;
        context.lineWidth = 2;
        context.stroke();

        // draw tick marks
        var xPosIncrement = this.unitsPerTickX * this.unitX;
        var xPos, unit;
        context.font = this.font;
        context.textAlign = 'center';
        context.textBaseline = 'top';

        // draw left tick marks
        xPos = this.centerX - xPosIncrement;
        unit = -1 * this.unitsPerTickX;
        while(xPos > 0) {
          context.moveTo(xPos, this.centerY - this.tickSize / 2);
          context.lineTo(xPos, this.centerY + this.tickSize / 2);
          context.stroke();
          context.fillText(Math.round(unit * 100) / 100, xPos, this.centerY + this.tickSize / 2 + 3);
          unit -= this.unitsPerTickX;
          xPos = Math.round(xPos - xPosIncrement);
        }

        // draw right tick marks
        xPos = this.centerX + xPosIncrement;
        unit = this.unitsPerTickX;
        while(xPos < this.canvas.width) {
          context.moveTo(xPos, this.centerY - this.tickSize / 2);
          context.lineTo(xPos, this.centerY + this.tickSize / 2);
          context.stroke();
          context.fillText(Math.round(unit * 100) / 100, xPos, this.centerY + this.tickSize / 2 + 3);
          unit += this.unitsPerTickX;
          xPos = Math.round(xPos + xPosIncrement);
        }
        context.restore();
      }

      drawYAxis() {
        var context = this.context;
        context.save();
        context.beginPath();
        context.moveTo(this.centerX, 0);
        context.lineTo(this.centerX, this.canvas.height);
        context.strokeStyle = this.axisColor;
        context.lineWidth = 2;
        context.stroke();

        // draw tick marks
        var yPosIncrement = this.unitsPerTickY * this.unitY;
        var yPos, unit;
        context.font = this.font;
        context.textAlign = 'right';
        context.textBaseline = 'middle';

        // draw top tick marks
        yPos = this.centerY - yPosIncrement;
        unit = this.unitsPerTickY;
        while(yPos > 0) {
          context.moveTo(this.centerX - this.tickSize / 2, yPos);
          context.lineTo(this.centerX + this.tickSize / 2, yPos);
          context.stroke();
          context.fillText(Math.round(unit * 100) / 100, this.centerX - this.tickSize / 2 - 3, yPos);
          unit += this.unitsPerTickY;
          yPos = Math.round(yPos - yPosIncrement);
        }

        // draw bottom tick marks
        yPos = this.centerY + yPosIncrement;
        unit = -1 * this.unitsPerTickY;
        while(yPos < this.canvas.height) {
          context.moveTo(this.centerX - this.tickSize / 2, yPos);
          context.lineTo(this.centerX + this.tickSize / 2, yPos);
          context.stroke();
          context.fillText(Math.round(unit * 100) / 100, this.centerX - this.tickSize / 2 - 3, yPos);
          unit -= this.unitsPerTickY;
          yPos = Math.round(yPos + yPosIncrement);
        }
        context.restore();
      }

      drawEquation(equation, color, thickness) {
        var context = this.context;
        context.save();
        context.save();
        this.transformContext();

        context.beginPath();
        context.moveTo(this.minX, equation(this.minX));

        for(var x = this.minX + this.iteration; x <= this.maxX; x += this.iteration) {
          context.lineTo(x, equation(x));
        }

        context.restore();
        context.lineJoin = 'round';
        context.lineWidth = thickness;
        context.strokeStyle = color;
        context.stroke();
        context.restore();
      }

      transformContext() {
        var context = this.context;

        // move context to center of canvas
        this.context.translate(this.centerX, this.centerY);

        /*
         * stretch grid to fit the canvas window, and
         * invert the y scale so that that increments
         * as you move upwards
         */
        context.scale(this.scaleX, -this.scaleY);
      }
      }      


// Given the 4 control points on a Bezier curve 
// get x,y at interval T along the curve (0<=T<=1)
// The curve starts when T==0 and ends when T==1
function getCubicBezierXYatPercent(startPt, controlPt1, controlPt2, endPt, percent) {
    var x = CubicN(percent, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
    var y = CubicN(percent, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
    return ({
        x: x,
        y: y
    });
}

function getBezPtAtPercent(bezier, percent)
{
	return getCubicBezierXYatPercent(bezier[0], bezier[1], bezier[2], bezier[3], percent);
}

// cubic helper formula
function CubicN(T, a, b, c, d) {
    var t2 = T * T;
    var t3 = t2 * T;
    return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3;
}

function getGraphXOf(x)
{
    return origo.x + x * (canvas.width() / (maxHorWind - minHorWind));
}

function getGraphYOf(y)
{
    return origo.y + y * (canvas.height() / (maxVerWind - minVerWind));
}

function drawArrow(context, fromx, fromy, tox, toy, headlen)
{
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}

function getPolar(peak, peakXFactor, endX, endY)
{
	return [ {x: 0, y: 0},
			 {x: endX * (peakXFactor * 0.1), y: peak},
			 {x: endX * peakXFactor, y: peak * 0.666},
			 {x: endX, y: -endY} ];
}

function drawBezier(context, b)
{
	//ctx.lineWidth=7;
	context.beginPath();
	context.moveTo(getGraphXOf(b[0].x), getGraphYOf(b[0].y));
	context.bezierCurveTo(getGraphXOf(b[1].x), getGraphYOf(b[1].y),
                            getGraphXOf(b[2].x), getGraphYOf(b[2].y),
                            getGraphXOf(b[3].x), getGraphYOf(b[3].y));
	context.stroke();
}

class Drawable
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}
	
	draw(context)
	{
		this.doDraw(context);
	}
	
	doDraw(context) {}
}

function distanceOfPtLine(point, line)
{
	return Math.abs(line.a * point.x + line.b * point.y + line.c) / Math.sqrt(Math.pow(line.a, 2) + Math.pow(line.b, 2));
}

class Polar extends Drawable
{
	constructor(startX, startY, peak, peakXFactor, endX, endY)
	{
		super(startX, startY);
		this.peak = peak;
		this.peakXFactor = peakXFactor;
		this.endX = endX;
		this.endY = endY;
		
		this.baseX = startX;
		this.baseY = startY;
		this.offsetX = 0.0;
		this.offsetY = 0.0;
		
		this.polar = getPolar(peak, peakXFactor, endX, endY);
	}
	
	getPolar()
	{
		return this.polar;
	}
	
	manipWeight(multiplier)
	{
		for (var i = 0; i < this.polar.length; ++i)
		{
			this.polar[i].x *= multiplier;
			this.polar[i].y *= multiplier;
		}
		
		this.baseX *= multiplier;
		this.baseY *= multiplier;
		
		this.recalcPosition();
	}

	polarToGraphical()
    {
        var offsetPolar = [];
        for (var i = 0; i < this.polar.length; ++i)
        {
            offsetPolar.push({x: this.polar[i].x + this.x, y: (this.polar[i].y + this.y) * -1.0});
        }
        return offsetPolar;
    }
	
	doDraw(context)
	{
		context.lineWidth = 8;
		drawBezier(context, this.polarToGraphical());
		//this.doDrawPoints(context, polarResolution);
	}
	
	doDrawPoints(context, resolution)
	{
		context.fillStyle = "#f00";
		var graphicalPolar = this.polarToGraphical();
		for (var i = 0; i <= resolution; i++)
		{
			var pt = getBezPtAtPercent(graphicalPolar, i / resolution);
			context.beginPath();
			context.arc(getGraphXOf(pt.x), getGraphYOf(pt.y), 3, 0, Math.PI * 2.0);
			context.fill();
		}
	}
	
	offsetTo(x, y)
	{
		this.offsetX = x;
		this.offsetY = y;
		
		this.recalcPosition();
	}
	
	recalcPosition()
	{
		this.x = this.baseX + this.offsetX;
		this.y = this.baseY + this.offsetY;
	}
	
	getTouchingAngle()
	{
		const angleResolution = 0.001;
		const distTreshold = 0.05;
		var retVal = { top: 0.0, bottom: 0.0 };
		
		var seekStart = polar.x > 0 ? (-Math.PI / 2) - 0.01 : -0.01;
		var seekEnd = polar.x > 0 ? (-3.0 * Math.PI / 2) : (-3.0 * Math.PI / 2);
		breakout1:
		
		for (var angle = seekStart; angle > seekEnd; angle -= angleResolution)
		{
			var line = { a: Math.tan(angle), b: -1.0, c: 0.0};
			for (var i = 0; i <= polarResolution; i++)
			{
				var pt = getBezPtAtPercent(this.polar, i / polarResolution);
				pt.x += this.x;
				pt.y += this.y;
				var dist = distanceOfPtLine(pt, line);
				//console.log("Angle: " + angle + ", Dist: " + dist)
				if (dist < distTreshold)
				{
					retVal.top = angle;
					break breakout1;
				}
			}
		}
		
		breakout2:
		for (var angle = (Math.PI / 2) + 0.01; angle > (-3.0 * Math.PI / 2); angle += angleResolution)
		{
			var line = { a: Math.tan(angle), b: -1.0, c: 0.0};
			for (var i = 0; i <= polarResolution; i++)
			{
				var pt = getBezPtAtPercent(this.polar, i / polarResolution);
				pt.x += this.x;
				pt.y += this.y;
				var dist = distanceOfPtLine(pt, line);
				//console.log("Angle: " + angle + ", Dist: " + dist)
				if (dist < distTreshold)
				{
					retVal.bottom = angle;
					break breakout2;
				}
			}
		}
		
		return retVal;
	}
}

class GlideSlopes extends Drawable
{
	constructor()
	{
		super(0, 0);
	}
	
	doDraw(context)
	{

		// trick draw
		context.restore();
		
		var touch = polar.getTouchingAngle();
		
		var midGlideSlopes = [];
		
		for (var i = 0; i < showMidGlides.length; ++i)
		{
			if (showMidGlides[i])
			{
				// Minimum speed glideslope
				var polarPt = getBezPtAtPercent(polar.getPolar(), glidePercents[i]);
				midGlideSlopes[i] = (polar.y + polarPt.y) / (polar.x + polarPt.x);

				graph.drawEquation(function(x) {
				  return midGlideSlopes[i] * x;
				}, glideColors[i], 3);
			}
		}
		graph.drawEquation(function(x) {
		  return Math.tan(touch.top) * x;
		}, 'green', 6);
		/*graph.drawEquation(function(x) {
		    return Math.tan(touch.bottom) * x;
		  }, 'red', 3);*/
		
		//context.save();
		
		//this.transform(context);
		
		
		
		context.font = "46px Arial";
		context.fillStyle = "green";
		
		var glideNum = "inf";
		var glideAngle = 1.0 / Math.tan(touch.top + Math.PI);
		if (glideAngle < 0.0)
		{
			glideNum = Math.round(Math.abs(glideAngle) * 100) / 100;
		}
		context.fillText(glideNum, 50, 50);
		
		for (var i = 0; i < showMidGlides.length; ++i)
		{
			if (showMidGlides[i])
			{
				context.fillStyle = glideColors[i];
				glideAngle = 1.0 / midGlideSlopes[i];
				glideNum = "inf";
				if (midGlideSlopes[i] < 0.0)
				{
					glideNum = Math.round(Math.abs(glideAngle) * 100) / 100;
				}
				context.fillText(glideNum, 50, 50 + 40 * (i + 1));
			}
		}
		
		//context.restore();
		
		//context.save();
	}
}

function reDrawCanvas()
{
    canvasDOM = canvas[0];
    var width = canvas.width();
    var height = canvas.height();

    canvasDOM.width = width;
    canvasDOM.height = height;
    var midX = width / 2;
    var midY = height / 2;
    origo.x = midX;
    origo.y = midY;

	var context = canvasDOM.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	graph = new Graph({
        canvasId: 'polarcanvas',
        minX: minHorWind,
        minY: minVerWind,
        maxX: maxHorWind,
        maxY: maxVerWind,
        unitsPerTickX: /*(1.0 / scale.x) / 10*/ 1,
        unitsPerTickY: /*(1.0 / scale.y) / 10*/ 1
      });
	
	
	for (var i = 0; i < drawables.length; ++i)
	{
		drawables[i].draw(context);
	}
}

function updatePolarPosition()
{
	polar.offsetTo(wind.x, wind.y);
	reDrawCanvas();
}

function delayedPolarRedraw()
{
	if (uiUpdateTimer != null)
	{
		clearTimeout(uiUpdateTimer);
	}
	uiUpdateTimer = setTimeout(updatePolarPosition, 13);
}

function updateHorWind()
{
	wind.x = (windHorSlider.val() - (windHorRange * windHorResolution / 2)) / windHorResolution;
	var kph = wind.x * 3.6;
	$('#windHorValue').text(Math.round(wind.x * 100) / 100 + " m/s | " + Math.round(kph * 100) / 100 + " km/h");
	delayedPolarRedraw();
}

function updateVertWind()
{
	wind.y = (windVertSlider.val() - (windVerRange * windVerResolution / 2)) / windVerResolution;
	var kph = wind.y * 3.6;
	$('#windVertValue').text(Math.round(wind.y * 100) / 100 + " m/s | " + Math.round(kph * 100) / 100 + " km/h");
	delayedPolarRedraw();
}


$(function() {
	
	canvas = $('#polarcanvas');
	//canvas = canvasjq[0];
	var context = canvas[0].getContext('2d');
	var c = context;
	
	//var width = canvas.width();
	//var height = canvas.height();
	
	$(window).resize(delayedPolarRedraw);
	
	//canvas.width = width;
	//canvas.height = height;
	
	//var midX = canvas.width / 2.0;
	//var midY = canvas.height / 2.0;
	
	//origo.x = midX;
	//origo.y = midY;
	
	/*var coordSys = new CoordSys()
	drawables.push(coordSys);*/
	
	polar = new Polar(6.6, -1.8, 1.5, 0.5, 8.5, 1.2);
	drawables.push(polar);
	
	var glideSlopes = new GlideSlopes();
	drawables.push(glideSlopes);
	
	reDrawCanvas();

	windHorSlider = $('#windHorSlider');
	windHorSlider.attr('max', windHorRange * windHorResolution);
	windHorSlider.val(windHorRange * windHorResolution / 2.0);
	  
	windVertSlider = $('#windVertSlider');
	windVertSlider.attr('max', windVerRange * windHorResolution);
	windVertSlider.val(windVerRange * windHorResolution / 2.0);
	
	$('.gsChkBkx').change(function() {
		showMidGlides[0] = $('#stallSpdChkBox').is(":checked");
		showMidGlides[1] = $('#minSinkChkBox').is(":checked");
		showMidGlides[2] = $('#trimSpdChkBox').is(":checked");
		showMidGlides[3] = $('#maxSpdChkBox').is(":checked");
		
		reDrawCanvas();
	});
	
	
});