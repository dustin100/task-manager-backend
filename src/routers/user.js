const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const { update } = require('../models/user');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

// Create User
router.post('/users', async (req, res) => {
	const user = new User(req.body);
	try {
		await user.save();
		const token = await user.genAuthToken();
		res.status(201).send({ user, token });
	} catch (err) {
		res.status(400).send();
	}
});

// Login User

router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.genAuthToken();
		res.status(200).send({ user, token });
	} catch (err) {
		res.status(400).send(err);
	}
});

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

// Get current user
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

// Update User by Id
router.patch('/users/me', auth, async (req, res) => {
	console.log('anything');
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValid = updates.every((update) => allowedUpdates.includes(update));

	if (!isValid) {
		return res.status(400).send({ error: 'Invalid updates' });
	}

	try {
		updates.forEach((update) => {
			req.user[update] = req.body[update];
		});
		await req.user.save();

		res.send(req.user);
	} catch (err) {
		res.status(400).send(err);
	}
});

// Delete User by Id
router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		res.send(req.user);
	} catch (err) {
		res.status(500).send();
	}
});

// Add Profile img
const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
			return cb(new Error('File must be an image'));
		}

		cb(undefined, true);
	},
});

router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

// Delete profile image

router.delete('/users/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined;
		await req.user.save();
		res.send();
	} catch (err) {
		res.status(400).send();
	}
});

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}
		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (err) {
		res.status(404).send();
	}
});

module.exports = router;
