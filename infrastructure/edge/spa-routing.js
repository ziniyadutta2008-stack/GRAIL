// Viewer-request function for the private S3 origin.
// Application routes may contain dots, including ISO clause ids such as iso-fg-6.1.2.
// Rewrite those to /index.html. Fetch only known static asset extensions from S3.
// Do not treat "the URL contains a dot" as a file. /api/* is a separate behaviour.
var STATIC_EXTENSIONS = {
  css: 1,
  gif: 1,
  htm: 1,
  html: 1,
  ico: 1,
  jpeg: 1,
  jpg: 1,
  js: 1,
  json: 1,
  map: 1,
  mp4: 1,
  png: 1,
  svg: 1,
  txt: 1,
  webm: 1,
  webp: 1,
  woff: 1,
  woff2: 1,
  xlsx: 1,
  xml: 1,
}

function handler(event) {
  var request = event.request
  var uri = request.uri
  if (uri.indexOf('/api/') === 0) {
    return request
  }
  var last = uri.split('/').pop()
  var dot = last.lastIndexOf('.')
  var extension = dot === -1 ? '' : last.substring(dot + 1).toLowerCase()
  if (!STATIC_EXTENSIONS[extension]) {
    request.uri = '/index.html'
  }
  return request
}
