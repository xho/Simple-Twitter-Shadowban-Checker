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
		var re = /^(?:@)?([a-zA-Z0-9._]+)$/g
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
			console.log(ndoc);
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

var instagramModule = (function(){
	var siteName = "instagram";
	var baseurl = "https://www.instagram.com/";
	//works on other browsers...chrome not so much
	var ajax = function (url,opts){
		return new Promise((resolve, reject) => {
			xhr = new XMLHttpRequest();
			if(opts.method){
				xhr.open(opts.method,url);
			} else {
				xhr.open("GET", url);
			}
			if(opts.headers){
				for(var prop in opts.headers){
					if(!opts.headers.hasOwnProperty(prop)){
						continue;
					}
					xhr.setRequestHeader(prop,opts.headers[prop]);
				}
			}
			xhr.onload = () => resolve(xhr.responseText);
			xhr.onerror = () => reject(xhr.statusText);
			xhr.send();
		});
	};
	
	var instagram_json = function(doc){
		var instaScripts = doc.querySelectorAll('script');
		var jsonObj = {};
		for(var i = 0; i < instaScripts.length; i++){
			if(instaScripts[i].innerHTML.indexOf('window._sharedData') > -1){
				//console.log(instaScripts[i].innerHTML);
				//console.log(i);
				var shards = instaScripts[i].innerHTML.split("window._sharedData =");
				var insta_json = shards[1].trim();
				if(insta_json[insta_json.length - 1] = ";"){
					insta_json = insta_json.slice(0,-1);
				}
				jsonObj = JSON.parse(insta_json);
				break;
			}
		}
		return jsonObj;
	};
	
	var instagram_media = function(json){
		var page_data = {};
		var page_type = {};
		for(prop in json.entry_data){
			if(json.entry_data.hasOwnProperty(prop)){
				page_data = json.entry_data[prop][0];
				page_type = prop;
			}
		}
		if(page_type == "TagPage"){
			return page_data.tag.media;
		}
		if(page_type == "ProfilePage"){
			return page_data.user.media;
		}
		if(page_type == "PostPage"){
			return page_data.graphql.shortcode_media;
		}
	};
	
	var instagram_media_link = function(json){
		return baseurl+"/p/"+json.code;
	};
	
	var instagram_comment_tags = function(json){
		var re = /(?:[#])(\w+)/g
		//var tags = re.exec(json.edge_media_to_caption.edges[0].node.text);
		var tags = json.edge_media_to_caption.edges[0].node.text.match(re);
		return tags;
	};
	
	var instagram_comment_tag = function(json){
		var re = /(?:[#])(\w+)/g
		//var tags = re.exec(json.edge_media_to_caption.edges[0].node.text);
		var tag = json.edge_media_to_caption.edges[0].node.text.match(re);
		return tag;
	};
	
	var instagram_tags_from_string = function(str){
		var re = /(?:[#])(\w+)/g
		var tags = str.match(re);
		return tags;
	};
	
	var instagram_tag_from_string = function(str){
		var re = /(?:[#])(\w+)/g
		var tag = re.exec(str);
		return tag; 
	}
	
	var instagram_media_codes = function(mediaArray){
		return getMediaProperty(mediaArray,'code');
	};
	
	var instagram_media_dates = function(mediaArray){
		return getMediaProperty(mediaArray,'date');
	};
	var getMediaProperty = function(mediaArray, prop){
		var arr = [];
		for(var i = 0; i < mediaArray.length; i++){
			if(mediaArray.hasOwnProperty(prop)){
				arr.push(mediaArray[prop]);
			}
		}
		return arr;
	};
	/**
	 * @param {Function} callback called with true if user is visible
	 */
	var userHasRecentPhotoInHashtag = function(username) {
		var baseurl = "https://www.instagram.com/";
		var url = baseurl + username + '/';
		var firstMediaCode = "";
		var profilePage = {};
		var profileMedia = {};
		var postPage = {};
		var postMedia = {};
		var tagPage = {};
		var tagMedia = {};
		var details = [];
		//check the user's account page
		var headers = {
			'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36'
		};
		var instagramHeaders = new Headers(headers);
		console.log(instagramHeaders.get('User-Agent'));
		/*
		return ajax("/testheaders?url="+encodeURIComponent(url)+"&headers="+encodeURIComponent(JSON.stringify(headers)),{
			method: 'GET',
		}).then(function(response){
			//var obj = response.json();
			return response;
		}).then(function(out){
			console.log(out);
		});
		*/
		var useragent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36';
		return fetch("/gethtml.php?url="+encodeURIComponent(url)+"&headers="+encodeURIComponent(JSON.stringify(headers))+"&User-Agent="+encodeURIComponent(useragent),{
			method: 'GET',
		}).then(function(response) {
			var txt = response.text();
			var url = response.url;
			console.log(url);
			return txt;
		}).then(function(doc){
			/*scrape the document (removed jquery requirement*/
			var ndoc = document.createElement('html');
			ndoc.innerHTML = doc;
			//console.log(ndoc);
			
			profilePage = instagram_json(ndoc);
			profileMedia = instagram_media(profilePage);
			console.log(profilePage);
			console.log(profileMedia);
			var found = false;
			var mediaLink = null;
			var tagLink = null;
			var tag = null;
			for(var i = 0; i < profileMedia.nodes.length; i++){
				var tagMatch = instagram_tag_from_string(profileMedia.nodes[i].caption);
				console.log(tag);
				if(tagMatch){
					tag = tagMatch[1];
					mediaLink = instagram_media_link(profileMedia.nodes[i]);
					tagLink = baseurl+"explore/tags/"+tag+"/";
					found = i;
					break;
				}
			}
			if(found == null){
				details.push("No photos on the profile page contained a hashtag to check");
				return null;
			} else {
				details.push("Checking the photo found here: "+mediaLink+" against the #"+tag);
				
				return fetch("/gethtml.php?url="+encodeURIComponent(tagLink)+"&headers="+encodeURIComponent(JSON.stringify(headers)),{
					method: 'GET',
				}).then(function(response){
					var txt = response.text();
					return txt;
				});
			}
		}).then(function(doc){
			var results = [];
			if(doc != null){
				var ndoc = document.createElement('html');
				ndoc.innerHTML = doc;
				
				tagPage = instagram_json(ndoc);
				tagMedia = instagram_media(tagPage);
				console.log(tagPage);
				console.log(tagMedia);
				
				//var profile_media_codes = instagram_media_codes(profileMedia.nodes);
				//var tag_media_codes = instagram_media_codes(tagMedia.nodes);
				var results = [];
				
				//hashtable search to the rescure~
				var found = null;
				var seen = {};
				if(tagMedia.nodes.length == 0){
					details.push("There wasn't even any media in the hashtag!");
					var msg = {
						title: "Results",
						description: username+" is 99.999999999999999999% likely to be shadowbanned",
						details: details
					}
					results.push(msg);
				} else {
					for(var i = 0; i < profileMedia.nodes.length; i++){
						seen[profileMedia.nodes[i].code] = profileMedia.nodes[i];
					}
					var d = new Date();
					var dates = getMediaProperty(tagMedia.nodes,'date');
					var minDate = Math.min(dates);
					var maxDate = Math.max(dates);
					var timespan = maxDate - minDate;
					
					for(var i = 0; i < tagMedia.nodes.length; i++){
						if(typeof seen[tagMedia.nodes[i].code] === 'undefined'){
						} else {
							var mediaDate = new Date(tagMedia.nodes[i].date*1000);
							var sincePost = d - mediaDate;
							if(sincePost < 86400000){
								details.push("The found media was less than a day old");
							} else {
								details.push("The found media is over a day old");
							}
							found = i;
							break;
						}
					}
					
					if(d - maxDate < timespan){
						details.push("Your media isn't likely to have been pushed out of the results");
					} else {
						details.push("Your media may have been pushed out of the results");
					}
					if(found != null){
						details.push("One of your photos was seen in the hashtag");
						var msg = {
							title: "Results",
							description: username+" doesn't appear to be shadowbanned",
							details: details
						}
						results.push(msg);
					} else {
						details.push("No photo of yours was seen");
						var msg = {
							title: "Results",
							description: username+" may be shadowbanned",
							details: details
						}
						results.push(msg);
					}
				}
			} else {
				var msg = {
					title: "Results",
					description: "Huh...there was nothing to check",
					details: details
				}
			}

			console.log(results);
			return results;
		});
		/*
		.then(function(doc){
			var ndoc = document.createElement('html');
			ndoc.innerHTML = doc;
			
			postPage = instagram_json(ndoc);
			postMedia = instagram_media(jsonObj);
			var tagLink = baseurl+"/explore/tags/"+instagram_media_tag(media)+"/";
			
			/*
			//check if it's a recent photo
			var timeEl = ndoc.querySelector('time');
			var photoDate = new Date(timeEl.attributes['datetime'].value);
			
			var currentDate = new Date();
			
			if(currentDate - photoDate < 86400000){
				details.push("Photo was recent");
			} else {
				details.push("Most recent photo is over 24 hours old");
			}
			console.log(details);
			var hashTags = ndoc.querySelectorAll("a[href*='explore/tags']");
			hashtag = hashTags[0].href;
			//follow link from the first hashtag
			return fetch("/gethtml.php?url="+encodeURIComponent(tagLink)+"&headers="+encodeURIComponent(JSON.stringify(headers)),{
				method: 'GET',
			}).then(function(response){
				var txt = response.text();
				return txt;
			});
		}).
		*/
	};
	
	var validate = function(username){
		/*https://stackoverflow.com/questions/32543090/instagram-username-regex-php*/
		var re = /^(?:@)?([A-Za-z0-9_](?:(?:[A-Za-z0-9_]|(?:\.(?!\.))){0,28}(?:[A-Za-z0-9_]))?)$/g 
		var match = re.exec(username);
		if(match != null){
			return match[1];
		} else {
			return null;
		}
	}
	var query = function(username){
		return userHasRecentPhotoInHashtag(username);
	};
	return {
		siteName: siteName,
		validate: validate,
		query: query
	};
})();
shadowbannModules.instagram = instagramModule;
/*End Modules*/