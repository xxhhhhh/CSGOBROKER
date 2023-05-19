const { WORKERSKV } = require('worktop/kv');

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  const searchResults = await performSearch(query);
  const response = {
    results: searchResults,
  };
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function performSearch(query) {
  const searchResults = [];

  const reviewsDirectory = '/reviews';

  const fileList = await WORKERSKV.list({ prefix: reviewsDirectory });
  for (const file of fileList.keys) {
    const url = `/reviews/${file.name}`;

    if (url.includes(query)) {
      const result = { title: getTitleFromURL(url), url: url };
      searchResults.push(result);
    }
  }

  return searchResults;
}

function getTitleFromURL(url) {
  const lastIndex = url.lastIndexOf('/');
  const titleWithExtension = url.substring(lastIndex + 1);
  const title = titleWithExtension.split('.')[0];
  return title;
}

// Check if addEventListener is available (browser environment)
if (typeof addEventListener === 'function') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
} else {
  // Fallback for Node.js environment
  module.exports = {
    handleRequest,
  };
}
