import {NextResponse} from "next/server";
import {v2 as cloudinary} from "cloudinary";
import type {UploadApiResponse} from "cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB size cap for img
const ALLOWED_FORMAT = new Set(["image/jpeg", "image/png", "image/webp"]);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") {
            return NextResponse.json({error: "File is required."}, {status: 400});
        }
        if (!ALLOWED_FORMAT.has(file.type)) {
            return NextResponse.json({error: "Only JPEG/PNG/WEBP is supported."}, {status: 415});
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        // guard spoofed content-type
        const isAllowedMagic = (() => {
            const sig = buffer.subarray(0, 12);
            const jpg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
            const png = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
            const riff = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46;
            const webp = riff && sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50;
            return jpg || png || webp;
        })();
        if (!isAllowedMagic) {
            return NextResponse.json({error: "Only JPEG/PNG/WEBP is supported."}, {status: 415});
        }
        if (buffer.length > MAX_SIZE) {
            return NextResponse.json({error: "File size exceeds the limit of 5MB."}, {status: 413});
        }
        const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "patient-admin";
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder, resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp"],
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                },
                (err, result) => {
                    if (err || !result) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(buffer);
        });
        return NextResponse.json(
            {url: uploadResult.secure_url, publicId: uploadResult.public_id},
            {status: 201}
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json({error: "Internal server error."}, {status: 500});
    }
}

