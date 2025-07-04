/**
 * AI 智能助手主应用类
 * 负责管理聊天界面、对话历史、用户交互等功能
 */
class ChatApp {
    constructor() {
        // 初始化 API 管理器，用于与不同的 AI 模型进行交互
        this.apiManager = new APIManager();

        // 应用状态变量
        // 消息 ID 计数器，用于唯一标识每条消息
        this.messageIdCounter = 0;
        // 当前对话的 ID
        this.currentConversationId = null;
        // 是否为黑暗模式，默认是白天模式
        this.isDarkMode = false;

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

    // 检查授权状态
    checkAuthorization() {
        const authData = this.getAuthData();

        // 顶级版验证（永久有效）
        if (authData?.tier === 'premium') {
            this.hideInviteModal();
            return;
        }

        // 试用版验证（检查是否在 3 天内）
        if (authData?.tier === 'trial') {
            const isTrialValid = Date.now() - authData.timestamp < 3 * 24 * 60 * 60 * 1000;
            if (isTrialValid) {
                this.hideInviteModal();
                this.showToast(`试用版剩余时间: ${this.formatRemainingTime(authData.timestamp)}`);
                return;
            }
        }

        // 普通版检查会话存储
        if (authData?.tier === 'standard') {
            this.hideInviteModal();
            return;
        }

        // 未授权用户显示邀请码输入
        this.showInviteModal();
    }

    /* ===================== */
    /* === 邀请码相关方法 === */
    /* ===================== */

    /**
     * 绑定邀请码事件
     */
    bindInviteEvents() {
        // 点击验证按钮时触发邀请码验证
        this.submitInviteBtn.addEventListener('click', () => this.verifyInvitationCode());
        // 输入框中按下回车键时触发邀请码验证
        this.inviteCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyInvitationCode();
        });

