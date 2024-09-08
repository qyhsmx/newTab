document.addEventListener('DOMContentLoaded', () => {
    const searchEngine = document.getElementById('search-engine');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const gradientStart = document.getElementById('gradient-start');
    const gradientEnd = document.getElementById('gradient-end');
    const backgroundImage = document.getElementById('background-image');
    const searchEnginesContainer = document.getElementById('search-engines');
    const addSearchEngineButton = document.getElementById('add-search-engine');
    const closeSettingsButton = document.getElementById('close-settings');
    const overlay = document.getElementById('overlay');
    const useBingWallpaperButton = document.getElementById('use-bing-wallpaper');
    const backgroundTypeRadios = document.getElementsByName('background-type');
    const gradientSettings = document.getElementById('gradient-settings');
    const customImageSettings = document.getElementById('custom-image-settings');
    const changeBingWallpaperButton = document.getElementById('change-bing-wallpaper');

    let searchEngines = [
        { name: 'Google', url: 'https://www.google.com/search?q=' },
        { name: 'Bing', url: 'https://www.bing.com/search?q=' },
        { name: '百度', url: 'https://www.baidu.com/s?wd=' }
    ];

    // 加载保存的设置
    chrome.storage.sync.get(['backgroundType', 'gradientStart', 'gradientEnd', 'backgroundImage', 'searchEngines', 'currentSearchEngine'], (result) => {
        if (result.backgroundType) {
            document.querySelector(`input[name="background-type"][value="${result.backgroundType}"]`).checked = true;
        }
        if (result.gradientStart) gradientStart.value = result.gradientStart;
        if (result.gradientEnd) gradientEnd.value = result.gradientEnd;
        if (result.backgroundImage) backgroundImage.value = result.backgroundImage;
        if (result.searchEngines) searchEngines = result.searchEngines;
        if (result.currentSearchEngine) searchEngine.value = result.currentSearchEngine;
        updateBackgroundSettings();
        updateBackground();
        updateSearchEngines();
    });

    // 添加背景类型选择事件监听器
    backgroundTypeRadios.forEach(radio => {
        radio.addEventListener('change', updateBackgroundSettings);
    });

    // 搜索功能
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // 设置面板
    settingsButton.addEventListener('click', openSettings);
    closeSettingsButton.addEventListener('click', closeSettings);

    // 点击主页区域关闭设置面板
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
            closeSettings();
        }
    });

    // 更新背景设置显示
    function updateBackgroundSettings() {
        const selectedType = document.querySelector('input[name="background-type"]:checked').value;
        gradientSettings.style.display = selectedType === 'gradient' ? 'block' : 'none';
        customImageSettings.style.display = selectedType === 'custom' ? 'block' : 'none';
        changeBingWallpaperButton.classList.toggle('hidden', selectedType !== 'bing');
        updateBackground();
    }

    // 更新背景
    function updateBackground() {
        const selectedType = document.querySelector('input[name="background-type"]:checked').value;
        let backgroundStyle;

        switch (selectedType) {
            case 'gradient':
                backgroundStyle = `linear-gradient(to right, ${gradientStart.value}, ${gradientEnd.value})`;
                break;
            case 'custom':
                backgroundStyle = `url('${backgroundImage.value}') no-repeat center center fixed`;
                break;
            case 'bing':
                if (!backgroundImage.value.includes('bing.com')) {
                    setBingWallpaper();
                    return;
                }
                backgroundStyle = `url('${backgroundImage.value}') no-repeat center center fixed`;
                break;
        }

        document.body.style.background = backgroundStyle;
        document.body.style.backgroundSize = 'cover';

        // 保存设置
        chrome.storage.sync.set({
            backgroundType: selectedType,
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            backgroundImage: backgroundImage.value
        });
    }

    // 添加搜索引擎
    addSearchEngineButton.addEventListener('click', addSearchEngine);

    // 保存当前搜索引擎
    searchEngine.addEventListener('change', () => {
        chrome.storage.sync.set({ currentSearchEngine: searchEngine.value });
    });

    // 添加Bing壁纸按钮事件监听器
    useBingWallpaperButton.addEventListener('click', setBingWallpaper);

    // 添加更换Bing壁纸按钮事件监听器
    changeBingWallpaperButton.addEventListener('click', setBingWallpaper);

    async function setBingWallpaper() {
        try {
            const response = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1');
            const data = await response.json();
            const imageUrl = 'https://www.bing.com' + data.images[0].url;
            backgroundImage.value = imageUrl;
            updateBackground();
        } catch (error) {
            console.error('获取Bing壁纸失败:', error);
            alert('获取Bing壁纸失败，请稍后再试。');
        }
    }

    function performSearch() {
        const query = searchInput.value;
        if (!query) return;

        const selectedEngine = searchEngines.find(engine => engine.name.toLowerCase() === searchEngine.value);
        if (selectedEngine) {
            window.location.href = selectedEngine.url + encodeURIComponent(query);
        }
    }

    function updateSearchEngines() {
        searchEngine.innerHTML = '';
        searchEnginesContainer.innerHTML = '';
        searchEngines.forEach((engine, index) => {
            // 更新搜索引擎下拉菜单
            const option = document.createElement('option');
            option.value = engine.name.toLowerCase();
            option.textContent = engine.name;
            searchEngine.appendChild(option);

            // 更新设置面板中的搜索引擎列表
            const div = document.createElement('div');
            div.innerHTML = `
                <input type="text" value="${engine.name}" placeholder="搜索引擎名称">
                <input type="text" value="${engine.url}" placeholder="搜索 URL">
                <button class="remove-engine">删除</button>
            `;
            div.querySelector('.remove-engine').addEventListener('click', () => removeSearchEngine(index));
            searchEnginesContainer.appendChild(div);
        });

        // 保存设置
        chrome.storage.sync.set({ searchEngines });
    }

    function addSearchEngine() {
        searchEngines.push({ name: '新搜索引擎', url: 'https://' });
        updateSearchEngines();
    }

    function removeSearchEngine(index) {
        searchEngines.splice(index, 1);
        updateSearchEngines();
    }

    function openSettings() {
        settingsPanel.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSettings() {
        settingsPanel.classList.remove('open');
        overlay.classList.remove('active');
    }

    // 点击遮罩层关闭设置面板
    overlay.addEventListener('click', closeSettings);
});