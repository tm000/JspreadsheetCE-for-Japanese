var japaneseCustomEditor = (() => {
	// エディタとしてdivを作成
	var editor = document.createElement('div');
	editor.setAttribute('id', 'editor');
	editor.setAttribute('contenteditable', true);
	editor.style.position = 'absolute';
	editor.style.outline = 'none';
	editor.style.display = 'none';

	var jce = {};
	var isEmpty = false;
	var lastSelectedCell = [];

	// オプションの既定値
	var options = {
		activeCellBackColor: '#CCC6',
		editFontColor: '#444',
		editorTextAlign: 'center',	// start, center, end
		editorVerticalAlign: 'center',	// start, center, end
		pressSpaceToEdit: false,
		hideSelection: true
	};

	// オプション設定関数
	jce.options = function(newval) {
		options = {...options, ...newval};
		return this;
	}

	// カスタムエディタを定義
	jce.editor = {
		closeEditor : function(cell, save) {
			// openEditorで空のセルの場合divを追加しているので余計な改行が付くことがあるので削除する
			if (editor.innerHTML.includes('<br>')) {
				const indexOfBr = editor.innerHTML.indexOf('<br>');
				editor.innerHTML = editor.innerHTML.substring(0, indexOfBr).replace(' ', '&nbsp;');
			}
			let value = save ? editor.innerText : cell.innerText;
			cell.style.color = '';
			cell.style.caretColor = 'transparent';
			editor.innerText = '';
			editor.style.caretColor = 'transparent';
			return value;
		},
		openEditor : function(cell, text, x, y, obj, column) {
			if (cell == editor) {
				// touchイベントではeditorが渡されるのでcellに変換する
				let x = editor.getAttribute('data-x');
				let y = editor.getAttribute('data-y');
				cell = jexcel.current.getCellFromCoords(x, y);
			}
			cell.classList.add('editor');
			let div = document.createElement('div');
			// カスタムエディタではcellに何らかの子要素を追加する必要があるのでとりあえずdivを追加
			cell.appendChild(div);
			cell.style.color = 'transparent';
			if (!isEmpty) {
				editor.innerText = text;
				editor.innerHTML = editor.innerHTML.replaceAll(' ', '&nbsp;');
				if (editor.innerText.length > 0) {
					if (event !== undefined) {
						// タッチ操作以外で何か入力されている場合はその末尾にキャレットを表示する
						event.preventDefault();
						let selection = document.getSelection();
						selection?.setPosition(editor.childNodes[0], editor.innerText.length);
					}
				} else {
					// 空のセルの場合、vertical-align:centerを実現するためにdivを追加する
					const style = `width:1px;outline:none;caret-color:black;${({
										'start': 'margin-right:auto',
										'center': 'margin-right:auto;margin-left:auto',
										'end': 'margin-left:auto',
									})[options.editorTextAlign]};${({
										'start': 'margin-bottom:auto',
										'center': 'margin-top:auto;margin-bottom:auto',
										'end': 'margin-top:auto',
									})[options.editorVerticalAlign]};`;
					editor.innerHTML = `<div style="${style}">_</div>`;
					let height = editor.children[0].clientHeight;
					editor.innerHTML = `<div contenteditable="true" style="${style}height:${height}px;"></div>`;
				}
			} else {
				isEmpty = false;
			}
			if (event == undefined) {
				// タッチ操作の場合、選択を解除
				document.getSelection().collapse(editor);
			}
			editor.style.caretColor = 'black';
			editor.style.textAlign = options.editorTextAlign;
			editor.style.alignContent = options.editorVerticalAlign;
			editor.focus();
		},
		getValue : function(cell) {
			return cell.innerText;
		},
		updateCell : function(div, value, force) {
			div.innerText = value;
			div.innerHTML = div.innerHTML.replaceAll(' ', '&nbsp;');
			return value;
		}
	};

	editor.addEventListener('keydown', (e) => {
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		if (x == undefined || y == undefined) return;
		if (e.which == 27) {
			// Escape
		} else if (e.which == 13 || e.which == 9) {
			// Enter
			if (jexcel.current.edition) {
				editor.blur();
			} else if (editor.innerText != '') {
				jexcel.current.setValue(jexcel.current.highlighted, editor.innerText);
			}
			e.preventDefault();
		}

		// Which key
		if (e.which == 13 || e.which == 9) {
			// Move cursor, Tab
			jexcel.current.updateSelectionFromCoords(x, y, x, y);
		} if (e.which == 33 || e.which == 34) {
			// PageUp, PageDown
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
			} else if (editor.innerText == '' || editor.innerText == '\n') {
				e.preventDefault();
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
						jexcel.current.openEditor(jexcel.current.records[y][x].element, false);
					}
				} else if (e.keyCode == 32) {
					// space
					if (!jexcel.current.edition) {
						// 既定ではspace押下で編集モードになるだけでspaceが入力されないためプログラムで設定する
						jexcel.current.openEditor(jexcel.current.records[y][x].element, false);
						if (options.pressSpaceToEdit) {
							const style = `width:1px;outline:none;caret-color:black;${({
												'start': 'margin-right:auto',
												'center': 'margin-right:auto;margin-left:auto',
												'end': 'margin-left:auto',
											})[options.editorTextAlign]};${({
												'start': 'margin-bottom:auto',
												'center': 'margin-top:auto;margin-bottom:auto',
												'end': 'margin-top:auto',
											})[options.editorVerticalAlign]};`;
							editor.innerHTML = `<div style="${style}">_</div>`;
							let height = editor.children[0].clientHeight;
							editor.innerHTML = `<div contenteditable="true" style="${style}height:${height}px;"></div>`;
						} else {
							editor.innerHTML = '&nbsp;';
							let selection = document.getSelection();
							selection?.setPosition(editor.childNodes[0], 1);
						}
						e.preventDefault();
					} else if (editor.innerHTML.includes('<div ')) {
						// 空のセルのvertical-align:centerを実現するために追加したdivを削除する
						const indexOfBr = editor.innerHTML.indexOf('<div ');
						editor.innerHTML = editor.innerHTML.substring(0, indexOfBr).replace(' ', '&nbsp;');
					}
				} else if ((e.keyCode == 8) ||
						(e.keyCode >= 48 && e.keyCode <= 57) ||
						(e.keyCode >= 96 && e.keyCode <= 111) ||
						(e.keyCode >= 186) ||
						((String.fromCharCode(e.keyCode) == e.key || String.fromCharCode(e.keyCode).toLowerCase() == e.key.toLowerCase()))) {
					if (!jexcel.current.edition) {
						isEmpty = true;
						jexcel.current.openEditor(jexcel.current.records[y][x].element, true);
					}
					if (editor.innerHTML.includes('<div ')) {
						// 空のセルのvertical-align:centerを実現するために追加したdivを削除する
						const indexOfBr = editor.innerHTML.indexOf('<div ');
						editor.innerHTML = editor.innerHTML.substring(0, indexOfBr).replace(' ', '&nbsp;');
					}
				}
			}
		}
	});

	editor.addEventListener('dblclick', (e) => {
		if (jexcel.current.edition) return;
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		jexcel.current.openEditor(jexcel.current.records[y][x].element, false);
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
		let x = editor.getAttribute('data-x');
		let y = editor.getAttribute('data-y');
		if (!x || !y) return;
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		let contentRect = jexcel.current.content.getBoundingClientRect();
		let cell = jexcel.current.getCellFromCoords(x, y)
		let info = cell.getBoundingClientRect();
		editor.style.minWidth = (info.width) + 'px';
		editor.style.minHeight = (info.height) + 'px';
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft;
		editor.style.top = (info.top - contentRect.top + scrollTop) + 'px';
		if (cornerCell.left >= 0) {
			editor.style.left = (info.left - cornerCell.left + 1) + 'px';
		} else {
			editor.style.left = (info.left + scrollLeft - contentRect.left) + 'px';
		}
		editor.focus();
	}

	function setup() {
		if (typeof jexcel === 'undefined') jexcel = jspreadsheet;

		// 行・列のリサイズ時にエディタの位置を更新
		let onResizing = function(e) {
			if (jexcel.current && jexcel.current.resizing) {
				updateEditorPosition();
			}
		}
		document.addEventListener("mousemove", onResizing);
		document.addEventListener("touchmove", onResizing);

		jexcel.current.setConfig({
			onselection: function(o,x,y,x2,y2,e) {
				// 以前に選択していたセルの後処理
				if (jexcel.current.edition) {
					let currentx = editor.getAttribute('data-x');
					let currenty = editor.getAttribute('data-y');
					let cell = jexcel.current.getCellFromCoords(currentx, currenty);
					jexcel.current.closeEditor(cell, true);
				}
				let cell = jexcel.current.getCellFromCoords(x, y);
				if (!jexcel.current.options.columns[x].type || "object" != typeof jexcel.current.options.columns[x].type
					|| jexcel.current.isReadOnly(x, y)) {
					// カスタムエディタのセルではなければeditorは表示しない
					editor.style.display = 'none';
					return;
				}
				editor.setAttribute('data-x', x);
				editor.setAttribute('data-y', y);
				updateEditorPosition();
				editor.style.display = 'block';
				editor.innerHTML = '';
				editor.style.background = options.activeCellBackColor;
				editor.style.color = options.editFontColor;
				editor.style.caretColor = 'transparent';
				document.getSelection().collapse(editor);
				setTimeout(() => {
					editor.focus();
				}, 1);
			}
		}, true);

		// エディタをspreadsheetの一部として追加
		jexcel.current.content.appendChild(editor);
	}

	jce.plugin = (function() {
		let plugin = {};

		plugin.init = function(worksheet) {
			worksheet.content.addEventListener("scroll", (e) => {
				updateEditorPosition();
			});
		}

		plugin.onevent = function(event, a, b, c, d) {
			let x ,y;
			switch (event) {
				case 'onbeforeselection':
					if (!editor.parentNode.parentNode.classList.contains('jtabs-selected')) {
						// editorをアクティブシートに移動
						a.content.appendChild(editor);
					}
					return true;
				case 'onselection':
					if (!options.hideSelection) {
						lastSelectedCell = jexcel.current.selectedCell;
					}
					break;
				case 'onfocus':
					if (!options.hideSelection && lastSelectedCell) {
						for (let c = lastSelectedCell[0]; c <= lastSelectedCell[2]; c++)
							for (let r = lastSelectedCell[1]; r <= lastSelectedCell[3]; r++)
							jexcel.current.highlighted.push(jexcel.current.records[r][c]);
						lastSelectedCell = undefined;
						let x1 = jexcel.current.selectedCell[0];
						let y1 = jexcel.current.selectedCell[1];
						let x2 = jexcel.current.selectedCell[2];
						let y2 = jexcel.current.selectedCell[3];
						jexcel.current.resetSelection();
						jexcel.current.updateSelectionFromCoords(x1, y1, x2, y2);
					}
					break;
				case 'onblur':
					if (options.hideSelection) {
						editor.style.display = 'none';
					} else {
						jexcel.current.updateSelectionFromCoords(lastSelectedCell[0], lastSelectedCell[1], lastSelectedCell[2], lastSelectedCell[3]);
					}
					break;
				case 'oncopy':
					// htmlのescape文字を通常の文字に変換する
					let div = document.createElement('div');
					c = c.split(/\r\n|\r|\n/).map(c => {
						div.innerHTML = c;
						return div.innerText;
					}).join('\n');
					// コピーしたセルが空の場合、空文字をクリップボードにコピーする
					if (c.length === 0 || c.charCodeAt(c.length-1) == 10) {
						c += "\n\n";
					}
					return c;
				case 'onbeforepaste':
					// 空白セルを含むコピー＆ペーストにバグがあるので対策する
					if (b.length == 0) {
						return [['']];
					} else {
						for (let i = 0; i < b.length; i++) {
							for (let j = 0; j < b[i].length; j++) {
								b[i][j] = b[i][j].value;
							}
						}
						return b;
					}
				case 'onresizecolumn':
				case 'onresizerow':
					updateEditorPosition();
					 break;
				case 'onundo':
					x = parseInt(editor.getAttribute('data-x'));
					y = parseInt(editor.getAttribute('data-y'));
					if (jexcel.current.cols.length - 1 < x || jexcel.current.rows.length - 1 < y) {
						// redoにより選択していたセルがなくなった場合、有効なセルを再選択する
						if (jexcel.current.cols.length - 1 < x) {
							x = jexcel.current.cols.length - 1;
						}
						if (jexcel.current.rows.length - 1 < y) {
							y = jexcel.current.rows.length - 1;
						}
						jexcel.current.updateSelectionFromCoords(x, y, x, y);
					} else {
						x = parseInt(jexcel.current.selectedCell[0]);
						y = parseInt(jexcel.current.selectedCell[1]);
					}
					editor.setAttribute('data-x', x);
					editor.setAttribute('data-y', y);
					updateEditorPosition();
					break;
				case 'onredo':
					x = parseInt(jexcel.current.selectedCell[2]);
					y = parseInt(jexcel.current.selectedCell[3]);
					editor.setAttribute('data-x', x);
					editor.setAttribute('data-y', y);
					updateEditorPosition();
					break;
				case 'onload':
					// カスタムエディタのセットアップ
					setup();
					break;
			}
		}

		plugin.persistence = function(worksheet, method, args) {
		}

		plugin.contextMenu = function(instance, x, y, e, items) {
			return items;
		}

		plugin.toolbar = function(instance, items) {
			return items;
		}

		return plugin;
	});

	return jce;
})();
