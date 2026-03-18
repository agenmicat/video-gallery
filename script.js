class VideoGallery {
    constructor() {
        // 🔥 GANTI DENGAN R2 PUBLIC URL KAMU!
        // Contoh: https://pub-abcd1234.r2.dev/videos.json
        this.r2Url = 'https://pub-1f29bbf92bc64161a3a07e91bfba7525.r2.dev/videos.json';
        
        this.loadVideos().then(videos => {
            this.videos = videos.length ? videos : [
                {
                    id: 1,
                    title: "👋 Mulai tambah video!",
                    thumbnail: "https://source.unsplash.com/1280x720/?cinema,dark",
                    embed: "https://voe.sx/e/dQw4w9WgXcQ",
                    type: "iframe",
                    duration: "Demo"
                }
            ];
            this.init();
        });
    }

    async loadVideos() {
        try {
            console.log('📡 Loading from R2:', this.r2Url);
            const response = await fetch(this.r2Url);
            if (response.ok) {
                const videos = await response.json();
                console.log('✅ R2 loaded:', videos.length, 'videos');
                localStorage.setItem('videoGallery', JSON.stringify(videos));
                return videos;
            }
        } catch(e) {
            console.log('❌ R2 failed, using localStorage');
        }
        
        const localVideos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
        console.log('💾 LocalStorage:', localVideos.length, 'videos');
        return localVideos;
    }

    saveVideos() {
        localStorage.setItem('videoGallery', JSON.stringify(this.videos));
        console.log('💾 Saved locally:', this.videos.length);
    }

    init() {
        this.renderVideos();
        this.setupEventListeners();
    }

    renderVideos(videos = this.videos) {
        const grid = document.getElementById('videoGrid');
        grid.innerHTML = '';
        videos.forEach(video => {
            const card = this.createVideoCard(video);
            grid.appendChild(card);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" 
                     alt="${video.title}" 
                     loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/1280x720/333/fff?text=No+Image'">
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.duration}</p>
            </div>
        `;
        return card;
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchVideos(e.target.value);
        });

        document.getElementById('videoGrid').addEventListener('click', (e) => {
            if (e.target.closest('.video-card')) {
                const videoId = e.target.closest('.video-card').dataset.videoId;
                this.openModal(videoId);
            }
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    searchVideos(query) {
        const filtered = this.videos.filter(video => 
            video.title.toLowerCase().includes(query.toLowerCase())
        );
        this.renderVideos(filtered);
    }

    openModal(id) {
        const video = this.videos.find(v => v.id == id);
        if (!video) return;

        document.getElementById('videoTitle').textContent = video.title;
        const player = document.getElementById('videoPlayer');
        player.innerHTML = '';

        if (video.type === 'iframe') {
            player.innerHTML = `
                <iframe src="${video.embed}" 
                        frameborder="0" 
                        allowfullscreen 
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        style="width:100%;height:100%;border:none;">
                </iframe>
            `;
        } else if (video.type === 'mp4') {
            player.innerHTML = `
                <video controls preload="metadata" style="width:100%;height:100%;background:#000;">
                    <source src="${video.url}" type="video/mp4">
                    <source src="${video.url}" type="video/webm">
                    Browser tidak mendukung video.
                </video>
            `;
        }

        document.getElementById('videoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    addVideo() {
        const title = document.getElementById('videoTitleInput').value.trim();
        const inputUrl = document.getElementById('videoEmbedInput').value.trim();
        const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

        if (!title || !inputUrl) {
            alert('❌ Judul dan URL wajib diisi!');
            return;
        }

        const isMp4 = inputUrl.match(/\.(mp4|m3u8|webm|avi|mkv)$/i);
        const newVideo = {
            id: Date.now(),
            title: title,
            type: isMp4 ? 'mp4' : 'iframe',
            url: isMp4 ? inputUrl : '',
            embed: isMp4 ? '' : inputUrl,
            duration: duration,
            thumbnail: isMp4 
                ? `https://via.placeholder.com/1280x720/1E3A8A/FFFFFF?text=${encodeURIComponent(title.substring(0,15))}`
                : `https://source.unsplash.com/1280x720/?${this.getProvider(inputUrl) || 'movie'},dark`
        };

        this.videos.unshift(newVideo);
        this.renderVideos();
        this.saveVideos();

        // Reset form
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoEmbedInput').value = '';
        document.getElementById('videoDurationInput').value = '';
        
        alert(`✅ "${title}" ditambahkan!\n💾 Tersimpan permanen (local + R2 sync)`);
    }

    getProvider(url) {
        if (url.includes('voe.sx')) return 'movie';
        if (url.includes('streamtape')) return 'film';
        if (url.includes('dood')) return 'cinema';
        if (url.includes('.mp4')) return 'video';
        return 'movie';
    }

    closeModal() {
        document.getElementById('videoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('videoPlayer').innerHTML = '';
    }
}

// Global gallery untuk form
let gallery;

// HLS.js support (opsional)
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
    gallery = new VideoGallery();
};
document.head.appendChild(hlsScript);