// Profiles Configuration and Logic
// douyinProfiles is loaded from douyin-data.js
let visibleCount = 6;
const defaultVisibleCount = 6;

// HTML escaping utility to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


// Language Translations
const translations = {
    vi: {
        back: "Quay lại",
        share_page: "Chia sẻ trang",
        search_placeholder: "Tìm kiếm kênh hoặc mô tả...",
        no_results: "Không tìm thấy tài khoản Douyin nào phù hợp.",
        channels_format: "{count} kênh",
        copied_profile: "Đã sao chép link profile!",
        copied_page: "Đã sao chép liên kết trang chia sẻ này!",
        qr_modal_title: "Quét mã QR",
        qr_inst_1: "Mở máy ảnh hoặc ứng dụng ",
        qr_inst_2: " trên điện thoại để quét mã QR và truy cập nhanh profile.",
        launch_btn: "Truy cập",
        all_cats: "Tất cả",
        featured_badge: "Nổi bật",
        load_more: "Xem thêm",
        loading_data: "Đang tải danh sách tài khoản...",
        import_btn: "Nhập nhanh",
        ip_label: "Vùng IP: ",
        categories: {
            tech: "Công nghệ",
            music: "Âm nhạc",
            lifestyle: "Đời sống",
            education: "Học tập",
            fashion: "Thời trang",
            cosplay: "Cosplay",
            cover: "Cover",
            game: "Trò chơi",
            girls: "Gái xinh",
            other: "Khác",
            cs2: "CS2",
            naraka: "Naraka",
            "delta force": "Delta Force"
        }
    },
    en: {
        back: "Back",
        share_page: "Share Page",
        search_placeholder: "Search channels or bio...",
        no_results: "No matching Douyin channels found.",
        channels_format: "{count} channels",
        copied_profile: "Copied profile link!",
        copied_page: "Copied page sharing link!",
        qr_modal_title: "Scan QR Code",
        qr_inst_1: "Open your camera or the ",
        qr_inst_2: " app to scan this QR code and access the profile.",
        launch_btn: "Open",
        all_cats: "All",
        featured_badge: "Featured",
        load_more: "Load More",
        loading_data: "Loading account list...",
        import_btn: "Quick Import",
        ip_label: "IP Region: ",
        categories: {
            tech: "Tech",
            music: "Music",
            lifestyle: "Lifestyle",
            education: "Education",
            fashion: "Fashion",
            cosplay: "Cosplay",
            cover: "Cover",
            game: "Game",
            girls: "Girls",
            other: "Other",
            cs2: "CS2",
            naraka: "Naraka",
            "delta force": "Delta Force"
        }
    }
};

let currentLang = localStorage.getItem('lang') || 'vi';
let selectedCategory = 'all';

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
    initBackgroundAnimation();
    initProfiles();
});

// Initialize profiles from locally loaded douyin-data.js
function initProfiles() {
    try {
        if (typeof douyinProfiles === 'undefined' || !Array.isArray(douyinProfiles)) {
            throw new Error('douyinProfiles is not loaded or invalid');
        }

        // Remove loading indicator from DOM
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.remove();

        syncLang();
        setupCategories();
        renderProfiles();
        enableHorizontalScroll();
    } catch (error) {
        console.error("Lỗi khi tải danh sách profile:", error);
        const container = document.getElementById('profiles-container');
        container.innerHTML = `
          <div style="text-align:center; padding:40px; color:#fe2c55; font-weight:600; background:var(--dy-card); border:1px solid var(--dy-border); border-radius:18px; backdrop-filter:blur(14px);">
            ${currentLang === 'vi' ? 'Không thể tải dữ liệu danh sách tài khoản. Vui lòng kiểm tra lại file douyin-data.js!' : 'Failed to load accounts data. Please check your douyin-data.js file!'}
          </div>
        `;
    }
}

