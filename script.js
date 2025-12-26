// ===================================
// MOROCCAN NEWS - JAVASCRIPT
// ===================================

// Détection de la page actuelle
const isArticlePage = window.location.pathname.includes('article.html');

// News Data (Fallback statique)
let newsData = [
    {
        id: 1,
        category: 'politique',
        title: 'Le Maroc renforce ses relations diplomatiques avec l\'Union Européenne',
        excerpt: 'Une nouvelle ère de coopération s\'ouvre entre le Royaume du Maroc et l\'UE avec la signature de plusieurs accords stratégiques dans les domaines économique et sécuritaire.',
        date: '2025-12-25',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Parliament_of_Morocco.jpg/800px-Parliament_of_Morocco.jpg',
        featured: true
    },
    {
        id: 2,
        category: 'economie',
        title: 'Casablanca, moteur de la croissance économique nationale',
        excerpt: 'Investissements, infrastructures et innovation placent Casablanca au cœur de l’économie marocaine.',
        date: '2025-12-20',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Casablanca_Twin_Center.jpg/800px-Casablanca_Twin_Center.jpg',
        featured: false
    },
    {
        id: 3,
        category: 'sport',
        title: 'Le sport marocain poursuit son ascension',
        excerpt: 'Des performances remarquées sur la scène africaine et internationale.',
        date: '2025-12-18',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Stade_d%27Agadir.jpg/800px-Stade_d%27Agadir.jpg',
        featured: false
    },
    {
        id: 4,
        category: 'culture',
        title: 'Marrakech brille par son patrimoine culturel',
        excerpt: 'Entre traditions et modernité, la culture marocaine séduit les visiteurs.',
        date: '2025-12-17',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Jemaa_el-Fnaa_Marrakech_Morocco.jpg/800px-Jemaa_el-Fnaa_Marrakech_Morocco.jpg',
        featured: false
    },
    {
        id: 5,
        category: 'technologie',
        title: 'Technopolis accélère l\'innovation au Maroc',
        excerpt: 'Startups et entreprises tech trouvent un écosystème propice à Rabat.',
        date: '2025-12-16',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Technopolis_Rabat.jpg/800px-Technopolis_Rabat.jpg',
        featured: false
    },
    {
        id: 6,
        category: 'actualite',
        title: 'Les dernières actualités nationales',
        excerpt: 'Un condensé des événements marquants de la semaine.',
        date: '2025-12-15',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Morocco_flag_wave.jpg/800px-Morocco_flag_wave.jpg',
        featured: false
    }
];

function getAdminDrafts() {
    try {
        return JSON.parse(localStorage.getItem('adminDrafts') || '[]');
    } catch { return []; }
}

function mergeDraftsIntoNews() {
    const drafts = getAdminDrafts();
    if (Array.isArray(drafts) && drafts.length) {
        const existingIds = new Set(newsData.map(n => n.id));
        const mergedDrafts = drafts.filter(d => d.status === 'published' && !existingIds.has(d.id));
        newsData = [...mergedDrafts, ...newsData];
    }
}

