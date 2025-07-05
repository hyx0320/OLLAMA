/**
 * AI 智能助手主应用类
 * 负责管理整个聊天应用的界面、对话历史、用户交互和核心功能
 */
class ChatApp {
    constructor() {
        // 初始化核心组件
        this.apiManager = new APIManager(); // API管理对象，处理所有与AI服务的通信
        this.messageIdCounter = 0; // 消息ID计数器，确保每条消息有唯一标识
        this.currentConversationId = null; // 当前对话的唯一ID
        this.isDarkMode = false; // 暗黑模式状态标志
        this.isThemeShowing = false; // 主题设置面板显示状态
        this.isApiShowing = false; // API设置面板显示状态
        this.isSpeaking = false; // 语音朗读状态标志
        this.isListening = false; // 语音输入监听状态标志
        this.currentSpeakingMessage = null; // 当前正在朗读的消息元素

        // 初始化应用
        this.initializeElements(); // 获取并初始化所有DOM元素
        this.bindEvents(); // 绑定所有事件监听器
        this.loadSettings(); // 加载用户设置
        this.loadConversations(); // 加载历史对话
        this.updateAvailableModels(); // 更新可用模型列表
        this.initializeThemeCustomizer(); // 初始化主题定制功能
        this.initializeInviteSystem(); // 初始化邀请码系统
        this.secureAllExternalLinks(); // 保护所有外部链接
        this.initializePeriodicLinkCheck(); // 初始化定期链接检查
    }

    /* ===================== */
    /* === 初始化方法 === */
    /* ===================== */

