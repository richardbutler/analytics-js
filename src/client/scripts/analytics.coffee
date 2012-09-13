dimensions = [
  "operatingSystem"
  "browser"
  "browserVersion"
]

metrics = [
  "visits"
]

dateRange =
  start: "2010-01-01"
  end: "2012-09-01"

class @GAClient extends EventEmitter
  
  @READY      : "ga:ready"
  @AUTHORISED : "ga:authorised"
  @RESULT     : "ga:result"
  
  @NOT_SET    : "(not set)"
  
  constructor: ( @apiKey, @clientId, @scopes ) ->
    super()
  
  # ----------------------------------------
  # Initial callback
  # ----------------------------------------
  
  start: =>
  
    console.log "Starting."
    
    @emit GAClient.READY
    
    gapi.client.setApiKey @apiKey
    setTimeout @authorise, 1
  
  # ----------------------------------------
  # Authorisation
  # ----------------------------------------
  
  authorise: ( immediate = true ) =>
  
    console.log "Authorising."
  
    gapi.auth.authorize
      client_id: @clientId
      scope: @scopes
      immediate: immediate
    ,
    @authHandler
  
  authHandler: ( auth ) =>
  
    if auth
      console.log "Authorised."
      @emit GAClient.AUTHORISED
      @loadClient()
    else
      console.log "Not authorised."
      @authorise false
  
  # ----------------------------------------
  # Load the client
  # ----------------------------------------
  
  loadClient: =>
  
    console.log "Loading Client."
  
    gapi.client.load "analytics", "v3", @queryAccounts
    
  # ----------------------------------------
  # Query the accounts
  # ----------------------------------------
    
  queryAccounts: =>
  
    console.log "Querying Accounts."
    
    gapi.client.analytics.management.accounts.list().execute @accountsHandler

  accountsHandler: ( result ) =>
  
    console.log "Got Accounts.", result
  
    if result.code
      console.log "There was an error querying accounts: #{ result.message }"
    else
      if result and result.items and result.items.length
        firstAccountId = result.items[ 0 ].id
        @queryWebProperties firstAccountId
      else
        console.log "No accounts found for this user."

  # ----------------------------------------
  # Query the web properties
  # ----------------------------------------

  queryWebProperties: ( accountId ) =>
  
    console.log "Querying Web Properties."
    
    gapi.client.analytics.management.webproperties.list(
      accountId: accountId
    )
    .execute @webPropertiesHandler
  
  webPropertiesHandler: ( result ) =>
  
    console.log "Got Web Properties.", result
  
    if result.code
      console.log "There was an error querying webproperties: #{ result.message }"
    else
      if result and result.items and result.items.length
        firstItem = result.items[ 0 ]
        firstAccountId = firstItem.accountId
        firstWebPropertyId = firstItem.id
        
        @queryProfiles firstAccountId, firstWebPropertyId
      else
        console.log "No webproperties found for this user."

  # ----------------------------------------
  # Query the profiles
  # ----------------------------------------

  queryProfiles: ( accountId, webPropertyId ) =>
  
    console.log "Querying Profiles."
  
    gapi.client.analytics.management.profiles.list(
      accountId: accountId
      webPropertyId: webPropertyId
    )
    .execute @handleProfiles
  
  handleProfiles: ( result ) =>
  
    console.log "Got Profiles.", result
  
    if result.code
      console.log "There was an error querying profiles: #{ results.message }"
    else
      if result and result.items and result.items.length
        firstItem = result.items[ 0 ]
        firstProfileId = firstItem.id;
        
        @queryCoreReportingApi firstProfileId
      else
        console.log "No profiles found for this user."

  # ----------------------------------------
  # Query the core reporting API
  # ----------------------------------------

  toMetricString: ( items ) =>
    _.map( items, ( item ) -> "ga:#{ item }" ).join( "," )

  queryCoreReportingApi: ( profileId ) =>
  
    console.log "Querying Core Reporting API."
  
    gapi.client.analytics.data.ga.get(
      ids: "ga:#{ profileId }"
      "start-date": dateRange.start
      "end-date": dateRange.end
      dimensions: @toMetricString dimensions
      metrics: @toMetricString metrics
    )
    .execute @handleCoreReportingResult
  
  handleCoreReportingResult: ( result ) =>
    
    console.log "Got Core Reporting Result:", result
  
    if result.error
      console.log "There was an error querying core reporting API: #{ results.message }"
    else
      @compileResult result
      
  compileResult: ( result ) =>
  
    if result.rows and result.rows.length
      
      profiles = []
      keys = dimensions.concat metrics
      
      for agent in result.rows
        profile = {}
        
        i = 0
        for key in keys
          profile[ key ] = agent[ i ]
          i++
        
        # It's probably a bot, don't bother adding it
        continue if profile.operatingSystem is GAClient.NOT_SET
        
        if profile.browserVersion is GAClient.NOT_SET
          browserNameParts = profile.browser.split " "
          profile.browserVersion = browserNameParts.pop()
          profile.browser = browserNameParts.join " "
        
        browserVersion = profile.browserVersion.split( "." )
        
        profile.operatingSystem = "iOS" if profile.operatingSystem in [ "iPhone", "iPad" ]
        profile.browserMajorVersion = Number( browserVersion.shift() )
        profile.browserMinorVersion = Number( browserVersion.shift() ) || 0
        profile.browserMinorVersion = Number( String( profile.browserMinorVersion ).charAt( 0 ) )
        profile.media = if profile.operatingSystem in [ "Windows", "Macintosh", "Linux" ] then "desktop" else "mobile"
        
        if profile.browser.indexOf( "Safari" ) >= 0
          @fixSafariBrowserVersion profile
        
        profiles.push( profile )
      
      @emit GAClient.RESULT, profiles
      
    else
      console.log "No results found"

  fixSafariBrowserVersion: ( profile ) ->
  
    # 3.2: <= 525
    # 4.0: 526
    # 4.1: 530.18
    # 4.2: 530.19 - 533.15
    # 5.0: 533.16
    # 5.1: 534 - 535
    # 6: >= 536
  
    major = profile.browserMajorVersion
    minor = profile.browserMinorVersion
    
    if String( major ).length > 3
      major = String( major ).substr( 1, 3 )
    
    browserVersion = Number( [ major, minor ].join( "." ) )
  
    apply = ( version ) ->
      [ profile.browserMajorVersion, profile.browserMinorVersion ] = version
  
    if browserVersion <= 525
      return apply [ 3, 2 ]
  
    if browserVersion > 525 and browserVersion < 530.18
      return apply [ 4, 0 ]
      
    if browserVersion is 530.18
      return apply [ 4, 1 ]
      
    if browserVersion > 530.18 and browserVersion <= 533.15
      return apply [ 4, 2 ]
      
    if browserVersion > 533.15 and browserVersion < 534
      return apply [ 5, 0 ]
  
    if browserVersion >= 534 and browserVersion <= 535
      return apply [ 5, 1 ]
  
    return apply [ 6, 0 ]