// Enable desktop drag-to-scroll & mouse wheel horizontal scrolling for categories
function enableHorizontalScroll() {
    const slider = document.getElementById('categories-list');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse drag-to-scroll
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active-drag');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active-drag');
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active-drag');
    });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        slider.scrollLeft = scrollLeft - walk;
    });

    // Mouse wheel horizontal scroll conversion
    slider.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            slider.scrollLeft += e.deltaY * 0.8;
        }
    }, { passive: false });
}

// Synchronize language with localStorage
function syncLang() {
    document.documentElement.setAttribute('lang', currentLang);
    document.documentElement.setAttribute('data-lang', currentLang);

    // Translate static tags
    document.getElementById('back-btn').querySelector('span').textContent = translations[currentLang].back;
    document.getElementById('share-btn').querySelector('span').textContent = translations[currentLang].share_page;
    document.getElementById('search-input').placeholder = translations[currentLang].search_placeholder;
    document.getElementById('no-results').querySelector('span').textContent = translations[currentLang].no_results;

    const loadMoreBtnText = document.querySelector('.load-more-btn span');
    if (loadMoreBtnText) loadMoreBtnText.textContent = translations[currentLang].load_more;

    const importBtnText = document.querySelector('.import-btn span');
    if (importBtnText) importBtnText.textContent = translations[currentLang].import_btn;

    const tCount = translations[currentLang].channels_format.replace('{count}', douyinProfiles.length);
    document.getElementById('channels-count').textContent = tCount;

    if (currentLang === 'en') {
        document.getElementById('main-title').textContent = "VuND9x's Channels";
        document.getElementById('main-bio').textContent = "Welcome to my Douyin channels catalog. Here I share various interesting accounts across multiple categories.";
    } else {
        document.getElementById('main-title').textContent = "Danh sách Douyin của VuND9x";
        document.getElementById('main-bio').textContent = "Chào mừng bạn đến với danh sách kênh Douyin của tôi. Đây là nơi tôi chia sẻ những tài khoản chất lượng về nhiều chủ đề thú vị khác nhau.";
    }
}

// Set up category buttons
function setupCategories() {
    const catsList = document.getElementById('categories-list');
    catsList.innerHTML = '';

    // Create "All" pill
    const allPill = document.createElement('div');
    allPill.className = `category-pill ${selectedCategory === 'all' ? 'active' : ''}`;
    allPill.setAttribute('data-category', 'all');
    allPill.textContent = translations[currentLang].all_cats;
    allPill.onclick = () => selectCategory('all');
    catsList.appendChild(allPill);

    // Find unique individual categories from data (split by comma and trim)
    const allCats = [];
    douyinProfiles.forEach(p => {
        if (p.category) {
            p.category.split(',').forEach(c => {
                const trimmed = c.trim();
                if (trimmed && !allCats.includes(trimmed)) {
                    allCats.push(trimmed);
                }
            });
        }
    });

    // Sort categories for cleaner look
    allCats.sort();

    allCats.forEach(cat => {
        const pill = document.createElement('div');
        pill.className = `category-pill ${selectedCategory === cat ? 'active' : ''}`;
        pill.setAttribute('data-category', cat);
        const categories = translations[currentLang].categories;
        const lowerCat = cat.toLowerCase();
        const catLabel = (categories && Object.prototype.hasOwnProperty.call(categories, lowerCat)) ? categories[lowerCat] : cat;
        pill.textContent = catLabel;
        pill.onclick = () => selectCategory(cat);
        catsList.appendChild(pill);
    });
}

// Select category and update view
function selectCategory(cat) {
    selectedCategory = cat;
    visibleCount = defaultVisibleCount; // Reset pagination
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(p => {
        if (p.getAttribute('data-category') === cat) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });

    renderProfiles();
}

