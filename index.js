var express = require("express");
var app = express();

app.use('/health', require('./healthcheck.js'));
app.use(express.static(__dirname));

app.listen(8080, () => console.log("Listening on 8080"));
