namespace sound {
    export enum Waveform {
        //% blockIdentity="sound._waveform"
        Triangle = 1,
        //% blockIdentity="sound._waveform"
        Sawtooth = 2,
        //% blockIdentity="sound._waveform"
        Sine = 3,
        //% blockIdentity="sound._waveform"
        Square = 15,
        //% blockIdentity="sound._waveform"
        WhiteNoise = 5,
        //% blockIdentity="sound._waveform"
        TunableNoise = 4,
        //% blockIdentity="sound._waveform"
        Pulse10 = 11,
        //% blockIdentity="sound._waveform"
        Pulse20 = 12,
        //% blockIdentity="sound._waveform"
        Pulse30 = 13,
        //% blockIdentity="sound._waveform"
        Pulse40 = 14,
        //% blockIdentity="sound._waveform"
        Cycle16 = 16,
        //% blockIdentity="sound._waveform"
        Cycle32 = 17,
        //% blockIdentity="sound._waveform"
        Cycle48 = 18,
        //% blockIdentity="sound._waveform"
        Silence = 0
    }

    export class Instruction {
        data: Buffer;

        constructor(
            waveform: Waveform,
            frequency: number,
            volume: number,
            duration: number,
            endFrequency?: number,
            endVolume?: number,
        ) {
            this.data = control.createBuffer(12);
            endFrequency = (endFrequency === undefined) ? frequency : endFrequency;
            endVolume = (endVolume === undefined) ? volume : endVolume;

            music.addNote(
                this.data,
                0,
                duration,
                volume,
                endVolume,
                waveform,
                frequency,
                64,
                endFrequency
            );
        }

        get waveform(): Waveform {
            return this.data[0];
        }

        set waveform(value: Waveform) {
            this.data[0] = value;
        }

        get frequency(): number {
            return this.data.getNumber(NumberFormat.UInt16LE, 2);
        }

        set frequency(value: number) {
            this.data.setNumber(NumberFormat.UInt16LE, 2, value);
        }

        get duration(): number {
            return this.data.getNumber(NumberFormat.UInt16LE, 4);
        }

        set duration(value: number) {
            this.data.setNumber(NumberFormat.UInt16LE, 4, value);
        }

        get volume(): number {
            return this.data.getNumber(NumberFormat.UInt16LE, 6);
        }

        set volume(value: number) {
            this.data.setNumber(NumberFormat.UInt16LE, 6, value);
        }

        get endVolume(): number {
            return this.data.getNumber(NumberFormat.UInt16LE, 8);
        }

        set endVolume(value: number) {
            this.data.setNumber(NumberFormat.UInt16LE, 8, value);
        }

        get endFrequency(): number {
            return this.data.getNumber(NumberFormat.UInt16LE, 10);
        }

        set endFrequency(value: number) {
            this.data.setNumber(NumberFormat.UInt16LE, 10, value);
        }
    }

    export class Sound {
        steps: Instruction[];

        constructor(steps?: Instruction[]) {
            this.steps = steps || [];
        }

        render(volume: number, frequencyScale: number): Buffer {
            if (this.steps.length === 0) {
                return undefined;
            }
            const buffer = control.createBuffer(12 * this.steps.length);

            for (let i = 0; i < this.steps.length; i++) {
                const part = this.steps[i];

                music.addNote(
                    buffer,
                    i * 12,
                    part.duration,
                    part.volume,
                    part.endVolume,
                    part.waveform,
                    part.frequency * frequencyScale,
                    volume,
                    part.endFrequency * frequencyScale
                );
            }

            return buffer;
        }

        play(volume?: number) {
            if (volume === undefined) {
                volume = music.volume();
            }
            music.playInstructions(
                0,
                this.render(volume, 1)
            );
        }

        playPitched(pitchScale: number, volume?: number) {
            if (volume === undefined) {
                volume = music.volume();
            }
            music.playInstructions(
                0,
                this.render(volume, pitchScale)
            );
        }

        duration() {
            let sum = 0;
            for (const step of this.steps) {
                sum += step.duration;
            }
            return sum;
        }

        addInstruction(instr: Instruction) {
            this.steps.push(instr);
        }

        addPart(
            waveform: number,
            frequency: number,
            volume: number,
            duration: number,
            endFrequency?: number,
            endVolume?: number,
        ) {
            this.steps.push(
                new Instruction(
                    waveform,
                    frequency,
                    volume,
                    duration,
                    endFrequency,
                    endVolume
                )
            );
        }

        clone() {
            return new Sound(
                this.steps.map(s =>
                    new Instruction(
                        s.waveform,
                        s.frequency,
                        s.volume,
                        s.duration,
                        s.endFrequency,
                        s.endVolume
                    )
                )
            );
        }

        slice(start: number, end?: number) {
            if (end == undefined) {
                end = this.duration();
            }

            end = Math.constrain(end, 0, this.duration());
            start = Math.constrain(start, 0, this.duration());

            if (end <= start) {
                // empty
                return new Sound();
            }

            const out = new Sound();
            const iter = new SoundIterator(this);

            while (iter.currentStepEnd() < start) {
                iter.advance();
            }

            let currentTime = start;

            while (currentTime < end) {
                const nextTime = Math.min(iter.currentStepEnd(), end);
                out.addPart(
                    iter.currentWaveform(),
                    iter.frequencyAtTime(currentTime),
                    iter.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    iter.frequencyAtTime(nextTime),
                    iter.volumeAtTime(nextTime)
                );
                currentTime = nextTime;
                iter.advance();
            }

            return out;
        }

