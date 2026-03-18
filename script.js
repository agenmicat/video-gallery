class VideoGallery {
    constructor() {
        this.r2Url = 'https://pub-1f29bbf92bc64161a3a07e91bfba7525.r2.dev/videos.json';
        this.videos = [];
        this.currentPage = 1;
        this.videosPerPage = 20; // 4x5 = 20
        this.loadVideos().then(() => this.init());
    }

    async loadVideos() {
        try {
            const response = await fetch(this.r2Url);
            if (response.ok) {
                this.videos = await response.json();
                localStorage.setItem('videoGallery', JSON.stringify(this.videos));
            } else {
                this.videos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
            }
        } catch(e) {
            this.videos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
        }
        this.updateTagFilter();
    }

    init() {
        this.renderVideos();
        this.setupEventListeners();
    }

    // 🔥 PAGINATION 4x5
    getCurrentVideos() {
        const filterTag = document.getElementById('tagFilter').value;
        let filtered = this.videos;

        if (filterTag) {
            filtered = this.videos.filter(video => 
                video.tags && video.tags.includes(filterTag)
            );
        }

        const startIndex = (this.currentPage - 1) * this.videosPerPage;
        return filtered.slice(startIndex, startIndex + this.videosPerPage);
    }

    renderVideos() {
        const videos = this.getCurrentVideos();
        const grid = document.getElementById('videoGrid');
        grid.innerHTML = '';

        videos.forEach(video => {
            const card = this.createVideoCard(video);
            grid.appendChild(card);
        });

        this.renderPagination();
        document.title = `${this.videos.length} Videos - Gallery`;
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}" 
                     loading="lazy" 
                     onerror="this.src='https://source.unsplash.com/1280x720/?video'">
                ${video.tags ? video.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('') : ''}
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.duration}</p>
            </div>
        `;
        return card;
    }

    // 🔥 PAGINATION NUMBERING
    renderPagination() {
        const totalPages = Math.ceil(this.getTotalVideos() / this.videosPerPage);
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        // Previous
        const prev = document.createElement('button');
        prev.className = 'page-btn';
        prev.textContent = '← Prev';
        prev.disabled = this.currentPage === 1;
        prev.onclick = () => this.changePage(this.currentPage - 1);
        pagination.appendChild(prev);

        // Numbers
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => this.changePage(i);
            pagination.appendChild(btn);
        }

        // Next
        const next = document.createElement('button');
        next.className = 'page-btn';
        next.textContent = 'Next →';
        next.disabled = this.currentPage === totalPages;
        next.onclick = () => this.changePage(this.currentPage + 1);
        pagination.appendChild(next);
    }

    getTotalVideos() {
        const filterTag = document.getElementById('tagFilter').value;
        if (!filterTag) return this.videos.length;
        return this.videos.filter(v => v.tags && v.tags.includes(filterTag)).length;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderVideos();
    }

    // 🔥 TAGS FILTER
    updateTagFilter() {
        const select = document.getElementById('tagFilter');
        const tags = [...new Set(this.videos.flatMap(v => v.tags || []))];
        select.innerHTML = '<option value="">📂 Semua (' + this.videos.length + ')</option>';
        
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = `🏷️ ${tag}`;
            select.appendChild(option);
        });

        select.onchange = () => {
            this.currentPage = 1;
            this.renderVideos();
        };
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchVideos(e.target.value);
        });

        document.getElementById('videoGrid').addEventListener('click', (e) => {
            if (e.target.closest('.video-card')) {
                const videoId = e.target.closest('.video-card').dataset.videoId;
                this.openModal(parseInt(videoId));
            }
        });

        // Modal events (sama)
        document.querySelector('.close').onclick = () => this.closeModal();
        window.onclick = (e) => {
            if (e.target.classList.contains('modal')) this.closeModal();
        };
        document.onkeydown = (e) => {
            if (e.key === 'Escape') this.closeModal();
        };
    }

    searchVideos(query) {
        const filtered = this.videos.filter(video => 
            video.title.toLowerCase().includes(query.toLowerCase())
        );
        this.videos = filtered; // Temporary filter
        this.currentPage = 1;
        this.renderVideos();
    }

    // Modal functions (sama seperti sebelumnya)
    openModal(id) {
        const video = this.videos.find(v => v.id == id);
        if (!video) return;

        document.getElementById('videoTitle').textContent = video.title;
        const player = document.getElementById('videoPlayer');
        player.innerHTML = '';

        if (video.type === 'iframe' && video.embed) {
            player.innerHTML = `<iframe src="${video.embed}" frameborder="0" allowfullscreen allow="autoplay; fullscreen" style="width:100%;height:100%;"></iframe>`;
        } else if (video.type === 'mp4' && video.url) {
            player.innerHTML = `<video controls src="${video.url}" style="width:100%;height:100%;background:#000;"></video>`;
        }

        document.getElementById('videoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('videoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 🔥 FORM dengan TAGS
    addVideo() {
        const title = document.getElementById('videoTitleInput').value.trim();
        const thumb = document.getElementById('videoThumbInput').value.trim();
        const inputUrl = document.getElementById('videoEmbedInput').value.trim();
        const tagsInput = document.getElementById('videoTagInput').value.trim();
        const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

        if (!title || !inputUrl) {
            alert('❌ Judul & URL wajib!');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        const isMp4 = inputUrl.match(/\.(mp4|m3u8|webm)$/i);

        const newVideo = {
            id: Date.now(),
            title,
            tags,
            type: isMp4 ? 'mp4' : 'iframe',
            url: isMp4 ? inputUrl : '',
            embed: isMp4 ? '' : inputUrl,
            duration,
            thumbnail: thumb || `https://source.unsplash.com/1280x720/?${tags[0] || 'movie' || 'video'}`,
        };

        this.videos.unshift(newVideo);
        this.renderVideos();
        this.saveVideos();
        this.updateTagFilter();

        // Reset
        document.querySelectorAll('.form-group input').forEach(input => input.value = '');
        
        alert(`✅ "${title}" + ${tags.length} tags!\n📱 Page 1/20 videos`);
    }

    saveVideos() {
        localStorage.setItem('videoGallery', JSON.stringify(this.videos));
    }

    getProvider(url) {
        if (url.includes('voe.sx')) return 'movie';
        if (url.includes('streamtape')) return 'film';
        return 'video';
    }
}

let gallery;
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => gallery = new VideoGallery();
document.head.appendChild(hlsScript);