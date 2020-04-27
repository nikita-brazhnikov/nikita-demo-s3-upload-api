const API = require('lambda-api');
const S3 = require('aws-sdk').S3;
const _  = require('lodash');

const s3 = new S3();

const app = API();

app.options('/*', ((req, res) => {
    res.cors({
        origin: "*",
        methods: 'GET, PUT, POST, DELETE, OPTIONS',
        headers: 'Content-Type, Authorization, Content-Length, X-Requested-With, x-amz-security-token,x-amz-date',
        credentials: true,
    });
    res.status(200).send({});
}));

app.use((req, res, next) => {
    res.cors({
        origin: "*",
        credentials: true,
    });
    next();
});

app.get("/attachments/:userId", async (req, res) => {
    const user = req.params.userId;
    const response = await s3.listObjectsV2({
        Bucket: process.env.UPLOADS_BUCKET,
        Prefix: `${user}`
    }).promise();

    const listing = [];

    for (let i = 0; i < response.Contents.length; i++) {
        const item = response.Contents[i];
        const securedUrl = await s3.getSignedUrlPromise('getObject', {
            Bucket: process.env.UPLOADS_BUCKET,
            Key: item.Key,
        });
        listing.push({
            filename: _.last(item.Key.split('/')),
            url: securedUrl,
            created: item.LastModified,
        })
    }

    res.status(200).json(listing);
});


const handler = async (event, context) => {
    return  await app.run(event, context);
};

module.exports = { handler };