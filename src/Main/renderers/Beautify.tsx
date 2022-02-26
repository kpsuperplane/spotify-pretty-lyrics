import { useCallback, useEffect } from "react";
import { css } from "@emotion/react";
import * as createjs from "createjs-module";
import ColorThief from "colorthief";
import convert from "color-convert";
import debounce from "debounce";

import { TLyrics } from "../../lib/lyrics";
import { TSong } from "../../lib/spotify";
import Colour from "../util/Colour";

const FONT_FAMILY = "Cabin, Ma Shan Zheng";

let lastSong: TSong | null = null;
let lyrics: TLyrics["lyrics"] | null = null;

let stage: createjs.Stage;

const video = document.createElement("video");
video.muted = true;

const PX_RATIO = (function () {
  var ctx = document.createElement("canvas").getContext("2d") as any,
    dpr = window.devicePixelRatio || 1,
    bsr =
      ctx?.webkitBackingStorePixelRatio ||
      ctx?.mozBackingStorePixelRatio ||
      ctx?.msBackingStorePixelRatio ||
      ctx?.oBackingStorePixelRatio ||
      ctx?.backingStorePixelRatio ||
      1;
  return dpr / bsr;
})();

function px(n: number) {
  return n * PX_RATIO;
}

const background = new createjs.Shape();
const backgroundFilter = new createjs.ColorFilter(0, 0, 0, 1);

const backgroundCover = new createjs.Bitmap("");
let backgroundCoverX = 0;
let backgroundCoverY = 0;
let bgMaxDimension = 0;

const circle1 = new createjs.Shape();
const circle1Filter = new createjs.ColorFilter(0, 0, 0, 0);
const circle2 = new createjs.Shape();
const circle2Filter = new createjs.ColorFilter(0, 0, 0, 0);

const title = new createjs.Text("", "", "#ffffffff");
title.x = px(100);
const artist = new createjs.Text("", "", "#ffffffaa");
artist.x = px(100);
const cover = new createjs.Bitmap("");
cover.x = px(25);
cover.regX = 0;
cover.regY = 0;

function fontMult() {
  return Math.min(window.innerWidth, window.innerHeight) / 1200 + 0.4;
}
function formatLyric(lyric: string, text: createjs.Text) {
  text.text = lyric;
  text.textAlign = "center";
  text.font = `${px(45) * fontMult()}px ${FONT_FAMILY}`;
  text.color = "#ffffff";
  text.lineHeight = px(45 * 1.4) * fontMult();
  text.lineWidth = px(window.innerWidth * 0.8);
}
function getLyricPosition(lyric: string, offset: number) {
  const text = new createjs.Text();
  formatLyric(lyric, text);
  const scale = [0.5, 0.7, 1, 0.7, 0.5][offset + 2];
  const height = text.getMeasuredHeight();
  return {
    x: px(window.innerWidth) / 2,
    y:
      px(window.innerHeight) / 2 +
      px(45) * 1.2 * [-6, -3, 0, 3, 8][offset + 2],
    regX: 0,
    regY: height / 2,
    alpha: [0, 0.4, 1, 0.7, 0][offset + 2],
    scaleX: scale,
    scaleY: scale,
  };
}

function clipText() {
  const maxWidth = px(window.innerWidth) * 0.6;
  title.text = lastSong?.item?.name ?? "";
  const titleWidth = title.getMeasuredWidth();
  console.log(titleWidth, maxWidth);
  if (titleWidth > maxWidth) {
    title.text = title.text.substring(0, Math.floor(title.text.length * maxWidth/titleWidth)) + '...';
  }

  artist.text = lastSong?.item?.artists?.map((a) => a.name)?.join(", ") ?? "";
  const artistWidth = artist.getMeasuredWidth();
  if (artistWidth > maxWidth) {
    artist.text = artist.text.substring(0, Math.floor(artist.text.length * maxWidth/artistWidth)) + '...';
  }
}

