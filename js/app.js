class ChatApp {
    constructor() {
        this.apiManager = new APIManager();
        this.messageIdCounter = 0;
        this.currentConversationId = null;
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.loadConversations();
        this.updateAvailableModels(); // 初始化可用模型选项
    }

    // 初始化DOM元素
    initializeElements() {
        // 核心元素
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.chatTitle = document.getElementById('chat-title');
        this.chatList = document.getElementById('chat-list');
        
        // 配置元素
        this.apiKeyInput = document.getElementById('api-key');
        this.apiUrlInput = document.getElementById('api-url');
        this.ollamaUrlInput = document.getElementById('ollama-url');
        this.clearSettingsBtn = document.getElementById('clear-settings-btn');
        this.modelSelect = document.getElementById('model-select');
        this.availableModelSelect = document.getElementById('available-model-select'); // 新增
        
        // 功能按钮
        this.saveChatBtn = document.getElementById('save-chat-btn');
        this.uploadFileBtn = document.getElementById('upload-file-btn');
        this.fileUpload = document.getElementById('file-upload');
        // 新增删除会话按钮
        this.deleteChatBtn = document.getElementById('delete-chat-btn'); 
        // 新增切换侧边栏按钮
        this.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        this.sidebar = document.querySelector('.sidebar');
    }

    // 绑定事件
    bindEvents() {
        // 消息发送
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 会话管理
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.saveChatBtn.addEventListener('click', () => this.saveCurrentConversation());
        this.uploadFileBtn.addEventListener('click', () => this.fileUpload.click());
        this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));

        // 模型切换
        this.modelSelect.addEventListener('change', (e) => {
            this.apiManager.setModel(e.target.value);
            this.saveSettings();
            this.updateAvailableModels(); // 更新可用模型选项
        });

        // 配置管理
        this.apiKeyInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.apiUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.ollamaUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.clearSettingsBtn.addEventListener('click', () => this.clearAllSettings());

        // 删除会话按钮事件
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentConversation()); 
        // 新增切换侧边栏按钮事件
        this.toggleSidebarBtn.addEventListener('click', () => {
            this.sidebar.classList.toggle('hidden');
        });
    }

    // 配置变更处理
    handleConfigChange(e) {
        const { id, value } = e.target;
        if (id === 'api-key') this.apiManager.setApiKey(value);
        if (id === 'api-url') this.apiManager.setApiUrl(value);
        if (id === 'ollama-url') this.apiManager.setOllamaUrl(value);
        this.saveSettings();
    }

    // 发送消息
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.messageInput.value = '';
        const loadingId = this.addMessage('assistant', '<div class="loading-dots"><span></span><span></span><span></span></div>', true);

        try {
            // 获取用户选择的具体模型
            const selectedModel = this.availableModelSelect.value;
            this.apiManager.setModel(this.modelSelect.value); // 设置 API 类型
            this.apiManager.getAvailableModel = () => selectedModel; // 临时覆盖 getAvailableModel 方法，确保使用选择的模型
            // 修改此处，使用添加Markdown提示后的消息
            const response = await this.apiManager.sendMessage(message);
            this.updateMessage(loadingId, response);
            this.updateConversationHistory();
        } catch (error) {
            this.updateMessage(loadingId, `❌ 错误: ${error.message}`);
        }
    }



    // 添加消息到界面
    addMessage(role, content, isLoading = false) {
        const messageId = `msg_${++this.messageIdCounter}`;
        const messageDiv = this.createMessageDiv(role, messageId);
        const avatar = this.createAvatar(role);
        const messageContent = this.createMessageContent(content);
        const copyButton = this.createCopyButton(messageContent);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(copyButton); // 将复制按钮添加到消息框中
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageId;
    }

    // 创建消息元素
    createMessageDiv(role, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.id = messageId;
        return messageDiv;
    }

    // 创建头像元素
    createAvatar(role) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';
        return avatar;
    }

    // 创建消息内容元素
    createMessageContent(content) {
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = content;
        return messageContent;
    }

    // 创建复制按钮
    createCopyButton(messageContent) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '复制';
        copyButton.addEventListener('click', () => {
            const textToCopy = messageContent.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('复制成功');
            }).catch((error) => {
                console.error('复制失败:', error);
            });
        });
        return copyButton;
    }

    // 修改updateMessage方法，添加格式验证
    updateMessage(messageId, content) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            const contentEl = messageDiv.querySelector('.message-content');
            
            // 验证是否包含Markdown特征（如#、-、`等）
            const isMarkdown = /[#*_-`]/.test(content);
            if (!isMarkdown) {
                // 强制转换为Markdown格式（简单处理）
                content = `### 响应内容\n\n${content.replace(/\n/g, '\n- ')}`;
            }
            
            contentEl.innerHTML = marked.parse(content);
        }

    }
    // 滚动到底部
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // 新建会话
    createNewChat() {
        this.chatMessages.innerHTML = '';
        this.chatTitle.textContent = '新对话';
        this.currentConversationId = null;
    }

    // 处理文件上传
    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 简单文件类型验证
        const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown'];
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
            alert('仅支持文本、PDF和Markdown文件');
            return;
        }

        this.addMessage('user', `📄 上传了文件: ${file.name}`);
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result.substring(0, 5000); // 限制最大长度
            const loadingId = this.addMessage('assistant', '<div class="loading-dots"><span></span><span></span><span></span></div>', true);
            
            try {
                const response = await this.apiManager.sendMessage(`请处理以下文件内容: \n${content}`);
                this.updateMessage(loadingId, response);
            } catch (error) {
                this.updateMessage(loadingId, `❌ 处理文件失败: ${error.message}`);
            }
        };

        // 根据文件类型选择读取方式
        if (file.type === 'application/pdf') {
            alert('PDF文件支持将在后续版本更新');
            this.fileUpload.value = '';
        } else {
            reader.readAsText(file);
        }
    }

    // 保存当前会话
    saveCurrentConversation() {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
            return {
                role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                content: msg.querySelector('.message-content').innerText
            };
        });

        if (messages.length === 0) {
            alert('没有可保存的消息');
            return;
        }

        const title = prompt('请输入会话标题:', `会话_${new Date().toLocaleDateString()}`);
        if (!title) return;

        const conversation = {
            id: Date.now().toString(),
            title,
            timestamp: new Date().toISOString(),
            messages
        };

        // 保存到本地存储
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        conversations.push(conversation);
        localStorage.setItem('conversations', JSON.stringify(conversations));
        
        this.loadConversations();
        this.currentConversationId = conversation.id;
    }

    // 加载会话列表
    loadConversations() {
        this.chatList.innerHTML = '';
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        
        // 按时间倒序排列
        conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(conv => {
                const item = this.createConversationItem(conv);
                this.chatList.appendChild(item);
            });
    }

    // 创建会话列表项
    createConversationItem(conv) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        item.textContent = conv.title;
        item.addEventListener('click', () => this.loadConversation(conv.id));

        // 新增删除图标
        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.textContent = '🗑️';
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteConversation(conv.id);
        });
        item.appendChild(deleteIcon);

        return item;
    }

    // 加载指定会话
    loadConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const conversation = conversations.find(c => c.id === id);
        if (!conversation) return;

        this.chatMessages.innerHTML = '';
        conversation.messages.forEach(msg => {
            this.addMessage(msg.role, msg.content);
        });

        this.chatTitle.textContent = conversation.title;
        this.currentConversationId = id;
    }

    // 更新会话历史
    updateConversationHistory() {
        if (!this.currentConversationId) return;

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === this.currentConversationId);
        
        if (index !== -1) {
            conversations[index].messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
                return {
                    role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                    content: msg.querySelector('.message-content').innerText
                };
            });
            localStorage.setItem('conversations', JSON.stringify(conversations));
        }
    }

    // 保存配置
    saveSettings() {
        const settings = {
            apiKey: this.apiKeyInput.value,
            apiUrl: this.apiUrlInput.value,
            ollamaUrl: this.ollamaUrlInput.value || 'http://localhost:11434',
            currentModel: this.modelSelect.value
        };
        localStorage.setItem('ai_chat_settings', JSON.stringify(settings));
        this.apiManager.setModel(this.modelSelect.value);
    }

    // 加载配置
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('ai_chat_settings') || '{}');
            if (settings.apiKey) this.apiKeyInput.value = settings.apiKey;
            if (settings.apiUrl) this.apiUrlInput.value = settings.apiUrl;
            if (settings.ollamaUrl) this.ollamaUrlInput.value = settings.ollamaUrl;
            if (settings.currentModel) this.modelSelect.value = settings.currentModel;

            // 初始化API管理器
            this.apiManager.setApiKey(settings.apiKey || '');
            this.apiManager.setApiUrl(settings.apiUrl || '');
            this.apiManager.setOllamaUrl(settings.ollamaUrl || 'http://localhost:11434');
            this.apiManager.setModel(settings.currentModel || 'qwen');
            this.updateAvailableModels(); // 更新可用模型选项
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }

    // 清除所有配置
    clearAllSettings() {
        if (confirm('确定要清除所有配置和会话记录吗？')) {
            localStorage.removeItem('ai_chat_settings');
            localStorage.removeItem('conversations');
            this.apiKeyInput.value = '';
            this.apiUrlInput.value = '';
            this.ollamaUrlInput.value = '';
            this.createNewChat();
            this.loadConversations();
            this.apiManager = new APIManager();
        }
    }

    // 删除当前会话
    deleteCurrentConversation() {
        if (!this.currentConversationId) {
            alert('当前没有可删除的会话');
            return;
        }

        if (confirm('确定要删除当前会话吗？')) {
            this.deleteConversation(this.currentConversationId);
            this.createNewChat();
        }
    }

    // 删除指定会话
    deleteConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const newConversations = conversations.filter(c => c.id !== id);
        localStorage.setItem('conversations', JSON.stringify(newConversations));
        this.loadConversations();

        if (this.currentConversationId === id) {
            this.createNewChat();
        }
    }

    // 更新可用模型选项
    updateAvailableModels() {
        const selectedAPI = this.modelSelect.value;
        const availableModels = this.apiManager.getAvailableModelsForAPI(selectedAPI);
        this.availableModelSelect.innerHTML = '';

        availableModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this.availableModelSelect.appendChild(option);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChatApp();
});