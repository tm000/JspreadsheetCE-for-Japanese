# JspreadsheetCE-for-Japanese

Jspreadsheet CEはセルを編集中でないときに日本語を入力すると「あ」が「a」、「か」が「kあ」になってしまう。
Pro版であればこの問題は発生しないが、無料のJspreadsheet CEでカスタムエディタを使ってこの問題を解決する。

## 動作環境
* Windows 11 Pro 23H2
* Jspreadsheet CE v.4.3.0
* Google Chrome バージョン: 131.0.6778.86（Official Build） （64 ビット）
* Microsoft Edge 131.0.2903.86（64 ビット）
* Firefox 128.5.1esr（64 ビット）
* Mobile Safari 18.2.1

## 使い方
1. japanese_customeditor.jsを読み込む
```html
<script src="./japanese_customeditor.js"></script>
```

2. jspreadsheetのcolumnsの定義でeditorにjapaneseCustomEditor.editorを指定する。そのあとjapaneseCustomEditor.setupメソッドを呼び出す。
```javascript
jspreadsheet(document.getElementById('spreadsheet'), {
	data: data,
	columns: [
		{ type: 'text', title:'A', width:150, editor: japaneseCustomEditor.editor },
		{ type: 'text', title:'B', width:150, editor: japaneseCustomEditor.editor },
	],
...
}
// カスタムエディタのセットアップ
japaneseCustomEditor.setup();
```

3. オプション設定

	いくつかオプションの設定ができる。以下のようにjapaneseCustomEditor.optionsに値を指定する。
```javascript
	japaneseCustomEditor.options({
		activeCellBackColor: '#FF08',
		editFontColor: '#7008',
		editorTextAlign: 'center',
		editorVerticalAlign: 'center',
		pressSpaceToEdit: true,
		hideSelection: false
	}).setup();
```

| 項目   |      内容      | 設定値 |
|----------|-------------|------|
| activeCellBackColor | アクティブセルの背景色 | '#CCC6'（デフォルト） |
| editFontColor | セル編集時の文字色 | '#444'（デフォルト） |
| editorTextAlign | セル編集時のテキストの水平位置 | 'start'、'center'（デフォルト）、'end' |
| editorVerticalAlign | セル編集時のテキストの垂直位置 | 'start'、'center'（デフォルト）、'end' |
| pressSpaceToEdit | 標準セルのように半角スペース押下時に半角スペースの入力を行わず編集モードにするかどうか | true、false（デフォルト） |
| hideSelection | Jspreadsheetからフォーカスが外れた際にセルの選択を消すかどうか | true（デフォルト）、false |

## Jspreadsheetの既存バグと思われるもの
1. 空白セルを1つだけ選択した状態でコピーができない　（対策実施済）
2. 特定列のn行(n>1)を選択（例：A列の2～5行を選択）する場合で最終行が空白セルの場合、空白セルがコピーされない。空白セルが連続していた場合は空白セル2つ分がコピーされない。　（対策実施済）
3. 複数列を選択した状態で最右セルが空白の場合、コピー＆ペーストを行うと最終セルに□が貼り付けられる。　（対策実施済）
4. Mobile Safariでセルを長押ししてもコンテキストメニューが表示されない。（[JspreadsheetCE-touch-extension
Public](https://github.com/tm000/JspreadsheetCE-touch-extension)と合わせて使用することで解消）
5. セルを編集した後、キーボードの矢印キーで移動するとhistoryのカーソル位置が変化してしまい、REDOした際に実際に編集したセルとずれてしまう。　（未対策）
