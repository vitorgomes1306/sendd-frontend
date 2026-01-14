import sound1 from '../assets/sounds/sound1.mp3';
import sound2 from '../assets/sounds/sound2.mp3';
import sound3 from '../assets/sounds/sound3.mp3';

// Mapa de sons disponíveis
// Nota: Os arquivos devem existir em src/assets/sounds
// O usuário deve adicionar sound1.mp3, sound2.mp3, sound3.mp3 lá.
const SOUND_MAP = {
    'default': 'synth',
    'sound1': sound1,
    'sound2': sound2,
    'sound3': sound3
};

const playSynthBeep = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime); // 500Hz
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Erro ao tocar synth:', e);
    }
};

export const playNotificationSound = (soundName = 'default') => {
    // Se for default ou não encontrar, toca synth
    if (soundName === 'default' || !SOUND_MAP[soundName]) {
        playSynthBeep();
        return;
    }

    // Se for arquivo mp3
    try {
        const audio = new Audio(SOUND_MAP[soundName]);
        audio.play().catch(err => console.error('Erro ao tocar som:', err));
    } catch (e) {
        console.error('Erro ao instanciar Audio:', e);
        playSynthBeep(); // Fallback
    }
};

export const AVAILABLE_SOUNDS = [
    { id: 'default', label: 'Padrão (Beep)' },
    { id: 'sound1', label: 'Opção 1 (MP3)' },
    { id: 'sound2', label: 'Opção 2 (MP3)' },
    { id: 'sound3', label: 'Opção 3 (MP3)' }
];
