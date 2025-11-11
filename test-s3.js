import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const s3 = new AWS.S3();
console.log("Loaded S3_BUCKET:", process.env.S3_BUCKET);
console.log("Loaded S3_ENDPOINT:", process.env.S3_ENDPOINT);
console.log("Loaded S3_REGION:", process.env.S3_REGION);
console.log("Loaded S3_ACCESS_KEY_ID:", process.env.S3_ACCESS_KEY_ID);
console.log("Loaded S3_SECRET_ACCESS_KEY:", process.env.S3_SECRET_ACCESS_KEY);

(async () => {
  try {
    const result = await s3.listObjectsV2({ Bucket: process.env.S3_BUCKET }).promise();
    console.log("✅ Connection successful! Files found:", result.Contents.length);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
})();
