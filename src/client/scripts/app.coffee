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
    
    graphData = []
    browsers = {}
    
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
      
      browsers[ browser ].usageLocal += profile.usageLocal
      browsers[ browser ].usageGlobal += profile.usageGlobal
      browsers[ browser ].children.push
        name: "#{ browserName } #{ profile.stat.versionRef }"
        type: "browser"
        profile: profile
        children: profile.stat.features
    
    for browser of browsers
      graphData.push browsers[ browser ]
    
    @graph = new Graph( d3.select( "#canvas" ) )
    @graph.update graphData

client = new GAClient apiKey, clientId, scopes
client.on GAClient.RESULT, runBootstrap

@gaLoadComplete = ->
  client.start()
