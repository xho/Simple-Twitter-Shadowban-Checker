'use strict';

const TwitterProxy = {
  search: (query, qf) => {
    return fetch(`/parsepage.php?q=${query}${qf ? '' : '&noqf=1'}`)
      .then(TwitterProxy.checkSuccess)
      .then(res => res.text())
      .catch(TwitterProxy.handleError);
  },
  checkSuccess: (res) => {
    // res.ok === (res.status in the range 200-299) 
    if (!res.ok) {
      throw res; // throwing response object to make it available to catch()
    }
    return res;
  },
  handleError: (err) => {
    switch(err.status) {
      case 404:
        console.warn(`[TwitterProxy|search] ${err.statusText}`);
        // ui.resetOrSo()...
        break;
      case 500:
        console.warn(`[TwitterProxy|search] ${err.statusText}`);
        err.json().then(jsonBody => console.error(jsonBody.error));
        break;
      default:
        console.warn('[TwitterProxy|search] Network error');
        console.error(err);
        break;
    }
  }
};