function applyAdminOverrides() {
    try {
        const overrides = JSON.parse(localStorage.getItem('adminOverrides') || '{}');
        if (!overrides || typeof overrides !== 'object') return;
        newsData = newsData.map(n => {
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
    } catch {}
}

// ===================================
// API FETCHING
// ===================================

const RSS_URL = 'https://www.hessouss.com/feed';
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

async function fetchNews() {
    const loader = document.getElementById('newsLoader');
    
    // Si on est sur la page article, on n'a pas besoin de fetcher les news
    // sauf si on veut afficher des suggestions (ce qui n'est pas le cas pour l'instant)
    if (isArticlePage) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            console.log('✅ Données récupérées depuis Hessouss:', data.items.length, 'articles');
            
            // Transformer les données API pour notre format
            newsData = data.items.map((item, index) => {
                // Essayer de trouver une image dans le contenu ou l'enclosure
                let imageUrl = item.enclosure?.link || item.thumbnail || extractImageFromHtml(item.content) || extractImageFromHtml(item.description);
                
                // Si pas d'image, chercher dans la description
                if (!imageUrl) {
                    const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) imageUrl = imgMatch[1];
                }

                // Nettoyer la description pour l'excerpt (enlever les balises HTML)
                const cleanDescription = item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...';

                // Déduire la catégorie
                let category = 'actualite';
                if (item.categories && item.categories.length > 0) {
                     const cat = item.categories[0].toLowerCase();
                     if (cat.includes('politique')) category = 'politique';
                     else if (cat.includes('economie') || cat.includes('économie')) category = 'economie';
                     else if (cat.includes('sport')) category = 'sport';
                     else if (cat.includes('culture')) category = 'culture';
                     else if (cat.includes('tech')) category = 'technologie';
                }

                return {
                    id: index + 100, 
                    category: category,
                    title: item.title,
                    excerpt: cleanDescription,
                    content: item.description, // Garder le contenu complet (ou description RSS) pour la page article
                    date: item.pubDate,
                    image: imageUrl || getFallbackImage(category), // Image par défaut améliorée
                    featured: index === 0,
                    link: item.link
                };
            });

            mergeDraftsIntoNews();
            applyAdminOverrides();

            // Masquer le loader
            if(loader) loader.style.display = 'none';

            // Rafraîchir l'affichage
            renderHero();
            renderHomeExtras();
            renderNews(currentCategory);
            observeNewsCards();
        } else {
            console.warn('⚠️ Flux RSS Hessouss vide ou invalide, utilisation des données statiques.');
            if(loader) loader.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des news:', error);
        if(loader) loader.style.display = 'none';
    }
}

// Extraction d'image depuis un contenu HTML (description/content RSS)
function extractImageFromHtml(html) {
    if (!html) return null;
    // Cherche la première balise <img ... src="...">
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
}

// Images de fallback de meilleure qualité (provenant de Wikimedia/Unsplash ou statiques fiables)
function getFallbackImage(category) {
    const images = {
        'politique': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Parliament_of_Morocco.jpg/800px-Parliament_of_Morocco.jpg',
        'economie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Casablanca_Twin_Center.jpg/800px-Casablanca_Twin_Center.jpg',
        'sport': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Stade_d%27Agadir.jpg/800px-Stade_d%27Agadir.jpg',
        'culture': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Jemaa_el-Fnaa_Marrakech_Morocco.jpg/800px-Jemaa_el-Fnaa_Marrakech_Morocco.jpg',
        'technologie': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Technopolis_Rabat.jpg/800px-Technopolis_Rabat.jpg',
        'actualite': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Morocco_flag_wave.jpg/800px-Morocco_flag_wave.jpg'
    };
    return images[category] || images['actualite'];
}

// Image placeholders mapping
const imagePlaceholders = {
    'hero-politics.jpg': 'politics_hero',
    'economy.jpg': 'economy_news',
    'sport.jpg': 'sport_news',
    'culture.jpg': 'culture_news',
    'technology.jpg': 'technology_news',
    'port.jpg': 'port_news',
    'chefchaouen.jpg': 'chefchaouen_news',
    'raja.jpg': 'raja_news',
    'satellite.jpg': 'satellite_news'
};

// ===================================
// THEME MANAGEMENT
// ===================================

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const html = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
if(themeIcon) updateThemeIcon(savedTheme);

