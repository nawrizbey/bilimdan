import { useAppStore } from '../store/useAppStore';

export function speak(text: string) {
  if (!useAppStore.getState().settings.head) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Web Speech API unavailable; silently ignore.
  }
}
