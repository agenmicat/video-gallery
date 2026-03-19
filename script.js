const apiUrl = 'https://video-api.nenenbiadab.workers.dev';

class VideoGallery {
  constructor() {
    this.allVideos = [];
    this.filteredVideos = [];
    this.currentPage = 1;
    this.videosPerPage = 20;
    this.currentTag = '';
    this.currentSearch = '';
  }

  async loadVideos() {
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        this.allVideos = await res.json();
      } else {
        throw new Error('Fetch failed');
      }
    } catch {
      this.allVideos = [];
    }
    this.filteredVideos = [...this.allVideos];
  }

  applyFilter() {
    this.filteredVideos = this.allVideos.filter(video => {
      if (this.currentTag && (!video.tags || !video.tags.includes(this.currentTag))) return false;
      if (this.currentSearch && !video.title.toLowerCase().includes(this.currentSearch.toLowerCase())) return false;
      return true;
    });
    this.currentPage = 1;
  }

  renderGallery() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const start = (this.currentPage - 1) * this.videosPerPage;
    const end = start + this.videosPerPage;
    const videos = this.filteredVideos.slice(start, end);

    if (videos.length === 0) {
      grid.innerHTML = '<p style="color:#aaa; text-align:center; width:100%;">Tidak ada video ditemukan.</p>';
      return;
    }

    for (const video of videos) {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="video-thumbnail">
          <img src="${video.thumbnail || 'https://via.placeholder.com/400x225?text=No+Image'}" alt="${video.title}" />
        </div>
        <div class="video-info">
          <h3>${video.title}</h3>
          <p>⏱️ ${video.duration || '-'}</p>
          <div class="tags-container">
            ${(video.tags || []).map(tag => `<span class="tag-badge" onclick="gallery.filterByTag('${tag}')">${tag}</span>`).join('')}
          </div>
        </div>
      `;
      card.onclick = () => {
        const url = new URL(window.location);
        url.pathname = '/watch.html';  // PASTIKAN pakai watch.html bukan /watch
        url.searchParams.set('id', video.id);
        window.location.href = url.toString();
      };
      grid.appendChild(card);
    }
  }

  renderPagination() {
    // Similar as before, omitted for brevity
  }

  filterByTag(tag) {
    this.currentTag = tag;
    this.currentSearch = '';
    document.getElementById('searchInput').value = '';
    if (document.getElementById('tagFilter')) document.getElementById('tagFilter').value = tag;
    this.applyFilter();
    this.renderGallery();
  }

  setupEvents() {
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');

    if (searchInput)
      searchInput.addEventListener('input', e => {
        this.currentSearch = e.target.value;
        this.applyFilter();
        this.renderGallery();
      });
    if (tagFilter)
      tagFilter.addEventListener('change', e => {
        this.currentTag = e.target.value;
        this.applyFilter();
        this.renderGallery();
      });
  }

  async init() {
    await this.loadVideos();
    this.applyFilter();
    this.renderGallery();
    this.setupEvents();
    this.populateTagFilter();
  }

  populateTagFilter() {
    const select = document.getElementById('tagFilter');
    if (!select) return;
    const tags = new Set();
    this.allVideos.forEach(v => (v.tags || []).forEach(t => tags.add(t)));
    select.innerHTML = `<option value="">📂 Semua (${this.allVideos.length})</option>`;
    Array.from(tags)
      .sort()
      .forEach(tag => {
        const count = this.allVideos.filter(v => v.tags && v.tags.includes(tag)).length;
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = `🏷️ ${tag} (${count})`;
        select.appendChild(option);
      });
  }
}

// watch.html bagian video player & related
async function loadWatchPage() {
  console.log('loadWatchPage() mulai dijalankan');

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  console.log('Video ID dari URL:', id);

  if (!id) {
    document.getElementById('videoPlayer').textContent = 'Video tidak ditemukan (ID kosong).';
    return;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Gagal mengambil data video');
    const videos = await response.json();
    console.log('Daftar video diterima:', videos.length);

    const video = videos.find(v => v.id.toString() === id);
    if (!video) {
      document.getElementById('videoPlayer').textContent = 'Video tidak ditemukan (ID salah).';
      return;
    }

    // Update judul video
    document.getElementById('videoTitle').textContent = video.title;

    // Render player
    const container = document.getElementById('videoPlayer');
    container.innerHTML = ''; // Kosongkan dulu

    if (video.type === 'mp4' && video.url) {
      const videoEl = document.createElement('video');
      videoEl.controls = true;
      videoEl.autoplay = false;
      videoEl.src = video.url;
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      container.appendChild(videoEl);
    } else if (video.type === 'iframe' && video.embed) {
      const iframe = document.createElement('iframe');
      iframe.src = video.embed;
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      container.appendChild(iframe);
    } else {
      container.textContent = 'Tipe video tidak didukung.';
    }

    // Related videos
    const relatedContainer = document.getElementById('relatedVideos');
    relatedContainer.innerHTML = '';

    const relatedVideos = videos.filter(v => v.id.toString() !== id && video.tags && v.tags && v.tags.some(t => video.tags.includes(t)));

    if (relatedVideos.length === 0) {
      relatedContainer.innerHTML = '<p>Tidak ada video terkait.</p>';
    } else {
      relatedVideos.forEach(rv => {
        const relCard = document.createElement('div');
        relCard.className = 'video-card';
        relCard.innerHTML = `
          <div class="video-thumbnail">
            <img src="${rv.thumbnail || 'https://via.placeholder.com/400x225?text=No+Image'}" alt="${rv.title}" />
          </div>
          <div class="video-info">
            <h3>${rv.title}</h3>
            <p>⏱️ ${rv.duration || '-'}</p>
            <div class="tags-container">
              ${(rv.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
            </div>
          </div>
        `;
        relCard.onclick = () => {
          const u = new URL(window.location);
          u.searchParams.set('id', rv.id);
          window.location.href = u.toString();
        };
        relatedContainer.appendChild(relCard);
      });
    }

  } catch (error) {
    document.getElementById('videoPlayer').textContent = 'Error memuat video.';
    console.error('Error fetch/loadWatchPage:', error);
  }
}

const gallery = new VideoGallery();

const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
  if (window.location.pathname.endsWith('watch.html')) {
    loadWatchPage(); // Panggil fungsi yang sudah di definisikan di atas
  } else {
    gallery.init(); // Inisialisasi gallery biasa
  }
};
document.head.appendChild(hlsScript);