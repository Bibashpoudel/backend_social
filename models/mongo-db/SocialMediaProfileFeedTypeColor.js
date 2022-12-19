const mongoose = require('mongoose');

const SocialMediaProfileFeedTypeColorSchema = new mongoose.Schema({
  social_type: {
    type: String,
    required: true,
  },
  feed_type: {
    type: String,
  },
  color: {
    type: String,
  },
},
{
  timestamps: true,
},
)
  ;

const SocialMediaProfileFeedTypeColor = mongoose.model('SocialMediaProfileFeedTypeColor', SocialMediaProfileFeedTypeColorSchema);


module.exports = SocialMediaProfileFeedTypeColor;
