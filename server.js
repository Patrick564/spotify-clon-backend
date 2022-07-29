const dotenv = require('dotenv')
dotenv.config()

const fastify = require('fastify')({ logger: true })

const crypto = require('crypto')


const clientRedirectUrl = process.env.CLIENT_REDIRECT_URL
const redirectUri = process.env.SPOTIFY_REDIRECT_URI
const authBase64 = Buffer.from(
  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
).toString('base64')

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST_PROD || '127.0.0.1'


fastify.register(require('@fastify/cors'))

fastify.get('/', async (request, reply) => {
  reply.send({ hello: 'world' })
})

fastify.get('/api/login', async (request, reply) => {
  const scope = process.env.SPOTIFY_SCOPE
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const responseType = 'code'
  const state =  crypto.randomBytes(16).toString('hex')

  reply.redirect(
    `https://accounts.spotify.com/authorize?response_type=${responseType}&state=${state}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&show_dialog=true`
  )
})

fastify.get('/api/auth', async (request, reply) => {
  const code = request.query.code || null
  const state = request.query.state || null

  const grantType = 'authorization_code'

  const authResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authBase64}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=${grantType}&code=${code}&redirect_uri=${redirectUri}`,
  })

  const data = await authResponse.json()

  reply.redirect(
    `${clientRedirectUrl}?token=${data.access_token}&refresh_token=${data.refresh_token}`
  )
})

// fastify.post('/api/refresh', async (request, reply) => {
//   const fetchSpotifyAuthR = await fetch(spotifyUrlAuth, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Basic ${ Buffer.from('ece36c04c62943b080b259756966d804:0cca2f53d72e4887bea135203d59f5c7').toString('base64') }`,
//       'Content-Type': 'application/x-www-form-urlencoded',
//     },
//     body: 'grant_type=refresh_token' + '&refresh_token=' + authData.refresh_token,
//   })

//   const authDataR = await fetchSpotifyAuthR.json()
// })

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST})
  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

start()
