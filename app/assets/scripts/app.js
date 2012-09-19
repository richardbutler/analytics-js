(function() {
  var client, config, gaLoaded, runBootstrap, scopes;

  config = null;

  client = null;

  gaLoaded = false;

  scopes = "https://www.googleapis.com/auth/analytics.readonly";

  runBootstrap = function(profiles) {
    var bootstrap;
    bootstrap = new Bootstrap();
    return bootstrap.run(function(err, result) {
      var browser, browserName, browsers, categories, category, categoryTable, feature, featureCompatibility, featureKey, graphData, highlight, item, output, profile, statusKey, subCategory, subItem, support, totalCompatibility, totalLocal, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      console.log("Bootstrap Complete.", result, profiles);
      output = new UsageProfiler(profiles).profile(result);
      output = new CompatibilityProfiler(result.features).profile(output);
      highlight = null;
      graphData = [];
      browsers = {};
      totalCompatibility = {};
      totalLocal = 0;
      for (featureKey in result.features) {
        totalCompatibility[featureKey] = {};
        for (statusKey in CompatibilityProfiler.SUPPORT) {
          totalCompatibility[featureKey][statusKey] = 0;
        }
      }
      for (_i = 0, _len = output.length; _i < _len; _i++) {
        profile = output[_i];
        browserName = profile.stat.agent.browser;
        browser = "" + browserName + " " + profile.media;
        if (!browsers.hasOwnProperty(browser)) {
          browsers[browser] = {
            name: browser,
            type: "browser",
            profile: profile,
            children: [],
            usageLocal: 0,
            usageGlobal: 0
          };
        }
        totalLocal += profile.usageLocal;
        for (featureKey in result.features) {
          feature = profile.stat.featureTable[featureKey];
          totalCompatibility[featureKey][feature.support] += profile.usageLocal;
        }
        item = {
          name: "" + browser + " " + profile.stat.versionRef,
          type: "browser",
          profile: profile
        };
        if (highlight) {
          feature = profile.stat.featureTable[highlight];
          item.support = feature.support;
          item.supportValue = feature.supportValue;
          console.log(item.supportValue, item.support, item.name);
          if ((_ref = feature.support) !== "y" && _ref !== "a" && _ref !== "p") {
            console.log("Not supported by", browser, profile.stat.versionRef);
          }
        } else {
          item.children = profile.stat.features;
        }
        browsers[browser].usageLocal += profile.usageLocal;
        browsers[browser].usageGlobal += profile.usageGlobal;
        browsers[browser].children.push(item);
      }
      categories = [];
      categoryTable = {};
      for (category in result.categories) {
        item = {
          name: category,
          children: []
        };
        _ref1 = result.categories[category];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          subCategory = _ref1[_j];
          subItem = {
            name: subCategory,
            children: []
          };
          item.children.push(subItem);
          categoryTable[subCategory] = subItem;
        }
        categories.push(item);
      }
      for (featureKey in result.features) {
        feature = result.features[featureKey];
        featureCompatibility = totalCompatibility[featureKey];
        item = {
          name: featureKey,
          children: []
        };
        for (support in featureCompatibility) {
          value = featureCompatibility[support];
          if (value > 0) {
            item.children.push({
              name: CompatibilityProfiler.SUPPORT[support],
              support: support,
              supportValue: value
            });
          }
        }
        _ref2 = feature.categories;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          category = _ref2[_k];
          categoryTable[category].children.push(item);
        }
      }
      console.log("graphData", categories);
      this.graph = new Graph(d3.select("#canvas"));
      return this.graph.update(categories);
    });
  };

  d3.json("/config", function(result) {
    config = result;
    client = new GAClient(config.ga.apiKey, config.ga.clientId, scopes);
    client.on(GAClient.RESULT, runBootstrap);
    if (gaLoaded) {
      return client.start();
    }
  });

  this.gaLoadComplete = function() {
    gaLoaded = true;
    if (client) {
      return client.start();
    }
  };

}).call(this);
