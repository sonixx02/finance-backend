const express = require('express');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();
const openApiSpec = require('../../docs/openapi.json');

router.use(swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: 'Finance Backend API Docs',
    explorer: true,
  })
);

module.exports = router;
