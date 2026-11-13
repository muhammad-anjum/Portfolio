// Generates responsive image variants and a manifest the page builder reads.
// Usage: node tools/images.mjs
// Needs ffmpeg + ffprobe on PATH. Originals (.webp) are never modified; variants are
// written next to them as <name>-640.jpg and <name>-1100.jpg for wide sources only.
import { execFileSync } from "node:child_process"
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs"
import { join, relative, extname, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const mediaDir = join(root, "assets/media/projects")
const WIDTHS = [640, 1100]
const MIN_SOURCE = 1300 // only make variants when the source is clearly larger

const walk = dir => readdirSync(dir).flatMap(name => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : [full]
})

const probe = file => {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]).toString().trim()
  const [w, h] = out.split(",").map(Number)
  return { w, h }
}

const manifest = {}
const sources = walk(mediaDir).filter(f => extname(f) === ".webp" && !/-\d+\.webp$/.test(f))

for (const file of sources.sort()) {
  const key = relative(mediaDir, file).replace(/\.webp$/, "")
  const { w, h } = probe(file)
  const variants = []
  if (w >= MIN_SOURCE) {
    for (const width of WIDTHS) {
      const out = file.replace(/\.webp$/, `-${width}.jpg`)
      if (!existsSync(out)) {
        execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", file, "-vf", `scale=${width}:-1:flags=lanczos`, "-q:v", "3", out])
      }
      variants.push({ file: `${key}-${width}.jpg`, width })
    }
  }
  manifest[key] = { w, h, variants }
}

/* Photographs: upright, metadata-stripped JPG masters in a "photos" folder. Each gets
   responsive JPG variants. (ffmpeg here cannot write WebP or AVIF, and AVIF from macOS sips
   rendered unreliably in Chromium, so it is not used.)
   Full-resolution originals are kept in src/originals. */
const PHOTO_WIDTHS = [640, 1100, 1600]
const photos = walk(mediaDir).filter(f => extname(f) === ".jpg" && f.includes("/photos/") && !/-\d+\.jpg$/.test(f))
for (const file of photos.sort()) {
  const key = relative(mediaDir, file).replace(/\.jpg$/, "")
  const { w, h } = probe(file)
  const variants = []
  for (const width of PHOTO_WIDTHS) {
    const jpg = file.replace(/\.jpg$/, `-${width}.jpg`)
    if (!existsSync(jpg)) execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-i", file, "-map_metadata", "-1", "-vf", `scale=${width}:-2:flags=lanczos`, "-q:v", "3", jpg])
    variants.push({ file: `${key}-${width}.jpg`, width })
  }
  manifest[key] = { w, h, ext: "jpg", variants }
}

writeFileSync(join(root, "assets/media/manifest.json"), JSON.stringify(manifest, null, 1) + "\n")
console.log(`${sources.length} images, ${Object.values(manifest).filter(m => m.variants.length).length} with responsive variants`)
