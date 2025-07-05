# AI智能助手使用指南（超详细版）

## 目录
1. [基础功能介绍](#基础功能介绍)
2. [API配置详解](#api配置详解)
3. [模型配置与参数调整](#模型配置与参数调整)
4. [邀请码系统说明](#邀请码系统说明)
5. [主题定制教程](#主题定制教程)
6. [文件上传功能](#文件上传功能)
7. [联网搜索与思考功能](#联网搜索与思考功能)
8. [资源推荐系统](#资源推荐系统)
9. [语音功能配置](#语音功能配置)
10. [对话管理](#对话管理)
11. [常见问题解答](#常见问题解答)

---

## 基础功能介绍

### 1. 界面布局
- **左侧侧边栏**：包含会话列表、模型选择和设置
- **中间聊天区**：显示对话内容
- **底部输入框**：发送消息和功能按钮

### 2. 基本操作
- **发送消息**：输入文字后按Enter或点击"发送"按钮
- **新建对话**：点击侧边栏的"+ 新对话"按钮
- **删除对话**：在会话列表点击🗑️图标
- **重命名对话**：点击聊天标题旁的✏️图标
- **导出对话**：点击📤图标选择导出格式

---

## API配置详解

### 1. 配置位置
文件：`api.js` → `APIManager`类构造函数（第3-20行）

### 2. 支持的API平台
| 平台 | 默认地址 | 配置文件位置 |
|------|---------|------------|
| 通义千问 | `https://dashscope.aliyuncs.com` | 第120行 |
| DeepSeek | `https://api.deepseek.com` | 第150行 |
| Kimi | `https://api.moonshot.cn` | 第180行 |
| Ollama | `http://localhost:11434` | 第5行 |

### 3. 配置步骤
1. 打开网页界面
2. 在侧边栏底部找到"API配置"区域
3. 输入对应平台的：
   - API Key（必填）
   - API地址（可选，留空使用默认）
   - Ollama地址（本地模型用）

### 4. 修改默认地址
如需修改默认API地址：
1. 打开`api.js`文件
2. 找到对应平台的URL设置（见上表）
3. 修改引号内的地址

---

## 模型配置与参数调整

### 1. 可用模型列表
文件：`api.js` → `availableModels`对象（第7-12行）

```javascript
availableModels: {
    qwen: ['qwen3-235b-a22b','qwen-turbo-2025-04-28','qwen-plus','qwen-turbo'],
    deepseek: ['deepseek-chat'],
    kimi: ['moonshot-v1-8k'],
    ollama: ['deepseek-r1:14b', 'qwen3:14b','deepseek-r1:7b', 'qwen2.5vl:7b']
}
```

### 2. 添加自定义模型
以添加Ollama模型为例：
1. 确保模型已通过`ollama pull`命令下载
2. 编辑`api.js`文件
3. 在`ollama`数组中添加你的模型名称
4. 保存文件并刷新网页

### 3. 模型参数调整
文件：`api.js` → 各API调用方法（如`sendToQwen`）

```javascript
// 通义千问参数设置（第120行）
const payload = {
    model: this.getAvailableModel('qwen'),
    messages: [{ role: 'user', content: message }],
    max_tokens: 5000,       // 最大输出token数
    temperature: 0.7,       // 随机性 (0-1)
    enable_thinking: false   // 是否启用思考功能
};
```

**可调整参数**：
- `max_tokens`：控制响应长度（100-8000）
- `temperature`：控制输出随机性（0-1）
- `top_p`：核采样参数（0-1）
- `presence_penalty`：控制主题重复性（-2.0到2.0）

### 4. 模型选择
1. 在侧边栏顶部找到模型选择下拉框
2. 先选择API平台（如Ollama）
3. 再选择具体模型

---

## 邀请码系统说明

### 1. 功能说明
文件：`api.js` → `invitationCodes`对象（第14-18行）

```javascript
invitationCodes: {
    trial: ["TRY123", "TEST456"],  // 试用版（3天有效）
    standard: ["STD789", "NORMAL"], // 普通版（会话级）
    premium: ["VIP666", "PRO888"]   // 顶级版（永久有效）
}
```

### 2. 修改邀请码
1. 打开`api.js`文件
2. 找到`invitationCodes`对象
3. 在各等级数组中添加/删除邀请码
4. 保存文件并刷新网页

### 3. 使用流程
1. 首次打开会弹出邀请码输入框
2. 输入有效邀请码后自动解锁对应功能
3. 各等级区别：
   - 试用版：3天有效期
   - 普通版：仅当前浏览器会话有效
   - 顶级版：永久有效（存储在localStorage）

---

## 主题定制教程

### 1. 修改位置
文件：`app.js` → `initializeThemeCustomizer`方法（约第200行）

### 2. 自定义主题
1. 在侧边栏底部找到"主题颜色"区域
2. 使用颜色选择器调整：
   - 主色（按钮/链接颜色）
   - 背景色（主界面背景）
   - 侧边栏颜色
   - 消息区颜色
3. 点击"应用主题"按钮

### 3. 修改默认主题
在`app.js`中修改默认值：
```javascript
this.themeSettings = {
    primaryColor: '#2196f3',   // 主色调
    bgColor: '#ffffff',        // 背景色
    sidebarColor: '#ffffff',   // 侧边栏背景
    messageColor: '#f5f5f5'    // 消息区背景
};
```

### 4. 恢复默认
点击"重置默认"按钮即可恢复初始主题

---

## 文件上传功能

### 1. 支持格式
文件：`app.js` → `readFileContent`方法（约第250行）

```javascript
const allowedTypes = [
    'text/plain',       // .txt
    'application/pdf',  // .pdf
    'text/markdown',    // .md
    'application/json', // .json
    'text/csv'          // .csv
];
```

### 2. 配置参数
| 参数 | 位置 | 默认值 | 说明 |
|------|------|--------|------|
| 文件大小限制 | `app.js` → `readFileContent` | 10MB | 最大文件大小 |
| 内容长度限制 | `app.js` → `readFileContent` | 20,000字符 | 文本截取长度 |
| 文件类型 | `app.js` → `isValidFileType` | 见上表 | 允许的文件类型 |

### 3. 添加新格式
例如添加Word文档支持：
1. 编辑`app.js`文件
2. 在`allowedTypes`数组中添加：
   ```javascript
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
   ```
3. 在文件扩展名检查中添加：
   ```javascript
   !['.txt', '.md', '.pdf', '.docx'].some(ext => file.name.endsWith(ext))
   ```

### 4. 使用注意
- 文件分析提示词位置：`app.js` → `buildFilePrompt`方法
- PDF处理逻辑位置：`app.js` → `readFileContent`方法（返回模拟内容）

---

## 联网搜索与思考功能

### 1. 联网搜索配置
文件：`api.js` → 各API的webSearch参数

```javascript
// 通义千问配置（第120行）
if (webSearch) {
    payload.plugins = [{
        "web_search": {
            "enable": true,
            "search_result": true,
            "max_results": 5  // 搜索结果数量
        }
    }];
}

// Ollama模拟搜索（第200行）
if (webSearch) {
    processedMessage = `[模拟联网搜索] ${message}\n\n由于是本地模型，我将模拟联网搜索结果:`;
}
```

### 2. 搜索参数调整
| 参数 | 位置 | 默认值 | 说明 |
|------|------|--------|------|
| max_results | `api.js` → sendToQwen | 5 | 最大搜索结果数 |
| search_mode | `api.js` → sendToKimi | "enhanced" | 搜索模式 |
| max_results | `api.js` → sendToDeepSeek | 3 | 最大搜索结果数 |

### 3. 思考功能配置
文件：`api.js` → `sendMessageWithThinking`方法

```javascript
// 思考步骤配置（第50行）
const thinkingSteps = [
    "正在分析问题背景...",
    "检索相关知识库...",
    "构建初步解决方案...",
    "验证方案可行性...",
    "优化最终回答..."
];

// 思考间隔时间（第57行）
await new Promise(resolve => setTimeout(resolve, 800)); // 800ms间隔
```

**可调整参数**：
- 修改`thinkingSteps`数组内容自定义思考步骤
- 修改800为其他值调整步骤间隔时间

---

## 资源推荐系统

### 1. 资源获取配置
文件：`api.js` → `getRelatedResources`方法

```javascript
async getRelatedResources(query) {
    // 检查缓存
    if (this.resourceCache.has(query)) {
        return this.resourceCache.get(query);
    }
    
    // 获取各平台资源
    const resources = {
        baike: await this.getBaiKeResources(query),
        csdn: await this.getCSDNResources(query),
        zhihu: await this.getZhihuResources(query)
    };
    
    // 过滤空结果
    // ...
}
```

### 2. 各平台资源限制
| 平台 | 位置 | 最大数量 | 说明 |
|------|------|---------|------|
| 秒懂百科 | `api.js` → `getBaiKeResources` | 2 | `.slice(0, 2)` |
| CSDN | `api.js` → `getCSDNResources` | 1 | `.slice(0, 1)` |
| 知乎 | `api.js` → `getZhihuResources` | 1 | `.slice(0, 1)` |

### 3. 缓存配置
```javascript
// 资源缓存（第20行）
this.resourceCache = new Map();

// 缓存设置（getRelatedResources方法）
if (Object.keys(filteredResources).length > 0) {
    this.resourceCache.set(query, filteredResources);
}
```

### 4. 资源展示配置
文件：`app.js` → `showResourcesWindow`方法
- 可修改HTML模板和CSS样式
- 安全链接处理：`app.js` → `secureAllExternalLinks`方法

---

## 语音功能配置

### 1. 语音合成
文件：`api.js` → `speakText`方法

```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.rate = options.rate || 1;     // 语速 (0.1-10)
utterance.pitch = options.pitch || 1;   // 音高 (0-2)
utterance.volume = options.volume || 1; // 音量 (0-1)
```

### 2. 语音识别
文件：`api.js` → `startSpeechRecognition`方法

```javascript
const recognition = new SpeechRecognition();
recognition.continuous = options.continuous || false;     // 是否连续识别
recognition.interimResults = options.interimResults || false; // 是否返回临时结果
recognition.lang = options.lang || 'zh-CN';              // 识别语言
recognition.maxAlternatives = options.maxAlternatives || 1; // 最大备选结果数
```

### 3. 首选语音设置
文件：`app.js` → `getPreferredVoice`方法

```javascript
getPreferredVoice() {
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
    return chineseVoice ? chineseVoice.name : null;
}
```

---

## 对话管理

### 1. 对话存储配置
文件：`app.js` → 对话相关方法
- 存储位置：localStorage中的`conversations`键
- 数据结构：
  ```javascript
  {
      id: "唯一ID",
      title: "对话标题",
      timestamp: "ISO时间戳",
      messages: [/* 消息数组 */]
  }
  ```

### 2. 导出配置
文件：`app.js` → `exportConversation`方法
- 支持格式：Markdown、纯文本、PDF（待实现）
- 修改导出模板位置：`exportConversation`方法内

### 3. 自动保存设置
文件：`app.js` → `saveCurrentConversation`方法
- 触发条件：新建对话或手动保存
- 标题生成规则：第一条消息的前20个字符

---

## 常见问题解答

### 1. Ollama连接失败
✅ 解决方法：
1. 确认Ollama服务已启动（终端输入`ollama serve`）
2. 检查`api.js`中的`ollamaUrl`设置（第5行）
3. 尝试在浏览器访问`http://localhost:11434`测试连接

### 2. API返回错误
✅ 排查步骤：
1. 检查API Key是否正确
2. 确认账号有足够额度
3. 查看浏览器控制台错误信息（F12打开开发者工具）
4. 检查`max_tokens`是否设置过大

### 3. 界面显示异常
✅ 解决方法：
1. 尝试清除浏览器缓存
2. 检查`style.css`文件是否正常加载
3. 重置主题设置

### 4. 如何备份聊天记录
✅ 操作步骤：
1. 使用"导出对话"功能
2. 选择导出格式（推荐Markdown）
3. 或直接备份浏览器localStorage中的`conversations`数据

### 5. 修改默认参数后不生效
✅ 解决方法：
1. 确保修改后保存了文件
2. 刷新浏览器页面
3. 清除浏览器缓存
4. 检查是否有语法错误（查看控制台）

### 6. 资源推荐不显示
✅ 排查步骤：
1. 检查`getRelatedResources`方法是否正常返回数据
2. 查看网络请求是否被阻止
3. 确认资源缓存是否正常工作
4. 检查资源过滤条件是否太严格

---

> 💡 **提示**：所有修改后都需要刷新浏览器才能生效！建议修改前备份原始文件。
> 
> 📌 **最佳实践**：在修改配置文件前，复制一份原始文件作为备份，避免意外错误导致系统不可用。

**最后更新**：2025年7月5日  
**版本号**：v2.5.0