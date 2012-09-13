class @UsageProfiler

  @MAPPINGS:
    "Mozilla": "Firefox"
    "Internet Explorer": "IE"
    "BlackBerry": "Blackberry Browser"
  
  constructor: ( @profiles ) ->
  
  findAgentFor: ( profile, agents ) ->
    agentsForMedia = []
    profileBrowserName = profile.browser
    
    for mapping of UsageProfiler.MAPPINGS
      if profileBrowserName.toLowerCase().indexOf( mapping.toLowerCase() ) >= 0
        profileBrowserName = UsageProfiler.MAPPINGS[ mapping ]
        break
  
    for agentName of agents
      agent = agents[ agentName ]
      agent.key = agentName
      agentsForMedia.push agent if agent.type is profile.media
  
    agents = _( agentsForMedia ).select ( agent ) ->
      b1 = _.first agent.browser.split( " " )
      b2 = _.first profileBrowserName.split( " " )
      agent.browser.indexOf( b2 ) >= 0 or profileBrowserName.indexOf( b1 ) >= 0
    
    return agents[ 0 ]
    
  getStatFor: ( stats, version, majorVersion ) ->
    stat = stats[ version ] || stats[ majorVersion ]
    statVersions = _.keys( stats ).sort ( a, b ) -> Number( a ) - Number( b )
    
    if !stat
      currStat = oldest = statVersions[ 0 ]
      loops = 0
      
      while currStat and version > currStat
        nextStat = statVersions[ statVersions.indexOf( currStat ) + 1 ]
        break if version < nextStat or loops > 20
        currStat = nextStat
        loops++
      
      if currStat
        stat = stats[ currStat ]
      else
        stat = stats[ oldest ]
        
    return stat
  
  profile: ( result ) ->
    totalVisits = 0
    
    for profile in @profiles
      version = Number( [ profile.browserMajorVersion, profile.browserMinorVersion ].join( "." ) )
      agent = @findAgentFor profile, result.agents
      
      if !agent
        console.log "NO AGENT", profile, result.agents
      
      stat = @getStatFor result.stats[ agent.key ], version, profile.browserMajorVersion
      
      if !stat
        console.log "NO STAT", profile, result.stats[ agent.key ]
      
      stat.visits = 0 if !stat.hasOwnProperty( "visits" )
      stat.visits += parseInt profile.visits
      
      totalVisits += parseInt profile.visits
      
      delete profile.visits
      profile.stat = stat
      profile.hash = "#{ profile.stat.agent.key }:#{ profile.stat.version }:#{ profile.media }"

    hashes = _.unique( _.pluck( @profiles, "hash" ) ).sort()
    output = []
    
    for hash in hashes
      profilesForHash = _.select( @profiles, ( profile ) -> profile.hash is hash )
      typicalItem = profilesForHash[ 0 ]
      item = {}
      
      for key of typicalItem
        value = typicalItem[ key ]
        #if _.select( profilesForHash, ( d ) -> value is d[ key ] ).length is profilesForHash.length
        item[ key ] = value
      
      item.usageGlobal = item.stat.agent.usage_global[ item.stat.versionRef ]
      item.usageLocal = ( item.stat.visits / totalVisits ) * 100
      
      output.push item
    
    output = output.sort ( a, b ) -> b.usageLocal - a.usageLocal
    
    return output
