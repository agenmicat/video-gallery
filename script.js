class VideoGallery {
    constructor() {
        this.videos = this.loadVideos();
        if (this.videos.length === 0) {
            this.videos = [
                {
                    id: 1,
                    title: "🎬 Welcome - Tambah video kamu!",
                    thumbnail: "https://source.unsplash.com/1280x720/?cinema",
                    embed: "https://voe.sx/e/dQw4w9WgXcQ",
                    type: "iframe",
                    duration: "Demo"
                }
            ];
        }
        this.init();
    }

    init() {
        this.renderVideos();
        this.setupEventListeners();
    }

    // 🔥 SAVE PERMANEN
    saveVideos() {
        localStorage.setItem('videoGallery', JSON.stringify(this.videos));
    }

    // 🔥 LOAD PERMANEN  
    loadVideos() {
        try {
            const saved = localStorage.getItem('videoGallery');
            return saved ? JSON.parse(saved) : [];
        } catch(e) {
            console.log('Storage error, pakai default');
            return [];
        }
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
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/1280x720/333/fff?text=No+Image'">
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
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
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
            this.loadIframe(video.embed);
        } else if (video.type === 'mp4') {
            this.loadMP4(video.url);
        }

        document.getElementById('videoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    loadIframe(url) {
        document.getElementById('videoPlayer').innerHTML = `
            <iframe src="${url}" frameborder="0" allowfullscreen 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    style="width:100%;height:100%;border:none;">
            </iframe>
        `;
    }

    loadMP4(url) {
        document.getElementById('videoPlayer').innerHTML = `
            <video controls preload="metadata" style="width:100%;height:100%;background:#000;">
                <source src="${url}" type="video/mp4">
                Browser tidak support MP4.
            </video>
        `;
    }

    // 🔥 FORM TAMBAH VIDEO + AUTO SAVE
    addVideo() {
        const title = document.getElementById('videoTitleInput').value.trim();
        const inputUrl = document.getElementById('videoEmbedInput').value.trim();
        const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

        if (!title || !inputUrl) {
            alert('❌ Judul dan URL wajib!');
            return;
        }

        const isMp4 = inputUrl.match(/\.(mp4|m3u8|webm)$/i);
        const newVideo = {
            id: Date.now(),
            title: title,
            type: isMp4 ? 'mp4' : 'iframe',
            url: isMp4 ? inputUrl : '',
            embed: isMp4 ? '' : inputUrl,
            duration: duration,
            thumbnail: isMp4 
                ? `https://via.placeholder.com/1280x720/1E3A8A/FFFFFF?text=${encodeURIComponent(title.substring(0,15))}`
                : `https://source.unsplash.com/1280x720/?${this.getProvider(inputUrl) || 'movie'}` 
        };

        this.videos.unshift(newVideo);
        this.renderVideos();
        this.saveVideos(); // 🔥 SIMPAN PERMANEN

        // Reset form
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoEmbedInput').value = '';
        document.getElementById('videoDurationInput').value = '';
        
        alert(`✅ "${title}" tersimpan permanen!\n🔄 Refresh aman!`);
    }

    getProvider(url) {
        if (url.includes('voe.sx')) return 'movie';
        if (url.includes('streamtape')) return 'film';
        return 'cinema';
    }

    closeModal() {
        document.getElementById('videoModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('videoPlayer').innerHTML = '';
    }
}

let gallery;
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
    gallery = new VideoGallery();
};
document.head.appendChild(hlsScript);