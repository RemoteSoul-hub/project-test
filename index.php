<?php
// Disable compression at PHP and Apache levels
if (function_exists('apache_setenv')) {
    apache_setenv('no-gzip', '1');
    apache_setenv('dont-vary', '1');
}

// PHP-level compression disable
ini_set('zlib.output_compression', 'Off');

// Configure cURL to avoid compression
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000' . $_SERVER['REQUEST_URI']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// Handle different HTTP methods
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// Forward headers without Accept-Encoding
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'accept-encoding') {
        $headers[] = $name . ': ' . $value;
    }
}
$headers[] = 'Accept-Encoding: identity';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

$headers_received = substr($response, 0, $header_size);
$body = substr($response, $header_size);

curl_close($ch);

// Set appropriate headers
if ($contentType) {
    header("Content-Type: $contentType");
}
header('Content-Encoding: identity');
header('Cache-Control: no-transform');

http_response_code($httpCode);
echo $body;
?>

