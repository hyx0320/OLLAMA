class APIManager {
    // 初始化API管理器实例
    constructor() {
        // 当前选定的模型，默认为'qwen'
        this.currentModel = 'qwen';
        // 存储API密钥的变量
        this.apiKey = '';
        // 存储API基础URL的变量
        this.apiUrl = '';
        // Ollama本地服务的默认URL
        this.ollamaUrl = 'http://localhost:11434';
        
        // 定义各平台支持的模型列表
        this.availableModels = {
            qwen: ['qwen3-235b-a22b','qwen-turbo-2025-04-28','qwen-plus','qwen-turbo'],
            deepseek: ['deepseek-chat'],
            kimi: ['moonshot-v1-8k'],
            ollama: ['deepseek-r1:14b', 'qwen3:14b','deepseek-r1:7b', 'qwen2.5vl:7b','deepseek-r1:1.5b']
        };
        
        // 多级邀请码系统定义
        this.invitationCodes = {
            trial: ["TRY123", "TEST456"],  // 试用版邀请码（3天有效）
            standard: ["STD789", "NORMAL"], // 普通版邀请码（会话级权限）
            premium: ["VIP666", "PRO888"]   // 顶级版邀请码（永久有效）
        };
        
        // 存储当前用户权限等级
        this.userTier = null;
        
        // 推荐资源缓存，用于存储查询过的资源结果
        this.resourceCache = new Map(); 
    }

    // 设置当前使用的AI模型
    setModel(model) {
        this.currentModel = model;
    }

    // 设置API访问密钥
    setApiKey(key) {
        this.apiKey = key;
    }

    // 设置API基础URL
    setApiUrl(url) {
        this.apiUrl = url;
    }

    // 设置Ollama服务的URL
    setOllamaUrl(url) {
        this.ollamaUrl = url;
    }

    // 发送消息到当前选定的模型（带Markdown格式约束）
    async sendMessage(message) {
        // 强制添加Markdown格式要求前缀到用户消息
        const formattedMessage = `请严格按照Markdown格式回答，包括标题、列表、代码块等元素。问题：${message}`;
        
        // 根据当前模型选择对应的API调用方法
        switch (this.currentModel) {
            case 'qwen':
                return this.sendToQwen(formattedMessage);
            case 'deepseek':
                return this.sendToDeepSeek(formattedMessage);
            case 'kimi':
                return this.sendToKimi(formattedMessage);
            case 'ollama':
                return this.sendToOllama(formattedMessage);
            default:
                throw new Error(`不支持的模型: ${this.currentModel}`);
        }
    }

    // 发送消息并模拟思考过程（带回调函数）
    async sendMessageWithThinking(message, callback) {
        // 定义思考步骤的文本序列
        const thinkingSteps = [
            "正在分析问题背景...",
            "检索相关知识库...",
            "构建初步解决方案...",
            "验证方案可行性...",
            "优化最终回答..."
        ];
        
        // 按顺序发送每个思考步骤，间隔800ms
        for (const step of thinkingSteps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            callback(step);  // 通过回调函数传递当前思考步骤
        }
        
        // 思考过程结束后发送实际消息
        return this.sendMessage(message);
    }

    // 发送带联网搜索功能的请求
    async sendMessageWithWebSearch(message) {
        // 添加联网搜索指令前缀和操作步骤说明
        const formattedMessage = `[WEB_SEARCH] ${message}\n\n请执行以下操作：
1. 进行联网搜索获取最新信息
2. 整理并验证搜索结果
3. 用Markdown格式回答，包含来源引用`;
        
        try {
            // 根据当前模型选择对应的API调用方法，并启用搜索功能
            switch (this.currentModel) {
                case 'qwen':
                    return this.sendToQwen(formattedMessage, true);
                case 'deepseek':
                    return this.sendToDeepSeek(formattedMessage, true);
                case 'kimi':
                    return this.sendToKimi(formattedMessage, true);
                case 'ollama':
                    // Ollama本地模型模拟搜索行为
                    return this.sendToOllama(formattedMessage, true);
                default:
                    throw new Error(`不支持的模型: ${this.currentModel}`);
            }
        } catch (error) {
            console.error('联网搜索失败:', error);
            throw new Error(`联网搜索失败: ${error.message}`);
        }
    }

    // 调用通义千问API（支持联网搜索）
    async sendToQwen(message, webSearch = false) {
        // 检查API密钥是否设置
        if (!this.apiKey) throw new Error('请设置通义千问API Key');
        
        // 使用自定义URL或默认URL
        const url = this.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        
        // 构建请求负载
        const payload = {
            model: this.getAvailableModel('qwen'),  // 获取可用模型
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,  // 最大生成token数
            temperature: 0.7   // 生成温度
        };

        // 如果启用联网搜索，添加搜索插件配置
        if (webSearch) {
            payload.plugins = [{
                "web_search": {
                    "enable": true,
                    "search_result": true
                }
            }];
        }

        // 发送POST请求到API
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`  // 认证头
            },
            body: JSON.stringify(payload)
        });

        // 处理非成功响应
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`通义千问API错误: ${response.status} - ${error}`);
        }

        // 解析响应数据
        const data = await response.json();
        
        // 检查响应结构是否有效
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('通义千问返回格式异常');
        }

        // 返回消息内容
        return data.choices[0].message.content;
    }

    // 调用DeepSeek API（支持联网搜索）
    async sendToDeepSeek(message, webSearch = false) {
        // 检查API密钥是否设置
        if (!this.apiKey) throw new Error('请设置DeepSeek API Key');
        
        // 使用自定义URL或默认URL
        const url = this.apiUrl || 'https://api.deepseek.com/v1/chat/completions';
        
        // 构建请求负载
        const payload = {
            model: this.getAvailableModel('deepseek'),
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,
            temperature: 0.7
        };

        // 如果启用联网搜索，添加搜索工具配置
        if (webSearch) {
            payload.tools = [{
                "type": "web_search",
                "web_search": {
                    "search": true,
                    "max_results": 3,
                    "enhanced": true
                }
            }];
        }

        // 发送POST请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        // 处理错误响应
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`DeepSeek API错误: ${error.message || response.status}`);
        }

        // 解析并返回数据
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 调用Kimi API（支持联网搜索）
    async sendToKimi(message, webSearch = false) {
        // 检查API密钥是否设置
        if (!this.apiKey) throw new Error('请设置Kimi API Key');
        
        // 使用自定义URL或默认URL
        const url = this.apiUrl || 'https://api.moonshot.cn/v1/chat/completions';
        
        // 构建请求负载
        const payload = {
            model: this.getAvailableModel('kimi'),
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,
            temperature: 0.7
        };

        // 如果启用联网搜索，添加搜索工具配置
        if (webSearch) {
            payload.tools = [{
                "type": "web_search",
                "web_search": {
                    "enable": true,
                    "search_mode": "enhanced"
                }
            }];
        }

        // 发送POST请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        // 处理错误响应
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Kimi API错误: ${error.message || response.status}`);
        }

        // 解析并返回数据
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 调用Ollama本地API（支持模拟联网搜索）
    async sendToOllama(message, webSearch = false) {
        try {
            // 构建Ollama API URL
            const url = `${this.ollamaUrl}/api/chat`;
            let processedMessage = message;
            
            // 如果启用搜索，添加模拟搜索前缀
            if (webSearch) {
                processedMessage = `[模拟联网搜索] ${message}\n\n由于是本地模型，我将模拟联网搜索结果:`;
            }

            // 发送POST请求到Ollama
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.getAvailableModel('ollama'),
                    messages: [{ role: 'user', content: processedMessage }],
                    stream: false  // 关闭流式传输
                })
            });

            // 检查响应状态
            if (!response.ok) throw new Error(`Ollama服务错误: ${response.status}`);
            
            // 解析响应数据
            const data = await response.json();
            
            // 根据是否搜索返回不同格式的结果
            return webSearch ? 
                this.formatMockSearchResult(data.message?.content) : 
                data.message?.content;
        } catch (error) {
            throw new Error(`Ollama连接失败: ${error.message}`);
        }
    }

    // 格式化搜索结果（通用方法）
    formatSearchResult(content, source) {
        return `### 搜索结果\n${content}\n\n<small>来源: ${source} 网络搜索</small>`;
    }

    // 格式化Ollama的模拟搜索结果
    formatMockSearchResult(content) {
        return `### 模拟搜索结果 (本地模型)\n${content}\n\n<small>⚠️ 注意: 这是本地模型模拟的搜索结果</small>`;
    }
   
    // 获取指定API的可用模型
    getAvailableModel(api) {
        // 从UI获取用户选择的模型
        const selectedModel = document.getElementById('available-model-select').value;
        const models = this.availableModels[api];
        
        // 验证选择的模型是否在可用列表中
        if (models.includes(selectedModel)) {
            return selectedModel;
        }
        // 默认返回列表中的第一个模型
        return models[0];
    }
    
    // 获取指定API的所有可用模型列表
    getAvailableModelsForAPI(api) {
        return this.availableModels[api] || [];
    }
    
    // 验证邀请码并返回用户等级
    validateInvitationCode(code) {
        // 遍历所有邀请码等级
        for (const [tier, codes] of Object.entries(this.invitationCodes)) {
            // 检查输入码是否在当前等级的码列表中
            if (codes.includes(code.toUpperCase())) {
                // 设置用户等级
                this.userTier = tier;
                return tier;
            }
        }
        // 未找到匹配的邀请码
        return null;
    }

    // 获取与查询相关的推荐资源
    async getRelatedResources(query) {
        // 首先检查缓存中是否有结果
        if (this.resourceCache.has(query)) {
            return this.resourceCache.get(query);
        }

        try {
            // 并行获取不同平台的资源
            const resources = {
                baike: await this.getBaiKeResources(query),
                csdn: await this.getCSDNResources(query),
                zhihu: await this.getZhihuResources(query)
            };

            // 过滤掉空结果
            const filteredResources = {};
            for (const [source, items] of Object.entries(resources)) {
                if (items && items.length > 0) {
                    filteredResources[source] = items;
                }
            }

            // 如果存在有效结果，存入缓存
            if (Object.keys(filteredResources).length > 0) {
                this.resourceCache.set(query, filteredResources);
            }

            return filteredResources;
        } catch (error) {
            console.error('获取推荐资源失败:', error);
            return null;
        }
    }

    // 获取秒懂百科资源
    async getBaiKeResources(query) {
        try {
            // 实际API调用（示例）
            const response = await fetch(`https://baike-api.example.com/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            // 处理并过滤结果
            return data.items
                .filter(item => item.title.includes(query)) // 确保标题匹配
                .slice(0, 2) // 限制结果数量
                .map(item => ({
                    title: item.title,
                    url: item.url,
                    source: "秒懂百科",
                    verified: true, // 标记为已验证内容
                    openInNewTab: true,  // 前端打开方式标志
                    linkAttrs: {         // 链接属性
                        target: "_blank",
                        rel: "noopener noreferrer nofollow"
                    }
                }));
        } catch (error) {
            console.error('获取秒懂百科资源失败:', error);
            return null;
        }
    }

    // 获取CSDN资源
    async getCSDNResources(query) {
        try {
            // 实际API调用（示例）
            const response = await fetch(`https://csdn-api.example.com/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            // 处理并过滤结果
            return data.list
                .filter(item => 
                    item.title.includes(query) && 
                    item.contentType === 'blog') // 只获取博客类型
                .slice(0, 1)
                .map(item => ({
                    title: item.title,
                    url: item.url,
                    source: "CSDN",
                    verified: true,
                    openInNewTab: true,
                    linkAttrs: {
                        target: "_blank",
                        rel: "noopener noreferrer nofollow"
                    }
                }));
        } catch (error) {
            console.error('获取CSDN资源失败:', error);
            return null;
        }
    }

    // 获取知乎资源
    async getZhihuResources(query) {
        try {
            // 实际API调用（示例）
            const response = await fetch(`https://zhihu-api.example.com/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            // 处理并过滤结果
            return data.results
                .filter(item => 
                    item.type === 'question' && // 只获取问题类型
                    item.title.includes(query))
                .slice(0, 1)
                .map(item => ({
                    title: item.title,
                    url: `https://www.zhihu.com/question/${item.id}`, // 构建知乎URL
                    source: "知乎",
                    verified: true,
                    openInNewTab: true,
                    linkAttrs: {
                        target: "_blank",
                        rel: "noopener noreferrer nofollow"
                    }
                }));
        } catch (error) {
            console.error('获取知乎资源失败:', error);
            return null;
        }
    }

    // 文本转语音合成
    speakText(text, options = {}) {
        return new Promise((resolve, reject) => {
            // 检查浏览器支持
            if (!('speechSynthesis' in window)) {
                reject(new Error('您的浏览器不支持语音合成API'));
                return;
            }

            // 创建语音合成实例
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 配置语音参数
            utterance.rate = options.rate || 1;    // 语速 (0.1-10)
            utterance.pitch = options.pitch || 1;  // 音高 (0-2)
            utterance.volume = options.volume || 1; // 音量 (0-1)
            
            // 设置指定语音
            if (options.voice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name === options.voice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            // 注册完成和错误事件
            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(event.error);

            // 开始语音合成
            window.speechSynthesis.speak(utterance);
        });
    }

    // 停止当前语音合成
    stopSpeaking() {
        window.speechSynthesis.cancel();
    }

    // 语音识别功能
    startSpeechRecognition(options = {}) {
        return new Promise((resolve, reject) => {
            // 检查浏览器支持
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject(new Error('您的浏览器不支持语音识别API'));
                return;
            }

            // 初始化语音识别
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            // 配置识别参数
            recognition.continuous = options.continuous || false;   // 是否连续识别
            recognition.interimResults = options.interimResults || false; // 是否返回临时结果
            recognition.lang = options.lang || 'zh-CN';             // 识别语言
            recognition.maxAlternatives = options.maxAlternatives || 1; // 最大候选结果数

            let finalTranscript = ''; // 存储最终识别结果

            // 处理识别结果事件
            recognition.onresult = (event) => {
                let interimTranscript = '';
                
                // 遍历所有结果
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // 如果有临时结果回调，则调用
                if (options.onInterimResult) {
                    options.onInterimResult(interimTranscript);
                }
            };

            // 错误处理
            recognition.onerror = (event) => {
                reject(event.error);
            };

            // 识别结束处理
            recognition.onend = () => {
                if (finalTranscript) {
                    resolve(finalTranscript);
                } else {
                    reject(new Error('没有识别到语音'));
                }
            };

            // 开始语音识别
            recognition.start();
        });
    }
}