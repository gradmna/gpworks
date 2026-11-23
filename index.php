<?php
	$proc = proc_open(["sh","-c","node ".dirname(realpath(__FILE__))."/cgilike.js 2>&1"],[["pipe","r"],["pipe","w"]],$pipes);
	if (is_resource($proc)) {
		if ((array_key_exists(2,$pipes))&&(is_resource($pipes[2]))) fclose($pipes[2]);
		$encH = apache_request_headers();
		$w = array_merge([implode(" ",[$_SERVER["REQUEST_METHOD"],$_SERVER["REQUEST_URI"]]),""],array_map(function($k)use($encH){return implode("=",[$k,bin2hex($encH[$k])]);},array_keys($encH)),["",file_get_contents("php://input")]);
		fwrite($pipes[0], implode("\n",$w));
		fclose($pipes[0]);
		$c = stream_get_contents($pipes[1]);
		[$h, $b] = explode("\n\n",$c,2);
		$h = explode("\n",$h);
		http_response_code(intval($h[0]));
		array_map("header",array_slice($h,1));
		echo $b;
		fclose($pipes[1]);
		exit;
	}
	http_response_code(500);
	echo "please try again later!", PHP_EOL;