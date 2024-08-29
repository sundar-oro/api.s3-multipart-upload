"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipartUploadService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const app_1 = require("../../config/app");
class MultipartUploadService {
    constructor() {
        this.config = {
            credentials: {
                accessKeyId: app_1.default.s3.accessKeyId || '',
                secretAccessKey: app_1.default.s3.secretAccessKey || '',
            },
            region: app_1.default.s3.bucket_region || '',
            s3_bucket: app_1.default.s3.s3_bucket || '',
            expires: 3600
        };
        this.client = new client_s3_1.S3Client(this.config);
    }
    async initializeMultipartUpload(slug, fileName) {
        try {
            let key = '';
            if (slug) {
                key += `${slug}/`;
            }
            key += fileName;
            // Create a new multipart upload.
            const multipartUpload = await this.client.send(new client_s3_1.CreateMultipartUploadCommand({
                Bucket: this.config.s3_bucket,
                Key: key
            }));
            return multipartUpload;
        }
        catch (error) {
            throw error;
        }
    }
    async multipartPresignedUrl(fileKey, parts, uploadId) {
        try {
            const promises = [];
            for (let i = 0; i < parts; i++) {
                const baseParams = {
                    Bucket: this.config.s3_bucket,
                    Key: fileKey,
                    UploadId: uploadId,
                    PartNumber: i + 1
                };
                const presignCommand = new client_s3_1.PutObjectCommand(baseParams);
                promises.push(await (0, s3_request_presigner_1.getSignedUrl)(this.client, presignCommand));
            }
            return await Promise.all(promises);
        }
        catch (error) {
            throw error;
        }
    }
    async completeMultipartUpload(fileKey, uploadId, uploadedParts) {
        const bucketName = this.config.s3_bucket;
        const key = fileKey;
        try {
            // Complete the multipart upload.
            const response = await this.client.send(new client_s3_1.CompleteMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: uploadedParts,
                }
            }));
            return response;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.MultipartUploadService = MultipartUploadService;
