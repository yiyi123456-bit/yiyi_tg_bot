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
    const RAW_FILE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master/${FILE_PATH}`;

    // 从 GitHub 获取文本
    async function fetchTextsFromGitHub() {
        try {
            const response = await fetch(RAW_FILE_URL);
            if (!response.ok) {
                console.error('获取文本失败');
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error('获取文本失败:', error);
            return [];
        }
    }

    // 创建 GitHub Issue 来更新文本
    async function updateTextsViaIssue(texts) {
        try {
            const issueTitle = '更新文本收藏';
            const issueBody = '```json\n' + JSON.stringify(texts, null, 2) + '\n```';

            const response = await fetch('https://api.github.com/repos/yiyi123456-bit/yiyi_tg_bot/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `token ${localStorage.getItem('githubToken') || ''}`
                },
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody,
                    labels: ['text-collection-update']
                })
            });

            if (!response.ok) {
                throw new Error('创建 Issue 失败');
            }

            return true;
        } catch (error) {
            console.error('更新文本失败:', error);
            alert('更新失败，请检查 GitHub Token');
            return false;
        }
    }

    // 加载已保存的文本
    async function loadSavedTexts() {
        const savedTexts = await fetchTextsFromGitHub();
        textCollection.innerHTML = ''; // 清空现有内容
        
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

        // 添加删除事件监听器
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = e.target.getAttribute('data-index');
                await deleteText(index);
            });
        });
    }

    // 删除文本
    async function deleteText(index) {
        const savedTexts = await fetchTextsFromGitHub();
        savedTexts.splice(index, 1);
        await updateTextsViaIssue(savedTexts);
        await loadSavedTexts();
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
            const savedTexts = await fetchTextsFromGitHub();
            savedTexts.push({ title, content });
            await updateTextsViaIssue(savedTexts);
            
            textModal.style.display = 'none';
            await loadSavedTexts();
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
