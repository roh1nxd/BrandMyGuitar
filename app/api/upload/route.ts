import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const zoneId = formData.get('zoneId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No logo file provided. A logo artwork file is required.' }, { status: 400 });
    }

    if (!zoneId) {
      return NextResponse.json({ error: 'No zone ID provided.' }, { status: 400 });
    }

    // Validate MIME type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload PNG, JPEG, WEBP, or SVG.' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `logos/${zoneId}/${timestamp}-${cleanFileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let adminClient;
    try {
      adminClient = getSupabaseAdmin();
    } catch (err: any) {
      console.error('Supabase Admin initialization failed:', err.message);
      return NextResponse.json(
        { error: err.message || 'SUPABASE_SERVICE_ROLE_KEY is missing in .env.local.' },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage bucket 'logos' using Admin client (bypasses RLS)
    const { data, error } = await adminClient.storage
      .from('logos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Retrieve public URL
    const { data: publicData } = adminClient.storage
      .from('logos')
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL for uploaded logo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('Upload handler exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
