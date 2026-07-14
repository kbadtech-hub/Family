const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'components', 'dashboard', 'MatchDetailView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Restore original hook definitions
content = content.replace("const t = useTranslations('Dashboard.matchDetail');", "const tMatch = useTranslations('Dashboard.matchDetail');");

// Replace all t() calls that refer to matchDetail with tMatch()
content = content.replace(/t\('reportSuccess'\)/g, "tMatch('reportSuccess')");
content = content.replace(/t\('blockSuccess'\)/g, "tMatch('blockSuccess')");
content = content.replace(/t\('blockConfirm'\)/g, "tMatch('blockConfirm')");
content = content.replace(/t\('compatibility'\)/g, "tMatch('compatibility')");
content = content.replace(/t\('profileCompletion'\)/g, "tMatch('profileCompletion')");
content = content.replace(/t\('mediatorApprovalNote'\)/g, "tMatch('mediatorApprovalNote')");
content = content.replace(/t\('compatibilityBreakdown'\)/g, "tMatch('compatibilityBreakdown')");
content = content.replace(/t\('sharedHobbies'\)/g, "tMatch('sharedHobbies')");
content = content.replace(/t\('familyValues'\)/g, "tMatch('familyValues')");
content = content.replace(/t\('conflictStyle'\)/g, "tMatch('conflictStyle')");
content = content.replace(/t\('conversationStarters'\)/g, "tMatch('conversationStarters')");
content = content.replace(/t\('contactInfo'\)/g, "tMatch('contactInfo')");
content = content.replace(/t\("privacyShieldEnabled"\)/g, 'tMatch("privacyShieldEnabled")');
content = content.replace(/t\('reportUser'\)/g, "tMatch('reportUser')");
content = content.replace(/t\('blockUser'\)/g, "tMatch('blockUser')");
content = content.replace(/t\('zodiacPrompt'/g, "tMatch('zodiacPrompt'");
content = content.replace(/t\('familyValuesPrompt'/g, "tMatch('familyValuesPrompt'");

fs.writeFileSync(filePath, content, 'utf8');
console.log("MatchDetailView hook fixed successfully!");
