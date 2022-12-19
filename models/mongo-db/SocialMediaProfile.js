const mongoose = require('mongoose');


const socialMediaProfileSchema = new mongoose.Schema({
    social_type: {
        type: String,
        required: true,
    },
    social_page_id: {
        type: Number,
        required: true,
    },
    page_name: {
        type: String,
    },
    page_username: {
        type: String,
    },
    page_picture: {
        type: String,
    },
    page_posts_count: {
        type: Number,
        default: 0,
    },
    page_shares_count: {
        type: Number,
        default: 0,
    },
    page_comments_count: {
        type: Number,
        default: 0,
    },
    page_fan_count: {
        type: Number,
        default: 0,
    },
    page_follows_count: {
        type: Number,
        default: 0,
    },
    color: {
        type: String,
    },
    is_data_downloading: {
        type: Boolean,
        default: true,
    },
    last_updated_date: {
        type: String,
    },
}, {
    timestamps: true,
});

socialMediaProfileSchema.set('toJSON', {virtuals: true});

const SocialMediaProfile = mongoose.model('SocialMediaProfile', socialMediaProfileSchema);


module.exports = SocialMediaProfile;
