import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const siteData = readFileSync("src/data/siteData.ts", "utf8");
const inkvokerStart = siteData.indexOf('    id: "inkvoker",');
const nextItem = siteData.indexOf('    id: "visual-experiments",', inkvokerStart);
const inkvokerItem = siteData.slice(inkvokerStart, nextItem);

const expectedCover = "/assets/projects/inkvoker/work-inkvoker-cover.jpg";
assert.match(
  inkvokerItem,
  new RegExp(`cover: "${expectedCover.replaceAll("/", "\\/")}"`),
  "Inkvoker Featured Work card should use the dedicated cropped cover",
);
assert.doesNotMatch(inkvokerItem, /assets\/placeholders/, "Inkvoker Featured Work card should not use placeholder art");

const coverPath = `public${expectedCover}`;
assert.equal(existsSync(coverPath), true, "Dedicated Inkvoker cover asset should exist");

const bytes = readFileSync(coverPath);
assert.equal(bytes[0], 0xff, "Dedicated Inkvoker cover should be a JPEG file");
assert.equal(bytes[1], 0xd8, "Dedicated Inkvoker cover should be a JPEG file");

function jpegSize(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("Could not read JPEG dimensions");
}

const { width, height } = jpegSize(bytes);
assert.equal(width / height, 1.6, "Dedicated Inkvoker cover should be cropped to the WorkCard 16:10 ratio");
