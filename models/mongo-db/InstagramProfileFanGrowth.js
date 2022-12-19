const mongoose = require('mongoose');
const { Schema } = mongoose;


const InstagramProfileFanGrowthSchema = new Schema({
    profile_id: {
        type: Number,
        required: true,
    },
    fan_count: {
        type: Number,
        required: true,
    },
    follows_count: {
        type: Number,
        required: true,
    },
    fan_growth: {
        type: Number,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const InstagramProfileFanGrowth = mongoose.model('instagram_profile_fan_growths', InstagramProfileFanGrowthSchema);

module.exports = InstagramProfileFanGrowth;
