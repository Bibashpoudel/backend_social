const mongoose = require('mongoose');

const SocialFeedTagSchema = new mongoose.Schema(
    {
        profile_id: {
            type: Number,
            required: true,
        },
        social_type: {
            type: String,
            required: true,
        },
        feed_id: {
            type: String,
            required: true,
        },
        feed_link: {
            type: String,
            required: true,
        },
        caption: {
            type: String,
            default: null,
        },
        feed_type: {
            type: String,
            required: true,
        },
        attachment: {
            type: String,
            required: true,
        },
        feed_like_count: {
            type: Number,
            default: 0,
        },
        feed_comment_count: {
            type: Number,
            default: 0,
        },
        query_tag: {
            type: String,
            required: true,
        },
        hashtags: {
            type: Array,
            required: true,
        },
        mentions: {
            type: Array,
            required: true,
        },
        emojis: {
            type: Array,
            required: true,
        },
        sentiment_score: {
            type: Number,
            required: true,
        },
        sentiment_type: {
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

const SocialFeedTag = mongoose.model('SocialFeedTags', SocialFeedTagSchema);

module.exports = SocialFeedTag;
