(function() {
  var dateRange, dimensions, metrics,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  dimensions = ["operatingSystem", "browser", "browserVersion"];

  metrics = ["visits"];

  dateRange = {
    start: "2010-01-01",
    end: "2012-09-01"
  };

  this.GAClient = (function(_super) {

    __extends(GAClient, _super);

    GAClient.READY = "ga:ready";

    GAClient.AUTHORISED = "ga:authorised";

    GAClient.RESULT = "ga:result";

    GAClient.NOT_SET = "(not set)";

    function GAClient(apiKey, clientId, scopes) {
      this.apiKey = apiKey;
      this.clientId = clientId;
      this.scopes = scopes;
      this.compileResult = __bind(this.compileResult, this);

      this.handleCoreReportingResult = __bind(this.handleCoreReportingResult, this);

      this.queryCoreReportingApi = __bind(this.queryCoreReportingApi, this);

      this.toMetricString = __bind(this.toMetricString, this);

      this.handleProfiles = __bind(this.handleProfiles, this);

      this.queryProfiles = __bind(this.queryProfiles, this);

      this.webPropertiesHandler = __bind(this.webPropertiesHandler, this);

      this.queryWebProperties = __bind(this.queryWebProperties, this);

      this.accountsHandler = __bind(this.accountsHandler, this);

      this.queryAccounts = __bind(this.queryAccounts, this);

      this.loadClient = __bind(this.loadClient, this);

      this.authHandler = __bind(this.authHandler, this);

      this.authorise = __bind(this.authorise, this);

      this.start = __bind(this.start, this);

      GAClient.__super__.constructor.call(this);
    }

    GAClient.prototype.start = function() {
      console.log("Starting.");
      this.emit(GAClient.READY);
      gapi.client.setApiKey(this.apiKey);
      return setTimeout(this.authorise, 1);
    };

    GAClient.prototype.authorise = function(immediate) {
      if (immediate == null) {
        immediate = true;
      }
      console.log("Authorising.");
      return gapi.auth.authorize({
        client_id: this.clientId,
        scope: this.scopes,
        immediate: immediate
      }, this.authHandler);
    };

    GAClient.prototype.authHandler = function(auth) {
      if (auth) {
        console.log("Authorised.");
        this.emit(GAClient.AUTHORISED);
        return this.loadClient();
      } else {
        console.log("Not authorised.");
        return this.authorise(false);
      }
    };

    GAClient.prototype.loadClient = function() {
      console.log("Loading Client.");
      return gapi.client.load("analytics", "v3", this.queryAccounts);
    };

    GAClient.prototype.queryAccounts = function() {
      console.log("Querying Accounts.");
      return gapi.client.analytics.management.accounts.list().execute(this.accountsHandler);
    };

    GAClient.prototype.accountsHandler = function(result) {
      var firstAccountId;
      console.log("Got Accounts.", result);
      if (result.code) {
        return console.log("There was an error querying accounts: " + result.message);
      } else {
        if (result && result.items && result.items.length) {
          firstAccountId = result.items[0].id;
          return this.queryWebProperties(firstAccountId);
        } else {
          return console.log("No accounts found for this user.");
        }
      }
    };

    GAClient.prototype.queryWebProperties = function(accountId) {
      console.log("Querying Web Properties.");
      return gapi.client.analytics.management.webproperties.list({
        accountId: accountId
      }).execute(this.webPropertiesHandler);
    };

    GAClient.prototype.webPropertiesHandler = function(result) {
      var firstAccountId, firstItem, firstWebPropertyId;
      console.log("Got Web Properties.", result);
      if (result.code) {
        return console.log("There was an error querying webproperties: " + result.message);
      } else {
        if (result && result.items && result.items.length) {
          firstItem = result.items[0];
          firstAccountId = firstItem.accountId;
          firstWebPropertyId = firstItem.id;
          return this.queryProfiles(firstAccountId, firstWebPropertyId);
        } else {
          return console.log("No webproperties found for this user.");
        }
      }
    };

    GAClient.prototype.queryProfiles = function(accountId, webPropertyId) {
      console.log("Querying Profiles.");
      return gapi.client.analytics.management.profiles.list({
        accountId: accountId,
        webPropertyId: webPropertyId
      }).execute(this.handleProfiles);
    };

    GAClient.prototype.handleProfiles = function(result) {
      var firstItem, firstProfileId;
      console.log("Got Profiles.", result);
      if (result.code) {
        return console.log("There was an error querying profiles: " + results.message);
      } else {
        if (result && result.items && result.items.length) {
          firstItem = result.items[0];
          firstProfileId = firstItem.id;
          return this.queryCoreReportingApi(firstProfileId);
        } else {
          return console.log("No profiles found for this user.");
        }
      }
    };

    GAClient.prototype.toMetricString = function(items) {
      return _.map(items, function(item) {
        return "ga:" + item;
      }).join(",");
    };

    GAClient.prototype.queryCoreReportingApi = function(profileId) {
      console.log("Querying Core Reporting API.");
      return gapi.client.analytics.data.ga.get({
        ids: "ga:" + profileId,
        "start-date": dateRange.start,
        "end-date": dateRange.end,
        dimensions: this.toMetricString(dimensions),
        metrics: this.toMetricString(metrics)
      }).execute(this.handleCoreReportingResult);
    };

    GAClient.prototype.handleCoreReportingResult = function(result) {
      console.log("Got Core Reporting Result:", result);
      if (result.error) {
        return console.log("There was an error querying core reporting API: " + results.message);
      } else {
        return this.compileResult(result);
      }
    };

    GAClient.prototype.compileResult = function(result) {
      var agent, browserNameParts, browserVersion, i, key, keys, profile, profiles, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      if (result.rows && result.rows.length) {
        profiles = [];
        keys = dimensions.concat(metrics);
        _ref = result.rows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          agent = _ref[_i];
          profile = {};
          i = 0;
          for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
            key = keys[_j];
            profile[key] = agent[i];
            i++;
          }
          if (profile.operatingSystem === GAClient.NOT_SET) {
            continue;
          }
          if (profile.browserVersion === GAClient.NOT_SET) {
            browserNameParts = profile.browser.split(" ");
            profile.browserVersion = browserNameParts.pop();
            profile.browser = browserNameParts.join(" ");
          }
          browserVersion = profile.browserVersion.split(".");
          if ((_ref1 = profile.operatingSystem) === "iPhone" || _ref1 === "iPad") {
            profile.operatingSystem = "iOS";
          }
          profile.browserMajorVersion = Number(browserVersion.shift());
          profile.browserMinorVersion = Number(browserVersion.shift()) || 0;
          profile.browserMinorVersion = Number(String(profile.browserMinorVersion).charAt(0));
          profile.media = (_ref2 = profile.operatingSystem) === "Windows" || _ref2 === "Macintosh" || _ref2 === "Linux" ? "desktop" : "mobile";
          if (profile.browser.indexOf("Safari") >= 0) {
            this.fixSafariBrowserVersion(profile);
          }
          profiles.push(profile);
        }
        return this.emit(GAClient.RESULT, profiles);
      } else {
        return console.log("No results found");
      }
    };

    GAClient.prototype.fixSafariBrowserVersion = function(profile) {
      var apply, browserVersion, major, minor;
      major = profile.browserMajorVersion;
      minor = profile.browserMinorVersion;
      if (String(major).length > 3) {
        major = String(major).substr(1, 3);
      }
      browserVersion = Number([major, minor].join("."));
      apply = function(version) {
        return profile.browserMajorVersion = version[0], profile.browserMinorVersion = version[1], version;
      };
      if (browserVersion <= 525) {
        return apply([3, 2]);
      }
      if (browserVersion > 525 && browserVersion < 530.18) {
        return apply([4, 0]);
      }
      if (browserVersion === 530.18) {
        return apply([4, 1]);
      }
      if (browserVersion > 530.18 && browserVersion <= 533.15) {
        return apply([4, 2]);
      }
      if (browserVersion > 533.15 && browserVersion < 534) {
        return apply([5, 0]);
      }
      if (browserVersion >= 534 && browserVersion <= 535) {
        return apply([5, 1]);
      }
      return apply([6, 0]);
    };

    return GAClient;

  })(EventEmitter);

}).call(this);
