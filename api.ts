//% color=#8932a8 icon="\uf028"
namespace sound {
    //% blockId=sound_create
    //% block="empty sound"
    //% blockSetVariable=mySound
    //% group=Create
    //% weight=100
    export function create(): Sound {
        return new Sound();
    }

    //% blockId=sound_addPart
    //% block="$sound add part $waveform freq $frequency volume $volume duration $duration|| end freq $endFrequency end volume $endVolume"
    //% waveform.shadow=sound__waveform
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% frequency.min=1
    //% frequency.max=20000
    //% frequency.defl=262
    //% volume.min=0
    //% volume.max=1024
    //% volume.defl=1024
    //% endFrequency.min=1
    //% endFrequency.max=20000
    //% endFrequency.defl=262
    //% endVolume.min=0
    //% endVolume.max=1024
    //% endVolume.defl=0
    //% duration.shadow=timePicker
    //% weight=90
    //% group=Create
    export function addPart(
        sound: Sound,
        waveform: number,
        frequency: number,
        volume: number,
        duration: number,
        endFrequency?: number,
        endVolume?: number,
    ) {
        sound.addPart(waveform, frequency, volume, duration, endFrequency, endVolume);
    }

    //% blockId=sound_moveTo
    //% block="$sound move to frequency $frequency volume $volume over $duration ms"
    //% inlineInputMode=inline
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% frequency.min=1
    //% frequency.max=20000
    //% frequency.defl=262
    //% volume.min=0
    //% volume.max=1024
    //% volume.defl=1024
    //% duration.shadow=timePicker
    //% weight=85
    //% group=Create
    export function moveTo(
        sound: Sound,
        frequency: number,
        volume: number,
        duration: number
    ) {
        if (sound.steps.length === 0) {
            throw "'move to' cannot be called on an empty sound";
        }
        const previous = sound.steps[sound.steps.length - 1];
        sound.addPart(
            previous.waveform,
            previous.endFrequency,
            previous.endVolume,
            duration,
            frequency,
            volume
        );
    }

    //% blockId=sound_duration
    //% block="$sound duration"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% group=Create
    //% weight=80
    export function duration(sound: Sound): number {
        return sound.duration();
    }

    //% blockId=sound_clone
    //% block="clone $sound"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% group=Create
    //% weight=70
    //% blockGap=8
    export function clone(sound: Sound): Sound {
        return sound.clone();
    }

    //% blockId=sound_slice
    //% block="slice $sound from $start ms||to $end ms"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% start.shadow=timePicker
    //% end.shadow=timePicker
    //% weight=60
    //% group=Create
    //% blockGap=8
    export function slice(sound: Sound, start: number, end?: number): Sound {
        return sound.slice(start, end);
    }

    //% blockId=sound_concat
    //% block="concatenate $a and $b"
    //% a.shadow=variables_get
    //% a.defl=mySound
    //% b.shadow=variables_get
    //% b.defl=otherSound
    //% weight=50
    //% group=Create
    export function concat(a: Sound, b: Sound) {
        return new Sound(a.clone().steps.concat(b.clone().steps));
    }

    //% shim=TD_ID
    //% blockId=sound__waveform
    //% block="$waveform"
    //% weight=0
    //% group=Create
    export function _waveform(waveform: Waveform): number {
        return waveform;
    }

    //% blockId=sound_play
    //% block="play $sound and pause until done $pauseUntilDone||at volume $volume"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% volume.min=0
    //% volume.max=1024
    //% weight=80
    //% group=Playback
    //% blockGap=8
    export function play(
        sound: Sound,
        pauseUntilDone: boolean,
        volume?: number
    ) {
        sound.play(volume);
        if (pauseUntilDone) {
            pause(sound.duration());
        }
    }

    //% blockId=sound_playPitched
    //% block="play $sound pitched up by $frequencyScale and pause until done $pauseUntilDone||at volume $volume"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% frequencyScale.shadow=sound_semitoneScaleFactor
    //% volume.min=0
    //% volume.max=1024
    //% weight=70
    //% group=Playback
    export function playPitched(
        sound: Sound,
        frequencyScale: number,
        pauseUntilDone: boolean,
        volume?: number
    ) {
        sound.playPitched(Math.max(0, frequencyScale), volume);
        if (pauseUntilDone) {
            pause(sound.duration());
        }
    }

    //% blockId=sound_scaleVolume
    //% block="$sound scale volume by $percent \\%"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% percent.min=0
    //% percent.defl=50
    //% group=Operations
    //% weight=130
    //% blockGap=8
    export function scaleVolume(sound: Sound, percent: number) {
        sound.scaleVolume(Math.max(percent, 0) / 100);
    }

