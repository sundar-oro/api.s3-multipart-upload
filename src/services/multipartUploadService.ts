import { AbortMultipartUploadCommand, CompletedPart, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, ListMultipartUploadsCommand, ListPartsCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import configData from "../../config/app";
import { FILED_TO_FETCH_INCOMPLETE_PARTS, MULTIPART_UPLOAD_ABORTED_FAILED, MULTIPART_UPLOAD_FAILED, MULTIPART_UPLOAD_START_FAILED, MULTIPART_UPLOAD_URLS_FAILED } from "../constants/appMessages";
import S3Exception from "../exceptions/s3Exception";


interface Config {
    credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    },
    region: string,
    s3_bucket: string,
    expires: number,
    useAccelerateEndpoint?: boolean
}

export class MultipartUploadService {
    config: Config;
    client: S3Client;
    constructor() {

        this.config = {
            credentials: {
                accessKeyId: configData.s3.accessKeyId || '',
                secretAccessKey: configData.s3.secretAccessKey || '',
            },

            region: configData.s3.bucket_region || '',
            s3_bucket: configData.s3.s3_bucket || '',
            expires: 3600
        };

        this.client = new S3Client(this.config);
    }

    async initializeMultipartUpload(slug: string, fileName: string) {

        try {
            let key = ''
            if (slug) {
                key += `${slug}/`
            }
            key += fileName
            // Create a new multipart upload.
            const multipartUpload = await this.client.send(
                new CreateMultipartUploadCommand({
                    Bucket: this.config.s3_bucket,
                    Key: key
                })
            )

            return multipartUpload;
        } catch (error: any) {
            throw new S3Exception(MULTIPART_UPLOAD_START_FAILED, error.$metadata?.httpStatusCode, error);
        }

    }

    async multipartPresignedUrl(fileKey: string, parts: number, uploadId: string) {

        try {
            const urls = [];

            for (let i = 0; i < parts; i++) {
                const baseParams = {
                    Bucket: this.config.s3_bucket,
                    Key: fileKey,
                    UploadId: uploadId,
                    PartNumber: i + 1
                };

                const presignCommand = new UploadPartCommand(baseParams);

                urls.push(await getSignedUrl(this.client, presignCommand));
            }

            return await Promise.all(urls);
        } catch (error: any) {
            throw new S3Exception(MULTIPART_UPLOAD_URLS_FAILED, error.$metadata?.httpStatusCode, error);
        }

    }

    async completeMultipartUpload(fileKey: string, uploadId: string, uploadedParts: CompletedPart[]) {
        const bucketName = this.config.s3_bucket
        const key = fileKey;

        try {
            // Complete the multipart upload.
            const response = await this.client.send(

                new CompleteMultipartUploadCommand({

                    Bucket: bucketName,
                    Key: key,
                    UploadId: uploadId,
                    MultipartUpload: {
                        Parts: uploadedParts,
                    }
                })
            )
            return response;

        } catch (error: any) {
            throw new S3Exception(MULTIPART_UPLOAD_FAILED, error.$metadata?.httpStatusCode, error);
        }
    }

    async abortMultipartUpload(filekey: string, uploadId: string) {
        const bucketName = this.config.s3_bucket;
        const key = filekey;
        try {
            const abortCommand = new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: uploadId,
            });

            await this.client.send(abortCommand);
        } catch (error: any) {
            throw new S3Exception(MULTIPART_UPLOAD_ABORTED_FAILED, error.$metadata?.httpStatusCode, error);
        }
    }

    async listIncompleteParts(fileKey: string, uploadId: string, totalParts: number) {
        try {

            const listPartsResponse: any = await this.client.send(
                new ListPartsCommand({
                    Bucket: this.config.s3_bucket,
                    Key: fileKey,
                    UploadId: uploadId
                })
            );

            const uploadedPartNumbers = new Set(
                listPartsResponse.Parts.map((part: any) => part.PartNumber)
            );

            const incompleteParts = [];
            for (let i = 1; i <= totalParts; i++) {
                if (!uploadedPartNumbers.has(i)) {
                    incompleteParts.push(i);
                }
            }

            return incompleteParts;

        } catch (error: any) {
            throw new S3Exception(FILED_TO_FETCH_INCOMPLETE_PARTS, error.$metadata?.httpStatusCode, error);
        }
    }
   
    //NOT USING THIS
    async listIncompleteMultipartUploads(filekey: string, uploadId: string) {
        const bucketName = this.config.s3_bucket
        const key = filekey;

        try {
            const response: any = await this.client.send(
                new ListMultipartUploadsCommand({
                    Bucket: bucketName,
                    Prefix: key,
                    UploadIdMarker: uploadId
                })
            )
            if (response.Uploads.length === 0) {
                const incompleteData = response.Uploads.find((upload: any) => upload.Key === filekey);
                return incompleteData ? incompleteData.UploadId : null;
            }

            return null;

        } catch (error: any) {
            throw new S3Exception(MULTIPART_UPLOAD_ABORTED_FAILED, error.$metadata?.httpStatusCode, error);
        }
    }



}