// Render profiles matching filter criteria
function renderProfiles() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const container = document.getElementById('profiles-container');

    // If profiles not loaded yet, keep loading spinner
    if (douyinProfiles.length === 0 && document.getElementById('loading-indicator')) {
        return;
    }

    container.innerHTML = '';

    const filtered = douyinProfiles.filter(p => {
        let matchesCategory = false;
        if (selectedCategory === 'all') {
            matchesCategory = true;
        } else if (p.category) {
            const catsList = p.category.split(',').map(c => c.trim());
            matchesCategory = catsList.includes(selectedCategory);
        }

        const matchesSearch = (p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query) ||
            p.bio.toLowerCase().includes(query));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('load-more-container').style.display = 'none';
        return;
    }

    document.getElementById('no-results').style.display = 'none';

    // Sort featured items to the top
    filtered.sort((a, b) => b.featured - a.featured);

    // Slice for pagination
    const sliced = filtered.slice(0, visibleCount);

    // Render show-more button if has more
    if (filtered.length > visibleCount) {
        document.getElementById('load-more-container').style.display = 'flex';
    } else {
        document.getElementById('load-more-container').style.display = 'none';
    }

    sliced.forEach(p => {
        const card = document.createElement('div');
        card.className = `profile-card ${p.featured ? 'featured' : ''}`;

        // Create Avatar wrapper
        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'card-avatar-wrapper';
        const avatarImg = document.createElement('img');
        avatarImg.className = 'card-avatar';
        avatarImg.src = p.avatar;
        avatarImg.alt = `${p.name} Avatar`;
        avatarImg.loading = 'lazy';
        avatarWrapper.appendChild(avatarImg);
        card.appendChild(avatarWrapper);

        // Create Info container
        const cardInfo = document.createElement('div');
        cardInfo.className = 'card-info';

        const headerRow = document.createElement('div');
        headerRow.className = 'card-header-row';
        const title = document.createElement('h2');
        title.className = 'card-title';
        title.textContent = p.name;
        headerRow.appendChild(title);

        // Add tags dynamically
        if (p.category) {
            p.category.split(',').map(c => c.trim()).forEach(cat => {
                const categories = translations[currentLang].categories;
                const lowerCat = cat.toLowerCase();
                const catLabel = (categories && Object.prototype.hasOwnProperty.call(categories, lowerCat)) ? categories[lowerCat] : cat;
                const tagSpan = document.createElement('span');
                tagSpan.className = 'card-tag';
                tagSpan.textContent = catLabel;
                headerRow.appendChild(tagSpan);
            });
        }

        // Add featured badge
        if (p.featured) {
            const featuredSpan = document.createElement('span');
            featuredSpan.className = 'featured-badge';
            featuredSpan.textContent = translations[currentLang].featured_badge;
            headerRow.appendChild(featuredSpan);
        }
        cardInfo.appendChild(headerRow);

        // Add ID & IP Location
        const cardIdDiv = document.createElement('div');
        cardIdDiv.className = 'card-id';
        cardIdDiv.textContent = `@${p.id}`;
        if (p.ip) {
            const ipLabel = translations[currentLang].ip_label || "IP: ";
            const ipSpan = document.createElement('span');
            ipSpan.className = 'card-ip';
            ipSpan.style.marginLeft = '8px';
            ipSpan.style.opacity = '0.7';
            ipSpan.style.fontSize = '0.8rem';
            ipSpan.style.fontFamily = 'var(--font-main)';
            ipSpan.style.color = 'var(--dy-text-muted)';
            ipSpan.textContent = `${ipLabel}${p.ip}`;
            cardIdDiv.appendChild(ipSpan);
        }
        cardInfo.appendChild(cardIdDiv);

        // Add Bio
        const bioP = document.createElement('p');
        bioP.className = 'card-bio';
        bioP.textContent = p.bio;
        cardInfo.appendChild(bioP);

        // Add Stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'card-stats';
        const followersText = currentLang === 'vi' ? 'Người theo dõi' : 'Followers';
        const likesText = currentLang === 'vi' ? 'Thích' : 'Likes';

        const followersDiv = document.createElement('div');
        followersDiv.className = 'stat-item';
        const followersStrong = document.createElement('strong');
        followersStrong.textContent = p.stats.followers;
        followersDiv.appendChild(followersStrong);
        followersDiv.appendChild(document.createTextNode(` ${followersText}`));
        statsDiv.appendChild(followersDiv);

        const likesDiv = document.createElement('div');
        likesDiv.className = 'stat-item';
        const likesStrong = document.createElement('strong');
        likesStrong.textContent = p.stats.likes;
        likesDiv.appendChild(likesStrong);
        likesDiv.appendChild(document.createTextNode(` ${likesText}`));
        statsDiv.appendChild(likesDiv);

        cardInfo.appendChild(statsDiv);
        card.appendChild(cardInfo);

        // Add Actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        // Copy Link Button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.title = 'Copy Link';
        copyBtn.onclick = () => copyLink(p.url);
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        actionsDiv.appendChild(copyBtn);

        // QR Code Button
        const qrBtn = document.createElement('button');
        qrBtn.className = 'action-btn qr-btn';
        qrBtn.title = 'Mã QR';
        qrBtn.onclick = () => showQrModal(p.url, p.id, p.name);
        qrBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="7" y1="17" x2="7" y2="17.01"></line><line x1="17" y1="17" x2="17" y2="17.01"></line><line x1="17" y1="7" x2="17" y2="7.01"></line><line x1="7" y1="7" x2="7" y2="7.01"></line></svg>`;
        actionsDiv.appendChild(qrBtn);

        // Launch Profile Link
        const launchBtn = document.createElement('a');
        launchBtn.className = 'action-btn launch-btn';
        launchBtn.href = p.url;
        launchBtn.target = '_blank';
        const launchSpan = document.createElement('span');
        launchSpan.textContent = translations[currentLang].launch_btn;
        launchBtn.appendChild(launchSpan);
        launchBtn.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`);
        actionsDiv.appendChild(launchBtn);

        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}

