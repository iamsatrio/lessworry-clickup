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

router.post('/inbound_stock', async function (req, res, _next) {
    try {
        res.json(await synchronizer.inboundStock(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

router.post('/outbound_stock', async function (req, res, _next) {
    try {
        res.json(await synchronizer.outboundStock(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

router.post('/purchase_stock', async function (req, res, _next) {
    try {
        res.json(await synchronizer.purchaseStock(req.body.payload, req.query.type));
    } catch (err) {
        console.error(err.message);
        res.status(err.statusCode || 500).json({ 'message': err.message });
    }
});

module.exports = router;