// Theme toggle handler
if(themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if(themeIcon) themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// ===================================
// HERO SECTION
// ===================================

function renderHero() {
    const heroContent = document.getElementById('heroContent');
    if (!heroContent) return; // Sécurité si on n'est pas sur la home

    let featuredNews = newsData.find(news => news.featured);
    const overrideId = parseInt(localStorage.getItem('featuredOverrideId') || '0', 10);
    if (overrideId) {
        const candidate = newsData.find(n => n.id === overrideId);
        if (candidate) featuredNews = candidate;
    }

    if (!featuredNews) return;

    const isArabicHero = /[\u0600-\u06FF]/.test(featuredNews.title) || /[\u0600-\u06FF]/.test(featuredNews.excerpt || '');
    heroContent.innerHTML = `
        <div class="hero-card ${isArabicHero ? 'rtl' : ''}">
            <div class="hero-card-text">
                <span class="hero-badge">À la Une</span>
                <h1 class="hero-title">${featuredNews.title}</h1>
                <p class="hero-description">${featuredNews.excerpt}</p>
                <div class="hero-meta">
                    <span>📅 ${formatDate(featuredNews.date)}</span>
                    <span>📂 ${getCategoryName(featuredNews.category)}</span>
                </div>
            </div>
            <div class="hero-card-image" onclick="openArticle(${featuredNews.id})" style="cursor:pointer">
                <img src="${getImagePath(featuredNews.image)}" alt="${featuredNews.title}" loading="lazy">
            </div>
        </div>
    `;
}

let currentTag = null;
function renderHomeExtras() {
    const chipsEl = document.getElementById('trendsChips');
    const statsEl = document.getElementById('quickStats');
    if (!chipsEl || !statsEl) return;
    const tags = [];
    const seen = new Set();
    newsData.slice(0, 40).forEach(n => {
        buildTagsFromArticle(n).forEach(t => {
            const k = t.toLowerCase();
            if (!seen.has(k)) {
                seen.add(k);
                tags.push(t);
            }
        });
    });
    chipsEl.innerHTML = tags.slice(0, 12).map(t => `<button class="trend-chip${currentTag === t ? ' active' : ''}" data-tag="${t}">${t}</button>`).join('');
    chipsEl.querySelectorAll('.trend-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const t = btn.getAttribute('data-tag');
            currentTag = t === currentTag ? null : t;
            renderHomeExtras();
            renderNews(currentCategory);
        });
    });
    const total = newsData.length;
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = newsData.filter(n => new Date(n.date) >= weekStart).length;
    const categoriesCount = new Set(newsData.map(n => n.category)).size;
    statsEl.innerHTML = `
        <div class="quick-stat"><div class="label">Articles</div><div class="value">${total}</div></div>
        <div class="quick-stat"><div class="label">Cette semaine</div><div class="value">${weekCount}</div></div>
        <div class="quick-stat"><div class="label">Catégories</div><div class="value">${categoriesCount}</div></div>
    `;
}

// ===================================
// NEWS GRID
// ===================================

let currentCategory = 'all';

function renderNews(category = 'all') {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return; // Sécurité

    let filteredNews = category === 'all'
        ? newsData.filter(news => !news.featured)
        : newsData.filter(news => news.category === category && !news.featured);
    if (currentTag) {
        filteredNews = filteredNews.filter(n => buildTagsFromArticle(n).map(x => x.toLowerCase()).includes(currentTag.toLowerCase()));
    }

    newsGrid.innerHTML = filteredNews.map(news => {
        const isArabic = /[\u0600-\u06FF]/.test(news.title) || /[\u0600-\u06FF]/.test(news.excerpt || '');
        return `
        <article class="news-card">
            <div class="news-image-container">
                <img src="${getImagePath(news.image)}" alt="${news.title}" class="news-image" loading="lazy" onerror="this.src='${getFallbackImage(news.category)}'">
            </div>
            <div class="news-content ${isArabic ? 'rtl-block' : ''}" ${isArabic ? 'dir="rtl"' : ''}>
                <span class="news-category-badge">${getCategoryName(news.category)}</span>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <div class="news-meta">
                    <span class="news-date">📅 ${formatDate(news.date)}</span>
                    <a href="#" class="news-read-more" onclick="openArticle(${news.id}, event)">Lire plus →</a>
                </div>
            </div>
        </article>
    `;
    }).join('');
}

// ===================================
// ARTICLE NAVIGATION
// ===================================

function openArticle(id, event) {
    if (event) event.preventDefault();
    
    // Trouver l'article complet dans les données
    const article = newsData.find(n => n.id === id);
    
    if (article) {
        // Sauvegarder dans localStorage
        localStorage.setItem('currentArticle', JSON.stringify(article));
        // Rediriger
        window.location.href = 'article.html';
    }
}

