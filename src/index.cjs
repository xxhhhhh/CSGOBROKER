async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  const searchResults = await performSearch(query);
  const response = {
    results: searchResults
  };
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Check if addEventListener is available (browser environment)
if (typeof addEventListener === 'function') {
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
} else {
  // Fallback for Node.js environment
  module.exports = {
    handleRequest
  };
}


async function performSearch(query) {
  const searchResults = []; // Array to store search results

  const reviewsDirectory = '/reviews'; // Path to the reviews directory

  // Read the contents of the directory
  const fileList = await getFilesInDirectory(reviewsDirectory);
  fileList.forEach(file => {
    // Create a URL based on the file path and add it to the array
    const url = `/reviews/${file}`;

    // Check for a match with the query
    if (url.includes(query)) {
      // Create a result object and add it to the array
      const result = { title: getTitleFromURL(url), url: url };
      searchResults.push(result);
    }
  });

  return searchResults; // Return the search results
}

// Helper function to extract the title from a URL
function getTitleFromURL(url) {
  // Your code to extract the title from the URL
  // Return the corresponding title
  // For example, you can extract the part of the URL between the last slash and the file extension
  const lastIndex = url.lastIndexOf('/');
  const titleWithExtension = url.substring(lastIndex + 1);
  const title = titleWithExtension.split('.')[0]; // Extract the part without the file extension
  return title;
}

// Helper function to get the list of files in a directory
async function getFilesInDirectory(directory) {
  const fileList = [];
  const files = await WORKERSKV.list({ prefix: directory });
  for (const file of files.keys) {
    fileList.push(file.name);
  }
  return fileList;
}
