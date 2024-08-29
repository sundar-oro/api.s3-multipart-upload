import { Context } from "hono";
import { fileNameHelper } from "../helpers/filenameHelper";
import { MultipartUploadService } from "../services/multipartUploadService";
import { sendSuccessResponse } from "../helpers/reponseHelper";
import { FETCHED_INCOMPLETE_PARTS, MULTIPART_UPLOAD_ABORTED, MULTIPART_UPLOAD_START, MULTIPART_UPLOAD_SUCCESS, MULTIPART_UPLOAD_URLS } from "../constants/appMessages";
import validate from "../helpers/validationHelper";
import { UploadeFileDataInput, uploadFileData } from "../validations/uploadFileData";
import { getUrlsData, GetURLsDataInput } from "../validations/getUrlsData";
import { completeUploadData, CompleteUploadDataInput } from "../validations/completeUploadData";
import { abortUploadData, AbortUploadData } from "../validations/abortUpload";

const multipartUploadService = new MultipartUploadService();

export class MultipartUploadController {

    async initializeMultipartUpload(c: Context) {

        try {

            const reqData = await c.req.json();

            const validatedData: UploadeFileDataInput = await validate(uploadFileData, reqData);
            
            const fileName = await fileNameHelper(validatedData);

            const slug = 'mult-part-uploads';
            const uploadedData = await multipartUploadService.initializeMultipartUpload(slug, fileName);

            const response = {
                file_type: reqData.file_type,
                original_name: reqData.original_name,
                upload_id: uploadedData.UploadId,
                key: fileName,
                file_key: `${slug}/` + fileName,
            };

            return sendSuccessResponse(c, 200, MULTIPART_UPLOAD_START, response);

        } catch (error) {
            throw error;
        }
    }


    async getMultipartUploadUrls(c: Context) {

        try {

            const reqData = await c.req.json();

            const validatedData: GetURLsDataInput = await validate(getUrlsData, reqData);

            const uploadUrls = await multipartUploadService.multipartPresignedUrl(
                validatedData.file_key,
                validatedData.parts,
                validatedData.upload_id,
            );

            return sendSuccessResponse(c, 200, MULTIPART_UPLOAD_URLS, uploadUrls);

        } catch (error) {
            throw error;
        }

    }

    async completeMultipartUpload(c: Context) {

        try {

            const reqData = await c.req.json();

            const validatedData: CompleteUploadDataInput = await validate(completeUploadData, reqData);

            await multipartUploadService.completeMultipartUpload(validatedData.file_key, validatedData.upload_id, validatedData.parts);

            return sendSuccessResponse(c, 200, MULTIPART_UPLOAD_SUCCESS);

        } catch (error) {
            throw error;
        }
    }
    
    async abortMultipartUpload(c: Context) {
        try {

            const reqData = await c.req.json();

            const validatedData: AbortUploadData = await validate(abortUploadData, reqData);

            await multipartUploadService.abortMultipartUpload(validatedData.file_key, validatedData.upload_id);

            return sendSuccessResponse(c, 200, MULTIPART_UPLOAD_ABORTED);

        } catch (error) {
            throw error;
        }
    }

    async listIncompleteParts(c: Context) {

        try {

            const reqData = await c.req.json();

            const validatedData = await validate(getUrlsData, reqData);

            const incompleteUploads = await multipartUploadService.listIncompleteParts(validatedData.file_key, validatedData.upload_id, validatedData.parts);

            return sendSuccessResponse(c, 200, FETCHED_INCOMPLETE_PARTS, incompleteUploads);

        } catch (error) {
            throw error;
        }
    }
}