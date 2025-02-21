
import { put } from '@vercel/blob';

import { NextResponse } from 'next/server';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(
    req: Request
) {
    console.log('i am running');
    const fileFormData = await req.formData();
    const file = fileFormData.get('file') as File;
    console.log(`[Simli Audio] audio upload `, {
        timestamp: new Date().toISOString(),
        fileSize: file.size,
        fileType: file.type
    });
    try {


        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );

        }

        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
            access: 'public',
        });
        return NextResponse.json({ url: blob.url })

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}