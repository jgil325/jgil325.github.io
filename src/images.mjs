// Keep image selection aligned with the approved responsive layout.
export const containerImageSizes =
  "(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) calc(100vw - 64px), (max-width: 1440px) calc(100vw - 128px), 1312px";

export function projectImageSizes(project, caseStudy) {
  if (caseStudy || project.slug === "broadcast-graphics") {
    return containerImageSizes;
  }
  const ratio = project.imageWidth / 1288;
  return [
    "(max-width: 767px) calc(100vw - 40px)",
    "(max-width: 1199px) calc((100vw - 88px) / 2)",
    `(max-width: 1440px) calc((100vw - 152px) * ${ratio})`,
    `${project.imageWidth}px`,
  ].join(", ");
}

export function imageAttributes(key, images, sizes, { source = false } = {}) {
  const image = images[key];
  if (!image) throw new Error(`Missing image: ${key}`);
  const srcset = image.variants
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
  return `${source ? "" : `src="${image.src}" `}srcset="${srcset}" sizes="${sizes}"`;
}
