express           = require "express"
coffee            = require "connect-coffee-script"
stylus            = require "stylus"
nib               = require "nib"
fs                = require "fs"
_                 = require "underscore"

json = fs.readFileSync "db/data.json", "utf-8"
data = JSON.parse json

for key of data
  console.log "   /#{ key } ready"

app = express()

app.configure ->
  app.use coffee
    src: "src/client"
    dest: "app/assets"
    bare: true
  
  app.use stylus.middleware
    src: "src/client"
    dest: "app/assets"
    compile: ( str, path ) ->
      stylus( str )
        .set( "filename", path )
        .set( "warn", true )
        .set( "compress", false )
        .use( nib() )
  
  app.use express.static( "app/assets" )
  app.use app.router
  app.set "view engine", "jade"
  app.set "views", "src/client/views"

app.get "/api/:section/:nodes?", ( req, res ) ->
  
  section = req.params.section
  nodes = if req.params.nodes then req.params.nodes.split "+"
  
  if nodes and nodes.length
    result = _.pick data[ section ], nodes
  else
    result = data[ section ]
  
  if result and ( ( _.isArray( result ) and result.length ) or !_.isArray( result ) )
    res.json result
  else
    res.send 404

app.get "/", ( req, res ) ->
  
  res.render "index"

app.get "/config", ( req, res ) ->
  
  res.sendfile "config/config.json"

app.listen 3000
console.log "-- App started on localhost:3000"
