const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/storage');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password, bio } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const users = await readData('users');
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            bio: bio || '',
            avatar: '',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeData('users', users);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const users = await readData('users');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/profile', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        const users = await readData('users');
        const user = users.find(u => u.id === decoded.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
});

module.exports = router;