#!/usr/bin/env python3
"""Generate a test WAV file with actual audio content."""

import struct
import math

def generate_wav_with_tone(filename, frequency=440, duration=2, sample_rate=16000):
    """Generate a WAV file with a simple sine wave tone."""

    num_samples = sample_rate * duration

    # WAV header
    num_channels = 1
    bytes_per_sample = 2
    byte_rate = sample_rate * num_channels * bytes_per_sample
    block_align = num_channels * bytes_per_sample
    bits_per_sample = 16

    subchunk2_size = num_samples * num_channels * bytes_per_sample
    chunk_size = 36 + subchunk2_size

    with open(filename, 'wb') as f:
        # RIFF header
        f.write(b'RIFF')
        f.write(struct.pack('<I', chunk_size))
        f.write(b'WAVE')

        # fmt subchunk
        f.write(b'fmt ')
        f.write(struct.pack('<I', 16))  # subchunk1_size
        f.write(struct.pack('<H', 1))   # audio_format (PCM)
        f.write(struct.pack('<H', num_channels))
        f.write(struct.pack('<I', sample_rate))
        f.write(struct.pack('<I', byte_rate))
        f.write(struct.pack('<H', block_align))
        f.write(struct.pack('<H', bits_per_sample))

        # data subchunk
        f.write(b'data')
        f.write(struct.pack('<I', subchunk2_size))

        # Generate audio data (sine wave)
        amplitude = 32767  # max value for 16-bit signed int
        for i in range(num_samples):
            sample = amplitude * math.sin(2 * math.pi * frequency * i / sample_rate)
            f.write(struct.pack('<h', int(sample)))

    print(f"✅ Generated {filename}: {duration}s of {frequency}Hz tone")

if __name__ == "__main__":
    generate_wav_with_tone("test_audio.wav", frequency=440, duration=2)
