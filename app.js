document.addEventListener('DOMContentLoaded', () => {
    // 1. 學員名單配置 (編號與姓名)
    const studentsList = [
        { id: 'teacher', name: '老師', isTeacher: true },
        { id: '02', name: '彭彥淳' },
        { id: '03', name: '李政緯' },
        { id: '04', name: '陳雅芬' },
        { id: '05', name: '曾琳潔' },
        { id: '06', name: '涂美珠' },
        { id: '07', name: '陳韋伶' },
        { id: '09', name: '陳姿伶' },
        { id: '10', name: '曾錦寶' },
        { id: '11', name: '呂幸彧' },
        { id: '12', name: '龔盛忠' },
        { id: '13', name: '彭泰維' },
        { id: '14', name: '藍云怡' }
    ];

    const gridContainer = document.getElementById('portfolio-grid');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Stats elements
    const totalCountEl = document.getElementById('total-count');
    const readyCountEl = document.getElementById('ready-count');
    const pendingCountEl = document.getElementById('pending-count');

    let loadedPortfolios = [];
    let currentFilter = 'all'; // 'all', 'ready', 'pending'
    let searchQuery = '';

    // 2. 異步載入所有學員作品資料
    async function loadAllPortfolios() {
        const fetchPromises = studentsList.map(async (student) => {
            const folderName = student.id;
            const portfolioUrl = `./${encodeURIComponent(folderName)}/portfolio.json`;
            
            // 預設資料 (若學員尚未上傳或發生錯誤時的 Fallback)
            const defaultData = {
                id: student.id,
                studentName: student.name,
                projectName: '尚未設定作品名稱',
                description: '這位學員正在努力開發精彩的網頁作品中，敬請期待！',
                githubUrl: '',
                isReady: false,
                folderName: folderName
            };

            try {
                const response = await fetch(portfolioUrl);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        ...defaultData,
                        ...data,
                        // 確保姓名與編號不會被學生誤蓋掉，依然保持名冊設定
                        id: student.id,
                        studentName: student.name,
                        folderName: folderName
                    };
                }
            } catch (err) {
                // 忽略錯誤，直接使用預設 fallback 資料
                console.warn(`Could not load portfolio for ${folderName}:`, err);
            }
            return defaultData;
        });

        loadedPortfolios = await Promise.all(fetchPromises);
        
        // 更新統計數據
        updateStats();
        
        // 渲染作品集
        renderPortfolioGrid();
    }

    // 3. 更新統計數據面版 (排除老師，只統計學生數據)
    function updateStats() {
        const students = loadedPortfolios.filter(p => p.id !== 'teacher');
        const total = students.length;
        const ready = students.filter(p => p.isReady).length;
        const pending = total - ready;

        totalCountEl.textContent = total;
        readyCountEl.textContent = ready;
        pendingCountEl.textContent = pending;
    }

    // 4. 渲染作品集 Grid
    function renderPortfolioGrid() {
        gridContainer.innerHTML = '';
        
        // 篩選符合條件的學員
        const filteredList = loadedPortfolios.filter(p => {
            const matchesSearch = 
                p.studentName.toLowerCase().includes(searchQuery) ||
                p.projectName.toLowerCase().includes(searchQuery) ||
                p.description.toLowerCase().includes(searchQuery);

            let matchesFilter = true;
            if (currentFilter === 'ready') {
                matchesFilter = p.isReady === true;
            } else if (currentFilter === 'pending') {
                matchesFilter = p.isReady === false;
            }

            return matchesSearch && matchesFilter;
        });

        // 查無資料時的處理
        if (filteredList.length === 0) {
            gridContainer.innerHTML = `
                <div class="no-results">
                    <i class="fa-regular fa-folder-open"></i>
                    <h3>找不到符合的作品</h3>
                    <p>嘗試輸入其他關鍵字或更改篩選條件</p>
                </div>
            `;
            return;
        }

        // 動態生成卡片
        filteredList.forEach(p => {
            const card = document.createElement('div');
            card.className = 'portfolio-card';
            
            // 決定作品連結與截圖
            const folderPath = `./${encodeURIComponent(p.folderName)}`;
            const screenshotFile = p.screenshot ? p.screenshot : 'screenshot.png';
            const screenshotSrc = `${folderPath}/${screenshotFile}`;
            const projectLink = `${folderPath}/index.html`;

            // 狀態與按鈕設定
            const statusBadge = p.isReady 
                ? '<span class="status-badge ready">已完成</span>' 
                : '<span class="status-badge pending">開發中</span>';

            const primaryBtnClass = p.isReady ? 'btn btn-primary' : 'btn btn-outline';
            const primaryBtnText = p.isReady ? '<i class="fa-solid fa-arrow-up-right-from-square"></i> 瀏覽作品' : '<i class="fa-solid fa-hourglass-half"></i> 瀏覽進度';
            
            const githubBtn = p.githubUrl 
                ? `<a href="${p.githubUrl}" target="_blank" class="btn btn-outline" title="查看 GitHub 原始碼"><i class="fa-brands fa-github"></i> 原始碼</a>` 
                : `<button class="btn btn-outline btn-disabled" disabled title="尚未提供原始碼"><i class="fa-brands fa-github"></i> 原始碼</button>`;

            // ID / 角色標籤
            const idBadge = p.id === 'teacher' 
                ? '<span class="student-id teacher-badge">老師</span>' 
                : `<span class="student-id">#${p.id}</span>`;

            card.innerHTML = `
                <div class="card-thumbnail">
                    <img src="${screenshotSrc}" alt="${p.projectName}" onerror="this.onerror=null; this.src='./assets/default-screenshot.svg';">
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <div class="student-meta">
                        ${idBadge}
                        <span class="student-name">${p.studentName}</span>
                    </div>
                    <h3 class="project-title">${p.projectName}</h3>
                    <p class="project-desc">${p.description}</p>
                </div>
                <div class="card-footer">
                    <a href="${projectLink}" class="${primaryBtnClass}">${primaryBtnText}</a>
                    ${githubBtn}
                </div>
            `;
            
            gridContainer.appendChild(card);
        });
    }

    // 5. 搜尋欄位監聽器 (即時輸入篩選)
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderPortfolioGrid();
    });

    // 6. 狀態篩選按鈕監聽器
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除舊的 active 樣式
            filterButtons.forEach(b => b.classList.remove('active'));
            // 加上新的 active 樣式
            e.currentTarget.classList.add('active');

            currentFilter = e.currentTarget.dataset.filter;
            
            // 加上網格漸變效果
            gridContainer.style.opacity = '0.3';
            setTimeout(() => {
                renderPortfolioGrid();
                gridContainer.style.opacity = '1';
            }, 150);
        });
    });

    // 7. 啟動加載
    loadAllPortfolios();
});