function onResizeImpl() {
  (stage.canvas as HTMLCanvasElement).height = px(window.innerHeight);
  (stage.canvas as HTMLCanvasElement).width = px(window.innerWidth);

  video.srcObject = (stage.canvas as HTMLCanvasElement).captureStream(60);

  background.graphics
    .clear()
    .beginFill(createjs.Graphics.getRGB(255, 255, 255))
    .drawRect(0, 0, px(window.innerWidth), px(window.innerHeight));
  background.filters = [backgroundFilter];
  background.cache(0, 0, px(window.innerWidth), px(window.innerHeight));

  bgMaxDimension = px(Math.max(window.innerWidth, window.innerHeight));
  const maxDimension = bgMaxDimension * 1.1;
  backgroundCoverX = (px(window.innerWidth) - maxDimension) / 2;
  backgroundCoverY = (px(window.innerHeight) - maxDimension) / 2;

  const circle1Radius = px(
    Math.max(window.innerHeight, window.innerWidth) * 0.8
  );
  circle1.graphics
    .clear()
    .beginRadialGradientFill(
      [
        createjs.Graphics.getRGB(255, 255, 255, 1),
        createjs.Graphics.getRGB(255, 255, 255, 0),
      ],
      [0, 1],
      0,
      0,
      0,
      0,
      0,
      circle1Radius
    )
    .drawCircle(0, 0, circle1Radius);
  circle1.regX = circle1.regY = circle1Radius * 0.2;
  circle1.filters = [circle1Filter];
  circle1.cache(0, 0, circle1Radius, circle1Radius);

  const circle2Radius = px(
    Math.max(window.innerHeight, window.innerWidth) * 0.5
  );
  const circle2x = px(window.innerWidth);
  const circle2y = px(window.innerHeight);
  circle2.graphics
    .clear()
    .beginRadialGradientFill(
      [
        createjs.Graphics.getRGB(255, 255, 255, 0.7),
        createjs.Graphics.getRGB(255, 255, 255, 0),
      ],
      [0, 1],
      circle2x,
      circle2y,
      0,
      circle2x,
      circle2y,
      circle2Radius
    )
    .drawCircle(circle2x, circle2y, circle2Radius);
    circle2.regX = circle2.regY = circle1Radius * -0.1;
  circle2.filters = [circle2Filter];
  circle2.cache(
    circle2x - circle2Radius,
    circle2y - circle2Radius,
    circle2x,
    circle2y
  );

  title.y = px(window.innerHeight - 90);
  title.font = `${px(30)}px ${FONT_FAMILY}`;
  artist.y = px(window.innerHeight - 55);
  artist.font = `${px(20)}px ${FONT_FAMILY}`;
  cover.y = px(window.innerHeight - 93);

  renderLyrics(true);

  clipText();

  stage.update();
}
function onResize() {
  debounce(onResizeImpl, 500)();
}

let bgAnim = false;
let circ1Anim = false;
let circ2Anim = false;
let frame = 0;

function init() {
  bgAnim = circ1Anim = circ2Anim = false;
  stage = new createjs.Stage("beautify-canvas");

  stage.addChild(background);
  stage.addChild(backgroundCover);
  stage.addChild(circle1);
  stage.addChild(circle2);
  stage.addChild(title);
  stage.addChild(artist);
  stage.addChild(cover);

  window.addEventListener("resize", onResize);
  onResizeImpl();

  createjs.Ticker.framerate = 120;
  createjs.Ticker.addEventListener("tick", stage);
  createjs.Ticker.addEventListener("tick", () => {
    if (bgAnim) background.updateCache();
    if (circ1Anim) circle1.updateCache();
    if (circ2Anim) circle2.updateCache();

    const circle1Angle = frame / (createjs.Ticker.framerate * 15);
    circle1.x = px(100) * Math.sin(Math.PI * 2 * circle1Angle);
    circle1.y = px(100) * Math.cos(Math.PI * 2 * circle1Angle);

    const circle2Angle = frame / (createjs.Ticker.framerate * 20);
    circle2.x = px(100) * Math.sin(Math.PI * 2 * circle2Angle);
    circle2.y = px(100) * Math.cos(Math.PI * 2 * circle2Angle);

    const backgroundCoverAngle = frame / (createjs.Ticker.framerate * 60);
    backgroundCover.x = backgroundCoverX + bgMaxDimension * 0.05 * Math.sin(Math.PI * 2 * backgroundCoverAngle);
    backgroundCover.y = backgroundCoverY + bgMaxDimension * 0.05 * Math.cos(Math.PI * 2 * backgroundCoverAngle);

    frame++;
    if (frame === createjs.Ticker.framerate * 60) {
      frame = 0;
    }
  });

  createjs.Tween.get(circle1, { loop: -1 })
    .to({ scale: 1.2 }, 30000)
    .to({ scale: 1 }, 30000);
  createjs.Tween.get(circle2, { loop: -1 })
    .to({ scale: 1.3 }, 20000)
    .to({ scale: 1 }, 20000);
}
function teardown() {
  window.removeEventListener("resize", onResize);
  stage.removeAllChildren();
  stage.removeAllEventListeners();
  createjs.Ticker.removeAllEventListeners();
}

