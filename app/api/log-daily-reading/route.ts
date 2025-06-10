import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
// Temporarily import createClient directly
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Ensure these are defined in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
    try {
        const { userId, getToken } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('Supabase URL or Anon Key is not defined in environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const body = await req.json();
        const { bookId, pagesRead, dateRead } = body;

        if (!bookId || typeof pagesRead !== 'number' || !dateRead) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAccessToken = await getToken({ template: 'supabase' });

        if (!supabaseAccessToken) {
            return NextResponse.json({ error: 'Could not get Supabase access token' }, { status: 500 });
        }

        // Create a new Supabase client instance for this request
        const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${supabaseAccessToken}`,
                },
            },
        });

        const insertPayload = {
            user_id: userId, // Clerk user ID (text)
            book_id: bookId, 
            pages_read_on_date: pagesRead,
            read_date: dateRead,
        };

        console.log('Attempting to insert into Supabase with payload (direct client):', JSON.stringify(insertPayload, null, 2));

        const { data, error } = await supabase
            .from('daily_reading_logs')
            .insert(insertPayload); // Simplified insert

        if (error) {
            console.error('Supabase error logging reading progress (direct client):', error);
            return NextResponse.json({ error: 'Failed to log reading progress in Supabase.', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Reading progress logged successfully', data }, { status: 201 });

    } catch (error: any) {
        console.error('Catch error in API route:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message }, { status: 500 });
    }
}