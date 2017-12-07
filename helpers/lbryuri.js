const logger = require('winston');
// const { postToStats, sendGoogleAnalytics } = require('../controllers/statsController.js');

module.exports = {
  REGEXP_INVALID_URI: /[^A-Za-z0-9-]/g,
  REGEXP_ADDRESS    : /^b(?=[^0OIl]{32,33})[0-9A-Za-z]{32,33}$/,
  CHANNEL_CHAR      : '@',
  parseIdentifier   : function (identifier) {
    logger.debug('parsing identifier:', identifier);
    const componentsRegex = new RegExp(
      '([^:$#/]*)' + // value (stops at the first separator or end)
      '([:$#]?)([^/]*)' // modifier separator, modifier (stops at the first path separator or end)
    );
    const [proto, value, modifierSeperator, modifier] = componentsRegex
      .exec(identifier)
      .map(match => match || null);
    logger.debug(`${proto}, ${value}, ${modifierSeperator}, ${modifier}`);

    // Validate and process name
    const isChannel = value.startsWith(module.exports.CHANNEL_CHAR);
    const channelName = isChannel ? value : null;
    let claimId;
    if (isChannel) {
      if (!channelName) {
        throw new Error('No channel name after @.');
      }
      const nameBadChars = (channelName).match(module.exports.REGEXP_INVALID_URI);
      if (nameBadChars) {
        throw new Error(`Invalid characters in channel name: ${nameBadChars.join(', ')}.`);
      }
    } else {
      claimId = value;
    }

    // Validate and process modifier
    let channelClaimId;
    if (modifierSeperator) {
      if (!modifier) {
        throw new Error(`No modifier provided after separator ${modifierSeperator}.`);
      }

      if (modifierSeperator === ':') {
        channelClaimId = modifier;
      } else {
        throw new Error(`The ${modifierSeperator} modifier is not currently supported.`);
      }
    }
    return {
      isChannel,
      channelName,
      channelClaimId,
      claimId,
    };
  },
  parseName: function (name) {
    logger.debug('parsing name:', name);
    const componentsRegex = new RegExp(
      '([^:$#/.]*)' + // name (stops at the first modifier)
      '([:$#.]?)([^/]*)' // modifier separator, modifier (stops at the first path separator or end)
    );
    const [proto, claimName, modifierSeperator, modifier] = componentsRegex
      .exec(name)
      .map(match => match || null);
    logger.debug(`${proto}, ${claimName}, ${modifierSeperator}, ${modifier}`);

    // Validate and process name
    if (!claimName) {
      throw new Error('No claim name provided before .');
    }
    const nameBadChars = (claimName).match(module.exports.REGEXP_INVALID_URI);
    if (nameBadChars) {
      throw new Error(`Invalid characters in claim name: ${nameBadChars.join(', ')}.`);
    }
    // Validate and process modifier
    let isServeRequest = false;
    if (modifierSeperator) {
      if (!modifier) {
        throw new Error(`No file extension provided after separator ${modifierSeperator}.`);
      }
      if (modifierSeperator !== '.') {
        throw new Error(`The ${modifierSeperator} modifier is not supported in the claim name`);
      }
      isServeRequest = true;
    }
    return {
      claimName,
      isServeRequest,
    };
  },
};
