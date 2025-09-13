namespace sound {
    export enum LFOWaveform {
        //% blockIdentity="sound._lfoWaveform"
        Square,
        //% blockIdentity="sound._lfoWaveform"
        Triangle,
        //% blockIdentity="sound._lfoWaveform"
        Sawtooth,
        //% blockIdentity="sound._lfoWaveform"
        Ramp,
    }

    export class Modulation {
        currentTime = 0;
        currentStep = 0;

        constructor() {

        }
       // resets the current time and step of the instruction dounds
        reset() {
            this.currentTime = 0;
            this.currentStep = 0;
        }

        getValueAtTime(time: number): number {
            return 0;
        }

        currentStepEnd() {
            return Infinity;
        }

        advance() {
            this.currentTime = this.currentStepEnd();
            this.currentStep++;
        }
    }

    export class ADSREnvelope extends Modulation {
        constructor(
            public attack: number,
            public decay: number,
            public sustain: number,
            public release: number,
            public gateLength: number
        ) {
            super();
        }

        getValueAtTime(
            time: number
        ): number {
            if (time > this.gateLength) {
                return linearValueAtTime(time - this.gateLength, this.release, this.getValueAtTime(this.gateLength), 0);
            }
            else if (time <= this.attack) {
                return linearValueAtTime(time, this.attack, 0, 1);
            }
            else if (time <= this.attack + this.decay) {
                return linearValueAtTime(time - this.attack, this.decay, 1, this.sustain);
            }
            else {
                return this.sustain;
            }
        }

        advance() {
            const nextTime = this.currentStepEnd();
            if (nextTime === this.gateLength) {
                this.currentStep = 3;
            }
            else {
                this.currentStep++;
            }
            this.currentTime = nextTime;
        }

        currentStepEnd() {
            if (this.currentStep === 0) {
                if (this.attack < this.gateLength) {
                    return this.attack;
                }
                else {
                    return this.gateLength;
                }
            }
            else if (this.currentStep === 1) {
                if (this.currentTime + this.decay < this.gateLength) {
                    return this.currentTime + this.decay;
                }
                else {
                    return this.gateLength
                }
            }
            else if (this.currentStep === 2) {
                return this.gateLength;
            }
            else if (this.currentStep === 3) {
                return this.gateLength + this.release;
            }

            return Infinity;
        }
    }

    export class AREnvelope extends Modulation {
        constructor(
            public attack: number,
            public release: number,
            public loop: boolean
        ) {
            super();
        }

        getValueAtTime(time: number) {
            if (this.loop) {
                time = time % (this.attack + this.release);
            }

            if (time < this.attack) {
                return linearValueAtTime(time, this.attack, 0, 1);
            }
            else if (time < this.attack + this.release) {
                return linearValueAtTime(time - this.attack, this.release, 1, 0);
            }

            return 0;
        }

        currentStepEnd() {
            if (this.loop) {
                if (this.currentStep & 1) {
                    return (this.currentStep >> 1) * (this.attack + this.release) + this.attack + this.release
                }
                else {
                    return (this.currentStep >> 1) * (this.attack + this.release) + this.attack
                }
            }
            if (this.currentStep === 0) {
                return this.attack;
            }
            else if (this.currentStep === 1) {
                return this.attack + this.release;
            }
            return Infinity;
        }
    }

    export class LFO extends Modulation {
        constructor(
            public waveform: LFOWaveform,
            public period: number,
            public phase: number
        ) {
            super();
        }

        getValueAtTime(time: number) {
            const startPhase = (this.phase / (Math.PI * 2)) % 1;

            if (this.isSingleCycle()) {
                const startTime = (this.currentStep - startPhase) * this.period;
                const progress = Math.min((time - startTime) / this.period, 1);

                if (this.waveform === LFOWaveform.Ramp) {
                    return progress;
                }
                return 1 - progress;
            }
            else if (this.waveform === LFOWaveform.Square) {
                return startPhase < 0.5 ? ((this.currentStep & 1) ? 1 : 0) : ((this.currentStep & 1) ? 0 : 1)
            }
            else if (this.waveform === LFOWaveform.Triangle) {
                const startTime = ((this.currentStep / 2) - (startPhase % 0.5)) * this.period;
                const progress = Math.min((time - startTime) / (this.period / 2), 1);

                if (startPhase < 0.5) {
                    if (this.currentStep & 1) {
                        return progress;
                    }
                    else {
                        return 1 - progress;
                    }
                }
                else if (this.currentStep & 1) {
                    return 1 - progress;
                }
                else {
                    return progress;
                }

                if ((this.currentStep & 1) || startPhase < 0.5) {
                    return 1 - progress;
                }
                else {
                    return progress;
                }
            }

            return 0;
        }

        currentStepEnd() {
            const startPhase = (this.phase / (Math.PI * 2)) % 1;

            if (this.isSingleCycle()) {
                return this.period * (this.currentStep + 1 - startPhase);
            }

            return this.period * (((this.currentStep + 1) / 2) - (startPhase % 0.5));
        }

        protected isSingleCycle() {
            return this.waveform === LFOWaveform.Sawtooth || this.waveform === LFOWaveform.Ramp;
        }
    }

    export class RandomModulation extends Modulation {
        protected random: Math.FastRandom;
        protected currentValue = 0;
        protected steps: number;

        constructor(
            public period: number,
            seed?: number,
            steps?: number,
        ) {
            super();
            if (seed != undefined) {
                this.random = new Math.FastRandom(Math.constrain(seed, 0x0001, 0xFFFF))
            }
            else {
                this.random = new Math.FastRandom(randint(0x0001, 0xFFFF))
            }

            if (steps != undefined) {
                this.steps = Math.constrain(this.steps, 0x0002, 0xFFFF);
            }
            else {
                this.steps = 0xFFFF;
            }

            this.updateValue();
        }

        getValueAtTime(time: number) {
            return this.currentValue;
        }

        currentStepEnd() {
            return this.period * (this.currentStep + 1);
        }

        advance() {
            super.advance();
            this.updateValue();
        }

        reset() {
            super.reset();
            this.random.reset();
            this.updateValue();
        }

        protected updateValue() {
            this.currentValue = this.random.randomRange(0, this.steps - 1) / (this.steps - 1);
        }
    }


    export function doVolumeModulation(sound: Sound, modulation: Modulation, amount: number, delay?: number) {
        const iterA = new SoundIterator(sound);
        modulation.reset();

        const out = new Sound();
        let currentTime = 0;

        if (delay > 0) {
            while (!iterA.isFinished() && currentTime < delay) {
                const nextTime = Math.min(iterA.currentStepEnd(), delay);
                out.addPart(
                    iterA.currentWaveform(),
                    iterA.frequencyAtTime(currentTime),
                    iterA.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    iterA.frequencyAtTime(nextTime),
                    iterA.volumeAtTime(nextTime)
                );
                currentTime = nextTime;
            }
        }

        while (!(iterA.isFinished())) {
            if (iterA.currentStepEnd() === modulation.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    iterA.frequencyAtTime(currentTime),
                    iterA.volumeAtTime(currentTime) - iterA.volumeAtTime(currentTime) * (1 - modulation.getValueAtTime(currentTime)) * amount,
                    nextTime - currentTime,
                    iterA.frequencyAtTime(nextTime),
                    iterA.volumeAtTime(nextTime) - iterA.volumeAtTime(nextTime) * (1 - modulation.getValueAtTime(nextTime)) * amount
                );
                iterA.advance();
                modulation.advance();
                currentTime = nextTime;
            }
            else if (iterA.currentStepEnd() < modulation.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    iterA.frequencyAtTime(currentTime),
                    iterA.volumeAtTime(currentTime) - iterA.volumeAtTime(currentTime) * (1 - modulation.getValueAtTime(currentTime)) * amount,
                    nextTime - currentTime,
                    iterA.frequencyAtTime(nextTime),
                    iterA.volumeAtTime(nextTime) - iterA.volumeAtTime(nextTime) * (1 - modulation.getValueAtTime(nextTime)) * amount
                );

                iterA.advance();
                currentTime = nextTime;
            }
            else {
                const nextTime = modulation.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    iterA.frequencyAtTime(currentTime),
                    iterA.volumeAtTime(currentTime) - iterA.volumeAtTime(currentTime) * (1 - modulation.getValueAtTime(currentTime)) * amount,
                    nextTime - currentTime,
                    iterA.frequencyAtTime(nextTime),
                    iterA.volumeAtTime(nextTime) - iterA.volumeAtTime(nextTime) * (1 - modulation.getValueAtTime(nextTime)) * amount
                );

                modulation.advance();
                currentTime = nextTime;
            }
        }

        return out;
    }

    export function doFrequencyModulation(sound: Sound, modulation: Modulation, amount: number, delay?: number) {
        const iterA = new SoundIterator(sound);
        modulation.reset();

        const out = new Sound();
        let currentTime = 0;

        if (delay > 0) {
            while (!iterA.isFinished() && currentTime < delay) {
                const nextTime = Math.min(iterA.currentStepEnd(), delay);
                out.addPart(
                    iterA.currentWaveform(),
                    iterA.frequencyAtTime(currentTime),
                    iterA.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    iterA.frequencyAtTime(nextTime),
                    iterA.volumeAtTime(nextTime)
                );
                currentTime = nextTime;
            }
        }

        while (!(iterA.isFinished())) {
            if (iterA.currentStepEnd() === modulation.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    scaleFrequency(iterA.frequencyAtTime(currentTime), modulation.getValueAtTime(currentTime), amount),
                    iterA.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    scaleFrequency(iterA.frequencyAtTime(nextTime), modulation.getValueAtTime(nextTime), amount),
                    iterA.volumeAtTime(nextTime)
                );
                iterA.advance();
                modulation.advance();
                currentTime = nextTime;
            }
            else if (iterA.currentStepEnd() < modulation.currentStepEnd()) {
                const nextTime = iterA.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    scaleFrequency(iterA.frequencyAtTime(currentTime), modulation.getValueAtTime(currentTime), amount),
                    iterA.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    scaleFrequency(iterA.frequencyAtTime(nextTime), modulation.getValueAtTime(nextTime), amount),
                    iterA.volumeAtTime(nextTime)
                );

                iterA.advance();
                currentTime = nextTime;
            }
            else {
                const nextTime = modulation.currentStepEnd();

                out.addPart(
                    iterA.currentWaveform(),
                    scaleFrequency(iterA.frequencyAtTime(currentTime), modulation.getValueAtTime(currentTime), amount),
                    iterA.volumeAtTime(currentTime),
                    nextTime - currentTime,
                    scaleFrequency(iterA.frequencyAtTime(nextTime), modulation.getValueAtTime(nextTime), amount),
                    iterA.volumeAtTime(nextTime)
                );
                modulation.advance();
                currentTime = nextTime;
            }
        }

        return out;
    }

    function scaleFrequency(value: number, modulationValue: number, amount: number) {
        return value + (value * amount - value) * modulationValue
    }
}