function updateSong(song: TSong | null) {
  if (song?.item?.id !== lastSong?.item?.id) {
    updateLyrics(null);

    const image = new Image();
    image.src = song?.item?.album?.images[0].url ?? "";
    image.crossOrigin = "Anonymous";
    image.onload = () => {      

      const TARGET = px(60);
      cover.scaleX = TARGET / image.width;
      cover.scaleY = TARGET / image.height;

      const BG_TARGET = px(Math.max(window.innerHeight, window.innerWidth)) * 1.1;
      backgroundCover.scaleX = BG_TARGET / image.width;
      backgroundCover.scaleY = BG_TARGET / image.height;

      const thief = new ColorThief();
      // find color with highest saturation and use it
      const colors = [thief.getColor(image), ...thief.getPalette(image)];
      const primary = colors
        .map((rgb) => ({ rgb, hsl: convert.rgb.hsl(...rgb) }))
        .sort((a, b) => b.hsl[1] - a.hsl[1])[0].rgb;

      const labPrimary = Colour.rgba2lab(...primary);
      const [secondary, tertiary] = colors
        .filter(
          (rgb) =>
            rgb[0] !== primary[0] &&
            rgb[1] !== primary[1] &&
            rgb[2] !== primary[2]
        )
        .map((rgb) => {
          const lab1 = Colour.rgba2lab(...rgb);
          return {
            delta: Math.abs(40 - Colour.deltaE00(...lab1, ...labPrimary)),
            rgb,
          };
        })
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 2)
        .map((c) => c.rgb);

      const primaryDarker = Colour.getDarkerColour(
        primary[0],
        primary[1],
        primary[2],
        1,
        0.1
      );
      requestAnimationFrame(() => {
        bgAnim = true;
        createjs.Tween.get(backgroundFilter)
          .to(
            {
              redMultiplier: primaryDarker[0] / 255,
              greenMultiplier: primaryDarker[1] / 255,
              blueMultiplier: primaryDarker[2] / 255,
            },
            1000
          )
          .call(() => {
            bgAnim = false;
          });
      });
      setTimeout(() => {
        requestAnimationFrame(() => {
          circ1Anim = true;
          createjs.Tween.get(circle1Filter)
            .to(
              {
                alphaMultiplier: 1,
                redMultiplier: secondary[0] / 255,
                greenMultiplier: secondary[1] / 255,
                blueMultiplier: secondary[2] / 255,
              },
              2000
            )
            .call(() => {
              circ1Anim = false;
            });
        });
      }, 500);
      setTimeout(() => {
        requestAnimationFrame(() => {
          circ2Anim = true;
          createjs.Tween.get(circle2Filter)
            .to(
              {
                alphaMultiplier: 1,
                redMultiplier: tertiary[0] / 255,
                greenMultiplier: tertiary[1] / 255,
                blueMultiplier: tertiary[2] / 255,
              },
              3000
            )
            .call(() => {
              circ2Anim = false;
            });
        });
      }, 1000);
    };
    cover.image = image;
    createjs.Tween.get(backgroundCover).to({alpha: 0}, 2000).call(() => {
      backgroundCover.image = image;
    }).to({alpha: 0.05}, 2000);
  }
  if (song?.progress_ms !== lastSong?.progress_ms) {
    lastSong = song;
    renderLyrics();
  } else {
    lastSong = song;
  }
  clipText();
}

