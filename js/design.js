var toolbox = {
	tools : {
		NONE : "NONE",
		WALLS : "WALLS",
		DELETE: "DELETE"
	}
};

var selectedTool = toolbox.tools.NONE;

var wallHTML = '<line id="{0}" class="canvas_el wall" x1="{1}" y1="{2}" x2="{3}" y2="{4}" style="stroke:rgb(255,255,255); stroke-width: 10;" onmouseover="Hover(this);" onmouseout="HoverEnd(this);" />';

var mousePos = { x: 0, y: 0 };

var walls = new Array();
var wallDrawing = null;

var currentlyHovering = null;

var lastObjectID = 0;

// Helper functions 

function SelectTool(tool) {
	selectedTool = tool;
}

function Hover(elem) {
	console.log("Hover!");
	if (selectedTool == toolbox.tools.DELETE) {
		$(elem).addClass("deleteHover");
		currentlyHovering = elem;
	}
}

function HoverEnd(elem) {
	if (selectedTool == toolbox.tools.DELETE) {
		$(elem).removeClass("deleteHover");
		currentlyHovering = elem;
	}
}

// Events

$(document).ready(function() {
	var offset = $("#canvas").offset();
	
	$(document).mousedown(function(e) {
		// Checks if clicked on canvas, then passes event to mDown.
		if ($(e.target).attr("id") == "canvas" || $(e.target).hasClass("canvas_el")) mDown(e);
	});
	
	// Separate function because of bug with being unable to refresh
	function mDown(e) {
			console.log(currentlyHovering);
		if (selectedTool == toolbox.tools.WALLS) {
			var pos = new Point(e.clientX - offset.left, e.clientY - offset.top);

			wallDrawing = new Wall(pos, pos);
			wallDrawing.AddToCanvas();
		} else if (selectedTool == toolbox.tools.DELETE && currentlyHovering != null) {
			if ($(currentlyHovering).hasClass("wall")) {
				var id = $(currentlyHovering).attr("id");
				walls["wall" + id].Delete();
			}
		}
	}
	
	// Once the user is down dragging the wall out, finalize the wall.
	$(document).mouseup(function(e) {
		if (selectedTool == toolbox.tools.WALLS && wallDrawing != null) {
			console.log("Reset");
			wallDrawing = null;
		}
	});
	
	// Allows the user to drag the wall out
	$(document).mousemove(function(e) {
    	mousePos.x = e.pageX;
    	mousePos.y = e.pageY;
		
		if (selectedTool == toolbox.tools.WALLS && wallDrawing != null) {
			var clamped = SmartClampPoint(wallDrawing.pos1, new Point(mousePos.x - offset.left, mousePos.y - offset.top))
			
			if (clamped != null) {
				wallDrawing.pos2 = clamped; // Offset the wall based on where the canvas is positioned
				wallDrawing.Update();
			}
		}
	});
	
	// String.format function
	if (!String.prototype.format) {
		String.prototype.format = function() {
		var args = arguments;
			return this.replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}
});

// Core Functions

function SmartClampPoint(p1, p2) {
	function Between(test, min, max) {
		return (min < test) && (test < max); // If it's exact then there is no need to clamp (good luck with that, though)
	}
	
	var a = Math.round(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI) + 180; // Angle between the two points, normalized to [0, 360);
	var r, c = null;
	
	// Get the reference angle
	if (Between(a, 0, 90)) r = a;
	else if (Between(a, 90, 180)) r = 180 - a;
	else if (Between(a, 180, 270)) r = a - 180;
	else if (Between(a, 270, 360)) r = 360 - a;
	else r = a;
	
	// Decide what to clamp the 
	if (Between(r, 0, 25)) r = 0;
	else if (Between(r, 25, 65)) r = 45;
	else if (Between(r, 65, 90)) r = 90;
	// Clamp the point
	if (r == 0) c = new Point(p2.x, p1.y);
	else if (r == 90) c = new Point(p1.x, p2.y);
	else if (r == 45) {
		var dv = p2.y - p1.y;
		var dh = p2.x - p1.x;
		var m, mx, my;
		
		if (Math.abs(dv) > Math.abs(dh)) {
			m = Math.abs(dv);
		} else {
			m = Math.abs(dh);
		}
		
		if (dv > 0) my = 1;
		else my = -1;
		
		if (dh > 0) mx = 1;
		else mx = -1;
		console.log(mx + " " + my);
		c = new Point(p1.x + (m * mx), p1.y + (m * my));
	}
	
	return c;
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
// Objects

// Point

var Point = function(x, y) {
	this.x = x;
	this.y = y;
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
// Wall

var Wall = function(pos1, pos2) {
	this.id = lastObjectID++;
	this.pos1 = pos1;
	this.pos2 = pos2;
	walls["wall" + this.id.toString()] = this;
}

Wall.prototype.Delete = function() {
	walls.splice(walls.indexOf(this), 1);
	$("#" + this.id).remove();
}

Wall.prototype.Format = function() {
	var formatted = wallHTML.format(this.id, this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y);
	
	return formatted;
}

Wall.prototype.Update = function() {
	var elem = $("#" + this.id);
	elem.attr("x1", this.pos1.x);
	elem.attr("y1", this.pos1.y);
	elem.attr("x2", this.pos2.x);
	elem.attr("y2", this.pos2.y);
	
	$("body").html($("body").html()); // Refresh the HTML to update the SVG
}

Wall.prototype.SetNewPos = function(pos1, pos2) {
	this.pos1 = pos1;
	this.pos2 = pos2;
	this.Update();
}

Wall.prototype.AddToCanvas = function() {
	$("#canvas").append(this.Format());
	
	return this;
}

// ------------------------------------------------------------------------------------------------------------------------------------------------
// Room

var Room = function(c1, c2) {
	this.id = lastObjectID++;
	this.corner1 = c1;
	this.corner2 = c2;
	this.walls = [null, null, null, null];
	this.AddWalls();
}

Room.prototype.SetNewBounds = function(c1, c2) {
	this.corner1 = c1;
	this.corner2 = c2;
	this.UpdateWalls();
}

Room.prototype.GetPoints = function() {
	var c = [null, null, null, null];
	c[0] = new Point(this.corner1.x, this.corner1.y);
	c[1] = new Point(this.corner1.x, this.corner2.y);
	c[2] = new Point(this.corner2.x, this.corner2.y);
	c[3] = new Point(this.corner2.x, this.corner1.y); // boom // Commented comment: Used to be variable c4, but now is c[3]. Ceremonial boom.
	
	return c;
}

Room.prototype.AddWalls = function() {
	var c = this.GetPoints();
	
	this.walls[0] = new Wall(c[0], c[1]).AddToCanvas();
	this.walls[1] = new Wall(c[1], c[2]).AddToCanvas();
	this.walls[2] = new Wall(c[2], c[3]).AddToCanvas();
	this.walls[3] = new Wall(c[3], c[0]).AddToCanvas();
}

Room.prototype.UpdateWalls = function() {
	var c = this.GetPoints();
	
	this.walls[0].SetNewPos(c[0], c[1]);
	this.walls[1].SetNewPos(c[1], c[2]);
	this.walls[2].SetNewPos(c[2], c[3]);
	this.walls[3].SetNewPos(c[3], c[1]);
}