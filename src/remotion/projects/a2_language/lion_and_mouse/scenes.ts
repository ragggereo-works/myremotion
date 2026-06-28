import type { SceneConfig } from "../Scene";
import type { TwoSegmentConfig } from "../TwoSegmentScene";

// ===========================================================================
// The Lion and the Mouse — scene registry.
//
// Each entry is ONE scene = 1 mp3 + Clip A + Clip B + captions JSON.
// Assets live in   public/a2_language/lion_and_mouse/<sceneN>/
// Captions + durations are produced by   scripts/transcribe-a2.mjs   which
// writes captions.json and a manifest into each scene folder.
//
// This list is INTENTIONALLY EMPTY until the first scene's assets are dropped.
// To add a scene, drop its files then run the transcribe script, which prints
// the durationInFrames / splitFrame to paste here (or import the manifest).
// ===========================================================================

export const STORY = "lion_and_mouse";

export type A2Scene = SceneConfig & { id: string };

export const LION_AND_MOUSE_SCENES: A2Scene[] = [
  {
    id: "A2-Lion-Scene01",
    audio: "a2_language/lion_and_mouse/scene1/scene01.mp3",
    clipA: "a2_language/lion_and_mouse/scene1/scene1A.mp4",
    clipB: "a2_language/lion_and_mouse/scene1/scene1B.mp4",
    captions: "a2_language/lion_and_mouse/scene1/captions.json",
    durationInFrames: 479, // from manifest (whisperx)
    // Both clips are 8.08s and the scene is 16.0s, so the cut must sit at ~8.0s
    // (only freeze-free spot). whisperx's suggested 196 would starve clip B.
    splitFrame: 240,
    brollVolume: 0.2, // bumped to match scenes 2+
  },
  {
    id: "A2-Lion-Scene02",
    audio: "a2_language/lion_and_mouse/scene2/scene02.mp3",
    clipA: "a2_language/lion_and_mouse/scene2/scene2A.mp4",
    clipB: "a2_language/lion_and_mouse/scene2/scene2B.mp4",
    captions: "a2_language/lion_and_mouse/scene2/captions.json",
    durationInFrames: 442, // from manifest (whisperx)
    // Clips total 14.47s < 14.73s narration, so cut at clipA's natural length
    // (6.39s ≈ 191f) and slow clipB to fill its slot — nothing freezes.
    splitFrame: 191,
    clipBRate: 0.965, // clipB 8.08s over an 8.37s slot
    // brollVolume omitted -> DEFAULT_BROLL_VOLUME (0.20)
  },
  {
    id: "A2-Lion-Scene05",
    audio: "a2_language/lion_and_mouse/scene5/scene05.mp3",
    clipA: "a2_language/lion_and_mouse/scene5/scene5A.mp4",
    clipB: "a2_language/lion_and_mouse/scene5/scene5B.mp4",
    captions: "a2_language/lion_and_mouse/scene5/captions.json",
    durationInFrames: 545,
    splitFrame: 242,
    clipBRate: 0.8016, // clips total 16.19s < 18.14s narration — slow clipB to fill
  },
  {
    id: "A2-Lion-Scene06",
    audio: "a2_language/lion_and_mouse/scene6/scene06.mp3",
    clipA: "a2_language/lion_and_mouse/scene6/scene6A.mp4",
    clipB: "a2_language/lion_and_mouse/scene6/scene6B.mp4",
    captions: "a2_language/lion_and_mouse/scene6/captions.json",
    durationInFrames: 351,
    splitFrame: 122, // clipA full (4.07s); cut in the "Thank you!" pause
  },
  {
    // Scene 7: both clips play WHOLE (clipA 5.91s + clipB 8.10s = 14.0s). One
    // continuous narration with a 1s lead-in; ~0.5s clean b-roll tail.
    id: "A2-Lion-Scene07",
    audio: "a2_language/lion_and_mouse/scene7/scene07.mp3",
    clipA: "a2_language/lion_and_mouse/scene7/scene7A.mp4",
    clipB: "a2_language/lion_and_mouse/scene7/scene7B.mp4",
    captions: "a2_language/lion_and_mouse/scene7/captions.json",
    durationInFrames: 419, // 177 + 242 (both clips full)
    splitFrame: 177, // cut at clipA's full length — clipB then plays whole
    audioLeadFrames: 30, // narration starts 1s in
    captionFrames: 373, // narration 12.45s — captions clear for the tail
  },
  {
    // Scene 8: both clips whole (clipA 7.15s + clipB 6.52s = 13.66s). One
    // continuous narration with a 0.5s lead-in and a ~1s clean b-roll tail.
    id: "A2-Lion-Scene08",
    audio: "a2_language/lion_and_mouse/scene8/scene08.mp3",
    clipA: "a2_language/lion_and_mouse/scene8/scene8A.mp4",
    clipB: "a2_language/lion_and_mouse/scene8/scene8B.mp4",
    captions: "a2_language/lion_and_mouse/scene8/captions.json",
    durationInFrames: 409, // 214 + 195 (both clips full)
    splitFrame: 214, // cut at clipA's full length — clipB then plays whole
    audioLeadFrames: 15, // narration starts 0.5s in
    captionFrames: 364, // narration 12.12s — captions clear for the ~1s tail
  },
  {
    id: "A2-Lion-Scene09",
    audio: "a2_language/lion_and_mouse/scene9/scene09.mp3",
    clipA: "a2_language/lion_and_mouse/scene9/scene9A.mp4",
    clipB: "a2_language/lion_and_mouse/scene9/scene9B.mp4",
    captions: "a2_language/lion_and_mouse/scene9/captions.json",
    durationInFrames: 454,
    splitFrame: 242, // clipA full (8.06s); near the "help!" pause
  },
  {
    id: "A2-Lion-Scene10",
    audio: "a2_language/lion_and_mouse/scene10/scene10.mp3",
    clipA: "a2_language/lion_and_mouse/scene10/scene10A.mp4",
    clipB: "a2_language/lion_and_mouse/scene10/scene10B.mp4",
    captions: "a2_language/lion_and_mouse/scene10/captions.json",
    durationInFrames: 352,
    splitFrame: 167, // clipB plays nearly full; clipA trimmed
  },
  {
    id: "A2-Lion-Scene11",
    audio: "a2_language/lion_and_mouse/scene11/scene11.mp3",
    clipA: "a2_language/lion_and_mouse/scene11/scene11A.mp4",
    clipB: "a2_language/lion_and_mouse/scene11/scene11B.mp4",
    captions: "a2_language/lion_and_mouse/scene11/captions.json",
    durationInFrames: 300,
    splitFrame: 144,
  },
  {
    // Scene 12: clips (16.16s) just exceed audio (16.07s) — drop the tail so
    // both clips play at full speed (no slowdown).
    id: "A2-Lion-Scene12",
    audio: "a2_language/lion_and_mouse/scene12/scene12.mp3",
    clipA: "a2_language/lion_and_mouse/scene12/scene12A.mp4",
    clipB: "a2_language/lion_and_mouse/scene12/scene12B.mp4",
    captions: "a2_language/lion_and_mouse/scene12/captions.json",
    durationInFrames: 483, // == audio length (no extra tail) so clips cover it
    splitFrame: 242, // clipA full; clipB plays ~8.03s of 8.08s
  },
  {
    // Scene 13 (closing): single clip (8.08s), audio 8.45s — slow the one clip
    // ~4.6% to fill. No clipB.
    id: "A2-Lion-Scene13",
    audio: "a2_language/lion_and_mouse/scene13/scene13.mp3",
    clipA: "a2_language/lion_and_mouse/scene13/scene13A.mp4",
    captions: "a2_language/lion_and_mouse/scene13/captions.json",
    durationInFrames: 254, // ~= audio length
    splitFrame: 254, // unused for single-clip
    clipARate: 0.954, // 8.08s clip over an 8.47s scene
  },
];

