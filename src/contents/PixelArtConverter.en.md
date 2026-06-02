## What Is Pixel Art Conversion

**Pixel art conversion** turns a regular image into a retro, pixelated version made of large, crisp color blocks, reminiscent of early video games and 8-bit graphics.

This tool is based on [pixelit](https://github.com/giventofly/pixelit), an open-source JavaScript library for pixel-art conversion.

## How It Works

- **Pixelation** — The image is first downscaled to a smaller resolution based on the pixel density, then upscaled back with nearest-neighbor interpolation to create crisp pixel blocks.
- **Palette mode** — Each pixel color is matched to the closest entry in the chosen palette using Euclidean color distance in RGB space.

## Notes

- All processing runs locally in your browser. Images are not uploaded to any server.
