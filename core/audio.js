(function () {
  "use strict";

  const SOUND_VOLUME_STORAGE_KEY = "yokoshoot.soundVolumes.v1";
  const SOUND_VOLUME_DEFAULTS = {
    master: 1,
    knife: 1,
    enemyReturn: 1,
    bossSmash: 1,
    robotSpin: 1,
    schoolTool: 1,
    shinaiThrow: 1,
    swordWave: 1,
    droneTurn: 1,
    droneLoop: 1,
    lifeRecovery: 1,
    chargeComplete: 1,
    dashLaunch: 1,
    dashVoice: 1,
    hurtVoice: 1,
    voiceBright: 1,
  };

  function createAudioSystem(options) {
    const {
      windowRef,
      getState,
      isDroneEnemy,
      width,
      droneLoopBaseVolume,
      clamp,
    } = options;
    const AudioContextClass = windowRef.AudioContext || windowRef.webkitAudioContext;
    let audioContext = null;
    const droneLoops = new Map();

    function ensureAudioContext() {
      if (!AudioContextClass) return null;
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      return audioContext;
    }

    function getSoundVolumes() {
      try {
        const saved = JSON.parse(windowRef.localStorage.getItem(SOUND_VOLUME_STORAGE_KEY) || "{}");
        return { ...SOUND_VOLUME_DEFAULTS, ...saved };
      } catch (error) {
        return SOUND_VOLUME_DEFAULTS;
      }
    }

    function soundVolume(kind) {
      const volumes = getSoundVolumes();
      const master = Number.isFinite(volumes.master) ? volumes.master : 1;
      const value = Number.isFinite(volumes[kind]) ? volumes[kind] : 1;
      return clamp(master, 0, 2) * clamp(value, 0, 2);
    }

    function scaleSoundVolume(kind, volume) {
      return volume * soundVolume(kind);
    }

    function playShotSound(kind) {
      const audio = ensureAudioContext();
      if (!audio) return;

      if (kind === "knife") {
        playNoiseHit(audio, 0.11, 0.08, "highpass", 1800, scaleSoundVolume(kind, 0.13));
        playToneSweep(audio, 0.12, 340, 1260, scaleSoundVolume(kind, 0.06), "triangle");
        windowRef.setTimeout(() => playNoiseHit(audio, 0.06, 0.035, "bandpass", 3600, scaleSoundVolume(kind, 0.055)), 36);
      } else if (kind === "bossSmash") {
        playNoiseHit(audio, 0.16, 0.12, "bandpass", 720, scaleSoundVolume(kind, 0.2));
        playToneSweep(audio, 0.14, 170, 86, scaleSoundVolume(kind, 0.11), "sine");
      } else if (kind === "robotSpin") {
        playNoiseHit(audio, 0.22, 0.18, "bandpass", 420, scaleSoundVolume(kind, 0.08));
        playToneSweep(audio, 0.18, 110, 280, scaleSoundVolume(kind, 0.045), "square");
      } else if (kind === "schoolTool") {
        playNoiseHit(audio, 0.08, 0.055, "highpass", 2100, scaleSoundVolume(kind, 0.09));
        playToneSweep(audio, 0.09, 620, 260, scaleSoundVolume(kind, 0.045), "triangle");
      } else if (kind === "shinaiThrow") {
        playNoiseHit(audio, 0.12, 0.09, "bandpass", 980, scaleSoundVolume(kind, 0.11));
        playToneSweep(audio, 0.1, 360, 150, scaleSoundVolume(kind, 0.04), "sawtooth");
      } else if (kind === "swordWave") {
        playNoiseHit(audio, 0.14, 0.1, "highpass", 1400, scaleSoundVolume(kind, 0.13));
        playToneSweep(audio, 0.13, 520, 130, scaleSoundVolume(kind, 0.07), "sawtooth");
      } else {
        playNoiseHit(audio, 0.1, 0.085, "bandpass", 1150, scaleSoundVolume("enemyReturn", 0.12));
        playToneSweep(audio, 0.08, 260, 160, scaleSoundVolume("enemyReturn", 0.055), "sine");
      }
    }

    function playNoiseHit(audio, duration, decay, filterType, frequency, volume) {
      const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
      const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i += 1) data[i] = Math.random() * 2 - 1;

      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      const now = audio.currentTime;
      filter.type = filterType;
      filter.frequency.setValueAtTime(frequency, now);
      filter.Q.setValueAtTime(2.1, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);
      source.start(now);
      source.stop(now + duration);
    }

    function playToneSweep(audio, duration, startFrequency, endFrequency, volume, type) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    function playDroneTurnSound() {
      const audio = ensureAudioContext();
      if (!audio) return;
      playNoiseHit(audio, 0.18, 0.12, "highpass", 2800, scaleSoundVolume("droneTurn", 0.11));
      playToneSweep(audio, 0.14, 520, 980, scaleSoundVolume("droneTurn", 0.035), "sawtooth");
    }

    function playLifeRecoverySound() {
      const audio = ensureAudioContext();
      if (!audio) return;
      playNoiseHit(audio, 0.16, 0.12, "bandpass", 760, scaleSoundVolume("lifeRecovery", 0.055));
      playToneSweep(audio, 0.18, 210, 310, scaleSoundVolume("lifeRecovery", 0.045), "sine");
      windowRef.setTimeout(() => playToneSweep(audio, 0.12, 440, 720, scaleSoundVolume("lifeRecovery", 0.035), "triangle"), 110);
    }

    function updateDroneLoopSound() {
      const audio = ensureAudioContext();
      if (!audio) return;
      const state = getState();
      const now = audio.currentTime;
      const activeDroneIds = new Set();
      for (const enemy of state.enemies) {
        if (!isDroneEnemy(enemy)) continue;
        activeDroneIds.add(enemy.id);
        if (!droneLoops.has(enemy.id)) droneLoops.set(enemy.id, createDroneLoop(audio, enemy.id));
        const loop = droneLoops.get(enemy.id);
        const volume = droneLoopVolume(enemy);
        loop.stopping = false;
        loop.gain.gain.cancelScheduledValues(now);
        loop.gain.gain.setTargetAtTime(volume, now, 0.08);
        loop.filter.frequency.setTargetAtTime(260 + (enemy.id % 5) * 18, now, 0.12);
        loop.oscillator.frequency.setTargetAtTime(96 + (enemy.id % 4) * 7, now, 0.12);
      }
      for (const [id, loop] of droneLoops) {
        if (activeDroneIds.has(id)) continue;
        scheduleDroneLoopStop(id, loop, now);
      }
    }

    function fadeOutDroneLoopSound() {
      if (!audioContext) return;
      const now = audioContext.currentTime;
      for (const [id, loop] of droneLoops) {
        scheduleDroneLoopStop(id, loop, now);
      }
    }

    function scheduleDroneLoopStop(id, loop, now) {
      if (loop.stopping) return;
      loop.stopping = true;
      fadeDroneLoop(loop, now, 0.12);
      windowRef.setTimeout(() => stopDroneLoop(id), 450);
    }

    function fadeDroneLoop(loop, now, timeConstant) {
      loop.gain.gain.cancelScheduledValues(now);
      loop.gain.gain.setTargetAtTime(0.0001, now, timeConstant);
    }

    function droneLoopVolume(enemy) {
      const state = getState();
      const distanceToRin = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
      const baseVolume = droneLoopBaseVolume * soundVolume("droneLoop");
      if (distanceToRin >= width / 2) return baseVolume * 0.3;
      const closeness = 1 - distanceToRin / (width / 2);
      return baseVolume * (0.3 + closeness * 0.7);
    }

    function stopDroneLoop(id) {
      const loop = droneLoops.get(id);
      if (!loop) return;
      const now = audioContext ? audioContext.currentTime : 0;
      try {
        loop.noise.stop(now);
        loop.oscillator.stop(now);
      } catch (error) {
        // The node may already have been stopped by a previous cleanup tick.
      }
      droneLoops.delete(id);
    }

    function createDroneLoop(audio, seed) {
      const sampleCount = Math.floor(audio.sampleRate * 1.2);
      const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i += 1) data[i] = Math.random() * 2 - 1;

      const noise = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      const oscillator = audio.createOscillator();
      const oscillatorGain = audio.createGain();
      const now = audio.currentTime;
      noise.buffer = buffer;
      noise.loop = true;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(260 + (seed % 5) * 18, now);
      filter.Q.setValueAtTime(1.4, now);
      gain.gain.setValueAtTime(0.0001, now);
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(96 + (seed % 4) * 7, now);
      oscillatorGain.gain.setValueAtTime(scaleSoundVolume("droneLoop", 0.014), now);
      noise.connect(filter);
      filter.connect(gain);
      oscillator.connect(oscillatorGain);
      oscillatorGain.connect(gain);
      gain.connect(audio.destination);
      noise.start(now);
      oscillator.start(now);
      return { noise, oscillator, filter, gain, stopping: false };
    }

    function playChargeCompleteSound() {
      const audio = ensureAudioContext();
      if (!audio) return;
      playNoiseHit(audio, 0.34, 0.28, "bandpass", 900, scaleSoundVolume("chargeComplete", 0.055));
      playToneSweep(audio, 0.38, 220, 980, scaleSoundVolume("chargeComplete", 0.07), "sawtooth");
      windowRef.setTimeout(() => playToneSweep(audio, 0.2, 620, 1480, scaleSoundVolume("chargeComplete", 0.045), "triangle"), 130);
      windowRef.setTimeout(() => playNoiseHit(audio, 0.16, 0.08, "highpass", 2600, scaleSoundVolume("chargeComplete", 0.04)), 260);
    }

    function playDashLaunchSound() {
      playVoiceLine("ハッ", "cool", "dashVoice");
      windowRef.setTimeout(() => {
        const audio = ensureAudioContext();
        if (!audio) return;
        playNoiseHit(audio, 0.18, 0.13, "lowpass", 260, scaleSoundVolume("dashLaunch", 0.22));
        playToneSweep(audio, 0.16, 95, 48, scaleSoundVolume("dashLaunch", 0.16), "sine");
      }, 75);
    }

    function playVoiceLine(text, voiceStyle, volumeKind = null) {
      if (!("speechSynthesis" in windowRef) || !("SpeechSynthesisUtterance" in windowRef)) return;
      windowRef.speechSynthesis.cancel();
      const utterance = new windowRef.SpeechSynthesisUtterance(text);
      const voices = windowRef.speechSynthesis.getVoices();
      const japaneseVoice =
        voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ja")) || voices[0];
      if (japaneseVoice) utterance.voice = japaneseVoice;
      utterance.lang = "ja-JP";
      const kind = volumeKind || (voiceStyle === "cool" ? "hurtVoice" : "voiceBright");
      utterance.volume = Math.min(1, scaleSoundVolume(kind, voiceStyle === "cool" ? 0.62 : 0.82));
      utterance.rate = voiceStyle === "cool" ? 1.12 : 1.08;
      utterance.pitch = voiceStyle === "cool" ? 0.82 : 1.18;
      windowRef.speechSynthesis.speak(utterance);
    }

    return {
      ensureAudioContext,
      playShotSound,
      playDroneTurnSound,
      playLifeRecoverySound,
      updateDroneLoopSound,
      fadeOutDroneLoopSound,
      playChargeCompleteSound,
      playDashLaunchSound,
      playVoiceLine,
    };
  }

  window.YOKOSHOOT_AUDIO = {
    createAudioSystem,
  };
})();