// Scenes where both clips play whole and the narration is placed in time.
export type A2TwoSegmentScene = TwoSegmentConfig & {
  id: string;
  durationInFrames: number;
};

export const LION_AND_MOUSE_TWO_SEGMENT: A2TwoSegmentScene[] = [
  {
    // Scene 3: clipA (8.08s) carries "The lion woke up. He was angry."; clipB
    // (8.08s) plays, and 1s in, "He put his big paw... said the lion." starts.
    id: "A2-Lion-Scene03",
    durationInFrames: 484, // 242 + 242
    clipA: "a2_language/lion_and_mouse/scene3/scene3A.mp4",
    clipB: "a2_language/lion_and_mouse/scene3/scene3B.mp4",
    clipAFrames: 242,
    clipBFrames: 242,
    seg1Audio: "a2_language/lion_and_mouse/scene3/_seg1/seg.mp3",
    seg1Captions: "a2_language/lion_and_mouse/scene3/_seg1/captions.json",
    seg2Audio: "a2_language/lion_and_mouse/scene3/_seg2/seg.mp3",
    seg2Captions: "a2_language/lion_and_mouse/scene3/_seg2/captions.json",
    seg2LeadFrames: 30, // 1s into clip B
    seg1Frames: 105, // seg1 audio 3.49s
    seg2Frames: 207, // seg2 audio 6.90s
  },
  {
    // Scene 4: clipA (8.08s) carries "Please... I am very small."; clipB (6.23s)
    // plays, and 1s in, "One day... I can be your friend." starts.
    id: "A2-Lion-Scene04",
    durationInFrames: 428, // 242 + 186
    clipA: "a2_language/lion_and_mouse/scene4/scene4A.mp4",
    clipB: "a2_language/lion_and_mouse/scene4/scene4B.mp4",
    clipAFrames: 242, // 8.08s
    clipBFrames: 186, // 6.23s (floor to avoid a tail freeze)
    seg1Audio: "a2_language/lion_and_mouse/scene4/_seg1/seg.mp3",
    seg1Captions: "a2_language/lion_and_mouse/scene4/_seg1/captions.json",
    seg2Audio: "a2_language/lion_and_mouse/scene4/_seg2/seg.mp3",
    seg2Captions: "a2_language/lion_and_mouse/scene4/_seg2/captions.json",
    seg2LeadFrames: 30, // 1s into clip B
    seg1Frames: 196, // seg1 spoken ends ~6.51s
    seg2Frames: 108, // seg2 spoken ends ~3.57s
  },
];