        scalePitch(scaleFactor: number) {
            for (const step of this.steps) {
                step.frequency *= scaleFactor;
                step.endFrequency *= scaleFactor;
            }
        }

        scaleVolume(scaleFactor: number) {
            for (const step of this.steps) {
                step.volume *= scaleFactor;
                step.endVolume *= scaleFactor;
            }
        }

        scaleDuration(scaleFactor: number) {
            for (const step of this.steps) {
                step.duration *= scaleFactor;
            }
        }

        reverse() {
            const newSteps: Instruction[] = [];
            for (let i = this.steps.length - 1; i >= 0; i--) {
                const old = this.steps[i];
                newSteps.push(
                    new Instruction(
                        old.waveform,
                        old.endFrequency,
                        old.endVolume,
                        old.duration,
                        old.frequency,
                        old.volume
                    )
                );
            }
            this.steps = newSteps;
        }
    }

    export function linearValueAtTime(elapsed: number, duration: number, start: number, end: number) {
        return start + (end - start) * Math.constrain(elapsed / duration, 0, 1);
    }

    export function printInstruction(instr: Instruction) {
        console.log(`${instr.waveform} dur=${instr.duration} freq=(${instr.frequency}, ${instr.endFrequency}) vol=(${instr.volume}, ${instr.endVolume})`)
    }

    export class SoundIterator {
        index: number;
        currentTime: number;

        constructor(public sound: Sound) {
            this.index = 0;
            this.currentTime = 0;
        }

        advance() {
            if (this.isFinished()) {
                return;
            }

            this.currentTime += this.currentStep().duration;
            this.index++;
        }

        currentStepEnd() {
            if (this.isFinished()) return Infinity;

            return this.currentTime + this.currentStep().duration;
        }

        currentStep() {
            return this.sound.steps[this.index];
        }

        currentWaveform() {
            if (this.isFinished()) {
                return -1;
            }
            return this.currentStep().waveform;
        }

        frequencyAtTime(time: number) {
            if (this.isFinished()) {
                return -1;
            }

            const step = this.currentStep();
            return linearValueAtTime(
                time - this.currentTime,
                step.duration,
                step.frequency,
                step.endFrequency
            )
        }

        volumeAtTime(time: number) {
            if (this.isFinished()) {
                return -1;
            }
            const step = this.currentStep();
            return linearValueAtTime(
                time - this.currentTime,
                step.duration,
                step.volume,
                step.endVolume
            )
        }

        isFinished() {
            return this.index > this.sound.steps.length - 1
        }
    }

    export type Operation = (a: number, b: number) => number;

    export function applySound(a: Sound, b: Sound, freqOp: Operation, volumeOp: Operation, waveOp: Operation) {
        const iterA = new SoundIterator(a);
        const iterB = new SoundIterator(b);

        const out = new Sound();
        let currentTime = 0;

        while (!(iterA.isFinished() && iterB.isFinished())) {
            if (iterA.currentStepEnd() === iterB.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    waveOp(iterA.currentWaveform(), iterB.currentWaveform()),
                    freqOp(iterA.frequencyAtTime(currentTime), iterB.frequencyAtTime(currentTime)),
                    volumeOp(iterA.volumeAtTime(currentTime), iterB.volumeAtTime(currentTime)),
                    nextTime - currentTime,
                    freqOp(iterA.currentStep().endFrequency, iterB.currentStep().endFrequency),
                    volumeOp(iterA.currentStep().endVolume, iterB.currentStep().endVolume)
                );
                iterA.advance();
                iterB.advance();
                currentTime = nextTime;
            }
            else if (iterA.currentStepEnd() < iterB.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    waveOp(iterA.currentStep().waveform, iterB.currentStep().waveform),
                    freqOp(iterA.frequencyAtTime(currentTime), iterB.frequencyAtTime(currentTime)),
                    volumeOp(iterA.volumeAtTime(currentTime), iterB.volumeAtTime(currentTime)),
                    nextTime - currentTime,
                    freqOp(iterA.currentStep().endFrequency, iterB.frequencyAtTime(nextTime)),
                    volumeOp(iterA.currentStep().endVolume, iterB.volumeAtTime(nextTime))
                );

                iterA.advance();
                currentTime = nextTime;
            }
            else {
                const nextTime = iterB.currentStepEnd();

                out.addPart(
                    waveOp(iterA.currentStep().waveform, iterB.currentStep().waveform),
                    freqOp(iterA.frequencyAtTime(currentTime), iterB.frequencyAtTime(currentTime)),
                    volumeOp(iterA.volumeAtTime(currentTime), iterB.volumeAtTime(currentTime)),
                    nextTime - currentTime,
                    freqOp(iterA.frequencyAtTime(nextTime), iterB.currentStep().endFrequency),
                    volumeOp(iterA.volumeAtTime(nextTime), iterB.currentStep().endVolume)
                );

                iterB.advance();
                currentTime = nextTime;
            }
        }

        return out;
    }

    export function bufferToSound(buf: Buffer) {
        const out = new Sound();
        for (let i = 0; i < buf.length; i += 12) {
            out.addPart(
                buf[i],
                buf.getNumber(NumberFormat.UInt16LE, i + 2),
                buf.getNumber(NumberFormat.UInt16LE, i + 6),
                buf.getNumber(NumberFormat.UInt16LE, i + 4),
                buf.getNumber(NumberFormat.UInt16LE, i + 10),
                buf.getNumber(NumberFormat.UInt16LE, i + 8)
            )
        }

        return out;
    }
}
