const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const server = http.createServer((req, res) => {
    // 1. 画面（index.html）を表示する処理
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
    }
    // 2. 問題ファイル（questions.txtなど）を読み込む処理
    else if (req.method === 'GET' && req.url.endsWith('.txt')) {
        fs.readFile(path.join(__dirname, req.url), (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(data);
            }
        });
    }
    // 3. 📊 スコアを受け取って result.csv に自動追記する処理
    else if (req.method === 'POST' && req.url === '/save-csv') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const data = JSON.parse(body);
            
            const csvPath = path.join(__dirname, 'result.csv');
            const rowData = `"${data.time}",${data.wpm},${data.correct},${data.miss},${data.accuracy}\n`;
            
            // ファイルが存在しない場合はヘッダー（BOM付き）を作る
            if (!fs.existsSync(csvPath)) {
                const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
                const headers = "日時,WPM(文字/分),正解文字数,ミス回数,正確さ(%)\n";
                fs.writeFileSync(csvPath, Buffer.concat([bom, Buffer.from(headers)]));
            }
            
            // 💡 完全自動でファイルの一番下に追記する
            fs.appendFile(csvPath, rowData, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end('保存失敗');
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'success' }));
                }
            });
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
