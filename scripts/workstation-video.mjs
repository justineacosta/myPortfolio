// Encodes the workstation animation (assets/about-workstation.gif, the master)
// as the looping video components/ui/LoopVideo.tsx plays: WebM (VP9) and MP4
// (H.264, for Safari), at its own 1920 width, since scaling pixel art only adds
// noise to encode. Needs ffmpeg on PATH. Re-run if the GIF changes, along with
// scripts/gif-still.mjs for the still frame.
// Run: node scripts/workstation-video.mjs
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'

const SRC = 'assets/about-workstation.gif'
const OUT = 'public/assets/about-workstation'
const common = ['-hide_banner', '-loglevel', 'error', '-y', '-i', SRC, '-vf', 'format=yuv420p', '-an']

execFileSync('ffmpeg', [...common, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '1', `${OUT}.webm`], { stdio: 'inherit' })
execFileSync('ffmpeg', [...common, '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '23', '-movflags', '+faststart', `${OUT}.mp4`], { stdio: 'inherit' })
for (const ext of ['webm', 'mp4']) console.log(`${OUT}.${ext}: ${(statSync(`${OUT}.${ext}`).size / 1024).toFixed(0)} KB`)
