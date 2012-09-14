class @Bootstrap

  run: ( done ) =>
    async.series [ @getAgents, @getFeatures, @getCategories, @parseData ], ( err, results ) -> done err, results.pop()
    
  getAgents: ( done ) =>
    d3.json "/api/agents", ( data ) =>
      @agents = data
      done null, data

  getFeatures: ( done ) =>
    d3.json "/api/data", ( data ) =>
      @features = data
      done null, data

  getCategories: ( done ) =>
    d3.json "/api/cats", ( data ) =>
      @categories = data
      done null, data
  
  toVersionHash: ( agent, version ) =>
    [ agent, version ].join ":"
  
  eachAgent: ( func ) =>
    for agentName of @agents
      agent = @agents[ agentName ]
      func( agentName, agent )
  
  eachVersion: ( func ) =>
    @eachAgent ( agentName, agent ) =>
      for version in agent.versions
        continue if !version
        versionHash = @toVersionHash agentName, version
        func( agent, version, versionHash )
  
  parseData: ( done ) =>
    agentStats = {}
    agents = []
    
    @eachVersion ( agent, version, hash ) ->
      agentStats[ hash ] = 0
    
    for featureName of @features
      feature = @features[ featureName ]
      for agent of feature.stats
        for version of feature.stats[ agent ]
          versionHash = @toVersionHash agent, version
          agentStats[ versionHash ]++ if feature.stats[ agent ][ version ] is "y"
    
    output = {}
    featureCount = _.keys( @features ).length
    
    for versionHash of agentStats
      [ agentKey, versionRef ] = versionHash.split ":"
      versions = versionRef.split "-"
      agent = @agents[ agentKey ]
      
      if !output.hasOwnProperty( agentKey )
        output[ agentKey ] = {}
      
      for version in [ versions[ 0 ] .. versions[ versions.length - 1 ] ]
        output[ agentKey ][ version ] =
          agent: agent
          version: Number( version )
          versionRef: versionRef
          value: agentStats[ versionHash ] / featureCount
    
    #output.sort ( a, b ) -> a.value - b.value
    
    #for thing in output
    #  console.log thing.agent, Math.round( thing.value * 100 )
    
    done null,
      agents: @agents
      features: @features
      categories: @categories
      stats: output
