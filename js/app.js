// ============================================
// UWP FUN RUN - APP.JS (API VERSION)
// ============================================

// API Configuration
const API_BASE_URL = 'http://localhost:5500/api'; // Ganti dengan URL backend Anda

// API Helper Functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Terjadi kesalahan pada server');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body });
    },
    
    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Participant API
const participantAPI = {
    register: (data) => api.post('/participants/register', data),
    getAll: () => api.get('/participants'),
    getByBib: (bib) => api.get(`/participants/${bib}`),
    search: (query) => api.get(`/participants/search?q=${query}`),
    update: (bib, data) => api.put(`/participants/${bib}`, data),
    delete: (bib) => api.delete(`/participants/${bib}`),
    verifyPayment: (bib) => api.put(`/participants/${bib}/verify`, {})
};

// Results API
const resultsAPI = {
    getAll: () => api.get('/results'),
    getByCategory: (category) => api.get(`/results?category=${category}`),
    submit: (data) => api.post('/results', data)
};

// State Management
let participants = [];
let races = [];
let currentRace = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initCountdown();
    initRegistrationForm();
    loadInitialData();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navbar = document.getElementById('navbar');
    
    const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (document.getElementById('navToggle')) {
    (document.getElementById('navToggle')).addEventListener('click', () => {
        (document.getElementById('navMenu')).classList.toggle('active');
    });
}
    };
    
    // Smooth scroll and active link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    navMenu.classList.remove('active');
                }
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
        
        updateActiveLink();
    });


function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

