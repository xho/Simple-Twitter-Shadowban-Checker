<?php
/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
*/

/*
if (empty($_GET['u'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing user')));
}
$u = filter_var($_GET['u'], FILTER_SANITIZE_STRING);
// $url = 'https://twitter.com/search?q=from%3A%40' . $u;
$url = 'https://twitter.com/search?f=tweets&vertical=default&q=from%3A%40' . $u;
$content = file_get_contents($url);
echo $content;
// $url = 'https://twitter.com/search?q=from%3A%40' . $u;
// $url = 'https://twitter.com/search?f=tweets&vertical=default&q=from%3A%40' . $u;
*/
if (empty($_GET['url'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing url')));
}
$url = filter_var($_GET['url'], FILTER_SANITIZE_URL);
//https://stackoverflow.com/questions/6718598/download-the-contents-of-a-url-in-php-even-if-it-returns-a-404
$content = file_get_contents($url,false,stream_context_create(
		array (
			'http' => array(
				'ignore_errors' => true
			)
		)
	)
);
echo $content;