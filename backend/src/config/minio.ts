import * as Minio from 'minio';
import { env } from './env';

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL === 'true',
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export async function initBuckets() {
  const buckets = [env.MINIO_BUCKET_DOCUMENTS, env.MINIO_BUCKET_REPORTS];

  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`✅ MinIO bucket "${bucket}" created`);
      } else {
        console.log(`✅ MinIO bucket "${bucket}" exists`);
      }
    } catch (err) {
      console.error(`MinIO bucket "${bucket}" error:`, err);
    }
  }
}
