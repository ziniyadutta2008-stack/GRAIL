# Homepage media replacement guide

The public homepage uses illustrative AI-generated photographs. Final video files remain outstanding until generated from the brief in `grail-homepage-video-brief.md`.

## Current behaviour

- The hero and the six activity cards use photographs in `frontend/public/images/`:
  - `grail-hero-governance.jpg`
  - `grail-activity-register.jpg`
  - `grail-activity-lineage.jpg`
  - `grail-activity-assessment.jpg`
  - `grail-activity-evidence.jpg`
  - `grail-activity-remediation.jpg`
  - `grail-activity-decision.jpg`
- `HERO_POSTER` in `frontend/src/home/HeroGovernanceVideo.tsx` points at the hero photograph.
- Missing or failing WebM/MP4 sources fall back to that photograph.
- Reduced-motion and Save-Data modes never load video sources.
- The visible disclosure says photograph unless a video is actually playing.
- The agent architecture diagram is HTML on the homepage, not an image, so its labels stay accurate.

## Replace the hero with video

1. Generate silent loop footage using `grail-homepage-video-brief.md`.
2. Encode desktop and mobile WebM + MP4 within the size targets.
3. Copy files into:

```text
frontend/public/videos/grail-governance-hero.webm
frontend/public/videos/grail-governance-hero.mp4
frontend/public/videos/grail-governance-mobile.webm
frontend/public/videos/grail-governance-mobile.mp4
```

4. Rebuild the frontend and hard-refresh the preview.

Do not hotlink stock-video websites. Do not add a paid runtime video dependency.
