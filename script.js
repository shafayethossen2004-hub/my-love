class LoveSynth {
    constructor() {
        this.ctx = null;
        this.active = false;
        this.muted = false;
        this.chordIndex = 0;
        this.timeoutId = null;
    }
    
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.delay = this.ctx.createDelay(2.0);
        this.delay.delayTime.value = 0.6;
        
        this.feedback = this.ctx.createGain();
        this.feedback.gain.value = 0.45;
        
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 800;
        
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.value = 0.12; // gentle base volume
        
        this.delay.connect(this.filter);
        this.filter.connect(this.feedback);
        this.feedback.connect(this.delay);
        
        this.masterVolume.connect(this.ctx.destination);
        this.delay.connect(this.masterVolume);
    }
    
    playNote(freq, time, duration) {
        if (!this.ctx || this.muted) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.2, time + 0.1); // softer attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        
        osc.connect(gainNode);
        gainNode.connect(this.masterVolume);
        gainNode.connect(this.delay);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    start() {
        this.init();
        if (this.active) return;
        this.active = true;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const progression = [
            // Am9
            [110.00, 164.81, 246.94, 261.63, 329.63],
            // Fmaj7
            [87.31, 130.81, 220.00, 261.63, 329.63],
            // Cmaj7
            [130.81, 196.00, 246.94, 329.63, 392.00],
            // G6
            [98.00, 146.83, 246.94, 293.66, 392.00]
        ];
        
        const playLoop = () => {
            if (!this.active) return;
            
            const chord = progression[this.chordIndex];
            const now = this.ctx.currentTime;
            
            chord.forEach((note, index) => {
                const noteDelay = index * 0.45;
                this.playNote(note, now + noteDelay, 2.5);
            });
            
            this.chordIndex = (this.chordIndex + 1) % progression.length;
            this.timeoutId = setTimeout(playLoop, 3800);
        };
        
        playLoop();
    }
    
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            if (this.masterVolume) this.masterVolume.gain.value = 0;
        } else {
            if (this.masterVolume) this.masterVolume.gain.value = 0.12;
        }
        return this.muted;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const triggerOverlay = document.getElementById('triggerOverlay');
    const startButton = document.getElementById('startButton');
    const loadingBar = document.getElementById('loadingBar');
    const statusText = document.getElementById('statusText');
    const ambientLight = document.getElementById('ambientLight');
    const roseWrapper = document.getElementById('roseWrapper');
    const roseHead = document.getElementById('roseHead');
    const calyx = document.getElementById('calyx');
    const stem = document.getElementById('stem');
    const leafLeft = document.getElementById('leafLeft');
    const leafRight = document.getElementById('leafRight');
    const endText = document.getElementById('endText');
    const fallingPetalsEl = document.getElementById('fallingPetals');
    const scene = document.querySelector('.scene');
    
    const musicToggle = document.getElementById('musicToggle');
    const letterBtn = document.getElementById('letterBtn');
    const letterOverlay = document.getElementById('letterOverlay');
    const closeLetterBtn = document.getElementById('closeLetterBtn');
    const synth = new LoveSynth();

    const PETAL_LAYERS = [
        { count: 4, w: 24, h: 46, curl: 78, delayBase: 0, tz: 2, cls: 'petal-bud' },
        { count: 5, w: 34, h: 58, curl: 65, delayBase: 0.25, tz: 9, cls: 'petal-core' },
        { count: 6, w: 46, h: 72, curl: 48, delayBase: 0.55, tz: 18, cls: 'petal-inner' },
        { count: 7, w: 58, h: 88, curl: 22, delayBase: 0.90, tz: 30, cls: 'petal-mid-inner' },
        { count: 8, w: 72, h: 104, curl: -5, delayBase: 1.30, tz: 44, cls: 'petal-mid' },
        { count: 9, w: 86, h: 118, curl: -25, delayBase: 1.75, tz: 60, cls: 'petal-outer' },
        { count: 10, w: 98, h: 130, curl: -48, delayBase: 2.25, tz: 76, cls: 'petal-blush' },
    ];

    const SEPALS_COUNT = 5;

    const FALLING_PETAL_COLORS = [
        ['#9a001d', '#3d0008'],
        ['#850018', '#2b0005'],
        ['#ad0022', '#480008'],
        ['#bf0028', '#52000c'],
    ];

    let fallingPetalInterval = null;
    let floatingHeartInterval = null;


    function startCardLoader() {
        const duration = 2400;
        const steps = [
            { threshold: 20, text: 'Loading Love...' },
            { threshold: 50, text: 'Growing velvet petals...' },
            { threshold: 75, text: 'Calibrating heartbeat...' },
            { threshold: 90, text: 'Pouring pure affection...' },
            { threshold: 100, text: 'Ready to bloom for Love ❤' }
        ];

        let startTimestamp = null;

        function animateLoader(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const percent = Math.floor(progress * 100);

            loadingBar.style.width = `${percent}%`;
            const activeStep = steps.find(s => percent <= s.threshold) || steps[steps.length - 1];
            statusText.textContent = activeStep.text;

            if (progress < 1) {
                requestAnimationFrame(animateLoader);
            } else {
                startButton.removeAttribute('disabled');
            }
        }

        requestAnimationFrame(animateLoader);
    }


    function createSepals() {
        const step = 360 / SEPALS_COUNT;
        for (let i = 0; i < SEPALS_COUNT; i++) {
            const sepal = document.createElement('div');
            sepal.className = 'sepal';
            const angle = i * step + (Math.random() - 0.5) * 5;
            const delay = 0.3 + i * 0.06;
            const curl = 18 + Math.random() * 8;

            sepal.style.setProperty('--sepal-angle', `${angle}deg`);
            sepal.style.setProperty('--sepal-curl', `${curl}deg`);
            sepal.style.setProperty('--sepal-delay', `${delay}s`);
            calyx.appendChild(sepal);
        }
    }

    function createPetals() {
        PETAL_LAYERS.forEach((layer, li) => {
            const angleStep = 360 / layer.count;
            const layerOffset = li * 24 + (Math.random() - 0.5) * 8;

            for (let i = 0; i < layer.count; i++) {
                const petal = document.createElement('div');
                petal.className = `petal ${layer.cls}`;

                const angle = layerOffset + i * angleStep + (Math.random() - 0.5) * 5;
                const delay = layer.delayBase + i * 0.05;
                const curlJitter = (Math.random() - 0.5) * 6;
                const scaleJitter = 0.94 + Math.random() * 0.12;
                const bloomDur = 2.1 + Math.random() * 0.4;

                petal.style.width = `${layer.w}px`;
                petal.style.height = `${layer.h}px`;
                petal.style.setProperty('--angle', `${angle}deg`);
                petal.style.setProperty('--curl', `${layer.curl + curlJitter}deg`);
                petal.style.setProperty('--scale', scaleJitter);
                petal.style.setProperty('--delay', `${delay}s`);
                petal.style.setProperty('--tz', `${layer.tz}px`);
                petal.style.setProperty('--bloom-dur', `${bloomDur}s`);

                roseHead.appendChild(petal);
            }
        });
    }

    function growStem() {
        return new Promise(resolve => {
            stem.classList.add('grow');

            setTimeout(() => {
                leafLeft.classList.add('visible');
            }, 800);

            setTimeout(() => {
                leafRight.classList.add('visible');
            }, 1100);

            setTimeout(resolve, 2200);
        });
    }

    function bloom() {
        calyx.classList.add('visible');
        ambientLight.classList.add('visible');
        roseHead.classList.add('blooming');
    }

    function spawnFallingPetal() {
        if (fallingPetalsEl.childElementCount > 25) return;

        const petal = document.createElement('div');
        petal.className = 'falling-petal';

        const w = 10 + Math.random() * 12;
        const h = w * (1.25 + Math.random() * 0.15);
        const x = 20 + Math.random() * 60;
        const y = 3 + Math.random() * 10;
        const dur = 5.5 + Math.random() * 3.5;
        const delay = Math.random() * 0.6;

        const colors = FALLING_PETAL_COLORS[Math.floor(Math.random() * FALLING_PETAL_COLORS.length)];

        const sign = () => (Math.random() > 0.5 ? 1 : -1);
        const s1 = sign() * (15 + Math.random() * 25);
        const s2 = sign() * (10 + Math.random() * 20);
        const s3 = sign() * (20 + Math.random() * 30);
        const s4 = sign() * (10 + Math.random() * 15);

        petal.style.left = `${x}vw`;
        petal.style.top = `${y}vh`;
        petal.style.setProperty('--fp-w', `${w}px`);
        petal.style.setProperty('--fp-h', `${h}px`);
        petal.style.setProperty('--fp-c1', colors[0]);
        petal.style.setProperty('--fp-c2', colors[1]);
        petal.style.setProperty('--f-dur', `${dur}s`);
        petal.style.setProperty('--f-delay', `${delay}s`);
        petal.style.setProperty('--s1', `${s1}px`);
        petal.style.setProperty('--s2', `${s2}px`);
        petal.style.setProperty('--s3', `${s3}px`);
        petal.style.setProperty('--s4', `${s4}px`);

        fallingPetalsEl.appendChild(petal);

        setTimeout(() => {
            if (petal.parentNode) petal.remove();
        }, (dur + delay) * 1000 + 300);
    }

    function spawnFloatingHeart() {
        if (fallingPetalsEl.childElementCount > 25) return;

        const heart = document.createElement('div');
        heart.className = 'floating-heart';

        const size = 10 + Math.random() * 14;
        const x = 20 + Math.random() * 60; // Concentrated around the center scene
        const y = 75 + Math.random() * 15; // Starts near the bottom-middle
        const dur = 4.5 + Math.random() * 2.5;
        const delay = Math.random() * 0.4;
        const drift = (Math.random() - 0.5) * 100;

        heart.innerHTML = `<svg viewBox="0 0 32 29.6" style="width: 100%; height: 100%;"><path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/></svg>`;

        heart.style.left = `${x}vw`;
        heart.style.top = `${y}vh`;
        heart.style.width = `${size}px`;
        heart.style.height = `${size}px`;
        heart.style.setProperty('--h-dur', `${dur}s`);
        heart.style.setProperty('--h-delay', `${delay}s`);
        heart.style.setProperty('--h-drift', `${drift}px`);

        fallingPetalsEl.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) heart.remove();
        }, (dur + delay) * 1000 + 300);
    }

    function startFallingPetals() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnFallingPetal(), i * 300);
        }
        for (let i = 0; i < 2; i++) {
            setTimeout(() => spawnFloatingHeart(), i * 500 + 200);
        }

        fallingPetalInterval = setInterval(() => {
            spawnFallingPetal();
        }, 2000);

        floatingHeartInterval = setInterval(() => {
            spawnFloatingHeart();
        }, 1600);
    }


    async function startAnimationSequence() {
        await growStem();
        await delay(100);
        bloom();

        setTimeout(() => {
            roseWrapper.classList.add('rotating');
        }, 2600);

        setTimeout(() => {
            startFallingPetals();
            musicToggle.classList.add('visible'); // Fade in music toggle
        }, 3400);

        setTimeout(() => {
            endText.classList.add('visible');
        }, 4600);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startButton.addEventListener('click', () => {
        triggerOverlay.classList.add('fade-out');
        
        try {
            synth.start();
        } catch (e) {
            console.error('Audio context could not start:', e);
        }

        setTimeout(() => {
            startAnimationSequence();
        }, 800);
    });

    // Music control toggle
    musicToggle.addEventListener('click', () => {
        const isMuted = synth.toggleMute();
        musicToggle.querySelector('.music-icon').textContent = isMuted ? '🔇' : '🔊';
        musicToggle.classList.toggle('muted', isMuted);
    });

    // --- Typewriter Animation System ---
    const letterContent = document.querySelector('.letter-content');
    const typableEls = letterContent.querySelectorAll('.letter-salutation, .letter-body, .letter-signature');
    const originalTexts = Array.from(typableEls).map(el => el.textContent);
    let typewriterTimeouts = [];
    let isTyping = false;

    function clearTypewriter() {
        typewriterTimeouts.forEach(id => clearTimeout(id));
        typewriterTimeouts = [];
        isTyping = false;
        typableEls.forEach(el => el.classList.remove('typing'));
    }

    function completeAllTyping() {
        clearTypewriter();
        typableEls.forEach((el, i) => {
            el.textContent = originalTexts[i];
            el.style.visibility = 'visible';
        });
    }

    function typeElement(el, text, speed, callback) {
        el.textContent = '';
        el.style.visibility = 'visible';
        el.classList.add('typing');
        let charIndex = 0;

        function typeChar() {
            if (!isTyping) return;
            if (charIndex < text.length) {
                el.textContent += text.charAt(charIndex);
                charIndex++;
                const id = setTimeout(typeChar, speed);
                typewriterTimeouts.push(id);
            } else {
                el.classList.remove('typing');
                if (callback) callback();
            }
        }
        typeChar();
    }

    function startTypewriter() {
        clearTypewriter();
        isTyping = true;

        // Hide all elements and clear text
        typableEls.forEach(el => {
            el.textContent = '';
            el.style.visibility = 'hidden';
        });

        const speeds = [55, 28, 55]; // salutation fast, body medium, signature fast
        let current = 0;

        function typeNext() {
            if (!isTyping || current >= typableEls.length) {
                isTyping = false;
                return;
            }
            const el = typableEls[current];
            const text = originalTexts[current];
            const speed = speeds[current] || 30;
            current++;
            // Small pause between elements
            const id = setTimeout(() => {
                typeElement(el, text, speed, typeNext);
            }, 300);
            typewriterTimeouts.push(id);
        }

        typeNext();
    }

    // Skip typing on click inside letter card
    letterContent.addEventListener('click', () => {
        if (isTyping) {
            completeAllTyping();
        }
    });

    // Love letter overlays
    letterBtn.addEventListener('click', () => {
        letterOverlay.classList.add('visible');
        // Start typewriter after the card scale-in transition
        const id = setTimeout(startTypewriter, 400);
        typewriterTimeouts.push(id);
    });

    function closeLetter() {
        letterOverlay.classList.remove('visible');
        clearTypewriter();
        // Restore original text so it's ready for next open
        typableEls.forEach((el, i) => {
            el.textContent = originalTexts[i];
            el.style.visibility = 'visible';
        });
    }

    closeLetterBtn.addEventListener('click', closeLetter);

    letterOverlay.addEventListener('click', (e) => {
        if (e.target === letterOverlay) {
            closeLetter();
        }
    });

    // Interactive mouse click sparkle particles
    window.addEventListener('click', (e) => {
        if (triggerOverlay.classList.contains('fade-out')) {
            if (e.target.closest('#musicToggle') || e.target.closest('#letterBtn') || e.target.closest('.letter-card')) {
                return;
            }
            createSparkleBurst(e.clientX, e.clientY);
        }
    });

    function createSparkleBurst(x, y) {
        const count = 10;
        const symbols = ['❤', '💖', '✨', '💕', '🌸'];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'sparkle-particle';
            el.textContent = symbols[Math.floor(Math.random() * symbols.length)];

            const size = 12 + Math.random() * 12;
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 70;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const dur = 0.8 + Math.random() * 0.6;

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.fontSize = `${size}px`;
            el.style.setProperty('--tx', `${tx}px`);
            el.style.setProperty('--ty', `${ty}px`);
            el.style.setProperty('--sp-dur', `${dur}s`);

            document.body.appendChild(el);

            setTimeout(() => {
                el.remove();
            }, dur * 1000);
        }
    }

    createSepals();
    createPetals();

    setTimeout(() => {
        startCardLoader();
    }, 400);

});
