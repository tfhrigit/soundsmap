const express = require('express');
const { readData, writeData } = require('../utils/storage');
const { authenticateToken } = require('../middleware/auth');
const { uploadAudio } = require('../middleware/upload');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const sounds = await readData('sounds');
        const publicSounds = sounds.filter(sound => sound.privacy === 'public');
        
        const users = await readData('users');
        const soundsWithUsers = publicSounds.map(sound => {
            const user = users.find(u => u.id === sound.userId);
            return {
                ...sound,
                user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
            };
        });
        
        res.json({ sounds: soundsWithUsers });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', authenticateToken, uploadAudio.single('file'), async (req, res) => {
    const { title, description, tags, category, language, privacy, latitude, longitude } = req.body;

    if (!title || !category || !language || !privacy || !latitude || !longitude) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Audio file is required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ message: 'Invalid coordinates' });
    }

    try {
        const sounds = await readData('sounds');
        const newSound = {
            id: uuidv4(),
            userId: req.user.userId,
            title,
            description: description || '',
            tags: tags ? JSON.parse(tags) : [],
            category,
            language,
            privacy,
            latitude: lat,
            longitude: lng,
            filename: req.file.filename,
            createdAt: new Date().toISOString()
        };

        sounds.push(newSound);
        await writeData('sounds', sounds);

        const users = await readData('users');
        const user = users.find(u => u.id === req.user.userId);
        
        res.status(201).json({
            message: 'Sound uploaded successfully',
            sound: {
                ...newSound,
                user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const sounds = await readData('sounds');
        const userSounds = sounds.filter(sound => 
            sound.userId === req.params.userId && sound.privacy === 'public'
        );
        
        res.json({ sounds: userSounds });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;