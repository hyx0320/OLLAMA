# 本地化AI聊天界面项目使用说明

## 一、项目概述
本项目是一个本地化AI聊天界面，支持多种大模型，包括通义千问、DeepSeek、Kimi以及本地部署的Ollama模型。用户可以通过简单的配置，轻松切换不同的模型进行聊天。

## 二、环境准备
在使用本项目之前，请确保你已经安装了以下环境：
- 现代浏览器（如Chrome、Firefox等）
- 本地部署的Ollama服务（如果需要使用本地Ollama模型）

## 三、项目结构
项目主要包含以下几个文件：
- `index.html`：聊天界面的HTML文件，包含界面布局和用户交互元素。
- `api.js`：封装了与各个模型API的交互逻辑。
- `app.js`：处理聊天应用的核心逻辑，如消息发送、会话管理等。
- `style.css`：定义了聊天界面的样式。

## 四、配置步骤

### 1. 配置API Key和API URL
如果你想使用通义千问、DeepSeek或Kimi模型，需要配置相应的API Key和API URL。具体步骤如下：
- 打开`index.html`文件，在侧边栏底部的API配置区域找到对应的输入框。
- 输入你的API Key和API URL（可选，部分模型有默认URL）。
- 选择对应的模型（通义千问、DeepSeek或Kimi）。

### 2. 配置本地Ollama
如果你想使用本地部署的Ollama模型，需要进行以下配置：
- 确保本地的Ollama服务已经启动。你可以通过以下命令启动Ollama服务：
```bash
ollama serve
```
- 打开`index.html`文件，在侧边栏底部的API配置区域找到`Ollama地址`输入框。
- 输入本地Ollama服务的地址，默认地址为`http://localhost:11434`。
- 选择`本地Ollama`模型。
- 如果你使用的Ollama模型不是默认的`llama3`，可以打开`api.js`文件，找到`sendToOllama`方法，将`model`参数修改为你实际安装的模型名称：
```javascript
// 发送到本地Ollama
async sendToOllama(message) {
    try {
        const url = `${this.ollamaUrl}/api/chat`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'your_local_model_name', // 根据实际安装情况修改
                messages: [{ role: 'user', content: message }],
                stream: false
            })
        });

        if (!response.ok) throw new Error(`Ollama服务错误: ${response.status}`);
        
        const data = await response.json();
        return data.message?.content || '未获取到响应';
    } catch (error) {
        throw new Error(`Ollama连接失败: ${error.message}，请检查服务是否启动`);
    }
}
```

### 3. 保存配置
配置完成后，点击输入框外部或切换模型，配置信息将自动保存到本地存储。你也可以点击“清除保存的设置”按钮来清除所有配置。

## 五、使用方法

### 1. 新建会话
点击侧边栏的“+ 新会话”按钮，即可开始一个新的聊天会话。

### 2. 发送消息
在聊天输入框中输入消息，按下`Enter`键或点击“发送”按钮，即可将消息发送给所选的模型。

### 3. 保存会话
点击聊天标题栏的“💾 保存会话”按钮，输入会话标题，即可将会话保存到本地存储。

### 4. 上传文件
点击聊天标题栏的“📂 上传文件”按钮，选择要上传的文件（支持文本、PDF和Markdown文件），系统将读取文件内容并发送给模型进行处理。

### 5. 切换模型
在侧边栏的模型选择下拉框中，选择你想要使用的模型，即可切换到相应的模型进行聊天。

## 六、注意事项
- 部分模型（如通义千问、DeepSeek、Kimi）需要有效的API Key才能正常使用。
- 如果你使用的是本地Ollama模型，请确保Ollama服务已经正确启动，并且输入的地址和模型名称正确。
- 上传的文件内容长度限制为5000个字符，超出部分将被截断。

## 七、问题反馈
如果你在使用过程中遇到任何问题或有建议，请随时联系开发者。

希望本项目能为你带来良好的聊天体验！







