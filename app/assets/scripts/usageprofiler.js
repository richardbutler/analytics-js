(function() {

  this.UsageProfiler = (function() {

    UsageProfiler.MAPPINGS = {
      "Mozilla": "Firefox",
      "Internet Explorer": "IE",
      "BlackBerry": "Blackberry Browser"
    };

    function UsageProfiler(profiles) {
      this.profiles = profiles;
    }

    UsageProfiler.prototype.findAgentFor = function(profile, agents) {
      var agent, agentName, agentsForMedia, mapping, profileBrowserName;
      agentsForMedia = [];
      profileBrowserName = profile.browser;
      for (mapping in UsageProfiler.MAPPINGS) {
        if (profileBrowserName.toLowerCase().indexOf(mapping.toLowerCase()) >= 0) {
          profileBrowserName = UsageProfiler.MAPPINGS[mapping];
          break;
        }
      }
      for (agentName in agents) {
        agent = agents[agentName];
        agent.key = agentName;
        if (agent.type === profile.media) {
          agentsForMedia.push(agent);
        }
      }
      agents = _(agentsForMedia).select(function(agent) {
        var b1, b2;
        b1 = _.first(agent.browser.split(" "));
        b2 = _.first(profileBrowserName.split(" "));
        return agent.browser.indexOf(b2) >= 0 || profileBrowserName.indexOf(b1) >= 0;
      });
      return agents[0];
    };

    UsageProfiler.prototype.getStatFor = function(stats, version, majorVersion) {
      var currStat, loops, nextStat, oldest, stat, statVersions;
      stat = stats[version] || stats[majorVersion];
      statVersions = _.keys(stats).sort(function(a, b) {
        return Number(a) - Number(b);
      });
      if (!stat) {
        currStat = oldest = statVersions[0];
        loops = 0;
        while (currStat && version > currStat) {
          nextStat = statVersions[statVersions.indexOf(currStat) + 1];
          if (version < nextStat || loops > 20) {
            break;
          }
          currStat = nextStat;
          loops++;
        }
        if (currStat) {
          stat = stats[currStat];
        } else {
          stat = stats[oldest];
        }
      }
      return stat;
    };

    UsageProfiler.prototype.profile = function(result) {
      var agent, hash, hashes, item, key, output, profile, profilesForHash, stat, totalVisits, typicalItem, value, version, _i, _j, _len, _len1, _ref;
      totalVisits = 0;
      _ref = this.profiles;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        profile = _ref[_i];
        version = Number([profile.browserMajorVersion, profile.browserMinorVersion].join("."));
        agent = this.findAgentFor(profile, result.agents);
        if (!agent) {
          console.log("NO AGENT", profile, result.agents);
        }
        stat = this.getStatFor(result.stats[agent.key], version, profile.browserMajorVersion);
        if (!stat) {
          console.log("NO STAT", profile, result.stats[agent.key]);
        }
        if (!stat.hasOwnProperty("visits")) {
          stat.visits = 0;
        }
        stat.visits += parseInt(profile.visits);
        totalVisits += parseInt(profile.visits);
        delete profile.visits;
        profile.stat = stat;
        profile.hash = "" + profile.stat.agent.key + ":" + profile.stat.version + ":" + profile.media;
      }
      hashes = _.unique(_.pluck(this.profiles, "hash")).sort();
      output = [];
      for (_j = 0, _len1 = hashes.length; _j < _len1; _j++) {
        hash = hashes[_j];
        profilesForHash = _.select(this.profiles, function(profile) {
          return profile.hash === hash;
        });
        typicalItem = profilesForHash[0];
        item = {};
        for (key in typicalItem) {
          value = typicalItem[key];
          item[key] = value;
        }
        item.usageGlobal = item.stat.agent.usage_global[item.stat.versionRef];
        item.usageLocal = (item.stat.visits / totalVisits) * 100;
        output.push(item);
      }
      output = output.sort(function(a, b) {
        return b.usageLocal - a.usageLocal;
      });
      return output;
    };

    return UsageProfiler;

  })();

}).call(this);
