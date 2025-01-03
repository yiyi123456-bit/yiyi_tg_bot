document.addEventListener('DOMContentLoaded', () => {
    const addTextBtn = document.getElementById('addTextBtn');
    const textModal = document.getElementById('textModal');
    const closeModalBtn = document.querySelector('.close');
    const saveTextBtn = document.getElementById('saveTextBtn');
    const newTextArea = document.getElementById('newTextArea');
    const textTitle = document.getElementById('textTitle');
    const textCollection = document.getElementById('textCollection');

    // GitHub 配置
    const REPO_OWNER = 'yiyi123456-bit';
    const REPO_NAME = 'yiyi_tg_bot';
    const FILE_PATH = 'data/text_collection.json';
    const RAW_FILE_URL = `https://${REPO_OWNER}.github.io/${REPO_NAME}/${FILE_PATH}`;

    // 调试函数：记录详细日志
    function debugLog(message, data = null) {
        console.log(`[TextCollection Debug] ${message}`);
        if (data) console.log(data);
    }

    // 对中文字符进行 Base64 编码的安全方法
    function safeBase64Encode(str) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(str))));
    }

    // 从 GitHub 获取文本
    async function fetchTextsFromGitHub() {
        try {
            debugLog('开始获取文本', { url: RAW_FILE_URL });
            const response = await fetch(RAW_FILE_URL, {
                cache: 'no-store'  // 禁用缓存
            });

            if (!response.ok) {
                debugLog('获取文本失败', { 
                    status: response.status, 
                    statusText: response.statusText 
                });
                return [];
            }

            const texts = await response.json();
            debugLog('成功获取文本', texts);
            return texts;
        } catch (error) {
            debugLog('获取文本时发生错误', error);
            return [];
        }
    }

    // 更新 GitHub 仓库中的文件
    async function updateTextsInGitHub(texts) {
        const githubToken = localStorage.getItem('githubToken');
        if (!githubToken) {
            debugLog('未找到 GitHub Token');
            alert('未找到 GitHub Token，请重新输入');
            return false;
        }

        try {
            debugLog('开始更新文件', { texts });

            // 先获取文件的当前 SHA
            const getShaResponse = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, 
                {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            let fileSha = '';
            if (getShaResponse.ok) {
                const fileInfo = await getShaResponse.json();
                fileSha = fileInfo.sha;
                debugLog('获取文件 SHA', { sha: fileSha });
            } else {
                debugLog('获取文件 SHA 失败', { 
                    status: getShaResponse.status, 
                    statusText: getShaResponse.statusText 
                });
                throw new Error(`获取文件 SHA 失败：${getShaResponse.status}`);
            }

            // 更新文件
            const updateResponse = await fetch(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, 
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: '更新文本收藏',
                        content: safeBase64Encode(texts),
                        sha: fileSha,
                        branch: 'master'
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorBody = await updateResponse.text();
                debugLog('更新文件失败', { 
                    status: updateResponse.status, 
                    errorBody 
                });
                throw new Error(`更新文件失败：${updateResponse.status}`);
            }

            debugLog('成功更新文件');
            return true;
        } catch (error) {
            debugLog('更新文本失败', error);
            alert(`更新失败：${error.message}。请检查 Token 权限。`);
            return false;
        }
    }

    // 加载已保存的文本
    async function loadSavedTexts() {
        try {
            const savedTexts = await fetchTextsFromGitHub();
            textCollection.innerHTML = ''; // 清空现有内容
            
            if (savedTexts.length === 0) {
                const noTextElement = document.createElement('div');
                noTextElement.textContent = '暂无文本，点击添加新文本开始收藏！';
                noTextElement.style.textAlign = 'center';
                noTextElement.style.color = '#888';
                textCollection.appendChild(noTextElement);
                return;
            }
            
            savedTexts.forEach((textItem, index) => {
                const textElement = document.createElement('div');
                textElement.classList.add('text-item');
                textElement.innerHTML = `
                    <h3>${textItem.title || `文本 ${index + 1}`}</h3>
                    <p>${textItem.content}</p>
                    <div class="text-actions">
                        <button class="delete-btn" data-index="${index}">删除</button>
                    </div>
                `;
                textCollection.appendChild(textElement);
            });

            // 为所有删除按钮添加事件监听器
            textCollection.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    const index = parseInt(e.target.getAttribute('data-index'), 10);
                    await deleteText(index);
                }
            });
        } catch (error) {
            debugLog('加载文本时发生错误', error);
            alert('加载文本失败，请稍后重试');
        }
    }

    // 删除文本
    async function deleteText(index) {
        try {
            const savedTexts = await fetchTextsFromGitHub();
            savedTexts.splice(index, 1);
            const result = await updateTextsInGitHub(savedTexts);
            if (result) {
                await loadSavedTexts();
            }
        } catch (error) {
            debugLog('删除文本失败', error);
            alert('删除文本失败，请稍后重试');
        }
    }

    // 打开模态框
    addTextBtn.addEventListener('click', () => {
        // 检查是否设置了 GitHub Token
        if (!localStorage.getItem('githubToken')) {
            const token = prompt('请输入 GitHub Personal Access Token（需要 repo 权限）:');
            if (token) {
                localStorage.setItem('githubToken', token);
            } else {
                alert('没有 Token 无法保存文本');
                return;
            }
        }

        textModal.style.display = 'block';
        newTextArea.value = '';
        textTitle.value = '';
    });

    // 关闭模态框
    closeModalBtn.addEventListener('click', () => {
        textModal.style.display = 'none';
    });

    // 保存文本
    saveTextBtn.addEventListener('click', async () => {
        const content = newTextArea.value.trim();
        const title = textTitle.value.trim();

        if (content) {
            try {
                const savedTexts = await fetchTextsFromGitHub();
                savedTexts.push({ title, content });
                const result = await updateTextsInGitHub(savedTexts);
                
                if (result) {
                    textModal.style.display = 'none';
                    await loadSavedTexts();
                }
            } catch (error) {
                debugLog('保存文本失败', error);
                alert('保存文本失败，请稍后重试');
            }
        } else {
            alert('请输入文本内容');
        }
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === textModal) {
            textModal.style.display = 'none';
        }
    });

    // 初始加载已保存的文本
    loadSavedTexts();
});
