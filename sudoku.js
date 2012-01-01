/**
 * @file   sudoku.js
 * @author Matthew Eagar
 * @author meagar@gmail.com
 * @date   October 1 2009
 *
 * This code is released as-is, completely free of restriction:
 * You may copy, modify, redistribute or include and or all of this file, in
 * any project commercial or otherwise.
 *
 * This file contains a board class for generating and rendering a sudoku board
 * within a container div.
 *
 */


$(document).ready(function() {
	// ID of the container for the Sudoku board
	initBoard('Container');
	makeBoard();
});

//
// Utility functions
//

// Shuffle an array
function shuffle(o) {
	for (var i = 0; i < o.length; ++i) {
		var x = parseInt(Math.random() * o.length);
		var y = parseInt(Math.random() * o.length);
		if (x == y)
			continue;
		var tmp = o[x];
		o[x] = o[y];
		o[y] = tmp;
	}
	return o;
}

//------------------------------------------------------------------------------

var board = null;

function Group() {
	this.values = [10];

	for (var i = 1; i != 10; ++i)
		this.values[i] = 0;
	
	this.addValue = function(i) { ++this.values[i]; }
	this.delValue = function(i) { --this.values[i]; }
	
	this.valid = function() {
		for (var i = 1; i != 10; ++i)
			if (this.values[i] > 1)
				return false;
		return true;
	}
	
	this.complete = function() {
		for (var i = 1; i != 10; ++i)
			if (this.values[i] != 1)
				return false;
		return true;
	}
} // class Group

function Space() {
	this.value_ = 0;
	this.fixed_ = false;

	this.toChar = function() { return this.value_ == 0 ? '' : this.value_.toString(); }
	this.row = null;
	this.col = null;

	this.setValue = function(i) {
		if (i < 0 || i > 9)
			alert(i);

		if (this.value_ != 0) {
			this.row.delValue(this.value_);
			this.col.delValue(this.value_);
			this.grp.delValue(this.value_);
		}
			
		this.value_ = i;

		if (this.value_ != 0) {
			this.row.addValue(this.value_);
			this.col.addValue(this.value_);
			this.grp.addValue(this.value_);
		}
	}

	this.getValue = function() {
		return this.value_;
	}

	this.valid = function() {
		return this.row.valid() && this.col.valid() && this.grp.valid();
	}

	this.fixed = function() { return this.fixed_ }
	this.fix = function() { this.fixed_ = true; }
	this.clear = function() { this.setValue(0); this.fixed_ = false; }

} // class Space

function Board() {
	this.cols = [9];
	this.rows = [9];
	this.grps = [9];

	for (var i = 0; i < 9; ++i) {
		this.cols[i]   = new Group();
		this.rows[i]   = new Group();
		this.grps[i]   = new Group();
	}

	this.spaces = [9];

	for (var y = 0; y < 9; ++y) {
		this.spaces[y] = [9];
		for (var x = 0; x < 9; ++x) {
			this.spaces[y][x] = new Space();
			this.spaces[y][x].row = this.rows[y];
			this.spaces[y][x].col = this.cols[x];
			this.spaces[y][x].grp = this.grps[(parseInt(x / 3) + parseInt(y / 3) * 3)];
		}
	}

	this.setValue = function(x, y, value) {
		if (this.spaces[y][x].fixed())
			return false;
		this.spaces[y][x].setValue(value);
	}

	this.getValue = function(x, y, value) {
		return spaces[x][y].getValue();
	}

	this.toChar = function(x, y) {
		return this.spaces[y][x].toChar();
	}

	// Reset the board to it's beginning state
	this.reset = function() {
		for (var y = 0; y < 9; ++y)
			for (var x = 0; x < 9; ++x)
				if (!(this.spaces[y][x].fixed()))
					this.spaces[y][x].clear();
	}

	this.fix = function() {
		for (var y = 0; y < 9; ++y)
			for (var x = 0; x < 9; ++x)
				if (this.spaces[y][x].getValue() != 0)
					this.spaces[y][x].fix();
	}

	// Render the board 
	this.render = function() { 
		var board = this;
		$("#Container a").each(function(i, a) {
			a = $(a);
			x = a.data("x");
			y = a.data("y");

			a.text(board.toChar(x, y));

			if (board.spaces[y][x].valid()) {
				a.addClass("Valid").removeClass("Invalid");
			} else {
				a.addClass("Invalid").removeClass("Valid");
			}

			if (board.spaces[y][x].fixed())
				a.addClass("Fixed");
			else
				a.removeClass("Fixed");
		});
	}

	this.valid = function() {
		for (var i = 0; i < 9; ++i)
			if (!(this.rows[i].valid() && this.cols[i].valid() && this.grps[i].valid()))
				return false;
		return true;
	}

	this.complete = function() {
		for (var i = 0; i < 9; ++i)
			if (!(this.rows[i].complete() && this.cols[i].complete() && this.grps[i].complete()))
				return false;
		return true;
	}

	this.getSpaces_ = function() {
		var s = [];
		for (var y = 0; y < 9; ++y)
			for (var x = 0; x < 9; ++x)
				s.push(this.spaces[y][x]);
		return s;		
	}

	// Recursive component of solve()
	this.solve_ = function(s, idx, unique) {
		if (idx >= s.length) {
			if (board.valid()) {
				++this.numSolutions_;
				return true;
			}
			return false;
		}

		if (s[idx].getValue() != 0)
			return this.solve_(s, idx + 1, unique);

		var initValue = s[idx].getValue()

		for (var i = 1; i < 10; ++i) {
			s[idx].setValue(i);
			if (s[idx].valid() && this.solve_(s, idx + 1, unique)) { 
				if (!unique || this.numSolutions_ >= 2) {
					if (unique)
						s[idx].setValue(initValue);
					return true;
				}
			}
		}

		s[idx].setValue(initValue);
		return false;
	}

	this.solve = function() {
		this.numSolutions_ = 0;
		return this.solve_(this.getSpaces_(), 0, false);
	}

	this.isUnique = function() {
		this.numSolutions_ = 0;
		this.solve_(this.getSpaces_(), 0, true);
		return this.numSolutions_ == 1;
	}

	this.makeBoard_ = function(s, idx) {
		if (idx >= s.length)
			return board.valid();

		var values = shuffle([1,2,3,4,5,6,7,8,9]);
		for (var i = 0; i < 9; ++i) {
			s[idx].setValue(values[i]);
			if (s[idx].valid()) {
				if (this.makeBoard_(s, idx + 1))
					return true;
			}
		}
		s[idx].setValue(0);
		return false;
	}

	this.makeBoard = function() {
		this.clear();
		// First, generate a randomized completed board
		var s = this.getSpaces_();
	
		this.makeBoard_(s, 0);

		shuffle(s);
		for (var i = 0, n = 0; n < 40 && i < s.length; ++i) {
			var v = s[i].getValue();
			s[i].setValue(0);
			if (this.isUnique())
				++n;
			else
				s[i].setValue(v);
		}

		// "fix" all the non-blanked spaces
		for (var i = 0; i < s.length; ++i) {
			if(s[i].getValue() != 0)
				s[i].fix();
		}	
	}

	this.clear = function() {
		for (var y = 0; y < 9; ++y)
			for (var x = 0; x < 9; ++x)
				this.spaces[y][x].clear()
	}

} // class board



