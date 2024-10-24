const express = require('express');
const router = express.Router();
const synchronizer = require('../services/synchronizer');

router.post('/task_date', async function (req, res, _next) {
    try {
        res.json(await synchronizer.dateSync(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

router.post('/subtask_sync', async function (req, res, _next) {
    try {
        res.json(await synchronizer.subtaskSync(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

router.post('/inbound_stock_ho', async function (req, res, _next) {
    try {
        res.json(await synchronizer.inboundStockHO(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

module.exports = router;
