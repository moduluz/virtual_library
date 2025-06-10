import { Webhook } from 'svix';
// Remove or comment out: import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server'; // Ensure NextRequest is imported
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - ensure these are in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the service role key for backend operations for better security and to bypass RLS if needed
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Fallback to anon key if service role key is not provided, though service role is preferred for webhooks
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error("Supabase URL is missing from environment variables.");
  // Potentially throw an error or handle this state appropriately
}
if (!supabaseServiceKey && !supabaseAnonKey) {
  console.error("Supabase Service Role Key or Anon Key is missing from environment variables.");
}

// Prefer service role key for backend operations
const supabase = createClient(supabaseUrl!, supabaseServiceKey || supabaseAnonKey!);


export async function POST(req: NextRequest) { // req is already of type NextRequest
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set in environment variables');
    return new NextResponse('Webhook secret not configured', { status: 500 });
  }

  // Get the headers directly from the req object's 'headers' property
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400
    });
  }

  const { id } = evt.data; // Ensure 'id' exists on evt.data or handle potential undefined
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id || 'unknown'} and type of ${eventType}`);

  if (eventType === 'user.created') {
    const eventData = evt.data;
    const clerk_user_id = eventData.id;
    
    if (!clerk_user_id) {
        console.error('User created event missing user ID.');
        return new NextResponse('User ID missing in webhook payload', { status: 400 });
    }

    const primaryEmailObject = eventData.email_addresses?.find(
      (email: any) => email.id === eventData.primary_email_address_id
    );
    const primaryEmail = primaryEmailObject?.email_address;

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('users') // Your public.users table
        .insert([
          {
            id: clerk_user_id, 
            email: primaryEmail,
            // Add other fields as needed
          }
        ])
        .select();

      if (insertError) {
        console.error('Error inserting user into Supabase:', insertError);
        if (insertError.code === '23505') { // PostgreSQL unique violation
            console.warn('User already exists, or unique constraint violated:', clerk_user_id);
            // It's often better to return 200 OK for webhooks even if user exists,
            // to prevent Clerk from retrying. Or 409 Conflict if you prefer.
            return new NextResponse('User already exists or conflict.', { status: 200 }); 
        }
        return new NextResponse('Error inserting user', { status: 500 });
      }

      console.log('User inserted into Supabase:', insertData);
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new NextResponse('Database operation failed', { status: 500 });
    }
  }

  return new NextResponse('Webhook received', { status: 200 });
}