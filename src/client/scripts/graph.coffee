class @Graph

  constructor: ( @$el ) ->
  
    @width = 960
    @height = 700
    @radius = Math.min( @width, @height ) / 2
    @colorTable = d3.scale.category20c()
    
    @supportColor =
      y: "#cf9"
      p: "#cf9" #polyfill
      a: "#cd5"
      u: "#ccc"
      n: "#f99"
  
    @vis = @$el
      .append( "svg" )
        .attr( "width", @width )
        .attr( "height", @height )
        .append( "g" )
          .attr( "transform", "translate( #{ @width / 2 }, #{ @height / 2 } )" )
          
    @partition = d3.layout.partition()
      .sort( null )
      .size( [ 2 * Math.PI, @radius * @radius ] )
      .value( @value )
    
    @arc = d3.svg.arc()
      .startAngle( ( d ) -> d.x )
      .endAngle( ( d ) -> d.x + d.dx )
      .innerRadius( ( d ) -> Math.sqrt d.y )
      .outerRadius( ( d ) -> Math.sqrt d.y + d.dy )
  
  value: ( d, i ) =>
    if d.type is "browser"
      d.profile.usageLocal
    else
      p = d.profile
      if p then p.usageLocal / p.stat.features.length else 1
  
  display: ( d, i ) =>
  
    if d.support is "n" then "none" else null
    
  color: ( d, i ) =>
  
    if d.depth is 0
      "#ffffff"
    else if d.support
      @supportColor[ d.support ]
    else
      @colorTable ( if d.children then d else d.parent ).name
    
  update: ( data ) =>
  
    @vis.data( [ children: data ] )
      .selectAll( "path" )
      .data( @partition.nodes )
      .enter()
        .append( "path" )
          .attr( "d", @arc )
          .attr( "display", @display )
          .attr( "fill-rule", "evenodd" )
          #.style( "stroke", "#fff" )
          .style( "stroke", "none" )
          .style( "fill", @color )
          .append( "title" )
            .text( ( d, i ) -> d.name )
  
