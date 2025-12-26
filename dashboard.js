const isDashboardPage = window.location.pathname.includes('dashboard.html');

document.addEventListener('DOMContentLoaded', () => {
    if (!isDashboardPage) return;

    const loginPanel = document.getElementById('loginPanel');
    const dashboardPanels = document.getElementById('dashboardPanels');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginMsg = document.getElementById('loginMsg');
    const userInput = document.getElementById('adminUser');
    const passInput = document.getElementById('adminPass');

    const featuredSelect = document.getElementById('featuredSelect');
    const saveFeatured = document.getElementById('saveFeatured');
    const featuredMsg = document.getElementById('featuredMsg');

    const sourceArticle = document.getElementById('sourceArticle');
    const rec1 = document.getElementById('rec1');
    const rec2 = document.getElementById('rec2');
    const rec3 = document.getElementById('rec3');
    const saveRecs = document.getElementById('saveRecs');
    const clearRecs = document.getElementById('clearRecs');
    const recsMsg = document.getElementById('recsMsg');
    const exportJsonBtn = document.getElementById('exportJson');
    const copyJsonBtn = document.getElementById('copyJson');
    const syncMsg = document.getElementById('syncMsg');
    const exportApiBtn = document.getElementById('exportApi');
    const copyApiBtn = document.getElementById('copyApi');
    const ghOwnerInput = document.getElementById('ghOwner');
    const ghRepoInput = document.getElementById('ghRepo');
    const ghBranchInput = document.getElementById('ghBranch');
    const ghApiPathInput = document.getElementById('ghApiPath');
    const ghTokenInput = document.getElementById('ghToken');
    const ghAutoPushInput = document.getElementById('ghAutoPush');
    const ghSaveBtn = document.getElementById('ghSave');
    const ghPushApiBtn = document.getElementById('ghPushApi');
    const ghMsg = document.getElementById('ghMsg');
    const statsGrid = document.getElementById('statsGrid');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const articlesTable = document.getElementById('articlesTable')?.querySelector('tbody');
    const tableHead = document.getElementById('articlesTable')?.querySelector('thead');
    let currentSort = { key: 'date', dir: 'desc' };
    const createOverlay = document.getElementById('createOverlay');
    const createBtn = document.getElementById('createArticleBtn');
    const cancelCreate = document.getElementById('cancelCreate');
    const saveCreate = document.getElementById('saveCreate');
    const createMsg = document.getElementById('createMsg');
    const newImageFile = document.getElementById('newImageFile');
    const newImagePreview = document.getElementById('newImagePreview');
    let imageDataURL = '';
    const newStatus = document.getElementById('newStatus');
    const newSource = document.getElementById('newSource');
    const tabAll = document.getElementById('tabAll');
    const tabDraft = document.getElementById('tabDraft');
    const tabPublished = document.getElementById('tabPublished');
    let currentStatus = 'all';
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const articlesCards = document.getElementById('articlesCards');
    const editOverlay = document.getElementById('editOverlay');
    const editTitle = document.getElementById('editTitle');
    const editExcerpt = document.getElementById('editExcerpt');
    const editContent = document.getElementById('editContent');
    const editTags = document.getElementById('editTags');
    const editCategory = document.getElementById('editCategory');
    const editImageFile = document.getElementById('editImageFile');
    const editImagePreview = document.getElementById('editImagePreview');
    const editImage = document.getElementById('editImage');
    const editSource = document.getElementById('editSource');
    const cancelEdit = document.getElementById('cancelEdit');
    const saveEdit = document.getElementById('saveEdit');
    const editMsg = document.getElementById('editMsg');
    let editImageDataURL = '';
    let editingId = null;
    let currentPage = 1;
    const pageSize = 10;
    let totalPages = 1;

    const AUTH_KEY = 'adminAuth';
    const DEFAULT_USER = 'admin';
    const DEFAULT_PASS = 'Hessouss2025!';
    const DEFAULT_PIN = '2468';
    const CREDS_KEY = 'adminCreds';
    const PIN_KEY = 'dashboardPIN';

    function updateAuthUI() {
        const auth = sessionStorage.getItem(AUTH_KEY) === 'true';
        loginPanel.classList.toggle('hidden', auth);
        dashboardPanels.classList.toggle('hidden', !auth);
    }

    function getCreds() {
        const stored = JSON.parse(localStorage.getItem(CREDS_KEY) || '{}');
        return {
            user: stored.user || DEFAULT_USER,
            pass: stored.pass || DEFAULT_PASS
        };
    }

    function getPIN() {
        return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    }

    function authenticate(user, pass) {
        const creds = getCreds();
        if (user === creds.user && pass === creds.pass) {
            sessionStorage.setItem(AUTH_KEY, 'true');
            updateAuthUI();
            initDashboard();
            loginMsg.textContent = '';
        } else {
            loginMsg.textContent = 'Identifiants invalides';
        }
    }

    loginBtn.addEventListener('click', () => {
        authenticate(userInput.value.trim(), passInput.value);
    });
    passInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') authenticate(userInput.value.trim(), passInput.value);
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem(AUTH_KEY);
        updateAuthUI();
    });

    // PIN gate overlay
    const pinOverlay = document.getElementById('pinOverlay');
    const pinInput = document.getElementById('pinInput');
    const pinSubmit = document.getElementById('pinSubmit');
    const pinMsg = document.getElementById('pinMsg');

    function showPinOverlay() {
        pinOverlay.style.display = 'flex';
    }
    function hidePinOverlay() {
        pinOverlay.style.display = 'none';
    }
    function ensurePin() {
        const ok = sessionStorage.getItem('pinOK') === 'true';
        if (!ok) {
            showPinOverlay();
        }
    }
    pinSubmit.addEventListener('click', () => {
        const pin = pinInput.value.trim();
        if (pin && pin === getPIN()) {
            sessionStorage.setItem('pinOK', 'true');
            hidePinOverlay();
        } else {
            pinMsg.textContent = 'PIN incorrect';
        }
    });

    ensurePin();
    updateAuthUI();
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
        initDashboard();
    }

    async function ensureDataLoaded() {
        try {
            await fetchNews();
        } catch {}
    }

    function renderStats() {
        const total = newsData.length;
        const byCat = {};
        newsData.forEach(n => {
            byCat[n.category] = (byCat[n.category] || 0) + 1;
        });
        const entries = Object.entries(byCat);
        statsGrid.innerHTML = entries.map(([cat, count]) => `
            <div class="stat-card">
                <div class="stat-title">${getCategoryName(cat)}</div>
                <div class="stat-value">${count}</div>
            </div>
        `).join('') + `<div class="stat-card"><div class="stat-title">Total</div><div class="stat-value">${total}</div></div>`;

        const drafts = loadDrafts();
        const publishedDrafts = drafts.filter(d => d.status === 'published').length;
        const draftCount = drafts.length - publishedDrafts;
        const categoriesCount = Object.keys(byCat).length;
        const metricsHeader = document.getElementById('metricsHeader');
        const now = new Date();
        const startWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const inRange = (ds, a, b) => {
            const d = new Date(ds);
            return d >= a && d <= b;
        };
        const publishedItems = [...newsData, ...drafts.filter(d => d.status === 'published')];
        const thisWeek = publishedItems.filter(n => inRange(n.date, startWeek, now)).length;
        const prevWeek = publishedItems.filter(n => inRange(n.date, prevWeekStart, startWeek)).length;
        const deltaPublished = thisWeek - prevWeek;
        const draftThisWeek = drafts.filter(d => inRange(d.date, startWeek, now)).length;
        const draftPrevWeek = drafts.filter(d => inRange(d.date, prevWeekStart, startWeek)).length;
        const deltaDraft = draftThisWeek - draftPrevWeek;
        const catThisWeek = Object.keys(byCat).length;
        const catPrevWeek = new Set(newsData.filter(n => inRange(n.date, prevWeekStart, startWeek)).map(n => n.category)).size;
        const deltaCat = catThisWeek - catPrevWeek;
        const totalPrevWeek = newsData.filter(n => inRange(n.date, prevWeekStart, startWeek)).length;
        const deltaTotal = total - totalPrevWeek;
        if (metricsHeader) {
            metricsHeader.innerHTML = `
                <div class="metric-card">
                    <div class="metric-title">Publiés</div>
                    <div class="metric-value">${total + publishedDrafts}</div>
                    <div class="metric-sub">${deltaPublished >= 0 ? '▲ +' + deltaPublished : '▼ ' + deltaPublished} vs semaine passée</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Brouillons</div>
                    <div class="metric-value">${draftCount}</div>
                    <div class="metric-sub">${deltaDraft >= 0 ? '▲ +' + deltaDraft : '▼ ' + deltaDraft} vs semaine passée</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Catégories</div>
                    <div class="metric-value">${categoriesCount}</div>
                    <div class="metric-sub">${deltaCat >= 0 ? '▲ +' + deltaCat : '▼ ' + deltaCat} vs semaine passée</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Total</div>
                    <div class="metric-value">${total}</div>
                    <div class="metric-sub">${deltaTotal >= 0 ? '▲ +' + deltaTotal : '▼ ' + deltaTotal} vs semaine passée</div>
                </div>
            `;
        }
        updateTabCounts();
    }

    function updateTabCounts() {
        const drafts = loadDrafts();
        const draftCount = drafts.filter(d => d.status === 'draft').length;
        const publishedCount = drafts.filter(d => d.status === 'published').length + newsData.length;
        if (tabAll) tabAll.innerHTML = `Tous <span class="count">${newsData.length + drafts.length}</span>`;
        if (tabDraft) tabDraft.innerHTML = `Brouillons <span class="count">${draftCount}</span>`;
        if (tabPublished) tabPublished.innerHTML = `Publiés <span class="count">${publishedCount}</span>`;
    }
    function fillSelect(selectEl, items, includeEmpty = false) {
        selectEl.innerHTML = includeEmpty ? `<option value="">—</option>` : '';
        selectEl.innerHTML += items.map(n => `<option value="${n.id}">[${getCategoryName(n.category)}] ${n.title}</option>`).join('');
    }

    function fillCategoryFilter() {
        const cats = Array.from(new Set(newsData.map(n => n.category)));
        filterCategory.innerHTML = `<option value="all">Toutes catégories</option>` + cats.map(c => `<option value="${c}">${getCategoryName(c)}</option>`).join('');
    }

    function loadDrafts() {
        return JSON.parse(localStorage.getItem('adminDrafts') || '[]');
    }
    function saveDrafts(drafts) {
        localStorage.setItem('adminDrafts', JSON.stringify(drafts));
    }

    function renderTable() {
        if (!articlesTable) return;
        const q = (searchInput?.value || '').toLowerCase();
        const cat = filterCategory?.value || 'all';
        const featuredId = parseInt(localStorage.getItem('featuredOverrideId') || '0', 10);
        const rowsSource = [...loadDrafts(), ...newsData];
        let rows = rowsSource.filter(n => (cat === 'all' ? true : n.category === cat));
        if (currentStatus !== 'all') {
            rows = rows.filter(n => {
                if (!n.isDraft) return currentStatus === 'published';
                return n.status === currentStatus;
            });
        }
        if (q) rows = rows.filter(n => (n.title || '').toLowerCase().includes(q));
        rows = rows.sort((a, b) => {
            const k = currentSort.key;
            const dir = currentSort.dir === 'asc' ? 1 : -1;
            if (k === 'date') return (new Date(a.date) - new Date(b.date)) * dir;
            if (k === 'title') return a.title.localeCompare(b.title) * dir;
            if (k === 'category') return a.category.localeCompare(b.category) * dir;
            return 0;
        });
        totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const pageSlice = rows.slice(start, start + pageSize);
        articlesTable.innerHTML = pageSlice.map(n => `
            <tr>
                <td>${n.title}</td>
                <td>${getCategoryName(n.category)}</td>
                <td>${formatDate(n.date)}</td>
                <td>
                    ${n.isDraft ? (n.status === 'published' ? '<span class="badge badge-published">Publié</span>' : '<span class="badge badge-draft">Brouillon</span>') : '<span class="badge badge-published">Publié</span>'}
                    ${n.id === featuredId ? '<span class="badge" style="background: var(--hessouss-gold); color: #000; margin-left:6px;">Une</span>' : ''}
                </td>
                <td>
                    <button class="secondary-btn" data-action="view" data-id="${n.id}">Voir</button>
                    <button class="secondary-btn" data-action="edit" data-id="${n.id}">Modifier</button>
                    ${n.isDraft ? `<button class="primary-btn" data-action="toggle-publish" data-id="${n.id}">${n.status === 'published' ? 'Dépublier' : 'Publier'}</button>` : `<button class="primary-btn" data-action="activate-featured" data-id="${n.id}">Activer la Une</button>`}
                </td>
            </tr>
        `).join('');
        if (articlesCards) {
            articlesCards.innerHTML = pageSlice.map(n => `
                <div class="card-item">
                    <div class="card-item-title">${n.title}</div>
                    <div class="card-item-meta">
                        <span>${getCategoryName(n.category)}</span>
                        <span>•</span>
                        <span>${formatDate(n.date)}</span>
                        <span>•</span>
                        ${n.isDraft ? (n.status === 'published' ? '<span class="badge badge-published">Publié</span>' : '<span class="badge badge-draft">Brouillon</span>') : '<span class="badge badge-published">Publié</span>'}
                        ${n.id === featuredId ? '<span class="badge" style="background: var(--hessouss-gold); color: #000; margin-left:6px;">Une</span>' : ''}
                    </div>
                    <div class="card-item-actions">
                        <button class="secondary-btn" data-action="view" data-id="${n.id}">Voir</button>
                        <button class="secondary-btn" data-action="edit" data-id="${n.id}">Modifier</button>
                        ${n.isDraft ? `<button class="primary-btn" data-action="toggle-publish" data-id="${n.id}">${n.status === 'published' ? 'Dépublier' : 'Publier'}</button>` : `<button class="primary-btn" data-action="activate-featured" data-id="${n.id}">Activer la Une</button>`}
                    </div>
                </div>
            `).join('');
        }
        renderPagination();
    }

    function renderPagination() {
        if (!pageNumbers) return;
        pageNumbers.innerHTML = '';
        const maxButtons = Math.min(totalPages, 7);
        let start = Math.max(1, currentPage - 3);
        let end = Math.min(totalPages, start + maxButtons - 1);
        if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-number' + (i === currentPage ? ' active' : '');
            btn.textContent = String(i);
            btn.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });
            pageNumbers.appendChild(btn);
        }
        if (prevPageBtn && nextPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }
    function attachTableEvents() {
        if (!tableHead) return;
        tableHead.addEventListener('click', (e) => {
            const th = e.target.closest('th');
            if (!th || !th.dataset.sort) return;
            const key = th.dataset.sort;
            currentSort = {
                key,
                dir: (currentSort.key === key && currentSort.dir === 'asc') ? 'desc' : 'asc'
            };
            currentPage = 1;
            renderTable();
        });
        const table = document.getElementById('articlesTable');
        table.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = parseInt(btn.dataset.id, 10);
            const action = btn.dataset.action;
            if (action === 'view') {
                const item = newsData.find(n => n.id === id);
                const draftItem = loadDrafts().find(n => n.id === id);
                const itemToOpen = item || draftItem;
                if (itemToOpen) {
                    localStorage.setItem('currentArticle', JSON.stringify(itemToOpen));
                    window.open('article.html', '_blank');
                }
            } else if (action === 'activate-featured') {
                localStorage.setItem('featuredOverrideId', String(id));
                featuredMsg.textContent = 'Défini comme article à la Une';
            } else if (action === 'edit') {
                const drafts = loadDrafts();
                const draftItem = drafts.find(n => n.id === id);
                const item = draftItem || newsData.find(n => n.id === id);
                if (item) openEditModal(item);
            } else if (action === 'toggle-publish') {
                const drafts = loadDrafts();
                const idx = drafts.findIndex(n => n.id === id);
                if (idx >= 0) {
                    drafts[idx].status = drafts[idx].status === 'published' ? 'draft' : 'published';
                    saveDrafts(drafts);
                    renderTable();
                    featuredMsg.textContent = 'Statut mis à jour';
                    updateTabCounts();
                    const cfg = getGithubSettings();
                    if (cfg && cfg.autoPush) pushPublicApi();
                }
            }
        });
        if (articlesCards) {
            articlesCards.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const id = parseInt(btn.dataset.id, 10);
                const action = btn.dataset.action;
                if (action === 'view') {
                    const item = newsData.find(n => n.id === id);
                    const draftItem = loadDrafts().find(n => n.id === id);
                    const itemToOpen = item || draftItem;
                    if (itemToOpen) {
                        localStorage.setItem('currentArticle', JSON.stringify(itemToOpen));
                        window.open('article.html', '_blank');
                    }
                } else if (action === 'activate-featured') {
                    localStorage.setItem('featuredOverrideId', String(id));
                    featuredMsg.textContent = 'Défini comme article à la Une';
                } else if (action === 'edit') {
                    const drafts = loadDrafts();
                    const draftItem = drafts.find(n => n.id === id);
                    const item = draftItem || newsData.find(n => n.id === id);
                    if (item) openEditModal(item);
                } else if (action === 'toggle-publish') {
                    const drafts = loadDrafts();
                    const idx = drafts.findIndex(n => n.id === id);
                    if (idx >= 0) {
                        drafts[idx].status = drafts[idx].status === 'published' ? 'draft' : 'published';
                        saveDrafts(drafts);
                        renderTable();
                        featuredMsg.textContent = 'Statut mis à jour';
                        updateTabCounts();
                        const cfg = getGithubSettings();
                        if (cfg && cfg.autoPush) pushPublicApi();
                    }
                }
            });
        }

    function loadOverrides() {
        return JSON.parse(localStorage.getItem('adminOverrides') || '{}');
    }
    function saveOverrides(map) {
        localStorage.setItem('adminOverrides', JSON.stringify(map));
    }
    function buildExportData() {
        const drafts = loadDrafts();
        const overrides = loadOverrides();
        const featuredOverrideId = parseInt(localStorage.getItem('featuredOverrideId') || '0', 10);
        const recommendedOverrides = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
        return { drafts, overrides, featuredOverrideId, recommendedOverrides };
    }
    function downloadJson(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    function mergePublishedDraftsInto(items) {
        const drafts = loadDrafts().filter(d => d.status === 'published');
        const existing = new Set(items.map(n => n.id));
        const toAdd = drafts.filter(d => !existing.has(d.id));
        return [...toAdd, ...items];
    }
    function applyOverridesTo(items) {
        const overrides = loadOverrides();
        return items.map(n => {
            const ov = overrides[n.id];
            if (!ov) return n;
            return {
                ...n,
                title: ov.title || n.title,
                excerpt: ov.excerpt || n.excerpt,
                content: ov.content || n.content,
                category: ov.category || n.category,
                image: ov.image || n.image,
                link: ov.link || n.link,
                tags: Array.isArray(ov.tags) ? ov.tags : n.tags
            };
        });
    }
    function buildPublicApi() {
        let items = Array.isArray(newsData) ? newsData.slice() : [];
        items = mergePublishedDraftsInto(items);
        items = applyOverridesTo(items);
        const featuredId = parseInt(localStorage.getItem('featuredOverrideId') || '0', 10);
        const recommendations = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
        return { items, featuredId, recommendations };
    }
    const GH_SETTINGS_KEY = 'githubSettings';
    function getGithubSettings() {
        try {
            return JSON.parse(localStorage.getItem(GH_SETTINGS_KEY) || '{}');
        } catch { return {}; }
    }
    function saveGithubSettings(cfg) {
        localStorage.setItem(GH_SETTINGS_KEY, JSON.stringify(cfg));
    }
    function base64EncodeUnicode(str) {
        const utf8Bytes = new TextEncoder().encode(str);
        let binary = '';
        utf8Bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }
    async function getGitHubFileSha(owner, repo, path, branch, token) {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.sha || null;
    }
    async function pushGitHubFile({ owner, repo, branch, path, token, content, message }) {
        const sha = await getGitHubFileSha(owner, repo, path, branch, token);
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
        const body = {
            message,
            content: base64EncodeUnicode(content),
            branch
        };
        if (sha) body.sha = sha;
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }
        return await res.json();
    }
    async function pushPublicApi() {
        const cfg = getGithubSettings();
        if (!cfg || !cfg.owner || !cfg.repo || !cfg.branch || !cfg.path || !cfg.token) {
            if (ghMsg) ghMsg.textContent = 'Paramètres GitHub incomplets. Enregistrez owner, repo, branche, fichier et token.';
            return;
        }
        try {
            const api = buildPublicApi();
            const content = JSON.stringify(api, null, 2);
            if (ghMsg) ghMsg.textContent = 'Push en cours...';
            await pushGitHubFile({
                owner: cfg.owner,
                repo: cfg.repo,
                branch: cfg.branch,
                path: cfg.path,
                token: cfg.token,
                content,
                message: 'Dashboard: mise à jour automatique de hessouss-api.json'
            });
            if (ghMsg) ghMsg.textContent = 'API poussée sur GitHub avec succès.';
        } catch (e) {
            if (ghMsg) ghMsg.textContent = 'Échec du push: ' + (e?.message || 'Erreur inconnue');
        }
    }
    function openEditModal(item) {
        editingId = item.id;
        editMsg.textContent = '';
        editTitle.value = item.title || '';
        editExcerpt.value = item.excerpt || '';
        editContent.value = item.content || '';
        editTags.value = Array.isArray(item.tags) ? item.tags.join(', ') : '';
        editCategory.value = item.category || 'actualite';
        editImage.value = item.image || '';
        editSource.value = item.link || '';
        editImageDataURL = '';
        editImagePreview.style.display = 'none';
        editImagePreview.src = '';
        editOverlay.style.display = 'flex';
    }
    function closeEditModal() {
        editOverlay.style.display = 'none';
        editingId = null;
    }
    if (editImageFile) {
        editImageFile.addEventListener('change', () => {
            const file = editImageFile.files && editImageFile.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                editImageDataURL = reader.result;
                editImagePreview.src = editImageDataURL;
                editImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
    function saveEditArticle() {
        if (!editingId) return;
        const updated = {
            id: editingId,
            title: editTitle.value.trim(),
            excerpt: editExcerpt.value.trim(),
            content: editContent.value.trim(),
            category: editCategory.value,
            image: editImageDataURL || editImage.value.trim(),
            link: editSource.value.trim(),
            tags: (editTags.value.trim() ? editTags.value.trim().split(',').map(t => t.trim()).filter(Boolean) : [])
        };
        const drafts = loadDrafts();
        const idx = drafts.findIndex(n => n.id === editingId);
        if (idx >= 0) {
            drafts[idx] = { ...drafts[idx], ...updated };
            saveDrafts(drafts);
            editMsg.textContent = 'Brouillon mis à jour';
        } else {
            const overrides = loadOverrides();
            overrides[editingId] = { ...overrides[editingId], ...updated };
            saveOverrides(overrides);
            editMsg.textContent = 'Article modifié (override local)';
        }
        renderTable();
        setTimeout(closeEditModal, 800);
    }
    cancelEdit?.addEventListener('click', closeEditModal);
    saveEdit?.addEventListener('click', saveEditArticle);
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    function openCreateModal() {
        createMsg.textContent = '';
        document.getElementById('newTitle').value = '';
        document.getElementById('newExcerpt').value = '';
        document.getElementById('newContent').value = '';
        document.getElementById('newTags').value = '';
        document.getElementById('newCategory').value = 'actualite';
        document.getElementById('newImage').value = '';
        newStatus.value = 'draft';
        newSource.value = '';
        imageDataURL = '';
        newImagePreview.style.display = 'none';
        newImagePreview.src = '';
        createOverlay.style.display = 'flex';
    }
    function closeCreateModal() {
        createOverlay.style.display = 'none';
    }
    function publishNewArticle() {
        const title = document.getElementById('newTitle').value.trim();
        const excerpt = document.getElementById('newExcerpt').value.trim();
        const content = document.getElementById('newContent').value.trim();
        const tagsRaw = document.getElementById('newTags').value.trim();
        const category = document.getElementById('newCategory').value;
        const image = document.getElementById('newImage').value.trim();
        const status = newStatus.value;
        const sourceUrl = newSource.value.trim();
        if (!title || !excerpt) {
            createMsg.textContent = 'Titre et résumé sont requis';
            return;
        }
        const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
        const id = Date.now();
        const date = new Date().toISOString();
        const draft = { id, category, title, excerpt, content, date, image: imageDataURL || image, featured: false, tags, status, link: sourceUrl, isDraft: true };
        const drafts = loadDrafts();
        drafts.unshift(draft);
        saveDrafts(drafts);
        createMsg.textContent = 'Article publié (brouillon local)';
        renderTable();
        fillSelect(featuredSelect, [...drafts, ...newsData]);
        updateTabCounts();
        const cfg = getGithubSettings();
        if (cfg && cfg.autoPush) pushPublicApi();
        setTimeout(closeCreateModal, 800);
    }
    if (newImageFile) {
        newImageFile.addEventListener('change', () => {
            const file = newImageFile.files && newImageFile.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                imageDataURL = reader.result;
                newImagePreview.src = imageDataURL;
                newImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    function initDashboard() {
        ensureDataLoaded().then(() => {
            renderStats();
            fillSelect(featuredSelect, newsData);
            fillSelect(sourceArticle, newsData);
            fillSelect(rec1, newsData, true);
            fillSelect(rec2, newsData, true);
            fillSelect(rec3, newsData, true);
            fillCategoryFilter();
            renderTable();
            attachTableEvents();
            createBtn.addEventListener('click', openCreateModal);
            cancelCreate.addEventListener('click', closeCreateModal);
            saveCreate.addEventListener('click', publishNewArticle);
            function setActiveTab(tab, status) {
                [tabAll, tabDraft, tabPublished].forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentStatus = status;
                renderTable();
            }
            tabAll.addEventListener('click', () => setActiveTab(tabAll, 'all'));
            tabDraft.addEventListener('click', () => setActiveTab(tabDraft, 'draft'));
            tabPublished.addEventListener('click', () => setActiveTab(tabPublished, 'published'));

            const currentOverride = parseInt(localStorage.getItem('featuredOverrideId') || '0', 10);
            if (currentOverride) featuredSelect.value = String(currentOverride);

            const overridesMap = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
            sourceArticle.addEventListener('change', () => {
                const srcId = sourceArticle.value;
                const current = overridesMap[srcId] || [];
                rec1.value = current[0] ? String(current[0]) : '';
                rec2.value = current[1] ? String(current[1]) : '';
                rec3.value = current[2] ? String(current[2]) : '';
            });

            const creds = getCreds();
            document.getElementById('settingsUser').value = creds.user;
            document.getElementById('settingsPass').value = '';
            document.getElementById('settingsPIN').value = '';

            searchInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
            filterCategory.addEventListener('change', () => { currentPage = 1; renderTable(); });

            if (mobileMenuToggle) {
                mobileMenuToggle.addEventListener('click', () => {
                    document.body.classList.toggle('sidebar-open');
                });
            }
            if (mobileOverlay) {
                mobileOverlay.addEventListener('click', () => {
                    document.body.classList.remove('sidebar-open');
                });
            }
            document.querySelectorAll('.admin-link').forEach(a => {
                a.addEventListener('click', () => {
                    document.body.classList.remove('sidebar-open');
                });
            });
        });
    }

    saveFeatured.addEventListener('click', () => {
        const id = parseInt(featuredSelect.value, 10);
        if (id) {
            localStorage.setItem('featuredOverrideId', String(id));
            featuredMsg.textContent = 'Article à la Une enregistré';
        }
    });
    exportJsonBtn?.addEventListener('click', () => {
        const data = buildExportData();
        downloadJson('hessouss-data.json', data);
        if (syncMsg) syncMsg.textContent = 'Fichier exporté. Uploadez-le sur GitHub à la racine du site.';
    });
    copyJsonBtn?.addEventListener('click', async () => {
        try {
            const data = buildExportData();
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            if (syncMsg) syncMsg.textContent = 'JSON copié dans le presse-papiers.';
        } catch {
            if (syncMsg) syncMsg.textContent = 'Impossible de copier. Essayez l’export.';
        }
    });
    exportApiBtn?.addEventListener('click', () => {
        const api = buildPublicApi();
        downloadJson('hessouss-api.json', api);
        if (syncMsg) syncMsg.textContent = 'API exportée. Uploadez hessouss-api.json à la racine.';
    });
    copyApiBtn?.addEventListener('click', async () => {
        try {
            const api = buildPublicApi();
            await navigator.clipboard.writeText(JSON.stringify(api, null, 2));
            if (syncMsg) syncMsg.textContent = 'API JSON copié.';
        } catch {
            if (syncMsg) syncMsg.textContent = 'Impossible de copier l’API.';
        }
    });
    ghSaveBtn?.addEventListener('click', () => {
        const cfg = {
            owner: ghOwnerInput.value.trim(),
            repo: ghRepoInput.value.trim(),
            branch: ghBranchInput.value.trim(),
            path: ghApiPathInput.value.trim(),
            token: ghTokenInput.value.trim(),
            autoPush: !!ghAutoPushInput.checked
        };
        saveGithubSettings(cfg);
        if (ghMsg) ghMsg.textContent = 'Paramètres GitHub enregistrés localement.';
    });
    ghPushApiBtn?.addEventListener('click', () => {
        pushPublicApi();
    });

    document.getElementById('saveCreds').addEventListener('click', () => {
        const u = document.getElementById('settingsUser').value.trim();
        const p = document.getElementById('settingsPass').value;
        if (!u || !p) {
            document.getElementById('credsMsg').textContent = 'Utilisateur et mot de passe requis';
            return;
        }
        localStorage.setItem(CREDS_KEY, JSON.stringify({ user: u, pass: p }));
        document.getElementById('credsMsg').textContent = 'Identifiants enregistrés';
    });

    document.getElementById('savePIN').addEventListener('click', () => {
        const v = document.getElementById('settingsPIN').value.trim();
        if (!v) {
            document.getElementById('pinSaveMsg').textContent = 'PIN requis';
            return;
        }
        localStorage.setItem(PIN_KEY, v);
        document.getElementById('pinSaveMsg').textContent = 'PIN enregistré';
    });

    saveRecs.addEventListener('click', () => {
        const srcId = sourceArticle.value;
        if (!srcId) {
            recsMsg.textContent = 'Sélectionnez un article source';
            return;
        }
        const ids = [rec1.value, rec2.value, rec3.value]
            .map(v => parseInt(v || '0', 10))
            .filter(v => !!v && v !== parseInt(srcId, 10));
        const overridesMap = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
        overridesMap[srcId] = ids.slice(0, 3);
        localStorage.setItem('recommendedOverrides', JSON.stringify(overridesMap));
        recsMsg.textContent = 'Recommandations enregistrées';
    });

    clearRecs.addEventListener('click', () => {
        const srcId = sourceArticle.value;
        if (!srcId) {
            recsMsg.textContent = 'Sélectionnez un article source';
            return;
        }
        const overridesMap = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
        delete overridesMap[srcId];
        localStorage.setItem('recommendedOverrides', JSON.stringify(overridesMap));
        recsMsg.textContent = 'Recommandations effacées';
        rec1.value = '';
        rec2.value = '';
        rec3.value = '';
    });
});
