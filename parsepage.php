<?
/*
** Simpe Twitter Shadowban Checker - php proxy
** 2016 @xho
*/

if (empty($_GET['u'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing user')));
}

$u = $_GET['u'];
// $url = 'https://twitter.com/search?q=from%3A%40' . $u;
$url = 'https://twitter.com/search?f=tweets&vertical=default&q=from%3A%40' . $u;
$content = file_get_contents($url);
echo $content;