// Load more entries on button click
function loadMore() {
    visibleCount += defaultVisibleCount;
    renderProfiles();
}

// Filter wrapper for searching
function filterProfiles() {
    visibleCount = defaultVisibleCount; // Reset pagination when searching
    renderProfiles();
}

// Show dynamic QR code modal
function showQrModal(url, id, name) {
    const modal = document.getElementById('qr-modal');
    document.getElementById('modal-subtitle').textContent = `@${id} (${name})`;
    document.getElementById('modal-title').textContent = translations[currentLang].qr_modal_title;
    document.getElementById('qr-inst-text1').textContent = translations[currentLang].qr_inst_1;
    document.getElementById('qr-inst-text2').textContent = translations[currentLang].qr_inst_2;

    // Clear previous canvas if any
    const qrCanvas = document.getElementById('qr-canvas');

    // Generate new QR code using QRious
    new QRious({
        element: qrCanvas,
        value: url,
        size: 220,
        background: '#ffffff',
        foreground: '#161823',
        level: 'H'
    });

    modal.classList.add('active');
}

// Close QR modal
function closeModal(event) {
    const modal = document.getElementById('qr-modal');
    modal.classList.remove('active');
}

// Share link copy helpers
function copyLink(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(translations[currentLang].copied_profile);
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
}

function sharePage() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast(translations[currentLang].copied_page);
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
}

// --- Quick Import Tool Logic ---
function openImportModal() {
    document.getElementById('import-modal').classList.add('active');
    document.getElementById('import-text').value = '';
    document.getElementById('parsed-name').value = '';
    document.getElementById('parsed-id').value = '';
    document.getElementById('parsed-bio').value = '';
    document.getElementById('parsed-url').value = '';
    document.getElementById('parsed-followers').value = '';
    document.getElementById('parsed-likes').value = '';
    document.getElementById('parsed-ip').value = '';
    document.getElementById('parsed-avatar').value = '';
    document.getElementById('json-result').textContent = '{}';
}

function closeImportModal(event) {
    if (!event || event.target.id === 'import-modal' || event.target.closest('.modal-close')) {
        document.getElementById('import-modal').classList.remove('active');
    }
}

