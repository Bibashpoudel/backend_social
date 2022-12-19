const router = require('express').Router();
const { ProfileController } = require('../controllers');

/* GET home page. */
router.post('/profiles/store', ProfileController.store);
router.post('/profiles/pull/:profile_id', ProfileController.pull);
router.get('/social-media/:type/search-profiles/:query', ProfileController.searchSocialMediaProfiles);
router.get('/social-media/:type/search-hashtag/:query', ProfileController.searchHashtag);

module.exports = router;
