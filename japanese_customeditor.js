var japaneseCustomEditor = (() => {
	// エディタとしてdivを作成
	var editor = document.createElement('div');
	editor.setAttribute('id', 'editor');
	editor.setAttribute('contenteditable', true);
	editor.style.position = 'absolute';
	editor.style.outline = 'none';
	editor.style.display = 'none';
	editor.style.alignContent = 'center';

	var jce = {};

	// カスタムエディタを定義
	jce.editor = {
		closeEditor : function(cell, save) {
			let value = save ? editor.innerText : cell.innerText;
			cell.style.color = '';
			cell.style.caretColor = 'transparent';
			editor.innerText = '';
			editor.style.caretColor = 'transparent';
			return value;
		},
		openEditor : function(cell, el, empty, e) {
			if (cell == editor) {
				// touchイベントではeditorが渡されるのでcellに変換する
				let x = editor.getAttribute('data-x');
				let y = editor.getAttribute('data-y');
				cell = jexcel.current.getCellFromCoords(x, y);
			}
			cell.classList.add('editor');
			// カスタムエディタではcellに何らかの子要素を追加する必要があるのでとりあえずdivを追加
			let div = document.createElement('div');
			cell.appendChild(div);
			cell.style.color = 'transparent';
			editor.innerText = empty == true ? '' : cell.innerText;
			if (editor.innerText.length > 0) {
				if (event !== undefined) {
					// タッチ操作以外で何か入力されている場合はその末尾にキャレットを表示する
					event.preventDefault();
					let selection = document.getSelection();
					selection?.setPosition(editor.childNodes[0], editor.innerText.length);
				}
			} else {
				// 空のセルの場合、vertical-align:centerを実現するためにdivを追加する
				editor.style.display = 'flex';
				const style = "width:100%;outline:none;caret-color:black;margin:auto;";
				editor.innerHTML = `<div style="${style}">_</div>`;
				let height = editor.children[0].clientHeight;
				editor.innerHTML = `<div contenteditable="true" style="${style}height:${height}px;"></div>`;
				editor.children[0].focus();
			}
			if (event == undefined) {
				// タッチ操作の場合、選択を解除
				document.getSelection().collapse(editor);
			}
			editor.style.caretColor = 'black';
			editor.focus();
		},
		getValue : function(cell) {
			return cell.innerText;
		},
		updateCell : function(div, value, force) {
			div.innerText = value;
			return value;
		}
	};

	editor.addEventListener('keydown', (e) => {
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		if (x == undefined || y == undefined) return;
		if (e.which == 27) {
			// Escape
		} else if (e.which == 13) {
			// Enter
			if (jexcel.current.edition) {
				editor.blur();
			}
			e.preventDefault();
		} else if (e.which == 9) {
			// Tab
			if (jexcel.current.edition) {
				editor.blur();
			}
		}

		// Which key
		if (e.which == 13 || e.which == 9) {
			// Move cursor, Tab
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
			jexcel.current.updateSelectionFromCoords(x, y, x, y);
			return;
		} else if (e.which == 8) {
			// Backspace
			if (!jexcel.current.edition) {
				jexcel.current.setValue(jexcel.current.highlighted, '');
				e.stopImmediatePropagation();
			}
		} else {
			if ((e.ctrlKey || e.metaKey) && ! e.shiftKey) {
				if (e.which == 67 || e.which == 88) {
					// Ctrl + C, Ctrl + X
				} else if (e.which == 86) {
					// Ctrl + V
				}
			} else {
				if (e.keyCode == 113) {
					// F2
					if (!jexcel.current.edition) {
						jexcel.current.openEditor(jexcel.current.records[y][x], false);
					}
				} else if (e.keyCode == 32) {
					// space
					if (!jexcel.current.edition) {
						jexcel.current.openEditor(jexcel.current.records[y][x], false);
						// 既定ではspace押下で編集モードになるだけでspaceが入力されないためプログラムで設定する
						editor.innerText = ' ';
					}
				} else if ((e.keyCode == 8) ||
						(e.keyCode >= 48 && e.keyCode <= 57) ||
						(e.keyCode >= 96 && e.keyCode <= 111) ||
						(e.keyCode >= 186) ||
						((String.fromCharCode(e.keyCode) == e.key || String.fromCharCode(e.keyCode).toLowerCase() == e.key.toLowerCase()) && jexcel.validLetter(String.fromCharCode(e.keyCode)))) {
					if (!jexcel.current.edition) {
						jexcel.current.openEditor(jexcel.current.records[y][x], true);
					}
				}
			}
		}
	});

	editor.addEventListener('dblclick', (e) => {
		if (jexcel.current.edition) return;
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		jexcel.current.openEditor(jexcel.current.records[y][x], false);
	});
	editor.addEventListener('blur', (e) => {
		if (!jexcel.current || !jexcel.current.edition) return;
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		let cell = jexcel.current.getCellFromCoords(x, y);
		jexcel.current.closeEditor(cell, true);
	});
	function editorTouchEnd(e) {
		if (jexcel.tmpElement == editor) {
			// editorをタッチした場合はtmpElementをcellに変更する必要がある
			let x = editor.getAttribute('data-x');
			let y = editor.getAttribute('data-y');
			let cell = jexcel.current.getCellFromCoords(x, y);
			jexcel.tmpElement = cell;
		}
	}
	editor.addEventListener('touchend', editorTouchEnd);
	editor.addEventListener('touchcancel', editorTouchEnd);

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
			jexcel.current.updateSelectionFromCoords(x, y, x, y);
		}
		updateEditorSize(x, y);
	}

	function updateEditorSize(x, y) {
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		let contentRect = jexcel.current.content.getBoundingClientRect();
		let cell = jexcel.current.getCellFromCoords(x, y)
		let info = cell.getBoundingClientRect();
		editor.style.minWidth = (info.width) + 'px';
		editor.style.minHeight = (info.height) + 'px';
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft;
		editor.style.top = (info.top - cornerCell.top + scrollTop) + 'px';
		if (cornerCell.left >= 0) {
			editor.style.left = (info.left - cornerCell.left) + 'px';
		} else {
			editor.style.left = (info.left + scrollLeft - contentRect.left) + 'px';
		}
		editor.focus();
	}

	jce.setup = function() {
		if (typeof jexcel === 'undefined') jexcel = jspreadsheet;
		// 既定のイベントをカスタマイズ
		// セルを編集時は既存のcontextmenuイベントを発生させない
		document.removeEventListener("contextmenu", jexcel.contextMenuControls);
		document.addEventListener("contextmenu", (e) => {
			if (jexcel.current) {
				if (!jexcel.current.edition) {
					// 編集中でない場合のみ実行
					jexcel.contextMenuControls(e);
				}
			}
		});
		// 空白セルを含むコピー＆ペーストにバグがあるので対策する
		var defaultParseCSV = jexcel.current.parseCSV;
		jexcel.current.parseCSV = function(str, delimiter) {
			if (str.length === 0 || str.charCodeAt(str.length-1) == 10) {
				str += "\n\n";
			} else {
				// Remove last line break
				str = str.replace(/\r?\n$|\r$|\n$/g, "");
				// Last caracter is the delimiter
				if (str.charCodeAt(str.length-1) == 9) {
					str += "\n\n";
				}
			}
			return defaultParseCSV(str, delimiter);
		}

		var defaultSelect = jexcel.current.textarea.select;
		jexcel.current.textarea.select = function() {
			if (this.value.length == 0) {
				// コピーしたセルが空の場合、空文字をクリップボードにコピーする
				let copyText = document.createElement('input');
				copyText.value = '';
				copyText.select();
				copyText.setSelectionRange(0, 99999); // For mobile devices
				navigator.clipboard.writeText(copyText.value);
			}
			defaultSelect.call(this);
		}
		var defaultCopy = jexcel.current.copy;
		jexcel.current.copy = function(highlighted, delimiter, returnData, includeHeaders, download) {
			const activeElement = document.activeElement;
			defaultCopy(highlighted, delimiter, returnData, includeHeaders, download);
			if (activeElement && activeElement.focus) {
				activeElement.focus();
			}
		}
		
		var defaultUpdateCornerPosition = jexcel.current.updateCornerPosition;
		jexcel.current.updateCornerPosition = function() {
			defaultUpdateCornerPosition();
			// Resizing is ongoing
			if (jexcel.current.resizing) {
				let x = editor.getAttribute('data-x');
				let y = editor.getAttribute('data-y');
				if (x && y) {
					updateEditorSize(x, y);
				}
			} else {
				updateEditorPosition();
			}
		}
		var defaultResetSelection = jexcel.current.resetSelection;
		jexcel.current.resetSelection = function(blur) {
			defaultResetSelection(blur);
			editor.style.display = 'none';
		}

		jexcel.current.options['onselection'] = function(e,x,y,x2,y2) {
			// 以前に選択していたセルの後処理
			if (e.jexcel.edition) {
				let currentx = editor.getAttribute('data-x');
				let currenty = editor.getAttribute('data-y');
				let cell = e.jexcel.getCellFromCoords(currentx, currenty);
				e.jexcel.closeEditor(cell, true);
			}
			let cell = e.jexcel.getCellFromCoords(x, y);
			if (!e.jexcel.options.columns[x].editor || cell.classList.contains('readonly') == true) {
				// カスタムエディタのセルではなければeditorは表示しない
				editor.style.display = 'none';
				return;
			}
			updateEditorSize(x, y);
			editor.style.display = 'block';
			editor.innerHTML = '';
			editor.style.background = '#CCC6';
			editor.style.color = '#444'
			editor.style.textAlign = 'center';
			editor.setAttribute('data-x', x);
			editor.setAttribute('data-y', y);
			editor.style.caretColor = 'transparent';
			document.getSelection().collapse(editor);
			setTimeout(() => {
				editor.focus();
			}, 1);
		};

		// エディタをspreadsheetの一部として追加
		jexcel.current.content.appendChild(editor);
	}
	return jce;
})();
