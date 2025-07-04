# AI智能助手使用指南（超详细版）

## 目录
1. [基础功能介绍](#基础功能介绍)
2. [API配置详解](#api配置详解)
3. [模型选择指南](#模型选择指南)
4. [邀请码系统说明](#邀请码系统说明)
5. [主题定制教程](#主题定制教程)
6. [文件上传功能](#文件上传功能)
7. [常见问题解答](#常见问题解答)

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

## 模型选择指南

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

### 3. 切换模型
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

### 3. 恢复默认
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
    // 其他支持的MIME类型
];
```

### 2. 添加新格式
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

### 3. 使用注意
- 文件大小限制：5MB
- 内容长度限制：5000字符

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

---

> 💡 提示：所有修改后都需要刷新浏览器才能生效！建议修改前备份原始文件。