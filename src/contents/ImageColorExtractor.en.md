## What Is Image Color Extraction

Image color extraction analyzes the pixel colors in an image to automatically identify the dominant color, a representative palette, and semantic swatches, based on the median cut quantization algorithm from [Color Thief](https://github.com/lokesh/color-thief).

## How to Use

1. Upload an image and the tool will automatically analyze and extract its colors.
2. Review the dominant color, palette, and semantic swatches.
3. Click the HEX, RGB, or HSL button below any color to copy it in that format.
4. To analyze another image, click **Change Image** and upload a new one.

## Understanding the Results

- **Dominant Color** — The color the algorithm considers most representative, shown together with its proportion in the image.
- **Palette** — A set of representative colors extracted from the image, each shown with its proportion.
- **Semantic Swatches** — Colors grouped by their characteristics, including Vibrant, Muted, Dark Vibrant, Dark Muted, Light Vibrant, and Light Muted. If no color in the image matches a category, "No match" is shown.

## Notes

- The dominant color is not necessarily the most frequent color in the image, but rather the color the algorithm considers most representative.
- Proportions are approximate values estimated by the algorithm and are for reference only.
- Images are **not** uploaded to any server. All color analysis is performed locally in your browser.
