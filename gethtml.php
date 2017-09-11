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
/*
if (!function_exists('getallheaders')) 
{ 
    function getallheaders() 
    { 
	   $headers = []; 
       foreach ($_SERVER as $name => $value) 
       { 
           if (substr($name, 0, 5) == 'HTTP_') 
           { 
               $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
           } 
       } 
       return $headers; 
    } 
}
*/

if( !function_exists('apache_request_headers') ) {
///
function apache_request_headers() {
  $arh = array();
  $rx_http = '/\AHTTP_/';
  foreach($_SERVER as $key => $val) {
    if( preg_match($rx_http, $key) ) {
      $arh_key = preg_replace($rx_http, '', $key);
      $rx_matches = array();
      // do some nasty string manipulations to restore the original letter case
      // this should work in most cases
      $rx_matches = explode('_', $arh_key);
      if( count($rx_matches) > 0 and strlen($arh_key) > 2 ) {
        foreach($rx_matches as $ak_key => $ak_val) $rx_matches[$ak_key] = ucfirst($ak_val);
        $arh_key = implode('-', $rx_matches);
      }
      $arh[$arh_key] = $val;
    }
  }
  return( $arh );
}
///
}

function list_headers($headers,$user_agent = false){
	$header = "";
	foreach($headers as $key => $val){
		if($user_agent && ($key == 'User-Agent' or $key == 'user-agent')){
			continue;
		}
		$header .= $key.": ".$val."\r\n";
	}
	return $header;
}

if (empty($_GET['url'])) {
    header('HTTP/1.1 500 Internal Server Booboo');
    header('Content-Type: application/json; charset=UTF-8');
    die(json_encode(array('error' => 'Missing url')));
}

$url = filter_var($_GET['url'], FILTER_SANITIZE_URL);
//$newheaders = list_headers(apache_request_headers(),false);

$headers = apache_request_headers();
if(empty($_GET['headers'])){
} else {
	$overrides = json_decode($_GET['headers']);
	/*
	var_dump($_GET['headers']);
	var_dump($overrides);
	*/
	foreach($overrides as $key => $val){
		$headers[$key] = $val;
	}
}
//var_dump($headers);

if (empty($_GET['User-Agent'])){
	//https://stackoverflow.com/questions/6718598/download-the-contents-of-a-url-in-php-even-if-it-returns-a-404
	$content = file_get_contents($url,false,stream_context_create(
			array (
				'http' => array(
					'ignore_errors' => true,
					//'header' => list_headers($headers,false)
				)
			)
		)
	);
} else {
	$content = file_get_contents($url,false,stream_context_create(
			array (
				'http' => array(
					'ignore_errors' => true,
					//'header' => list_headers($headers,true),
					'user_agent' => filter_var($_GET['User-Agent'], FILTER_SANITIZE_STRING)
				)
			)
		)
	);
}
echo $content;