apiKey = "AIzaSyCDXsAKkCnLZ0TLjrhekouOkyXxE2MkZvw"
clientId = "196377251290.apps.googleusercontent.com"
scopes = "https://www.googleapis.com/auth/analytics.readonly"

runBootstrap = ( profiles ) ->
  bootstrap = new Bootstrap()
  bootstrap.run ( err, result ) ->
    
    console.log "Bootstrap Complete.", result, profiles
    
    output = new UsageProfiler( profiles ).profile( result )
    output = new CompatibilityProfiler( result.features ).profile( output )
    
    # Show as tree structure by version breakdown
    # Green block: supported, Red block, unsupported
    
    highlight = null#"css-mediaqueries"
    graphData = []
    browsers = {}
    
    totalCompatibility = {}
    totalLocal = 0
    
    for featureKey of result.features
      totalCompatibility[ featureKey ] = {}
      for statusKey of CompatibilityProfiler.SUPPORT
        totalCompatibility[ featureKey ][ statusKey ] = 0
    
    for profile in output
      browserName = profile.stat.agent.browser
      browser = "#{ browserName } #{ profile.media }"
      
      if !browsers.hasOwnProperty( browser )
        browsers[ browser ] = 
          name: browser
          type: "browser"
          profile: profile
          children: []
          usageLocal: 0
          usageGlobal: 0
      
      totalLocal += profile.usageLocal
      
      for featureKey of result.features
        feature = profile.stat.featureTable[ featureKey ]
        totalCompatibility[ featureKey ][ feature.support ] += profile.usageLocal
      
      item =
        name: "#{ browser } #{ profile.stat.versionRef }"
        type: "browser"
        profile: profile
        
      if highlight
        feature = profile.stat.featureTable[ highlight ]
        item.support = feature.support
        item.supportValue = feature.supportValue
        
        console.log item.supportValue, item.support, item.name
        
        if feature.support not in [ "y", "a", "p" ]
          console.log "Not supported by", browser, profile.stat.versionRef
      else
        item.children = profile.stat.features
      
      browsers[ browser ].usageLocal += profile.usageLocal
      browsers[ browser ].usageGlobal += profile.usageGlobal
      browsers[ browser ].children.push item
    
    #for browser of browsers
    #  graphData.push browsers[ browser ]
    #  
    #  if highlight
    #    browsers[ browser ].children = browsers[ browser ].children.sort ( a, b ) ->
    #      a1 = a.supportValue
    #      b1 = b.supportValue
    #      a1 - b1
    
    categories = []
    categoryTable = {}
    
    for category of result.categories
      item =
        name: category
        children: []
      
      for subCategory in result.categories[ category ]
        subItem =
          name: subCategory
          children: []
        item.children.push subItem
        categoryTable[ subCategory ] = subItem
    
      categories.push item
    
    for featureKey of result.features
      feature = result.features[ featureKey ]
      featureCompatibility = totalCompatibility[ featureKey ]
      
      item =
        name: featureKey
        children: []
      
      for support of featureCompatibility
        value = featureCompatibility[ support ]
        if value > 0
          item.children.push
            name: CompatibilityProfiler.SUPPORT[ support ]
            support: support
            supportValue: value
      
      for category in feature.categories
        categoryTable[ category ].children.push item
    
    console.log "graphData", categories
    
    @graph = new Graph( d3.select( "#canvas" ) )
    @graph.update categories

client = new GAClient apiKey, clientId, scopes
client.on GAClient.RESULT, runBootstrap

@gaLoadComplete = ->
  client.start()
