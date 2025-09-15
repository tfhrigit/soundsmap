const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

function sanitizeInput(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
    }
    next();
}

module.exports = { limiter, sanitizeInput };