class VideoGallery {
    constructor() {
        this.videos = [
            {
                id: 1,
                title: "🟢 VOE.SX - Demo Player",
                thumbnail: "https://via.placeholder.com/1280x720/00FF00/FFFFFF?text=VOE.SX+Player",
                embed: "https://voe.sx/e/dQw4w9WgXcQ",
                type: "iframe",
                duration: "45:20"
            },
            {
                id: 2,
                title: "🔴 Streamtape Demo", 
                thumbnail: "https://via.placeholder.com/1280x720/FF0000/FFFFFF?text=Streamtape",
                embed: "https://streamtape.com/e/abc123demo",
                type: "iframe",
                duration: "1:30:15"
            },
            {
                id: 3,
                title: "📺 MP4 Direct Link",
                thumbnail: "https://sample-videos.com/img/Sample-videos-small-thumbnail.jpg",
                url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                type: "mp4",
                duration: "1:30"
            }
        ];
        this.init();
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
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.duration}</p>
            </div>
        `;
        return card;
    }

    setupEventListeners() {
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchVideos(e.target.value);
        });

        // Video cards
        document.getElementById('videoGrid').addEventListener('click', (e) => {
            if (e.target.closest('.video-card')) {
                const videoId = e.target.closest('.video-card').dataset.videoId;
                this.openModal(videoId);
            }
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
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
            <iframe src="${url}" 
                    frameborder="0" 
                    allowfullscreen 
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    style="width:100%;height:100%;border:none;">
            </iframe>
        `;
    }

    loadMP4(url) {
        document.getElementById('videoPlayer').innerHTML = `
            <video controls autoplay muted style="width:100%;height:100%;background:#000;">
                <source src="${url}" type="video/mp4">
                Browser tidak mendukung video.
            </video>
        `;
    }

    // 🔥 FORM TAMBAH VIDEO INSTAN
    addVideo() {
    const title = document.getElementById('videoTitleInput').value.trim();
    const inputUrl = document.getElementById('videoEmbedInput').value.trim();
    const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

    if (!title || !inputUrl) {
        alert('❌ Judul dan URL wajib diisi!');
        return;
    }

    // AUTO DETECT TYPE
    const isMp4 = inputUrl.match(/\.(mp4|m3u8|webm)$/i);
    const videoData = {
        id: Date.now(),
        title: title,
        duration: duration,
        type: isMp4 ? 'mp4' : 'iframe',
        url: isMp4 ? inputUrl : '',
        embed: isMp4 ? '' : inputUrl
    };

    // SHOW LOADING
    const loadingThumb = 'https://via.placeholder.com/1280x720/333/fff?text=Generating...';
    videoData.thumbnail = loadingThumb;
    this.videos.unshift(videoData);
    this.renderVideos();

    // GENERATE THUMBNAIL
    this.generateSmartThumbnail(inputUrl, isMp4).then(thumb => {
        videoData.thumbnail = thumb;
        this.renderVideos();
        alert('✅ Video ditambah!\n📱 Auto thumbnail: ' + thumb.split('?')[0]);
    });

    // RESET FORM
    document.getElementById('videoTitleInput').value = '';
    document.getElementById('videoEmbedInput').value = '';
    document.getElementById('videoDurationInput').value = '';
},

generateSmartThumbnail(url, isMp4) {
    return new Promise(resolve => {
        if (!isMp4) {
            // Iframe = Unsplash cinematic
            resolve(`https://source.unsplash.com/1280x720/?${encodeURIComponent(['movie','film','cinema'][Math.floor(Math.random()*3)])}`);
        } else {
            // MP4 = coba YouTube style dulu
            const videoId = url.split('/').pop().split('.')[0].substring(0,11);
            const ytThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            
            const img = new Image();
            img.onload = () => resolve(ytThumb);
            img.onerror = () => {
                // Fallback Unsplash
                resolve(`https://source.unsplash.com/1280x720/?video,dark`);
            };
            img.src = ytThumb;
        }
    });
}

// Global access untuk form
let gallery;

// Load HLS.js (untuk stream HLS)
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
    gallery = new VideoGallery();
};
document.head.appendChild(hlsScript);