function parseInputText() {
    const text = document.getElementById('import-text').value.trim();
    if (!text) return;

    let name = "";
    let id = "";
    let bio = "";
    let url = "";
    let followers = "0";
    let likes = "0";
    let ip = "";

    // 1. Extract URL (works for both mobile share and web copy if they paste the link)
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        url = urlMatch[0];
        url = url.replace(/[.,，。，；;’'\"』』」]$/, '');
    }

    // Check if it is a multi-line string (copied from Douyin Web Header)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length >= 3 && !text.includes('的抖音号') && !text.includes('的抖音主页')) {
        // --- PARSING COPY FROM DOUYIN WEB HEADER (screenshot style) ---
        // SUTAW734-
        // 关注 280 | 粉丝 30.9万 | 获赞 1659.7万
        // 抖音号：Sutaw734 IP属地：上海 女
        // 日日是好日🫧

        // Line 0 is usually the name
        name = lines.at(0);

        // Loop through other lines to find stats, ID, IP and Bio
        for (let i = 1; i < lines.length; i++) {
            const line = lines.at(i);

            // Check for URL line
            if (line.startsWith('http') || line.includes('长按复制此条消息')) {
                continue;
            }

            // Check for ID & IP line
            if (line.includes('抖音号') || line.includes('ID')) {
                const idMatch = line.match(/(?:抖音号|ID)[：:]\s*([a-zA-Z0-9_.-]+)/i);
                if (idMatch) id = idMatch[1];

                const ipMatch = line.match(/IP属地[：:]\s*([^\s]+)/);
                if (ipMatch) ip = ipMatch[1];

                continue;
            }

            // Check for Stats line (followers, likes)
            if (line.includes('粉丝') || line.includes('获赞')) {
                const folMatch = line.match(/(?:粉丝[：:]?\s*([0-9.]+[万kKmM]?))|(([0-9.]+[万kKmM]?)\s*粉丝)/);
                if (folMatch) followers = folMatch[1] || folMatch[3];

                const likeMatch = line.match(/(?:获赞[：:]?\s*([0-9.]+[万kKmM]?))|(([0-9.]+[万kKmM]?)\s*获赞)/);
                if (likeMatch) likes = likeMatch[1] || likeMatch[3];

                continue;
            }

            // If it doesn't match above, and we have name, and it's not the URL, it must be the Bio!
            if (i === lines.length - 1 || (i === lines.length - 2 && lines.at(-1).startsWith('http'))) {
                bio = line;
            }
        }
    } else {
        // --- PARSING MOBILE SHARE TEXT ---
        // e.g. "【SUTAW734-】的抖音号：Sutaw734，日日是好日🫧。 https://v.douyin.com/..."

        // Extract Name
        const patBracket = text.match(/【([^】]+)】/);
        const patUserPage = text.match(/([^\s]+)\s*的抖音主页/);
        const patBeforeDy = text.match(/([^\s]+)\s*的抖音号/);

        if (patBracket) {
            name = patBracket[1];
        } else if (patUserPage) {
            name = patUserPage[1];
        } else if (patBeforeDy) {
            name = patBeforeDy[1];
        } else {
            // If no name found, look at first few words before URL
            const words = text.split(/[\s,，.。;；、]/).filter(w => w.trim().length > 0 && !w.startsWith('http') && !w.includes('长按复制'));
            if (words.length > 0) name = words.at(0);
        }

        // Extract ID
        const patDyId = text.match(/抖音号[是：:][\s]*([a-zA-Z0-9_.-]+)/);
        if (patDyId) {
            id = patDyId[1];
        } else if (url && url.includes('/user/')) {
            const urlParts = url.split('/');
            id = urlParts.at(-1) || "";
        }

        // Extract Followers / Likes
        const folMatch = text.match(/拥有\s*([0-9.]+[万kKmM]?)\s*粉丝/);
        if (folMatch) followers = folMatch[1];

        const likeMatch = text.match(/获赞\s*([0-9.]+[万kKmM]?)/);
        if (likeMatch) likes = likeMatch[1];

        // Extract IP Location
        const ipMatch = text.match(/IP属地[：:]\s*([^\s,，.。;；、]+)/);
        if (ipMatch) ip = ipMatch[1];

        // Extract Bio
        let cleanBio = text;
        if (url) cleanBio = cleanBio.replace(url, "");
        if (name) cleanBio = cleanBio.replace(name, "");
        if (id) cleanBio = cleanBio.replace(id, "");
        if (ip) cleanBio = cleanBio.replace(ip, "").replace(/IP属地[：:]/, "");

        cleanBio = cleanBio.replace(/【】|的抖音主页|的抖音号|是|：|:|拥有|粉丝|获赞|在抖音，记录美好生活！|在抖音, 记录美好生活!|点击链接|复制此链接，打开抖音搜索，direct观看视频！|复制此链接，打开抖音搜索，直接观看视频！|长按复制此条消息，打开抖音搜索，查看TA的更多作品。/g, "");
        bio = cleanBio.replace(/^[\s,，.。;；、/\\(（)）\-\_🫧]+|[\s,，.。;；、/\\(（)）\-\_🫧]+$/g, "").trim();

        const originalBioMatch = text.match(/的抖音号(?:是|：|:)\s*[a-zA-Z0-9_.-]+[\s,，.。;；、]*(.*?)(?:复制此链接|长按|https?:\/\/)/);
        if (originalBioMatch && originalBioMatch[1]) {
            const tempBio = originalBioMatch[1].replace(/^[\s,，.。;；、]+|[\s,，.。;；、]+$/g, "").trim();
            if (tempBio) bio = tempBio;
        }
    }

    // Update input fields
    document.getElementById('parsed-name').value = name || "Tên Kênh";
    document.getElementById('parsed-id').value = id || "Username";
    document.getElementById('parsed-bio').value = bio || "Chưa có tiểu sử";
    document.getElementById('parsed-url').value = url || "";
    document.getElementById('parsed-followers').value = followers || "0";
    document.getElementById('parsed-likes').value = likes || "0";
    document.getElementById('parsed-ip').value = ip || "";

    updateJsonResult();
}

