class APIManager {
    constructor() {
        this.currentModel = 'qwen';
        this.apiKey = '';
        this.apiUrl = '';
        this.ollamaUrl = 'http://localhost:11434';
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

    // 发送消息（统一入口）
    async sendMessage(message) {
        switch (this.currentModel) {
            case 'qwen':
                return this.sendToQwen(message);
            case 'deepseek':
                return this.sendToDeepSeek(message);
            case 'kimi':
                return this.sendToKimi(message);
            case 'ollama':
                return this.sendToOllama(message);
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
                model: 'qwen3-235b-a22b',
                messages: [{ role: 'user', content: message }],
                enable_thinking: false, // 需确保此处为false
                max_tokens: 1000,
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
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: message }],
                max_tokens: 1000,
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
                model: 'moonshot-v1-8k',
                messages: [{ role: 'user', content: message }],
                max_tokens: 1000,
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
                    model: 'deepseek-r1:14b', // 根据实际安装情况修改
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
}