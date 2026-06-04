const svg = '<svg>hello 世界</svg>';
const b64 = Buffer.from(svg).toString('base64');
console.log(b64);
