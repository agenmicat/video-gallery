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
      console.warn('Fetch error, fallback ke kosong', e);
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

    videos.forEach(video => {
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

      card.onclick = () => this.openModal(video.id);

      grid.appendChild(card);
    });
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    const paginationTop = document.getElementById('pagination');
    const paginationBottom = document.getElementById('paginationBottom');

    function createControls(current, total, changePage) {
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.gap = '8px';
      container.style.flexWrap = 'wrap';
      container.style.justifyContent = 'center';

      const prev = document.createElement('button');
      prev.className = 'page-btn';
      prev.textContent = '← Prev';
      prev.disabled = current === 1;
      prev.onclick = () => changePage(current - 1);
      container.appendChild(prev);

      let startPage = Math.max(1, current - 2);
      let endPage = Math.min(total, current + 2);

      if (startPage > 1) {
        container.appendChild(createPageBtn(1, current, changePage));
        if (startPage > 2) container.appendChild(createEllipsis());
      }

      for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createPageBtn(i, current, changePage));
      }

      if (endPage < total) {
        if (endPage < total - 1) container.appendChild(createEllipsis());
        container.appendChild(createPageBtn(total, current, changePage));
      }

      const next = document.createElement('button');
      next.className = 'page-btn';
      next.textContent = 'Next →';
      next.disabled = current === total || total === 0;
      next.onclick = () => changePage(current + 1);
      container.appendChild(next);

      const info = document.createElement('span');
      info.style.color = '#aaa';
      info.style.padding = '8px 15px';
      info.style.fontSize = '13px';
      info.textContent = `${this.filteredVideos.length} video | Halaman ${this.currentPage} dari ${total || 1}`;
      container.appendChild(info);

      return container;

      function createPageBtn(pageNum, curr, changePageFn) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (pageNum === curr ? ' active' : '');
        btn.textContent = pageNum;
        btn.onclick = () => changePageFn(pageNum);
        return btn;
      }

      function createEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.color = '#aaa';
        span.style.padding = '8px';
        return span;
      }
    }

    if (paginationTop) {
      paginationTop.innerHTML = '';
      if (totalPages > 1) paginationTop.appendChild(createControls.call(this, this.currentPage, totalPages, this.changePage.bind(this)));
    }
    if (paginationBottom) {
      paginationBottom.innerHTML = '';
      if (totalPages > 1) paginationBottom.appendChild(createControls.call(this, this.currentPage, totalPages, this.changePage.bind(this)));
    }
  }

  changePage = (page) => {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  filterByTag = (tag) => {
    this.currentTag = tag;
    if (document.getElementById('tagFilter')) {
      document.getElementById('tagFilter').value = tag;
    }
    this.currentSearch = '';
    if (document.getElementById('searchInput')) {
      document.getElementById('searchInput').value = '';
    }
    this.applyFilter();
    this.renderGallery();
  }

  setupEvents() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.currentSearch = e.target.value;
        this.applyFilter();
        this.renderGallery();
      });
    }

    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
      tagFilter.addEventListener('change', e => {
        this.currentTag = e.target.value;
        this.applyFilter();
        this.renderGallery();
      });
    }

    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('videoModal');
    if (closeBtn)
      closeBtn.onclick = () => this.closeModal();
    if (modal)
      window.onclick = event => {
        if (event.target === modal) this.closeModal();
      };

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  openModal(videoId) {
    const video = this.allVideos.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    const title = document.getElementById('videoTitle');

    title.textContent = video.title;
    player.innerHTML = '';

    if (video.type === 'mp4' && video.url) {
      const videoElem = document.createElement('video');
      videoElem.controls = true;
      videoElem.autoplay = true;
      videoElem.src = video.url;
      videoElem.style.width = '100%';
      videoElem.style.height = '100%';
      player.appendChild(videoElem);
    } else if (video.type === 'iframe' && video.embed) {
      const iframe = document.createElement('iframe');
      iframe.src = video.embed;
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      player.appendChild(iframe);
    } else {
      player.textContent = 'Tipe video tidak didukung.';
    }

    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      const player = document.getElementById('videoPlayer');
      player.innerHTML = ''; // stop video
    }
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
}

const gallery = new VideoGallery();

const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
  gallery.init();
};
document.head.appendChild(hlsScript);