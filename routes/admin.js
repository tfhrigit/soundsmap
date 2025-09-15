const express = require('express');
const { readData, writeData } = require('../utils/storage');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/sounds', authenticateToken, async (req, res) => {
    try {
        const sounds = await readData('sounds');
        const reports = await readData('reports');
        
        const soundsWithReports = sounds.map(sound => {
            const soundReports = reports.filter(report => report.soundId === sound.id);
            return {
                ...sound,
                reports: soundReports.length
            };
        });
        
        res.json({ sounds: soundsWithReports });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/sounds/:soundId', authenticateToken, async (req, res) => {
    try {
        const sounds = await readData('sounds');
        const filteredSounds = sounds.filter(sound => sound.id !== req.params.soundId);
        
        await writeData('sounds', filteredSounds);
        
        res.json({ message: 'Sound deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const reports = await readData('reports');
        const sounds = await readData('sounds');
        const users = await readData('users');
        
        const reportsWithDetails = reports.map(report => {
            const sound = sounds.find(s => s.id === report.soundId);
            const reporter = users.find(u => u.id === report.userId);
            return {
                ...report,
                sound: sound || null,
                reporter: reporter ? { id: reporter.id, name: reporter.name } : null
            };
        });
        
        res.json({ reports: reportsWithDetails });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;