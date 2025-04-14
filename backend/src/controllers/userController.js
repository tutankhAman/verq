const User = require('../models/User');

exports.createOrUpdateUser = async (req, res) => {
    try {
        const { uid, email, displayName, photoURL } = req.body;

        // Try to find existing user
        let user = await User.findOne({ uid });

        if (user) {
            // Update existing user
            user = await User.findOneAndUpdate(
                { uid },
                { email, displayName, photoURL },
                { new: true }
            );
        } else {
            // Create new user
            user = await User.create({
                uid,
                email,
                displayName,
                photoURL
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}; 