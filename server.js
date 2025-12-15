// server.js - 支持提交 + 审核 + 自动合并
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const DATA_DIR = './data';
const SUBMISSIONS_DIR = './submissions';
const APPROVAL_THRESHOLD = 3; // 3票自动合并

// 确保目录存在
[DATA_DIR, SUBMISSIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// 初始化主索引
if (!fs.existsSync(`${DATA_DIR}/sites.json`)) {
  fs.writeFileSync(`${DATA_DIR}/sites.json`, JSON.stringify({
    version: 1,
    last_updated: new Date().toISOString(),
    sites: []
  }, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 静态文件
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, 'index.html');
  } else if (pathname === '/submit.html') {
    serveFile(res, 'submit.html');
  } else if (pathname === '/data/sites.json') {
    serveFile(res, 'data/sites.json');
  }
  // 提交新网站
  else if (pathname === '/api/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const id = Date.now().toString();
        const submission = {
          id,
          ...data,
          approvals: 0,
          submitted_at: new Date().toISOString()
        };
        fs.writeFileSync(`${SUBMISSIONS_DIR}/${id}.json`, JSON.stringify(submission, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
  }
  // 获取所有提交
  else if (pathname === '/api/submissions' && req.method === 'GET') {
    const files = fs.readdirSync(SUBMISSIONS_DIR);
    const submissions = files.map(file => {
      const content = fs.readFileSync(`${SUBMISSIONS_DIR}/${file}`, 'utf8');
      return JSON.parse(content);
    }).filter(s => !s.rejected); // 过滤已拒绝的
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(submissions));
  }
  // 审核：批准
  else if (pathname.startsWith('/api/approve/') && req.method === 'POST') {
    const id = pathname.split('/');
    const filePath = `${SUBMISSIONS_DIR}/${id}.json`;
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      data.approvals = (data.approvals || 0) + 1;
      
      // 检查是否达到阈值
      if (data.approvals >= APPROVAL_THRESHOLD) {
        mergeToMainIndex(data);
        fs.unlinkSync(filePath); // 删除已合并的提交
      } else {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }
    res.writeHead(200);
    res.end();
  }
  // 审核：拒绝
  else if (pathname.startsWith('/api/reject/') && req.method === 'POST') {
    const id = pathname.split('/');
    const filePath = `${SUBMISSIONS_DIR}/${id}.json`;
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      data.rejected = true;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    res.writeHead(200);
    res.end();
  }
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

function mergeToMainIndex(newSite) {
  const indexPath = `${DATA_DIR}/sites.json`;
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  // 避免重复
  const exists = index.sites.some(s => s.url === newSite.url);
  if (!exists) {
    index.sites.push({
      name: newSite.name,
      url: newSite.url,
      description: newSite.description,
      tags: newSite.tags
    });
    index.version += 1;
    index.last_updated = new Date().toISOString();
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log(`✅ Merged: ${newSite.name}`);
  }
}

function serveFile(res, filepath) {
  const fullPath = path.join(__dirname, filepath);
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      const ext = path.extname(filepath).toLowerCase();
      let contentType = 'text/plain';
      if (ext === '.html') contentType = 'text/html';
      else if (ext === '.json') contentType = 'application/json';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Main index: /data/sites.json`);
  console.log(`📥 Submissions: /submissions/`);
  console.log(`🗳️ Approval threshold: ${APPROVAL_THRESHOLD} votes`);
});
