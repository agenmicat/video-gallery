const apiUrl = 'https://video-api.nenenbiadab.workers.dev';
const ADMIN_PASSWORD = 'passwordRahasia123';

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

const videosContainer = document.getElementById('videosContainer');
const addVideoForm = document.getElementById('addVideoForm');
const importFileInput = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');

let videosData = [];

// Login logic
function checkLogin() {
  if (sessionStorage.getItem('isAdmin') === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.style.display = 'block';
  dashboardSection.style.display = 'none';
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  renderVideos();
}

loginBtn.onclick = () => {
  const pw = document.getElementById('adminPass').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('isAdmin', 'true');
    showDashboard();
  } else {
    alert('Password salah.');
  }
};

logoutBtn.onclick = () => {
  sessionStorage.removeItem('isAdmin');
  showLogin();
};

// Fetch videos from API
async function fetchVideos() {
  try {
    const res = await fetch(apiUrl);
    if (res.ok) {
      videosData = await res.json();
      return videosData;
    } else {
      alert('Gagal ambil data video dari server.');
      return [];
    }
  } catch (e) {
    alert('Kesalahan jaringan saat mengambil data video.');
    return [];
  }
}

// Save videos to API
async function saveVideos(data) {
  try {
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (e) {
    alert('Gagal menyimpan data video.');
    return { success: false };
  }
}

// Render list video di dashboard
async function renderVideos() {
  await fetchVideos();
  videosContainer.innerHTML = '';

  if (videosData.length === 0) {
    videosContainer.innerHTML = '<p>Tidak ada video.</p>';
    return;
  }

  videosData.forEach(video => {
    const div = document.createElement('div');
    div.className = 'video-admin-item';
    
    div.innerHTML = `
      <div>
        <strong>${video.title}</strong><br/>
        Tags: ${video.tags?.join(', ') || '<i>tidak ada</i>'}<br/>
        Durasi: ${video.duration || '-'}
      </div>
      <button>Hapus</button>
    `;

    div.querySelector('button').onclick = () => deleteVideo(video.id);
    videosContainer.appendChild(div);
  });
}

// Tambah video
addVideoForm.onsubmit = async e => {
  e.preventDefault();

  const newVideo = {
    id: Date.now(),
    title: document.getElementById('title').value.trim(),
    thumbnail: document.getElementById('thumbnail').value.trim() || 'https://via.placeholder.com/1280x720?text=No+Image',
    url: document.getElementById('url').value.trim(),
    tags: document.getElementById('tags').value
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== ''),
    duration: document.getElementById('duration').value.trim() || '00:00',
    type: (function(url) {
      if (url.match(/\.(mp4|m3u8|webm)$/i)) return 'mp4';
      return 'iframe';
    })(document.getElementById('url').value.trim()),
    embed: (function(url) {
      if (url.match(/\.(mp4|m3u8|webm)$/i)) return '';
      return url.trim();
    })(document.getElementById('url').value.trim()),
  };

  videosData.unshift(newVideo);
  const saveRes = await saveVideos(videosData);
  if (saveRes.success) {
    alert('Video berhasil ditambahkan');
    addVideoForm.reset();
    renderVideos();
  } else {
    alert('Gagal menambahkan video');
  }
};

// Hapus video
async function deleteVideo(id) {
  if (!confirm('Yakin ingin menghapus video ini?')) return;

  try {
    const res = await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.success) {
      videosData = videosData.filter(v => v.id !== id);
      alert('Video berhasil dihapus');
      renderVideos();
    } else {
      alert('Gagal hapus video: ' + result.message);
    }
  } catch {
    alert('Kesalahan jaringan saat menghapus video.');
  }
}

// Import JSON/CSV
importBtn.onclick = () => {
  const file = importFileInput.files[0];
  if (!file) {
    alert('Pilih file JSON atau CSV terlebih dahulu');
    return;
  }
  const reader = new FileReader();
  reader.onload = async e => {
    let importedData;
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        importedData = JSON.parse(e.target.result);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        importedData = csvToJSON(e.target.result);
      } else {
        alert('Format file harus JSON atau CSV');
        return;
      }
    } catch {
      alert('File tidak valid atau gagal diparsing');
      return;
    }

    // Validasi data, tambahkan id unik jika perlu
    if (!Array.isArray(importedData)) {
      alert('Format data harus array');
      return;
    }
    importedData.forEach((item, i) => {
      if (!item.id) item.id = Date.now() + i;
      if (typeof item.tags === 'string') item.tags = item.tags.split(',').map(t => t.trim());
    });

    // Gabungkan data existing dengan import, dan simpan
    videosData = [...importedData, ...videosData];
    const result = await saveVideos(videosData);
    if (result.success) {
      alert('Import data berhasil!');
      renderVideos();
    } else {
      alert('Gagal simpan data setelah import!');
    }
  };

  reader.readAsText(file);
};

// Fallback sederhana CSV ke JSON
function csvToJSON(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]));
    return obj;
  });
}

// Init app
checkLogin();