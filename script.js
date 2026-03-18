class VideoGallery {
  constructor() {
    // Ganti dengan URL Worker API kamu
    this.apiUrl = 'https://video-api.nenenbiadab.workers.dev';

    // Inisialisasi variabel
    this.allVideos = [];
    this.filteredVideos = [];
    this.currentPage = 1;
    this.videosPerPage = 20;
    this.currentTag = '';
    this.currentSearch = '';

    // Muat data video dan inisialisasi setelah load selesai
    this.loadVideos().then(() => {
      this.init();
    });
  }

  // Load data video dari Worker API / R2
  loadVideos = async () => {
    try {
      const response = await fetch(this.apiUrl);
      if (response.ok) {
        this.allVideos = await response.json();
        // Simpan juga ke localStorage sebagai backup sementara
        localStorage.setItem('videoGallery', JSON.stringify(this.allVideos));
        console.log('✅ Loaded:', this.allVideos.length, 'videos');
      } else {
        throw new Error('API fetch failed');
      }
    } catch (e) {
      console.warn('❌ Loading from API failed, fallback to localStorage', e);
      this.allVideos = JSON.parse(localStorage.getItem('videoGallery') || '[]');
    }
    this.filteredVideos = [...this.allVideos];
  }

  // Inisialisasi: render dan event listener
  init = () => {
    this.updateTagFilter();
    this.renderVideos();
    this.setupEventListeners();
  }

  // Simpan data video ke database (worker API) dan localStorage
  saveVideos = async () => {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.allVideos),
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Saved to R2/Worker!');
      } else {
        throw new Error('API save failed');
      }
    } catch (e) {
      console.error('❌ Failed to save videos:', e.message);
      alert('Error saat menyimpan video ke server!');
    }
    // Simpan juga lokal
    localStorage.setItem('videoGallery', JSON.stringify(this.allVideos));
  }
