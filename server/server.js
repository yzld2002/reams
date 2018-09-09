const express = require('express')
const request = require ('request')
const FeedParser = require('feedparser')
const Iconv = require('iconv').Iconv
const zlib = require('zlib')

const app = express()

app.get('/unread/', (req, res) => {
  const unreadUrl = 'https://feedwrangler.net/api/v2/feed_items/list?access_token=07de039941196f956e9e86e202574419&read=false'
  request(unreadUrl).pipe(res)
})

app.get('/mercury/', (req, res) => {
  const apiKey = 'vTNatJB4JsgmfnKysiE9cOuJonFib4U9176DRF2z'
  const postlightUrl = 'https://mercury.postlight.com/parser?url='+encodeURIComponent(req.query.url)
  const headers = {
    'x-api-key': apiKey
  }
  request({
    url: postlightUrl,
    headers: headers
  }).pipe(res)
})

app.get('/feed/', (req, res) => {
  const feedUrl = req.query.url || 'https://www.theguardian.com/world/rss'
  fetch(feedUrl, (items) => {
    res.send(items.slice(0, 10))
  })
})

// Serve index page
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/build/index.html');
});

function fetch (feed, done) {
  let items = []

  var feedparser = new FeedParser()

  // make sure we're getting the last redirect URL
  var finalUrl = feed

  var redirectReq = request(feed, {
    method: 'HEAD',
    followAllRedirects: true
  }, (err, response, body) => {
    console.log('ERROR: ' + err)
    console.log(response.request.href)
    finalUrl = response.request.href

    console.log(finalUrl)
    var req = request(finalUrl, {
      timeout: 10000,
      pool: false
    })

    req.setMaxListeners(50)
    // Some feeds do not respond without user-agent and accept headers.
    req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml')

    // Define our handlers
    req.on('response', function(res) {
      if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'))
      var encoding = res.headers['content-encoding'] || 'identity'
        , charset = getParams(res.headers['content-type'] || '').charset
      res = maybeDecompress(res, encoding)
      res = maybeTranslate(res, charset)
      res.pipe(feedparser)
    })
  })

  feedparser.on('error', (error) => {
    console.log(error)
  })

  feedparser.on('end', () => {
    done(items)
  })

  feedparser.on('readable', function() {
    let item
    while (item = this.read()) {
      items.push(item)
    }
    // return this.read()
  })

  return feedparser
}

function maybeDecompress (res, encoding) {
  var decompress;
  if (encoding.match(/\bdeflate\b/)) {
    decompress = zlib.createInflate();
  } else if (encoding.match(/\bgzip\b/)) {
    decompress = zlib.createGunzip();
  }
  return decompress ? res.pipe(decompress) : res;
}

function maybeTranslate (res, charset) {
  var iconv
  // Use iconv if its not utf8 already.
  if (!iconv && charset && !/utf-*8/i.test(charset)) {
    try {
      iconv = new Iconv(charset, 'utf-8')
          console.log('Converting from charset %s to utf-8', charset)
          iconv.on('error', done)
          // If we're using iconv, stream will be the output of iconv
      // otherwise it will remain the output of request
      res = res.pipe(iconv)
        } catch(err) {
      res.emit('error', err)
        }
  }
  return res
}

function getParams(str) {
  var params = str.split(';').reduce(function (params, param) {
    var parts = param.split('=').map(function (part) { return part.trim(); })
      if (parts.length === 2) {
      params[parts[0]] = parts[1]
        }
    return params
    }, {})
  return params
}

const port = process.env.PORT || 8080
const server = app.listen(port, () => {
  const host = server.address().address
  const port = server.address().port

  console.log('Essential React listening at http://%s:%s', host, port)
});
