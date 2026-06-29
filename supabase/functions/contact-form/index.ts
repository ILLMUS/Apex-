const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const AIRTABLE_API_TOKEN = Deno.env.get('AIRTABLE_API_TOKEN')
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID')
    const AIRTABLE_TABLE_NAME = Deno.env.get('AIRTABLE_TABLE_NAME')

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return new Response(
        JSON.stringify({ error: 'Airtable configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting (simple in-memory)
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    if (!globalThis._rateLimits) globalThis._rateLimits = new Map()
    const lastRequest = globalThis._rateLimits.get(clientIP) || 0
    if (now - lastRequest < 10000) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    globalThis._rateLimits.set(clientIP, now)

    const body = await req.json()
    const { name, email, phone, message } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0 || phone.length > 30) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const sanitize = (s: string) => s.trim().replace(/<[^>]*>/g, '')

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            fields: {
              Name: sanitize(name),
              Email: sanitize(email),
              Phone: sanitize(phone),
              Message: sanitize(message),
            }
          }]
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error(`Airtable error [${response.status}]: ${err}`)
      return new Response(
        JSON.stringify({ error: 'Failed to submit message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
