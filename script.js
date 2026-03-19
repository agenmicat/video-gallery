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
        url.pathname = '/watch.html';
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
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    document.getElementById('videoPlayer').textContent = 'Video tidak ditemukan';
    return;
  }

  const res = await fetch(apiUrl);
  if (!res.ok) {
    document.getElementById('videoPlayer').textContent = 'Gagal memuat video';
    return;
  }
  const videos = await res.json();
  const video = videos.find(v => v.id.toString() === id);
  if (!video) {
    document.getElementById('videoPlayer').textContent = 'Video tidak ditemukan';
    return;
  }

  document.getElementById('videoTitle').textContent = video.title;

  const container = document.getElementById('videoPlayer');
  container.innerHTML = '';

  if (video.type === 'mp4' && video.url) {
    const videoElem = document.createElement('video');
    videoElem.controls = true;
    videoElem.src = video.url;
    videoElem.style.width = '100%';
    videoElem.style.height = '100%';
    container.appendChild(videoElem);
  } else if (video.type === 'iframe' && video.embed) {
    const iframe = document.createElement('iframe');
    iframe.src = video.embed;
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    container.appendChild(iframe);
  }

  // Related videos based on tags
  const related = videos.filter(
    v =>
      v.id.toString() !== id &&
      video.tags &&
      v.tags &&
      v.tags.some(t => video.tags.includes(t))
  );

  const relContainer = document.getElementById('relatedVideos');
  relContainer.innerHTML = '';

  if (related.length === 0) {
    relContainer.innerHTML = '<p>Tidak ada video terkait.</p>';
  } else {
    related.forEach(v => {
      const relCard = document.createElement('div');
      relCard.className = 'video-card';
      relCard.innerHTML = `
        <div class="video-thumbnail">
          <img src="${v.thumbnail || 'https://via.placeholder.com/400x225?text=No+Image'}" alt="${v.title}" />
        </div>
        <div class="video-info">
          <h3>${v.title}</h3>
          <p>⏱️ ${v.duration || '-'}</p>
          <div class="tags-container">
            ${(v.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
          </div>
        </div>
      `;
      relCard.onclick = () => {
        const u = new URL(window.location);
        u.searchParams.set('id', v.id);
        window.location.href = u.toString();
      };
      relContainer.appendChild(relCard);
    });
  }
}

const gallery = new VideoGallery();

const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
  const isWatch = window.location.pathname.endsWith('watch.html');
  if (isWatch) loadWatchPage();
  else gallery.init();
};
document.head.appendChild(hlsScript);