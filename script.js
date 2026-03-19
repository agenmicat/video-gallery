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
        throw new Error('Fetch gagal: ' + res.status);
      }
    } catch (e) {
      this.allVideos = [];
      console.warn('Fetch error, fallback ke kosong:', e);
    }
    this.filteredVideos = [...this.allVideos];
  }

  applyFilter() {
    this.filteredVideos = this.allVideos.filter(video => {
      const tagMatch = this.currentTag === '' || (video.tags && video.tags.includes(this.currentTag));
      const searchMatch = this.currentSearch === '' || video.title.toLowerCase().includes(this.currentSearch.toLowerCase());
      return tagMatch && searchMatch;
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
      card.dataset.videoId = video.id;

      const tagsHTML = (video.tags || []).map(tag => `
        <span class="tag-badge" onclick="gallery.filterByTag('${tag}'); event.stopPropagation();">${tag}</span>
      `).join('');

      card.innerHTML = `
        <div class="video-thumbnail" style="position:relative;">
          <img src="${video.thumbnail || 'https://via.placeholder.com/400x225?text=No+Image'}" alt="${video.title}" />
        </div>
        <div class="video-info">
          <h3>${video.title}</h3>
          <p>⏱️ ${video.duration || '-'}</p>
          <div class="tags-container">${tagsHTML}</div>
        </div>
      `;

      card.onclick = () => {
        const url = new URL(window.location);
        url.pathname = '/watch.html'; // Pastikan pake watch.html
        url.searchParams.set('id', video.id);
        window.location.href = url.toString();
      };

      grid.appendChild(card);
    }
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    const paginationTop = document.getElementById('pagination');
    const paginationBottom = document.getElementById('paginationBottom');

    function createPaginationControls(currentPage, totalPages, changePage) {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '8px';
      div.style.flexWrap = 'wrap';
      div.style.justifyContent = 'center';

      // Prev button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.textContent = '← Prev';
      prevBtn.disabled = currentPage === 1;
      prevBtn.onclick = () => changePage(currentPage - 1);
      div.appendChild(prevBtn);

      // Page numbers
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        const first = document.createElement('button');
        first.className = 'page-btn';
        first.textContent = '1';
        first.onclick = () => changePage(1);
        div.appendChild(first);

        if (startPage > 2) {
          const dots = document.createElement('span');
          dots.textContent = '...';
          dots.style.color = '#aaa';
          dots.style.padding = '8px';
          div.appendChild(dots);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn ' + (i === currentPage ? 'active' : '');
        btn.textContent = i;
        btn.onclick = () => changePage(i);
        div.appendChild(btn);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const dots = document.createElement('span');
          dots.textContent = '...';
          dots.style.color = '#aaa';
          dots.style.padding = '8px';
          div.appendChild(dots);
        }

        const last = document.createElement('button');
        last.className = 'page-btn';
        last.textContent = totalPages;
        last.onclick = () => changePage(totalPages);
        div.appendChild(last);
      }

      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.textContent = 'Next →';
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
      nextBtn.onclick = () => changePage(currentPage + 1);
      div.appendChild(nextBtn);

      // Info text
      const info = document.createElement('span');
      info.style.color = '#aaa';
      info.style.padding = '8px 15px';
      info.style.fontSize = '13px';
      info.textContent = `${totalPages} Halaman | Total ${totalPages * 20} video`;
      div.appendChild(info);

      return div;
    }

    if (paginationTop) {
      paginationTop.innerHTML = '';
      if (totalPages > 1) paginationTop.appendChild(createPaginationControls(this.currentPage, totalPages, this.changePage.bind(this)));
    }
    if (paginationBottom) {
      paginationBottom.innerHTML = '';
      if (totalPages > 1) paginationBottom.appendChild(createPaginationControls(this.currentPage, totalPages, this.changePage.bind(this)));
    }
  }

  changePage = (page) => {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    if(page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderGallery();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  filterByTag = (tag) => {
    this.currentTag = tag;
    if(document.getElementById('tagFilter')) document.getElementById('tagFilter').value = tag;
    this.currentSearch = '';
    if(document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    this.applyFilter();
    this.renderGallery();
  }

  setupEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', e => {
      this.currentSearch = e.target.value;
      this.applyFilter();
      this.renderGallery();
    });

    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) tagFilter.addEventListener('change', e => {
      this.currentTag = e.target.value;
      this.applyFilter();
      this.renderGallery();
    });
  }

  populateTagFilter() {
    const select = document.getElementById('tagFilter');
    if (!select) return;
    const tags = new Set();
    this.allVideos.forEach(v => (v.tags || []).forEach(t => tags.add(t)));
    select.innerHTML = `<option value="">📂 Semua (${this.allVideos.length})</option>`;
    Array.from(tags).sort().forEach(tag => {
      const count = this.allVideos.filter(v => v.tags && v.tags.includes(tag)).length;
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `🏷️ ${tag} (${count})`;
      select.appendChild(option);
    });
  }

  async init() {
    await this.loadVideos();
    this.applyFilter();
    this.renderGallery();
    this.renderPagination();
    this.setupEvents();
    this.populateTagFilter();
  }
}

const gallery = new VideoGallery();

async function loadWatchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    document.getElementById('videoPlayer').textContent = 'Video tidak ditemukan (ID kosong)';
    return;
  }

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Gagal muat data');
    const videos = await response.json();

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
      iframe.frameBorder = 0;
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      container.appendChild(iframe);
    } else {
      container.textContent = 'Tipe video tidak didukung.';
    }

    const relatedContainer = document.getElementById('relatedVideos');
    relatedContainer.innerHTML = '';

    const relatedVideos = videos.filter(
      v =>
        v.id.toString() !== id &&
        video.tags &&
        v.tags &&
        v.tags.some(t => video.tags.includes(t))
    );

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
              ${(rv.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('')}
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
    document.getElementById('videoPlayer').textContent = 'Error saat memuat video.';
    console.error('loadWatchPage error', error);
  }
}

// Inisialisasi page
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
  if (window.location.pathname.endsWith('watch.html')) {
    loadWatchPage();
  } else {
    gallery.init();
  }
};
document.head.appendChild(hlsScript);