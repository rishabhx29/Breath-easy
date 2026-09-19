// Box Breathing Companion - Enhanced Audio Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Box Breathing Companion with Enhanced Audio loaded!');
    
    // DOM Elements
    const breathingCircle = document.getElementById('breathingCircle');
    const instructionText = document.getElementById('instructionText');
    const phaseIndicator = document.getElementById('phaseIndicator');
    const progressFill = document.getElementById('progressFill');
    const startBtn = document.getElementById('startBtn');
    const soundBtn = document.getElementById('soundBtn');
    const soundIcon = document.getElementById('soundIcon');
    const cycleCount = document.getElementById('cycleCount');
    const audioControls = document.getElementById('audioControls');
    const backgroundVolumeSlider = document.getElementById('backgroundVolume');
    const cuesVolumeSlider = document.getElementById('cuesVolume');
    
    // App State
    let isBreathing = false;
    let currentPhase = 0; // 0: inhale, 1: hold, 2: exhale, 3: hold
    let cycleCounter = 0;
    let breathingInterval = null;
    let progressInterval = null;
    let soundEnabled = true;
    
    // Audio Context and Nodes
    let audioContext = null;
    let backgroundMusic = null;
    let backgroundGain = null;
    let cuesGain = null;
    let isAudioInitialized = false;
    
    // Breathing phases configuration
    const phases = [
        { name: 'Inhale', duration: 4000, instruction: 'Breathe In', circleClass: 'inhale' },
        { name: 'Hold', duration: 4000, instruction: 'Hold', circleClass: 'inhale' },
        { name: 'Exhale', duration: 4000, instruction: 'Breathe Out', circleClass: 'exhale' },
        { name: 'Hold', duration: 4000, instruction: 'Hold', circleClass: 'exhale' }
    ];
    
    // Initialize app
    function init() {
        updateUI();
        setupEventListeners();
        setupAudioVolumeControls();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        startBtn.addEventListener('click', toggleBreathing);
        soundBtn.addEventListener('click', toggleSound);
        
        // Double-click sound button to show volume controls
        soundBtn.addEventListener('dblclick', toggleAudioControls);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                toggleBreathing();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                toggleSound();
            } else if (e.code === 'KeyV') {
                e.preventDefault();
                toggleAudioControls();
            }
        });
        
        // Handle user interaction for audio context
        document.addEventListener('click', initializeAudioContext, { once: true });
        document.addEventListener('touchstart', initializeAudioContext, { once: true });
    }
    
    // Setup audio volume controls
    function setupAudioVolumeControls() {
        backgroundVolumeSlider.addEventListener('input', (e) => {
            if (backgroundGain) {
                backgroundGain.gain.setValueAtTime(e.target.value / 100 * 0.3, audioContext.currentTime);
            }
        });
        
        cuesVolumeSlider.addEventListener('input', (e) => {
            if (cuesGain) {
                cuesGain.gain.setValueAtTime(e.target.value / 100 * 0.7, audioContext.currentTime);
            }
        });
    }
    
    // Initialize audio context and create background music
    async function initializeAudioContext() {
        if (isAudioInitialized) return;
        
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            backgroundGain = audioContext.createGain();
            cuesGain = audioContext.createGain();
            
            backgroundGain.connect(audioContext.destination);
            cuesGain.connect(audioContext.destination);
            
            // Set initial volumes
            backgroundGain.gain.setValueAtTime(0.3 * (backgroundVolumeSlider.value / 100), audioContext.currentTime);
            cuesGain.gain.setValueAtTime(0.7 * (cuesVolumeSlider.value / 100), audioContext.currentTime);
            
            // Create background music
            createBackgroundMusic();
            
            isAudioInitialized = true;
            console.log('Audio context initialized successfully');
            
        } catch (e) {
            console.log('Audio context initialization failed:', e);
            // Fallback to simple tone generation
            window.playTone = () => {};
        }
    }
    
    // Create continuous background music
    function createBackgroundMusic() {
        if (!audioContext) return;
        
        // Create a complex ambient background using multiple oscillators
        const createAmbientLayer = (frequency, type, gain) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, audioContext.currentTime);
            filter.Q.setValueAtTime(1, audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(backgroundGain);
            
            return { oscillator, gainNode, filter };
        };
        
        // Create multiple ambient layers for rich background
        const layers = [
            createAmbientLayer(55, 'sine', 0.1),     // Deep bass drone
            createAmbientLayer(110, 'triangle', 0.08), // Low harmonic
            createAmbientLayer(220, 'sine', 0.06),    // Mid-range pad
            createAmbientLayer(330, 'triangle', 0.04), // Higher harmonic
        ];
        
        // Add subtle modulation to create movement
        layers.forEach((layer, index) => {
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            
            lfo.frequency.setValueAtTime(0.1 + index * 0.05, audioContext.currentTime);
            lfo.type = 'sine';
            lfoGain.gain.setValueAtTime(0.02, audioContext.currentTime);
            
            lfo.connect(lfoGain);
            lfoGain.connect(layer.gainNode.gain);
            
            lfo.start();
            layer.oscillator.start();
        });
        
        backgroundMusic = layers;
    }
    
    // Start background music
    function startBackgroundMusic() {
        if (!soundEnabled || !backgroundGain) return;
        
        // Fade in background music
        backgroundGain.gain.cancelScheduledValues(audioContext.currentTime);
        backgroundGain.gain.setValueAtTime(0, audioContext.currentTime);
        backgroundGain.gain.linearRampToValueAtTime(
            0.3 * (backgroundVolumeSlider.value / 100), 
            audioContext.currentTime + 2
        );
    }
    
    // Stop background music
    function stopBackgroundMusic() {
        if (!backgroundGain) return;
        
        // Fade out background music
        backgroundGain.gain.cancelScheduledValues(audioContext.currentTime);
        backgroundGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
    }
    
    // Create soothing breathing cue sounds
    function createBreathingCue(type, duration = 0.8) {
        if (!soundEnabled || !audioContext || !cuesGain) return;
        
        const now = audioContext.currentTime;
        
        switch (type) {
            case 'inhale':
                // Gentle rising tone like soft wind
                createWindSound(220, 330, duration, 'inhale');
                break;
                
            case 'hold':
                // Soft chime or bell
                createChimeSound(440, duration);
                break;
                
            case 'exhale':
                // Gentle falling tone like gentle breeze
                createWindSound(330, 220, duration, 'exhale');
                break;
        }
    }
    
    // Create wind-like sound for inhale/exhale
    function createWindSound(startFreq, endFreq, duration, type) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const noiseGain = audioContext.createGain();
        
        // Main tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + duration);
        
        // Filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, audioContext.currentTime);
        
        // Envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // Add subtle noise for breath-like quality
        const noiseBuffer = createNoiseBuffer(0.1);
        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        noiseGain.gain.setValueAtTime(0, audioContext.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.1);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        // Connect nodes
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(cuesGain);
        
        noiseSource.connect(noiseGain);
        noiseGain.connect(cuesGain);
        
        // Start and stop
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        noiseSource.start(audioContext.currentTime);
        noiseSource.stop(audioContext.currentTime + duration);
    }
    
    // Create chime sound for hold phases
    function createChimeSound(frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Add harmonic
        const harmonic = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(frequency * 2, audioContext.currentTime);
        harmonicGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        // Filter for bell-like quality
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioContext.currentTime);
        filter.Q.setValueAtTime(1, audioContext.currentTime);
        
        // Bell-like envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        // Connect nodes
        oscillator.connect(filter);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(cuesGain);
        
        // Start and stop
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        harmonic.start(audioContext.currentTime);
        harmonic.stop(audioContext.currentTime + duration);
    }
    
    // Create noise buffer for breath-like sounds
    function createNoiseBuffer(duration) {
        const sampleRate = audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        return buffer;
    }
    
    // Toggle breathing session
    async function toggleBreathing() {
        if (!isAudioInitialized) {
            await initializeAudioContext();
        }
        
        if (isBreathing) {
            stopBreathing();
        } else {
            startBreathing();
        }
    }
    
    // Start breathing session
    function startBreathing() {
        isBreathing = true;
        currentPhase = 0;
        
        updateStartButton();
        startBackgroundMusic();
        startBreathingCycle();
        
        // Add visual indicator for playing audio
        if (soundEnabled) {
            soundBtn.classList.add('playing');
        }
    }
    
    // Stop breathing session
    function stopBreathing() {
        isBreathing = false;
        currentPhase = 0;
        
        // Clear intervals
        if (breathingInterval) {
            clearTimeout(breathingInterval);
            breathingInterval = null;
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
        
        // Stop background music
        stopBackgroundMusic();
        
        // Reset UI
        resetCircle();
        resetProgress();
        updateStartButton();
        updateInstruction('Press Start to Begin');
        hidePhaseIndicator();
        soundBtn.classList.remove('playing');
    }
    
    // Start breathing cycle
    function startBreathingCycle() {
        if (!isBreathing) return;
        
        const phase = phases[currentPhase];
        
        // Update UI for current phase
        updateInstruction(phase.instruction);
        updateCircle(phase.circleClass);
        showPhaseIndicator();
        startProgress(phase.duration);
        
        // Play breathing cue sound
        playPhaseSound(currentPhase);
        
        // Set timer for next phase
        breathingInterval = setTimeout(() => {
            if (!isBreathing) return;
            
            // Move to next phase
            currentPhase = (currentPhase + 1) % phases.length;
            
            // If we completed a full cycle (back to inhale)
            if (currentPhase === 0) {
                cycleCounter++;
                updateCycleCounter();
            }
            
            // Continue to next phase
            startBreathingCycle();
        }, phase.duration);
    }
    
    // Play sound for current phase
    function playPhaseSound(phase) {
        if (!soundEnabled) return;
        
        switch (phase) {
            case 0: // Inhale
                createBreathingCue('inhale', 1.0);
                break;
            case 1: // Hold after inhale
                createBreathingCue('hold', 0.5);
                break;
            case 2: // Exhale
                createBreathingCue('exhale', 1.0);
                break;
            case 3: // Hold after exhale
                createBreathingCue('hold', 0.5);
                break;
        }
    }
    
    // Update breathing circle
    function updateCircle(className) {
        breathingCircle.className = 'breathing-circle';
        if (className) {
            breathingCircle.classList.add(className);
        }
    }
    
    // Reset breathing circle
    function resetCircle() {
        breathingCircle.className = 'breathing-circle';
    }
    
    // Update instruction text
    function updateInstruction(text) {
        instructionText.classList.remove('visible');
        
        setTimeout(() => {
            instructionText.textContent = text;
            instructionText.classList.add('visible');
        }, 250);
    }
    
    // Show phase indicator
    function showPhaseIndicator() {
        phaseIndicator.classList.add('active');
    }
    
    // Hide phase indicator
    function hidePhaseIndicator() {
        phaseIndicator.classList.remove('active');
    }
    
    // Start progress animation
    function startProgress(duration) {
        progressFill.style.width = '0%';
        progressFill.style.transition = 'none';
        
        // Force reflow
        void progressFill.offsetHeight;
        
        // Start animation
        progressFill.style.transition = `width ${duration}ms linear`;
        progressFill.style.width = '100%';
    }
    
    // Reset progress bar
    function resetProgress() {
        progressFill.style.width = '0%';
        progressFill.style.transition = 'none';
    }
    
    // Update start button
    function updateStartButton() {
        const btnText = startBtn.querySelector('.btn-text');
        
        if (isBreathing) {
            btnText.textContent = 'Stop';
            startBtn.classList.add('active');
        } else {
            btnText.textContent = 'Start';
            startBtn.classList.remove('active');
        }
    }
    
    // Toggle sound
    function toggleSound() {
        soundEnabled = !soundEnabled;
        updateSoundButton();
        
        if (isBreathing) {
            if (soundEnabled) {
                startBackgroundMusic();
                soundBtn.classList.add('playing');
            } else {
                stopBackgroundMusic();
                soundBtn.classList.remove('playing');
            }
        }
    }
    
    // Update sound button
    function updateSoundButton() {
        if (soundEnabled) {
            soundIcon.textContent = '🔊';
            soundBtn.classList.remove('muted');
            soundBtn.title = 'Turn Sound Off';
        } else {
            soundIcon.textContent = '🔇';
            soundBtn.classList.add('muted');
            soundBtn.title = 'Turn Sound On';
        }
    }
    
    // Toggle audio controls visibility
    function toggleAudioControls() {
        const isVisible = audioControls.style.display !== 'none';
        audioControls.style.display = isVisible ? 'none' : 'block';
    }
    
    // Update cycle counter
    function updateCycleCounter() {
        cycleCount.textContent = cycleCounter;
        
        // Add a subtle animation to highlight the counter update
        cycleCount.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cycleCount.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Update UI
    function updateUI() {
        updateStartButton();
        updateSoundButton();
        updateCycleCounter();
    }
    
    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isBreathing) {
            // Optionally pause when tab is not visible
            // stopBreathing();
        }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (isBreathing) {
            stopBreathing();
        }
    });
    
    // Initialize the app
    init();
    
    // Add some helpful console messages
    console.log('🫁 Box Breathing Companion with Enhanced Audio ready!');
    console.log('💡 Tips:');
    console.log('  - Press Space to start/stop, S to toggle sound');
    console.log('  - Double-click sound button or press V for volume controls');
    console.log('  - Enjoy the continuous ambient background music');
    console.log('🎯 Follow the 4-4-4-4 breathing pattern with soothing audio cues');
});
