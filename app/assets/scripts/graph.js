(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Graph = (function() {

    function Graph($el) {
      this.$el = $el;
      this.update = __bind(this.update, this);

      this.delay = __bind(this.delay, this);

      this.color = __bind(this.color, this);

      this.display = __bind(this.display, this);

      this.value = __bind(this.value, this);

      this.arcTween = __bind(this.arcTween, this);

      this.width = 960;
      this.height = 700;
      this.radius = Math.min(this.width, this.height) / 2;
      this.colorTable = d3.scale.category20();
      this.supportColor = {
        y: "#cf9",
        p: "#cf9",
        a: "#cd5",
        u: "#ccc",
        n: "#f99"
      };
      this.$vis = this.$el.attr("width", this.width).attr("height", this.height).append("g").attr("transform", "translate( " + (this.width / 2) + ", " + (this.height / 2) + " )");
      this.$defs = this.$el.append("defs");
      this.partition = d3.layout.partition().sort(null).size([2 * Math.PI, this.radius * this.radius]).value(this.value);
      this.arc = d3.svg.arc().startAngle(function(d) {
        return d.x;
      }).endAngle(function(d) {
        return d.x + d.dx;
      }).innerRadius(function(d) {
        return Math.sqrt(d.y);
      }).outerRadius(function(d) {
        return Math.sqrt(d.y + d.dy);
      });
    }

    Graph.prototype.arcTween = function(a) {
      var i,
        _this = this;
      console.log("a", a, a.x0, a.dx0);
      i = d3.interpolate({
        x: a.x0,
        dx: a.dx0
      }, a);
      return function(t) {
        var b;
        b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return _this.arc(b);
      };
    };

    Graph.prototype.value = function(d, i) {
      var p;
      return d.supportValue;
      if (d.type === "browser") {
        return d.profile.usageLocal;
      } else {
        p = d.profile;
        if (p) {
          return p.usageLocal / p.stat.features.length;
        } else {
          return 1;
        }
      }
    };

    Graph.prototype.display = function(d, i) {
      return null;
    };

    Graph.prototype.color = function(d, i) {
      if (d.depth === 0) {
        return "#ffffff";
      } else if (d.support) {
        return this.supportColor[d.support];
      } else {
        return this.colorTable((d.children ? d : d.parent).name);
      }
    };

    Graph.prototype.id = function(d, i) {
      if (!d.name) {
        return "path-" + i;
      }
      return d.name.split(" ").join("-").toLowerCase();
    };

    Graph.prototype.delay = function(d, i) {
      var ch, chain, delay, depth, index, item, len, p, _i, _len;
      chain = [d];
      p = d;
      while (p = p.parent) {
        chain.unshift(p);
      }
      delay = 0;
      depth = 0;
      for (_i = 0, _len = chain.length; _i < _len; _i++) {
        item = chain[_i];
        p = item.parent;
        if (p) {
          ch = p.children;
          index = ch.indexOf(item);
          len = ch.length;
          item.index = index;
          delay += (index * (500 / len)) + (depth * 250);
        }
        depth++;
      }
      return delay;
    };

    Graph.prototype.update = function(root) {
      var data, gEnter, pathEnter,
        _this = this;
      if (_.isArray(root)) {
        root = {
          name: "root",
          children: root
        };
      }
      root = [owl.deepCopy(root)];
      data = this.$vis.data(root).selectAll("path").data(this.partition.nodes, this.id);
      data.exit().transition().attr("transform", "scale( .5 )").style("opacity", 0).remove();
      gEnter = data.enter().append("g").attr("class", function(d, i) {
        return "arc depth-" + d.depth;
      });
      pathEnter = gEnter.append("path").attr("d", this.arc);
      gEnter.attr("transform", "scale( .5 )").style("opacity", 0).transition().attr("transform", "scale( 1 )").style("opacity", 1).duration(250).delay(this.delay).ease("cubic-in-out");
      return this.$vis.selectAll("g.arc").attr("display", this.display).select("path").attr("fill-rule", "evenodd").style("stroke", "none").style("fill", this.color).on("click", function(d, i) {
        return _this.update(d.children);
      });
    };

    return Graph;

  })();

}).call(this);