        // 输入时实时显示邀请码类型
        this.inviteCodeInput.addEventListener('input', () => {
            const code = this.inviteCodeInput.value.trim();
            const tier = this.apiManager.validateInvitationCode(code);
            this.updateTierHint(tier);
        });
    }

    /**
     * 更新邀请码类型提示
     */
    updateTierHint(tier) {
        // 重置所有提示
        this.tierHint.querySelectorAll('span').forEach(span => {
            span.style.display = 'none';
        });

        if (tier) {
            const tierElement = this.tierHint.querySelector(`[data-tier="${tier}"]`);
            if (tierElement) tierElement.style.display = 'inline-block';
        }
    }

    /**
     * 获取授权数据（兼容 localStorage 和 sessionStorage）
     */
    getAuthData() {
        return JSON.parse(
            localStorage.getItem('authData') ||
            sessionStorage.getItem('authData') ||
            'null'
        );
    }

    /**
     * 验证邀请码
     */
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

        // 存储授权信息
        const authData = {
            tier,
            timestamp: Date.now(),
            code
        };

        // 根据等级采用不同存储策略
        if (tier === 'premium') {
            localStorage.setItem('authData', JSON.stringify(authData));
            this.showToast('🎉 已激活顶级版，永久有效');
        } else if (tier === 'trial') {
            localStorage.setItem('authData', JSON.stringify(authData));
            this.showToast(`⏳ 试用版已激活，剩余时间: ${this.formatRemainingTime(Date.now())}`);
        } else { // standard
            sessionStorage.setItem('authData', JSON.stringify(authData));
            this.showToast('🔑 普通版已激活，当前会话有效');
        }

        this.hideInviteModal();
    }

    /**
     * 格式化剩余时间
     */
    formatRemainingTime(startTime) {
        const remaining = 3 * 24 * 60 * 60 * 1000 - (Date.now() - startTime);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        return `${hours}小时`;
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        this.inviteError.textContent = message;
        this.inviteError.style.display = 'block';
        setTimeout(() => {
            this.inviteError.style.display = 'none';
        }, 3000);
    }

    /**
     * 显示邀请码模态框
     */
    showInviteModal() {
        this.inviteModal.classList.add('show');
        document.querySelector('.app-container').style.display = 'none';
        this.inviteCodeInput.focus();
    }

    /**
     * 隐藏邀请码模态框
     */
    hideInviteModal() {
        this.inviteModal.classList.remove('show');
        document.querySelector('.app-container').style.display = 'flex';
        this.inviteCodeInput.value = '';
    }

    /* ===================== */
    /* === 主题定制相关方法 === */
    /* ===================== */

    /**
     * 初始化主题定制功能
     */
    initializeThemeCustomizer() {
        // 初始化主题设置
        this.themeSettings = {
            primaryColor: '#2196f3',
            bgColor: '#ffffff',
            sidebarColor: '#ffffff',
            messageColor: '#f5f5f5'
        };

        // 获取主题定制相关的输入元素
        this.primaryColorInput = document.getElementById('primary-color');
        this.bgColorInput = document.getElementById('bg-color');
        this.sidebarColorInput = document.getElementById('sidebar-color');
        this.messageColorInput = document.getElementById('message-color');
        this.applyThemeBtn = document.getElementById('apply-theme-btn');
        this.resetThemeBtn = document.getElementById('reset-theme-btn');

        // 绑定主题相关事件
        this.bindThemeEvents();
        // 加载主题设置
        this.loadThemeSettings();
    }

    /**
     * 绑定主题事件
     */
    bindThemeEvents() {
        // 点击应用主题按钮时应用自定义主题
        this.applyThemeBtn.addEventListener('click', () => this.applyCustomTheme());
        // 点击重置主题按钮时重置为默认主题
        this.resetThemeBtn.addEventListener('click', () => this.resetDefaultTheme());
    }

    /**
     * 应用自定义主题
     */
    applyCustomTheme() {
        // 更新主题设置
        this.themeSettings = {
            primaryColor: this.primaryColorInput.value,
            bgColor: this.bgColorInput.value,
            sidebarColor: this.sidebarColorInput.value,
            messageColor: this.messageColorInput.value
        };

        // 更新 CSS 变量
        this.updateThemeVariables();
        // 保存主题设置
        this.saveThemeSettings();
        // 显示主题应用成功的提示
        this.showToast('主题已应用');
    }

    /**
     * 重置为默认主题
     */
    resetDefaultTheme() {
        // 恢复默认主题设置
        this.themeSettings = {
            primaryColor: '#2196f3',
            bgColor: '#ffffff',
            sidebarColor: '#ffffff',
            messageColor: '#f5f5f5'
        };

        // 更新输入框的值
        this.primaryColorInput.value = this.themeSettings.primaryColor;
        this.bgColorInput.value = this.themeSettings.bgColor;
        this.sidebarColorInput.value = this.themeSettings.sidebarColor;
        this.messageColorInput.value = this.themeSettings.messageColor;

        // 更新 CSS 变量
        this.updateThemeVariables();
        // 保存主题设置
        this.saveThemeSettings();
        // 显示已重置为默认主题的提示
        this.showToast('已重置为默认主题');
    }

    /**
     * 更新 CSS 变量
     */
    updateThemeVariables() {
        // 设置根元素的 CSS 变量
        document.documentElement.style.setProperty('--primary-color', this.themeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', this.darkenColor(this.themeSettings.primaryColor, 20));
        document.documentElement.style.setProperty('--bg-color', this.themeSettings.bgColor);
        document.documentElement.style.setProperty('--bg-secondary', this.lightenColor(this.themeSettings.bgColor, 5));

        // 设置侧边栏的背景颜色
        document.querySelector('.sidebar').style.backgroundColor = this.themeSettings.sidebarColor;

        // 设置消息区的背景渐变
        document.querySelector('.chat-messages').style.background = `linear-gradient(to bottom, ${this.themeSettings.bgColor}, ${this.themeSettings.messageColor})`;
    }

    /**
     * 保存主题设置
     */
    saveThemeSettings() {
        localStorage.setItem('ai_chat_theme', JSON.stringify(this.themeSettings));
    }

    /**
     * 加载主题设置
     */
    loadThemeSettings() {
        const savedTheme = localStorage.getItem('ai_chat_theme');
        if (savedTheme) {
            this.themeSettings = JSON.parse(savedTheme);

            // 更新输入框的值
            this.primaryColorInput.value = this.themeSettings.primaryColor;
            this.bgColorInput.value = this.themeSettings.bgColor;
            this.sidebarColorInput.value = this.themeSettings.sidebarColor;
            this.messageColorInput.value = this.themeSettings.messageColor;

            // 更新 CSS 变量
            this.updateThemeVariables();
        }
    }

    /**
     * 颜色变暗
     */
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

    /**
     * 颜色变亮
     */
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

    /**
     * 初始化 DOM 元素引用
     */
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
        this.darkModeBtn = document.getElementById('dark-mode-btn');

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
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 消息发送相关事件
        this.bindMessageEvents();
        // 对话管理相关事件
        this.bindConversationEvents();
        // 文件处理相关事件
        this.bindFileEvents();
        // 功能按钮相关事件
        this.bindFeatureEvents();
        // 配置管理相关事件
        this.bindConfigEvents();
        // 侧边栏相关事件
        this.bindSidebarEvents();
        // 模态框相关事件
        this.bindModalEvents();
    }

    /* ===================== */
    /* === 事件绑定辅助方法 === */
    /* ===================== */

    /**
     * 绑定消息发送相关事件
     */
    bindMessageEvents() {
        // 点击发送按钮时发送消息
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        // 在输入框中按下回车键（非 Shift + Enter）时发送消息
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    /**
     * 绑定对话管理相关事件
     */
    bindConversationEvents() {
        // 点击新对话按钮时创建新对话
        this.newChatBtn.addEventListener('click', () => this.createNewChat());
        // 点击重命名按钮时显示重命名模态框
        this.renameChatBtn.addEventListener('click', () => this.showRenameModal());
        // 点击删除按钮时删除当前对话
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentConversation());
    }

    /**
     * 绑定文件处理相关事件
     */
    bindFileEvents() {
        // 点击上传文件按钮时触发文件选择框
        this.uploadFileBtn.addEventListener('click', () => this.fileUpload.click());
        // 文件选择框内容改变时处理文件上传
        this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    /**
     * 绑定功能按钮相关事件
     */
    bindFeatureEvents() {
        // 点击联网搜索按钮时切换按钮状态
        this.webSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.webSearchBtn.classList.toggle('active');
        });

        // 点击深度思考按钮时切换按钮状态
        this.deepThinkingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deepThinkingBtn.classList.toggle('active');
        });

        // 点击导出对话按钮时导出对话为 Markdown 格式
        this.exportChatBtn.addEventListener('click', () => this.exportConversation('markdown'));

        // 导出格式选择
        document.querySelectorAll('.dropdown-content a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportConversation(e.target.dataset.format);
            });
        });
    }

    /**
     * 绑定配置管理相关事件
     */
    bindConfigEvents() {
        // 模型选择框改变时更新模型设置并保存配置
        this.modelSelect.addEventListener('change', (e) => {
            this.apiManager.setModel(e.target.value);
            this.saveSettings();
            this.updateAvailableModels();
        });

        // API 密钥、API 地址和 Ollama 地址输入框内容改变时处理配置变更
        this.apiKeyInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.apiUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.ollamaUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));

        // 点击清除设置按钮时清除所有设置和会话历史
        this.clearSettingsBtn.addEventListener('click', () => this.clearSettings());
    }

    /**
     * 绑定侧边栏相关事件
     */
    bindSidebarEvents() {
        // 点击切换侧边栏按钮时切换侧边栏的显示/隐藏状态
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        // 搜索输入框内容改变时过滤对话列表
        this.chatSearchInput.addEventListener('input', () => this.filterConversations());
    }

    /**
     * 绑定模态框相关事件
     */
    bindModalEvents() {
        // 点击取消重命名按钮时隐藏重命名模态框
        this.cancelRenameBtn.addEventListener('click', () => this.hideRenameModal());
        // 点击确认重命名按钮时重命名当前对话
        this.confirmRenameBtn.addEventListener('click', () => this.renameCurrentConversation());
    }

    /* ===================== */
    /* === 侧边栏相关方法 === */
    /* ===================== */

    /**
     * 切换侧边栏显示/隐藏
     */
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

        // 在移动端添加/移除 show 类
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('show');
        }
    }

    /* ===================== */
    /* === 消息处理相关方法 === */
    /* ===================== */

    /**
     * 发送消息
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 如果是新对话的第一个消息，自动保存并使用第一个问题作为标题
        if (!this.currentConversationId) {
            const defaultTitle = message.length > 20 ? message.substring(0, 20) + '...' : message;
            this.saveCurrentConversation(defaultTitle, true);
        }

        // 添加用户消息到聊天界面
        this.addMessage('user', message);
        // 清空输入框
        this.messageInput.value = '';

        // 添加加载状态的助手消息
        const loadingId = this.addMessage('assistant', '', true);
        const loadingDiv = document.getElementById(loadingId);
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'thinking-container';
        loadingDiv.querySelector('.message-content').appendChild(thinkingContainer);

        try {
            const selectedModel = this.availableModelSelect.value;
            // 设置当前使用的模型
            this.apiManager.setModel(this.modelSelect.value);
            // 重写获取可用模型的方法，使用用户选择的模型
            this.apiManager.getAvailableModel = () => selectedModel;

            let response;
            if (this.deepThinkingBtn.classList.contains('active')) {
                // 显示思考过程
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
                // 普通模式
                const dots = '<div class="loading-dots"><span></span><span></span><span></span></div>';
                loadingDiv.querySelector('.message-content').innerHTML = dots;

                if (this.webSearchBtn.classList.contains('active')) {
                    response = await this.apiManager.sendMessageWithWebSearch(message);
                    this.webSearchBtn.classList.remove('active');
                } else {
                    response = await this.apiManager.sendMessage(message);
                }
            }

            // 更新加载状态的助手消息为实际响应内容
            this.updateMessage(loadingId, response);
            // 更新对话历史
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
            // 更新加载状态的助手消息为错误信息
            this.updateMessage(loadingId, errorMsg);
        }
    }

    /**
     * 添加消息到聊天界面
     * @param {string} role - 消息角色 (user/assistant)
     * @param {string} content - 消息内容
     * @param {boolean} isLoading - 是否为加载状态
     * @returns {string} 消息ID
     */
    addMessage(role, content, isLoading = false) {
        const messageId = `msg_${++this.messageIdCounter}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.id = messageId;

        // 添加时间戳
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp;

        // 创建头像
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        // 创建消息内容
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isLoading) {
            messageContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        } else {
            messageContent.innerHTML = marked.parse(content);
        }

        // 创建操作按钮
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制';
        copyBtn.addEventListener('click', () => this.copyToClipboard(messageContent.textContent));

        actionsDiv.appendChild(copyBtn);

        // 如果是用户消息，添加编辑按钮
        if (role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn';
            editBtn.innerHTML = '✏️';
            editBtn.title = '编辑';
            editBtn.addEventListener('click', () => this.editMessage(messageId));
            actionsDiv.appendChild(editBtn);
        }

        // 组装消息元素
        messageDiv.appendChild(timeDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(actionsDiv);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        return messageId;
    }

    /**
     * 更新消息内容
     * @param {string} messageId - 消息ID
     * @param {string} content - 新内容
     */
    updateMessage(messageId, content) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            const contentEl = messageDiv.querySelector('.message-content');
            contentEl.innerHTML = marked.parse(content);
        }
    }

    /**
     * 编辑消息
     * @param {string} messageId - 消息ID
     */
    editMessage(messageId) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;

        const contentEl = messageDiv.querySelector('.message-content');
        const originalContent = contentEl.textContent;

        // 创建编辑区域
        const textarea = document.createElement('textarea');
        textarea.value = originalContent;
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';

        // 创建按钮容器
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.marginTop = '10px';

        // 创建保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', () => {
            this.updateMessage(messageId, textarea.value);
            this.updateConversationHistory();
        });

        // 创建取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            contentEl.innerHTML = marked.parse(originalContent);
        });

        // 组装编辑界面
        buttonsDiv.appendChild(saveBtn);
        buttonsDiv.appendChild(cancelBtn);

        contentEl.innerHTML = '';
        contentEl.appendChild(textarea);
        contentEl.appendChild(buttonsDiv);
        textarea.focus();
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            this.showToast('复制失败');
        });
    }

    /**
     * 显示临时提示
     * @param {string} message - 提示消息
     */
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

    /**
     * 滚动聊天区域到底部
     */
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

        // 重置文件输入
        this.fileUpload.value = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 显示文件上传提示
            this.fileUploadHint.textContent = `正在上传: ${file.name}...`;
            this.fileUploadHint.style.display = 'block';

            try {
                const content = await this.readFileContent(file);
                // 添加用户上传文件的消息
                this.addMessage('user', `📄 上传了文件: ${file.name} (${this.formatFileSize(file.size)})`);

                // 添加加载状态的助手消息
                const loadingId = this.addMessage('assistant', '', true);
                const loadingDiv = document.getElementById(loadingId);
                loadingDiv.querySelector('.message-content').innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

                // 发送文件内容给 API 并获取响应
                const response = await this.apiManager.sendMessage(`请处理以下文件内容: \n${content}`);
                // 更新加载状态的助手消息为实际响应内容
                this.updateMessage(loadingId, response);

                // 更新对话历史
                this.updateConversationHistory();
            } catch (error) {
                // 添加系统错误消息
                this.addMessage('system', `❌ 上传文件失败: ${file.name} (${error.message})`);
            } finally {
                // 隐藏文件上传提示
                this.fileUploadHint.style.display = 'none';
            }
        }
    }

    /**
     * 读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            // 简单文件类型验证
            const allowedTypes = [
                'text/plain',
                'application/pdf',
                'text/markdown',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ];

            if (!allowedTypes.includes(file.type) &&
                !file.name.match(/\.(txt|md|pdf|docx|xlsx|pptx)$/i)) {
                return reject(new Error('不支持的文件类型'));
            }

            // 限制文件大小 (5MB)
            if (file.size > 5 * 1024 * 1024) {
                return reject(new Error('文件大小超过5MB限制'));
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                // 限制内容长度 (前5000个字符)
                resolve(event.target.result.substring(0, 5000));
            };

            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };

            if (file.type === 'application/pdf') {
                // PDF 文件处理 (简化版，实际应该使用 PDF.js 提取文本)
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小(字节)
     * @returns {string} 格式化后的文件大小
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