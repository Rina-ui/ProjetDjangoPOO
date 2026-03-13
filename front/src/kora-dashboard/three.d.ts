/// <reference types="three" />

declare global {
    // THREE est chargé via CDN dans index.html (three.min.js r128)
    // eslint-disable-next-line no-var
    var THREE: typeof import("three")
}

export {}
