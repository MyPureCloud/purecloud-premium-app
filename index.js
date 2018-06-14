var express = require('express');
var app = express();

app.use(express.static('docs'));
app.get('/', function(req,res){
    res.sendFile(__dirname + '/docs/index.html');
});

app.listen(3000);