function updateJsonResult() {
    const name = document.getElementById('parsed-name').value;
    const id = document.getElementById('parsed-id').value;
    const bio = document.getElementById('parsed-bio').value;
    const url = document.getElementById('parsed-url').value;
    const followers = document.getElementById('parsed-followers').value;
    const likes = document.getElementById('parsed-likes').value;
    const category = document.getElementById('parsed-category').value;
    const ip = document.getElementById('parsed-ip').value.trim();
    let avatar = document.getElementById('parsed-avatar').value;

    if (!avatar) {
        avatar = "https://avatars.githubusercontent.com/u/39915023";
    }

    const jsonObj = {
        name,
        id,
        url,
        avatar,
        bio,
        category,
        featured: false,
        stats: {
            followers,
            likes
        }
    };

    if (ip) {
        jsonObj.ip = ip;
    }

    document.getElementById('json-result').textContent = JSON.stringify(jsonObj, null, 2);
}

function copyJsonResult() {
    const code = document.getElementById('json-result').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast("Đã sao chép block JSON!");
    }).catch(err => {
        console.error("Lỗi copy JSON:", err);
    });
}

// Custom Toast Alert
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    // Create SVG element dynamically using SVG namespace
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'toast-success-icon');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '3');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(polyline);

    const span = document.createElement('span');
    span.textContent = message;

    toast.appendChild(svg);
    toast.appendChild(span);
    container.appendChild(toast);

    // Force reflow and show
    setTimeout(() => toast.classList.add('show'), 50);

    // Fade out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- Neon Particles Canvas Background Effect ---
function initBackgroundAnimation() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 18000), 55);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.4,
            color: Math.random() > 0.5 ? '#fe2c55' : '#25f4ee',
            alpha: Math.random() * 0.3 + 0.1,
            pulse: Math.random() > 0.5 ? 1 : -1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw particles
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();

            // Move
            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap boundaries
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Pulse opacity slightly
            p.alpha += 0.003 * p.pulse;
            if (p.alpha > 0.5 || p.alpha < 0.1) {
                p.pulse *= -1;
            }
        });

        ctx.globalAlpha = 1.0;
        requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
}