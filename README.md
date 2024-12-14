# JspreadsheetCE-for-Japanese

Jspreadsheet CEはセルを編集中でないときに日本語を入力すると「あ」が「a」、「か」が「kあ」になってしまう。
Pro版であればこの問題は発生しないが、Jspreadsheet CEでカスタムエディタを使ってこの問題を解決する。

## 使い方
1. japanese_customeditor.jsを読み込む
```html
<script src="./japanese_customeditor.js"></script>
```

2. jspreadsheetを作成した後でsetupCustomEditor関数を呼び出す。
```javascript
jspreadsheet(document.getElementById('spreadsheet'), {
...
}
// カスタムエディタのセットアップ
setupCustomEditor();
```

