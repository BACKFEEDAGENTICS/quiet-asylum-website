// Quiet Asylum Music Player Logic

// Tracks Database
const albums = {
    dream: {
        title: "Only When I Dream About It",
        cover: "assets/images/dream-cover.jpg",
        artist: "Quiet Asylum",
        tracks: [
            { num: 1, title: "Afternoon Delight (Remastered)", file: "1. afternoon-delight (remastered).mp3" },
            { num: 2, title: "Rhythm & Sanctimony (Remastered)", file: "2. rhythm-&-sanctimony (remastered).mp3" },
            { num: 3, title: "You're Killing My Kindness (Remastered)", file: "3. you're-killing-my-kindness (remastered).mp3" },
            { num: 4, title: "Heaven Is For Fools (Remastered)", file: "4. heaven-is-for-fools (remastered).mp3" },
            { num: 5, title: "Driving Alone With You (Remastered)", file: "5. driving-alone-with-you-(remastered).mp3" },
            { num: 6, title: "Only When I Dream About It (Remastered)", file: "6. only-when-i-dream-about-it-(remastered).mp3" },
            { num: 7, title: "Closer Together (Remastered)", file: "7. closer-together-(remastered).mp3" },
            { num: 8, title: "After All Is Said & Done (Remastered)", file: "8. after-all-is-said-&-done-(Remastered).mp3" },
            { num: 9, title: "Doesn't Have To Be This Way (Remastered)", file: "9. doesn't-have-to-be-this-way-(remastered).mp3" },
            { num: 10, title: "Even In The Silence You'll Know (Remastered)", file: "10. even-in-the-silence-you'll-know--(remastered).mp3" }
        ],
        folder: "only-when-i-dream"
    },
    happy: {
        title: "I Hope You're Happy",
        cover: "assets/images/happy-cover.png",
        artist: "Quiet Asylum",
        tracks: [
            { num: 1, title: "Loser Under Cover", file: "1. loser-under-cover.mp3" },
            { num: 2, title: "Fun Times In '09", file: "2. fun-times-in-'09.mp3" },
            { num: 3, title: "Subtle As It Seems", file: "3. subtle-as-it-seems.mp3" },
            { num: 4, title: "Leave Me Where You Found Us", file: "4. leave-me-where-you-found-us.mp3" },
            { num: 5, title: "I Hope You're Happy", file: "5. i-hope-you're-happy.mp3" },
            { num: 6, title: "Anything Less (Would Be Absurd)", file: "6. anything-less-(would-be-absurd).mp3" },
            { num: 7, title: "Emotional Patrolling", file: "7. emotional-patrolling.mp3" },
            { num: 8, title: "Draggin' Me Down", file: "8. draggin'-me-down.mp3" },
            { num: 9, title: "Just An Outcast", file: "9. just-an-outcast.mp3" },
            { num: 10, title: "All I Wanted To Do", file: "10. all-i-wanted-to-do.mp3" }
        ],
        folder: "i-hope-youre-happy"
    }
};

// Player State
let currentAlbumKey = 'dream';
let currentTrackIndex = 0;
let isPlaying = false;
let shuffleMode = false;
let repeatMode = false; // false = no repeat, 'one' = repeat current, 'all' = repeat playlist
let volume = 0.8;

// Web Audio API State
let audioCtx = null;
let audioSource = null;
let analyser = null;
let visualizerId = null;

// DOM Elements
const audio = document.getElementById('audio-player');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnRepeat = document.getElementById('btn-repeat');
const btnMute = document.getElementById('btn-mute');
const btnDream = document.getElementById('btn-dream');
const btnHappy = document.getElementById('btn-happy');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

const volumeContainer = document.getElementById('volume-container');
const volumeSlider = document.getElementById('volume-slider');

const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerAlbum = document.getElementById('player-album');
const albumArt = document.getElementById('album-art');
const trackListEl = document.getElementById('track-list');
const trackCountEl = document.getElementById('track-count');

