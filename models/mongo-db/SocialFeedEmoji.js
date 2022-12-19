const mongoose = require('mongoose');

const SocialFeedEmojiSchema = new mongoose.Schema(
    {
        feed_id: {
            type: String,
            required: true,
        },
        query_tag: {
            type: String,
            required: true,
        },
        emoji: {
            type: String,
            required: true,
        },
        social_type: {
            type: String,
            required: true,
        },
        feed_created_date: {
            type: String,
            required: true,
        },
    },
    {timestamps: true},
);

/* Plugings configurations */


const SocialFeedEmoji = mongoose.model('SocialFeedEmoji', SocialFeedEmojiSchema);


module.exports = SocialFeedEmoji;
