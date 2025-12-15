<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>➕ Submit a Website</title>
  <style>
    :root { --bg: #ffffff; --text: #1a202c; --muted: #718096; --primary: #4299e1; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #121212; --text: #e2e8f0; --muted: #a0aec0; }
    }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 20px; max-width: 600px; margin: 0 auto; }
    h1 { text-align: center; margin: 24px 0; color: var(--primary); }
    form { background: var(--bg); padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    label { display: block; margin-top: 16px; font-weight: 600; }
    input, textarea { width: 100%; padding: 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 8px; background: var(--bg); color: var(--text); }
    .checkbox-group { margin-top: 6px; }
    .checkbox-item { display: inline-block; margin-right: 12px; }
    button { width: 100%; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 1.1rem; margin-top: 24px; cursor: pointer; }
    button:hover { opacity: 0.9; }
    .back { display: block; text-align: center; margin-top: 20px; color: var(--primary); text-decoration: none; }
  </style>
</head>
<body>
  <h1 id="title">Submit a New Website</h1>
  <form id="submitForm">
    <label for="name">Website Name *</label>
    <input type="text" id="name" required>

    <label for="url">URL *</label>
    <input type="url" id="url" required placeholder="https://example.com or http://example.i2p">

    <label for="description">Description *</label>
    <textarea id="description" rows="3" required></textarea>

    <label>Type</label>
    <div class="checkbox-group">
      <label class="checkbox-item">
        <input type="checkbox" id="isI2P"> .i2p website (requires I2P router)
      </label>
    </div>

    <label for="tags">Tags (comma separated)</label>
    <input type="text" id="tags" placeholder="e.g. news, privacy, forum">

    <button type="submit" id="submitBtn">📤 Submit for Review</button>
  </form>
  <a href="/" class="back" id="backBtn">← Back to Search</a>

  <script>
    // 简易多语言（与 index.html 一致）
    const translations = {
      en: {
        title: "Submit a New Website",
        submitBtn: "📤 Submit for Review",
        backBtn: "← Back to Search"
      },
      zh: {
        title: "提交新网站",
        submitBtn: "📤 提交审核",
        backBtn: "← 返回搜索"
      }
    };

    const lang = localStorage.getItem('lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
    document.getElementById('title').textContent = translations[lang].title;
    document.getElementById('submitBtn').textContent = translations[lang].submitBtn;
    document.getElementById('backBtn').textContent = translations[lang].backBtn;

    document.getElementById('submitForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isI2P = document.getElementById('isI2P').checked;
      let tags = [];
      if (isI2P) tags.push('i2p');
      if (document.getElementById('tags').value) {
        tags = tags.concat(document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t));
      }

      const data = {
        name: document.getElementById('name').value,
        url: document.getElementById('url').value,
        description: document.getElementById('description').value,
        tags: tags,
        submitted_at: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          alert(lang === 'zh' ? '✅ 提交成功！审核后将展示。' : '✅ Submitted! It will appear after review.');
          document.getElementById('submitForm').reset();
          document.getElementById('isI2P').checked = false;
        } else {
          alert(lang === 'zh' ? '❌ 提交失败' : '❌ Failed to submit');
        }
      } catch (err) {
        alert(lang === 'zh' ? '⚠️ 无法连接服务器' : '⚠️ Could not connect to server');
      }
    });
  </script>
</body>
</html>
