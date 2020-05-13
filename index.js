const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname+ '/docs/'))

// Routes
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname,'docs','index.html'));    
});

// Port Listen
app.listen(8080);
console.log('Running...');