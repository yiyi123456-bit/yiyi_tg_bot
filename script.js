document.addEventListener('DOMContentLoaded', () => {
    const addTextBtn = document.getElementById('addTextBtn');
    const textModal = document.getElementById('textModal');
    const closeModalBtn = document.querySelector('.close');
    const saveTextBtn = document.getElementById('saveTextBtn');
    const newTextArea = document.getElementById('newTextArea');
    const textTitle = document.getElementById('textTitle');
    const textCollection = document.getElementById('textCollection');

    // 加载已保存的文本
    function loadSavedTexts() {
        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
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
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                deleteText(index);
            });
        });
    }

    // 删除文本
    function deleteText(index) {
        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        savedTexts.splice(index, 1);
        localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
        loadSavedTexts();
    }

    // 打开模态框
    addTextBtn.addEventListener('click', () => {
        textModal.style.display = 'block';
        newTextArea.value = '';
        textTitle.value = '';
    });

    // 关闭模态框
    closeModalBtn.addEventListener('click', () => {
        textModal.style.display = 'none';
    });

    // 保存文本
    saveTextBtn.addEventListener('click', () => {
        const content = newTextArea.value.trim();
        const title = textTitle.value.trim();

        if (content) {
            const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
            savedTexts.push({ title, content });
            localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
            
            textModal.style.display = 'none';
            loadSavedTexts();
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
