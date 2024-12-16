// エディタとしてdivを作成
var editor = document.createElement('div');
editor.setAttribute('id', 'editor');
editor.setAttribute('contenteditable', true);
editor.style.position = 'absolute';
editor.style.outline = 'none';
editor.style.display = 'none';

// カスタムエディタを定義
var customColumn = {
	closeEditor : function(cell, save) {
		let value = save ? editor.innerText : cell.innerText;
		cell.style.color = '';
		cell.style.caretColor = 'transparent';
		editor.innerText = '';
		editor.display = 'none';
		editing = false;
		return value;
	},
	openEditor : function(cell) {
		cell.classList.add('editor');
		// カスタムエディタではcellに何らかの子要素を追加する必要があるのでとりあえずdivを追加
		let div = document.createElement('div');
		cell.appendChild(div);
		cell.style.caretColor = 'transparent';
		editor.focus();
	},
	getValue : function(cell) {
		return cell.innerText;
	},
	setValue : function(cell, value) {
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		// Update history
		let records = [];
		records.push({
			col:x,
			row:y,
			oldValue:cell.innerText,
			newValue:value,
			x:x,
			y:y
		});
		cell.innerHTML = value;
		jexcel.current.setHistory({
			action:'setValue',
			records:records,
			selection:jexcel.current.selectedCell,
		});
	},
	updateCell : function(div, value, force) {
		div.innerText = value;
		return value;
	}
};

// 状態を制御するため変数を定義
var oldcell;
var editing = false;
var copyingEmpty = false;
var cornerLeft;

editor.addEventListener('keydown', (e) => {
	let x = editor.getAttribute('data-x');
	let y = editor.getAttribute('data-y');
	if (x == undefined || y == undefined) return;
	let cell = jexcel.current.getCellFromCoords(x, y)
	if (e.which == 27) {
		// Escape
		if (editing) {
			editor.innerText = cell.innerText;
			editor.style.caretColor = 'transparent';
			editing = false;
			setTimeout(() => {
				editor.focus();
			}, 1);
		}
		e.preventDefault();
	} else if (e.which == 13) {
		// Enter
		if (editing) {
			editor.blur();
		}
		e.preventDefault();
	} else if (e.which == 9) {
		// Tab
		if (editing) {
			editor.blur();
		}
	}

	// Which key
	if (e.which == 13 || e.which == 9) {
		// Move cursor, Tab
		jexcel.current.selectedCell = [];
		jexcel.current.selectedCell[0] = x;
		jexcel.current.selectedCell[1] = y;
		jexcel.current.selectedCell[2] = x;
		jexcel.current.selectedCell[3] = y;
		jexcel.current.updateSelectionFromCoords(x, y, x, y);
	} if (e.which == 33 || e.which == 34) {
		// PageUp, Page Down
		// Jspreadsheet Container information
		var contentRect = jexcel.current.content.getBoundingClientRect();
		var h1 = contentRect.height;

		// Direction Left or Up
		var reference = jexcel.current.records[jexcel.current.selectedCell[3]][jexcel.current.selectedCell[2]];
		var referenceRect = reference.getBoundingClientRect();
		var h2 = referenceRect.height;
		if (e.which == 33) {
			// Up
			for (; h2 < (h1 - 30) && y > 0; y--) {
				h2 += jexcel.current.records[y][jexcel.current.selectedCell[2]].getBoundingClientRect().height;
			}
		} else {
			// Down  
			for (; h2 < (h1 - 30) && y < jexcel.current.rows.length; y++) {
				h2 += jexcel.current.records[y][jexcel.current.selectedCell[2]].getBoundingClientRect().height;
			}
		}
		jexcel.current.selectedCell = [];
		jexcel.current.selectedCell[0] = x;
		jexcel.current.selectedCell[1] = y;
		jexcel.current.selectedCell[2] = x;
		jexcel.current.selectedCell[3] = y;
		jexcel.current.updateSelectionFromCoords(x, y, x, y);
		return;
	} else if (e.which == 8) {
		// Backspace
		if (!editing) {
			jexcel.current.setValue(jexcel.current.highlighted, '');
			// 一時的にセルの選択を解除してjexcel.keyDownControlsイベントをスキップする
			jexcel.current.selectedCell = null;
			setTimeout(() => {
				jexcel.current.selectedCell = [];
				jexcel.current.selectedCell[0] = x;
				jexcel.current.selectedCell[1] = y;
				jexcel.current.selectedCell[2] = x;
				jexcel.current.selectedCell[3] = y;
				jexcel.current.updateSelectionFromCoords(x, y, x, y);
			}, 1);
			e.preventDefault();
		}
	} else {
		if ((e.ctrlKey || e.metaKey) && ! e.shiftKey) {
			if (e.which == 67 || e.which == 88) {
				// Ctrl + C, Ctrl + X
				if (!editing && cell.innerText == '') {
					copyingEmpty = true;
					let copyText = document.createElement('input');
					copyText.value = '';
					copyText.select();
					copyText.setSelectionRange(0, 99999); // For mobile devices
					navigator.clipboard.writeText(copyText.value);
					e.preventDefault();
					return;
				}
				copyingEmpty = false;
			} else if (e.which == 86) {
				// Ctrl + V
				if (!editing && copyingEmpty) {
					jexcel.current.updateCell(parseInt(x), parseInt(y), '', false);
					jexcel.current.closeEditor(cell, false);
					e.preventDefault();
					return;
				}
			}
		} else {
			if (e.keyCode == 113) {
				// F2
				if (!editing) {
					editing = true;
					editor.innerText = cell.innerText;
					editor.style.caretColor = 'black';
					if (editor.innerText.length > 0) {
						let selection = document.getSelection();
						let range = document.createRange();
						range.setStart(editor.childNodes[0], editor.innerText.length);
						range.setEnd(editor.childNodes[0], editor.innerText.length);
						selection.removeAllRanges();
						selection.addRange(range);
					}
					cell.style.color = 'transparent';
					jexcel.current.openEditor(jexcel.current.records[y][x], false);
				}
			} else if ((e.keyCode == 8) ||
					   (e.keyCode >= 48 && e.keyCode <= 57) ||
					   (e.keyCode >= 96 && e.keyCode <= 111) ||
					   (e.keyCode >= 186) ||
					   ((String.fromCharCode(e.keyCode) == e.key || String.fromCharCode(e.keyCode).toLowerCase() == e.key.toLowerCase()) && jexcel.validLetter(String.fromCharCode(e.keyCode)))) {
				editing = true;
				editor.style.caretColor = 'black';
				cell.style.color = 'transparent';
			}
		}
	}
});