// ===================================
// ARTICLE PAGE RENDERING
// ===================================

function renderArticlePage() {
    const articleHeader = document.getElementById('articleHeader');
    const articleBody = document.getElementById('articleBody');
    const breadcrumb = document.getElementById('articleBreadcrumb');
    const shareBar = document.getElementById('articleShare');
    const tagsEl = document.getElementById('articleTags');
    const relatedGrid = document.getElementById('relatedGrid');
    const relatedSection = document.getElementById('relatedArticles');
    const aiReaderMsg = document.getElementById('aiReaderMsg');
    const aiSummary = document.getElementById('aiSummary');
    const aiPlay = document.getElementById('aiPlay');
    const aiPause = document.getElementById('aiPause');
    const aiResume = document.getElementById('aiResume');
    const aiStop = document.getElementById('aiStop');
    const aiRate = document.getElementById('aiRate');
    const aiVoice = document.getElementById('aiVoice');
    const aiSummarize = document.getElementById('aiSummarize');
    
    if (!articleHeader || !articleBody) return;

    // Récupérer l'article depuis le storage
    const storedArticle = localStorage.getItem('currentArticle');
    
    if (!storedArticle) {
        // Si pas d'article, rediriger vers l'accueil
        window.location.href = 'index.html';
        return;
    }

    const article = JSON.parse(storedArticle);
    
    if (breadcrumb) {
        breadcrumb.innerHTML = `<a href="index.html">Accueil</a> › <a href="index.html?category=${article.category}">${getCategoryName(article.category)}</a> › <span>${article.title}</span>`;
    }
    
    const reading = computeReadingTime(article.content || article.excerpt || '');
    articleHeader.innerHTML = `<span class="article-category">${getCategoryName(article.category)}</span><h1 class="article-title">${article.title}</h1><div class="article-meta"><span>📅 ${formatDate(article.date)}</span><span>⏱️ ${reading} min de lecture</span></div>`;
    
    let content = article.content || article.excerpt;
    
    const hasImageInContent = content.includes('<img');
    
    let imageHtml = '';
    if (!hasImageInContent) {
        imageHtml = `
            <div class="article-image-container">
                <img src="${getImagePath(article.image)}" alt="${article.title}" class="article-image" loading="lazy" onerror="this.src='${getFallbackImage(article.category)}'">
            </div>
        `;
    }
    
    articleBody.innerHTML = imageHtml + content;
    
    const contentImages = articleBody.querySelectorAll('img');
    contentImages.forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = 'var(--radius-md)';
        img.style.margin = 'var(--spacing-md) 0';
        img.style.boxShadow = 'var(--shadow-sm)';
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
        img.onerror = () => {
            img.src = getFallbackImage(article.category);
        };
    });
    
    const isArabic = /[\u0600-\u06FF]/.test(content);
    if (isArabic) {
        articleBody.classList.add('rtl-article');
        articleBody.setAttribute('dir', 'rtl');
        articleBody.style.textAlign = 'right';
        articleBody.style.direction = 'rtl';
        if (shareBar) {
            shareBar.style.justifyContent = 'flex-end';
            shareBar.style.direction = 'rtl';
        }
        if (tagsEl) {
            tagsEl.style.justifyContent = 'flex-end';
            tagsEl.style.direction = 'rtl';
        }
        if (articleHeader) {
            articleHeader.style.textAlign = 'right';
            articleHeader.style.direction = 'rtl';
            const meta = articleHeader.querySelector('.article-meta');
            if (meta) {
                meta.style.justifyContent = 'flex-end';
                meta.style.direction = 'rtl';
            }
            const titleEl = articleHeader.querySelector('.article-title');
            if (titleEl) {
                titleEl.style.fontFamily = "'Noto Naskh Arabic','Amiri','Scheherazade New', serif";
            }
        }
        if (breadcrumb) {
            breadcrumb.style.justifyContent = 'flex-end';
            breadcrumb.style.direction = 'rtl';
        }
        if (relatedSection) {
            relatedSection.style.direction = 'rtl';
            const title = relatedSection.querySelector('.related-title');
            if (title) title.style.textAlign = 'right';
        }
        if (relatedGrid) {
            relatedGrid.style.direction = 'rtl';
            const contents = relatedGrid.querySelectorAll('.related-content');
            contents.forEach(c => c.style.textAlign = 'right');
            const items = relatedGrid.querySelectorAll('.related-title-item');
            items.forEach(i => {
                i.style.fontFamily = "'Noto Naskh Arabic','Amiri','Scheherazade New', serif";
                i.style.fontSize = '1.15rem';
            });
        }
    }
    
    if (shareBar) {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(article.title);
        const shareLabel = isArabic ? 'شارك:' : 'Partager:';
        const shareTitle = isArabic ? 'شارك على فيسبوك' : 'Partager sur Facebook';
        const fbAria = isArabic ? 'فيسبوك' : 'Facebook';
        shareBar.innerHTML = `<span class="share-title">${shareLabel}</span>
            <a class="share-btn" href="https://www.facebook.com/hessousspress" target="_blank" rel="noopener" aria-label="${fbAria}" title="${shareTitle}">
                <img src="icons/facebook.svg" alt="${fbAria}" width="20" height="20">
            </a>`;
        const copyBtn = document.getElementById('copyLinkBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    copyBtn.textContent = isArabic ? 'تم نسخ الرابط' : 'Lien copié';
                    setTimeout(() => (copyBtn.textContent = isArabic ? 'نسخ الرابط' : 'Copier le lien'), 1500);
                } catch {}
            });
        }
    }
    
    if (tagsEl) {
        const tags = buildTagsFromArticle(article);
        tagsEl.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');
    }
    
    if (relatedGrid) {
        const overridesMap = JSON.parse(localStorage.getItem('recommendedOverrides') || '{}');
        const overrideIds = overridesMap[String(article.id)] || [];
        const candidates = newsData.filter(n => n.id !== article.id);
        const isArabicArticle = /[\u0600-\u06FF]/.test(article.title) || /[\u0600-\u06FF]/.test((article.excerpt || article.content || ''));
        const isArabicText = (n) => /[\u0600-\u06FF]/.test(n.title) || /[\u0600-\u06FF]/.test(n.excerpt || '');

        let related = [];
        if (overrideIds.length) {
            related = overrideIds
                .map(id => candidates.find(n => n.id === id))
                .filter(Boolean)
                .slice(0, 3);
        }
        if (related.length < 3) {
            const remaining = candidates.filter(n => !related.some(r => r.id === n.id));
            const byCat = remaining
                .filter(n => n.category === article.category)
                .filter(n => isArabicArticle ? isArabicText(n) : true)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            related = [...related, ...byCat].slice(0, 3);
        }
        if (related.length < 3) {
            const remaining2 = candidates.filter(n => !related.some(r => r.id === n.id));
            const extras = (isArabicArticle
                ? remaining2.filter(isArabicText)
                : remaining2)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3 - related.length);
            related = [...related, ...extras];
        }
        relatedGrid.innerHTML = related.map(n => `
            <div class="related-card" onclick="openArticle(${n.id})" style="cursor:pointer">
                <img class="related-img" src="${getImagePath(n.image)}" alt="${n.title}" loading="lazy" onerror="this.src='${getFallbackImage(n.category)}'">
                <div class="related-content">
                    <span class="related-cat">${getCategoryName(n.category)}</span>
                    <div class="related-title-item">${n.title}</div>
                    <div class="related-meta">${formatDate(n.date)}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Mettre à jour le titre de la page
    document.title = `${article.title} - Hessouss`;

    // Initialiser lecteur vocal IA et résumé local
    setupAIReader({
        article,
        aiReaderMsg,
        aiSummary,
        aiPlay,
        aiPause,
        aiResume,
        aiStop,
        aiRate,
        aiVoice,
        aiSummarize
    });
}

function computeReadingTime(html) {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return minutes;
}

function buildTagsFromArticle(article) {
    const base = [getCategoryName(article.category)];
    const userTags = Array.isArray(article.tags) ? article.tags : [];
    const titleWords = (article.title || '').split(' ').filter(w => w.length > 3).slice(0, 3);
    const all = [...base, ...userTags, ...titleWords];
    const seen = new Set();
    return all.filter(t => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 6);
}

// ===================================
// AI READER (TTS + LOCAL SUMMARY)
// ===================================
let ttsQueue = [];
let ttsIndex = 0;
let currentUtterance = null;
function getArticlePlainText() {
    const bodyEl = document.getElementById('articleBody');
    if (!bodyEl) return '';
    const html = bodyEl.innerHTML;
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    return text;
}
function splitTextIntoChunks(text, maxLen = 400) {
    const sentences = text.split(/(?<=[\.\!\?\u061F\u060C…])\s+/);
    const chunks = [];
    let buf = '';
    sentences.forEach(s => {
        if ((buf + ' ' + s).trim().length > maxLen) {
            if (buf) chunks.push(buf.trim());
            buf = s;
        } else {
            buf = (buf ? buf + ' ' : '') + s;
        }
    });
    if (buf) chunks.push(buf.trim());
    return chunks;
}
function setupAIReader(refs) {
    const { aiReaderMsg, aiSummary, aiPlay, aiPause, aiResume, aiStop, aiRate, aiVoice, aiSummarize } = refs;
    if (!window.speechSynthesis) {
        if (aiReaderMsg) aiReaderMsg.textContent = 'Lecture vocale non disponible sur ce navigateur.';
        return;
    }
    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        if (!aiVoice) return;
        aiVoice.innerHTML = voices.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join('');
        const preferred = voices.find(v => v.lang.startsWith('fr')) || voices.find(v => v.lang.startsWith('ar')) || voices[0];
        if (preferred) aiVoice.value = preferred.name;
    }
    populateVoices();
    speechSynthesis.onvoiceschanged = populateVoices;
    function speak() {
        const text = getArticlePlainText();
        ttsQueue = splitTextIntoChunks(text);
        ttsIndex = 0;
        if (aiReaderMsg) aiReaderMsg.textContent = `Lecture en cours (${ttsQueue.length} segments)...`;
        speakNext();
    }
    function getSelectedVoice() {
        const name = aiVoice?.value;
        const voices = speechSynthesis.getVoices();
        return voices.find(v => v.name === name) || voices[0];
    }
    function speakNext() {
        if (ttsIndex >= ttsQueue.length) {
            if (aiReaderMsg) aiReaderMsg.textContent = 'Lecture terminée.';
            currentUtterance = null;
            return;
        }
        const chunk = ttsQueue[ttsIndex];
        const u = new SpeechSynthesisUtterance(chunk);
        const v = getSelectedVoice();
        if (v) u.voice = v;
        u.rate = parseFloat(aiRate?.value || '1.0');
        u.onend = () => {
            ttsIndex++;
            speakNext();
        };
        u.onerror = () => {
            ttsIndex++;
            speakNext();
        };
        currentUtterance = u;
        speechSynthesis.speak(u);
    }
    function pause() {
        speechSynthesis.pause();
        if (aiReaderMsg) aiReaderMsg.textContent = 'Lecture en pause.';
    }
    function resume() {
        speechSynthesis.resume();
        if (aiReaderMsg) aiReaderMsg.textContent = 'Lecture reprise.';
    }
    function stop() {
        speechSynthesis.cancel();
        currentUtterance = null;
        ttsQueue = [];
        ttsIndex = 0;
        if (aiReaderMsg) aiReaderMsg.textContent = 'Lecture arrêtée.';
    }
    function summarize() {
        const text = getArticlePlainText();
        const sentences = text.split(/(?<=[\.\!\?\u061F\u060C…])\s+/).filter(s => s && s.length > 20);
        const summary = sentences.slice(0, 3).join(' ');
        if (aiSummary) aiSummary.textContent = summary || 'Résumé indisponible.';
    }
    aiPlay?.addEventListener('click', () => { stop(); speak(); });
    aiPause?.addEventListener('click', pause);
    aiResume?.addEventListener('click', resume);
    aiStop?.addEventListener('click', stop);
    aiSummarize?.addEventListener('click', summarize);
    aiRate?.addEventListener('input', () => {
        if (currentUtterance) {
            if (aiReaderMsg) aiReaderMsg.textContent = `Vitesse: ${aiRate.value}x`;
        }
    });
}
// ===================================
// CATEGORY FILTERING
// ===================================

const categoryTabs = document.querySelectorAll('.category-tab');

categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        categoryTabs.forEach(t => t.classList.remove('active'));

        // Add active class to clicked tab
        tab.classList.add('active');

        // Get category and render news
        const category = tab.getAttribute('data-category');
        currentCategory = category;
        renderNews(category);
    });
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', options);
}

function getCategoryName(category) {
    const categories = {
        'politique': 'Politique',
        'economie': 'Économie',
        'sport': 'Sport',
        'culture': 'Culture',
        'technologie': 'Technologie'
    };
    return categories[category] || category;
}

function getImagePath(imageName) {
    if (imageName && (imageName.startsWith('http') || imageName.startsWith('data:'))) {
        return imageName;
    }

    // Use placeholder.com with category-specific colors
    const placeholders = {
        'hero-politics.jpg': 'https://via.placeholder.com/800x400/3D4E9F/FFFFFF?text=Politique',
        'economy.jpg': 'https://via.placeholder.com/800x400/2A3570/FFFFFF?text=Economie',
        'sport.jpg': 'https://via.placeholder.com/800x400/E8A547/000000?text=Sport',
        'culture.jpg': 'https://via.placeholder.com/800x400/D9734A/FFFFFF?text=Culture',
        'technology.jpg': 'https://via.placeholder.com/800x400/5A6BBF/FFFFFF?text=Technologie',
        'port.jpg': 'https://via.placeholder.com/800x400/2A3570/FFFFFF?text=Port+Tanger+Med',
        'chefchaouen.jpg': 'https://via.placeholder.com/800x400/5A6BBF/FFFFFF?text=Chefchaouen',
        'raja.jpg': 'https://via.placeholder.com/800x400/5A6BBF/FFFFFF?text=Raja+Casablanca',
        'satellite.jpg': 'https://via.placeholder.com/800x400/2A3570/FFFFFF?text=Satellite'
    };
    return placeholders[imageName] || 'https://via.placeholder.com/800x400/CCCCCC/000000?text=News';
}

// ===================================
// SMOOTH SCROLLING
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// SCROLL ANIMATIONS
// ===================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe news cards when they're added
function observeNewsCards() {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => observer.observe(card));
}

// ===================================
// HEADER SCROLL EFFECT
// ===================================

let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = 'var(--shadow-md)';
    } else {
        header.style.boxShadow = 'var(--shadow-sm)';
    }

    lastScroll = currentScroll;
});

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    mergeDraftsIntoNews();
    applyAdminOverrides();
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }
    // Si on est sur la page article
    if (isArticlePage) {
        renderArticlePage();
    } else {
        // Rendu initial de la home (avec données statiques temporaires)
        renderHero();
        renderHomeExtras();
        renderNews();
        observeNewsCards();

        // Récupération des données dynamiques
        fetchNews();

        // Activer le filtrage via paramètre d'URL ?category=...
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        if (catParam) {
            currentCategory = catParam;
            renderNews(catParam);
            categoryTabs.forEach(t => {
                const c = t.getAttribute('data-category');
                if (c === catParam) t.classList.add('active'); else t.classList.remove('active');
            });
        }
    }

    console.log('🇲🇦 Hessouss - Site chargé avec succès!');
});

// Re-observe cards when category changes
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setTimeout(() => {
            observeNewsCards();
        }, 100);
    });
});
