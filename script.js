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
                console.error('获取文本失败，状态码:', response.status);
                return [];
            }
            const texts = await response.json();
            console.log('获取到的文本:', texts);
            return texts;
        } catch (error) {
            console.error('获取文本时发生错误:', error);
            return [];
        }
    }

    // 更新 GitHub 仓库中的文件
    async function updateTextsInGitHub(texts) {
        const githubToken = localStorage.getItem('githubToken');
        if (!githubToken) {
            console.error('未找到 GitHub Token');
            alert('未找到 GitHub Token，请重新输入');
            return false;
        }

        try {
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
                        content: btoa(JSON.stringify(texts, null, 2)),
                        sha: fileSha,
                        branch: 'master'
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorBody = await updateResponse.text();
                console.error('更新文件失败，响应:', errorBody);
                throw new Error(`更新文件失败：${updateResponse.status}`);
            }

            console.log('成功更新文件');
            return true;
        } catch (error) {
            console.error('更新文本失败:', error);
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

            // 添加删除事件监听器
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const index = e.target.getAttribute('data-index');
                    await deleteText(index);
                });
            });
        } catch (error) {
            console.error('加载文本时发生错误:', error);
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
            console.error('删除文本失败:', error);
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
                console.error('保存文本失败:', error);
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
