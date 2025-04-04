// app/api/user/update-profile-picture/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/user';

// For handling file uploads
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

export async function POST(request) {
    try {
        // Fix: Await cookies() before using get()
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;

        if (!userId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get form data from request
        const formData = await request.formData();
        const file = formData.get('profileImage');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file is an image
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Get file extension
        const fileExtension = file.type.split('/')[1];
        
        // Generate unique filename
        const fileName = `${uuidv4()}.${fileExtension}`;
        
        // Create path to save file
        const publicDir = join(process.cwd(), 'public');
        const uploadsDir = join(publicDir, 'uploads');
        
        // Ensure the uploads directory exists with proper permissions
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true, mode: 0o755 });
        }
        
        const filePath = join(uploadsDir, fileName);
        
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        await writeFile(filePath, buffer);
        
        // Path to access the file from the frontend
        const publicPath = `/uploads/${fileName}`;
        
        // Update user profile in database
        await connectDB();
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: publicPath },
            { new: true }
        );
        
        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: publicPath
        });
    } catch (error) {
        console.error('Update profile picture error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile picture', details: error.message },
            { status: 500 }
        );
    }
}