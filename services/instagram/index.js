/* eslint-disable camelcase */
/* eslint-disable indent */
/* eslint-disable object-curly-spacing */
/* eslint-disable quotes */
/*
 *
 * NOTE :: THIS IS SERVICE MODULE AND SO
 * DO NOT WRAP THE CODE IN TRY CATCH BLOCK AS IT WILL NOT ALLOW TO ERROR HANDLING IN PARENT FUNCTION
 *
 */

const {
  igBaseURL,
  igSearchBaseURL,
  apifyAccessToken,
  loginUsername,
  loginPassword,
  scrollWaitSecs,
  maxRequestRetries,
  useStealth,
  ravenxApi,
} = require("../../config");
const Models = require("../../models/mongo-db").default;
const SocialMediaProfileService = require("../social-media");
const { Enums } = require("../../utils");

const { addDays, format } = require("date-fns");
const HttpsProxyAgent = require("https-proxy-agent");
const axios = require("axios");
const ApifyClient = require("apify-client");
const async = require("async");
const myLog = require("simple-log-viewer");
const moment = require("moment-timezone");
const configs = require("./../../config");

myLog.init("./logs/scrapper.log");

const dateDiff = (date) => {
  const date1 = new Date(date);
  const date2 = new Date();

  // To calculate the time difference of two dates
  const Difference_In_Time = date2.getTime() - date1.getTime();

  // To calculate the no. of days between two dates
  return parseInt(Difference_In_Time / (1000 * 3600 * 24));
};

/**
 * scrapProfileAndPosts()
 * Instagram Scrapper
 * @param {object} options
 */
const scrapProfileAndPosts = async (options) => {
  // myLog.addToLog(new Date() + 'APIFY :: ' + JSON.stringify(options));

  // Initialize the ApifyClient with API token
  const client = new ApifyClient({
    token: apifyAccessToken,
  });
  let input = {};
  // Prepare actor input

  input = {
    ...options,
    // loginUsername,
    // loginPassword,
    scrollWaitSecs,
    maxRequestRetries,
    useStealth,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
    extendOutputFunction: async ({
      data,
      item,
      itemSpec,
      page,
      request,
      customData,
    }) => {
      return item;
    },
    extendScraperFunction: async ({
      page,
      request,
      itemSpec,
      customData,
      Apify,
    }) => {},
    customData: {},
  };

  // Prepare option input
  const option = {
    timeout: 600,
  };

  // Run the actor and wait for it to finish
  const run = await client
    .actor("alexey/quick-instagram-profile-check")
    .call(input, option);

  // Fetch and print actor results from the run's dataset (if any)
  logger.info("result from instagram scrapper");
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items;
};

/**
 * saveProfileFeeds()
 * Save scrapped posts from IG
 * @param {Models.SocialMediaProfile} profile
 */
const saveProfileFeeds = async (profile) => {
  const directUrls = [igBaseURL + profile["page_username"]];
  const options = {
    directUrls,
    resultsType: "posts",
    resultsLimit: parseInt(process.env.POST_RESULT_LIMIT),
  };
  const profileFeedData = await scrapProfileAndPosts(options);

  async.each(
    profileFeedData,
    function (profileFeed, callback) {
      console.log("feed", profileFeed);

      const feedCreatedDate = format(
        new Date(profileFeed.timestamp),
        Enums.DATE_FORMAT
      );

      const attachment =
        profileFeed.type == "Video"
          ? profileFeed.videoUrl
          : profileFeed.displayUrl;

      Models.InstagramProfileFeed.findOneAndUpdate(
        {
          profile_id: profile["social_page_id"],
          feed_id: profileFeed.id,
        },
        {
          $set: {
            feed_link: profileFeed.url,
            caption: profileFeed.caption,
            feed_type: profileFeed.type,
            attachment,
            thumbnail: profileFeed.displayUrl,
            feed_like_count: profileFeed.likesCount,
            feed_comment_count: profileFeed.commentsCount,
            feed_created_date: feedCreatedDate,
            feed_created_date_utc: profileFeed.timestamp,
          },
        },
        {
          new: true,
          upsert: true, // Make this update into an upsert
        },
        (err, doc) => {
          if (err) logger.error(err);
        }
      );

      /* Storing unique color for Feed type */
      SocialMediaProfileService.storeFeedTypeUniqueColor(
        "instagram",
        profileFeed.type
      );
    },
    function (err) {
      if (err) {
        logger.error(err);
      }
    }
  );

  profile["is_data_downloading"] = false;
  profile.save();
};

/**
 * saveProfileDetails()
 * Save scrapped posts from IG
 * @param {Models.SocialMediaProfile} profile
 */
const saveProfileDetails = async (profile) => {
  const dateToday = moment()
    .tz(`${configs.profileUpdateTimezone}`)
    .format("YYYY-MM-DD");
  const directUrls = [igBaseURL + profile["page_username"]];
  const options = {
    directUrls,
    resultsType: "details",
  };
  const profileData = await scrapProfileAndPosts(options);

  if (profileData) {
    /* Updating the profile data */
    profile["page_name"] = profileData[0].fullName;
    // profile['page_username'] = profileData[0].username;
    profile["page_picture"] = profileData[0].profilePicUrl;
    profile["page_fan_count"] = profileData[0].followersCount;
    profile["page_posts_count"] = profileData[0].postsCount;
    profile["page_follows_count"] = profileData[0].followsCount;
    await profile.save();
  }
  if (profileData) {
    profile["last_updated_date"] = dateToday;
    profile["is_data_downloading"] = false;
    await profile.save();
  }

  return;
};

/**
 * saveEmoji()
 * Save scraped
 * @param {obj} emojis
 * @param {obj} feed
 */
