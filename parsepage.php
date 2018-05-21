<?php

/*
** Simple Twitter Shadowban Checker - php proxy
** 2016 @xho
*/

if (empty($_GET['q'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing query')));
}

// defaults ?qf to 'on', which is the
// current (2018-05-20) behaviour of the twitter website
$params = array(
  'q' => filter_var($_GET['q'], FILTER_SANITIZE_STRING),
  'qf' => empty($_GET['noqf']) ? '' : '&qf=off'
);

$url = 'https://twitter.com/search?f=tweets&src=typd&vertical=default&q=' . urlencode($params['q']) . $params['qf'];

$content = file_get_contents($url);
echo $content;

?>
