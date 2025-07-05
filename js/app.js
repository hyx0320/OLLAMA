/**
 * AI 智能助手主应用类
 * 负责管理聊天界面、对话历史、用户交互等功能
 */
class ChatApp {
    constructor() {
        // 初始化 API 管理器，用于与不同的 AI 模型进行交互
        this.apiManager = new APIManager();

        // 应用状态变量
        this.messageIdCounter = 0;
        this.currentConversationId = null;
        this.isDarkMode = false;
        this.isThemeShowing = false;
        this.isApiShowing = false;

        // 初始化 UI 元素和事件
        this.initializeElements();
        this.bindEvents();

        // 加载应用状态
        this.loadSettings();
        this.loadConversations();
        this.updateAvailableModels();
        this.initializeThemeCustomizer();

        // 初始化邀请码相关元素
        this.inviteModal = document.getElementById('invite-modal');
        this.inviteCodeInput = document.getElementById('invite-code');
        this.submitInviteBtn = document.getElementById('submit-invite-btn');
        this.inviteError = document.getElementById('invite-error');
        this.tierHint = document.querySelector('.tier-hint');

        // 绑定邀请码验证事件
        this.bindInviteEvents();

        // 检查授权状态
        this.checkAuthorization();
    }

    /* ===================== */
    /* === 邀请码相关方法 === */
    /* ===================== */

    checkAuthorization() {
        const authData = this.getAuthData();

        if (authData?.tier === 'premium') {
            this.hideInviteModal();
            return;
        }

        if (authData?.tier === 'trial') {
            const isTrialValid = Date.now() - authData.timestamp < 3 * 24 * 60 * 60 * 1000;
            if (isTrialValid) {
                this.hideInviteModal();
                this.showToast(`试用版剩余时间: ${this.formatRemainingTime(authData.timestamp)}`);
                return;
            }
        }

        if (authData?.tier === 'standard') {
            this.hideInviteModal();
            return;
        }

        this.showInviteModal();
    }

