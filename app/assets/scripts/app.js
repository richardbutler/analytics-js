(function() {
  var apiKey, client, clientId, runBootstrap, scopes;

  apiKey = "AIzaSyCDXsAKkCnLZ0TLjrhekouOkyXxE2MkZvw";

  clientId = "196377251290.apps.googleusercontent.com";

  scopes = "https://www.googleapis.com/auth/analytics.readonly";

  runBootstrap = function(profiles) {
    var bootstrap;
    bootstrap = new Bootstrap();
    return bootstrap.run(function(err, result) {
      var browser, browserName, browsers, graphData, output, profile, _i, _len;
      console.log("Bootstrap Complete.", result, profiles);
      output = new UsageProfiler(profiles).profile(result);
      output = new CompatibilityProfiler(result.features).profile(output);
      graphData = [];
      browsers = {};
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
        browsers[browser].usageLocal += profile.usageLocal;
        browsers[browser].usageGlobal += profile.usageGlobal;
        browsers[browser].children.push({
          name: "" + browserName + " " + profile.stat.versionRef,
          type: "browser",
          profile: profile,
          children: profile.stat.features
        });
      }
      for (browser in browsers) {
        graphData.push(browsers[browser]);
      }
      this.graph = new Graph(d3.select("#canvas"));
      return this.graph.update(graphData);
    });
  };

  client = new GAClient(apiKey, clientId, scopes);

  client.on(GAClient.RESULT, runBootstrap);

  this.gaLoadComplete = function() {
    return client.start();
  };

}).call(this);
