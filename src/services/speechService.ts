/**
 * Speech synthesis service using the Web Speech API
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;
let isPaused = false;

export async function speakText(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis is not supported in this browser'));
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    isPaused = false;

    // Clean the text for better speech output
    const cleanText = cleanTextForSpeech(text);

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Configure speech settings
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.8; // Slightly reduced volume

    // Try to use a high-quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Enhanced') || voice.name.includes('Premium') || voice.name.includes('Natural'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set up event handlers
    utterance.onend = () => {
      currentUtterance = null;
      isPaused = false;
      resolve();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      isPaused = false;
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    utterance.onstart = () => {
      console.log('Speech synthesis started');
    };

    utterance.onpause = () => {
      console.log('Speech synthesis paused');
    };

    utterance.onresume = () => {
      console.log('Speech synthesis resumed');
    };

    // Handle the case where voices aren't loaded yet
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const voice = updatedVoices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Enhanced') || v.name.includes('Premium') || v.name.includes('Natural'))
        ) || updatedVoices.find(v => v.lang.startsWith('en')) || updatedVoices[0];
        
        if (voice) {
          utterance.voice = voice;
        }
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
      };
    } else {
      // Start speaking immediately
      window.speechSynthesis.speak(utterance);
    }
  });
}

/**
 * Stop any ongoing speech synthesis
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
    isPaused = false;
  }
}

/**
 * Pause the current speech synthesis
 */
export function pauseSpeaking(): void {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    isPaused = true;
  }
}

/**
 * Resume the paused speech synthesis
 */
export function resumeSpeaking(): void {
  if ('speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    isPaused = false;
  }
}

/**
 * Check if speech is currently playing
 */
export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

/**
 * Check if speech is currently paused
 */
export function isSpeechPaused(): boolean {
  return isPaused && 'speechSynthesis' in window && window.speechSynthesis.paused;
}

/**
 * Clean text for better speech synthesis output
 */
function cleanTextForSpeech(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/#{1,6}\s*/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
    // Remove special characters that don't read well
    .replace(/[#*`_]/g, '')
    // Replace bullet points and numbers with spoken equivalents
    .replace(/^[\s]*•[\s]*/gm, 'Point: ')
    .replace(/^[\s]*-[\s]*/gm, 'Point: ')
    .replace(/^[\s]*\d+\.[\s]*/gm, (match) => {
      const num = match.match(/\d+/)?.[0];
      return `Number ${num}. `;
    })
    // Add pauses for better flow
    .replace(/\n\s*\n/g, '. ') // Double line breaks become periods
    .replace(/\n/g, ', ') // Single line breaks become commas
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if speech synthesis is available and working
 */
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}