# 本地AI聊天助手使用指南（增强版）

## 🔧 深度配置指南

### 1. 自定义Ollama模型
如果你使用的Ollama模型不在默认列表中，可以通过以下两种方式添加：

#### 方法一：修改API配置文件（推荐）
1. 打开`api.js`文件
2. 找到`availableModels`对象（约第7行）
3. 在`ollama`数组中添加你的模型名称：
```javascript
availableModels: {
    ollama: [
        'deepseek-r1:7b', 
        'qwen2.5vl:7b',
        '你的模型名称'  // 在此添加自定义模型
    ]
}
```

#### 方法二：直接修改模型调用参数
1. 打开`api.js`文件
2. 找到`sendToOllama`方法（约第200行）
3. 修改`model`参数为你安装的模型名称：
```javascript
async sendToOllama(message) {
    try {
        const url = `${this.ollamaUrl}/api/chat`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: '你的模型名称', // 修改这里
                messages: [{ role: 'user', content: message }],
                stream: false
            })
        });
        // ...其余代码不变
    }
}
```

### 2. 自定义API端点
如需修改默认API地址，可以编辑`api.js`中的以下部分：

```javascript
// 通义千问默认端点（约第120行）
const qwenUrl = this.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// DeepSeek默认端点（约第150行）
const deepseekUrl = this.apiUrl || 'https://api.deepseek.com/v1/chat/completions';

// Kimi默认端点（约第180行）
const kimiUrl = this.apiUrl || 'https://api.moonshot.cn/v1/chat/completions';
```

### 3. 添加上传文件类型支持
要增加支持的文件类型，修改`app.js`中的`handleFileUpload`方法：

```javascript
// 约第250行
const allowedTypes = [
    'text/plain', 
    'application/pdf', 
    'text/markdown',
    'application/json'  // 新增支持JSON文件
    // 可以继续添加其他MIME类型
];

// 同时修改对应的文件扩展名检查（约第255行）
if (!allowedTypes.includes(file.type) && 
    !['.txt', '.md', '.pdf', '.json'].some(ext => file.name.endsWith(ext))) {
    alert('仅支持文本、PDF、Markdown和JSON文件');
    return;
}
```

### 4. 调整消息长度限制
修改消息长度限制（默认5000字符）：

```javascript
// 在app.js中找到handleFileUpload方法（约第260行）
const content = event.target.result.substring(0, 10000); // 修改为10000字符

// 在api.js中调整各API的max_tokens参数（分别约第130/160/190行）
max_tokens: 8000  // 原为5000
```

## 🛠️ 高级功能配置

### 1. 深度思考模式定制
要调整思考步骤和时间间隔：

```javascript
// 在api.js中找到sendMessageWithThinking方法（约第80行）
const thinkingSteps = [
    "正在分析问题背景...",      // 可修改步骤描述
    "检索相关知识库...",
    "构建初步解决方案...",
    "验证方案可行性...", 
    "优化最终回答..."
];

// 修改思考间隔时间（毫秒）
await new Promise(resolve => setTimeout(resolve, 1000));  // 原为800ms
```

### 2. 联网搜索增强配置
调整各平台的搜索参数：

```javascript
// 通义千问搜索参数（约第135行）
web_search: {
    enable: true,
    search_result: true,
    max_results: 8  // 增加结果数量
}

// DeepSeek搜索参数（约第165行）
web_search: {
    search: true,
    max_results: 5,  // 原为3
    enhanced: true
}
```

## 💾 数据管理

### 1. 修改本地存储方式
默认使用localStorage，如需改用sessionStorage：

```javascript
// 在app.js中找到所有localStorage的引用（约第350/380行等）
localStorage.setItem → sessionStorage.setItem
localStorage.getItem → sessionStorage.getItem
localStorage.removeItem → sessionStorage.removeItem
```

### 2. 导出/导入会话数据
添加以下代码到`app.js`可实现数据导出：

```javascript
// 新增导出方法
function exportConversations() {
    const data = localStorage.getItem('conversations');
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_backup.json';
    a.click();
}

// 新增导入方法
function importConversations(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            JSON.parse(e.target.result);
            localStorage.setItem('conversations', e.target.result);
            alert('导入成功！');
        } catch {
            alert('文件格式错误');
        }
    };
    reader.readAsText(file);
}
```

## ⚠️ 重要提醒
1. 修改代码前建议先备份原文件
2. 每次修改后需刷新浏览器才能生效
3. 复杂的模型可能需要更多内存资源
4. 部分API可能有调用频率限制

希望这些高级配置指南能帮助你更好地定制AI聊天助手！如需进一步帮助，请参考项目文档或联系开发者。