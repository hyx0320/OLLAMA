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
        this.webSearchBtn = document.getElementById('web-search-btn');

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
        this.webSearchBtn.addEventListener('click', () => this.sendMessageWithWebSearch());

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

        this.webSearchBtn.addEventListener('click', (e) => {
        // 阻止默认行为，因为我们只需要切换开关状态
            e.preventDefault();
            this.webSearchBtn.classList.toggle('active');
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

    // 修改 sendMessage 方法
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 如果是新对话的第一个消息，自动保存并使用第一个问题作为标题
        if (this.currentConversationId && !this.chatMessages.children.length) {
            const defaultTitle = message.length > 20 ? message.substring(0, 20) + '...' : message;
            this.saveCurrentConversation(defaultTitle, true);
        }

        this.addMessage('user', message);
        this.messageInput.value = '';
        const loadingId = this.addMessage('assistant', '<div class="loading-dots"><span></span><span></span><span></span></div>', true);

        try {
            const selectedModel = this.availableModelSelect.value;
            this.apiManager.setModel(this.modelSelect.value);
            this.apiManager.getAvailableModel = () => selectedModel;
            const response = await this.apiManager.sendMessage(message);
            this.updateMessage(loadingId, response);
            this.updateConversationHistory();
        } catch (error) {
            this.updateMessage(loadingId, `❌ 错误: ${error.message}`);
        }
    }

    // 修改 sendMessageWithWebSearch 方法，检查开关状态
    async sendMessageWithWebSearch() {
        // 检查开关是否激活
        if (!this.webSearchBtn.classList.contains('active')) {
            return; // 如果开关未激活，不执行搜索
        }
        
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 添加搜索状态指示
        const searchStatusId = this.addMessage('system', 
            '<div class="search-status searching">🔍 正在联网搜索最新信息...</div>');

        try {
            const response = await this.apiManager.sendMessageWithWebSearch(message);
            
            // 更新搜索状态
            this.updateMessage(searchStatusId, 
                '<div class="search-status success">✅ 已获取最新搜索结果</div>');
            
            // 添加搜索结果
            this.addMessage('assistant', response);
            
            // 自动保存搜索会话
            if (!this.currentConversationId) {
                const title = `搜索: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`;
                this.saveCurrentConversation(title, true);
            }
        } catch (error) {
            this.updateMessage(searchStatusId, 
                `<div class="search-status error">❌ 搜索失败: ${error.message}</div>`);
        } finally {
            this.messageInput.value = '';
            // 搜索完成后关闭开关
            this.webSearchBtn.classList.remove('active');
        }
    }

    // 修改addMessage方法，添加搜索标识
    addMessage(role, content, isLoading = false) {
        const messageId = `msg_${++this.messageIdCounter}`;
        const messageDiv = this.createMessageDiv(role, messageId);
        const avatar = this.createAvatar(role);
        const messageContent = this.createMessageContent(content);
        const copyButton = this.createCopyButton(messageContent);

        // 如果是联网搜索的回复，添加标识
        if (content.includes('🔍')) {
            const searchIndicator = document.createElement('span');
            searchIndicator.className = 'search-indicator';
            searchIndicator.innerHTML = '<span class="search-icon">🔍</span> 联网搜索';
            messageContent.appendChild(searchIndicator);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(copyButton);
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

    // 修改 createNewChat 方法
    createNewChat() {
        // 如果当前对话有消息但未保存，先保存
        if (this.chatMessages.children.length > 0 && !this.currentConversationId) {
            this.saveCurrentConversation('自动保存的对话');
        }
        
        this.chatMessages.innerHTML = '';
        this.chatTitle.textContent = '新对话';
        this.currentConversationId = null;
        
        // 创建一个新的自动保存对话
        this.currentConversationId = Date.now().toString();
        this.chatTitle.textContent = '新对话 (未命名)';
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

    // 修改 saveCurrentConversation 方法，添加 autoSave 参数
    saveCurrentConversation(defaultTitle = '', autoSave = false) {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
            return {
                role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                content: msg.querySelector('.message-content').innerText
            };
        });

        if (messages.length === 0) {
            if (!autoSave) {
                alert('没有可保存的消息');
            }
            return;
        }

        let title = defaultTitle;
        if (!autoSave) {
            title = prompt('请输入会话标题:', title || `会话_${new Date().toLocaleDateString()}`);
            if (!title) return;
        }

        const conversation = {
            id: this.currentConversationId || Date.now().toString(),
            title,
            timestamp: new Date().toISOString(),
            messages
        };

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const existingIndex = conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex !== -1) {
            conversations[existingIndex] = conversation;
        } else {
            conversations.push(conversation);
        }
        
        localStorage.setItem('conversations', JSON.stringify(conversations));
        this.loadConversations();
        this.currentConversationId = conversation.id;
        this.chatTitle.textContent = conversation.title;
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