const canvas = document.getElementById('visualizer-canvas');
const canvasCtx = canvas.getContext('2d');

// Initialize Website
function init() {
    loadAlbum(currentAlbumKey);
    setVolume(volume);
    
    // Add Event Listeners
    btnPlay.addEventListener('click', togglePlay);
    btnPrev.addEventListener('click', prevTrack);
    btnNext.addEventListener('click', nextTrack);
    btnShuffle.addEventListener('click', toggleShuffle);
    btnRepeat.addEventListener('click', toggleRepeat);
    btnMute.addEventListener('click', toggleMute);
    
    btnDream.addEventListener('click', () => switchAlbum('dream'));
    btnHappy.addEventListener('click', () => switchAlbum('happy'));
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', onTrackEnded);
    audio.addEventListener('loadedmetadata', setDuration);
    
    progressContainer.addEventListener('click', setProgress);
    volumeContainer.addEventListener('click', setVolumeFromSlider);
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
}

// Switch between albums
function switchAlbum(albumKey) {
    if (currentAlbumKey === albumKey) return;
    
    currentAlbumKey = albumKey;
    currentTrackIndex = 0;
    
    // Update theme classes on body
    if (albumKey === 'dream') {
        document.body.classList.remove('theme-happy');
        document.body.classList.add('theme-dream');
        btnDream.classList.add('active');
        btnHappy.classList.remove('active');
    } else {
        document.body.classList.remove('theme-dream');
        document.body.classList.add('theme-happy');
        btnHappy.classList.add('active');
        btnDream.classList.remove('active');
    }
    
    loadAlbum(albumKey);
    
    if (isPlaying) {
        playTrack();
    }
}

// Load Album Details and Populate track list
function loadAlbum(albumKey) {
    const album = albums[albumKey];
    trackListEl.innerHTML = '';
    trackCountEl.textContent = `${album.tracks.length} Tracks`;
    
    album.tracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.className = `track-item ${index === currentTrackIndex ? 'active' : ''}`;
        li.innerHTML = `
            <span class="track-num">${track.num}</span>
            <div class="track-info">
                <div class="track-name">${track.title}</div>
            </div>
            <span class="track-dur">--:--</span>
        `;
        
        li.addEventListener('click', () => {
            currentTrackIndex = index;
            selectTrack();
            playTrack();
        });
        
        trackListEl.appendChild(li);
        
        // Pre-fetch track duration in background
        getDuration(`assets/audio/${album.folder}/${track.file}`, duration => {
            li.querySelector('.track-dur').textContent = formatTime(duration);
        });
    });
    
    selectTrack();
}

// Pre-fetch track duration using a temporary Audio element
function getDuration(src, callback) {
    const tempAudio = new Audio();
    tempAudio.src = src;
    tempAudio.addEventListener('loadedmetadata', () => {
        callback(tempAudio.duration);
    });
}

