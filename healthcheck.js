const express = require("express");
const router = express.Router({});
router.get('/', async (_req, res, _next) => {

  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  try {
    res.send(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).send();
  }
});

// export router with all routes included
module.exports = router;