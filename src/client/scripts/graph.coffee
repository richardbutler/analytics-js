class @Graph

  constructor: ( @$el ) ->
  
    @width = 960
    @height = 700
    @radius = Math.min( @width, @height ) / 2
    @colorTable = d3.scale.category20()
    
    @supportColor =
      y: "#cf9"
      p: "#cf9" #polyfill
      a: "#cd5"
      u: "#ccc"
      n: "#f99"
  
    @$vis = @$el
      .attr( "width", @width )
      .attr( "height", @height )
      .append( "g" )
        .attr( "transform", "translate( #{ @width / 2 }, #{ @height / 2 } )" )
    
    @$defs = @$el.append( "defs" )
    
    @partition = d3.layout.partition()
      .sort( null )
      .size( [ 2 * Math.PI, @radius * @radius ] )
      .value( @value )
    
    @arc = d3.svg.arc()
      .startAngle( ( d ) -> d.x )
      .endAngle( ( d ) -> d.x + d.dx )
      .innerRadius( ( d ) -> Math.sqrt d.y )
      .outerRadius( ( d ) -> Math.sqrt d.y + d.dy )
  
  arcTween: ( a ) =>
    console.log "a", a, a.x0, a.dx0
  
    i = d3.interpolate
      x: a.x0
      dx: a.dx0
    , a
   
    ( t ) =>
      b = i t
      a.x0 = b.x
      a.dx0 = b.dx
      @arc b
  
  value: ( d, i ) =>
    return d.supportValue
  
    if d.type is "browser"
      d.profile.usageLocal
    else
      p = d.profile
      if p then p.usageLocal / p.stat.features.length else 1
  
  display: ( d, i ) =>
  
    #if d.support is "n" then "none" else null
    null
    
  color: ( d, i ) =>
  
    if d.depth is 0
      "#ffffff"
    else if d.support
      @supportColor[ d.support ]
    else
      @colorTable ( if d.children then d else d.parent ).name
  
  id: ( d, i ) ->
    return "path-#{ i }" if !d.name
    #"#{ d.profile.stat.browser }:#{ d.profile.stat.versionRef }"
    d.name.split( " " ).join( "-" ).toLowerCase()
  
  delay: ( d, i ) =>
    chain = [ d ]
    p = d
    
    while p = p.parent
      chain.unshift p
    
    delay = 0  
    depth = 0
    
    for item in chain
      p = item.parent
      if p
        ch = p.children
        index = ch.indexOf item
        len = ch.length
        item.index = index
        delay += ( index * ( 500 / len ) ) + ( depth * 250 )
      depth++
  
    return delay
  
  update: ( root ) =>
  
    if _.isArray( root )
      root = { name: "root", children: root }
    
    root = [ owl.deepCopy( root ) ]
  
    data = @$vis.data( root )
      .selectAll( "path" )
      .data( @partition.nodes, @id )
      
    data
      .exit()
      .transition()
        .attr( "transform", "scale( .5 )" )
        .style( "opacity", 0 )
      .remove()
    
    gEnter = data
      .enter()
      .append( "g" )
        .attr( "class", ( d, i ) -> "arc depth-#{ d.depth }" )
      
    pathEnter = gEnter
      .append( "path" )
        .attr( "d", @arc )
          
    gEnter
      .attr( "transform", "scale( .5 )" )
      .style( "opacity", 0 )
      .transition()
        .attr( "transform", "scale( 1 )" )
        .style( "opacity", 1 )
        .duration( 250 )
        .delay( @delay )
        .ease( "cubic-in-out" )
    
    @$vis
      .selectAll( "g.arc" )
        .attr( "display", @display )
        .select( "path" )
          .attr( "fill-rule", "evenodd" )
          .style( "stroke", "none" )
          .style( "fill", @color )
          .on( "click", ( d, i ) => @update( d.children ) )
          #.transition()
          #  .attrTween( @arcTween )
          #  .duration( 500 )
          #  .ease( "cubic-in-out" )
          #.append( "title" )
          #  .text( ( d, i ) -> d.name )

