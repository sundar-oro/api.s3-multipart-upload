import { AbortMultipartUploadCommand, CompletedPart, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, ListMultipartUploadsCommand, ListPartsCommand, S3Client, S3ServiceException, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StatusCode } from "hono/utils/http-status";
import configData from "../../config/app";
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
                accessKeyId: configData.s3.accessKeyId,
                secretAccessKey: configData.s3.secretAccessKey
            },

            region: configData.s3.bucket_region,
            s3_bucket: configData.s3.s3_bucket,
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
            key += fileName;

            const input = {
                Bucket: this.config.s3_bucket,
                Key: key
            }

            const command = new CreateMultipartUploadCommand(input)
            const response = await this.client.send(command)

            return response;

        } catch (error: any) {
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
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
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
        }

    }

    async completeMultipartUpload(fileKey: string, uploadId: string, uploadedParts: CompletedPart[]) {
        try {

            const input = {
                Bucket: this.config.s3_bucket,
                Key: fileKey,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: uploadedParts
                }
            }

            const command = new CompleteMultipartUploadCommand(input);
            const response = await this.client.send(command);

            return response;

        } catch (error: any) {
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
        }
    }

    async abortMultipartUpload(filekey: string, uploadId: string) {
        try {

            const input = {
                Bucket: this.config.s3_bucket,
                Key: filekey,
                UploadId: uploadId
            }

            const command = new AbortMultipartUploadCommand(input);
            const response = await this.client.send(command);

            return response;
        } catch (error: any) {
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
        }
    }

    async listIncompleteParts(fileKey: string, uploadId: string, totalParts: number) {
        try {

            const input = {
                Bucket: this.config.s3_bucket,
                Key: fileKey,
                UploadId: uploadId
            }

            const command = new ListPartsCommand(input);
            const listPartsResponse = await this.client.send(command);

            const uploadedPartNumbers = new Set(
                listPartsResponse.Parts?.map((part: any) => part.PartNumber)
            );

            const incompleteParts = [];
            for (let i = 1; i <= totalParts; i++) {
                if (!uploadedPartNumbers.has(i)) {
                    incompleteParts.push(i);
                }
            }

            return incompleteParts;

        } catch (error: any) {
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
        }
    }
   
    //NOT USING THIS
    async listIncompleteMultipartUploads(filekey: string, uploadId: string) {
        const bucketName = this.config.s3_bucket
        const key = filekey;

        try {

            const input = {
                Bucket: bucketName,
                Prefix: key,
                UploadIdMarker: uploadId
            }

            const command = new ListMultipartUploadsCommand(input);
            const response = await this.client.send(command);
        
            if (response.Uploads?.length === 0) {
                const incompleteData = response.Uploads.find((upload: any) => upload.Key === filekey);
                return incompleteData ? incompleteData.UploadId : null;
            }

            return null;

        } catch (error: any) {
            if (error instanceof S3ServiceException) {
                let statusCode : StatusCode = error.$metadata.httpStatusCode as StatusCode
                throw new S3Exception(error.message, statusCode, error);
            }
            throw error;
        }
    }



}