deleteVideo = async (id) => {
  if (!confirm('Yakin ingin menghapus video ini? Tindakan ini tidak bisa dibatalkan.')) {
    return;
  }

  try {
    const response = await fetch(`${this.apiUrl}?id=${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      // Hapus dari state lokal
      this.allVideos = this.allVideos.filter(video => video.id.toString() !== id.toString());
      this.filteredVideos = this.filteredVideos.filter(video => video.id.toString() !== id.toString());

      this.updateTagFilter();
      this.renderVideos();
      alert('✅ Video berhasil dihapus!');
    } else {
      alert('⚠️ Gagal hapus video: ' + result.message);
    }
  } catch (error) {
    alert('⚠️ Error saat menghapus video: ' + error.message);
  }
}
  // Update filter berdasarkan kategori dan pencarian
  applyFilter = () => {
    this.filteredVideos = this.allVideos.filter(video => {
      const tagMatch = this.currentTag === '' || (video.tags && video.tags.includes(this.currentTag));
      const searchMatch = this.currentSearch === '' || video.title.toLowerCase().includes(this.currentSearch.toLowerCase());
      return tagMatch && searchMatch;
    });
    this.currentPage = 1;
    this.renderVideos();
  }

  renderVideos = () => {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';

    const startIndex = (this.currentPage - 1) * this.videosPerPage;
    const endIndex = startIndex + this.videosPerPage;
    const videosToShow = this.filteredVideos.slice(startIndex, endIndex);

    if (videosToShow.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#aaa;">
        <h3>Tidak ada video ditemukan</h3>
      </div>`;
      this.renderPagination();
      return;
    }

    videosToShow.forEach(video => {
      grid.appendChild(this.createVideoCard(video));
    });

    this.renderPagination();
  }

  createVideoCard = video => {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.dataset.videoId = video.id;

  const tagsHTML = video.tags && video.tags.length > 0
    ? video.tags.map(tag => `<span class="tag-badge" onclick="gallery.filterByTag('${tag}'); event.stopPropagation();">${tag}</span>`).join('')
    : '';

  card.innerHTML = `
    <div class="video-thumbnail">
      <img src="${video.thumbnail || 'https://via.placeholder.com/1280x720/333/fff?text=No+Image'}" 
          alt="${video.title}" loading="lazy"
          onerror="this.src='https://via.placeholder.com/1280x720/333/fff?text=No+Image'">
      <button class="btn-delete" title="Hapus Video" 
          onclick="gallery.deleteVideo('${video.id}'); event.stopPropagation();">✖</button>
    </div>
    <div class="video-info">
      <h3>${video.title}</h3>
      <p>⏱️ ${video.duration}</p>
    </div>
    <div class="tags-container">${tagsHTML}</div>
  `;
  card.addEventListener('click', () => this.openModal(video.id));
  return card;
}

  renderPagination = () => {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    const paginationTop = document.getElementById('pagination');
    const paginationBottom = document.getElementById('paginationBottom');

    const createPaginationControls = () => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.gap = '8px';
      wrapper.style.flexWrap = 'wrap';
      wrapper.style.justifyContent = 'center';

      // Prev button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.textContent = '← Prev';
      prevBtn.disabled = this.currentPage === 1;
      prevBtn.onclick = () => this.changePage(this.currentPage - 1);
      wrapper.appendChild(prevBtn);

      // Number buttons
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(totalPages, this.currentPage + 2);

      if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => this.changePage(1);
        wrapper.appendChild(firstBtn);
        if (startPage > 2) {
          const dots = document.createElement('span');
          dots.textContent = '...';
          dots.style.color = '#aaa';
          dots.style.padding = '8px';
          wrapper.appendChild(dots);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn' + (i === this.currentPage ? ' active' : '');
        pageBtn.textContent = i;
        pageBtn.onclick = () => this.changePage(i);
        wrapper.appendChild(pageBtn);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const dots = document.createElement('span');
          dots.textContent = '...';
          dots.style.color = '#aaa';
          dots.style.padding = '8px';
          wrapper.appendChild(dots);
        }
        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-btn';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => this.changePage(totalPages);
        wrapper.appendChild(lastBtn);
      }

      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.textContent = 'Next →';
      nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
      nextBtn.onclick = () => this.changePage(this.currentPage + 1);
      wrapper.appendChild(nextBtn);

      // Info text
      const infoText = document.createElement('span');
      infoText.style.color = '#aaa';
      infoText.style.padding = '8px 15px';
      infoText.style.fontSize = '13px';
      infoText.textContent = `${this.filteredVideos.length} video | Halaman ${this.currentPage} dari ${totalPages || 1}`;
      wrapper.appendChild(infoText);

      return wrapper;
    };

    paginationTop.innerHTML = '';
    paginationBottom.innerHTML = '';
    if (totalPages > 1) {
      paginationTop.appendChild(createPaginationControls());
      paginationBottom.appendChild(createPaginationControls());
    }
  }

  changePage = (page) => {
    const totalPages = Math.ceil(this.filteredVideos.length / this.videosPerPage);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.renderVideos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateTagFilter = () => {
    const select = document.getElementById('tagFilter');
    const allTags = [...new Set(this.allVideos.flatMap(v => v.tags || []))].sort();

    select.innerHTML = `<option value="">📂 Semua (${this.allVideos.length})</option>`;
    allTags.forEach(tag => {
      const count = this.allVideos.filter(v => v.tags?.includes(tag)).length;
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = `🏷️ ${tag} (${count})`;
      select.appendChild(option);
    });
  }

  filterByTag = (tag) => {
    this.currentTag = tag;
    document.getElementById('tagFilter').value = tag;
    this.applyFilter();
  }

  setupEventListeners = () => {
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.currentSearch = e.target.value.trim();
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

  openModal = (id) => {
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
          <source src="${video.url}" type="video/mp4" />
          Browser anda tidak mendukung video ini.
        </video>`;
    }

    document.getElementById('videoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  closeModal = () => {
    document.getElementById('videoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('videoPlayer').innerHTML = '';
  }

  addVideo = async () => {
    const title = document.getElementById('videoTitleInput').value.trim();
    const thumb = document.getElementById('videoThumbInput').value.trim();
    const inputUrl = document.getElementById('videoEmbedInput').value.trim();
    const tagsRaw = document.getElementById('videoTagInput').value.trim();
    const duration = document.getElementById('videoDurationInput').value.trim() || '00:00';

    if (!title) {
      alert('⚠️ Judul video wajib diisi!');
      return;
    }
    if (!inputUrl) {
      alert('⚠️ URL video wajib diisi!');
      return;
    }

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

    // Tombol loading
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

    alert(`✅ Video "${title}" berhasil ditambahkan!`);
  }
}

// Inisialisasi objek gallery di global scope supaya fungsi HTML bisa akses
let gallery;
const hlsScript = document.createElement('script');
hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
hlsScript.onload = () => {
  gallery = new VideoGallery();
};
document.head.appendChild(hlsScript);