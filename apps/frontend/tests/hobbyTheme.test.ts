import { describe, it, expect, beforeEach } from "vitest";
import {
  BRAND_COLOR,
  HOBBY_COLORS,
  HOBBY_VOICE,
  getHobbyInk,
  getHobbyText,
  hobbyTintStrength,
} from "@/lib/hobbyTheme";
import { LAST_HIVE_KEY, THEME_BOOT_SCRIPT } from "@/lib/themeScript";

// WCAG relative luminance / contrast, independent of the implementation under test
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** getHobbyText returns either a plain hex or `light-dark(<light>, <dark>)`. */
function textShades(value: string) {
  const m = value.match(/^light-dark\((#[0-9A-F]{6}), (#[0-9A-F]{6})\)$/i);
  return m ? { light: m[1], dark: m[2] } : { light: value, dark: value };
}

const WHITE = "#FFFFFF";
const CANVAS = "#F5F5F3"; // --c-canvas, light
const DARK_SURFACE = "#1A1A1E"; // --c-surface, dark

const hives = Object.entries(HOBBY_COLORS);

describe("hive colours", () => {
  it("never reuse the brand pink or each other", () => {
    const colors = hives.map(([, c]) => c.toUpperCase());
    expect(colors).not.toContain(BRAND_COLOR.toUpperCase());
    expect(new Set(colors).size).toBe(colors.length);
  });

  it.each(hives)("%s text is readable (≥4.5:1) on light cards, the light canvas and dark cards", (_, color) => {
    const { light, dark } = textShades(getHobbyText(color));
    expect(contrast(light, WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light, CANVAS)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark, DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(hives)("%s keeps its hue when the text shade shifts", (_, color) => {
    const { light, dark } = textShades(getHobbyText(color));
    // The dominant channel stays dominant — a shade, not a different colour
    const dominant = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((best, v, i, all) => (v > all[best] ? i : best), 0);
    expect(dominant(light)).toBe(dominant(color));
    expect(dominant(dark)).toBe(dominant(color));
  });

  it.each(hives)("%s solid buttons use text that stays legible on the hive colour", (_, color) => {
    // Guards against adding a light hive without dark ink; mid-tones (Art, Cooking, Travel) sit near 2.5–2.8:1
    expect(contrast(getHobbyInk(color), color)).toBeGreaterThanOrEqual(2.5);
  });

  it("uses dark ink only on the light hives", () => {
    expect(getHobbyInk(HOBBY_COLORS.Fitness)).not.toBe(WHITE);
    expect(getHobbyInk(HOBBY_COLORS.Singing)).not.toBe(WHITE);
    expect(getHobbyInk(HOBBY_COLORS.Coding)).toBe(WHITE);
  });

  it("tints grey hives harder than vivid ones, within bounds", () => {
    for (const [, color] of hives) {
      expect(hobbyTintStrength(color)).toBeGreaterThanOrEqual(0.75);
      expect(hobbyTintStrength(color)).toBeLessThanOrEqual(1.6);
    }
    expect(hobbyTintStrength(HOBBY_COLORS.Writing)).toBeGreaterThan(hobbyTintStrength(HOBBY_COLORS.Gaming));
  });

  it("gives every hive its own voice", () => {
    expect(Object.keys(HOBBY_VOICE).sort()).toEqual(Object.keys(HOBBY_COLORS).sort());
  });
});

describe("theme boot script", () => {
  const root = document.documentElement;

  beforeEach(() => {
    root.removeAttribute("style");
    delete root.dataset.hive;
    root.className = "";
    localStorage.clear();
    window.matchMedia = ((query: string) => ({ matches: false, media: query })) as unknown as typeof window.matchMedia;
  });

  const boot = (url: string) => {
    window.history.replaceState(null, "", url);
    new Function(THEME_BOOT_SCRIPT)();
  };

  it("tints a hive page before React loads", () => {
    boot("/hobbies/coding?tab=skills");
    expect(root.style.getPropertyValue("--hive")).toBe(HOBBY_COLORS.Coding);
    expect(root.dataset.hive).toBe("Coding");
  });

  it("tints Home with the requested hive, else the remembered one", () => {
    localStorage.setItem(LAST_HIVE_KEY, "travel");
    boot("/dashboard");
    expect(root.dataset.hive).toBe("Travel");

    root.removeAttribute("style");
    boot("/dashboard?hive=art");
    expect(root.dataset.hive).toBe("Art");
  });

  it("leaves the Following feed, other pages and unknown hives untinted", () => {
    localStorage.setItem(LAST_HIVE_KEY, "travel");
    boot("/dashboard?feed=following");
    expect(root.dataset.hive).toBeUndefined();
    boot("/messages");
    expect(root.dataset.hive).toBeUndefined();
    boot("/hobbies/knitting");
    expect(root.dataset.hive).toBeUndefined();
  });
});
