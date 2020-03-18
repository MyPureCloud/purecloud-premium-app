var express = require('express');
var app = express();

app.use(express.static(__dirname+ '/docs'));


app.listen(8080, () => console.log('Listening on 8080'));