    /**
     * 获取并初始化所有DOM元素
     */
    initializeElements() {
        // 核心聊天区域元素
        this.chatMessages = document.getElementById('chat-messages'); // 聊天消息容器
        this.messageInput = document.getElementById('message-input'); // 消息输入框
        this.sendBtn = document.getElementById('send-btn'); // 发送按钮
        this.newChatBtn = document.getElementById('new-chat-btn'); // 新建聊天按钮
        this.chatTitle = document.getElementById('chat-title'); // 聊天标题
        this.chatList = document.getElementById('chat-list'); // 聊天列表

        // 配置相关元素
        this.apiKeyInput = document.getElementById('api-key'); // API密钥输入框
        this.apiUrlInput = document.getElementById('api-url'); // API地址输入框
        this.ollamaUrlInput = document.getElementById('ollama-url'); // Ollama地址输入框
        this.modelSelect = document.getElementById('model-select'); // 模型选择下拉框
        this.availableModelSelect = document.getElementById('available-model-select'); // 可用模型选择框

        // 功能按钮元素
        this.renameChatBtn = document.getElementById('rename-chat-btn'); // 重命名聊天按钮
        this.exportChatBtn = document.getElementById('export-chat-btn'); // 导出聊天按钮
        this.uploadFileBtn = document.getElementById('upload-file-btn'); // 上传文件按钮
        this.fileUpload = document.getElementById('file-upload'); // 文件上传输入框
        this.fileUploadHint = document.getElementById('file-upload-hint'); // 文件上传提示
        this.webSearchBtn = document.getElementById('web-search-btn'); // 网络搜索按钮
        this.deepThinkingBtn = document.getElementById('deep-thinking-btn'); // 深度思考按钮
        this.deleteChatBtn = document.getElementById('delete-chat-btn'); // 删除聊天按钮
        this.voiceInputBtn = document.getElementById('voice-input-btn'); // 语音输入按钮

        // 模态框相关元素
        this.renameModal = document.getElementById('rename-modal'); // 重命名模态框
        this.newChatTitleInput = document.getElementById('new-chat-title'); // 新聊天标题输入框
        this.cancelRenameBtn = document.getElementById('cancel-rename-btn'); // 取消重命名按钮
        this.confirmRenameBtn = document.getElementById('confirm-rename-btn'); // 确认重命名按钮

        // 侧边栏相关元素
        this.toggleSidebarBtn = document.getElementById('toggle-sidebar-btn'); // 切换侧边栏按钮
        this.sidebar = document.querySelector('.sidebar'); // 侧边栏容器
        this.chatSearchInput = document.getElementById('chat-search'); // 聊天搜索框

        // 清除设置按钮
        this.clearSettingsBtn = document.getElementById('clear-settings-btn'); // 清除设置按钮

        // 新增的主题和API切换元素
        this.themeToggleBtn = document.getElementById('theme-toggle-btn'); // 主题切换按钮
        this.apiToggleBtn = document.getElementById('api-toggle-btn'); // API切换按钮
        this.themeCustomizer = document.querySelector('.theme-customizer'); // 主题定制面板
        this.apiConfig = document.querySelector('.api-config'); // API配置面板

        // 邀请码相关元素
        this.inviteModal = document.getElementById('invite-modal'); // 邀请码模态框
        this.inviteCodeInput = document.getElementById('invite-code'); // 邀请码输入框
        this.submitInviteBtn = document.getElementById('submit-invite-btn'); // 提交邀请码按钮
        this.inviteError = document.getElementById('invite-error'); // 邀请码错误提示
        this.tierHint = document.querySelector('.tier-hint'); // 用户等级提示
    }

    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        this.bindMessageEvents(); // 绑定消息相关事件
        this.bindConversationEvents(); // 绑定对话相关事件
        this.bindFileEvents(); // 绑定文件相关事件
        this.bindFeatureEvents(); // 绑定功能按钮事件
        this.bindConfigEvents(); // 绑定配置相关事件
        this.bindSidebarEvents(); // 绑定侧边栏事件
        this.bindModalEvents(); // 绑定模态框事件
        this.bindThemeToggleEvents(); // 绑定主题切换事件
        this.bindVoiceEvents(); // 绑定语音事件
        this.bindInviteEvents(); // 绑定邀请码事件
    }

    /**
     * 初始化主题定制功能
     */
    initializeThemeCustomizer() {
        // 默认主题设置
        this.themeSettings = {
            primaryColor: '#2196f3', // 主色调
            bgColor: '#ffffff', // 背景色
            sidebarColor: '#ffffff', // 侧边栏颜色
            messageColor: '#f5f5f5' // 消息背景色
        };

        // 获取主题设置相关的DOM元素
        this.primaryColorInput = document.getElementById('primary-color');
        this.bgColorInput = document.getElementById('bg-color');
        this.sidebarColorInput = document.getElementById('sidebar-color');
        this.messageColorInput = document.getElementById('message-color');
        this.applyThemeBtn = document.getElementById('apply-theme-btn'); // 应用主题按钮
        this.resetThemeBtn = document.getElementById('reset-theme-btn'); // 重置主题按钮

        this.bindThemeEvents(); // 绑定主题事件
        this.loadThemeSettings(); // 加载保存的主题设置
    }

    /**
     * 初始化邀请码系统
     */
    initializeInviteSystem() {
        this.checkAuthorization(); // 检查用户授权状态
    }

    /**
     * 初始化定期链接安全检查
     */
    initializePeriodicLinkCheck() {
        // 每30秒检查并保护所有外部链接
        setInterval(() => this.secureAllExternalLinks(), 30000);
    }

    /* ===================== */
    /* === 事件绑定方法 === */
    /* ===================== */

    /**
     * 绑定消息相关事件
     */
    bindMessageEvents() {
        // 发送按钮点击事件
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        // 输入框回车事件（Shift+Enter换行）
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    /**
     * 绑定对话相关事件
     */
    bindConversationEvents() {
        this.newChatBtn.addEventListener('click', () => this.createNewChat()); // 新建聊天
        this.renameChatBtn.addEventListener('click', () => this.showRenameModal()); // 显示重命名模态框
        this.deleteChatBtn.addEventListener('click', () => this.deleteCurrentConversation()); // 删除当前对话
    }

    /**
     * 绑定文件相关事件
     */
    bindFileEvents() {
        // 点击上传按钮触发文件选择
        this.uploadFileBtn.addEventListener('click', () => this.fileUpload.click());
        // 文件选择变化事件
        this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    /**
     * 绑定功能按钮事件
     */
    bindFeatureEvents() {
        // 网络搜索按钮切换状态
        this.webSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.webSearchBtn.classList.toggle('active');
        });

        // 深度思考按钮切换状态
        this.deepThinkingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.deepThinkingBtn.classList.toggle('active');
        });

        // 导出聊天为Markdown
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
     * 绑定配置相关事件
     */
    bindConfigEvents() {
        // 模型选择变化事件
        this.modelSelect.addEventListener('change', (e) => {
            this.apiManager.setModel(e.target.value); // 更新API管理器中的模型
            this.saveSettings(); // 保存设置
            this.updateAvailableModels(); // 更新可用模型列表
        });

        // API配置输入变化事件
        this.apiKeyInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.apiUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));
        this.ollamaUrlInput.addEventListener('input', (e) => this.handleConfigChange(e));

        // 清除设置按钮事件
        this.clearSettingsBtn.addEventListener('click', () => this.clearSettings());
    }

    /**
     * 绑定侧边栏事件
     */
    bindSidebarEvents() {
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar()); // 切换侧边栏显示
        this.chatSearchInput.addEventListener('input', () => this.filterConversations()); // 聊天搜索
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents() {
        this.cancelRenameBtn.addEventListener('click', () => this.hideRenameModal()); // 取消重命名
        this.confirmRenameBtn.addEventListener('click', () => this.renameCurrentConversation()); // 确认重命名
        
        // 重命名输入框回车事件
        this.newChatTitleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.renameCurrentConversation();
            }
        });
    }

    /**
     * 绑定主题切换事件
     */
    bindThemeToggleEvents() {
        this.themeToggleBtn.addEventListener('click', () => this.toggleThemePanel()); // 切换主题面板
        this.apiToggleBtn.addEventListener('click', () => this.toggleApiPanel()); // 切换API面板
    }

    /**
     * 绑定主题事件
     */
    bindThemeEvents() {
        this.applyThemeBtn.addEventListener('click', () => this.applyCustomTheme()); // 应用自定义主题
        this.resetThemeBtn.addEventListener('click', () => this.resetDefaultTheme()); // 重置默认主题
    }

    /**
     * 绑定语音事件
     */
    bindVoiceEvents() {
        // 消息朗读按钮事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.speak-btn')) {
                const messageDiv = e.target.closest('.message');
                this.toggleSpeakingMessage(messageDiv); // 切换消息朗读状态
            }
        });
        
        // 语音输入按钮事件
        this.voiceInputBtn.addEventListener('click', () => this.toggleListening());
    }

    /**
     * 绑定邀请码事件
     */
    bindInviteEvents() {
        this.submitInviteBtn.addEventListener('click', () => this.verifyInvitationCode()); // 提交邀请码
        this.inviteCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.verifyInvitationCode(); // 回车提交
        });

        // 邀请码输入实时验证
        this.inviteCodeInput.addEventListener('input', () => {
            const code = this.inviteCodeInput.value.trim();
            const tier = this.apiManager.validateInvitationCode(code); // 验证邀请码
            this.updateTierHint(tier); // 更新用户等级提示
        });
    }

    /* ===================== */
    /* === 邀请码相关方法 === */
    /* ===================== */

    /**
     * 检查用户授权状态
     */
    checkAuthorization() {
        const authData = this.getAuthData(); // 获取授权数据

        // 根据用户等级处理授权状态
        if (authData?.tier === 'premium') {
            this.hideInviteModal(); // 顶级用户隐藏邀请框
            return;
        }

        if (authData?.tier === 'trial') {
            // 检查试用期是否有效（3天内）
            const isTrialValid = Date.now() - authData.timestamp < 3 * 24 * 60 * 60 * 1000;
            if (isTrialValid) {
                this.hideInviteModal();
                this.showToast(`试用版剩余时间: ${this.formatRemainingTime(authData.timestamp)}`);
                return;
            }
        }

        if (authData?.tier === 'standard') {
            this.hideInviteModal(); // 标准用户隐藏邀请框
            return;
        }

        this.showInviteModal(); // 未授权用户显示邀请框
    }

    /**
     * 更新用户等级提示
     * @param {string} tier - 用户等级
     */
    updateTierHint(tier) {
        // 隐藏所有提示
        this.tierHint.querySelectorAll('span').forEach(span => {
            span.style.display = 'none';
        });

        // 显示对应等级的提示
        if (tier) {
            const tierElement = this.tierHint.querySelector(`[data-tier="${tier}"]`);
            if (tierElement) tierElement.style.display = 'inline-block';
        }
    }

    /**
     * 获取授权数据
     * @returns {Object|null} 授权数据对象
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

        // 验证邀请码有效性
        const tier = this.apiManager.validateInvitationCode(code);
        if (!tier) {
            this.showError("邀请码无效");
            return;
        }

        // 创建授权数据对象
        const authData = {
            tier,
            timestamp: Date.now(),
            code
        };

        // 根据等级保存授权数据
        if (tier === 'premium') {
            localStorage.setItem('authData', JSON.stringify(authData)); // 永久保存
            this.showToast('🎉 已激活顶级版，永久有效');
        } else if (tier === 'trial') {
            localStorage.setItem('authData', JSON.stringify(authData)); // 本地存储
            this.showToast(`⏳ 试用版已激活，剩余时间: ${this.formatRemainingTime(Date.now())}`);
        } else {
            sessionStorage.setItem('authData', JSON.stringify(authData)); // 会话存储
            this.showToast('🔑 普通版已激活，当前会话有效');
        }

        this.hideInviteModal(); // 隐藏邀请框
    }

    /**
     * 格式化剩余时间
     * @param {number} startTime - 开始时间戳
     * @returns {string} 格式化后的时间
     */
    formatRemainingTime(startTime) {
        const remaining = 3 * 24 * 60 * 60 * 1000 - (Date.now() - startTime);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        return `${hours}小时`;
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
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
     * 应用自定义主题
     */
    applyCustomTheme() {
        // 从输入框获取主题设置
        this.themeSettings = {
            primaryColor: this.primaryColorInput.value,
            bgColor: this.bgColorInput.value,
            sidebarColor: this.sidebarColorInput.value,
            messageColor: this.messageColorInput.value
        };

        this.updateThemeVariables(); // 更新CSS变量
        this.saveThemeSettings(); // 保存主题设置
        this.showToast('主题已应用');
    }

    /**
     * 重置默认主题
     */
    resetDefaultTheme() {
        // 恢复默认主题设置
        this.themeSettings = {
            primaryColor: '#2196f3',
            bgColor: '#ffffff',
            sidebarColor: '#ffffff',
            messageColor: '#f5f5f5'
        };

        // 更新输入框值
        this.primaryColorInput.value = this.themeSettings.primaryColor;
        this.bgColorInput.value = this.themeSettings.bgColor;
        this.sidebarColorInput.value = this.themeSettings.sidebarColor;
        this.messageColorInput.value = this.themeSettings.messageColor;

        this.updateThemeVariables(); // 更新CSS变量
        this.saveThemeSettings(); // 保存主题设置
        this.showToast('已重置为默认主题');
    }

    /**
     * 更新CSS主题变量
     */
    updateThemeVariables() {
        // 设置CSS变量
        document.documentElement.style.setProperty('--primary-color', this.themeSettings.primaryColor);
        document.documentElement.style.setProperty('--primary-hover', this.darkenColor(this.themeSettings.primaryColor, 20));
        document.documentElement.style.setProperty('--bg-color', this.themeSettings.bgColor);
        document.documentElement.style.setProperty('--bg-secondary', this.lightenColor(this.themeSettings.bgColor, 5));
        document.querySelector('.sidebar').style.backgroundColor = this.themeSettings.sidebarColor;
        document.querySelector('.chat-messages').style.background = 
            `linear-gradient(to bottom, ${this.themeSettings.bgColor}, ${this.themeSettings.messageColor})`;
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

            // 更新输入框值
            this.primaryColorInput.value = this.themeSettings.primaryColor;
            this.bgColorInput.value = this.themeSettings.bgColor;
            this.sidebarColorInput.value = this.themeSettings.sidebarColor;
            this.messageColorInput.value = this.themeSettings.messageColor;

            this.updateThemeVariables(); // 应用主题
        }
    }

    /**
     * 加深颜色
     * @param {string} color - 原始颜色
     * @param {number} percent - 加深百分比
     * @returns {string} 加深后的颜色
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
     * 加亮颜色
     * @param {string} color - 原始颜色
     * @param {number} percent - 加亮百分比
     * @returns {string} 加亮后的颜色
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

    /* ===================== */
    /* === 面板切换方法 === */
    /* ===================== */

    /**
     * 切换主题面板显示状态
     */
    toggleThemePanel() {
        this.isThemeShowing = !this.isThemeShowing;
        this.themeCustomizer.style.display = this.isThemeShowing ? 'block' : 'none';
        this.themeToggleBtn.classList.toggle('active');
        
        // 如果API面板正在显示，则关闭它
        if (this.isThemeShowing && this.isApiShowing) {
            this.apiConfig.style.display = 'none';
            this.apiToggleBtn.classList.remove('active');
            this.isApiShowing = false;
        }
        
        // 更新按钮文本
        const toggleText = this.themeToggleBtn.querySelector('.api-toggle-text');
        toggleText.textContent = this.isThemeShowing ? '隐藏主题设置' : '显示主题设置';
    }

    /**
     * 切换API面板显示状态
     */
    toggleApiPanel() {
        this.isApiShowing = !this.isApiShowing;
        this.apiConfig.style.display = this.isApiShowing ? 'block' : 'none';
        this.apiToggleBtn.classList.toggle('active');
        
        // 如果主题面板正在显示，则关闭它
        if (this.isApiShowing && this.isThemeShowing) {
            this.themeCustomizer.style.display = 'none';
            this.themeToggleBtn.classList.remove('active');
            this.isThemeShowing = false;
        }
        
        // 更新按钮文本
        const toggleText = this.apiToggleBtn.querySelector('.api-toggle-text');
        toggleText.textContent = this.isApiShowing ? '隐藏API设置' : '显示API设置';
    }

    /* ===================== */
    /* === 侧边栏相关方法 === */
    /* ===================== */

    /**
     * 切换侧边栏显示状态
     */
    toggleSidebar() {
        this.sidebar.classList.toggle('hidden');

        const sidebarIcon = this.toggleSidebarBtn.querySelector('.sidebar-icon');
        const sidebarText = this.toggleSidebarBtn.querySelector('.sidebar-text');

        // 更新按钮图标和文本
        if (this.sidebar.classList.contains('hidden')) {
            sidebarIcon.textContent = '☰';
            sidebarText.textContent = '显示侧边栏';
        } else {
            sidebarIcon.textContent = '✕';
            sidebarText.textContent = '隐藏侧边栏';
        }

        // 移动端适配
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('show');
        }
    }

    /* ===================== */
    /* === 消息处理相关方法 === */
    /* ===================== */

    /**
     * 发送用户消息
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // 如果没有当前对话，创建一个新对话
        if (!this.currentConversationId) {
            const defaultTitle = message.length > 20 ? message.substring(0, 20) + '...' : message;
            this.saveCurrentConversation(defaultTitle, true);
        }

        this.addMessage('user', message); // 添加用户消息
        this.messageInput.value = ''; // 清空输入框

        // 添加AI加载中的消息
        const loadingId = this.addMessage('assistant', '', true);
        const loadingDiv = document.getElementById(loadingId);
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'thinking-container';
        loadingDiv.querySelector('.message-content').appendChild(thinkingContainer);

        try {
            // 设置当前模型
            const selectedModel = this.availableModelSelect.value;
            this.apiManager.setModel(this.modelSelect.value);
            this.apiManager.getAvailableModel = () => selectedModel;

            let response;
            if (this.deepThinkingBtn.classList.contains('active')) {
                // 深度思考模式
                response = await this.apiManager.sendMessageWithThinking(
                    message,
                    (thinkingStep) => {
                        // 显示思考过程
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

                // 根据是否启用网络搜索选择API方法
                if (this.webSearchBtn.classList.contains('active')) {
                    response = await this.apiManager.sendMessageWithWebSearch(message);
                    this.webSearchBtn.classList.remove('active');
                } else {
                    response = await this.apiManager.sendMessage(message);
                }
            }

            this.updateMessage(loadingId, response); // 更新消息内容
            this.updateConversationHistory(); // 更新对话历史
            
            // 添加相关资源
            await this.addRelatedResources(message, loadingId);
            
        } catch (error) {
            console.error('发送消息失败:', error);
            let errorMsg = `❌ 错误: ${error.message}`;
            // 处理网络错误
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
            this.updateMessage(loadingId, errorMsg); // 显示错误消息
        }
    }

    /**
     * 添加相关资源
     * @param {string} query - 用户查询
     * @param {string} messageId - 消息ID
     */
    async addRelatedResources(query, messageId) {
        try {
            // 获取相关资源
            const resources = await this.apiManager.getRelatedResources(query);
            if (!resources || Object.keys(resources).length === 0) return;

            const messageDiv = document.getElementById(messageId);
            if (!messageDiv) return;

            // 创建资源按钮
            const resourcesBtnContainer = document.createElement('div');
            resourcesBtnContainer.className = 'resources-btn-container';
            
            const resourcesBtn = document.createElement('button');
            resourcesBtn.className = 'resources-btn';
            resourcesBtn.innerHTML = '🔍 查看相关资源';
            resourcesBtn.title = '在新窗口查看推荐资源';
            
            // 点击按钮显示资源窗口
            resourcesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResourcesWindow(resources);
            });
            
            resourcesBtnContainer.appendChild(resourcesBtn);
            messageDiv.querySelector('.message-content').appendChild(resourcesBtnContainer);
            
            this.applyResourcesButtonStyle(); // 应用按钮样式
            
        } catch (error) {
            console.error('添加推荐资源失败:', error);
        }
    }

    /**
     * 应用资源按钮样式
     */
    applyResourcesButtonStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .resources-btn-container {
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px dashed #eee;
            }
            .resources-btn {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            .resources-btn:hover {
                background: var(--primary-hover);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示资源窗口
     * @param {Object} resources - 资源对象
     */
    showResourcesWindow(resources) {
        let resourcesWindow;
        try {
            // 尝试在新窗口打开
            resourcesWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
            
            if (!resourcesWindow || resourcesWindow.closed) {
                throw new Error('窗口被阻止');
            }
            
            resourcesWindow.opener = null; // 安全措施
            
        } catch (error) {
            this.showToast('弹出窗口被阻止，请在浏览器设置中允许弹出窗口');
            return;
        }

        const safeHTML = this.buildSafeResourcesHTML(resources); // 构建安全的HTML
        
        try {
            // 写入资源内容到新窗口
            resourcesWindow.document.open();
            resourcesWindow.document.write(safeHTML);
            resourcesWindow.document.close();
        } catch (error) {
            console.error('写入资源窗口失败:', error);
            resourcesWindow.close();
            this.showToast('打开资源窗口失败');
        }
    }

    /**
     * 构建安全的资源HTML
     * @param {Object} resources - 资源对象
     * @returns {string} 安全的HTML字符串
     */
    buildSafeResourcesHTML(resources) {
        // HTML转义函数
        const escapeHTML = (str) => {
            return str.replace(/[&<>'"]/g, tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
        };

        // 构建HTML内容
        let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>相关资源推荐</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        h2 {
            color: #2c3e50;
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .resource-section {
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
        }
        .resource-title {
            font-size: 18px;
            font-weight: 600;
            color: #34495e;
            margin: 15px 0 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .resource-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .resource-item {
            margin-bottom: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .resource-item:hover {
            background-color: #f8f8f8;
        }
        .resource-link {
            color: #3498db;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .resource-link:hover {
            text-decoration: underline;
        }
        .external-icon {
            font-size: 0.9em;
            opacity: 0.7;
        }
        .security-notice {
            font-size: 13px;
            color: #7f8c8d;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>🔍 相关资源推荐</h2>
        <p>以下是与您问题相关的高质量内容（所有链接将在新窗口打开）：</p>`;

        // 遍历资源对象
        for (const [source, items] of Object.entries(resources)) {
            if (!items || items.length === 0) continue;
            
            htmlContent += `
            <div class="resource-section">
                <div class="resource-title">
                    ${escapeHTML(this.getPlatformIcon(source))} ${escapeHTML(this.getPlatformName(source))}
                </div>
                <ul class="resource-list">`;
            
            // 添加资源项
            items.forEach(item => {
                if (!item.verified) return; // 只添加已验证的资源
                
                htmlContent += `
                <li class="resource-item">
                    <a href="${escapeHTML(item.url)}" class="resource-link" 
                       target="_blank" rel="noopener noreferrer nofollow">
                        ${escapeHTML(item.title)} <span class="external-icon">↗</span>
                    </a>
                </li>`;
            });
            
            htmlContent += `
                </ul>
            </div>`;
        }
        
        // 添加安全提示
        htmlContent += `
            <div class="security-notice">
                <strong>安全提示：</strong>所有外部链接均在新窗口打开，并添加了安全保护措施。
            </div>
        </div>
    </body>
    </html>`;
        
        return htmlContent;
    }

    /**
     * 获取平台图标
     * @param {string} source - 资源来源
     * @returns {string} 平台图标
     */
    getPlatformIcon(source) {
        const icons = {
            baike: '📚',
            csdn: '💻',
            zhihu: '📝'
        };
        return icons[source] || '🔗';
    }

    /**
     * 获取平台名称
     * @param {string} source - 资源来源
     * @returns {string} 平台名称
     */
    getPlatformName(source) {
        const names = {
            baike: '秒懂百科',
            csdn: 'CSDN技术社区',
            zhihu: '知乎讨论'
        };
        return names[source] || source;
    }

    /**
     * 保护所有外部链接
     */
    secureAllExternalLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            // 跳过已处理的链接
            if (link.getAttribute('data-external') === 'true') return;
            if (link.href.startsWith(window.location.origin)) return;
            
            // 设置链接属性
            link.target = "_blank";
            link.rel = "noopener noreferrer nofollow";
            link.setAttribute('data-external', 'true');
            
            // 防止属性被修改
            Object.defineProperty(link, 'target', {
                value: '_blank',
                writable: false
            });
            
            // 添加外部链接指示器
            if (!link.querySelector('.external-link-indicator')) {
                const extIcon = document.createElement('span');
                extIcon.className = 'external-link-indicator';
                extIcon.textContent = ' ↗';
                link.appendChild(extIcon);
            }
        });
    }

    /**
     * 添加消息到聊天框
     * @param {string} role - 消息角色（user/assistant）
     * @param {string} content - 消息内容
     * @param {boolean} isLoading - 是否加载中状态
     * @returns {string} 消息ID
     */
    addMessage(role, content, isLoading = false) {
        const messageId = `msg_${++this.messageIdCounter}`; // 生成唯一消息ID
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.id = messageId;

        // 添加时间戳
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timestamp;

        // 添加头像
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        // 添加消息内容
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (isLoading) {
            // 加载中状态显示动画
            messageContent.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
        } else {
            // 使用marked解析Markdown
            messageContent.innerHTML = marked.parse(content);
        }

        // 添加操作按钮
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        // 复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn copy-btn';
        copyBtn.innerHTML = '📋';
        copyBtn.title = '复制';
        copyBtn.addEventListener('click', () => this.copyToClipboard(messageContent.textContent));

        // 朗读按钮
        const speakBtn = document.createElement('button');
        speakBtn.className = 'message-action-btn speak-btn';
        speakBtn.innerHTML = '🔊';
        speakBtn.title = '朗读';
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(speakBtn);

        // 用户消息添加编辑按钮
        if (role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'message-action-btn edit-btn';
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
        this.scrollToBottom(); // 滚动到底部

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
            contentEl.innerHTML = marked.parse(content); // 解析Markdown
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
        const originalContent = contentEl.textContent; // 保存原始内容

        // 创建编辑区域
        const textarea = document.createElement('textarea');
        textarea.value = originalContent;
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';

        // 创建操作按钮
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.style.marginTop = '10px';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', () => {
            this.updateMessage(messageId, textarea.value); // 更新消息
            this.updateConversationHistory(); // 更新对话历史
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            contentEl.innerHTML = marked.parse(originalContent); // 恢复原始内容
        });

        buttonsDiv.appendChild(saveBtn);
        buttonsDiv.appendChild(cancelBtn);

        // 替换为编辑界面
        contentEl.innerHTML = '';
        contentEl.appendChild(textarea);
        contentEl.appendChild(buttonsDiv);
        textarea.focus(); // 聚焦到输入框
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
     * 显示提示信息
     * @param {string} message - 提示信息
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }, 100);
    }

    /**
     * 滚动到底部
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

        this.fileUpload.value = ''; // 重置文件输入

        // 处理每个文件
        for (const file of files) {
            const statusContainer = document.createElement('div');
            
            try {
                // 显示处理状态
                statusContainer.className = 'file-status processing';
                statusContainer.textContent = `🔄 正在处理文件: ${file.name}...`;
                this.fileUploadHint.innerHTML = '';
                this.fileUploadHint.appendChild(statusContainer);
                this.fileUploadHint.style.display = 'block';

                // 添加用户消息
                this.addMessage('user', `📄 上传了文件: ${file.name} (${this.formatFileSize(file.size)})`);

                // 添加AI处理消息
                const loadingId = this.addMessage('assistant', '', true);

                // 读取文件内容
                const { content, status } = await this.readFileContent(file);
                
                // 更新状态
                if (status === 'success') {
                    statusContainer.className = 'file-status success';
                    statusContainer.textContent = `✅ 成功读取文件: ${file.name}`;
                } else {
                    statusContainer.className = 'file-status error';
                    statusContainer.textContent = `⚠️ 部分内容读取受限: ${file.name}`;
                }

                // 构建分析提示
                const prompt = this.buildFilePrompt(file, content, status);
                
                // 发送分析请求
                const response = await this.apiManager.sendMessage(prompt);
                
                // 更新消息
                this.updateMessage(loadingId, response);
                
                // 更新对话历史
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
     * 构建文件分析提示
     * @param {File} file - 文件对象
     * @param {string} content - 文件内容
     * @param {string} status - 读取状态
     * @returns {string} 分析提示
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
     * 读取文件内容
     * @param {File} file - 文件对象
     * @returns {Promise<Object>} 文件内容和状态
     */
    async readFileContent(file) {
        try {
            // 检查文件类型
            if (!this.isValidFileType(file)) {
                throw new Error('不支持的文件类型');
            }

            // 检查文件大小
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('文件大小超过10MB限制');
            }

            // 使用FileReader读取文件
            const content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('读取文件失败'));
                reader.readAsText(file);
            });

            // 特殊处理PDF文件
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                return {
                    content: "[PDF文件内容]\n注意：当前版本无法直接解析PDF文本内容。\n建议：复制文本内容粘贴或转换为文本文件上传。",
                    status: 'partial'
                };
            }

            // 返回部分内容（限制2万字）
            return {
                content: content.substring(0, 20000),
                status: 'success'
            };
        } catch (error) {
            console.error(`文件读取错误: ${file.name}`, error);
            throw error;
        }
    }

    /**
     * 检查文件类型是否有效
     * @param {File} file - 文件对象
     * @returns {boolean} 是否有效
     */
    isValidFileType(file) {
        // 允许的文件类型
        const allowedTypes = [
            'text/plain', 'text/markdown', 'application/json',
            'text/csv', 'application/pdf'
        ];
        
        // 允许的文件扩展名
        const allowedExtensions = ['.txt', '.md', '.json', '.csv', '.pdf'];
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        return allowedTypes.includes(file.type) || 
               allowedExtensions.includes(extension);
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 文件大小（字节）
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
        // 如果有未保存的对话，先保存
        if (this.chatMessages.children.length > 0 && !this.currentConversationId) {
            this.saveCurrentConversation('未命名对话');
        }

        // 清空聊天框
        this.chatMessages.innerHTML = '';
        this.currentConversationId = null;
        this.chatTitle.textContent = '新对话';

        // 生成新对话ID
        this.currentConversationId = Date.now().toString();
    }

    /**
     * 保存当前对话
     * @param {string} title - 对话标题
     * @param {boolean} autoSave - 是否自动保存
     */
    saveCurrentConversation(title = '', autoSave = false) {
        try{
            // 从DOM获取所有消息
            const messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
                return {
                    role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                    content: msg.querySelector('.message-content').textContent,
                    timestamp: msg.querySelector('.message-time').textContent
                };
            });

            // 没有消息则不保存
            if (messages.length === 0) {
                if (!autoSave) this.showToast('没有可保存的消息');
                return;
            }

            // 生成默认标题
            if (!title && messages.length > 0) {
                title = messages[0].content.substring(0, 20);
                if (messages[0].content.length > 20) title += '...';
            }

            // 自动保存模式使用默认标题
            if (autoSave && !title) {
                title = `对话 ${new Date().toLocaleDateString()}`;
            }

            // 创建对话对象
            const conversation = {
                id: this.currentConversationId || Date.now().toString(),
                title,
                timestamp: new Date().toISOString(),
                messages
            };

            // 保存到本地存储
            const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
            const existingIndex = conversations.findIndex(c => c.id === conversation.id);

            if (existingIndex !== -1) {
                conversations[existingIndex] = conversation; // 更新现有对话
            } else {
                conversations.push(conversation); // 添加新对话
            }

            localStorage.setItem('conversations', JSON.stringify(conversations));
            this.loadConversations(); // 重新加载对话列表
            this.currentConversationId = conversation.id;
            this.chatTitle.textContent = conversation.title;
        }catch (error) {
            console.error('保存对话失败:', error);
            if (!autoSave) this.showToast('保存失败，请检查存储空间');
        }
    }

    /**
     * 加载对话列表
     */
    loadConversations() {
        this.chatList.innerHTML = '';
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');

        // 按时间倒序排序并创建对话项
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

        // 根据搜索词显示/隐藏对话项
        items.forEach(item => {
            const title = item.textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    /**
     * 创建对话项元素
     * @param {Object} conv - 对话对象
     * @returns {HTMLElement} 对话项元素
     */
    createConversationItem(conv) {
        const item = document.createElement('div');
        item.className = 'conversation-item';
        // 标记当前活动对话
        if (conv.id === this.currentConversationId) item.classList.add('active');

        const titleSpan = document.createElement('span');
        titleSpan.className = 'conversation-title';
        titleSpan.textContent = conv.title;

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'delete-icon';
        deleteIcon.textContent = '🗑️';
        deleteIcon.title = '删除';

        item.appendChild(titleSpan);
        item.appendChild(deleteIcon);

        // 点击加载对话
        item.addEventListener('click', () => this.loadConversation(conv.id));
        // 点击删除对话
        deleteIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteConversation(conv.id);
        });

        return item;
    }

    /**
     * 加载对话
     * @param {string} id - 对话ID
     */
    loadConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const conversation = conversations.find(c => c.id === id);
        if (!conversation) return;

        // 清空并加载消息
        this.chatMessages.innerHTML = '';
        conversation.messages.forEach(msg => {
            this.addMessage(msg.role, msg.content);
        });

        // 更新UI状态
        this.chatTitle.textContent = conversation.title;
        this.currentConversationId = id;

        // 更新活动对话项
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = [...document.querySelectorAll('.conversation-item')]
           .find(item => item.querySelector('.conversation-title').textContent === conversation.title);

        if (activeItem) activeItem.classList.add('active');
    }

    /**
     * 更新对话历史
     */
    updateConversationHistory() {
        if (!this.currentConversationId) return;

        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === this.currentConversationId);

        if (index !== -1) {
            // 从DOM获取最新消息
            conversations[index].messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
                return {
                    role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                    content: msg.querySelector('.message-content').textContent,
                    timestamp: msg.querySelector('.message-time').textContent
                };
            });
            localStorage.setItem('conversations', JSON.stringify(conversations)); // 保存更新
        }
    }

    /**
     * 显示重命名模态框
     */
    showRenameModal() {
        // 没有对话时不显示
        if (!this.currentConversationId && this.chatMessages.children.length === 0) {
            this.showToast('请先开始对话');
            return;
        }

        // 生成默认标题
        let defaultTitle = this.chatTitle.textContent;
        if (defaultTitle === '新对话' && this.chatMessages.children.length > 0) {
            const firstMsg = this.chatMessages.querySelector('.message');
            if (firstMsg) {
                defaultTitle = firstMsg.querySelector('.message-content').textContent;
                defaultTitle = defaultTitle.length > 20 
                    ? defaultTitle.substring(0, 20) + '...' 
                    : defaultTitle;
            }
        }
        
        this.newChatTitleInput.value = defaultTitle;
        this.renameModal.style.display = 'flex';
        this.newChatTitleInput.focus(); // 聚焦输入框
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

        // 确保有对话ID
        if (!this.currentConversationId) {
            this.currentConversationId = Date.now().toString();
        }

        let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const index = conversations.findIndex(c => c.id === this.currentConversationId);
        
        if (index !== -1) {
            // 更新现有对话
            conversations[index].title = newTitle;
            conversations[index].timestamp = new Date().toISOString();
        } else {
            // 创建新对话条目
            const messages = Array.from(this.chatMessages.querySelectorAll('.message')).map(msg => {
                return {
                    role: msg.classList.contains('user-message') ? 'user' : 'assistant',
                    content: msg.querySelector('.message-content').textContent,
                    timestamp: msg.querySelector('.message-time').textContent
                };
            });
            
            conversations.push({
                id: this.currentConversationId,
                title: newTitle,
                timestamp: new Date().toISOString(),
                messages
            });
        }

        try {
            // 保存并更新UI
            localStorage.setItem('conversations', JSON.stringify(conversations));
            this.chatTitle.textContent = newTitle;
            this.loadConversations();
            this.hideRenameModal();
            this.showToast('对话已重命名');
        } catch (error) {
            console.error('保存对话失败:', error);
            this.showToast('保存失败，请检查存储空间');
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

        // 确认删除
        if (confirm('确定要删除当前对话吗？此操作不可撤销。')) {
            this.deleteConversation(this.currentConversationId);
            this.createNewChat(); // 创建新对话
        }
    }

    /**
     * 删除指定对话
     * @param {string} id - 对话ID
     */
    deleteConversation(id) {
        const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const newConversations = conversations.filter(c => c.id !== id); // 过滤掉目标对话
        localStorage.setItem('conversations', JSON.stringify(newConversations));
        this.loadConversations(); // 重新加载

        // 如果删除的是当前对话，创建新对话
        if (this.currentConversationId === id) this.createNewChat();

        this.showToast('对话已删除');
    }

    /**
     * 导出对话
     * @param {string} format - 导出格式（markdown/pdf/text）
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

        // 根据格式生成内容
        if (format === 'markdown') {
            content = title + conversation.messages.map(msg => {
                return `**${msg.role === 'user' ? '用户' : '助手'} (${msg.timestamp})**:\n${msg.content}\n`;
            }).join('\n');

            this.downloadFile(`${conversation.title}.md`, content);
        } else if (format === 'pdf') {
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
        a.click(); // 触发下载
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // 释放URL
    }

    /* ===================== */
    /* === 语音控制相关方法 === */
    /* ===================== */

    /**
     * 切换消息朗读状态
     * @param {HTMLElement} messageDiv - 消息元素
     */
    async toggleSpeakingMessage(messageDiv) {
        // 如果正在朗读当前消息，则停止
        if (this.currentSpeakingMessage === messageDiv) {
            this.stopSpeaking();
            this.currentSpeakingMessage = null;
            return;
        }
        
        // 如果正在朗读其他消息，先停止
        if (this.currentSpeakingMessage) this.stopSpeaking();
        
        try {
            this.currentSpeakingMessage = messageDiv;
            const speakBtn = messageDiv.querySelector('.speak-btn');
            speakBtn.textContent = '⏹️'; // 更新按钮状态
            
            // 获取消息内容
            const content = messageDiv.querySelector('.message-content').textContent;
            const role = messageDiv.classList.contains('user-message') ? '用户说：' : '助手回答：';
            
            // 调用API朗读文本
            await this.apiManager.speakText(role + content, {
                rate: 1,
                pitch: 1,
                voice: this.getPreferredVoice() // 获取首选语音
            });
        } catch (error) {
            console.error('朗读失败:', error);
            this.showToast(`朗读失败: ${error.message}`);
        } finally {
            // 重置按钮状态
            if (this.currentSpeakingMessage === messageDiv) {
                const speakBtn = messageDiv.querySelector('.speak-btn');
                speakBtn.textContent = '🔊';
                this.currentSpeakingMessage = null;
            }
        }
    }

    /**
     * 停止朗读
     */
    stopSpeaking() {
        this.apiManager.stopSpeaking(); // 停止语音合成
        if (this.currentSpeakingMessage) {
            const speakBtn = this.currentSpeakingMessage.querySelector('.speak-btn');
            if (speakBtn) speakBtn.textContent = '🔊';
            this.currentSpeakingMessage = null;
        }
    }

    /**
     * 切换语音输入状态
     */
    async toggleListening() {
        if (this.isListening) {
            this.stopListening(); // 停止监听
            this.voiceInputBtn.innerHTML = '<span>🎤</span>';
            this.voiceInputBtn.classList.remove('active');
        } else {
            try {
                this.isListening = true;
                this.voiceInputBtn.innerHTML = '<span>🔴</span>'; // 录音中状态
                this.voiceInputBtn.classList.add('active');
                
                // 开始语音识别
                const transcript = await this.apiManager.startSpeechRecognition({
                    lang: 'zh-CN',
                    onInterimResult: (interim) => {
                        this.messageInput.placeholder = interim || '正在聆听...';
                    }
                });
                
                // 将识别结果填入输入框
                this.messageInput.value = transcript;
                this.messageInput.placeholder = '输入消息...按Enter发送，Shift+Enter换行';
            } catch (error) {
                console.error('语音识别失败:', error);
                this.showToast(`语音识别失败: ${error.message}`);
                this.messageInput.placeholder = '输入消息...按Enter发送，Shift+Enter换行';
            } finally {
                // 重置状态
                this.isListening = false;
                this.voiceInputBtn.innerHTML = '<span>🎤</span>';
                this.voiceInputBtn.classList.remove('active');
            }
        }
    }

    /**
     * 停止语音输入
     */
    stopListening() {
        this.isListening = false;
    }

    /**
     * 获取首选语音
     * @returns {string|null} 语音名称
     */
    getPreferredVoice() {
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
        return chineseVoice ? chineseVoice.name : null;
    }

    /* ===================== */
    /* === 配置管理相关方法 === */
    /* ===================== */

    /**
     * 更新可用模型列表
     */
    updateAvailableModels() {
        const selectedAPI = this.modelSelect.value;
        const availableModels = this.apiManager.getAvailableModelsForAPI(selectedAPI);
        this.availableModelSelect.innerHTML = '';

        // 填充可用模型选项
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
        this.saveSettings(); // 保存设置
    }

    /**
     * 保存设置
     */
    saveSettings() {
        const settings = {
            apiKey: this.apiKeyInput.value,
            apiUrl: this.apiUrlInput.value,
            ollamaUrl: this.ollamaUrlInput.value || 'http://localhost:11434',
            currentModel: this.modelSelect.value
        };
        localStorage.setItem('ai_chat_settings', JSON.stringify(settings));
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('ai_chat_settings') || '{}');
            // 更新UI输入值
            if (settings.apiKey) this.apiKeyInput.value = settings.apiKey;
            if (settings.apiUrl) this.apiUrlInput.value = settings.apiUrl;
            if (settings.ollamaUrl) this.ollamaUrlInput.value = settings.ollamaUrl;
            if (settings.currentModel) this.modelSelect.value = settings.currentModel;

            // 更新API管理器设置
            this.apiManager.setApiKey(settings.apiKey || '');
            this.apiManager.setApiUrl(settings.apiUrl || '');
            this.apiManager.setOllamaUrl(settings.ollamaUrl || 'http://localhost:11434');
            this.apiManager.setModel(settings.currentModel || 'qwen');
            this.updateAvailableModels(); // 更新模型列表
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    }

    /**
     * 清除所有设置
     */
    clearSettings() {
        if (confirm('确定要清除所有设置和会话历史吗？此操作不可撤销。')) {
            localStorage.clear(); // 清除本地存储
            this.loadSettings(); // 重新加载设置
            this.loadConversations(); // 重新加载对话
            this.createNewChat(); // 创建新对话
            this.showToast('已清除所有设置和会话历史');
        }
    }
}

// 应用初始化
let app;
window.onload = function() {
    app = new ChatApp(); // 创建应用实例
};