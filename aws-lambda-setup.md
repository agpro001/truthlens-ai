# AWS Lambda Setup for TruthLens AI - Bedrock Integration

This guide explains how to deploy the AWS Lambda function that integrates Amazon Bedrock with Claude 3 for TruthLens AI's deepfake and misinformation detection.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured on your machine
- Node.js 18.x or later installed
- Access to Amazon Bedrock (ensure your AWS account has Bedrock enabled in your region)

## Step 1: Enable Amazon Bedrock

1. Log in to AWS Console
2. Navigate to Amazon Bedrock service
3. Request access to Claude 3 Sonnet model (if not already enabled)
4. Wait for approval (usually instant for standard accounts)

## Step 2: Create Lambda Function

### Create the Lambda Handler

Create a new file `bedrock-lambda-handler.js`:

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { type, content, imageBase64 } = body;
    
    // Build the prompt based on content type
    let prompt;
    let messages;
    
    if (type === "image" && imageBase64) {
      // Extract base64 data without the data URL prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for authenticity and potential manipulation. Check for:
1. AI-generated content indicators
2. Deepfake artifacts
3. Photo manipulation signs
4. Metadata inconsistencies

Respond in JSON format with these fields:
- verdict: "verified" | "suspicious" | "fake" | "unknown"
- confidence: 0-100
- explanation: detailed explanation
- deepfakeProbability: 0-100 (only for images/videos)
- indicators: array of {label, value} objects
- evidence: array of {type, text} objects where type is "info"|"warning"|"danger"|"success"
- suggestedAction: recommended next steps`
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ];
    } else if (type === "link") {
      messages = [
        {
          role: "user",
          content: `Analyze this URL for security and credibility: "${content}"

Check for:
1. Phishing indicators
2. Domain reputation
3. Known scam patterns
4. SSL/security issues

Respond in JSON format with these fields:
- verdict: "verified" | "suspicious" | "fake" | "unknown"
- confidence: 0-100
- explanation: detailed explanation
- indicators: array of {label, value} objects
- evidence: array of {type, text} objects where type is "info"|"warning"|"danger"|"success"
- suggestedAction: recommended next steps`
        }
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `Analyze this text for misinformation and manipulation: "${content}"

Check for:
1. Factual accuracy
2. Emotional manipulation
3. Scam patterns
4. AI-generated content indicators

Respond in JSON format with these fields:
- verdict: "verified" | "suspicious" | "fake" | "unknown"
- confidence: 0-100
- explanation: detailed explanation
- indicators: array of {label, value} objects
- evidence: array of {type, text} objects where type is "info"|"warning"|"danger"|"success"
- suggestedAction: recommended next steps`
        }
      ];
    }
    
    // Call Bedrock with Claude 3 Sonnet
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        temperature: 0.2,
        messages: messages
      })
    });
    
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log("Bedrock response:", responseBody);
    
    // Extract the analysis from Claude's response
    const claudeResponse = responseBody.content[0].text;
    
    // Parse JSON from response
    let analysisResult;
    try {
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in Claude response");
      }
    } catch (parseError) {
      console.error("Failed to parse Claude response:", claudeResponse);
      analysisResult = {
        verdict: "unknown",
        confidence: 50,
        explanation: "Analysis completed but response format was unexpected",
        indicators: [
          { label: "AI-Generated Probability", value: 50 },
          { label: "Scam Likelihood", value: 50 },
          { label: "Manipulation Risk", value: 50 }
        ],
        evidence: [
          { type: "info", text: "Analysis completed via AWS Bedrock" }
        ],
        suggestedAction: "Manual review recommended"
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(analysisResult)
    };
    
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: error.message,
        verdict: "unknown",
        confidence: 0,
        explanation: "Failed to analyze content using AWS Bedrock",
        indicators: [],
        evidence: [
          { type: "danger", text: `Error: ${error.message}` }
        ],
        suggestedAction: "Please try again later"
      })
    };
  }
};
```

### Create package.json

```json
{
  "name": "truthlens-bedrock-lambda",
  "version": "1.0.0",
  "description": "AWS Lambda function for TruthLens AI Bedrock integration",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.490.0"
  }
}
```

## Step 3: Deploy to AWS Lambda

### Option A: Using AWS Console

1. Navigate to AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Configure:
   - Function name: `truthlens-bedrock-analyzer`
   - Runtime: Node.js 18.x
   - Architecture: arm64 (for better performance/cost)
5. Click "Create function"
6. Install dependencies locally:
   ```bash
   npm install
   ```
7. Create a ZIP file:
   ```bash
   zip -r function.zip index.js node_modules/
   ```
8. Upload the ZIP file in the Lambda console
9. Set timeout to 30 seconds (Configuration → General configuration)
10. Set memory to 512 MB

### Option B: Using AWS CLI

```bash
# Install dependencies
npm install

# Create deployment package
zip -r function.zip index.js node_modules/

# Create Lambda function
aws lambda create-function \
  --function-name truthlens-bedrock-analyzer \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-bedrock-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512
```

## Step 4: Configure IAM Permissions

Create an IAM role for your Lambda with these policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Step 5: Create Function URL

1. In Lambda console, go to Configuration → Function URL
2. Click "Create function URL"
3. Auth type: NONE (since we're handling auth in Supabase)
4. Configure CORS:
   - Allow origin: `*`
   - Allow methods: POST
   - Allow headers: content-type
5. Save the Function URL

## Step 6: Configure Supabase

1. Go to your Supabase project settings
2. Navigate to Edge Functions → Secrets
3. Add a new secret:
   - Key: `AWS_BEDROCK_LAMBDA_URL`
   - Value: Your Lambda Function URL from Step 5

## Step 7: Test the Integration

Test your Lambda function with this sample payload:

```bash
curl -X POST YOUR_LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "This is a test message to verify the integration"
  }'
```

Expected response:
```json
{
  "verdict": "verified",
  "confidence": 85,
  "explanation": "...",
  "indicators": [...],
  "evidence": [...],
  "suggestedAction": "..."
}
```

## Cost Considerations

- **Lambda**: First 1M requests/month free, then $0.20 per 1M requests
- **Bedrock Claude 3 Sonnet**: 
  - Input: $3 per 1M tokens
  - Output: $15 per 1M tokens
- Estimated cost for 1000 analyses: ~$0.50-$1.00

## Security Best Practices

1. ✅ Never expose AWS credentials in frontend code
2. ✅ Use Supabase function as a secure proxy
3. ✅ Implement rate limiting in Supabase
4. ✅ Monitor Lambda CloudWatch logs
5. ✅ Set up AWS Budget alerts
6. ✅ Use least-privilege IAM roles

## Troubleshooting

### Lambda returns timeout
- Increase timeout in Lambda configuration (max 15 minutes)
- Increase memory allocation

### Bedrock access denied
- Verify IAM role has `bedrock:InvokeModel` permission
- Ensure Bedrock is enabled in your region
- Check if Claude 3 Sonnet model is approved

### CORS errors
- Verify Function URL CORS settings
- Check that response includes proper headers

## Monitoring

Monitor your Lambda function:
```bash
aws logs tail /aws/lambda/truthlens-bedrock-analyzer --follow
```

## Next Steps

1. Set up CloudWatch alarms for errors
2. Implement request caching for cost optimization
3. Add comprehensive error logging
4. Consider using Lambda@Edge for global distribution

## Support

For issues or questions:
- AWS Bedrock: https://docs.aws.amazon.com/bedrock/
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- TruthLens GitHub: https://github.com/agpro001/truthlens-ai
