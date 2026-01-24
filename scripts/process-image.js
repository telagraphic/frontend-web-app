import sharp from "sharp";
import { readdir, stat, mkdir, unlink, rename, copyFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Supported image extensions
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff", ".svg"];

// Default configuration
const DEFAULT_CONFIG = {
  quality: 80,
  inputDir: join(__dirname, "../images/to-process"),
  outputDir: join(__dirname, "../images/processed"),
};

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--quality" || arg === "-q") {
      config.quality = parseInt(args[++i], 10) || DEFAULT_CONFIG.quality;
    } else if (arg === "--input" || arg === "-i") {
      config.inputDir = args[++i] || DEFAULT_CONFIG.inputDir;
    } else if (arg === "--output" || arg === "-o") {
      config.outputDir = args[++i] || DEFAULT_CONFIG.outputDir;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: bun scripts/process-image.js [options]

Options:
  --quality, -q <number>    WebP quality (default: 80)
  --input, -i <path>        Input directory (default: images/to-process)
  --output, -o <path>       Output directory (default: images/processed)
  --help, -h                Show this help message

Example:
  bun scripts/process-image.js --quality 85
      `);
      process.exit(0);
    }
  }

  return config;
}

/**
 * Check if file is an image based on extension
 */
function isImageFile(filename) {
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get all image files from directory
 */
async function getImageFiles(dir) {
  try {
    const files = await readdir(dir);
    const imageFiles = [];

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await stat(filePath);

      if (stats.isFile() && isImageFile(file)) {
        imageFiles.push(filePath);
      }
    }

    return imageFiles;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Directory not found: ${dir}`);
    }
    throw error;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate adaptive quality based on original file size
 * Smaller images get higher quality to avoid size increase
 * Larger images can use lower quality for better compression
 */
function getAdaptiveQuality(baseQuality, originalSizeBytes) {
  const sizeKB = originalSizeBytes / 1024;
  const sizeMB = originalSizeBytes / (1024 * 1024);

  // Very small images (< 100KB) - use high quality to prevent size increase
  if (sizeKB < 100) {
    return Math.max(baseQuality, 95);
  }
  // Small images (100KB - 500KB) - use slightly higher quality
  else if (sizeKB < 500) {
    return Math.max(baseQuality, 90);
  }
  // Medium images (500KB - 2MB) - use base quality
  else if (sizeKB < 2000) {
    return baseQuality;
  }
  // Large images (> 2MB) - can use slightly lower quality for better compression
  else if (sizeMB < 5) {
    return Math.max(baseQuality - 5, 70);
  }
  // Very large images (> 5MB) - use lower quality
  else {
    return Math.max(baseQuality - 10, 70);
  }
}

/**
 * Generate WebP with quality adjustment if needed
 * Returns the best quality that produces smaller or equal file size
 * @param {sharp.Sharp} originalImage - Original Sharp image instance to clone from
 * @param {string} outputPath - Final output path
 * @param {number} baseQuality - Starting quality
 * @param {number} originalSize - Original file size in bytes
 * @param {number} maxQuality - Maximum quality to try (default: 95)
 */
