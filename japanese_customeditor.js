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
			editing = false;
			return value;
		},
		openEditor : function(cell, el, empty, e) {
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
			editor.style.caretColor = 'black';
			editing = true;
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

	// 状態を制御するため変数を定義
	var oldcell;
	var editing = false;
	var cornerLeft;

	editor.addEventListener('keydown', (e) => {
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		if (x == undefined || y == undefined) return;
		let cell = jexcel.current.getCellFromCoords(x, y)
		if (e.which == 27) {
			// Escape
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
					if (!editing) {
						jexcel.current.openEditor(jexcel.current.records[y][x], false);
					}
				} else if (e.keyCode == 32) {
					// space
					if (!editing) {
						jexcel.current.openEditor(jexcel.current.records[y][x], false);
						// 既定ではspace押下で編集モードになるだけでspaceが入力されないためプログラムで設定する
						editor.innerText = ' ';
					}
				} else if ((e.keyCode == 8) ||
						(e.keyCode >= 48 && e.keyCode <= 57) ||
						(e.keyCode >= 96 && e.keyCode <= 111) ||
						(e.keyCode >= 186) ||
						((String.fromCharCode(e.keyCode) == e.key || String.fromCharCode(e.keyCode).toLowerCase() == e.key.toLowerCase()) && jexcel.validLetter(String.fromCharCode(e.keyCode)))) {
					if (!editing) {
						jexcel.current.openEditor(jexcel.current.records[y][x], true);
					}
				}
			}
		}
	});

	editor.addEventListener('dblclick', (e) => {
		if (editing) return;
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		jexcel.current.openEditor(jexcel.current.records[y][x], false);
	});
	editor.addEventListener('blur', (e) => {
		if (!editing) return;
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		let cell = jexcel.current.getCellFromCoords(x, y)
		jexcel.current.closeEditor(cell, true);
	});
	editor.addEventListener('touchstart', (e) => {
		if (jexcel.current) {
			if (! jexcel.current.edition) {
				let x = editor.getAttribute('data-x');
				let y = editor.getAttribute('data-y');
				let cell = jexcel.current.getCellFromCoords(x, y)

				if (x && y) {
					if (typeof e.cancelable !== "boolean" || e.cancelable) {
						e.preventDefault();
					}
					jexcel.current.updateSelectionFromCoords(x, y);
					jexcel.timeControl_jce = setTimeout(function() {
						jexcel.current.openEditor(cell, false, e);
					}, 500);
				}
			}
		}
	});
	editor.addEventListener('touchend', (e) => {
		if (jexcel.timeControl_jce) {
			clearTimeout(jexcel.timeControl_jce);
			jexcel.timeControl_jce = null;
		}
	});
	editor.addEventListener('touchcancel', (e) => {
		if (jexcel.timeControl_jce) {
			clearTimeout(jexcel.timeControl_jce);
			jexcel.timeControl_jce = null;
		}
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
		editor.style.top = (info.top - cornerCell.top + scrollTop) + 'px';
		if (cornerCell.left >= 0) {
			editor.style.left = (info.left - cornerCell.left) + 'px';
		} else {
			editor.style.left = (info.left + scrollLeft - cornerLeft) + 'px';
		}
		editor.focus();
	}

	jce.setup = function() {
		if (typeof jexcel === 'undefined') jexcel = jspreadsheet;
		// 既定のtouchイベントを非カスタムエディタ用にする
		document.removeEventListener("touchstart", jexcel.touchStartControls);
		document.addEventListener("touchstart", (e) => {
			if (jexcel.current && !jexcel.current.edition) {
				if (jexcel.current.options && jexcel.current.options.columns) {
					var column = jexcel.current.options.columns[e.target.getAttribute('data-x')];
					if (column && !column.editor) {
						// カスタムエディタのセルでない場合のみ実行
						jexcel.touchStartControls(e);
					}
				}
			}
		});
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
		var defaultparseCSV = jexcel.current.parseCSV;
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
			return defaultparseCSV(str, delimiter);
		}

		var defaultselect = jexcel.current.textarea.select;
		jexcel.current.textarea.select = function() {
			if (this.value.length == 0) {
				// コピーしたセルが空の場合、空文字をクリップボードにコピーする
				let copyText = document.createElement('input');
				copyText.value = '';
				copyText.select();
				copyText.setSelectionRange(0, 99999); // For mobile devices
				navigator.clipboard.writeText(copyText.value);
			}
			defaultselect.call(this);
		}
	
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
			if (x == undefined || y == undefined) return;
			updateEditorSize(x, y);
		});
		// spreadsheetのサイズ変更時にeditorの位置を補正
		jexcel.current.content.addEventListener("resize", (e) => updateEditorPosition());
	}
	return jce;
})();
