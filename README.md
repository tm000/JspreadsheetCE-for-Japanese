# JspreadsheetCE-for-Japanese

Jspreadsheet CEはセルを編集中でないときに日本語を入力すると「あ」が「a」、「か」が「kあ」になってしまう。
Pro版であればこの問題は発生しないが、無料のJspreadsheet CEでカスタムエディタを使ってこの問題を解決する。

## 使い方
1. japanese_customeditor.jsを読み込む
```html
<script src="./japanese_customeditor.js"></script>
```

2. jspreadsheetのcolumnsの定義でeditorにcustomColumnを指定する。そのあとsetupCustomEditor関数を呼び出す。
```javascript
jspreadsheet(document.getElementById('spreadsheet'), {
	data: data,
	columns: [
		{ type: 'text', title:'A', width:150, editor: customColumn },
		{ type: 'text', title:'B', width:150, editor: customColumn },
	],
...
}
// カスタムエディタのセットアップ
setupCustomEditor();
```

