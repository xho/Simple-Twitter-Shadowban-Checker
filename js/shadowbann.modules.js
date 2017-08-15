/*Modules*/
/*Note:
* These modules should work without any dependancies, including jquery
* the idea is that this file can support any front end framework
* this also means front end framework shortcuts like angular's $http should be
* avoided.
*/

var shadowbannModules = {};
/*example module*/
var mockModule = (function(){
	/**
	* the name of the site this module tests
	*/
	var siteName = "mock-synchronous";
	/**
	 * @param {string} returns a normalized username if the username is in a proper format, else returns null
	 */
	var validate = function(username){
		/*For example following along w/ the twitter format, usernames can be prefixed w/ @, but we'll ignore that by using a capture group*/
		var re = /^(?:@)?([A-Za-z0-9_]{1,20})$/g
		var match = re.exec(username);
		if(match != null){
			return match[1];
		} else {
			return null;
		}
	};
	/**
	* @param {string} returns a promise which resolves to an array of objects w/ this format, or an array of objects w/ this format:
	* {
	* 	title: string
	*	description: string or string[]
	*	details: string or string[]
	* }
	*/
	var query = function(username){
		return [{
			title: "Results - Synchronous",
			description: username +" was input",
			details: username +" was queried"
		}];
	};
	/*exporting the public functions for this module, must have these three*/
	return {
		siteName: siteName,
		validate: validate,
		query: query
	};
})();
shadowbannModules.mocksync = mockModule;

var mockPromiseModule = (function(){
	var siteName = "mock-asynchronous";
	
	var validate = function(username){
		var re = /^(?:@)?([A-Za-z0-9_]{1,20})$/g
		var match = re.exec(username);
		if(match != null){
			return match[1];
		} else {
			return null;
		}
	};
	/*a dummy promise which eventually resolves w/ the required format*/
	var query = function(username){
		return new Promise(function(resolve,reject){
			setTimeout(function(){
				resolve([{
					title: "Results - Asynchronous",
					description: username +" was input",
					details: username +" was queried"
				}]);
			}, 1250);
		});
	};
	
	return {
		siteName: siteName,
		validate: validate,
		query: query
	};
})();
shadowbannModules.mockasync = mockPromiseModule;

var twitterModule = (function(){
	var siteName = "twitter";
	/*Follows twitter's username format*/
	var validate = function(username){
		var re = /^(?:@)?([A-Za-z0-9_]{1,15})$/g
		var match = re.exec(username);
		if(match != null){
			return match[1];
		} else {
			return null;
		}
	};
	
	var query = function(username){
		var u = username;
		var checkUrl = "https://twitter.com/search?f=tweets&vertical=default&q=from:@"+username;
		/*
		* Due to the issue of Cors, and cookie session data, we use a proxy to get back publically available results
		* gethtml.php is a slight rewrite of parsepage.php to handle any requrested url, not just twitter
		* also makes it simple to request from by wrapping entire urls
		*/
		return fetch("/gethtml.php?url="+encodeURIComponent(checkUrl),{
			method: 'GET',
		}).then(function(response){
			/*return the html w/ .text()*/
			var txt = response.text();
			return txt;
		}).then(function(doc){
			/*scrape the document (removed jquery requirement*/
			var ndoc = document.createElement('html');
			ndoc.innerHTML = doc;
			var results = [];
			var firstFoundTweet = ndoc.querySelectorAll('li.stream-item:first-child');
			/*$(doc).find('li.stream-item:first-child');*/
			var firstFoundReply = ndoc.querySelectorAll('li.stream-item .tweet[data-is-reply-to=true]');
			/*$(doc).find('li.stream-item .tweet[data-is-reply-to=true]');*/
			var liMessage = [];
			var pMessage = [];
			var proof = 0;
			if (firstFoundTweet.length) {
				liMessage.push('at least one tweet made by @' + u + ' was found');
			} else {
				liMessage.push('no tweets made by @' + u + ' were found');
				proof++;
			}
			if (firstFoundReply.length) {
				liMessage.push('at least one reply tweet made by @' + u + ' was found');
			} else {
				liMessage.push('no reply tweets made by @' + u + ' were found');
				proof++;
			}
			if (proof == 1) {
				pMessage.push(u +' might be shadowbanned.');
			}
			if (proof == 2) {
				pMessage.push('Apparently @' + u + ' is shadowbanned.');
			}
			if (proof > 1) {
				pMessage.push('First make sure the user exists, then you may also visit this <a target="_blank" href=\"' + checkUrl + '\">link to a search on Twitter</a>. If you can\'t see any tweet made by @' + u + ', this user is most likely shadowbanned.');
			} else {
				pMessage.push('Apparently ' + u + ' is not shadowbanned.');
			}
			var msg = {
				title: "Results - "+siteName,
				description: pMessage,
				details: liMessage
			};
			results.push(msg);
			return results;
		});
	};
	return {
		siteName: siteName,
		validate: validate,
		query: query
	};
})();
shadowbannModules.twitter = twitterModule;

var redditModule = (function(){
	var siteName = "reddit";
	var validate = function(username){
		/*
		* https://github.com/reddit/reddit/blob/fd17945edf9e4ac7603f949df9f82b73eb56b15e/r2/r2/lib/validator/validator.py
		* they set the unicode flag on their regex~ Short cutting their username length issue by using {}
		*/
		var re =/^([\w-]{3,20})$/u;
		var match = re.exec(username);
		if(match != null){
			return match[1];
		} else {
			return null;
		}
	};
	/*
	* Modified from: https://github.com/skeeto/am-i-shadowbanned/blob/master/shadowbanned.js
	* Private functions to set up some promises which parse json
	*/
	/**
	 * @param {Function} callback called with true if username is available
	 */
	var isAvailable = function(username) {
		var api = "http://www.reddit.com/api/username_available.json?user="+username;
		return fetch("/gethtml.php?url="+encodeURIComponent(api),{
			method: 'GET'
		}).then(function(result) {
			var json = result.json();
			return json;
		}).then(function(out){
			return out;
		});
	};

	/**
	 * @param {Function} callback called with true if user is visible
	 */
	var isVisible = function(username) {
		var about = 'http://www.reddit.com/user/' + username + '/about.json';
		return fetch("/gethtml.php?url="+encodeURIComponent(about),{
			method: 'GET'
		}).then(function(result) {
			//parse the document as a json object
			var json = result.json();
			return json;
		}).then(function(out){
			//out is now the json object
			return out.error == null;
		});
	};
	
	var query = function(username){
		/*Fire off all promises to get results together w/ as a single promise Promise.All()*/
		return Promise.all([isVisible(username),isAvailable(username)]).then(function(values){
			var results = [];
			if(values[0].visible){
				var msg = {
					title: "Results - "+siteName,
					description: [username+" looks normal"],
					details: ["found /about.json"]
				}
				results.push(msg);
			} else {
				if(values[1]){
					var msg = {
						title: "Results - "+siteName,
						description: [username +" doesn't exist"],
						details: ["Username was available, there is no account on reddit with this handle"]
					}
					results.push(msg);
				} else {
					var msg = {
						title: "Results - "+siteName,
						description: [username +" is shadowbanned"],
						details: ["/about.json returned 404","api/username_available.json returned false"]
					}
					results.push(msg);						
				}
			}
			return results;
		});
	};
	return {
		siteName: siteName,
		validate: validate,
		query: query
	};
})();
shadowbannModules.reddit = redditModule;
/*End Modules*/