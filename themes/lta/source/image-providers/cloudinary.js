/**
 * Custom Cloudinary Provider
 *
 * Nuxt Image built-in Cloudinary provider seems to have the wrong values for
 * the `fit` property, or at least the output doesn't match the description of
 * the intended output. This custom provider is a simple wrapper around the
 * built-in provider that maps corrected `fit` values.
 * 
 * Note: Our simpler provider in Nuxt 2 that modified the existing Cloudinary
 * provider is no longer possible it seems. So this is simply a copy of the
 * built-in provider with modified `fit` values.
 * 
 * Issue: https://github.com/nuxt/image/issues/1474
 */

import { joinURL, encodePath } from "ufo";
import { defu } from "defu";
import { createOperationsGenerator } from "#image";
const convertHexToRgbFormat = (value) => value.startsWith("#") ? value.replace("#", "rgb_") : value;
const removePathExtension = (value) => value.replace(/\.[^/.]+$/, "");
const operationsGenerator = createOperationsGenerator({
  keyMap: {
    fit: "c",
    width: "w",
    height: "h",
    format: "f",
    quality: "q",
    background: "b",
    rotate: "a",
    roundCorner: "r",
    gravity: "g",
    effect: "e",
    color: "co",
    flags: "fl",
    dpr: "dpr",
    opacity: "o",
    overlay: "l",
    underlay: "u",
    transformation: "t",
    zoom: "z",
    colorSpace: "cs",
    customFunc: "fn",
    density: "dn",
    aspectRatio: "ar",
    blur: "e_blur"
  },
  valueMap: {
    fit: {
      /**
       * These Cloudinary values better match Nuxt Image's descriptions for these
       * `fit` properties.
       *
       * Nuxt Image: https://image.nuxt.com/providers/cloudinary#cloudinary-fit-values
       * Cloudinary: https://cloudinary.com/documentation/transformation_reference#c_crop_resize
       */
      fill: 'scale', // Ignore the aspect ratio of the input and stretch to both provided dimensions
      inside: 'fit', // Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified
      outside: 'limit', // Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified
      cover: 'fill', // Preserving aspect ratio, ensure the image covers both provided dimensions by cropping/clipping to fit
      contain: 'pad', // Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary
      /*
      fill: "fill",
      inside: "pad",
      outside: "lpad",
      cover: "fit",
      contain: "scale",
      */
      minCover: "mfit",
      minInside: "mpad",
      thumbnail: "thumb",
      cropping: "crop",
      coverLimit: "limit"
    },
    format: {
      jpeg: "jpg"
    },
    background(value) {
      return convertHexToRgbFormat(value);
    },
    color(value) {
      return convertHexToRgbFormat(value);
    },
    gravity: {
      auto: "auto",
      subject: "auto:subject",
      face: "face",
      sink: "sink",
      faceCenter: "face:center",
      multipleFaces: "faces",
      multipleFacesCenter: "faces:center",
      north: "north",
      northEast: "north_east",
      northWest: "north_west",
      west: "west",
      southWest: "south_west",
      south: "south",
      southEast: "south_east",
      east: "east",
      center: "center"
    }
  },
  joinWith: ",",
  formatter: (key, value) => key.includes("_") ? `${key}:${value}` : `${key}_${value}`
});
const defaultModifiers = {
  format: "auto",
  quality: "auto"
};
export const getImage = (src, { modifiers = {}, baseURL = "/" } = {}) => {
  const mergeModifiers = defu(modifiers, defaultModifiers);
  const operations = operationsGenerator(mergeModifiers);
  const remoteFolderMapping = baseURL.match(/\/image\/upload\/(.*)/);
  if (remoteFolderMapping?.length >= 1) {
    const remoteFolder = remoteFolderMapping[1];
    const baseURLWithoutRemoteFolder = baseURL.replace(remoteFolder, "");
    return {
      url: joinURL(baseURLWithoutRemoteFolder, operations, remoteFolder, src)
    };
  } else if (/\/image\/fetch\/?/.test(baseURL)) {
    src = encodePath(src);
  } else {
    src = removePathExtension(src);
  }
  return {
    url: joinURL(baseURL, operations, src)
  };
};