async function loadInitialData() {
    try {
        // Load race info
        await loadRaceInfo();
        
        // Load participants count
        await updateStats();
        
        // Load results
        await loadResults();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

async function loadRaceInfo() {
    try {
        // Ambil data race dari API atau gunakan default
        const response = await api.get('/races/current');
        currentRace = response.data || {
            id: 'uwp2024',
            name: 'UWP Fun Run 2024',
            date: '2024-12-15',
            categories: ['5k-fun', '5k-competitive', 'family']
        };
        
        initCountdown();
    } catch (error) {
        // Fallback ke default jika API belum ready
        currentRace = {
            id: 'uwp2024',
            name: 'UWP Fun Run 2024',
            date: '2024-12-15',
            categories: ['5k-fun', '5k-competitive', 'family']
        };
        initCountdown();
    }
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function updateCountdown() {
    const eventDate = new Date('July 5, 2026 06:00:00').getTime();
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance < 0) {
        document.getElementById('days').textContent = '00';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

setInterval(updateCountdown, 1000);
updateCountdown();
function updateCountdownDisplay(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = String(value).padStart(2, '0');
    }
}

// ============================================
// REGISTRATION FORM
// ============================================

function initRegistrationForm() {
    const form = document.getElementById('registrationForm');
    const categoryOptions = document.querySelectorAll('input[name="category"]');
const summaryPrice = document.getElementById('summaryPrice');
const totalPrice = document.getElementById('totalPrice');

const prices = {
    '5k-fun': 275000,
    '10k-competitive': 375000,
    'Half Marathon': 475000
};
categoryOptions.forEach(option => {
    option.addEventListener('change', () => {
        const price = prices[option.value] || 0;
        if (summaryPrice) summaryPrice.textContent = 'Rp ' + price.toLocaleString('id-ID');
        if (totalPrice) totalPrice.textContent = 'Rp ' + (price + 10000).toLocaleString('id-ID');
    });
});
    
    // Update price when category changes
    categoryInputs.forEach(input => {
        input.addEventListener('change', updatePrice);
    });
    
    form.addEventListener('submit', handleRegistration);
    
    // Set initial price
    updatePrice();
}

function updatePrice() {
    const selected = document.querySelector('input[name="category"]:checked');
    const prices = {
        '5k-fun': 150000,
        '5k-competitive': 250000,
        'family': 400000
    };
    
    const price = selected ? prices[selected.value] : 0;
    const adminFee = 10000;
    const total = price + adminFee;
    
    const summaryPriceEl = document.getElementById('summaryPrice');
    const totalPriceEl = document.getElementById('totalPrice');
    
    if (summaryPriceEl) summaryPriceEl.textContent = 'Rp ' + price.toLocaleString('id-ID');
    if (totalPriceEl) totalPriceEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// ============================================
// UPDATED: HANDLE REGISTRATION WITH API
// ============================================

async function handleRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Prepare data for API
    const participantData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthDate: formData.get('birthDate'),
        gender: formData.get('gender'),
        identityNumber: formData.get('identityNumber'),
        category: formData.get('category'),
        shirtSize: formData.get('shirtSize'),
        emergencyContact: formData.get('emergencyContact') || '',
        medicalInfo: formData.get('medicalInfo') || ''
    };
    
    // Validasi client-side
    if (!validateRegistrationData(participantData)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendaftar...';
    
    try {
        // Kirim ke API
        const response = await participantAPI.register(participantData);
        const participant = response.data;
        
        // Simpan ke localStorage sebagai cache
        participants.push(participant);
        localStorage.setItem('uwp_participants', JSON.stringify(participants));
        
        // Show success modal
        showSuccessModal(participant);
        
        // Reset form
        form.reset();
        updatePrice();
        
        // Update stats
        await updateStats();
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Pendaftaran gagal: ' + error.message);
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function validateRegistrationData(data) {
    const required = ['fullName', 'email', 'phone', 'birthDate', 'gender', 'category', 'shirtSize'];
    
    for (const field of required) {
        if (!data[field]) {
            alert(`Field ${field} wajib diisi!`);
            return false;
        }
    }
    
    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Format email tidak valid!');
        return false;
    }
    
    // Validasi phone (minimal 10 digit)
    if (data.phone.length < 10) {
        alert('Nomor telepon minimal 10 digit!');
        return false;
    }
    
    return true;
}

function getCategoryPrice(category) {
    const prices = {
        '5k-fun': 150000,
        '5k-competitive': 250000,
        'family': 400000
    };
    return prices[category] || 0;
}

function showSuccessModal(participant) {
    const modal = document.getElementById('successModal');
    if (!modal) return;
    
    document.getElementById('modalBib').textContent = participant.bib;
    document.getElementById('modalName').textContent = participant.fullName;
    document.getElementById('modalCategory').textContent = getCategoryName(participant.category);
    document.getElementById('modalTotal').textContent = 'Rp ' + participant.totalPrice.toLocaleString('id-ID');
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('active');
}

function getCategoryName(category) {
    const names = {
        '5k-fun': '5K Fun Run',
        '5k-competitive': '5K Competitive',
        'family': 'Family Run'
    };
    return names[category] || category;
}

// ============================================
// UPDATED: STATS WITH API
// ============================================

async function updateStats() {
    try {
        // Ambil data dari API
        const response = await participantAPI.getAll();
        participants = response.data || [];
        
        // Update localStorage cache
        localStorage.setItem('uwp_participants', JSON.stringify(participants));
        
        // Update UI
        const totalElement = document.getElementById('totalParticipants');
        if (totalElement) {
            animateValue(totalElement, 0, participants.length, 1000);
        }
        
        // Update category stats jika ada
        updateCategoryStats();
        
    } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback ke localStorage
        const cached = JSON.parse(localStorage.getItem('uwp_participants')) || [];
        const totalElement = document.getElementById('totalParticipants');
        if (totalElement) {
            animateValue(totalElement, 0, cached.length, 1000);
        }
    }
}

function updateCategoryStats() {
    const categories = ['5k-fun', '5k-competitive', 'family'];
    categories.forEach(cat => {
        const count = participants.filter(p => p.category === cat).length;
        const el = document.getElementById(`count-${cat}`);
        if (el) el.textContent = count;
    });
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// ============================================
// UPDATED: SEARCH PARTICIPANT WITH API
// ============================================

async function searchParticipant() {
    const searchInput = document.getElementById('searchBib');
    const resultDiv = document.getElementById('participantResult');
    const noResult = document.getElementById('noResult');
    
    if (!searchInput) return;
    
    const search = searchInput.value.trim().toLowerCase();
    
    if (!search) {
        if (resultDiv) resultDiv.style.display = 'none';
        if (noResult) noResult.style.display = 'block';
        return;
    }
    
    // Show loading
    if (resultDiv) {
        resultDiv.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Mencari...</div>';
        resultDiv.style.display = 'block';
    }
    
    try {
        let participant;
        
        // Coba cari di API dulu
        try {
            if (search.includes('@')) {
                // Search by email
                const response = await participantAPI.search(search);
                participant = response.data?.[0];
            } else {
                // Search by BIB
                const response = await participantAPI.getByBib(search.toUpperCase());
                participant = response.data;
            }
        } catch (apiError) {
            // Fallback ke localStorage
            console.log('API search failed, using local fallback');
            participant = participants.find(p => 
                p.bib.toLowerCase() === search || 
                p.email.toLowerCase() === search
            );
        }
        
        if (participant) {
            renderParticipantResult(participant);
        } else {
            renderNotFoundResult();
        }
        
    } catch (error) {
        console.error('Search error:', error);
        renderNotFoundResult();
    }
}

function renderParticipantResult(participant) {
    const resultDiv = document.getElementById('participantResult');
    const noResult = document.getElementById('noResult');
    
    const statusConfig = {
        'pending': { icon: 'clock', text: 'Menunggu Pembayaran', class: 'pending' },
        'paid': { icon: 'check-circle', text: 'Pembayaran Terverifikasi', class: 'paid' },
        'verified': { icon: 'check-double', text: 'Terverifikasi', class: 'paid' }
    };
    
    const status = statusConfig[participant.status] || statusConfig['pending'];
    
    resultDiv.innerHTML = `
        <div class="result-header">
            <div class="bib-number">${participant.bib}</div>
            <div class="result-status status-${status.class}">
                <i class="fas fa-${status.icon}"></i>
                ${status.text}
            </div>
        </div>
        <div class="result-details">
            <div class="detail-item">
                <span class="detail-label">Nama Lengkap</span>
                <span class="detail-value">${participant.fullName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Kategori</span>
                <span class="detail-value">${getCategoryName(participant.category)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Ukuran Kaos</span>
                <span class="detail-value">${participant.shirtSize}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">${participant.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Tanggal Daftar</span>
                <span class="detail-value">${new Date(participant.registrationDate).toLocaleDateString('id-ID')}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status Race Pack</span>
                <span class="detail-value">${participant.status === 'paid' || participant.status === 'verified' ? 'Siap Diambil' : 'Menunggu Verifikasi'}</span>
            </div>
        </div>
        ${participant.status === 'pending' ? `
        <div style="margin-top: 2rem; text-align: center; padding: 1.5rem; background: #fff3cd; border-radius: 12px;">
            <p style="margin-bottom: 1rem;"><i class="fas fa-info-circle"></i> Silakan selesaikan pembayaran untuk mengaktifkan pendaftaran Anda.</p>
            <button class="btn btn-primary" onclick="showPaymentInfo('${participant.bib}')">
                <i class="fas fa-money-bill"></i> Lihat Instruksi Pembayaran
            </button>
        </div>
        ` : ''}
    `;
    
    resultDiv.style.display = 'block';
    if (noResult) noResult.style.display = 'none';
}

function renderNotFoundResult() {
    const resultDiv = document.getElementById('participantResult');
    const noResult = document.getElementById('noResult');
    
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-search" style="font-size: 3rem; color: #dc3545; margin-bottom: 1rem;"></i>
            <h3>Peserta Tidak Ditemukan</h3>
            <p>Nomor BIB atau email yang Anda masukkan tidak terdaftar.</p>
        </div>
    `;
    resultDiv.style.display = 'block';
    if (noResult) noResult.style.display = 'none';
}

function showPaymentInfo(bib) {
    alert(`Instruksi Pembayaran untuk BIB ${bib}:\n\nSilakan transfer ke:\nBank: BCA\nNo. Rekening: 123-456-7890\nAtas Nama: UWP Fun Run\n\nNominal: Sesuai total pendaftaran\nBerita: UWP-${bib}\n\nKonfirmasi pembayaran ke WhatsApp: 0812-3456-7890`);
}

// ============================================
// UPDATED: RESULTS WITH API
// ============================================

async function loadResults() {
    try {
        const response = await resultsAPI.getAll();
        const results = response.data || [];
        
        if (results.length > 0) {
            renderResultsTable(results);
        } else {
            // Fallback ke sample data untuk demo
            renderSampleResults();
        }
    } catch (error) {
        console.error('Error loading results:', error);
        renderSampleResults();
    }
}

function renderSampleResults() {
    const sampleResults = [
        { bib: 'UWP001', name: 'Budi Santoso', category: '5k-competitive', time: '00:18:45', status: 'finished' },
        { bib: 'UWP002', name: 'Ahmad Rizki', category: '5k-competitive', time: '00:19:20', status: 'finished' },
        { bib: 'UWP003', name: 'Dewi Lestari', category: '5k-competitive', time: '00:20:15', status: 'finished' },
        { bib: 'UWP004', name: 'Siti Aminah', category: '5k-fun', time: '00:25:30', status: 'finished' },
        { bib: 'UWP005', name: 'Rudi Hartono', category: '5k-fun', time: '00:26:10', status: 'finished' }
    ];
    
    renderResultsTable(sampleResults);
}

function renderResultsTable(data) {
    const tbody = document.getElementById('resultsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach((result, index) => {
        const row = document.createElement('tr');
        const pace = calculatePace(result.time, 5);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${result.bib}</strong></td>
            <td>${result.name}</td>
            <td>${getCategoryName(result.category)}</td>
            <td>${result.time}</td>
            <td>${pace}/km</td>
            <td><span class="status-badge status-paid">FINISHED</span></td>
        `;
        tbody.appendChild(row);
    });
}

function calculatePace(timeStr, distance) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const pace = totalMinutes / distance;
    const paceMin = Math.floor(pace);
    const paceSec = Math.round((pace - paceMin) * 60);
    return `${paceMin}:${String(paceSec).padStart(2, '0')}`;
}

async function switchTab(category) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    try {
        const response = await resultsAPI.getByCategory(category);
        renderResultsTable(response.data || []);
    } catch (error) {
        console.error('Error filtering results:', error);
        // Fallback: filter dari sample data
        loadResults();
    }
}

function downloadResults() {
    // Implementasi download CSV
    const rows = [
        ['Pos', 'BIB', 'Nama', 'Kategori', 'Waktu', 'Pace', 'Status']
    ];
    
    const tbody = document.getElementById('resultsBody');
    if (tbody) {
        tbody.querySelectorAll('tr').forEach((tr, index) => {
            const cells = tr.querySelectorAll('td');
            const row = Array.from(cells).map(td => td.textContent);
            rows.push(row);
        });
    }
    
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'uwp_results.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Debounce function untuk search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions untuk global access
window.searchParticipant = searchParticipant;
window.closeModal = closeModal;
window.showPaymentInfo = showPaymentInfo;
window.switchTab = switchTab;
window.downloadResults = downloadResults;