    //% blockId=sound_scalePitch
    //% block="$sound pitch up by $frequencyScale"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% frequencyScale.shadow=sound_semitoneScaleFactor
    //% group=Operations
    //% weight=120
    //% blockGap=8
    export function scalePitch(sound: Sound, frequencyScale: number) {
        sound.scalePitch(Math.max(frequencyScale, 0));
    }

    //% blockId=sound_scaleDuration
    //% block="$sound scale duration by $percent \\%"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% percent.min=0
    //% percent.defl=50
    //% group=Operations
    //% weight=110
    export function scaleDuration(sound: Sound, percent: number) {
        sound.scaleDuration(Math.max(percent, 0) / 100);
    }

    //% blockId=sound_reverse
    //% block="reverse $sound"
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% group=Operations
    //% weight=105
    export function reverse(sound: Sound) {
        sound.reverse();
    }

    //% blockId=sound_applyVolumeModulation
    //% block="mod $sound volume by $modulation with strength $percent \\%||after $delay ms"
    //% inlineInputMode=inline
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% modulation.shadow=variables_get
    //% modulation.defl=myModulation
    //% percent.min=0
    //% percent.max=100
    //% percent.defl=100
    //% delay.shadow=timePicker
    //% group=Modulation
    //% weight=100
    //% blockGap=8
    export function applyVolumeModulation(sound: Sound, modulation: Modulation, percent: number, delay?: number) {
        const modulated = doVolumeModulation(sound, modulation, Math.constrain(percent, 0, 100) / 100, delay);
        sound.steps = modulated.steps;
    }

    //% blockId=sound_applyFrequencyModulation
    //% block="mod $sound frequency by $modulation with amount $frequencyScale||after $delay ms"
    //% inlineInputMode=inline
    //% sound.shadow=variables_get
    //% sound.defl=mySound
    //% modulation.shadow=variables_get
    //% modulation.defl=myModulation
    //% frequencyScale.shadow=sound_semitoneScaleFactor
    //% delay.shadow=timePicker
    //% group=Modulation
    //% weight=90
    export function applyFrequencyModulation(sound: Sound, modulation: Modulation, frequencyScale: number, delay?: number) {
        const modulated = doFrequencyModulation(sound, modulation, frequencyScale, delay);
        sound.steps = modulated.steps;
    }

    //% blockId=sound_createLFO
    //% block="$waveform LFO with period $period||phase $phase"
    //% blockSetVariable=myModulation
    //% inlineInputMode=inline
    //% waveform.shadow=sound__lfoWaveform
    //% period.shadow=timePicker
    //% period.defl=500
    //% group=Modulation
    //% weight=80
    //% blockGap=8
    export function createLFO(waveform: number, period: number, phase?: number): Modulation {
        return new sound.LFO(waveform, Math.max(period, 1), phase || 0);
    }

    //% blockId=sound_createADSR
    //% block="ADSR envelope attack $attack decay $decay sustain $sustain \\% release $release gate length $gateLength"
    //% blockSetVariable=myModulation
    //% inlineInputMode=inline
    //% attack.shadow=timePicker
    //% decay.shadow=timePicker
    //% sustain.min=0
    //% sustain.max=100
    //% sustain.defl=50
    //% release.shadow=timePicker
    //% gateLength.shadow=timePicker
    //% group=Modulation
    //% weight=70
    //% blockGap=8
    export function createADSR(attack: number, decay: number, sustain: number, release: number, gateLength: number): Modulation {
        return new sound.ADSREnvelope(attack, decay, Math.constrain(sustain, 0, 100) / 100, release, gateLength);
    }

    //% blockId=sound_createAR
    //% blockSetVariable=myModulation
    //% block="AR envelope attack $attack release $release sustain||loop $loop"
    //% inlineInputMode=inline
    //% attack.shadow=timePicker
    //% release.shadow=timePicker
    //% group=Modulation
    //% weight=60
    export function createAR(attack: number, release: number, loop?: boolean): Modulation {
        return new sound.AREnvelope(attack, release, !!loop);
    }

    //% shim=TD_ID
    //% blockId=sound__lfoWaveform
    //% block="$waveform"
    //% group=Modulation
    //% weight=50
    //% blockGap=8
    //% blockHidden=1
    export function _lfoWaveform(waveform: LFOWaveform): number {
        return waveform;
    }

    //% blockId=sound_semitoneScaleFactor
    //% block="$semitones semitones"
    //% group=Operations
    //% weight=40
    export function semitoneScaleFactor(semitones: number) {
        return Math.pow(2, semitones / 12)
    }

    //% blockId=sound_convertEffectToSound
    //% block="convert $effect to sound"
    //% effect.shadow=soundExpression_createSoundEffect
    //% group=Convert
    export function convertEffectToSound(effect: music.SoundEffect) {
        return bufferToSound(effect.toBuffer(music.volume()));
    }
}