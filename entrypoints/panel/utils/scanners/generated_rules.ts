export interface GeneratedRuleRequirements {
  min_digits?: number;
  min_lowercase?: number;
  min_uppercase?: number;
  min_symbols?: number;
  min_length?: number;
  max_length?: number;
  min_entropy?: number;
}

export interface GeneratedRule {
  name: string;
  regex: RegExp;
  confidence: 'low' | 'medium' | 'high';
  id?: string;
  requirements?: GeneratedRuleRequirements;
  has_checksum?: boolean;
}

export const GENERATED_PATTERNS: GeneratedRule[] = [
  {
    name: "Adafruit IO Key",
    id: "kingfisher.adafruitio.1",
    regex: new RegExp("\\b(aio_[a-zA-Z]{4}[0-9]{2}[a-zA-Z0-9]{22})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Adobe Stock API Key",
    id: "kingfisher.adobe.1",
    regex: new RegExp("\\badobe(?:.|[\\n\\r]){0,32}?\\b([A-F0-9]{32})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Adobe IO Product ID",
    id: "kingfisher.adobe.2",
    regex: new RegExp("\\badobe(?:.|[\\n\\r]){0,64}?\\b([a-z0-9]{12})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Adobe OAuth Client Secret",
    id: "kingfisher.adobe.3",
    regex: new RegExp("\\b(p8e-[A-Z0-9-]{32})(?:[^A-Z0-9-])", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Age Recipient (X25519 public key)",
    id: "kingfisher.age.1",
    regex: new RegExp("(age1[0-9a-z]{58})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Age Identity (X22519 secret key)",
    id: "kingfisher.age.2",
    regex: new RegExp("(AGE-SECRET-KEY-1[0-9A-Z]{58})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "AI21 Studio API Key",
    id: "kingfisher.ai21studio.1",
    regex: new RegExp("\\bai21(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "Airbrake User Key",
    id: "kingfisher.airbrake.1",
    regex: new RegExp("\\bairbrake(?:.|[\\n\\r]){0,32}?([A-Z0-9-]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Airtable Personal Access Token",
    id: "kingfisher.airtable.1",
    regex: new RegExp("\\b(pat[a-z0-9]{14}\\.[a-z0-9]{62,66})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Airtable OAuth Token",
    id: "kingfisher.airtable.2",
    regex: new RegExp("([A-Z0-9]+\\.v1\\.[A-Z0-9_-]+\\.[a-f0-9]+)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Aiven API Key",
    id: "kingfisher.aiven.1",
    regex: new RegExp("aiven(?:.|[\\n\\r]){0,32}?\\b([a-z0-9/+=]{372})(?:[^A-Za-z0-9/+=])", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Algolia Admin API Key",
    id: "kingfisher.algolia.1",
    regex: new RegExp("algolia(?:.|[\\n\\r]){0,32}?([a-z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Algolia Application ID",
    id: "kingfisher.algolia.2",
    regex: new RegExp("algolia(?:.|[\\n\\r]){0,16}?([A-Z0-9]{10})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Alibaba Access Key ID",
    id: "kingfisher.alibabacloud.1",
    regex: new RegExp("(LTAI[a-z0-9]{17,21})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Alibaba Access Key Secret",
    id: "kingfisher.alibabacloud.2",
    regex: new RegExp("\\balibaba(?:.|[\\n\\r]){0,32}?([a-z0-9]{30})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":4.2},
    has_checksum: false
  },
  {
    name: "Anthropic API Key",
    id: "kingfisher.anthropic.1",
    regex: new RegExp("(sk-ant-api\\d{2,4}-[\\w\\-]{93}AA)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Anypoint API Key",
    id: "kingfisher.anypoint.1",
    regex: new RegExp("anypoint(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Apify API Token",
    id: "kingfisher.apify.1",
    regex: new RegExp("(apify_api_[A-Z0-9]{34,38})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Artifactory Access Token",
    id: "kingfisher.artifactory.1",
    regex: new RegExp("\\b(AKC[A-Z0-9]{64,74})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Artifactory JFrog URL",
    id: "kingfisher.artifactory.2",
    regex: new RegExp("\\b([a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?\\.jfrog\\.io)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Asana Client ID",
    id: "kingfisher.asana.1",
    regex: new RegExp("\\basana(?:.|[\\n\\r]){0,32}?\\b([0-9]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Asana Client Secret",
    id: "kingfisher.asana.2",
    regex: new RegExp("\\basana(?:.|[\\n\\r]){0,64}?\\b([a-z0-9]{30,40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Asana OAuth / Personal Access Token",
    id: "kingfisher.asana.3",
    regex: new RegExp("\\basana(?:.|[\\n\\r]){0,64}?\\b([01]{1,}\\/[0-9a-f]{16,32}(?::[a-z0-9]{32,64})?)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":4,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "AssemblyAI API Key",
    id: "kingfisher.assemblyai.1",
    regex: new RegExp("\\bassemblyai(?:.|[\\n\\r]){0,32}?\\b([0-9a-z]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Atlassian API token",
    id: "kingfisher.atlassian.1",
    regex: new RegExp("\\batlassian(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Atlassian Admin API Key",
    id: "kingfisher.atlassian.3",
    regex: new RegExp("(?:atlassian|api\\.atlassian\\.com)(?:.|[\\n\\r]){0,128}?\\b(AT[A-Za-z0-9_\\-=]{60,260})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.8},
    has_checksum: false
  },
  {
    name: "Auth0 Client ID",
    id: "kingfisher.auth0.1",
    regex: new RegExp("\\bauth0(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_-]{32,60})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Auth0 Client Secret",
    id: "kingfisher.auth0.2",
    regex: new RegExp("\\bauth0(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,64}?\\b([a-z0-9_-]{64,})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Auth0 Domain",
    id: "kingfisher.auth0.3",
    regex: new RegExp("\\b([a-z0-9][a-z0-9._-]*auth0\\.com)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Authress Service Client Access Key",
    id: "kingfisher.authress.1",
    regex: new RegExp("((?:sc|ext|scauth|authress)_[a-z0-9]{5,30}\\.[a-z0-9]{4,6}\\.acc[_-][a-z0-9-]{10,32}\\.[a-z0-9+/_=-]{30,120})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "AWS Access Key ID",
    id: "kingfisher.aws.1",
    regex: new RegExp("\\b((?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[2-7A-Z]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "AWS Secret Access Key",
    id: "kingfisher.aws.2",
    regex: new RegExp("(?:\\b(?:AWS|AMAZON|AMZN|A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)(?:.|[\\n\\r]){0,64}?[^A-Za-z0-9_+!@\\#$%^&*()\\]./]([A-Za-z0-9/+]{40})[^A-Za-z0-9_+!@\\#$%^&*()\\]./]|\\b(?:AWS|AMAZON|AMZN|A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)(?:.|[\\n\\r]){0,96}?(?:SECRET|PRIVATE|ACCESS)(?:.|[\\n\\r]){0,16}?(?:KEY|TOKEN)(?:.|[\\n\\r]){0,64}?\\b([A-Za-z0-9/+]{40})\\b)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":3,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "AWS Session Token",
    id: "kingfisher.aws.4",
    regex: new RegExp("(?:aws.?session|aws.?session.?token|aws.?token)[\"'`]?\\s{0,30}(?::|=>|=)\\s{0,30}[\"'`]?([a-z0-9/+=]{16,200})[^a-z0-9/+=]", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "AWS Bedrock API Key (Long-lived)",
    id: "kingfisher.aws.bedrock.long_lived",
    regex: new RegExp("(ABSKQmVkcm9ja0FQSUtleS[A-Za-z0-9+/=]{110})", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "AWS Bedrock API Key (Short-lived)",
    id: "kingfisher.aws.6",
    regex: new RegExp("(bedrock-api-key-YmVkcm9jay5hbWF6b25hd3MuY29t[A-Za-z0-9+/]+={0,2})", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Azure Connection String",
    id: "kingfisher.azure.1",
    regex: new RegExp("(?:AccountName|SharedAccessKeyName|SharedSecretIssuer)\\s*=\\s*([^;]{1,80})\\s*;\\s*.{0,10}\\s*(?:AccountKey|SharedAccessKey|SharedSecretValue)\\s*=\\s*([^;]{1,100})(?:;|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Azure App Configuration Connection String",
    id: "kingfisher.azure.2",
    regex: new RegExp("(https://[A-Z0-9-]+\\.azconfig\\.io);Id=(.{4}-.{2}-.{2}:[A-Z0-9+/]{18,22});Secret=([A-Z0-9+/]{36,50}=)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Azure Personal Access Token",
    id: "kingfisher.azure.3",
    regex: new RegExp("(?i:ADO_PAT|pat_token|personal_?access_?token|\\$token)\\s*=\\s*[\"']([a-z0-9]{52})[\"']", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Azure Container Registry URL",
    id: "kingfisher.azure.4",
    regex: new RegExp("([a-z0-9][a-z0-9-]{1,100}[a-z0-9])\\.azurecr\\.io", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Azure Container Registry Password",
    id: "kingfisher.azure.5",
    regex: new RegExp("\\b([A-Z0-9+/]{42}\\+ACR[A-Z0-9]{6})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Azure DevOps Organization",
    id: "kingfisher.azure.devops.1",
    regex: new RegExp("\\bdev\\.azure\\.com/([a-z0-9][a-z0-9-]{0,61}[a-z0-9])", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2.5},
    has_checksum: false
  },
  {
    name: "Azure DevOps Personal Access Token",
    id: "kingfisher.azure.devops.2",
    regex: new RegExp("\\b([a-z0-9]{76}AZDO[a-z0-9]{4,5})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Azure OpenAI API Key",
    id: "kingfisher.azureopenai.1",
    regex: new RegExp("\\bazure(?:.|[\\n\\r]){0,8}?(?:openai)(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,8}?([a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Azure OpenAI Host",
    id: "kingfisher.azureopenai.host.1",
    regex: new RegExp("\\b([a-z0-9-]{3,32}\\.openai\\.azure\\.com)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Azure Search Query Key",
    id: "kingfisher.azuresearch.key.1",
    regex: new RegExp("\\bazure(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([0-9A-Z]{52})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Azure Search URL",
    id: "kingfisher.azuresearch.url.1",
    regex: new RegExp("\\bazure(?:.|[\\n\\r]){0,32}?https:\\/\\/([0-9a-z]{5,40}\\.search\\.windows\\.net\\/indexes\\/[0-9a-z]{5,40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Azure Storage Account Name",
    id: "kingfisher.azurestorage.1",
    regex: new RegExp("(?:(?i:AccountName)\\s*=\\s*([a-z0-9]{3,24})(?:\\b|[^a-z0-9])|([a-z0-9]{3,24})\\.blob\\.core\\.windows\\.net\\b|\\bazure(?:[_\\s-]*)(?:storage|account)(?:[_\\s-]*)(?:name)\\b[\\s:=\\\"']{0,6}([a-z0-9]{3,24})(?:\\b|[^a-z0-9]))", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Azure Storage Account Key",
    id: "kingfisher.azurestorage.2",
    regex: new RegExp("\\bazure(?:.|[\\n\\r]){0,128}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,128}?[\"':\\s=}\\]\\)]((?:[A-Z0-9+\\-]{86,88}={1,2})|(?:[A-Z0-9+\\-]{86,88}\\b))", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_uppercase":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Baremetrics API Key",
    id: "kingfisher.baremetrics.1",
    regex: new RegExp("\\bbaremetrics(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_-]{25})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Baseten API Key",
    id: "kingfisher.baseten.1",
    regex: new RegExp("\\bbaseten(?:.|[\\n\\r]){0,32}?\\b([A-Za-z0-9]{8}\\.[A-Za-z0-9]{32})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.4},
    has_checksum: false
  },
  {
    name: "Beamer API token",
    id: "kingfisher.beamer.1",
    regex: new RegExp("\\bbeamer(?:.|[\\n\\r]){0,64}?\\b(b_[A-Z0-9=_\\\\/\\\\\\-+]{44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Bitbucket Client ID",
    id: "kingfisher.bitbucket.1",
    regex: new RegExp("\\bbitbucket(?:.|[\\n\\r]){0,16}?(?:client|id)(?:.|[\\n\\r]){0,16}?([a-z0-9]{30,40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Bitbucket Secret",
    id: "kingfisher.bitbucket.3",
    regex: new RegExp("\\bbitbucket(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9+_\\-+]{44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Bitly Access Token",
    id: "kingfisher.bitly.1",
    regex: new RegExp("\\bbitly(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Blynk Device Access Token",
    id: "kingfisher.blynk.1",
    regex: new RegExp("https://(?:fra1\\.|lon1\\.|ny3\\.|sgp1\\.|blr1\\.)*blynk\\.cloud/external/api/[A-Z0-9/]*\\?token=([A-Z0-9_\\-]{32})&", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Blynk Organization Access Token",
    id: "kingfisher.blynk.2",
    regex: new RegExp("https://(?:fra1\\.|lon1\\.|ny3\\.|sgp1\\.|blr1\\.)*blynk\\.cloud/api/[A-Z0-9_\\-\\s/\\\\]*-H\\s*\"Authorization:\\s*Bearer\\s*([A-Z0-9_\\-]{40})\"", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Blynk Organization Access Token",
    id: "kingfisher.blynk.3",
    regex: new RegExp("-H\\s*\"Authorization:\\s*Bearer\\s*([A-Z0-9_\\-]{40})\"[\\s\\\\]*https://(?:fra1\\.|lon1\\.|ny3\\.|sgp1\\.|blr1\\.)*blynk\\.cloud/api", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Blynk Organization Client Credentials",
    id: "kingfisher.blynk.8",
    regex: new RegExp("https://(?:fra1\\.|lon1\\.|ny3\\.|sgp1\\.|blr1\\.)*blynk\\.cloud/oauth2/[A-Z0-9_\\-\\s/\\\\?=&]*(oa2-client-id_[A-Z0-9_\\-]{32})(?::|&client_secret=)([A-Z0-9_\\-]{40})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Blynk Organization Client Credentials",
    id: "kingfisher.blynk.9",
    regex: new RegExp("\\b(oa2-client-id_[A-Z0-9_\\-]{32}):([A-Z0-9_\\-]{40})[\\s\\\\]*https://(fra1\\.|lon1\\.|ny3\\.|sgp1\\.|blr1\\.)*blynk\\.cloud/oauth2", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Buildkite API Key",
    id: "kingfisher.buildkite.1",
    regex: new RegExp("(bkua_[a-z0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Cerebras AI API Key",
    id: "kingfisher.cerebras.1",
    regex: new RegExp("(csk-[a-z0-9]{48})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "CircleCI API Personal Access Token",
    id: "kingfisher.circleci.1",
    regex: new RegExp("\\b(CCIPAT_[a-z0-9]{4}[a-z]{5}[a-z0-9]{3}[0-9]{3}[a-z]{2}[A-Z]{2}[0-9]{1}[a-z]{1}[a-z0-9]{1}[0-9]{1}[a-z]{1}_[a-z0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "CircleCI API Project Token",
    id: "kingfisher.circleci.2",
    regex: new RegExp("\\bcircleci(?:.|[\\n\\r]){0,64}?([a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Cisco Meraki API Key",
    id: "kingfisher.ciscomeraki.1",
    regex: new RegExp("meraki(?:.|[\\n\\r]){0,32}?([0-9a-f]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Clarifai API Key",
    id: "kingfisher.clarifai.1",
    regex: new RegExp("\\bclarifai(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{32,36})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Clearbit API Key",
    id: "kingfisher.clearbit.1",
    regex: new RegExp("\\bclearbit(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([0-9a-z_]{35})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "ClickHouse Cloud Secret Key",
    id: "kingfisher.clickhouse.1",
    regex: new RegExp("\\b(4b1d[a-z0-9]{38})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "ClickHouse Cloud Key ID",
    id: "kingfisher.clickhouse.2",
    regex: new RegExp("\\bclickhouse(?:.|[\\n\\r]){0,16}?(?:ID|USER)(?:.|[\\n\\r]){0,16}?([a-z0-9]{20})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Clojars Username",
    id: "kingfisher.clojars.1",
    regex: new RegExp("\\bclojars(?:.|[\\n\\r]){0,32}?(?:ID|USER)(?:.|[\\n\\r]){0,16}?\\b([a-z0-9_-]{3,})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":1.5},
    has_checksum: false
  },
  {
    name: "Clojars API Token",
    id: "kingfisher.clojars.2",
    regex: new RegExp("\\b(CLOJARS_[a-z0-9]{60})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Cloudflare API Token",
    id: "kingfisher.cloudflare.1",
    regex: new RegExp("\\bcloudflare(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_-]{38,42})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Cloudflare CA Key",
    id: "kingfisher.cloudflare.2",
    regex: new RegExp("\\b(?:cloudflare|x-auth-user-service-key)(?:.|[\\n\\r]){0,64}?(v1\\.0-[a-z0-9._-]{160,})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "CloudSight API Key",
    id: "kingfisher.cloudsight.1",
    regex: new RegExp("\\bcloudsight(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{20,24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Codacy API Key",
    id: "kingfisher.codacy.1",
    regex: new RegExp("\\bcodacy(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([0-9A-Z]{20,24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "CodeClimate Reporter ID",
    id: "kingfisher.codeclimate.1",
    regex: new RegExp("(?:CODECLIMATE|CC_TEST_REPORTER_ID)(?:.|[\\n\\r]){0,64}?\\b([a-f0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Codecov Access Token",
    id: "kingfisher.codecov.1",
    regex: new RegExp("\\bcodecov(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9-]{36})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Cohere API Key",
    id: "kingfisher.cohere.1",
    regex: new RegExp("\\bcohere(?:.|[\\n\\r]){0,16}?\\b([A-Z0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Coinbase Access Token",
    id: "kingfisher.coinbase.1",
    regex: new RegExp("\\bcoinbase(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([a-z-0-9]{32})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Coinbase CDP API Key (ECDSA)",
    id: "kingfisher.coinbase.2",
    regex: new RegExp("\"name\"\\s*:\\s*\"(?<CRED_NAME>organizations/[0-9a-f-]{36}/apiKeys/[0-9a-f-]{36})\".*\"privateKey\"\\s*:\\s*\"(?<PRIVATE_KEY>-----BEGIN\\sEC\\s{0,1}PRIVATE\\sKEY(\\sBLOCK)?-----[a-z0-9 /+=\\r\\n\\\\n]{32,}?-----END\\s(?:RSA|PGP|DSA|OPENSSH|ENCRYPTED|EC)?\\s{0,1}PRIVATE\\sKEY(\\sBLOCK)?-----)", "gims"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "Coinbase CDP API Key (Ed25519)",
    id: "kingfisher.coinbase.3",
    regex: new RegExp("\"id\"\\s*:\\s*\"(?<CRED_NAME>[0-9a-f-]{36})\"[^{]*?\"privateKey\"\\s*:\\s*\"(?<PRIVATE_KEY>[A-Za-z0-9+/=]{88})\"", "gis"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "Confluent Client ID",
    id: "kingfisher.confluent.1",
    regex: new RegExp("\\b(?:confluent|ccloud|cpdev|kafka)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Confluent API Secret",
    id: "kingfisher.confluent.2",
    regex: new RegExp("(?:confluent|ccloud|cpdev|kafka)(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9\\+/]{64})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Confluent API Secret - Updated Format",
    id: "kingfisher.confluent.3",
    regex: new RegExp("\\b(cflt(?<body>[A-Za-z0-9\\+/]{54})(?<checksum>[A-Za-z0-9\\+/]{6}))", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: true
  },
  {
    name: "Contentful Delivery API Token",
    id: "kingfisher.contentful.1",
    regex: new RegExp("\\bcontentful(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_-]{43,45})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Contentful Personal Access Token",
    id: "kingfisher.contentful.2",
    regex: new RegExp("(CFPAT-[A-Z0-9_-]{43})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Coze Personal Access Token",
    id: "kingfisher.coze.1",
    regex: new RegExp("coze(?:.|[\\n\\r]){0,32}?\\b(pat_[A-Z0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":5},
    has_checksum: false
  },
  {
    name: "crates.io API Key",
    id: "kingfisher.cratesio.1",
    regex: new RegExp("\\b(cio[A-Z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Credentials in a URL",
    id: "kingfisher.credentials.1",
    regex: new RegExp("https?:\\/\\/([a-z0-9._~-]+):([a-z0-9._~-]+)@([a-z0-9.-]+)(\\/[a-z0-9\\/._~-]*)?", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Curl Basic Authentication Credentials",
    id: "kingfisher.curl.1",
    regex: new RegExp("\\bcurl\\s.*(?:-u|--user)\\s+['\"]?(?<TOKEN>[^:'\"\\s]+:[^'\"\\s]+)['\"]?", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Curl Header Authentication",
    id: "kingfisher.curl.2",
    regex: new RegExp("\\bcurl\\s.*(?:-H|--header)\\s+['\"]Authorization:\\s*(?:Bearer|Basic|Token)\\s+(?<TOKEN>[a-zA-Z0-9+/=_-]{20,})['\"]", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Databricks API token",
    id: "kingfisher.databricks.1",
    regex: new RegExp("\\b(dapi[a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Databricks API Token",
    id: "kingfisher.databricks.2",
    regex: new RegExp("\\b(dapi[0-9a-f]{32})(-\\d)?\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Databricks Domain",
    id: "kingfisher.databricks.3",
    regex: new RegExp("\\b([a-z0-9-]+(?:\\.[a-z0-9\\-]+)*\\.(cloud\\.databricks\\.com|gcp\\.databricks\\.com|azurewebsites\\.net))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Datadog API Key",
    id: "kingfisher.datadog.3",
    regex: new RegExp("\\b(?:datadog|dd)(?:.|[\\n\\r]){0,64}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Za-z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Deepgram API Key",
    id: "kingfisher.deepgram.1",
    regex: new RegExp("\\bdeepgram(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "DeepSeek API Key",
    id: "kingfisher.deepseek.1",
    regex: new RegExp("\\b(sk-[a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.7},
    has_checksum: false
  },
  {
    name: "Dependency-Track API Key",
    id: "kingfisher.dtrack.1",
    regex: new RegExp("\\b(odt_[A-Z0-9]{32,255})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Diffbot API Key",
    id: "kingfisher.diffbot.1",
    regex: new RegExp("\\bdiffbot(?:.|[\\n\\r]){0,32}?\\b([0-9a-z]{32})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "DigitalOcean API Key",
    id: "kingfisher.digitalocean.1",
    regex: new RegExp("\\b((?:dop|doo)_v1_[a-f0-9]{64})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "DigitalOcean Refresh Token",
    id: "kingfisher.digitalocean.2",
    regex: new RegExp("(dor_v1_[a-f0-9]{64})", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Discord Webhook URL",
    id: "kingfisher.discord.1",
    regex: new RegExp("(https://discord\\.com/api/webhooks/\\d{18})/([0-9a-z_\\-]{68})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Discord Bot Token",
    id: "kingfisher.discord.2",
    regex: new RegExp("([MNO][A-Z0-9_-]{23}\\.[A-Z0-9_-]{6}\\.[A-Z0-9_-]{27})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Discord Bot ID",
    id: "kingfisher.discord.3",
    regex: new RegExp("(?:discord|botid|bot_id)(?:.|[\\n\\r]){0,64}?(\\d{17,19})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Django Secret Key",
    id: "kingfisher.django.1",
    regex: new RegExp("[DJANGO]\\w{0,8}SECRET_KEY.{1,16}?([A-Za-z0-9*!$@\\#&_%^-]{45,55})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "Docker Registry Credentials (auths JSON)",
    id: "kingfisher.docker.1",
    regex: new RegExp("\"auths\"\\s*:\\s*\\{[^}]*?\"(?<REG>(?:https?:\\/\\/)?[a-z0-9.\\-:+/]+)\"\\s*:\\s*\\{[^}]*?\"auth\"\\s*:\\s*\"(?<B64>[A-Za-z0-9+/=]{16,})\"[^}]*?\\}[^}]*?\\}", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Docker Hub Personal Access Token",
    id: "kingfisher.dockerhub.1",
    regex: new RegExp("\\b(dckr_pat_[A-Z0-9_-]{27})(?:$|[^A-Z0-9_-])", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler CLI Token",
    id: "kingfisher.doppler.1",
    regex: new RegExp("\\b(dp\\.ct\\.[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler Personal Token",
    id: "kingfisher.doppler.2",
    regex: new RegExp("\\b(dp\\.pt\\.[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler Service Token",
    id: "kingfisher.doppler.3",
    regex: new RegExp("\\b(dp\\.st\\.(?:[a-z0-9\\-_]{2,35}\\.)?[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler Service Account Token",
    id: "kingfisher.doppler.4",
    regex: new RegExp("\\b(dp\\.sa\\.[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler SCIM Token",
    id: "kingfisher.doppler.5",
    regex: new RegExp("\\b(dp\\.scim\\.[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Doppler Audit Token",
    id: "kingfisher.doppler.6",
    regex: new RegExp("\\b(dp\\.audit\\.[A-Z0-9]{40,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "DroneCI Access Token",
    id: "kingfisher.drone.1",
    regex: new RegExp("\\b(?:drone|droneci|drone[_-])(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b(ey[A-Za-z0-9_-]{30,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}|[a-f0-9]{32,64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Dropbox API secret/key",
    id: "kingfisher.dropbox.1",
    regex: new RegExp("\\b(sl\\.[A-Z0-9\\-\\_]{130,152})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Duffel API Token",
    id: "kingfisher.duffel.1",
    regex: new RegExp("\\b(duffel_(?:test|live)_[a-z0-9_\\-=]{43})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "Dynatrace Token",
    id: "kingfisher.dynatrace.1",
    regex: new RegExp("\\b(dt0[a-z][0-9]{2}\\.[A-Z0-9]{24}\\.[A-Z0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "EasyPost API token",
    id: "kingfisher.easypost.1",
    regex: new RegExp("\\b(EZ[AT]K[A-Za-z0-9]{54})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "ElevenLabs API Key",
    id: "kingfisher.elevenlabs.1",
    regex: new RegExp("\\b(sk_[0-9a-f]{48})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Eraser API Key",
    id: "kingfisher.eraser.1",
    regex: new RegExp("\\beraser(?:[^A-Za-z0-9]{0,16})?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:[^A-Za-z0-9]{0,16})?\\b([A-Za-z0-9]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Facebook App ID",
    id: "kingfisher.facebook.1",
    regex: new RegExp("\\b(?:facebook|fb)(?:.|[\\n\\r]){0,8}?(?:APP|APPLICATION)(?:.|[\\n\\r]){0,16}?\\b(\\d{15})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":15,"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Facebook Secret Key",
    id: "kingfisher.facebook.2",
    regex: new RegExp("\\b(?:facebook|fb).?(?:api|app|application|client|consumer|customer|secret|key).?(?:key|oauth|sec|secret)?.{0,2}\\s{0,20}.{0,2}\\s{0,20}.{0,2}\\b([a-z0-9]{32})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "Facebook Access Token",
    id: "kingfisher.facebook.3",
    regex: new RegExp("(?:\\b(?:facebook|fb\\b)(?:.|[\\n\\r]){0,32}?(?:access_token|access[\\s-]token)(?:.|[\\n\\r]){0,32}?)?(EAACEdEose0cBA[A-Z0-9]{20,})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Fastly API token",
    id: "kingfisher.fastly.1",
    regex: new RegExp("\\bfastly(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_-]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Figma Personal Access Token",
    id: "kingfisher.figma.1",
    regex: new RegExp("\\b(figd_[A-Z0-9_-]{38,42})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Figma Personal Access Header Token",
    id: "kingfisher.figma.2",
    regex: new RegExp("figma(?:.|[\\n\\r]){0,32}?([0-9A-F]{4}-[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "FileIO Secret Key",
    id: "kingfisher.fileio.1",
    regex: new RegExp("\\bfileio(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([A-Z0-9]{20}\\.[A-Z0-9]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Finicity API token",
    id: "kingfisher.finicity.1",
    regex: new RegExp("\\bfinicity(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Finicity client secret",
    id: "kingfisher.finicity.2",
    regex: new RegExp("\\bfinicity(?:.|[\\n\\r]){0,64}?\\b([a-z0-9]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Finnhub API Token",
    id: "kingfisher.finnhub.1",
    regex: new RegExp("\\bfinnhub(?:.|[\\n\\r]){0,24}?\\b([a-z0-9]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Firecrawl API Key",
    id: "kingfisher.firecrawl.1",
    regex: new RegExp("\\b(fc-[a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Fireworks.ai API Key",
    id: "kingfisher.fireworks.1",
    regex: new RegExp("\\b(fw_[A-Z0-9]{24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Flickr API Key",
    id: "kingfisher.flickr.1",
    regex: new RegExp("\\bflickr(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Flickr OAuth Token",
    id: "kingfisher.flickr.2",
    regex: new RegExp("\\bflickr(?:.|[\\n\\r]){0,32}?(?:OAUTH|ACCESS|TOKEN)?(?:.|[\\n\\r]){0,32}?([a-f0-9]{32})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Fly.io API Token",
    id: "kingfisher.flyio.1",
    regex: new RegExp("\\b(FlyV1\\s[A-Za-z0-9=_\\-,/+]{100,})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Frame.io API token",
    id: "kingfisher.frame.io.1",
    regex: new RegExp("\\b(fio-u-(?:[A-Z0-9_-]{16}){4})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Frame.io API Token",
    id: "kingfisher.frameio.1",
    regex: new RegExp("\\b(fio-u-[a-z0-9\\-_=]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "FreshBooks Access Token",
    id: "kingfisher.freshbooks.1",
    regex: new RegExp("\\bfreshbooks(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Friendli.ai API Key",
    id: "kingfisher.friendli.1",
    regex: new RegExp("\\b(flp_[A-Z0-9]{46})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "GCP API Token",
    id: "kingfisher.gcp.1",
    regex: new RegExp("(\\{[^{}]*\\\"auth_provider_x509_cert_url\\\":.{0,512}?})|\\{(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\"auth_provider_x509_cert_url\":\\s*\".+?\"(?:[^{}]|\\{(?:[^{}]|\\{[^{}]*\\})*\\})*\\}", "gims"),
    confidence: "high" as any,
    requirements: {"min_digits":2,"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "GCP Private Key ID",
    id: "kingfisher.gcp.3",
    regex: new RegExp("\\bgcp(?:.{0,20}?(?:key|secret)).{0,12}[=:]\\s{0,8}[\"']?([0-9a-z]{35,40})[\"']?\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Generic Secret",
    id: "kingfisher.generic.1",
    regex: new RegExp("secret.{0,20}([0-9a-z]{32,64})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Generic API Key",
    id: "kingfisher.generic.2",
    regex: new RegExp("(?:api_key|apikey|access_key|accesskey)(?:.|[\\n\\r]){0,8}?([0-9a-z][0-9a-z\\-._/+]{30,62}[0-9a-z])\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Generic Username and Password",
    id: "kingfisher.generic.3",
    regex: new RegExp("(?:username|user)(?:.|[\\n\\r]){0,16}?(?:password|pass)(?:.|[\\n\\r]){0,16}?[\"']([^\"']{5,30})[\"']", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Generic Username and Password",
    id: "kingfisher.generic.4",
    regex: new RegExp("(?:username|user)(?:.|[\\n\\r]){0,16}?(?:password|pass)(?:.|[\\n\\r]){0,16}?(\\S{5,30})(?:\\s|$)", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Generic Password",
    id: "kingfisher.generic.5",
    regex: new RegExp("password(?:.|[\\n\\r]){0,16}?[\"']([^$<%@.,\\s'\"(){}&/\\#\\-][^\\s'\"(){}/]{4,})[\"']", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Weak Password Pattern",
    id: "kingfisher.generic.6",
    regex: new RegExp("(blink\\d{3,6}|correcthorsebatterystaple\\d{0,6}|letmein\\d{1,6}|newpass\\d{1,6}|p@ssw0rd\\d{0,6}|pa55word\\d{0,6}|pass4now\\d{0,6}|password\\d{1,6}|qwer\\d{4,6}|qwerty\\d{3,6}|trustno\\d{1,6})", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":1},
    has_checksum: false
  },
  {
    name: "Generic Username and Password",
    id: "kingfisher.generic.8",
    regex: new RegExp("(?:db_user|db_USERNAME|db_name)(?:.|[\\n\\r]){0,8}?[\"']([^\"']{5,40})[\"'](?:.|[\\n\\r]){0,32}?(db_password|db_pass\\b(?:.|[\\n\\r]){0,16}?[\"'][^\"']{5,40})[\"']", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Docker Robot Credentials (plaintext pair)",
    id: "kingfisher.generic.9",
    regex: new RegExp("((?<USER>[a-z0-9._-]+\\+[a-z0-9._-]+):(?<PASS>[A-Z0-9]{32,80}))\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Gitalk OAuth Credentials",
    id: "kingfisher.gitalk.1",
    regex: new RegExp("\\bnew\\s+Gitalk\\s*\\(\\s*\\{\\s*clientID:\\s*'([a-f0-9]{20})',\\s*clientSecret:\\s*'([a-f0-9]{40})',", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "GitHub Personal Access Token - fine-grained permissions",
    id: "kingfisher.github.1",
    regex: new RegExp("(github_pat_[A-Z0-9_+]{82,84})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "GitHub Personal Access Token",
    id: "kingfisher.github.2",
    regex: new RegExp("(ghp_(?<body>[A-Z0-9]{30})(?<checksum>[A-Z0-9]{6}))", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3.5},
    has_checksum: true
  },
  {
    name: "GitHub OAuth Access Token",
    id: "kingfisher.github.3",
    regex: new RegExp("(gho_(?<body>[A-Z0-9]{30})(?<checksum>[A-Z0-9]{6}))", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: true
  },
  {
    name: "GitHub App User-to-Server Token",
    id: "kingfisher.github.4",
    regex: new RegExp("(ghu_(?<body>[A-Z0-9]{30})(?<checksum>[A-Z0-9]{6}))", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "GitHub App Server-to-Server Token",
    id: "kingfisher.github.5",
    regex: new RegExp("(ghs_(?<body>[A-Z0-9]{30})(?<checksum>[A-Z0-9]{6}))", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "GitHub Refresh Token",
    id: "kingfisher.github.6",
    regex: new RegExp("(ghr_(?<body>[A-Z0-9]{30})(?<checksum>[A-Z0-9]{6}))", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "GitHub Client ID",
    id: "kingfisher.github.7",
    regex: new RegExp("(?:github).?(?:api|app|application|client|consumer|customer)?.?(?:id|identifier|key).{0,2}\\s{0,20}.{0,2}\\s{0,20}.{0,2}\\b([a-z0-9]{20})\\b", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "GitHub Secret Key",
    id: "kingfisher.github.8",
    regex: new RegExp("github(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{40})\\b", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "GitLab Private Token",
    id: "kingfisher.gitlab.1",
    regex: new RegExp("\\b(glpat-[0-9A-Z_-]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "GitLab Runner Registration Token",
    id: "kingfisher.gitlab.2",
    regex: new RegExp("\\b(GR1348941[0-9A-Z_-]{20})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "GitLab Pipeline Trigger Token",
    id: "kingfisher.gitlab.3",
    regex: new RegExp("\\b(glptt-[0-9a-f]{40})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "GitLab Private Token - Routable Format",
    id: "kingfisher.gitlab.4",
    regex: new RegExp("\\b(glpat-(?<base64_payload>[0-9A-Za-z_-]{27,300})\\.(?<version>01)\\.(?<base36_payload_length>[0-9a-z]{2})(?<crc32>[0-9a-z]{7}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: true
  },
  {
    name: "Gitter Access Token",
    id: "kingfisher.gitter.1",
    regex: new RegExp("\\bgitter(?:.|[\\n\\r]){0,24}?\\b([a-z0-9_-]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "GoCardless API Token",
    id: "kingfisher.gocardless.1",
    regex: new RegExp("\\bgocardless(?:.|[\\n\\r]){0,16}?\\b(live_[A-Z0-9=_-]{16}(?:[A-Z0-9=_-]{8}){3}[A-Z0-9=_-]{0,2})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Google Client ID",
    id: "kingfisher.google.1",
    regex: new RegExp("\\b([0-9]+-[a-z0-9_]{32})\\.apps\\.googleusercontent\\.com", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Google OAuth Client Secret",
    id: "kingfisher.google.2",
    regex: new RegExp("(GOCSPX-[A-Z0-9_-]{28})(?:[^A-Z0-9_-]|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Google OAuth Client Secret",
    id: "kingfisher.google.3",
    regex: new RegExp("client.?secret.{0,10}([a-z0-9_-]{24})(?:[^a-z0-9_-]|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":4,"min_lowercase":3,"min_uppercase":3,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Google OAuth Access Token",
    id: "kingfisher.google.4",
    regex: new RegExp("(ya29\\.[0-9A-Z_-]{20,1024})(?:[^0-9A-Z_-])", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Google OAuth Credentials",
    id: "kingfisher.google.6",
    regex: new RegExp("([0-9]+-[a-z0-9_]{32}\\.apps\\.googleusercontent\\.com)(?:.{0,40})(?:(GOCSPX-[A-Z0-9_-]{28})|(?:client.?secret.{0,10}\\b([A-Z0-9_-]{24})))(?:[^A-Z0-9_-]|$)", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Google Gemini API Key",
    id: "kingfisher.google.7",
    regex: new RegExp("\\b(AIza[A-Za-z0-9_-]{35})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Google OAuth2 Access Token",
    id: "kingfisher.google.oauth2.1",
    regex: new RegExp("\\b(ya29\\.(?i:[a-z0-9_-]{30,}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Hardcoded Gradle Credentials",
    id: "kingfisher.gradle.1",
    regex: new RegExp("credentials\\s*\\{(?:\\s*//.*)*\\s*(?:username|password)\\s['\"]([^'\"]{1,60})['\"](?:\\s*//.*)*\\s*(?:username|password)\\s['\"]([^'\"]{1,60})['\"]", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Grafana API Token",
    id: "kingfisher.grafana.1",
    regex: new RegExp("\\b(eyJrIjoi[a-z0-9]{60,100})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Grafana Cloud API Token",
    id: "kingfisher.grafana.2",
    regex: new RegExp("\\b(glc_[a-z0-9+/]{40,150}={0,2})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Grafana Service Account Token",
    id: "kingfisher.grafana.3",
    regex: new RegExp("\\b(glsa_[A-Z0-9]{32}_[A-F0-9]{8})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Grafana Domain",
    id: "kingfisher.grafana.4",
    regex: new RegExp("(?:https?://)?(?:[A-Z0-9-]+\\.){0,32}grafana\\.[A-Z0-9.-]{3,32}(?::\\d{2,5})?(?:[/?\\#]\\S*)?", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Groq API Key",
    id: "kingfisher.groq.1",
    regex: new RegExp("\\b(gsk_[a-zA-Z0-9]{52})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Password Hash (md5crypt)",
    id: "kingfisher.pwhash.1",
    regex: new RegExp("(\\$1\\$[./A-Za-z0-9]{8}\\$[./A-Za-z0-9]{22})", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Password Hash (bcrypt)",
    id: "kingfisher.pwhash.2",
    regex: new RegExp("(\\$2[abxy]\\$\\d+\\$[./A-Za-z0-9]{53})", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Password Hash (sha256crypt)",
    id: "kingfisher.pwhash.3",
    regex: new RegExp("(\\$5(?:\\$rounds=\\d+)?\\$[./A-Za-z0-9]{8,16}\\$[./A-Za-z0-9]{43})", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Password Hash (sha512crypt)",
    id: "kingfisher.pwhash.4",
    regex: new RegExp("(\\$6(?:\\$rounds=\\d+)?\\$[./A-Za-z0-9]{8,16}\\$[./A-Za-z0-9]{86})", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Password Hash (Cisco IOS PBKDF2 with SHA256)",
    id: "kingfisher.pwhash.5",
    regex: new RegExp("(\\$8\\$[./A-Za-z0-9]{8,16}\\$[./A-Za-z0-9]{43})", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Password Hash (Kerberos 5, etype 23, AS-REP)",
    id: "kingfisher.krb5.asrep.23.1",
    regex: new RegExp("(\\$krb5asrep\\$23\\$(?:[^:]+:)?[0-9a-f]{32}\\$[0-9a-f]{64,})", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Service Token (< v1.10)",
    id: "kingfisher.hashicorp.1",
    regex: new RegExp("(?i:hashicorp|vault|token|key|secret)(?:.|[\\n\\r]){0,32}?\\b(s\\.[A-Za-z0-9_-]{24,128})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Batch Token (< v1.10)",
    id: "kingfisher.hashicorp.2",
    regex: new RegExp("(?i:hashicorp|vault|token|key|secret)[\"':=\\ ]{0,5}(b\\.[A-Za-z0-9_-]{24,500})(?:[^A-Za-z0-9_-]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Recovery Token (< v1.10)",
    id: "kingfisher.hashicorp.3",
    regex: new RegExp("(?i:hashicorp|vault|token|key|secret)[\"':=\\ ]{0,5}(r\\.[A-Za-z0-9_-]{24,500})(?:[^A-Za-z0-9_-]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Service Token (>= v1.10)",
    id: "kingfisher.hashicorp.4",
    regex: new RegExp("(hvs\\.[A-Za-z0-9]{24,130})(?:[^A-Za-z0-9_-]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Batch Token (>= v1.10)",
    id: "kingfisher.hashicorp.5",
    regex: new RegExp("(hvb\\.[A-Za-z0-9_-]{24,500})(?:[^A-Za-z0-9_-]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Recovery Token (>= v1.10)",
    id: "kingfisher.hashicorp.6",
    regex: new RegExp("(hvr\\.[A-Za-z0-9]{24,130})(?:[^A-Za-z0-9_-]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Hashicorp Vault Unseal Key",
    id: "kingfisher.hashicorp.7",
    regex: new RegExp("(?i:unseal)\\b.{1,10}([a-zA-Z0-9+/]{44})(?:[^a-zA-Z0-9+/]|$)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Heroku API Key",
    id: "kingfisher.heroku.1",
    regex: new RegExp("\\bheroku(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Heroku API Key (Platform Key)",
    id: "kingfisher.heroku.2",
    regex: new RegExp("(HRKU-[A-Z0-9_]{60})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "HTTP Basic Authentication",
    id: "kingfisher.http.1",
    regex: new RegExp("Authorization(?::\\s+|\\s*.{1,5}\\s*)Basic\\s+([A-Za-z0-9+/]{6,}={0,2})(?:[^A-Za-z0-9+/=]|$)", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "HTTP Bearer Token",
    id: "kingfisher.http.2",
    regex: new RegExp("Authorization(?::\\s+|\\s*.{1,5}\\s*)Bearer\\s+([a-zA-z0-9._~+/-]{6,}=*)(?:[^a-zA-z0-9._~+/=-]|$)", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "HubSpot Private App Token",
    id: "kingfisher.hubspot.1",
    regex: new RegExp("\\b(pat-[a-z0-9]{2,3}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "HuggingFace User Access Token",
    id: "kingfisher.huggingface.1",
    regex: new RegExp("(?:((?:api_org|hf)_(?:[0-9A-Z]{17}){2}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "IBM Cloud User API Key",
    id: "kingfisher.ibm.1",
    regex: new RegExp("\\b(?:ibm(?:cloud)?|bx)(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([0-9A-Z_-]{42,44})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Infracost API Token",
    id: "kingfisher.infracost.1",
    regex: new RegExp("\\b(ico-[a-z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Intercom API Token",
    id: "kingfisher.intercom.1",
    regex: new RegExp("(?:intercom|ic)(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([0-9A-Z+/]{59}=)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Ionic API token",
    id: "kingfisher.ionic.1",
    regex: new RegExp("\\b(ion_[a-z0-9]{42})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "IpStack API Key",
    id: "kingfisher.ipstack.1",
    regex: new RegExp("\\bipstack(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b((?:[0-9a-f]{16}){2})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "JDBC connection string with embedded credentials",
    id: "kingfisher.jdbc.1",
    regex: new RegExp("(jdbc:[a-z][a-z0-9+.-]{2,32}(?:[:][a-z0-9+.-]{1,32})*:[^\\s\"'<>,(){}\\[\\]]{10,448})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Jenkins Token or Crumb",
    id: "kingfisher.jenkins.1",
    regex: new RegExp("jenkins.{0,10}(?:crumb)?.{0,10}\\b([0-9a-f]{32,36})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Jina Search Foundation API Key",
    id: "kingfisher.jina.1",
    regex: new RegExp("\\b(jina_[a-zA-Z0-9]{60})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Jira Domain",
    id: "kingfisher.jira.1",
    regex: new RegExp("\\b([a-z][a-z0-9-]{5,24}\\.atlassian\\.net)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Jira Token",
    id: "kingfisher.jira.2",
    regex: new RegExp("\\bjira(?:.|[\\n\\r]){0,8}?(?:SECRET|PRIVATE|ACCESS|KEY|PASSWORD|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([a-z0-9-]{24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "JSON Web Token (base64url-encoded)",
    id: "kingfisher.jwt.1",
    regex: new RegExp("((?:ey|ewogIC)[A-Za-z0-9_-]{12,}\\.ey[A-Za-z0-9_-]{12,}\\.[A-Za-z0-9_-]{12,})(?:[^A-Z0-9_-])", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":4,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Kagi API Key",
    id: "kingfisher.kagi.1",
    regex: new RegExp("(?:kagi|KAGI).{0,100}([a-zA-Z0-9_-]{11}\\.[a-zA-Z0-9_-]{43})(?:$|[^a-zA-Z0-9_-])", "gs"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Kickbox API Key",
    id: "kingfisher.kickbox.1",
    regex: new RegExp("\\bkickbox(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_]+[A-Z0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "LangSmith Personal Access Token",
    id: "kingfisher.langchain.1",
    regex: new RegExp("\\b(lsv2_(?:pt)_[0-9a-f]{32}_[0-9a-f]{10})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "LangSmith Service Key",
    id: "kingfisher.langchain.2",
    regex: new RegExp("\\b(lsv2_sk_[0-9a-f]{32}_[0-9a-f]{10})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "LaunchDarkly Access Token",
    id: "kingfisher.launchdarkly.1",
    regex: new RegExp("launchdarkly(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_\\-=]{40})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "Line Messaging API Token",
    id: "kingfisher.line.1",
    regex: new RegExp("\\bline(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b((?:[0-9A-Z+/]{57}){3}=?)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Linear API Key",
    id: "kingfisher.linear.1",
    regex: new RegExp("\\b(lin_api_(?:[0-9A-Z]{8}){5})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "LinkedIn Client ID",
    id: "kingfisher.linkedin.1",
    regex: new RegExp("linkedin.?(?:api|app|application|client|consumer|customer)?.?(?:id|identifier|key).{0,2}\\s{0,20}.{0,2}\\s{0,20}.{0,2}\\b([a-z0-9]{12,14})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":2.5},
    has_checksum: false
  },
  {
    name: "LinkedIn Secret Key",
    id: "kingfisher.linkedin.2",
    regex: new RegExp("linkedin.?(?:api|app|application|client|consumer|customer|secret|key).?(?:key|oauth|sec|secret)?.{0,2}\\s{0,20}.{0,2}\\s{0,20}.{0,2}\\b([a-z0-9]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Lob API Key",
    id: "kingfisher.lob.1",
    regex: new RegExp("lob(?:.|[\\n\\r]){0,24}?\\b((?:live|test)_[a-f0-9]{35})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Lob Publishable API Key",
    id: "kingfisher.lob.2",
    regex: new RegExp("lob(?:.|[\\n\\r]){0,24}?\\b((?:test|live)_pub_[a-f0-9]{31})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Mailchimp API Key",
    id: "kingfisher.mailchimp.1",
    regex: new RegExp("\\bmailchimp(?:.|[\\n\\r]){0,128}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b((?:[0-9a-f]{8}){4}-us\\d{1,2})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "MailGun Token",
    id: "kingfisher.mailgun.1",
    regex: new RegExp("\\bmailgun(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b((?:[0-9A-Z-]{24}){3})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "MailGun Primary Key",
    id: "kingfisher.mailgun.2",
    regex: new RegExp("(?:mailgun|mg)(?:.|[\\n\\r]){0,64}?\\b(key-(?:[0-9a-f]{8}){4})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Mandrill API Key",
    id: "kingfisher.mandrill.1",
    regex: new RegExp("\\bmandrill(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b((?:[0-9A-Z_-]{11}){2})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Mapbox Public Access Token",
    id: "kingfisher.mapbox.1",
    regex: new RegExp("mapbox.{0,30}(pk\\.[a-z0-9\\-+/=]{32,128}\\.[a-z0-9\\-+/=]{20,30})\\b", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Mapbox Secret Access Token",
    id: "kingfisher.mapbox.2",
    regex: new RegExp("mapbox.{0,30}(sk\\.[a-z0-9\\-+/=]{32,128}\\.[a-z0-9\\-+/=]{20,30})\\b", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Mapbox Temporary Access Token",
    id: "kingfisher.mapbox.3",
    regex: new RegExp("mapbox.{0,30}(tk\\.[a-z0-9\\-+/=]{32,128}\\.[a-z0-9\\-+/=]{20,30})\\b", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Mattermost URL",
    id: "kingfisher.mattermost.1",
    regex: new RegExp("\\bmattermost(?:.|[\\n\\r]){0,32}?(https?:\\/\\/[a-z0-9.-]+(?::\\d{2,5})?(?:\\/[A-Za-z0-9._~\\-\\/]*)?)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Mattermost Access Token",
    id: "kingfisher.mattermost.2",
    regex: new RegExp("\\bmattermost(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{26})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "MaxMind License Key",
    id: "kingfisher.maxmind.1",
    regex: new RegExp("\\b([a-z0-9]{6}_[a-z0-9]{29}_mmk)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.8},
    has_checksum: false
  },
  {
    name: "MaxMind Account ID",
    id: "kingfisher.maxmind.2",
    regex: new RegExp("(?:maxmind|geoip|geolite)(?:.|[\\n\\r]){0,40}?(?:account|user)(?:.|[\\n\\r]){0,10}?(?:id|number)(?:.|[\\n\\r]){0,16}?(\\d{4,8})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "MessageBird API Token",
    id: "kingfisher.messagebird.1",
    regex: new RegExp("\\bmessage[_-]?bird(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{25})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.4},
    has_checksum: false
  },
  {
    name: "Microsoft Teams Webhook",
    id: "kingfisher.msteams.1",
    regex: new RegExp("(https://outlook\\.office\\.com/webhook/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}@[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/IncomingWebhook/[0-9a-f]{32}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Microsoft Teams Webhook",
    id: "kingfisher.microsoftteamswebhook.1",
    regex: new RegExp("\\b(https://[A-Z0-9]+\\.webhook\\.office\\.com/webhookb2/[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}@[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12}/IncomingWebhook/[A-Z0-9]{32}/[A-Z0-9]{8}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Mistral AI API Key",
    id: "kingfisher.mistral.1",
    regex: new RegExp("\\bmistral(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Monday.com API Key",
    id: "kingfisher.monday.1",
    regex: new RegExp("\\bmonday(?:.|[\\n\\r]){0,40}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,40}?\\b(eyJ[A-Za-z0-9-_]{10,200}\\.eyJ[A-Za-z0-9-_]{50,1000}\\.[A-Za-z0-9-_]{20,500})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "MongoDB API Private Key",
    id: "kingfisher.mongodb.1",
    regex: new RegExp("(?:(?:\\b|_|-|\\.)(?:mongodb|atlas)(?:\\b|_|-|\\.)).{0,1000}?(?:private|priv|secret|auth|pass|key)(?:.|[\\n\\r]){0,32}?\\b([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.7},
    has_checksum: false
  },
  {
    name: "MongoDB API PUBLIC Key",
    id: "kingfisher.mongodb.2",
    regex: new RegExp("(?:(?:\\b|_|-|\\.)(?:mongodb|atlas)(?:\\b|_|-|\\.))(?:public|pub|user|id)(?:.|[\\n\\r]){0,4}?([A-Z]+)(?:$|[^A-Z0-9/+=-])", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "MongoDB URI Connection String",
    id: "kingfisher.mongodb.3",
    regex: new RegExp("\\b(mongodb(?:\\+srv)?://[\\S]{3,50}:(?:[\\S]{3,88})@[-.%\\w/:]+)\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "MongoDB Atlas Service Account Token",
    id: "kingfisher.mongodb.4",
    regex: new RegExp("\\b(mdb_sa_sk_[0-9A-Z_-]{6}[0-9A-Z]{34})", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "MySQL URI with Credentials",
    id: "kingfisher.mysql.1",
    regex: new RegExp("(mysql:\\/\\/(?:[a-z0-9._%+\\-]+):(?:[^\\s:@]+)@(?:\\[[0-9a-f:.]+\\]|[a-z0-9.-]+)(?::\\d{2,5})?(?:\\/[^\\s\"'?:]+)?(?:\\?[^\\s\"']*)?)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "NASA API Key",
    id: "kingfisher.nasa.1",
    regex: new RegExp("\\bnasa\\.gov/.{0,200}(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{40})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "Netlify API Key",
    id: "kingfisher.netlify.1",
    regex: new RegExp("netlify(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{60,64})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Netlify API Key",
    id: "kingfisher.netlify.2",
    regex: new RegExp("\\bnetlify(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_-]{43,45})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "netrc Credentials",
    id: "kingfisher.netrc.1",
    regex: new RegExp("(machine\\s+[^\\s]+|default)\\s+login\\s+([^\\s]+)\\s+password\\s+([^\\s]+)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "New Relic Personal API Key",
    id: "kingfisher.newrelic.1",
    regex: new RegExp("\\bnewrelic(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_.]{4}-[A-Z0-9_.]{42})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Ngrok API Key",
    id: "kingfisher.ngrok.1",
    regex: new RegExp("\\bngrok(?:.|[\\\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?((?:[a-z0-9]{25,30}_\\d[a-z0-9]{20}|(?:cr_|ak_)[a-z0-9]{25,30}))\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Notion Legacy Token",
    id: "kingfisher.notion.1",
    regex: new RegExp("notion(?:.|[\\\\n\\r]){0,32}?\\b(secret_[A-Z0-9]{43})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Notion Token",
    id: "kingfisher.notion.2",
    regex: new RegExp("notion(?:.|[\\\\n\\r]){0,32}?(ntn_[A-Z0-9]{40,55})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Notion OAuth Refresh Token",
    id: "kingfisher.notion.3",
    regex: new RegExp("notion(?:.|[\\\\n\\r]){0,32}?(nrt_[A-Z0-9_]{40,55})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "NPM Access Token (fine-grained)",
    id: "kingfisher.npm.1",
    regex: new RegExp("\\b(npm_(?<body>[A-Za-z0-9]{30})(?<checksum>[A-Za-z0-9]{6}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: true
  },
  {
    name: "NPM Access Token (old format)",
    id: "kingfisher.npm.2",
    regex: new RegExp("(?:_authToken|NPM_TOKEN)(?:.|[\\n\\r]){0,16}?([0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "NuGet API Key",
    id: "kingfisher.nuget.1",
    regex: new RegExp("\\b(oy2[a-z0-9]{43})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "NuGet API Key",
    id: "kingfisher.nuget.2",
    regex: new RegExp("\\bnuget(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([a-z0-9]{46})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "NVIDIA NIM API Key",
    id: "kingfisher.nvidia.nim.1",
    regex: new RegExp("(nvapi-[A-Z0-9_-]{60,70})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "New York Times API Key",
    id: "kingfisher.nytimes.1",
    regex: new RegExp("(?:nytimes|new[- ]?york[- ]?times)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9_\\-=]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "Credentials in ODBC Connection String",
    id: "kingfisher.odbc.1",
    regex: new RegExp("(?:User|User\\ Id|UserId|Uid)\\s*=\\s*([^\\s;]{3,100})\\s*;[\\ \\t]*.{0,10}[\\ \\t]*(?:Password|Pwd)\\s*=\\s*([^\\t\\ ;]{3,100})\\s*(?:[;]|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Okta API Token",
    id: "kingfisher.okta.1",
    regex: new RegExp("(?:okta|ssws)(?:.|[\\n\\r]){0,64}?\\b(00[a-z0-9_-]{39}[a-z0-9_])\\b", "gis"),
    confidence: "low" as any,
    requirements: {"min_digits":4,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Okta Domain",
    id: "kingfisher.okta.2",
    regex: new RegExp("([a-z0-9-]{1,40}\\.okta(?:preview|-emea)?\\.com)\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Ollama API Key",
    id: "kingfisher.ollama.1",
    regex: new RegExp("\\bollama(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{32}\\.[a-zA-Z0-9_-]{24})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "1Password Service-Account Token",
    id: "kingfisher.1password.1",
    regex: new RegExp("\\b(ops_eyj[A-Za-z0-9_-]{80,500})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "1Password Account Secret Key",
    id: "kingfisher.1password.2",
    regex: new RegExp("(A[0-9]-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{5}(?:-[A-Z0-9]{5}){3})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.8},
    has_checksum: false
  },
  {
    name: "OpenAI API Key",
    id: "kingfisher.openai.1",
    regex: new RegExp("(sk-[A-Z0-9]{48})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "OpenAI API Key",
    id: "kingfisher.openai.2",
    regex: new RegExp("((sk-(?:proj|svcacct|None)-[A-Z0-9_-]{100,}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "OpenWeather Map API Key",
    id: "kingfisher.openweather.1",
    regex: new RegExp("(?:pyowm|openweather|\\bowm\\b)(?:.|[\\n\\r]){0,64}?\\b([a-z0-9]{32}|APPID=[a-z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "OpsGenie API Key",
    id: "kingfisher.opsgenie.1",
    regex: new RegExp("\\bopsgenie(?:.|[\\\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "PagerDuty API Key",
    id: "kingfisher.pagerduty.1",
    regex: new RegExp("(?:pd[_-]?|pagerduty[_-]?|pagerduty)\\W{0,20}(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b(u\\+[A-Z0-9_+-]{18}|[A-Z0-9_-]{20}|[a-f0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "particle.io Access Token",
    id: "kingfisher.particleio.1",
    regex: new RegExp("https://api\\.particle\\.io/v1/[A-Z0-9_\\-\\s/\"\\\\?]*(?:access_token=|Authorization:\\s*Bearer\\s*)([A-Z0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "particle.io Access Token",
    id: "kingfisher.particleio.2",
    regex: new RegExp("(?:access_token=|Authorization:\\s*Bearer\\s*)([A-Z0-9]{40})\\b[\\s\"\\\\]*https://api\\.particle\\.io/v1", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Pastebin API Key",
    id: "kingfisher.pastebin.1",
    regex: new RegExp("\\bpastebin(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "PayPal OAuth Client ID",
    id: "kingfisher.paypal.1",
    regex: new RegExp("paypal(?:.|[\\n\\r]){0,8}?(?:CLIENT|ID|USER)(?:.|[\\n\\r]){0,16}?\\b(A[A-Z0-9_-]{78,99})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "PayPal OAuth Secret",
    id: "kingfisher.paypal.2",
    regex: new RegExp("paypal(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9_.-]{78,120})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "PEM-Encoded Private Key",
    id: "kingfisher.pem.1",
    regex: new RegExp("-----BEGIN\\ .{0,20}\\ ?PRIVATE\\ KEY\\ ?.{0,20}-----\\s*((?:[a-zA-Z0-9+/=\\s\"',]|\\\\r|\\\\n){50,})\\s*-----END\\ .{0,20}\\ ?PRIVATE\\ KEY\\ ?.{0,20}-----", "g"),
    confidence: "high" as any,
    requirements: {"min_digits":4,"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "Base64-PEM-Encoded Private Key",
    id: "kingfisher.pem.2",
    regex: new RegExp("((?:LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0t|LS0tLS1CRUdJTiBEU0EgUFJJVkFURSBLRVktLS0t|LS0tLS1CRUdJTiBFQyBQUklWQVRFIEtFWS0tLS0t|LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t)[a-zA-Z0-9+/=]{50,})(?:[^a-zA-Z0-9+/=]|$)", "g"),
    confidence: "high" as any,
    requirements: {"min_digits":4,"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "Perplexity AI API Key",
    id: "kingfisher.perplexity.1",
    regex: new RegExp("\\b(pplx-[A-Za-z0-9]{48})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.8},
    has_checksum: false
  },
  {
    name: "PHPMailer Credentials",
    id: "kingfisher.phpmailer.1",
    regex: new RegExp("\\$mail->Host\\s*=\\s*'([^'\\n]{5,})';\\s*(?://.*)?(?:\\s*.*\\s*){0,3}\\$mail->Username\\s*=\\s*'([^'\\n]{5,})';\\s*(?://.*)?(?:\\s*.*\\s*){0,3}\\$mail->Password\\s*=\\s*'([^'\\n]{5,})';", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "PlanetScale API Token",
    id: "kingfisher.planetscale.1",
    regex: new RegExp("\\b(pscale_tkn_[a-z0-9-_]{43})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "PlanetScale Username",
    id: "kingfisher.planetscale.2",
    regex: new RegExp("(?:pscale|planetscale)(?:.|[\\n\\r]){0,16}?(?:USER|ID|NAME)(?:.|[\\n\\r]){0,16}?([a-z0-9]{12})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Postgres URL with hardcoded password",
    id: "kingfisher.postgres.1",
    regex: new RegExp("(?:postgres(?:ql)?|postgis):\\/\\/(?:[\\w]+):(?:[^\\@]+)@(?:[^:\\/]+):(?:\\d+)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "PostHog Project API Key",
    id: "kingfisher.posthog.1",
    regex: new RegExp("(phc_[a-zA-Z0-9_\\-]{43})", "g"),
    confidence: "high" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "PostHog Personal API Key",
    id: "kingfisher.posthog.2",
    regex: new RegExp("(phx_[a-zA-Z0-9_\\-]{47})", "g"),
    confidence: "high" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Postman API Key",
    id: "kingfisher.postman.1",
    regex: new RegExp("\\b(PMAK-[A-Z0-9]{24}-[A-Z0-9]{34})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Postmark API Token",
    id: "kingfisher.postmark.1",
    regex: new RegExp("postmark[a-z0-9_-]{0,20}.{0,10}\\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Prefect API Token",
    id: "kingfisher.prefect.1",
    regex: new RegExp("\\b(pnu_[a-z0-9]{36})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Contains encrypted RSA private key",
    id: "kingfisher.privkey.1",
    regex: new RegExp("(-----BEGIN\\s(?:RSA)\\sPRIVATE\\sKEY(\\sBLOCK)?-----)[\\r\\n]Proc-Type:.*?ENCRYPTED[\\r\\n]DEK-INFO.*?[\\r\\n][\\r\\n][a-z0-9/+=\\r\\n\\\\n]{32,}?-----END\\s(?:RSA)\\sPRIVATE\\sKEY(\\sBLOCK)?-----", "gims"),
    confidence: "high" as any,
    requirements: {"min_digits":2,"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "Contains Private Key",
    id: "kingfisher.privkey.2",
    regex: new RegExp("(-----BEGIN\\s(?:RSA|PGP|DSA|OPENSSH|ENCRYPTED|EC)?\\s{0,1}PRIVATE\\sKEY(\\sBLOCK)?-----[a-z0-9 /+=\\r\\n\\\\n]{32,}?-----END\\s(?:RSA|PGP|DSA|OPENSSH|ENCRYPTED|EC)?\\s{0,1}PRIVATE\\sKEY(\\sBLOCK)?-----)", "gims"),
    confidence: "high" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":4.5},
    has_checksum: false
  },
  {
    name: "Credentials in PsExec",
    id: "kingfisher.psexec.1",
    regex: new RegExp("psexec.{0,100}-u\\s*(\\S+)\\s+-p\\s*(\\S+)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "PubNub Publish Key",
    id: "kingfisher.pubnub.1",
    regex: new RegExp("\\b(pub-c-[a-z0-9]{8}(?:-[a-z0-9]{4}){3}-[a-z0-9]{12})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "PubNub Subscription Key",
    id: "kingfisher.pubnub.2",
    regex: new RegExp("\\b(sub-c-[a-z0-9]{8}(?:-[a-z0-9]{4}){3}-[a-z0-9]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Pulumi API Key",
    id: "kingfisher.pulumi.1",
    regex: new RegExp("\\b(pul-[a-f0-9]{40})\\b", "g"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "PyPI Upload Token",
    id: "kingfisher.pypi.1",
    regex: new RegExp("(pypi-AgEIcHlwaS5vcmc[A-Z0-9_-]{50,})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "RabbitMQ Credential",
    id: "kingfisher.rabbitmq.1",
    regex: new RegExp("(?:amqps?):\\/\\/[\\S]{3,50}:([\\S]{3,50})@[-.%\\w\\/:]+\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "React App Username",
    id: "kingfisher.reactapp.1",
    regex: new RegExp("\\bREACT_APP(?:_[A-Z0-9]+)*_USER(?:NAME)?\\s*=\\s*['\"]?([^\\s'\"$]{3,})(?:[\\s'\"$]|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "React App Password",
    id: "kingfisher.reactapp.2",
    regex: new RegExp("\\bREACT_APP(?:_[A-Z0-9]+)*_PASS(?:WORD)?\\s*=\\s*['\"]?([^\\s'\"$]{6,})(?:[\\s'\"$]|$)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "ReadMe API Key",
    id: "kingfisher.readme.1",
    regex: new RegExp("\\b(rdme_(?<RDMVAL>[a-z0-9]{70}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "reCAPTCHA API Key",
    id: "kingfisher.recaptcha.1",
    regex: new RegExp("recaptcha(?:.|[\\n\\r]){0,16}?\\b(6l[c-f][a-z0-9_-].{36})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":3,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Replicate API Token",
    id: "kingfisher.replicate.1",
    regex: new RegExp("\\b(r8_[A-Za-z0-9]{37})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":3,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "RubyGems API Key",
    id: "kingfisher.rubygems.1",
    regex: new RegExp("\\b(rubygems_[a-z0-9]{42,52})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Runway API Key",
    id: "kingfisher.runway.1",
    regex: new RegExp("\\b(key_[A-Fa-f0-9]{128})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Salesforce Access / Refresh Token",
    id: "kingfisher.salesforce.1",
    regex: new RegExp("\\b(00[A-Z0-9]{13}![A-Z0-9._-]{90,120})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":6,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Salesforce Instance URL",
    id: "kingfisher.salesforce.2",
    regex: new RegExp("\\b(?:https?://)?([0-9A-Z-]{5,128})\\.my\\.salesforce\\.com\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2.5},
    has_checksum: false
  },
  {
    name: "Salesforce Consumer Key",
    id: "kingfisher.salesforce.3",
    regex: new RegExp("\\bconsumerKey\\b(?:.|[\\n\\r]){0,32}?\\b([A-Za-z0-9+/=._-]{16,256})\\b", "gs"),
    confidence: "medium" as any,
    requirements: {"min_digits":3,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Salesforce Consumer Secret",
    id: "kingfisher.salesforce.4",
    regex: new RegExp("consumerSecret\\b(?:.|[\\n\\r]){0,32}?\\b([A-Za-z0-9+/=._-]{16,256})", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":6,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Salesforce Consumer Key and Secret",
    id: "kingfisher.salesforce.5",
    regex: new RegExp("(?:salesforce|sforce)(?:.|[\\n\\r]){0,256}?\\bconsumerKey\\b(?:.|[\\n\\r]){0,32}?\\b(?<CONSUMER_KEY>[A-Z0-9+/=._-]{16,256})\\b.*?(?:.|[\\n\\r]){0,256}?\\bconsumer\\s{0,8}secret\\b(?:.|[\\n\\r]){0,32}?\\b(?<CONSUMER_SECRET>[A-Za-z0-9+/=._-]{16,256})", "gis"),
    confidence: "medium" as any,
    requirements: {"min_digits":3,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Sauce Labs Username",
    id: "kingfisher.saucelabs.1",
    regex: new RegExp("\\bsauce(?:.|[\\n\\r]){0,16}?(?:USER|ID|NAME|CLIENT|OAUTH)(?:.|[\\n\\r]){0,16}?\\b([A-Z0-9_.-]{2,70})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":1},
    has_checksum: false
  },
  {
    name: "Sauce Labs API Endpoint",
    id: "kingfisher.saucelabs.2",
    regex: new RegExp("((?:api|ondemand)\\.(?:us|eu)-(?:west|east|central)-[0-9]\\.saucelabs\\.com)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Sauce Labs Access Key",
    id: "kingfisher.saucelabs.3",
    regex: new RegExp("\\bsauce(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":4,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Scale API Key",
    id: "kingfisher.scale.1",
    regex: new RegExp("\\b(live_[0-9a-f]{32})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.1},
    has_checksum: false
  },
  {
    name: "Scale Callback Auth Key",
    id: "kingfisher.scale.2",
    regex: new RegExp("\\b(live_auth_[0-9a-f]{32})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.1},
    has_checksum: false
  },
  {
    name: "Scalingo API Token",
    id: "kingfisher.scalingo.1",
    regex: new RegExp("\\b(tk-us-[\\w-]{48})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Segment Public API Token",
    id: "kingfisher.segment.1",
    regex: new RegExp("\\b(sgp_[A-Z0-9_-]{60,70})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Segment API Key",
    id: "kingfisher.segment.2",
    regex: new RegExp("(?:segment|sgmt)(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([A-Z0-9_-]{40,50}\\.[A-Z0-9_-]{40,50})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Sendbird Application ID",
    id: "kingfisher.sendbird.1",
    regex: new RegExp("sendbird(?:.|[\\\\n\\r]){0,32}?(?:APPLICATION|APP_ID|APP|CLIENT|ID)(?:.|[\\n\\r]){0,32}?\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Sendbird API Token",
    id: "kingfisher.sendbird.2",
    regex: new RegExp("sendbird(?:.|[\\\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Sendgrid API token",
    id: "kingfisher.sendgrid.1",
    regex: new RegExp("\\b(SG\\.[0-9A-Z_-]{20,24}\\.[0-9A-Z_-]{39,47})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Sendinblue API Token",
    id: "kingfisher.sendinblue.1",
    regex: new RegExp("\\b(xkeysib-[a-f0-9]{64}-[a-z0-9]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.2},
    has_checksum: false
  },
  {
    name: "Sentry Access Token",
    id: "kingfisher.sentry.1",
    regex: new RegExp("sentry(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-f0-9]{64})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Sentry Organization Token",
    id: "kingfisher.sentry.2",
    regex: new RegExp("(sntrys_eyJpYXQiO[a-zA-Z0-9+/]{10,200}(?:LCJyZWdpb25fdXJs|InJlZ2lvbl91cmwi|cmVnaW9uX3VybCI6)[a-zA-Z0-9+/]{10,200}={0,2}_[a-zA-Z0-9+/]{43})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4.2},
    has_checksum: false
  },
  {
    name: "Sentry User Token",
    id: "kingfisher.sentry.3",
    regex: new RegExp("(sntryu_[a-f0-9]{64})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Shippo API Token",
    id: "kingfisher.shippo.1",
    regex: new RegExp("\\b(shippo_(?:live|test)_[a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "SHODAN API Key",
    id: "kingfisher.shodan.1",
    regex: new RegExp("\\bshodan(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{32})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Shopify access token",
    id: "kingfisher.shopify.1",
    regex: new RegExp("\\b((?:shpat|shpca|shppa|shpss)_[a-f0-9]{30,34})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Shopify Domain",
    id: "kingfisher.shopify.2",
    regex: new RegExp("([a-z0-9-]+\\.myshopify\\.com)", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Slack App Token",
    id: "kingfisher.slack.1",
    regex: new RegExp("(?:.{0,24}[=:]\\s{0,8})?(xapp-[0-9]{1,3}-[0-9a-z]{10,15}-[0-9a-z]{10,15}-[0-9a-z]{10,66})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Slack Token",
    id: "kingfisher.slack.2",
    regex: new RegExp("\\b(xox[pbarose][-0-9]{0,3}-[0-9a-z]{6,15}-[0-9a-z]{6,15}-[-0-9a-z]{6,66})\\b|(xoxe\\.xox[bparose]-\\d-[A-Z0-9]{155,170})\\b|(xoxe-\\d-[A-Z0-9]{140,150})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Slack Webhook",
    id: "kingfisher.slack.4",
    regex: new RegExp("\\b(https://hooks\\.slack\\.com/services/T[a-z0-9_-]{8,12}/B[a-z0-9_-]{8,12}/[a-z0-9_-]{20,30})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Snyk API Key",
    id: "kingfisher.snyk.1",
    regex: new RegExp("\\bsnyk(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([A-Z0-9]{8}-(?:[A-Z0-9]{4}-){3}[A-Z0-9]{12})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "SonarCloud API Token",
    id: "kingfisher.sonarcloud.1",
    regex: new RegExp("\\bsonar(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([0-9a-z]{40})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":2.5},
    has_checksum: false
  },
  {
    name: "SonarQube API Key",
    id: "kingfisher.sonarqube.1",
    regex: new RegExp("\\b((?:sq[pua])_[a-z0-9]{40})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "SonarQube Host",
    id: "kingfisher.sonarqube.2",
    regex: new RegExp("sonar.{0,8}host(?:.|[\\n\\r]){0,64}?(https?://.*?:\\d{2,6})", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "SonarQube Token",
    id: "kingfisher.sonarqube.3",
    regex: new RegExp("sonar.{0,5}login.{0,5}\\s*\\b([a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Sourcegraph Access Token",
    id: "kingfisher.sourcegraph.1",
    regex: new RegExp("\\b(sgp_(?:[a-f0-9]{16}_local_)?[a-f0-9]{40})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Sourcegraph _Legacy_ API Key",
    id: "kingfisher.sourcegraph.2",
    regex: new RegExp("\\bsourcegraph(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?((?:sgp_(?:[a-f0-9]{16}_local_)?[a-f0-9]{40}|[a-f0-9]{40}))\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Sourcegraph Cody Gateway Key",
    id: "kingfisher.sourcegraph.3",
    regex: new RegExp("\\bslk_[a-f0-9]{64}\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Square Access Token",
    id: "kingfisher.square.1",
    regex: new RegExp("\\bsquare(?:.|[\\n\\r]){0,16}?\\b(EAAA[a-z0-9\\-\\+=]{60})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Square Access Token",
    id: "kingfisher.square.2",
    regex: new RegExp("\\b(sq0atp-[a-z0-9_-]{22})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Square OAuth Secret",
    id: "kingfisher.square.3",
    regex: new RegExp("\\b(sq0csp-[a-z0-9_-]{43})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Stability AI API Key",
    id: "kingfisher.stabilityai.1",
    regex: new RegExp("\\b(sk-[A-Za-z0-9]{48})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "StackHawk API Key",
    id: "kingfisher.stackhawk.1",
    regex: new RegExp("\\b(hawk\\.[0-9A-Z_-]{20}\\.[0-9A-Z_-]{20})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Stripe Publishable Key",
    id: "kingfisher.stripe.1",
    regex: new RegExp("(?:stripe|strp)(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?(pk_live_(?:[0-9A-Z]{6}){4,30})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Stripe Secret / Restricted Key",
    id: "kingfisher.stripe.2",
    regex: new RegExp("(?:stripe|strp)(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?((?:sk|rk)_live_(?:[0-9A-Z]{8}){3,25})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Supabase Management Token",
    id: "kingfisher.supabase.1",
    regex: new RegExp("(sbp_[a-z0-9_-]{40})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Supabase Project API Key",
    id: "kingfisher.supabase.2",
    regex: new RegExp("(sb_secret_[a-z0-9_-]{31})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Supabase Project URL",
    id: "kingfisher.supabase.3",
    regex: new RegExp("\\b(https:\\/\\/[a-z0-9]{16,32}\\.supabase\\.co)\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Tailscale API Key",
    id: "kingfisher.tailscale.1",
    regex: new RegExp("\\b(tskey-[a-z]{3,10}-[A-Z0-9_-]{20,36})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Tavily API Key",
    id: "kingfisher.tavily.1",
    regex: new RegExp("\\b(tvly-[a-zA-Z0-9]{32})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "TeamCity API Token",
    id: "kingfisher.teamcity.1",
    regex: new RegExp("\\b(eyJ0eXAiOiAiVENWMiJ9\\.[A-Za-z0-9_-]{36}\\.[A-Za-z0-9_-]{48})", "g"),
    confidence: "low" as any,
    requirements: {"min_digits":2},
    has_checksum: false
  },
  {
    name: "Telegram Bot Token",
    id: "kingfisher.telegram.1",
    regex: new RegExp("\\b(?:telegram|tgram:)(?:.|[\\n\\r]){0,32}?([0-9]{7,10}:[A-Z0-9_-]{35})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "ThingsBoard Access Token",
    id: "kingfisher.thingsboard.1",
    regex: new RegExp("\\bthingsboard\\.cloud/api/v1/([a-z0-9]{20})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "ThingsBoard Provision Device Key",
    id: "kingfisher.thingsboard.2",
    regex: new RegExp("\"provisionDeviceKey\"\\s*:\\s*\"([a-z0-9]{20})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "ThingsBoard Provision Device Secret",
    id: "kingfisher.thingsboard.3",
    regex: new RegExp("\"provisionDeviceSecret\"\\s*:\\s*\"([a-z0-9]{20})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Together.ai API Key",
    id: "kingfisher.together.1",
    regex: new RegExp("\\b(tgp_v1_[A-Z0-9_-]{43})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Travis CI Token",
    id: "kingfisher.travisci.1",
    regex: new RegExp("\\btravis(?:.|[\\\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,16}?\\b([A-Z-_0-9]{22})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Travis CI Encrypted Variable",
    id: "kingfisher.travisci.2",
    regex: new RegExp("(?:language|env|deploy|script):[\\r\\n](?:.|[\\\\n\\r]){0,256}?(secure:\\s*\"?[A-Za-z0-9+/=\\\\]+\"?\\s*)\\b", "gis"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3},
    has_checksum: false
  },
  {
    name: "TrueNAS API Key (WebSocket)",
    id: "kingfisher.truenas.1",
    regex: new RegExp("\"params\"\\s*:\\s*\\[\\s*\"(\\d+-[a-zA-Z0-9]{64})\"\\s*\\]", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "TrueNAS API Key (REST API)",
    id: "kingfisher.truenas.2",
    regex: new RegExp("Bearer\\s*(\\d+-[a-zA-Z0-9]{64})\\b", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "Twilio API ID",
    id: "kingfisher.twilio.1",
    regex: new RegExp("\\b((?:SK|AC)[A-F0-9]{32})\\b", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Twilio API Key",
    id: "kingfisher.twilio.2",
    regex: new RegExp("\\btwilio(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{32})", "gi"),
    confidence: "low" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3},
    has_checksum: false
  },
  {
    name: "Twitch API Token",
    id: "kingfisher.twitch.1",
    regex: new RegExp("twitch(?:.|[\\n\\r]){0,32}?\\b([a-z0-9]{30})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "X / Twitter Bearer Token (App-only)",
    id: "kingfisher.twitter.1",
    regex: new RegExp("\\b(?:twitter|x.com|twtr)?(?:.|[\\n\\r]){0,16}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN|BEARER)(?:.|[\\n\\r]){0,16}?\\b(A{10,}[A-Za-z0-9_\\-]{40,200})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_lowercase":1,"min_uppercase":1,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Twitter Consumer Key",
    id: "kingfisher.twitter.2",
    regex: new RegExp("\\btwitter(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([A-Z0-9]{25})", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "X / Twitter Consumer Secret",
    id: "kingfisher.twitter.3",
    regex: new RegExp("\\btwitter(?:.|[\\n\\r]){0,32}?(?:SECRET|PRIVATE|ACCESS|KEY|TOKEN)(?:.|[\\n\\r]){0,32}?([A-Z0-9]{50})", "gi"),
    confidence: "low" as any,
    requirements: {"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Typeform API Token",
    id: "kingfisher.typeform.1",
    regex: new RegExp("\\btypeform(?:.|[\\n\\r]){0,32}?(tfp_[a-z0-9_\\-=\\.]{59})", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "URI with Username and Secret",
    id: "kingfisher.uri.1",
    regex: new RegExp("((?:https?)://[A-Za-z](?:[A-Za-z0-9+\\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})*:(?:[A-Za-z0-9\\-._~!$&'()*+,;=]|%[0-9A-Fa-f]{2})+@(?:[A-Za-z0-9\\-._~%]+|\\[[A-Fa-f0-9:.]+\\]|\\[v[A-Fa-f0-9][A-Za-z0-9\\-._~%!$&'()*,;=:]+\\])(:?[0-9]+)?(?:/[A-Za-z0-9\\-._~%!$&'()*,;=:@%]*)*/?(?:\\?[A-Za-z0-9\\-._~%!$&'()*,;=:@/?%]*)?(?:\\#[A-Za-z0-9\\-._~%!$&'()*,;=:@/?%]*)?)", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Vercel API Token",
    id: "kingfisher.vercel.1",
    regex: new RegExp("\\bvercel(?:.|[\\n\\r]){0,32}?\\b([A-Z0-9]{24})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":6,"min_lowercase":1,"min_uppercase":1,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "Credentials in Connect-VIServer Invocation",
    id: "kingfisher.vmware.1",
    regex: new RegExp("Connect-VIServer.{0,50}-User\\s+(\\S{3,30})\\s+.{0,50}-Password\\s+(\\S{3,30})", "gi"),
    confidence: "low" as any,
    requirements: {},
    has_checksum: false
  },
  {
    name: "Voyage AI API Key",
    id: "kingfisher.voyageai.api_key",
    regex: new RegExp("(pa-[a-zA-Z0-9\\-_]{43})\\b", "g"),
    confidence: "high" as any,
    requirements: {"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Weights and Biases API Key",
    id: "kingfisher.wandb.1",
    regex: new RegExp("(?:wandb|weightsandbiases)(?:.|[\\n\\r]){0,16}?\\b([a-f0-9]{40})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.5},
    has_checksum: false
  },
  {
    name: "WireGuard Private Key",
    id: "kingfisher.wireguard.1",
    regex: new RegExp("PrivateKey\\s*=\\s*([A-Za-z0-9+/]{43}=)", "g"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "WireGuard Preshared Key",
    id: "kingfisher.wireguard.2",
    regex: new RegExp("PresharedKey\\s*=\\s*([A-Za-z0-9+/]{43}=)", "g"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: false
  },
  {
    name: "xAI (Grok) API Key",
    id: "kingfisher.xai.1",
    regex: new RegExp("\\b(xai-[A-Za-z0-9_-]{70,120})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":3.8},
    has_checksum: false
  },
  {
    name: "YouTube API Key",
    id: "kingfisher.youtube.1",
    regex: new RegExp("\\b(AIza[a-zA-Z0-9_\\-\\\\]{35})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":2},
    has_checksum: false
  },
  {
    name: "Zhipu (BigModel) API Key",
    id: "kingfisher.zhipu.1",
    regex: new RegExp("\\b([A-F0-9]{32}\\.[A-Z0-9]{16})\\b", "gi"),
    confidence: "medium" as any,
    requirements: {"min_digits":2,"min_entropy":4},
    has_checksum: false
  },
  {
    name: "Zuplo API Key",
    id: "kingfisher.zuplo.1",
    regex: new RegExp("\\b(zpka_(?<body>[a-z0-9]{32})_(?<checksum>[0-9a-f]{8}))", "gi"),
    confidence: "medium" as any,
    requirements: {"min_entropy":3.3},
    has_checksum: true
  }
];

export const GENERATED_RULES_META = {
  totalRules: 371,
  skippedRules: 0,
  skipped: []
};
