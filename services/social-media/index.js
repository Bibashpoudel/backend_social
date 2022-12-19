const Models = require('../../models/mongo-db').default;
const randomColor = require('randomcolor');

module.exports = {
/*
  * Get profile info
  */
  getProfileInfo: async (socialMediaType, profileId) => {
    const profile = await Models.SocialMediaProfile.findOne({
      social_page_id: profileId,
      social_type: socialMediaType,
    }).exec();

    const totalPostCount = await profile.getPostCount();

    return {
      page_name: profile.page_name,
      page_picture: profile.page_picture,
      page_fan_count: profile.page_fan_count,
      total_feeds_count: totalPostCount,
    };
  },
  generateSocialProfileFeedTypeUniqueColor: async (SocialMediaType) => {
    const feedTypeColor = randomColor({
      format: 'rgba',
      alpha: 1,
    });

    const feedTypeColorTaken = await Models.SocialMediaProfileFeedTypeColor.findOne({
      social_type: SocialMediaType,
      color: feedTypeColor,
    }).exec();

    /* calling itself to generate color when color taken*/
    if (feedTypeColorTaken) {
      module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);
    }

    return feedTypeColor;
  },
  storeFeedTypeUniqueColor: async (SocialMediaType, feedType) => {
    console.log('This need to be called.');
    /* checking feedType color already has */
    const hasFeedTypeColor = await Models.SocialMediaProfileFeedTypeColor.findOne({
      social_type: SocialMediaType,
      feed_type: feedType,
    }).exec();

    if (hasFeedTypeColor) {
      return;
    }
    /* Creating color for new feed type */
    const feedTypeColor = await module.exports.generateSocialProfileFeedTypeUniqueColor(SocialMediaType);

    /* Storing feed color */
    await Models.SocialMediaProfileFeedTypeColor.create({
      social_type: SocialMediaType,
      feed_type: feedType,
      color: feedTypeColor,
    });
  },
}