type TLyricObjects = {
  timestamp: number;
  text: createjs.Text;
  offset: number;
}[];
let lyricObjects: TLyricObjects = [];
let currentIndex = 0;
const LYRIC_EASE = createjs.Ease.quintOut;
const LYRIC_ANIM = 1000;
let nextLyricTick: number | null = null;
function float(text: createjs.Text, offset: number, index: number) {
  // make current lyric float around a bit
  if (offset === 0 && currentIndex === index) {
    const center = getLyricPosition(text.text, offset);
    const scale1 = Math.random() * 0.2 - 0.1;
    const scale2 = Math.random() * 0.2 - 0.1;
    createjs.Tween.get(text, { loop: -1 })
      .to(
        {
          x: center.x + px(Math.random() * 20 - 10),
          y: center.y + px(Math.random() * 20 - 10),
          scaleX: center.scaleX + scale1,
          scaleY: center.scaleY + scale1,
        },
        3000,
        createjs.Ease.cubicInOut
      )
      .to(
        {
          x: center.x + px(Math.random() * 20 - 10),
          y: center.y + px(Math.random() * 20 - 10),
          scaleX: center.scaleX + scale2,
          scaleY: center.scaleY + scale2,
        },
        3000,
        createjs.Ease.cubicInOut
      )
      .to(
        {
          x: center.x,
          y: center.y,
          scaleX: center.scaleX,
          scaleY: center.scaleY,
        },
        1500,
        createjs.Ease.cubicInOut
      );
  }
}
function renderLyrics(forceUpdate: boolean = false) {
  let anim = forceUpdate ? 1 : LYRIC_ANIM;

  if (nextLyricTick != null) {
    clearTimeout(nextLyricTick);
  }
  if (lyrics == null || lastSong?.progress_ms == null) {
    for (const lyric of lyricObjects) {
      createjs.Tween.get(lyric.text, { override: true })
        .to({ alpha: 0 }, anim, LYRIC_EASE)
        .call(() => {
          stage.removeChild(lyric.text);
        });
    }
    lyricObjects = [];
    return;
  }

  const currentTime =
    (lastSong.is_playing
      ? lastSong.progress_ms + (new Date().getTime() - lastSong.timestamp)
      : lastSong.progress_ms) / 1000;

  let lyricIndex = lyrics.length - 1;
  for (let i = 0; i < lyrics.length - 1; i++) {
    if (lyrics[i + 1].timestamp > currentTime) {
      lyricIndex = i;
      break;
    }
  }
  currentIndex = lyricIndex;

  if (lyricIndex < lyrics.length - 1) {
    nextLyricTick = setTimeout(
      () => renderLyrics(),
      (lyrics[lyricIndex + 1].timestamp - currentTime) * 1000
    );
    anim = Math.min(
      anim,
      (lyrics[lyricIndex + 1].timestamp - lyrics[lyricIndex].timestamp) * 1000
    );
  }

  const newLyrics: TLyricObjects = [];
  const timeline = new (createjs.Timeline as any)() as createjs.Timeline;
  for (let offset = -1; offset <= 1; offset++) {
    const idx = offset + lyricIndex;
    let currentObj: TLyricObjects[0];
    if (idx >= 0 && idx < lyrics.length) {
      const lyric = lyrics[idx];
      const obj = lyricObjects.find((obj) => obj.timestamp === lyric.timestamp);
      if (obj != null) {
        currentObj = obj;
        // need to update positioning
        if (obj.offset !== offset || forceUpdate) {
          timeline.addTween(
            createjs.Tween.get(obj.text, { override: true, paused: true })
              .to(getLyricPosition(obj.text.text, offset), anim, LYRIC_EASE)
              .call(() => float(obj.text, offset, lyricIndex))
          );
          obj.offset = offset;
        }
        newLyrics.push(obj);
      } else {
        const content =
          lyric.content.trim() === "" ? "♫ ♪ ♬" : lyric.content.trim();
        const text = new createjs.Text();
        formatLyric(content, text);
        const style = getLyricPosition(content, offset + 1);
        text.x = style.x;
        text.y = style.y;
        text.regX = style.regX;
        text.regY = style.regY;
        text.scaleX = style.scaleX;
        text.scaleY = style.scaleY;
        text.alpha = style.alpha;
        stage.addChild(text);
        timeline.addTween(
          createjs.Tween.get(text, { override: true, paused: true })
            .to(getLyricPosition(content, offset), anim, LYRIC_EASE)
            .call(() => float(text, offset, lyricIndex))
        );
        currentObj = { timestamp: lyric.timestamp, offset, text };
        newLyrics.push(currentObj);
      }
    }
  }
  for (const obj of lyricObjects) {
    if (!newLyrics.some((newObj) => newObj.timestamp === obj.timestamp)) {
      const index = lyrics.findIndex(
        (lyric) => lyric.timestamp === obj.timestamp
      );
      const newOffset = index === -1 ? -2 : index - lyricIndex;
      timeline.addTween(
        createjs.Tween.get(obj.text, { override: true, paused: true })
          .to(getLyricPosition(obj.text.text, newOffset), anim, LYRIC_EASE)
          .call(() => {
            stage.removeChild(obj.text);
          })
      );
    }
  }
  timeline.gotoAndPlay(0);
  lyricObjects = newLyrics;
}

function updateLyrics(newLyrics: TLyrics | null) {
  lyrics = newLyrics?.lyrics ?? null;
  renderLyrics();
}

export default function Beautify({
  lyrics,
  song,
}: {
  lyrics: TLyrics | null;
  song: TSong | null;
}) {
  useEffect(() => updateSong(song), [song]);
  useEffect(() => updateLyrics(lyrics), [lyrics]);
  useEffect(() => {
    init();
    return () => teardown();
  }, []);
  const icon = new URL("pip.svg", import.meta.url);
  const openPIP = useCallback(() => {
    video.play();
    video.requestPictureInPicture();
  }, []);
  return (
    <>
      <canvas
        css={css`
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        `}
        id="beautify-canvas"
      />
      <button
        onClick={openPIP}
        css={css`
          display: block;
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: transparent;
          border-style: none;
          cursor: pointer;
          filter: invert(1);
        `}
      >
        <img
          css={css`
            width: 24px;
            height: 24px;
          `}
          src={icon.toString()}
        />
      </button>
    </>
  );
}