editor.addEventListener('dblclick', (e) => {
	let x = editor.getAttribute('data-x');
	let y = editor.getAttribute('data-y');
	let cell = jexcel.current.getCellFromCoords(x, y)
	editing = true;
	editor.innerText = cell.innerText;
	editor.style.caretColor = 'black';
	cell.style.color = 'transparent';
	jexcel.current.openEditor(jexcel.current.records[y][x], false);
});
editor.addEventListener('blur', (e) => {
	if (!editing) return;
	let x = editor.getAttribute('data-x');
	let y = editor.getAttribute('data-y');
	let cell = jexcel.current.getCellFromCoords(x, y)
	jexcel.current.closeEditor(cell, true);
});

function updateEditorPosition() {
	if (!jexcel.current) return;
	let x = editor.getAttribute('data-x');
	let y = editor.getAttribute('data-y');
	if (x == undefined || y == undefined) return;
	x = parseInt(x);
	y = parseInt(y);
	if (jexcel.current.colgroup.length - 1 < x || jexcel.current.rows.length - 1 < y) {
		// redoにより選択していたセルがなくなった場合、有効なセルを再選択する
		if (jexcel.current.colgroup.length - 1 < x) {
			x = jexcel.current.colgroup.length - 1;
			editor.setAttribute('data-x', x);
		}
		if (jexcel.current.rows.length - 1 < y) {
			y = jexcel.current.rows.length - 1;
			editor.setAttribute('data-y', y);
		}
		jexcel.current.selectedCell = [];
		jexcel.current.selectedCell[0] = x;
		jexcel.current.selectedCell[1] = y;
		jexcel.current.selectedCell[2] = x;
		jexcel.current.selectedCell[3] = y;
		jexcel.current.updateSelectionFromCoords(x, y, x, y);
	}
	updateEditorSize(x, y);
}

function updateEditorSize(x, y) {
	let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
	let cell = jexcel.current.getCellFromCoords(x, y)
	let info = cell.getBoundingClientRect();
	editor.style.minWidth = (info.width) + 'px';
	editor.style.minHeight = (info.height) + 'px';
	const scrollTop = jexcel.current.content.scrollTop;
	const scrollLeft = jexcel.current.content.scrollLeft + (document.documentElement.scrollLeft || document.body.scrollLeft);
	editor.style.top = info.top - cornerCell.top + scrollTop;
	if (cornerCell.left >= 0) {
		editor.style.left = info.left - cornerCell.left;
	} else {
		editor.style.left = info.left + scrollLeft - cornerLeft;
	}
	editor.focus();
}

function setupCustomEditor() {
	jexcel.current.options['onselection'] = function(e,x,y,x2,y2) {
		if (oldcell) {
			// 以前に選択していたセルの後処理
			if (editing) {
				e.jexcel.closeEditor(oldcell, true);
				oldcell.style.color = '';
				oldcell.style.opacity = 1.0;
				editing = false;
			}
			if (oldcell.children[0]) oldcell.removeChild(oldcell.children[0]);
		}
		if (!e.jexcel.options.columns[x].editor) {
			// カスタムエディタのセルではなければeditorは表示しない
			editor.style.display = 'none';
			return;
		}
		let cell = e.jexcel.getCellFromCoords(x, y);
		updateEditorSize(x, y);
		editor.style.display = 'block';
		editor.innerHTML = '';
		editor.style.background = '#CCC6';
		editor.style.color = '#444'
		editor.style.textAlign = 'center';
		editor.setAttribute('data-x', x);
		editor.setAttribute('data-y', y);
		editor.style.caretColor = 'transparent';
		setTimeout(() => {
			editor.focus();
		}, 1);
		oldcell = cell;
	};
	jexcel.current.options['onevent'] = function(e) {
		// 一部しか表示されていないセルを選択した場合、editorの位置を補正する
		setTimeout(updateEditorPosition, 1);
	};

	// エディタをspreadsheetの一部として追加
	jexcel.current.content.appendChild(editor);
	// 列幅、行高さ変更時、editorの大きさを再設定する
	jexcel.current.content.addEventListener('mousemove', (e) => {
		if (jexcel.isMouseAction == true) {
	        // Resizing is ongoing
	        if (jexcel.current.resizing) {
				let x = editor.getAttribute('data-x');
				let y = editor.getAttribute('data-y');
				updateEditorSize(x, y);
			}
		}
	});
	// コーナーの位置を保持
	cornerLeft = jexcel.current.headerContainer.children[0].getBoundingClientRect().left + (document.documentElement.scrollLeft || document.body.scrollLeft);
	// スクロール時、editorの位置を再設定する
	jexcel.current.content.addEventListener('scroll', (e) => {
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		updateEditorSize(x, y);
	});
	// spreadsheetのサイズ変更時にeditorの位置を補正
	jexcel.current.content.addEventListener("resize", (e) => updateEditorPosition());
}
