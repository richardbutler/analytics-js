(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Bootstrap = (function() {

    function Bootstrap() {
      this.parseData = __bind(this.parseData, this);

      this.eachVersion = __bind(this.eachVersion, this);

      this.eachAgent = __bind(this.eachAgent, this);

      this.toVersionHash = __bind(this.toVersionHash, this);

      this.getCategories = __bind(this.getCategories, this);

      this.getFeatures = __bind(this.getFeatures, this);

      this.getAgents = __bind(this.getAgents, this);

      this.run = __bind(this.run, this);

    }

    Bootstrap.prototype.run = function(done) {
      return async.series([this.getAgents, this.getFeatures, this.getCategories, this.parseData], function(err, results) {
        return done(err, results.pop());
      });
    };

    Bootstrap.prototype.getAgents = function(done) {
      var _this = this;
      return d3.json("/api/agents", function(data) {
        _this.agents = data;
        return done(null, data);
      });
    };

    Bootstrap.prototype.getFeatures = function(done) {
      var _this = this;
      return d3.json("/api/data", function(data) {
        _this.features = data;
        return done(null, data);
      });
    };

    Bootstrap.prototype.getCategories = function(done) {
      var _this = this;
      return d3.json("/api/cats", function(data) {
        _this.categories = data;
        return done(null, data);
      });
    };

    Bootstrap.prototype.toVersionHash = function(agent, version) {
      return [agent, version].join(":");
    };

    Bootstrap.prototype.eachAgent = function(func) {
      var agent, agentName, _results;
      _results = [];
      for (agentName in this.agents) {
        agent = this.agents[agentName];
        _results.push(func(agentName, agent));
      }
      return _results;
    };

    Bootstrap.prototype.eachVersion = function(func) {
      var _this = this;
      return this.eachAgent(function(agentName, agent) {
        var version, versionHash, _i, _len, _ref, _results;
        _ref = agent.versions;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          version = _ref[_i];
          if (!version) {
            continue;
          }
          versionHash = _this.toVersionHash(agentName, version);
          _results.push(func(agent, version, versionHash));
        }
        return _results;
      });
    };

    Bootstrap.prototype.parseData = function(done) {
      var agent, agentKey, agentStats, agents, feature, featureCount, featureName, output, version, versionHash, versionRef, versions, _i, _ref, _ref1, _ref2;
      agentStats = {};
      agents = [];
      this.eachVersion(function(agent, version, hash) {
        return agentStats[hash] = 0;
      });
      for (featureName in this.features) {
        feature = this.features[featureName];
        for (agent in feature.stats) {
          for (version in feature.stats[agent]) {
            versionHash = this.toVersionHash(agent, version);
            if (feature.stats[agent][version] === "y") {
              agentStats[versionHash]++;
            }
          }
        }
      }
      output = {};
      featureCount = _.keys(this.features).length;
      for (versionHash in agentStats) {
        _ref = versionHash.split(":"), agentKey = _ref[0], versionRef = _ref[1];
        versions = versionRef.split("-");
        agent = this.agents[agentKey];
        if (!output.hasOwnProperty(agentKey)) {
          output[agentKey] = {};
        }
        for (version = _i = _ref1 = versions[0], _ref2 = versions[versions.length - 1]; _ref1 <= _ref2 ? _i <= _ref2 : _i >= _ref2; version = _ref1 <= _ref2 ? ++_i : --_i) {
          output[agentKey][version] = {
            agent: agent,
            version: Number(version),
            versionRef: versionRef,
            value: agentStats[versionHash] / featureCount
          };
        }
      }
      return done(null, {
        agents: this.agents,
        features: this.features,
        categories: this.categories,
        stats: output
      });
    };

    return Bootstrap;

  })();

}).call(this);
