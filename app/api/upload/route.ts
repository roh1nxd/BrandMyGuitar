import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const zoneId = formData.get('zoneId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!zoneId) {
      return NextResponse.json({ error: 'No zone ID provided' }, { status: 400 });
    }

    // Validate mime type
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

    // If Supabase Storage is configured with service role
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.storage
        .from('logos')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        // Fallback to data URL if bucket doesn't exist yet
        const base64 = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
        return NextResponse.json({
          url: base64,
          warning: 'Stored as data URL (Supabase bucket not yet configured)',
        });
      }

      const { data: publicData } = supabaseAdmin.storage
        .from('logos')
        .getPublicUrl(filePath);

      return NextResponse.json({
        url: publicData.publicUrl,
        path: filePath,
      });
    }

    // Local / Dev Fallback: return as high-quality data URL
    const base64 = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
    return NextResponse.json({
      url: base64,
      note: 'Demo mode data URL',
    });
  } catch (error: any) {
    console.error('Upload handler exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error during upload' },
      { status: 500 }
    );
  }
}
