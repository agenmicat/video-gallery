class VideoGallery {
    constructor() {
        this.r2Url = 'https://pub-1f29bbf92bc64161a3a07e91bfba7525.r2.dev/videos.json'; // Ganti pub-xxxx
        this.loadVideos().then(videos => {
            this.videos = videos;
            this.init();
        });
    }

    async loadVideos() {
        try {
            // Coba R2 dulu
            const r2Res = await fetch(this.r2Url);
            if (r2Res.ok) {
                return await r2Res.json();
            }
        } catch(e) {
            console.log('R2 unavailable, pakai local');
        }
        
        // Fallback localStorage
        return JSON.parse(localStorage.getItem('videoGallery') || '[]');
    }

    async saveVideos() {
        // Save local dulu
        localStorage.setItem('videoGallery', JSON.stringify(this.videos));
        
        // Push ke R2 (background)
        fetch(this.r2Url, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(this.videos)
        }).catch(e => console.log('R2 save failed:', e));
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