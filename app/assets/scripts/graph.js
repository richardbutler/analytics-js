(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Graph = (function() {

    function Graph($el) {
      this.$el = $el;
      this.update = __bind(this.update, this);

      this.color = __bind(this.color, this);

      this.display = __bind(this.display, this);

      this.value = __bind(this.value, this);

      this.width = 960;
      this.height = 700;
      this.radius = Math.min(this.width, this.height) / 2;
      this.colorTable = d3.scale.category20c();
      this.supportColor = {
        y: "#cf9",
        p: "#cf9",
        a: "#cd5",
        u: "#ccc",
        n: "#f99"
      };
      this.vis = this.$el.append("svg").attr("width", this.width).attr("height", this.height).append("g").attr("transform", "translate( " + (this.width / 2) + ", " + (this.height / 2) + " )");
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

    Graph.prototype.value = function(d, i) {
      var p;
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
      if (d.depth) {
        return null;
      } else {
        return "none";
      }
    };

    Graph.prototype.color = function(d, i) {
      if (d.type === "browser") {
        return this.colorTable((d.children ? d : d.parent).name);
      } else {
        return this.supportColor[d.support] || "#ffffff";
      }
    };

    Graph.prototype.update = function(data) {
      this.data = data;
      console.log("graph update", this.data);
      return this.vis.data([
        {
          children: this.data
        }
      ]).selectAll("path").data(this.partition.nodes).enter().append("path").attr("d", this.arc).attr("fill-rule", "evenodd").style("stroke", "none").style("fill", this.color).append("title").text(function(d, i) {
        return d.name;
      });
    };

    return Graph;

  })();

}).call(this);
