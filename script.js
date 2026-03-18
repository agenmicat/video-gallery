class VideoGallery {
    constructor() {
        // 🔥 GANTI DENGAN WORKER URL KAMU!
        this.apiUrl = 'https://video-api.nenenbiadab.workers.dev';
        
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

    // 🔥 LOAD dari Worker/R2
    async loadVideos() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                this.allVideos = await response.json();
                console.log('✅ Loaded:', this.allVideos.length, 'videos');
            } else {
                throw new Error('API failed');
            }
        } catch(e) {
            console.log('❌ API gagal:', e.message);
            this.allVideos = [];
        }
        this.filteredVideos = [...this.allVideos];
    }

    // 🔥 SAVE ke Worker/R2 (SEMUA BROWSER SYNC!)
    async saveVideos() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.allVideos)
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Saved to R2!');
            }
        } catch(e) {
            console.log('❌ Save gagal:', e.message);
            alert('❌ Gagal simpan ke database!');
        }
    }

    // 🔥 FORM TAMBAH VIDEO (update saveVideos jadi async)
    async addVideo() {
        const title = document.getElementById('videoTitleInput').value.trim();
        const thumb = document.getElementById('videoThumbInput').value.trim();
        const inputUrl = document.getElementById('videoEmbedInput').value.trim();
        const tagsRaw = document.getElementById('videoTagInput').value.trim();
        const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

        if (!title) { alert('❌ Judul wajib!'); return; }
        if (!inputUrl) { alert('❌ URL wajib!'); return; }

        const tags = tagsRaw
            ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t !== '')
            : [];

        const isMp4 = /\.(mp4|m3u8|webm|avi|mkv)$/i.test(inputUrl);

        const newVideo = {
            id: Date.now(),
            title,
            thumbnail: thumb || 'https://via.placeholder.com/1280x720/1a1a2e/FFFFFF?text=' + encodeURIComponent(title.substring(0, 20)),
            type: isMp4 ? 'mp4' : 'iframe',
            url: isMp4 ? inputUrl : '',
            embed: isMp4 ? '' : inputUrl,
            duration,
            tags
        };

        // Show loading
        const btn = document.querySelector('.form-group button');
        btn.textContent = '⏳ Menyimpan...';
        btn.disabled = true;

        this.allVideos.unshift(newVideo);
        this.filteredVideos = [...this.allVideos];
        this.currentPage = 1;
        this.currentTag = '';
        this.currentSearch = '';

        document.getElementById('tagFilter').value = '';
        document.getElementById('searchInput').value = '';

        // 🔥 SAVE KE R2 (semua browser sync!)
        await this.saveVideos();

        this.updateTagFilter();
        this.renderVideos();

        // Reset form
        document.getElementById('videoTitleInput').value = '';
        document.getElementById('videoThumbInput').value = '';
        document.getElementById('videoEmbedInput').value = '';
        document.getElementById('videoTagInput').value = '';
        document.getElementById('videoDurationInput').value = '';

        btn.textContent = '➕ Tambah';
        btn.disabled = false;

        alert(`✅ "${title}" tersimpan di database!\n🌐 Semua browser sync!`);
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