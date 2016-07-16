var toolbox = {
	tools : {
		NONE : "NONE",
		WALLS : "WALLS"
	}
};

var wallHTML = '<line id={0} class="canvas_el" x1="{1}" y1="{2}" x2="{3}" y2="{4}" style="stroke:rgb(255,255,255); stroke-width:5" />'
var mousePos = { x: 0, y: 0 };
var selectedTool = toolbox.tools.NONE;
var wallDrawing = null;
var objectID = 0;
var walls = [];

function SelectTool(tool) {
	selectedTool = tool;
}

function FormatWall(wall) {
	var formatted = wallHTML.format(wall.id, wall.pos1.x, wall.pos1.y, wall.pos2.x, wall.pos2.y);
	
	return formatted;
}

function UpdateWall(wall) {
	var elem = $("#" + wall.id);
	elem.attr("x2", wall.pos2.x);
	elem.attr("y2", wall.pos2.y);
	
	$("body").html($("body").html()); // Refresh the HTML to update the SVG
}

$(document).ready(function() {
	var offset = $("#canvas").offset();
	
	$(document).mousedown(function(e) {
		// Checks if clicked on canvas, then passes event to mDown.
		if ($(e.target).attr("id") == "canvas") mDown(e);
	});
	
	// Separate function because of bug with being unable to refresh
	function mDown(e) {
		if (selectedTool == toolbox.tools.WALLS) {
			var pos = { x: e.clientX - offset.left, y: e.clientY - offset.top };

			wallDrawing = new Wall(pos, pos);
			$("#canvas").append(FormatWall(wallDrawing));
		}
	}
	
	// Once the user is down dragging the wall out, finalize the wall.
	$(document).mouseup(function() {
		if (selectedTool == toolbox.tools.WALLS) {
			console.log("Reset");
			walls.push(wallDrawing);
			wallDrawing = null;
		}
	});
	
	// Allows the user to drag the wall out
	$(document).mousemove(function(e) {
    	mousePos.x = e.pageX;
    	mousePos.y = e.pageY;
		
		if (selectedTool == toolbox.tools.WALLS && wallDrawing != null) {
			wallDrawing.pos2 = { x: mousePos.x - offset.left, y: mousePos.y - offset.top }; // Offset the wall based on where the canvas is positioned
			UpdateWall(wallDrawing);
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

var Wall = function(pos1, pos2) {
	this.id = objectID++;
	this.pos1 = pos1;
	this.pos2 = pos2;
}

Wall.prototype.Delete = function() {
	walls.splice(walls.indexOf(this), 1);
}