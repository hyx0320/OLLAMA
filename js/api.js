class APIManager {
    constructor() {
        this.currentModel = 'qwen';
        this.apiKey = '';
        this.apiUrl = '';
        this.ollamaUrl = 'http://localhost:11434';
        this.availableModels = {
            qwen: ['qwen3-235b-a22b','qwen-turbo-2025-04-28','qwen-plus','qwen-turbo'],
            deepseek: ['deepseek-chat'],
            kimi: ['moonshot-v1-8k'],
            ollama: ['deepseek-r1:14b', 'qwen3:14b','deepseek-r1:7b', 'qwen2.5vl:7b','deepseek-r1:1.5b']
        };
        // 添加邀请码列表
        this.invitationCodes = [
            "AI2024", 
            "CHATBOT", 
            "WELCOME123",
            "OPENAI",
            "DEEPSEEK"
        ];
    }

    // 设置模型
    setModel(model) {
        this.currentModel = model;
    }

    // 设置API密钥
    setApiKey(key) {
        this.apiKey = key;
    }

    // 设置API地址
    setApiUrl(url) {
        this.apiUrl = url;
    }

    // 设置Ollama地址
    setOllamaUrl(url) {
        this.ollamaUrl = url;
    }

    // 修改sendMessage方法，添加格式约束
    async sendMessage(message) {
        // 强制添加格式要求前缀
        const formattedMessage = `请严格按照Markdown格式回答，包括标题、列表、代码块等元素。问题：${message}`;
        
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

    //思考功能
    async sendMessageWithThinking(message, callback) {
        // 模拟思考过程
        const thinkingSteps = [
            "正在分析问题背景...",
            "检索相关知识库...",
            "构建初步解决方案...",
            "验证方案可行性...",
            "优化最终回答..."
        ];
        
        // 发送思考过程
        for (const step of thinkingSteps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            callback(step);
        }
        
        // 发送最终回答
        return this.sendMessage(message);
    }


    //联网搜索
    async sendMessageWithWebSearch(message) {
        // 统一格式的搜索指令
        const formattedMessage = `[WEB_SEARCH] ${message}\n\n请执行以下操作：
1. 进行联网搜索获取最新信息
2. 整理并验证搜索结果
3. 用Markdown格式回答，包含来源引用`;
        
        try {
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

    // 通义千问搜索增强版
    async sendToQwen(message, webSearch = false) {
        if (!this.apiKey) throw new Error('请设置通义千问API Key');
        
        const url = this.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        const payload = {
            model: this.getAvailableModel('qwen'),
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,
            temperature: 0.7
        };

        if (webSearch) {
            payload.plugins = [{
                "web_search": {
                    "enable": true,
                    "search_result": true,
                    "max_results": 5  // 增加搜索结果数量
                }
            }];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`通义千问API错误: ${error.message || response.status}`);
        }

        const data = await response.json();
        return this.formatSearchResult(data.choices[0].message.content, 'qwen');
    }


    // 修改现有的API调用方法，添加webSearch参数
    async sendToQwen(message, webSearch = false) {
        if (!this.apiKey) throw new Error('请设置通义千问API Key');
        
        const url = this.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        const payload = {
            model: this.getAvailableModel('qwen'),
            messages: [{ role: 'user', content: message }],
            enable_thinking: false,
            max_tokens: 5000,
            temperature: 0.7
        };

        // 添加联网搜索参数
        if (webSearch) {
            payload.plugins = [{
                "web_search": {
                    "enable": true,
                    "search_result": true
                }
            }];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`通义千问API错误: ${response.status} - ${error}`);
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('通义千问返回格式异常');
            }

            return data.choices[0].message.content;
    }


    // DeepSeek搜索增强版
    async sendToDeepSeek(message, webSearch = false) {
        if (!this.apiKey) throw new Error('请设置DeepSeek API Key');
        
        const url = this.apiUrl || 'https://api.deepseek.com/v1/chat/completions';
        const payload = {
            model: this.getAvailableModel('deepseek'),
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,
            temperature: 0.7
        };

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

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`DeepSeek API错误: ${error.message || response.status}`);
        }

        const data = await response.json();
        return this.formatSearchResult(data.choices[0].message.content, 'deepseek');
    }

    // Kimi搜索增强版
    async sendToKimi(message, webSearch = false) {
        if (!this.apiKey) throw new Error('请设置Kimi API Key');
        
        const url = this.apiUrl || 'https://api.moonshot.cn/v1/chat/completions';
        const payload = {
            model: this.getAvailableModel('kimi'),
            messages: [{ role: 'user', content: message }],
            max_tokens: 5000,
            temperature: 0.7
        };

        if (webSearch) {
            payload.tools = [{
                "type": "web_search",
                "web_search": {
                    "enable": true,
                    "search_mode": "enhanced"
                }
            }];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Kimi API错误: ${error.message || response.status}`);
        }

        const data = await response.json();
        return this.formatSearchResult(data.choices[0].message.content, 'kimi');
    }

    // Ollama模拟搜索行为
    async sendToOllama(message, webSearch = false) {
        try {
            const url = `${this.ollamaUrl}/api/chat`;
            let processedMessage = message;
            
            if (webSearch) {
                processedMessage = `[模拟联网搜索] ${message}\n\n由于是本地模型，我将模拟联网搜索结果:`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.getAvailableModel('ollama'),
                    messages: [{ role: 'user', content: processedMessage }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`Ollama服务错误: ${response.status}`);
            
            const data = await response.json();
            return webSearch ? 
                this.formatMockSearchResult(data.message?.content) : 
                data.message?.content;
        } catch (error) {
            throw new Error(`Ollama连接失败: ${error.message}`);
        }
    }

    // 格式化搜索结果 (通用)
    formatSearchResult(content, source) {
        return `### 搜索结果\n${content}\n\n<small>来源: ${source} 网络搜索</small>`;
    }

    // Ollama模拟搜索结果
    formatMockSearchResult(content) {
        return `### 模拟搜索结果 (本地模型)\n${content}\n\n<small>⚠️ 注意: 这是本地模型模拟的搜索结果</small>`;
    }
   // 获取可用模型
    getAvailableModel(api) {
        const selectedModel = document.getElementById('available-model-select').value;
        const models = this.availableModels[api];
        if (models.includes(selectedModel)) {
            return selectedModel;
        }
        return models[0]; // 如果选择的模型不在列表中，返回第一个模型
    }
    // 获取指定 API 的可用模型列表
    getAvailableModelsForAPI(api) {
        return this.availableModels[api] || [];
    }
    // 添加邀请码验证方法
    validateInvitationCode(code) {
        return this.invitationCodes.includes(code.toUpperCase());
    }
}