(function() {

  this.CompatibilityProfiler = (function() {

    CompatibilityProfiler.SUPPORT = {
      y: "full",
      p: "polyfill",
      a: "partial",
      u: "unknown",
      n: "unsupported"
    };

    CompatibilityProfiler.SUPPORT_VALUE = {
      y: 5,
      p: 4,
      a: 3,
      u: 2,
      n: 1
    };

    function CompatibilityProfiler(features) {
      this.features = features;
    }

    CompatibilityProfiler.prototype.profile = function(profiles) {
      var feature, featureKey, profile, stats, support, version, _i, _len;
      for (_i = 0, _len = profiles.length; _i < _len; _i++) {
        profile = profiles[_i];
        profile.stat.features = [];
        for (featureKey in this.features) {
          feature = this.features[featureKey];
          stats = feature.stats[profile.stat.agent.key];
          version = profile.stat.versionRef;
          support = stats[version].split(" ");
          profile.stat.features.push({
            name: feature.title,
            key: featureKey,
            support: support[0],
            supportValue: CompatibilityProfiler.SUPPORT_VALUE[support[0]],
            profile: profile
          });
        }
        profile.stat.features = profile.stat.features.sort(function(a, b) {
          return b.supportValue - a.supportValue;
        });
      }
      return profiles;
    };

    return CompatibilityProfiler;

  })();

}).call(this);
