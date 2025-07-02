class APIManager {
    constructor() {
        this.currentModel = 'qwen';
        this.apiKey = '';
        this.apiUrl = '';
        this.ollamaUrl = 'http://localhost:11434';
        this.availableModels = {
            qwen: ['qwen3-235b-a22b'],
            deepseek: ['deepseek-chat'],
            kimi: ['moonshot-v1-8k'],
            ollama: ['deepseek-r1:14b','deepseek-r1:7b', 'qwen2.5vl:7b']
        };
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
    // 发送到通义千问
    async sendToQwen(message) {
        /*默认API KEY：sk-7616714ea81e434fba8e6e46aa42b5fb*/
        if (!this.apiKey) throw new Error('请设置通义千问API Key');
        
        const url = this.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.getAvailableModel('qwen'),
                messages: [{ role: 'user', content: message }],
                enable_thinking: false, // 需确保此处为false
                max_tokens: 5000,
                temperature: 0.7
            })
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

    // 发送到DeepSeek
    async sendToDeepSeek(message) {
        if (!this.apiKey) throw new Error('请设置DeepSeek API Key');
        
        const url = this.apiUrl || 'https://api.deepseek.com/v1/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.getAvailableModel('deepseek'),
                messages: [{ role: 'user', content: message }],
                max_tokens: 5000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API错误: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '未获取到响应';
    }

    // 发送到Kimi
    async sendToKimi(message) {
        if (!this.apiKey) throw new Error('请设置Kimi API Key');
        
        const url = this.apiUrl || 'https://api.moonshot.cn/v1/chat/completions';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.getAvailableModel('kimi'),
                messages: [{ role: 'user', content: message }],
                max_tokens: 5000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Kimi API错误: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '未获取到响应';
    }

    // 发送到本地Ollama
    async sendToOllama(message) {
        try {
            const url = `${this.ollamaUrl}/api/chat`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.getAvailableModel('ollama'),
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
}