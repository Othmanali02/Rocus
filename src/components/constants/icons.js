export const iconOptions = [
  "RocusFileIcon.png",
  "RocusFileIconColored.png",
  "RocusFileIconDark.png",
];

export function getIconUrl(iconFileName) {
  if (!iconFileName) return '';
  if (iconFileName.startsWith('http') || iconFileName.startsWith('data:')) {
    return iconFileName;
  }
  return new URL(`../images/${iconFileName}`, import.meta.url).href;
}