// Select track details in player interface
function selectTrack() {
    const album = albums[currentAlbumKey];
    const track = album.tracks[currentTrackIndex];
    
    playerTitle.textContent = track.title;
    playerArtist.textContent = album.artist;
    playerAlbum.textContent = album.title;
    albumArt.src = album.cover;
    
    audio.src = `assets/audio/${album.folder}/${track.file}`;
    
    // Highlight current track item
    const items = trackListEl.querySelectorAll('.track-item');
    items.forEach((item, index) => {
        if (index === currentTrackIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Play/Pause actions
function togglePlay() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function playTrack() {
    // Initialize Web Audio API on first user gesture
    initAudioContext();
    
    audio.play().then(() => {
        isPlaying = true;
        btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
        albumArt.style.animationPlayState = 'running';
        
        // Start visualizer animation loop
        if (analyser) {
            drawVisualizer();
        }
    }).catch(err => {
        console.error("Playback error:", err);
    });
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    btnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
    albumArt.style.animationPlayState = 'paused';
    cancelAnimationFrame(visualizerId);
}

// Track navigation
function prevTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = albums[currentAlbumKey].tracks.length - 1;
    }
    selectTrack();
    if (isPlaying) playTrack();
}

function nextTrack() {
    if (shuffleMode) {
        currentTrackIndex = Math.floor(Math.random() * albums[currentAlbumKey].tracks.length);
    } else {
        currentTrackIndex++;
        if (currentTrackIndex >= albums[currentAlbumKey].tracks.length) {
            currentTrackIndex = 0;
        }
    }
    selectTrack();
    if (isPlaying) playTrack();
}

function onTrackEnded() {
    if (repeatMode === 'one') {
        audio.currentTime = 0;
        playTrack();
    } else if (repeatMode === 'all' || currentTrackIndex < albums[currentAlbumKey].tracks.length - 1 || shuffleMode) {
        nextTrack();
    } else {
        pauseTrack();
    }
}

// Shuffle & Repeat toggles
function toggleShuffle() {
    shuffleMode = !shuffleMode;
    btnShuffle.classList.toggle('active', shuffleMode);
}

function toggleRepeat() {
    if (!repeatMode) {
        repeatMode = 'all';
        btnRepeat.classList.add('active');
        btnRepeat.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    } else if (repeatMode === 'all') {
        repeatMode = 'one';
        btnRepeat.classList.add('active');
        btnRepeat.innerHTML = '<i class="fa-solid fa-repeat"></i><span style="font-size: 8px; position: absolute; margin-top: 10px; font-weight: bold;">1</span>';
    } else {
        repeatMode = false;
        btnRepeat.classList.remove('active');
        btnRepeat.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    }
}

// Volume Controls
function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    audio.volume = volume;
    volumeSlider.style.width = `${volume * 100}%`;
    
    // Update speaker icon
    if (volume === 0 || audio.muted) {
        btnMute.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else if (volume < 0.4) {
        btnMute.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
        btnMute.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
}

function setVolumeFromSlider(e) {
    const rect = volumeContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.muted = false;
    setVolume(pos);
}

function toggleMute() {
    audio.muted = !audio.muted;
    setVolume(volume);
}

// Progress Seek bar handling
function updateProgress() {
    if (!audio.duration) return;
    const pos = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${pos}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
}

function setDuration() {
    totalDurationEl.textContent = formatTime(audio.duration || 0);
}

function setProgress(e) {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
}

// Helper: Format seconds to MM:SS
function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Web Audio API & Visualizer Setup
function initAudioContext() {
    if (audioCtx) return;
    
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128; // Elegant clean bar visualizer
        
        audioSource = audioCtx.createMediaElementSource(audio);
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
    } catch (e) {
        console.warn("Web Audio API not supported or context blocked.", e);
    }
}

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Visualizer animation loop
function drawVisualizer() {
    visualizerId = requestAnimationFrame(drawVisualizer);
    
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 1.6;
    let barHeight;
    let x = 0;
    
    const style = getComputedStyle(document.body);
    const primaryColor = style.getPropertyValue('--primary').trim() || '#a855f7';
    const secondaryColor = style.getPropertyValue('--secondary').trim() || '#3b82f6';
    
    for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (canvas.height * 0.75);
        
        // Add subtle glow to visualizer lines
        canvasCtx.shadowBlur = 8;
        canvasCtx.shadowColor = primaryColor;
        
        const grad = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, primaryColor + '20'); // Translucent base
        grad.addColorStop(0.5, primaryColor);
        grad.addColorStop(1, secondaryColor);
        
        canvasCtx.fillStyle = grad;
        
        canvasCtx.beginPath();
        canvasCtx.roundRect(x, canvas.height - barHeight, barWidth - 6, barHeight, [4, 4, 0, 0]);
        canvasCtx.fill();
        
        x += barWidth;
    }
}

// Boot up
window.onload = init;
