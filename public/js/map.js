let map;
let markers = [];

function initMap() {
    if (map) return;
    
    map = L.map('map').setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    map.on('click', onMapClick);
    
    loadSounds();
}

function onMapClick(e) {
    if (!window.app.currentUser) {
        window.app.showNotification('Please login to add sounds', 'info');
        return;
    }
    
    showAddSoundModal(e.latlng);
}

function showAddSoundModal(latlng) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = 'Add New Sound';
    modalBody.innerHTML = `
        <form id="sound-form">
            <div class="form-group">
                <label for="sound-title">Title</label>
                <input type="text" id="sound-title" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="sound-description">Description</label>
                <textarea id="sound-description" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="sound-category">Category</label>
                <select id="sound-category" class="form-control form-select" required>
                    <option value="">Select Category</option>
                    <option value="music">Music</option>
                    <option value="conversation">Conversation</option>
                    <option value="ambient">Ambient</option>
                    <option value="effect">Sound Effect</option>
                    <option value="story">Story</option>
                </select>
            </div>
            <div class="form-group">
                <label for="sound-tags">Tags (comma separated)</label>
                <input type="text" id="sound-tags" class="form-control" placeholder="e.g., nature, birds, forest">
            </div>
            <div class="form-group">
                <label for="sound-language">Language</label>
                <select id="sound-language" class="form-control form-select">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                </select>
            </div>
            <div class="form-group">
                <label for="sound-privacy">Privacy</label>
                <select id="sound-privacy" class="form-control form-select">
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                </select>
            </div>
            <div class="form-group">
                <label for="sound-file">Audio File (MP3/WAV)</label>
                <input type="file" id="sound-file" class="form-control" accept="audio/*" required>
            </div>
            <button type="submit" class="btn btn-block">Upload Sound</button>
        </form>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('sound-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addSound(latlng);
    });
}

async function addSound(latlng) {
    const title = document.getElementById('sound-title').value;
    const description = document.getElementById('sound-description').value;
    const category = document.getElementById('sound-category').value;
    const tags = document.getElementById('sound-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const language = document.getElementById('sound-language').value;
    const privacy = document.getElementById('sound-privacy').value;
    const file = document.getElementById('sound-file').files[0];
    
    if (!file) {
        window.app.showNotification('Please select an audio file', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags));
    formData.append('category', category);
    formData.append('language', language);
    formData.append('privacy', privacy);
    formData.append('latitude', latlng.lat);
    formData.append('longitude', latlng.lng);
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/sounds', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            addMarker(data.sound);
            window.app.closeModal();
            window.app.showNotification('Sound added successfully!', 'success');
        } else {
            window.app.showNotification(data.message || 'Failed to add sound', 'error');
        }
    } catch (error) {
        window.app.showNotification('Network error. Please try again.', 'error');
    }
}

async function loadSounds() {
    try {
        const response = await fetch('/api/sounds');
        const data = await response.json();
        
        if (response.ok) {
            data.sounds.forEach(sound => {
                addMarker(sound);
            });
        }
    } catch (error) {
        console.error('Failed to load sounds');
    }
}

function addMarker(sound) {
    const categoryIcons = {
        music: 'fas fa-music',
        conversation: 'fas fa-comments',
        ambient: 'fas fa-wind',
        effect: 'fas fa-bolt',
        story: 'fas fa-book'
    };
    
    const categoryColors = {
        music: '#FF6B6B',
        conversation: '#4ECDC4',
        ambient: '#45B7D1',
        effect: '#96CEB4',
        story: '#FFEAA7'
    };
    
    const icon = L.divIcon({
        className: 'sound-marker',
        html: `<i class="${categoryIcons[sound.category] || 'fas fa-volume-up'}" 
                 style="color: ${categoryColors[sound.category] || '#5BC0FF'}; font-size: 20px;"></i>`,
        iconSize: [30, 30]
    });
    
    const marker = L.marker([sound.latitude, sound.longitude], { icon }).addTo(map);
    
    marker.bindPopup(createPopupContent(sound), {
        maxWidth: 300
    });
    
    markers.push(marker);
}

function createPopupContent(sound) {
    return `
        <div class="popup-content">
            <div class="popup-header">
                <div class="popup-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px;">
                    ${sound.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <strong>${sound.user.name}</strong>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${sound.title}</div>
                </div>
            </div>
            <p class="mt-1" style="margin: 0.5rem 0;">${sound.description}</p>
            <audio controls style="width: 100%; margin: 0.5rem 0;">
                <source src="/uploads/audio/${sound.filename}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>
            <div class="popup-actions" style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <button onclick="window.app.showNotification('Feature coming soon', 'info')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                    <i class="fas fa-heart"></i>
                </button>
                <button onclick="window.app.showNotification('Feature coming soon', 'info')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                    <i class="fas fa-comment"></i>
                </button>
                <button onclick="window.app.showNotification('Feature coming soon', 'info')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
                    <i class="fas fa-share"></i>
                </button>
            </div>
        </div>
    `;
}