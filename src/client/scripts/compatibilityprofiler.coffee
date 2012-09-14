class @CompatibilityProfiler

  @SUPPORT:
    y: "full"
    p: "polyfill"
    a: "partial"
    u: "unknown"
    n: "unsupported"
    
  @SUPPORT_VALUE:
    y: 5
    p: 4
    a: 3
    u: 2
    n: 1

  constructor: ( @features ) ->
  
  profile: ( profiles ) ->
  
    for profile in profiles
    
      profile.stat.features = []
      profile.stat.featureTable = {}
      
      for featureKey of @features
        feature = @features[ featureKey ]
        stats = feature.stats[ profile.stat.agent.key ]
        version = profile.stat.versionRef
        support = stats[ version ].split( " " )
        
        item =
          name: feature.title
          key: featureKey
          support: support[ 0 ]
          supportValue: CompatibilityProfiler.SUPPORT_VALUE[ support[ 0 ] ]
          profile: profile
        
        profile.stat.features.push item
        profile.stat.featureTable[ featureKey ] = item

      profile.stat.features = profile.stat.features.sort ( a, b ) -> b.supportValue - a.supportValue

    return profiles