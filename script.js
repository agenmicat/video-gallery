class VideoGallery {
    constructor() {
        this.r2Url = 'https://pub-1f29bbf92bc64161a3a07e91bfba7525.r2.dev/videos.json';
        this.allVideos = [];
        this.filteredVideos = [];
        this.currentPage = 1;
        this.videosPerPage = 20;
        this.currentTag = '';
        this.currentSearch = '';

        this.loadVideos().then(() => {
            this.init();
        });
    }

    async loadVideos() {
        try {
            const response = await fetch(this.r2Url);
            if (response.ok) {
                this.allVideos = await response.json();
                localStorage.setItem('videoGallery', JSON.stringify(this.allVideos));
                console.log('✅ R2 loaded:', this.allVideos.length, 'videos');
            } else {
                throw new Error('R2 failed');
            }
        } catch(e) {
            console.log('❌ R2 gagal, pakai localStorage');
            this.allVideos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
        }
        this.filteredVideos = [...this.allVideos];
    }

    init() {
        this.updateTagFilter();
        this.renderVideos();
        this.setupEventListeners();
    }

    saveVideos() {
        localStorage.setItem('videoGallery', JSON.stringify(this.allVideos));
    }

    // 🔥 FILTER + SEARCH
    applyFilter() {
        this.filteredVideos = this.allVideos.filter(video => {
            const matchTag = this.currentTag === '' || 
                (video.tags && video.tags.includes(this.currentTag));
            const matchSearch = this.currentSearch === '' || 
                video.title.toLowerCase().includes(this.currentSearch.toLowerCase());
            return matchTag && matchSearch;
        });
        this.currentPage = 1;
        this.renderVideos();
    }

    // 🔥 RENDER VIDEOS
    renderVideos() {
        const grid = document.getElementById('videoGrid');
        grid.innerHTML = '';

        const start = (this.currentPage - 1) * this.videosPerPage;
        const end = start + this.videosPerPage;
        const pageVideos = this.filteredVideos.slice(start, end);

        if (pageVideos.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px;color:#aaa;">
                    <div style="font-size:4rem;">🎬</div>
                    <h3 style="margin-top:20px;">Belum ada video</h3>
                    <p>Tambah video menggunakan form di atas</p>
                </div>
            `;
        } else {
            pageVideos.forEach(video => {
                grid.appendChild(this.createVideoCard(video));
            });
        }

        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 🔥 VIDEO CARD
    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;

        const tagsHtml = video.tags && video.tags.length > 0
            ? video.tags.map(tag => 
                `<span class="tag-badge" onclick="gallery.filterByTag('${tag}');event.stopPropagation();">${tag}</span>`
              ).join('')
            : '';

        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail || 'https://via.placeholder.com/1280x720/333/fff?text=No+Image'}" 
                     alt="${video.title}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/1280x720/333/fff?text=No+Image'">
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>⏱️ ${video.duration}</p>
            </div>
            <div class="tags-container">${tagsHtml}</div>
        `;

        card.addEventListener('click', () => this.openModal(video.id));
        return card;
    }

    // 🔥 PAGINATION NUMBERING
    renderPagination() {
        const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
        const paginationTop = document.getElementById('pagination');
        const paginationBottom = document.getElementById('paginationBottom');

        const buildPagination = () => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center;';

            // Prev button
            const prev = document.createElement('button');
            prev.className = 'page-btn';
            prev.innerHTML = '← Prev';
            prev.disabled = this.currentPage === 1;
            prev.onclick = () => this.changePage(this.currentPage - 1);
            wrapper.appendChild(prev);

            // Page numbers
            let startPage = Math.max(1, this.currentPage - 2);
            let endPage = Math.min(totalPages, this.currentPage + 2);

            if (startPage > 1) {
                const first = document.createElement('button');
                first.className = 'page-btn';
                first.textContent = '1';
                first.onclick = () => this.changePage(1);
                wrapper.appendChild(first);

                if (startPage > 2) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.cssText = 'color:#aaa;padding:8px;';
                    wrapper.appendChild(dots);
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                const btn = document.createElement('button');
                btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
                btn.textContent = i;
                btn.onclick = () => this.changePage(i);
                wrapper.appendChild(btn);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.cssText = 'color:#aaa;padding:8px;';
                    wrapper.appendChild(dots);
                }

                const last = document.createElement('button');
                last.className = 'page-btn';
                last.textContent = totalPages;
                last.onclick = () => this.changePage(totalPages);
                wrapper.appendChild(last);
            }

            // Next button
            const next = document.createElement('button');
            next.className = 'page-btn';
            next.innerHTML = 'Next →';
            next.disabled = this.currentPage === totalPages || totalPages === 0;
            next.onclick = () => this.changePage(this.currentPage + 1);
            wrapper.appendChild(next);

            // Info
            const info = document.createElement('span');
            info.style.cssText = 'color:#aaa;padding:8px 15px;font-size:13px;';
            info.textContent = `${this.filteredVideos.length} video | Hal ${this.currentPage}/${totalPages || 1}`;
            wrapper.appendChild(info);

            return wrapper;
        };

        paginationTop.innerHTML = '';
        paginationBottom.innerHTML = '';

        if (totalPages > 1) {
            paginationTop.appendChild(buildPagination());
            paginationBottom.appendChild(buildPagination());
        }
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderVideos();
    }

    // 🔥 TAG FILTER
    updateTagFilter() {
        const select = document.getElementById('tagFilter');
        const allTags = [...new Set(this.allVideos.flatMap(v => v.tags || []))].sort();

        select.innerHTML = `<option value="">📂 Semua (${this.allVideos.length})</option>`;
        allTags.forEach(tag => {
            const count = this.allVideos.filter(v => v.tags && v.tags.includes(tag)).length;
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = `🏷️ ${tag} (${count})`;
            select.appendChild(option);
        });
    }

    filterByTag(tag) {
        this.currentTag = tag;
        document.getElementById('tagFilter').value = tag;
        this.applyFilter();
    }

    // 🔥 SETUP EVENTS
    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.applyFilter();
        });

        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.currentTag = e.target.value;
            this.applyFilter();
        });

        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // 🔥 MODAL PLAYER
    openModal(id) {
        const video = this.allVideos.find(v => v.id == id);
        if (!video) return;

        document.getElementById('videoTitle').textContent = video.title;
        const player = document.getElementById('videoPlayer');
        player.innerHTML = '';

        if (video.type === 'iframe' && video.embed) {
            player.innerHTML = `
                <iframe src="${video.embed}" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="autoplay; fullscreen; picture-in-picture"
                        style="width:100%;height:100%;border:none;">
                </iframe>`;
        } else if (video.type === 'mp4' && video.url) {
            player.innerHTML = `
                <video controls preload="metadata" 
                       style="width:100%;height:100%;background:#000;">
                    <source src="${video.url}" type="video/mp4">
                    Browser tidak support MP4.
                </video>`;
        }

        document.getElementById('videoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('videoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('videoPlayer').innerHTML = '';
    }

    // 🔥 FORM TAMBAH VIDEO
    addVideo() {
        const title = document.getElementById('videoTitleInput').value.trim();
        const thumb = document.getElementById('videoThumbInput').value.trim();
        const inputUrl = document.getElementById('videoEmbedInput').value.trim();
        const tagsRaw = document.getElementById('videoTagInput').value.trim();
        const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

        if (!title) { alert('❌ Judul wajib diisi!'); return; }
        if (!inputUrl) { alert('❌ URL video wajib diisi!'); return; }

        const tags = tagsRaw 
            ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '') 
            : [];

        const isMp4 = /\.(mp4|m3u8|webm|avi|mkv)$/i.test(inputUrl);

        const newVideo = {
            id: Date.now(),
            title: title,
            thumbnail: thumb || 'https://via.placeholder.com/1280x720/1a1a2e/FFFFFF?text=' + encodeURIComponent(title.substring(0, 20)),
            type: isMp4 ? 'mp4' : 'iframe',
            url: isMp4 ? inputUrl : '',
            embed: isMp4 ? '' : inputUrl,
            duration: duration,
            tags: tags
        };

        this.allVideos.unshift(newVideo);
        this.filteredVideos = [...this.allVideos];
        this.currentPage = 1;
        this.currentTag = '';
        this.currentSearch = '';

        document.getElementById('tagFilter').value = '';
        document.getElementById('searchInput').value = '';

        this.saveVideos();
        this.updateTagFilter();
        this.renderVideos();

        // Reset form
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoThumbInput').value = '';
        document.getElementById('videoEmbedInput').value = '';
        document.getElementById('videoTagInput').value = '';
        document.getElementById('videoDurationInput').value = '';

        alert(`✅ "${title}" berhasil ditambah!\n🏷️ Tags: ${tags.join(', ') || 'tidak ada'}`);
    }
}

// Start
let gallery;
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
    gallery = new VideoGallery();
};
document.head.appendChild(hlsScript);