    bindInviteEvents() {
        this.submitInviteBtn.addEventListener('click', () => this.verifyInvitationCode());
        this.inviteCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyInvitationCode();
        });

        this.inviteCodeInput.addEventListener('input', () => {
            const code = this.inviteCodeInput.value.trim();
            const tier = this.apiManager.validateInvitationCode(code);
            this.updateTierHint(tier);
        });
    }

    updateTierHint(tier) {
        this.tierHint.querySelectorAll('span').forEach(span => {
            span.style.display = 'none';
        });

        if (tier) {
            const tierElement = this.tierHint.querySelector(`[data-tier="${tier}"]`);
            if (tierElement) tierElement.style.display = 'inline-block';
        }
    }

    getAuthData() {
        return JSON.parse(
            localStorage.getItem('authData') ||
            sessionStorage.getItem('authData') ||
            'null'
        );
    }

    verifyInvitationCode() {
        const code = this.inviteCodeInput.value.trim();
        if (!code) {
            this.showError("请输入邀请码");
            return;
        }

        const tier = this.apiManager.validateInvitationCode(code);
        if (!tier) {
            this.showError("邀请码无效");
            return;
        }

        const authData = {
            tier,
            timestamp: Date.now(),
            code
        };

        if (tier === 'premium') {
            localStorage.setItem('authData', JSON.stringify(authData));
            this.showToast('🎉 已激活顶级版，永久有效');
        } else if (tier === 'trial') {
            localStorage.setItem('authData', JSON.stringify(authData));
            this.showToast(`⏳ 试用版已激活，剩余时间: ${this.formatRemainingTime(Date.now())}`);
        } else {
            sessionStorage.setItem('authData', JSON.stringify(authData));
            this.showToast('🔑 普通版已激活，当前会话有效');
        }

        this.hideInviteModal();
    }

    formatRemainingTime(startTime) {
        const remaining = 3 * 24 * 60 * 60 * 1000 - (Date.now() - startTime);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        return `${hours}小时`;
    }

    showError(message) {
        this.inviteError.textContent = message;
        this.inviteError.style.display = 'block';
        setTimeout(() => {
            this.inviteError.style.display = 'none';
        }, 3000);
    }

    showInviteModal() {
        this.inviteModal.classList.add('show');
        document.querySelector('.app-container').style.display = 'none';
        this.inviteCodeInput.focus();
    }

    hideInviteModal() {
        this.inviteModal.classList.remove('show');
        document.querySelector('.app-container').style.display = 'flex';
        this.inviteCodeInput.value = '';
    }

    /* ===================== */
    /* === 主题定制相关方法 === */
    /* ===================== */

    initializeThemeCustomizer() {
        this.themeSettings = {
            primaryColor: '#2196f3',
            bgColor: '#ffffff',
            sidebarColor: '#ffffff',
            messageColor: '#f5f5f5'
        };

        this.primaryColorInput = document.getElementById('primary-color');
        this.bgColorInput = document.getElementById('bg-color');
        this.sidebarColorInput = document.getElementById('sidebar-color');
        this.messageColorInput = document.getElementById('message-color');
        this.applyThemeBtn = document.getElementById('apply-theme-btn');
        this.resetThemeBtn = document.getElementById('reset-theme-btn');

        this.bindThemeEvents();
        this.loadThemeSettings();
    }

    bindThemeEvents() {
        this.applyThemeBtn.addEventListener('click', () => this.applyCustomTheme());
        this.resetThemeBtn.addEventListener('click', () => this.resetDefaultTheme());
    }

    applyCustomTheme() {
        this.themeSettings = {
            primaryColor: this.primaryColorInput.value,
            bgColor: this.bgColorInput.value,
            sidebarColor: this.sidebarColorInput.value,
            messageColor: this.messageColorInput.value
        };

        this.updateThemeVariables();
        this.saveThemeSettings();
        this.showToast('主题已应用');
    }

    resetDefaultTheme() {
        this.themeSettings = {
            primaryColor: '#2196f3',
            bgColor: '#ffffff',
            sidebarColor: '#ffffff',
            messageColor: '#f5f5f5'
        };

        this.primaryColorInput.value = this.themeSettings.primaryColor;
        this.bgColorInput.value = this.themeSettings.bgColor;
        this.sidebarColorInput.value = this.themeSettings.sidebarColor;
        this.messageColorInput.value = this.themeSettings.messageColor;

        this.updateThemeVariables();
        this.saveThemeSettings();
        this.showToast('已重置为默认主题');
    }

    updateThemeVariables() {
        document.documentElement.style.setProperty('--primary-color', this.themeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', this.darkenColor(this.themeSettings.primaryColor, 20));
        document.documentElement.style.setProperty('--bg-color', this.themeSettings.bgColor);
        document.documentElement.style.setProperty('--bg-secondary', this.lightenColor(this.themeSettings.bgColor, 5));
        document.querySelector('.sidebar').style.backgroundColor = this.themeSettings.sidebarColor;
        document.querySelector('.chat-messages').style.background = 
            `linear-gradient(to bottom, ${this.themeSettings.bgColor}, ${this.themeSettings.messageColor})`;
    }

    saveThemeSettings() {
        localStorage.setItem('ai_chat_theme', JSON.stringify(this.themeSettings));
    }

    loadThemeSettings() {
        const savedTheme = localStorage.getItem('ai_chat_theme');
        if (savedTheme) {
            this.themeSettings = JSON.parse(savedTheme);

            this.primaryColorInput.value = this.themeSettings.primaryColor;
            this.bgColorInput.value = this.themeSettings.bgColor;
            this.sidebarColorInput.value = this.themeSettings.sidebarColor;
            this.messageColorInput.value = this.themeSettings.messageColor;

            this.updateThemeVariables();
        }
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R < 0 ? 0 : R) * 0x10000 +
            (G < 0 ? 0 : G) * 0x100 +
            (B < 0 ? 0 : B)
        ).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B)
        ).toString(16).slice(1);
    }

    /* ===================== */
    /* === 元素初始化方法 === */
    /* ===================== */

    initializeElements() {
        // 核心聊天区域元素
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.chatTitle = document.getElementById('chat-title');
        this.chatList = document.getElementById('chat-list');

        // 配置相关元素
        this.apiKeyInput = document.getElementById('api-key');
        this.apiUrlInput = document.getElementById('api-url');
        this.ollamaUrlInput = document.getElementById('ollama-url');
        this.modelSelect = document.getElementById('model-select');
        this.availableModelSelect = document.getElementById('available-model-select');

        // 功能按钮元素
        this.renameChatBtn = document.getElementById('rename-chat-btn');
        this.exportChatBtn = document.getElementById('export-chat-btn');
        this.uploadFileBtn = document.getElementById('upload-file-btn');
        this.fileUpload = document.getElementById('file-upload');
        this.fileUploadHint = document.getElementById('file-upload-hint');
        this.webSearchBtn = document.getElementById('web-search-btn');
        this.deepThinkingBtn = document.getElementById('deep-thinking-btn');
        this.deleteChatBtn = document.getElementById('delete-chat-btn');

        // 模态框相关元素
        this.renameModal = document.getElementById('rename-modal');
        this.newChatTitleInput = document.getElementById('new-chat-title');
        this.cancelRenameBtn = document.getElementById('cancel-rename-btn');
        this.confirmRenameBtn = document.getElementById('confirm-rename-btn');

        // 侧边栏相关元素
        this.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        this.sidebar = document.querySelector('.sidebar');
        this.chatSearchInput = document.getElementById('chat-search');

        // 清除设置按钮
        this.clearSettingsBtn = document.getElementById('clear-settings-btn');

        // 新增的主题和API切换元素
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.apiToggleBtn = document.getElementById('api-toggle-btn');
        this.themeCustomizer = document.querySelector('.theme-customizer');
        this.apiConfig = document.querySelector('.api-config');
    }

    /* ===================== */
    /* === 事件绑定方法 === */
    /* ===================== */

    bindEvents() {
        this.bindMessageEvents();
        this.bindConversationEvents();
        this.bindFileEvents();
        this.bindFeatureEvents();
        this.bindConfigEvents();
        this.bindSidebarEvents();
        this.bindModalEvents();
        this.bindThemeToggleEvents();
    }

    bindMessageEvents() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    bindConversationEvents() {
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        this.renameChatBtn.addEventListener('click', () => this.showRenameModal());
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentConversation());
    }

    bindFileEvents() {
        this.uploadFileBtn.addEventListener('click', () => this.fileUpload.click());
        this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    bindFeatureEvents() {
        this.webSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.webSearchBtn.classList.toggle('active');
        });

        this.deepThinkingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deepThinkingBtn.classList.toggle('active');
        });

        this.exportChatBtn.addEventListener('click', () => this.exportConversation('markdown'));

        document.querySelectorAll('.dropdown-content a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportConversation(e.target.dataset.format);
            });
        });
    }

    bindConfigEvents() {
        this.modelSelect.addEventListener('change', (e) => {
            this.apiManager.setModel(e.target.value);
            this.saveSettings();
            this.updateAvailableModels();
        });

        this.apiKeyInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.apiUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.ollamaUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));

        this.clearSettingsBtn.addEventListener('click', () => this.clearSettings());
    }

    bindSidebarEvents() {
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.chatSearchInput.addEventListener('input', () => this.filterConversations());
    }

    bindModalEvents() {
        this.cancelRenameBtn.addEventListener('click', () => this.hideRenameModal());
        this.confirmRenameBtn.addEventListener('click', () => this.renameCurrentConversation());
    }

    bindThemeToggleEvents() {
        this.themeToggleBtn.addEventListener('click', () => this.toggleThemePanel());
        this.apiToggleBtn.addEventListener('click', () => this.toggleApiPanel());
    }

    /* ===================== */
    /* === 面板切换方法 === */
    /* ===================== */

    toggleThemePanel() {
        this.isThemeShowing = !this.isThemeShowing;
        this.themeCustomizer.style.display = this.isThemeShowing ? 'block' : 'none';
        this.themeToggleBtn.classList.toggle('active');
        
        if (this.isThemeShowing && this.isApiShowing) {
            this.apiConfig.style.display = 'none';
            this.apiToggleBtn.classList.remove('active');
            this.isApiShowing = false;
        }
        
        const toggleText = this.themeToggleBtn.querySelector('.api-toggle-text');
        toggleText.textContent = this.isThemeShowing ? '隐藏主题设置' : '显示主题设置';
    }

    toggleApiPanel() {
        this.isApiShowing = !this.isApiShowing;
        this.apiConfig.style.display = this.isApiShowing ? 'block' : 'none';
        this.apiToggleBtn.classList.toggle('active');
        
        if (this.isApiShowing && this.isThemeShowing) {
            this.themeCustomizer.style.display = 'none';
            this.themeToggleBtn.classList.remove('active');
            this.isThemeShowing = false;
        }
        
        const toggleText = this.apiToggleBtn.querySelector('.api-toggle-text');
        toggleText.textContent = this.isApiShowing ? '隐藏API设置' : '显示API设置';
    }

    /* ===================== */
    /* === 侧边栏相关方法 === */
    /* ===================== */

    toggleSidebar() {
        this.sidebar.classList.toggle('hidden');

        const sidebarIcon = this.toggleSidebarBtn.querySelector('.sidebar-icon');
        const sidebarText = this.toggleSidebarBtn.querySelector('.sidebar-text');

        if (this.sidebar.classList.contains('hidden')) {
            sidebarIcon.textContent = '☰';
            sidebarText.textContent = '显示侧边栏';
        } else {
            sidebarIcon.textContent = '✕';
            sidebarText.textContent = '隐藏侧边栏';
        }

        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('show');
        }
    }

    /* ===================== */
    /* === 消息处理相关方法 === */
    /* ===================== */

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        if (!this.currentConversationId) {
            const defaultTitle = message.length > 20 ? message.substring(0, 20) + '...' : message;
            this.saveCurrentConversation(defaultTitle, true);
        }

        this.addMessage('user', message);
        this.messageInput.value = '';

        const loadingId = this.addMessage('assistant', '', true);
        const loadingDiv = document.getElementById(loadingId);
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'thinking-container';
        loadingDiv.querySelector('.message-content').appendChild(thinkingContainer);

        try {
            const selectedModel = this.availableModelSelect.value;
            this.apiManager.setModel(this.modelSelect.value);
            this.apiManager.getAvailableModel = () => selectedModel;

            let response;
            if (this.deepThinkingBtn.classList.contains('active')) {
                response = await this.apiManager.sendMessageWithThinking(
                    message,
                    (thinkingStep) => {
                        const stepElement = document.createElement('div');
                        stepElement.className = 'thinking-process';
                        stepElement.textContent = thinkingStep;
                        thinkingContainer.appendChild(stepElement);
                        this.scrollToBottom();
                    }
                );
            } else {
                const dots = '<div class="loading-dots"><span></span><span></span><span></span></div>';
                loadingDiv.querySelector('.message-content').innerHTML = dots;

                if (this.webSearchBtn.classList.contains('active')) {
                    response = await this.apiManager.sendMessageWithWebSearch(message);
                    this.webSearchBtn.classList.remove('active');
                } else {
                    response = await this.apiManager.sendMessage(message);
                }
            }

            this.updateMessage(loadingId, response);
            this.updateConversationHistory();
        } catch (error) {
            console.error('发送消息失败:', error);
            let errorMsg = `❌ 错误: ${error.message}`;
            if (error.message.includes('Failed to fetch')) {
                errorMsg = '❌ 网络请求失败，请检查:\n';
                errorMsg += '1. API密钥是否正确\n';
                errorMsg += '2. API地址是否正确\n';
                errorMsg += '3. 网络连接是否正常\n';
                if (this.apiManager.currentModel === 'ollama') {
                    errorMsg += '4. Ollama服务是否已启动\n';
                }
                errorMsg += `\n详细错误: ${error.message}`;
            }
            this.updateMessage(loadingId, errorMsg);
        }
    }

    addMessage(role, content, isLoading = false) {
        const messageId = `msg_${++this.messageIdCounter}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.id = messageId;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isLoading) {
            messageContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        } else {
            messageContent.innerHTML = marked.parse(content);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制';
        copyBtn.addEventListener('click', () => this.copyToClipboard(messageContent.textContent));

        actionsDiv.appendChild(copyBtn);

        if (role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = '编辑';
            editBtn.addEventListener('click', () => this.editMessage(messageId));
            actionsDiv.appendChild(editBtn);
        }

        messageDiv.appendChild(timeDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(actionsDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageId;
    }

    updateMessage(messageId, content) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            const contentEl = messageDiv.querySelector('.message-content');
            contentEl.innerHTML = marked.parse(content);
        }
    }

    editMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const contentEl = messageDiv.querySelector('.message-content');
        const originalContent = contentEl.textContent;

        const textarea = document.createElement('textarea');
        textarea.value = originalContent;
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.marginTop = '10px';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', () => {
            this.updateMessage(messageId, textarea.value);
            this.updateConversationHistory();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            contentEl.innerHTML = marked.parse(originalContent);
        });

        buttonsDiv.appendChild(saveBtn);
        buttonsDiv.appendChild(cancelBtn);

        contentEl.innerHTML = '';
        contentEl.appendChild(textarea);
        contentEl.appendChild(buttonsDiv);
        textarea.focus();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showToast('复制失败');
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }, 100);
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /* ===================== */
    /* === 文件处理相关方法 === */
    /* ===================== */

    /**
 * 处理文件上传
 * @param {Event} e - 文件上传事件
 */
async handleFileUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    this.fileUpload.value = ''; // 重置文件输入

    for (const file of files) {
        // 创建状态容器
        const statusContainer = document.createElement('div');
        
        try {
            // 1. 显示处理中状态
            statusContainer.className = 'file-status processing';
            statusContainer.textContent = `🔄 正在处理文件: ${file.name}...`;
            this.fileUploadHint.innerHTML = '';
            this.fileUploadHint.appendChild(statusContainer);
            this.fileUploadHint.style.display = 'block';

            // 2. 添加用户消息（显示文件信息）
            this.addMessage('user', `📄 上传了文件: ${file.name} (${this.formatFileSize(file.size)})`);

            // 3. 添加加载中的AI回复
            const loadingId = this.addMessage('assistant', '', true);

            // 4. 读取文件内容
            const { content, status } = await this.readFileContent(file);
            
            // 5. 更新状态提示
            if (status === 'success') {
                statusContainer.className = 'file-status success';
                statusContainer.textContent = `✅ 成功读取文件: ${file.name}`;
            } else {
                statusContainer.className = 'file-status error';
                statusContainer.textContent = `⚠️ 部分内容读取受限: ${file.name}`;
            }

            // 6. 构建明确的提示词
            const prompt = this.buildFilePrompt(file, content, status);
            
            // 7. 发送给AI处理
            const response = await this.apiManager.sendMessage(prompt);
            
            // 8. 更新AI回复
            this.updateMessage(loadingId, response);
            
            // 9. 更新对话历史
            this.updateConversationHistory();
        } catch (error) {
            console.error('文件处理错误:', error);
            statusContainer.className = 'file-status error';
            statusContainer.textContent = `❌ 处理失败: ${file.name} (${error.message})`;
            this.addMessage('assistant', `❌ 无法处理文件: ${error.message}`);
        }
    }
}

/**
 * 构建文件分析提示词
 */
buildFilePrompt(file, content, status) {
    let prompt = `你是一个文件分析助手。已收到用户上传的文件：
文件名: ${file.name}
文件大小: ${this.formatFileSize(file.size)}
文件类型: ${file.type || '未知'}
`;

    if (status === 'success') {
        prompt += `\n文件状态: ✅ 已成功读取完整内容\n\n`;
        prompt += `### 请执行以下操作：
1. 确认文件类型和大小
2. 总结文件主要内容
3. 提取关键信息/数据
4. 回答文件中包含的任何问题

文件内容：
\`\`\`
${content}
\`\`\``;
    } else {
        prompt += `\n文件状态: ⚠️ 仅部分内容可用\n\n`;
        prompt += `### 请基于可用内容：
1. 说明文件类型限制
2. 分析已有内容
3. 建议如何获取完整分析

可用内容：
\`\`\`
${content}
\`\`\``;
    }

    return prompt;
}