const saveEmoji = async (emojis, feed, query) => {
  for (key in emojis) {
    if (Object.hasOwnProperty.call(emojis, key)) {
      const emoji = emojis[key];
      const feedCreatedDate = format(
        new Date(feed.timestamp),
        Enums.DATE_FORMAT
      );
      await Models.SocialFeedEmoji.findOneAndUpdate(
        {
          feed_id: feed.id,
          emoji: emoji,
        },
        {
          emoji: emoji,
          query_tag: feed.queryTag ? feed.queryTag : query,
          social_type: "instagram",
          feed_created_date: feedCreatedDate,
        },
        {
          new: true,
          upsert: true,
        }
      );
    }
  }
};

const getRxScore = async (review) => {
  const url = ravenxApi;
  const response = await axios.post(url, { review: review });
  const { rx_score } = response.data;

  let sentimentType = "neutral";
  if (rx_score > 2) {
    sentimentType = "positive";
  }
  if (rx_score < 2) {
    sentimentType = "negative";
  }

  return {
    rx_score,
    type: sentimentType,
  };
};

const lastUpdatedDate = async (query) => {
  const tag = await Models.SocialTag.findOne({ query_tag: query });

  if (tag) {
    const diff = await dateDiff(tag.updatedAt);
    if (diff >= 1) {
      tag["updatedAt"] = new Date();
      tag.save();
      return true;
    }
  } else {
    await Models.SocialTag.create({
      query_tag: query,
      social_type: "instagram",
    });
    return true;
  }

  return false;
};

module.exports = {
  createOrUpdateProfile: async (profile) => {
    await saveProfileDetails(profile);

    /* Saving profile fan count*/
    const currentDate = format(new Date(), Enums.DATE_FORMAT);
    const previousDate = format(
      addDays(new Date(currentDate), -1),
      Enums.DATE_FORMAT
    );

    const prevFanGrowth = await Models.InstagramProfileFanGrowth.findOne({
      profile_id: profile["social_page_id"],
      date: previousDate,
    });
    const previousFanCount = !prevFanGrowth ? 0 : prevFanGrowth.fan_count;
    const fanGrowth =
      previousFanCount == 0 ? 0 : profile["page_fan_count"] - previousFanCount;

    await Models.InstagramProfileFanGrowth.findOneAndUpdate(
      {
        profile_id: profile["social_page_id"],
        date: currentDate,
      },
      {
        fan_count: profile["page_fan_count"],
        follows_count: profile["page_follows_count"],
        fan_growth: fanGrowth,
        date: currentDate,
      },
      {
        new: true,
        upsert: true, // Make this update into an upsert
      }
    );

    if (profile["page_posts_count"] > 0) {
      await saveProfileFeeds(profile);
    }
  },

  getPublicProfiles: async (query) => {
    const responseData = [];
    const url = igBaseURL + igSearchBaseURL + query;

    const httpsAgent = new HttpsProxyAgent({
      host: "proxy.apify.com",
      port: "8000",
      auth: "groups-RESIDENTIAL,country-US:SCBD3DD6kySMBHLLpFXAHjXse",
    });

    const axiosWithProxy = axios.create({ httpsAgent });

    const response = await axiosWithProxy.get(url);

    for (const key in response.data.users) {
      if (Object.hasOwnProperty.call(response.data.users, key)) {
        const profileIdData = response.data.users[key].user;
        if (
          profileIdData.is_private == false &&
          response.data.users[key].position <= 10
        ) {
          responseData.push({
            id: profileIdData.pk,
            name: profileIdData.full_name,
            username: profileIdData.username,
            profile_picture_url: profileIdData.profile_pic_url,
          });
        }
      }
    }

    return responseData;
  },

  getHashtagSearch: async (query) => {
    try {
      const update = await lastUpdatedDate(query);

      if (update) {
        const rex =
          /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

        const options = {
          search: query,
          searchContext: "hashtag",
          searchLimit: 1,
          resultsLimit: parseInt(process.env.HASHTAG_RESULT_LIMIT),
          resultsType: "posts",
        };

        const response = await scrapProfileAndPosts(options);

        for (const key in response) {
          if (Object.hasOwnProperty.call(response, key)) {
            const responseFirst = response[key];
            console.log(responseFirst);
            for (const key in responseFirst.latestPosts) {
              if (Object.hasOwnProperty.call(responseFirst.latestPosts, key)) {
                const responseData = responseFirst.latestPosts[key];

                console.log("abc response", responseData);

                const emojis = responseData.caption.match(rex);
                const feedCreatedDate = format(
                  new Date(responseData.timestamp),
                  Enums.DATE_FORMAT
                );

                const { rx_score, type } = await getRxScore(
                  responseData.caption
                );

                await saveEmoji(emojis, responseData, query);

                await Models.SocialFeedTag.findOneAndUpdate(
                  {
                    feed_id: responseData.id,
                    profile_id: responseData.ownerId,
                    social_type: "instagram",
                  },
                  {
                    feed_link: responseData.url, //
                    caption: responseData.caption, //
                    feed_type: responseData.type, //
                    attachment: responseData.displayUrl, //
                    feed_like_count: responseData.likesCount, //
                    feed_comment_count: responseData.commentsCount, //
                    query_tag: responseData.queryTag
                      ? responseData.queryTag
                      : query,
                    hashtags: responseData.hashtags, //
                    mentions: responseData.mentions, //
                    emojis: emojis, //
                    feed_created_date: feedCreatedDate, //
                    sentiment_score: rx_score, //
                    sentiment_type: type, //
                  },
                  {
                    new: true,
                    upsert: true,
                  }
                );
              }
            }
          }
        }
        await Models.SocialTag.findOneAndUpdate(
          {
            query_tag: query,
            is_downloading: true,
          },
          {
            is_downloading: false,
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  },
};
