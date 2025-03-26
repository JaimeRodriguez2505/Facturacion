<?php


return [

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
*/

'paths' => ['api/*'],

'allowed_methods' => explode(',', env('CORS_ALLOWED_METHODS', '*')),

// Aquí definimos orígenes permitidos. No usar '*' si queremos credenciales.
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5174')),


// Si quieres usar patrones en lugar de un string fijo, aquí:
'allowed_origins_patterns' => [],

'allowed_headers' => explode(',', env('CORS_ALLOWED_HEADERS', '*')),

'exposed_headers' => [],

// Tiempo de “cacheo” de la respuesta preflight en el navegador
'max_age' => 0,

// ¡Importante!
'supports_credentials' => env('CORS_ALLOW_CREDENTIALS', false),

];