/**
 * 读取文件内容（增强版）
 */
async readFileContent(file) {
    try {
        // 1. 验证文件类型
        if (!this.isValidFileType(file)) {
            throw new Error('不支持的文件类型');
        }

        // 2. 验证文件大小 (10MB限制)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('文件大小超过10MB限制');
        }

        // 3. 读取内容
        const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });

        // 4. 处理特殊文件类型
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            return {
                content: "[PDF文件内容]\n注意：当前版本无法直接解析PDF文本内容。\n建议：复制文本内容粘贴或转换为文本文件上传。",
                status: 'partial'
            };
        }

        return {
            content: content.substring(0, 20000), // 限制长度
            status: 'success'
        };
    } catch (error) {
        console.error(`文件读取错误: ${file.name}`, error);
        throw error;
    }
}

/**
 * 验证文件类型
 */
isValidFileType(file) {
    const allowedTypes = [
        'text/plain', 'text/markdown', 'application/json',
        'text/csv', 'application/pdf'
    ];
    
    const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.pdf'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    return allowedTypes.includes(file.type) || 
           allowedExtensions.includes(extension);
}

    /**
     * 处理文件内容
     */
    processFileContent(file, content) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        // 简单处理Office文件 - 实际项目应该使用专业库
        if (['docx', 'xlsx', 'pptx'].includes(extension)) {
            return `[${extension.toUpperCase()}文件内容提取]\n` +
                '由于技术限制，无法直接解析Office文件内容。\n' +
                '建议将内容复制为文本后上传。';
        }
        
        // 处理PDF文件
        if (file.type === 'application/pdf' || extension === '.pdf') {
            return content; // 实际应该返回提取的文本
        }
        
        // 其他文本文件直接返回
        return content;
    }

    /**
     * 读取PDF内容 (简化版)
     */
    readPDFContent(file, reader, resolve, reject) {
        // 实际项目应该使用PDF.js等库提取文本
        // 这里简化处理，只返回基本信息
        reader.readAsDataURL(file);
        resolve(`[PDF文件 - ${file.name}]\n` +
            '由于技术限制，无法直接解析PDF内容。\n' +
            '建议将内容复制为文本后上传。');
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /* ===================== */
    /* === 对话管理相关方法 === */
    /* ===================== */

    /**
     * 创建新对话
     */
    createNewChat() {
        // 如果当前对话有消息但未保存，先保存
        if (this.chatMessages.children.length > 0 && !this.currentConversationId) {
            this.saveCurrentConversation('未命名对话');
        }

        // 清空聊天区域
        this.chatMessages.innerHTML = '';
        // 重置当前对话 ID
        this.currentConversationId = null;
        // 设置聊天标题为新对话
        this.chatTitle.textContent = '新对话';

        // 创建一个新的自动保存对话
        this.currentConversationId = Date.now().toString();
    }

    /**
     * 保存当前对话
     * @param {string} title - 对话标题
     * @param {boolean} autoSave - 是否为自动保存
     */
    saveCurrentConversation(title = '', autoSave = false) {
        const messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
            return {
                role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                content: msg.querySelector('.message-content').textContent,
                timestamp: msg.querySelector('.message-time').textContent
            };
        });

        if (messages.length === 0) {
            if (!autoSave) {
                this.showToast('没有可保存的消息');
            }
            return;
        }

        // 如果没有提供标题，使用第一条消息的前 20 个字符
        if (!title && messages.length > 0) {
            title = messages[0].content.substring(0, 20);
            if (messages[0].content.length > 20) title += '...';
        }

        // 如果是自动保存且没有标题，使用默认标题
        if (autoSave && !title) {
            title = `对话 ${new Date().toLocaleDateString()}`;
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

    /**
     * 加载对话列表
     */
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

    /**
     * 过滤对话列表
     */
    filterConversations() {
        const searchTerm = this.chatSearchInput.value.toLowerCase();
        const items = this.chatList.querySelectorAll('.conversation-item');

        items.forEach(item => {
            const title = item.textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    /**
     * 创建对话列表项
     * @param {Object} conv - 对话对象
     * @returns {HTMLElement} 对话列表项元素
     */
    createConversationItem(conv) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        if (conv.id === this.currentConversationId) {
            item.classList.add('active');
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'conversation-title';
        titleSpan.textContent = conv.title;

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.textContent = '🗑️';
        deleteIcon.title = '删除';

        item.appendChild(titleSpan);
        item.appendChild(deleteIcon);

        item.addEventListener('click', () => this.loadConversation(conv.id));
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteConversation(conv.id);
        });

        return item;
    }

    /**
     * 加载指定对话
     * @param {string} id - 对话 ID
     */
    loadConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const conversation = conversations.find(c => c.id === id);
        if (!conversation) return;

        // 清空聊天区域
        this.chatMessages.innerHTML = '';
        // 添加对话中的消息到聊天区域
        conversation.messages.forEach(msg => {
            this.addMessage(msg.role, msg.content);
        });

        // 设置聊天标题为对话标题
        this.chatTitle.textContent = conversation.title;
        // 更新当前对话 ID
        this.currentConversationId = id;

        // 更新对话列表中的活动项
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = [...document.querySelectorAll('.conversation-item')]
           .find(item => item.querySelector('.conversation-title').textContent === conversation.title);

        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * 更新对话历史
     */
    updateConversationHistory() {
        if (!this.currentConversationId) return;

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === this.currentConversationId);

        if (index !== -1) {
            conversations[index].messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
                return {
                    role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                    content: msg.querySelector('.message-content').textContent,
                    timestamp: msg.querySelector('.message-time').textContent
                };
            });
            localStorage.setItem('conversations', JSON.stringify(conversations));
        }
    }

    /**
     * 显示重命名模态框
     */
    showRenameModal() {
        if (!this.currentConversationId) {
            this.showToast('请先创建一个对话');
            return;
        }

        // 设置重命名输入框的值为当前对话标题
        this.newChatTitleInput.value = this.chatTitle.textContent;
        // 显示重命名模态框
        this.renameModal.style.display = 'flex';
        // 重命名输入框获取焦点
        this.newChatTitleInput.focus();
    }

    /**
     * 隐藏重命名模态框
     */
    hideRenameModal() {
        this.renameModal.style.display = 'none';
    }

    /**
     * 重命名当前对话
     */
    renameCurrentConversation() {
        const newTitle = this.newChatTitleInput.value.trim();
        if (!newTitle) {
            this.showToast('标题不能为空');
            return;
        }

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === this.currentConversationId);

        if (index !== -1) {
            conversations[index].title = newTitle;
            localStorage.setItem('conversations', JSON.stringify(conversations));
            this.chatTitle.textContent = newTitle;
            this.loadConversations();
            this.hideRenameModal();
        }
    }

    /**
     * 删除当前对话
     */
    deleteCurrentConversation() {
        if (!this.currentConversationId) {
            this.showToast('当前没有可删除的对话');
            return;
        }

        if (confirm('确定要删除当前对话吗？此操作不可撤销。')) {
            this.deleteConversation(this.currentConversationId);
            this.createNewChat();
        }
    }

    /**
     * 删除指定对话
     * @param {string} id - 对话 ID
     */
    deleteConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const newConversations = conversations.filter(c => c.id !== id);
        localStorage.setItem('conversations', JSON.stringify(newConversations));
        this.loadConversations();

        if (this.currentConversationId === id) {
            this.createNewChat();
        }

        this.showToast('对话已删除');
    }

    /**
     * 导出对话
     * @param {string} format - 导出格式 (markdown/pdf/text)
     */
    exportConversation(format) {
        if (!this.currentConversationId) {
            this.showToast('没有可导出的对话');
            return;
        }

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const conversation = conversations.find(c => c.id === this.currentConversationId);
        if (!conversation) return;

        let content = '';
        const title = `# ${conversation.title}\n\n`;

        if (format === 'markdown') {
            content = title + conversation.messages.map(msg => {
                return `**${msg.role === 'user' ? '用户' : '助手'} (${msg.timestamp})**:\n${msg.content}\n`;
            }).join('\n');

            this.downloadFile(`${conversation.title}.md`, content);
        } else if (format === 'pdf') {
            // 实际实现需要使用 PDF 生成库，这里简化处理
            this.showToast('PDF 导出功能将在后续版本实现');
        } else if (format === 'text') {
            content = conversation.title + '\n\n' + conversation.messages.map(msg => {
                return `${msg.role === 'user' ? '用户' : '助手'} (${msg.timestamp}): ${msg.content}`;
            }).join('\n\n');

            this.downloadFile(`${conversation.title}.txt`, content);
        }
    }

    /**
     * 下载文件
     * @param {string} filename - 文件名
     * @param {string} content - 文件内容
     */
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* ===================== */
    /* === 配置管理相关方法 === */
    /* ===================== */

    /**
     * 更新可用模型选项
     */
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

    /**
     * 处理配置变更
     * @param {Event} e - 输入事件
     */
    handleConfigChange(e) {
        const { id, value } = e.target;
        if (id === 'api-key') this.apiManager.setApiKey(value);
        if (id === 'api-url') this.apiManager.setApiUrl(value);
        if (id === 'ollama-url') this.apiManager.setOllamaUrl(value);
        this.saveSettings();
    }

    /**
     * 保存配置（移除 darkMode 保存）
     */
    saveSettings() {
        const settings = {
            apiKey: this.apiKeyInput.value,
            apiUrl: this.apiUrlInput.value,
            ollamaUrl: this.ollamaUrlInput.value || 'http://localhost:11434',
            currentModel: this.modelSelect.value
            // 不保存 darkMode
        };
        localStorage.setItem('ai_chat_settings', JSON.stringify(settings));
    }

    /**
     * 加载配置（移除 darkMode 加载）
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('ai_chat_settings') || '{}');
            if (settings.apiKey) this.apiKeyInput.value = settings.apiKey;
            if (settings.apiUrl) this.apiUrlInput.value = settings.apiUrl;
            if (settings.ollamaUrl) this.ollamaUrlInput.value = settings.ollamaUrl;
            if (settings.currentModel) this.modelSelect.value = settings.currentModel;
            // 不加载 darkMode

            // 初始化 API 管理器
            this.apiManager.setApiKey(settings.apiKey || '');
            this.apiManager.setApiUrl(settings.apiUrl || '');
            this.apiManager.setOllamaUrl(settings.ollamaUrl || 'http://localhost:11434');
            this.apiManager.setModel(settings.currentModel || 'qwen');
            this.updateAvailableModels();
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }

    /**
     * 清除所有设置和会话历史
     */
    clearSettings() {
        if (confirm('确定要清除所有设置和会话历史吗？此操作不可撤销。')) {
            localStorage.clear();
            this.loadSettings();
            this.loadConversations();
            this.createNewChat();
            this.showToast('已清除所有设置和会话历史');
        }
    }
}

let app;
// 初始化应用
window.onload = function() {
    // 这里直接给全局作用域的 app 变量赋值
    app = new ChatApp();
    // 由于在 ChatApp 构造函数中已经调用了 bindEvents 方法，这里的 bindMessageEvents 可以移除
    // app.bindMessageEvents(); 
    app.loadSettings();
    // 其他初始化代码
};