async function generateWebPWithOptimization(originalImage, outputPath, baseQuality, originalSize, maxQuality = 95) {
  let currentQuality = baseQuality;
  let bestPath = null;
  let bestSize = Infinity;
  let bestQuality = currentQuality;
  let attempts = 0;
  const maxAttempts = 3;
  const tempFiles = [];

  while (attempts < maxAttempts && currentQuality <= maxQuality) {
    // Use output path for first attempt, temp file for subsequent attempts
    const attemptPath = attempts === 0 ? outputPath : `${outputPath}.tmp${attempts}`;
    if (attemptPath !== outputPath) {
      tempFiles.push(attemptPath);
    }
    
    try {
      // Clone from original image each time to ensure fresh pipeline
      await originalImage
        .clone()
        .webp({ quality: currentQuality })
        .toFile(attemptPath);

      const stats = await stat(attemptPath);
      
      // If this is better (smaller or equal), use it
      if (stats.size < bestSize || (stats.size === bestSize && currentQuality > bestQuality)) {
        // Remove previous best if it exists and is different
        if (bestPath && bestPath !== attemptPath) {
          try {
            await unlink(bestPath);
          } catch (e) {
            // Ignore errors
          }
        }
        bestPath = attemptPath;
        bestSize = stats.size;
        bestQuality = currentQuality;
      } else {
        // This attempt is worse, remove it
        if (attemptPath !== outputPath) {
          try {
            await unlink(attemptPath);
            const index = tempFiles.indexOf(attemptPath);
            if (index > -1) tempFiles.splice(index, 1);
          } catch (e) {
            // Ignore errors
          }
        }
      }

      // If we got a smaller or equal file, we're done
      if (bestSize <= originalSize) {
        break;
      }

      // Try higher quality next time if WebP is still larger
      currentQuality = Math.min(currentQuality + 5, maxQuality);
      attempts++;
    } catch (error) {
      // If this attempt failed, try next quality
      if (attemptPath !== outputPath) {
        try {
          await unlink(attemptPath);
          const index = tempFiles.indexOf(attemptPath);
          if (index > -1) tempFiles.splice(index, 1);
        } catch (e) {
          // Ignore errors
        }
      }
      currentQuality = Math.min(currentQuality + 5, maxQuality);
      attempts++;
    }
  }

  // Clean up any remaining temp files
  for (const tempFile of tempFiles) {
    if (tempFile !== bestPath) {
      try {
        await unlink(tempFile);
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // Rename temp file to final path if needed
  if (bestPath && bestPath !== outputPath) {
    try {
      await rename(bestPath, outputPath);
    } catch (e) {
      // If rename fails, try copy and delete
      await copyFile(bestPath, outputPath);
      await unlink(bestPath);
    }
  }

  // If no file was created (all attempts failed), create one with base quality
  if (!bestPath || bestSize === Infinity) {
    await originalImage
      .clone()
      .webp({ quality: baseQuality })
      .toFile(outputPath);
    const stats = await stat(outputPath);
    return { size: stats.size, quality: baseQuality, lossless: false };
  }

  // If lossy WebP is still larger than original, try lossless WebP
  // Lossless WebP often compresses better than PNG for graphics/images
  if (bestSize > originalSize && originalSize < 500 * 1024) {
    // Only try lossless for smaller images (< 500KB)
    const losslessPath = `${outputPath}.lossless`;
    try {
      await originalImage
        .clone()
        .webp({ lossless: true })
        .toFile(losslessPath);

      const losslessStats = await stat(losslessPath);
      
      // If lossless is better (smaller or equal), use it
      if (losslessStats.size <= originalSize || losslessStats.size < bestSize) {
        // Remove the lossy version
        if (bestPath && bestPath !== outputPath) {
          try {
            await unlink(bestPath);
          } catch (e) {
            // Ignore errors
          }
        } else if (bestPath === outputPath) {
          try {
            await unlink(outputPath);
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Use lossless version
        if (losslessPath !== outputPath) {
          try {
            await rename(losslessPath, outputPath);
          } catch (e) {
            await copyFile(losslessPath, outputPath);
            await unlink(losslessPath);
          }
        }
        
        return { size: losslessStats.size, quality: null, lossless: true };
      } else {
        // Lossless is worse, remove it and keep lossy
        try {
          await unlink(losslessPath);
        } catch (e) {
          // Ignore errors
        }
      }
    } catch (error) {
      // If lossless fails, remove temp file and continue with lossy
      try {
        await unlink(losslessPath);
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // Rename best lossy file to final path if needed
  if (bestPath && bestPath !== outputPath) {
    try {
      await rename(bestPath, outputPath);
    } catch (e) {
      await copyFile(bestPath, outputPath);
      await unlink(bestPath);
    }
  }

  return { size: bestSize, quality: bestQuality, lossless: false };
}

/**
 * Process a single image
 */
async function processImage(inputPath, outputDir, baseQuality) {
  const filename = basename(inputPath);
  const nameWithoutExt = basename(inputPath, extname(inputPath));
  const outputBase = join(outputDir, nameWithoutExt);

  try {
    // Get original file size first for adaptive quality
    const originalStats = await stat(inputPath);
    const originalSize = originalStats.size;

    // Calculate adaptive quality based on file size
    const adaptiveQuality = getAdaptiveQuality(baseQuality, originalSize);

    // Load image and get metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    if (!originalWidth || !originalHeight) {
      throw new Error("Could not determine image dimensions");
    }

    // Calculate mobile dimensions (50% width, maintain aspect ratio)
    const mobileWidth = Math.round(originalWidth * 0.5);
    const mobileHeight = Math.round(originalHeight * 0.5);

    // Generate mobile version with adaptive quality
    const mobilePath = `${outputBase}-mobile.webp`;
    const mobileImage = image
      .clone()
      .resize(mobileWidth, mobileHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });

    // Calculate mobile adaptive quality (mobile is smaller, so use higher quality)
    const mobileAdaptiveQuality = getAdaptiveQuality(adaptiveQuality, originalSize);
    await mobileImage.webp({ quality: mobileAdaptiveQuality }).toFile(mobilePath);
    const mobileStats = await stat(mobilePath);
    
    // If mobile WebP is larger than original, try lossless (for small images)
    let mobileLossless = false;
    if (mobileStats.size > originalSize && originalSize < 500 * 1024) {
      const mobileLosslessPath = `${mobilePath}.lossless`;
      try {
        // Create fresh resize for lossless attempt
        await image
          .clone()
          .resize(mobileWidth, mobileHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ lossless: true })
          .toFile(mobileLosslessPath);
        
        const mobileLosslessStats = await stat(mobileLosslessPath);
        
        // If lossless is better, use it
        if (mobileLosslessStats.size <= originalSize || mobileLosslessStats.size < mobileStats.size) {
          try {
            await unlink(mobilePath);
            await rename(mobileLosslessPath, mobilePath);
            mobileLossless = true;
            // Update stats
            Object.assign(mobileStats, mobileLosslessStats);
          } catch (e) {
            await copyFile(mobileLosslessPath, mobilePath);
            await unlink(mobileLosslessPath);
            mobileLossless = true;
            Object.assign(mobileStats, mobileLosslessStats);
          }
        } else {
          await unlink(mobileLosslessPath);
        }
      } catch (error) {
        try {
          await unlink(mobileLosslessPath);
        } catch (e) {
          // Ignore
        }
      }
    }

    // Generate desktop version with optimization
    const desktopPath = `${outputBase}-desktop.webp`;
    
    // Use adaptive quality and optimize if WebP is larger
    // Pass the original image so we can clone it fresh each time
    const desktopResult = await generateWebPWithOptimization(
      image,
      desktopPath,
      adaptiveQuality,
      originalSize
    );

    return {
      filename,
      success: true,
      original: {
        path: inputPath,
        size: originalSize,
        width: originalWidth,
        height: originalHeight,
      },
      mobile: {
        path: mobilePath,
        size: mobileStats.size,
        width: mobileWidth,
        height: mobileHeight,
        quality: mobileLossless ? null : mobileAdaptiveQuality,
        lossless: mobileLossless,
      },
      desktop: {
        path: desktopPath,
        size: desktopResult.size,
        width: originalWidth,
        height: originalHeight,
        quality: desktopResult.quality,
        lossless: desktopResult.lossless || false,
      },
      adaptiveQuality,
    };
  } catch (error) {
    return {
      filename,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main processing function
 */
async function main() {
  const config = parseArgs();

  console.log("🖼️  Responsive Image Processor\n");
  console.log(`Input directory: ${config.inputDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log(`WebP quality: ${config.quality}\n`);

  // Ensure output directory exists
  await mkdir(config.outputDir, { recursive: true });

  // Get all image files
  let imageFiles;
  try {
    imageFiles = await getImageFiles(config.inputDir);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  if (imageFiles.length === 0) {
    console.log("ℹ️  No images found in input directory.");
    process.exit(0);
  }

  console.log(`Found ${imageFiles.length} image(s) to process:\n`);

  // Process each image
  const results = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const imagePath = imageFiles[i];
    const filename = basename(imagePath);
    console.log(`[${i + 1}/${imageFiles.length}] Processing: ${filename}`);

    const result = await processImage(imagePath, config.outputDir, config.quality);

    if (result.success) {
      const originalSize = formatFileSize(result.original.size);
      const mobileSize = formatFileSize(result.mobile.size);
      const desktopSize = formatFileSize(result.desktop.size);
      const mobileReduction = ((1 - result.mobile.size / result.original.size) * 100).toFixed(1);
      const desktopReduction = ((1 - result.desktop.size / result.original.size) * 100).toFixed(1);
      const mobileIncrease = ((result.mobile.size / result.original.size - 1) * 100).toFixed(1);
      const desktopIncrease = ((result.desktop.size / result.original.size - 1) * 100).toFixed(1);

      // Show adaptive quality info
      const qualityInfo = result.adaptiveQuality !== config.quality 
        ? ` (quality: ${result.adaptiveQuality}, was ${config.quality})`
        : ` (quality: ${result.adaptiveQuality})`;

      console.log(`  Adaptive quality: ${result.adaptiveQuality}${result.adaptiveQuality !== config.quality ? ` (adjusted from ${config.quality})` : ''}`);

      // Mobile output
      const mobileLosslessNote = result.mobile.lossless ? ' [lossless]' : '';
      if (result.mobile.size < result.original.size) {
        console.log(`  ✓ Mobile: ${result.mobile.width}x${result.mobile.height} (${mobileSize}, -${mobileReduction}%)${mobileLosslessNote}`);
      } else if (result.mobile.size === result.original.size) {
        console.log(`  ✓ Mobile: ${result.mobile.width}x${result.mobile.height} (${mobileSize}, same size)${mobileLosslessNote}`);
      } else {
        console.log(`  ⚠️  Mobile: ${result.mobile.width}x${result.mobile.height} (${mobileSize}, +${mobileIncrease}%) - larger than original${mobileLosslessNote}`);
      }

      // Desktop output
      const desktopLosslessNote = result.desktop.lossless ? ' [lossless]' : '';
      if (result.desktop.size < result.original.size) {
        const qualityNote = result.desktop.quality !== result.adaptiveQuality 
          ? ` [optimized to quality ${result.desktop.quality}]`
          : '';
        console.log(`  ✓ Desktop: ${result.desktop.width}x${result.desktop.height} (${desktopSize}, -${desktopReduction}%)${qualityNote}${desktopLosslessNote}`);
      } else if (result.desktop.size === result.original.size) {
        console.log(`  ✓ Desktop: ${result.desktop.width}x${result.desktop.height} (${desktopSize}, same size)${desktopLosslessNote}`);
      } else {
        const qualityNote = result.desktop.quality !== result.adaptiveQuality 
          ? ` [tried quality ${result.desktop.quality}, still larger]`
          : '';
        console.log(`  ⚠️  Desktop: ${result.desktop.width}x${result.desktop.height} (${desktopSize}, +${desktopIncrease}%) - larger than original${qualityNote}${desktopLosslessNote}`);
      }
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
    }

    results.push(result);
    console.log();
  }

  // Summary report
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("📊 Summary:");
  console.log(`  ✓ Successful: ${successful}`);
  if (failed > 0) {
    console.log(`  ✗ Failed: ${failed}`);
  }
  console.log(`  📁 Output directory: ${config.outputDir}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