function initBoard(containerId) {
	board = new Board();

	// Generate the HTML markup the board will use
	var table = $("<table></table>");

	for (var y = 0; y < 9; ++y) {
		var tr = $("<tr></tr>");
		for (var x = 0; x < 9; ++x) {
			var a = $("<a></a>");

			xp = Math.ceil((x + 1) / 3.0);
			yp = Math.ceil((y + 1) / 3.0);

			if (xp == yp || xp == 1 && yp == 3 || xp == 3 && yp == 1)
				a.addClass("Alt");

			a.data("x", x)
				.data("y", y)
				.attr("id", "Cell" + x + y)
				.click(function() {
					$(".Sel").removeClass("Sel");
					$(this).addClass("Sel");
				});
			tr.append($("<td></td>").append(a));
		}
		table.append(tr);
	}

	$("#" + containerId).append(table);

	board.render();
}

function setSel(x, y) {
	// Wrap around off the edges of the board
	if (x > 8) x = 0;
	if (x < 0) x = 8;
	if (y > 8) y = 0;
	if (y < 0) y = 8;

	$(".Sel").removeClass("Sel");
	$("#Cell" + x + y).addClass("Sel");
}

// Handle key presses, returning false (to cancel the key press) if we handled
// it, or true if the browser should handle the key
$(document).keypress(function(e) {

	var keynum;
	var keychar;
	var numcheck;

	var e = window.event || e
	keynum = e.keyCode == 0 ? e.which : e.keyCode;

	x = $(".Sel").data("x");
	y = $(".Sel").data("y");

	switch(keynum) {
	case 37:
		// left arrow
		setSel(x - 1, y); return false;
	case 38:
		// up arrow
		setSel(x, y - 1); return false;
	case 39:
		// right arrow
		setSel(x + 1, y); return false;
	case 40:
		// down arrow
		setSel(x, y + 1); return false;
	case 46:
	case 32:
	case 8:
		// backspace/delete/space
		board.setValue(x, y, 0);
		board.render();
		return false;
	default:
		keychar = String.fromCharCode(keynum);
		if ((/\d/).test(keychar)) {
			var i = parseInt(keychar);
			if (i >= 0 && i <= 9) {
				board.setValue(x, y, parseInt(keychar));
				board.render();
				return false;
			}
		}
	}

	board.render();
	return true;
});

function makeBoard() {
	setSel(0,0);
	board.makeBoard();
	board.render();
}

function clearBoard() {
	setSel(0,0);
	board.clear();
	board.render();
}

function resetBoard() {
	board.reset();
	board.render();
}

function solveBoard() {
	$(".Sel").removeClass("Sel");
	if (!board.solve())
		alert("This board has no solutions.  Try hitting \"Reset\" to remove your moves.");
	board.render();
}

