const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Register user
  const registerOut = execSync('curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d \'{\"name\":\"TestUser\",\"email\":\"testuser@test.com\",\"password\":\"password123\"}\'', { encoding: 'utf8' });
  const registerResp = JSON.parse(registerOut);
  const token = registerResp.token;
  
  // Create project
  const projectOut = execSync(`curl -s -X POST http://localhost:3000/api/projects -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{\"name\":\"TestProject\",\"clientName\":\"TestClient\",\"totalAllowedRevisions\":3}'`, { encoding: 'utf8' });
  const projectResp = JSON.parse(projectOut);
  const projectId = projectResp.project.id;
  
  // Create corrupt PDF
  fs.writeFileSync('corrupt.pdf', '%PDF-1.4\nCorrupt content');
  
  // Upload corrupt PDF
  const uploadOut = execSync(`curl -s -X POST http://localhost:3000/api/projects/${projectId}/documents -H "Authorization: Bearer ${token}" -F \"file=@corrupt.pdf\"`, { encoding: 'utf8' });
  const uploadResp = JSON.parse(uploadOut);
  console.log('Upload status:', uploadOut.includes('201') ? '201 OK' : 'NOT 201');
  console.log('Upload response:', JSON.stringify(uploadResp, null, 2));
  
  // Wait a bit for processing
  setTimeout(() => {
    const listOut = execSync(`curl -s -X GET http://localhost:3000/api/projects/${projectId}/documents -H "Authorization: Bearer ${token}"`, { encoding: 'utf8' });
    const listResp = JSON.parse(listOut);
    console.log('\nList status:', listOut.includes('200') ? '200 OK' : 'NOT 200');
    console.log('List response:', JSON.stringify(listResp, null, 2));
    if (listResp.documents && listResp.documents.length > 0) {
      const doc = listResp.documents[0];
      console.log(`\nDocument ${doc.id} extractionStatus:`, doc.extractionStatus);
      if (doc.extractionStatus === 'failed') {
        console.log('✓ Scenario f PASS: Corrupt PDF resulted in extractionStatus=\'failed\'');
      } else {
        console.log('✗ Scenario f FAIL: Expected extractionStatus=\'failed\' but got:', doc.extractionStatus);
      }
    }
    fs.unlinkSync('corrupt.pdf');
  }, 3000);
} catch (err) {
  console.error('Error:', err.message);
}
